import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken, AuthRequest } from "./src/middlewares/authMiddleware";
import { requestLogger, globalErrorHandler } from "./src/middlewares/errorHandler";
import { logger } from "./src/utils/logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(requestLogger);

  // --- Utility: Get Default User for MVP ---
  async function getDefaultUser() {
    let user = await prisma.user.findFirst();
    if (!user) {
      const hashedPassword = await bcrypt.hash("123456", 10);
      user = await prisma.user.create({
        data: {
          name: "Admin",
          email: "admin@warung.com",
          password_hash: hashedPassword,
        }
      });
    }
    return user;
  }

  // --- Auth API ---
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check for 'dummy_hash' fallback mapping for backwards compatibility during testing
      // (in case the seed script created an unhashed password)
      const isMatch = await bcrypt.compare(password, user.password_hash) || (password === '123456' && (user.password_hash === '123456' || user.password_hash === 'dummy_hash'));

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        process.env.JWT_SECRET || "warung_super_secret_key_2026",
        { expiresIn: "7d" }
      );

      logger.success("User logged in", { email: user.email });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err: any) {
      logger.error("Login failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // --- Helper: Get Setting (key-value) ---
  async function getSetting(key: string, defaultValue: string): Promise<string> {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row?.value ?? defaultValue;
  }

  // --- Settings API (Phase 9.2 - Generic Key-Value) ---
  app.get("/api/settings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const settings = await prisma.setting.findMany();
      const result: Record<string, string> = {};
      for (const s of settings) {
        result[s.key] = s.value;
      }
      res.json(result);
    } catch (err: any) {
      logger.error("GET /api/settings failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/settings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updates: Record<string, string> = req.body;

      for (const [key, value] of Object.entries(updates)) {
        await prisma.setting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) }
        });
      }
      res.json({ success: true });
    } catch (err: any) {
      logger.error("PUT /api/settings failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // --- API Routes ---

  // Products
  app.get("/api/products", authenticateToken, async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        where: { is_active: true },
        orderBy: { name: "asc" }
      });
      res.json(products);
    } catch (err: any) {
      logger.error("GET /api/products failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    try {
      const { name, category, purchase_price, selling_price, stock, unit } = req.body;

      // Basic validation Phase 4.1
      if (!name) return res.status(400).json({ error: "Nama produk wajib diisi" });
      if (purchase_price < 0 || selling_price <= 0) return res.status(400).json({ error: "Harga harus lebih besar dari 0" });
      if (stock < 0) return res.status(400).json({ error: "Stok tidak boleh kurang dari 0" });

      const product = await prisma.$transaction(async (txPrisma) => {
        const newProduct = await txPrisma.product.create({
          data: {
            name,
            category,
            purchase_price,
            selling_price,
            stock,
            unit,
          }
        });

        if (stock > 0) {
          await txPrisma.stockLog.create({
            data: {
              product_id: newProduct.id,
              change_type: "initial_stock",
              qty: stock,
              stock_before: 0,
              stock_after: stock
            }
          });
        }

        return newProduct;
      });
      logger.success("Product created", { id: product.id, name: req.body.name });
      res.json({ id: product.id });
    } catch (err: any) {
      logger.error("POST /api/products failed", { error: err.message, body: req.body });
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const { name, category, purchase_price, selling_price, stock, unit } = req.body;

      // Basic validation Phase 4.1
      if (!name) return res.status(400).json({ error: "Nama produk wajib diisi" });
      if (purchase_price < 0 || selling_price <= 0) return res.status(400).json({ error: "Harga harus lebih besar dari 0" });
      if (stock < 0) return res.status(400).json({ error: "Stok tidak boleh kurang dari 0" });

      const productId = req.params.id;

      await prisma.$transaction(async (txPrisma) => {
        const existingProduct = await txPrisma.product.findUnique({ where: { id: productId } });
        if (!existingProduct) throw new Error("Product not found");

        await txPrisma.product.update({
          where: { id: productId },
          data: { name, category, purchase_price, selling_price, stock, unit }
        });

        if (existingProduct.stock !== stock) {
          await txPrisma.stockLog.create({
            data: {
              product_id: productId,
              change_type: "update_product",
              qty: Math.abs(stock - existingProduct.stock),
              stock_before: existingProduct.stock,
              stock_after: stock
            }
          });
        }
      });
      logger.success("Product updated", { id: productId, name });
      res.json({ success: true });
    } catch (err: any) {
      logger.error("PUT /api/products/:id failed", { id: req.params.id, error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      // Check if product is used in transactions
      const count = await prisma.transactionItem.count({
        where: { product_id: req.params.id }
      });

      if (count > 0) {
        // Soft delete if used: Return error as per PRD.md ("tolak jika ada transaksi" ? Actually logic was already soft delete, let's update it based on task list: "tolak jika ada transaksi" or soft delete? Task List says: soft delete (is_active = false, tolak jika ada transaksi) - if it says both, maybe it means just soft delete or reject the delete. Let's soft delete.)
        await prisma.product.update({
          where: { id: req.params.id },
          data: { is_active: false }
        });
      } else {
        // Hard delete if never used
        await prisma.product.delete({
          where: { id: req.params.id }
        });
      }
      logger.success("Product deleted", { id: req.params.id, soft: count > 0 });
      res.json({ success: true });
    } catch (err: any) {
      logger.error("DELETE /api/products/:id failed", { id: req.params.id, error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // Transactions
  app.post("/api/transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { items } = req.body;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const tx = await prisma.$transaction(async (txPrisma) => {
        // Prepare items with names and calculate server-side totals
        const preparedItems = [];
        let calculatedTotal = 0;

        for (const item of items) {
          const product = await txPrisma.product.findUnique({ where: { id: item.product_id } });
          if (!product) throw new Error("Product not found");
          if (product.stock < item.qty) {
            throw new Error(`Stok tidak cukup untuk ${product.name}`);
          }

          const subtotal = Number(product.selling_price) * Number(item.qty);
          calculatedTotal += subtotal;

          preparedItems.push({
            product_id: item.product_id,
            qty: Number(item.qty),
            price: Number(product.selling_price),
            subtotal: subtotal,
            product_name: product.name,
          });

          // Update stock and log
          const newStock = product.stock - item.qty;
          await txPrisma.product.update({
            where: { id: product.id },
            data: { stock: newStock }
          });

          await txPrisma.stockLog.create({
            data: {
              product_id: product.id,
              change_type: "sale",
              qty: item.qty,
              stock_before: product.stock,
              stock_after: newStock
            }
          });
        }

        const newTx = await txPrisma.transaction.create({
          data: {
            total_amount: calculatedTotal,
            created_by: userId,
            items: {
              create: preparedItems
            }
          }
        });

        return newTx;
      });

      logger.success("Transaction created", { id: tx.id, items: items.length });
      res.json({ id: tx.id });
    } catch (err: any) {
      logger.error("POST /api/transactions failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const { date } = req.query; // YYYY-MM-DD

      let dateFilter = {};

      if (date) {
        const startDate = new Date(`${date}T00:00:00.000Z`);
        const endDate = new Date(`${date}T23:59:59.999Z`);
        dateFilter = {
          transaction_date: {
            gte: startDate,
            lte: endDate
          }
        };
      }

      const transactions = await prisma.transaction.findMany({
        where: dateFilter,
        orderBy: { transaction_date: "desc" },
        include: { items: true }
      });
      res.json(transactions);
    } catch (err: any) {
      logger.error("GET /api/transactions failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/transactions/:id", authenticateToken, async (req, res) => {
    try {
      const tx = await prisma.transaction.findUnique({
        where: { id: req.params.id },
        include: { items: true }
      });
      if (!tx) return res.status(404).json({ error: "Not found" });
      res.json(tx);
    } catch (err: any) {
      logger.error("GET /api/transactions/:id failed", { id: req.params.id, error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/transactions/:id", authenticateToken, async (req, res) => {
    try {
      const txId = req.params.id;

      await prisma.$transaction(async (txPrisma) => {
        const tx = await txPrisma.transaction.findUnique({
          where: { id: txId },
          include: { items: true }
        });

        if (!tx) throw new Error("Transaction not found");

        // Restore stock
        for (const item of tx.items) {
          const product = await txPrisma.product.findUnique({ where: { id: item.product_id } });
          if (product) {
            const newStock = product.stock + item.qty;
            await txPrisma.product.update({
              where: { id: item.product_id },
              data: { stock: newStock }
            });

            await txPrisma.stockLog.create({
              data: {
                product_id: product.id,
                change_type: "delete_sale_restore",
                qty: item.qty,
                stock_before: product.stock,
                stock_after: newStock
              }
            });
          }
        }

        await txPrisma.transactionItem.deleteMany({ where: { transaction_id: txId } });
        await txPrisma.transaction.delete({ where: { id: txId } });
      });

      logger.success("Transaction deleted & stock restored", { id: txId });
      res.json({ success: true });
    } catch (err: any) {
      logger.error("DELETE /api/transactions/:id failed", { id: req.params.id, error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // Stock Management
  app.get("/api/stocks/history", authenticateToken, async (req, res) => {
    try {
      const logs = await prisma.stockLog.findMany({
        include: { product: true },
        orderBy: { created_at: "desc" }
      });
      res.json(logs);
    } catch (err: any) {
      logger.error("GET /api/stocks/history failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/stocks/adjust", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { product_id, diff, reason } = req.body; // diff can be + or -
      if (!product_id || typeof diff !== 'number') {
        return res.status(400).json({ error: "Invalid adjustment request" });
      }

      await prisma.$transaction(async (txPrisma) => {
        const product = await txPrisma.product.findUnique({ where: { id: product_id } });
        if (!product) throw new Error("Product not found");

        const newStock = product.stock + diff;
        if (newStock < 0) throw new Error("Stok tidak bisa negatif");

        await txPrisma.product.update({
          where: { id: product_id },
          data: { stock: newStock }
        });

        await txPrisma.stockLog.create({
          data: {
            product_id,
            change_type: reason || "manual",
            qty: Math.abs(diff),
            stock_before: product.stock,
            stock_after: newStock
          }
        });
      });

      logger.success("Stock adjusted", { product_id, diff, reason });
      res.json({ success: true });
    } catch (err: any) {
      logger.error("POST /api/stocks/adjust failed", { product_id: req.body?.product_id, error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/stocks/low", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const threshold = parseInt(await getSetting("low_stock_threshold", "5"));

      const products = await prisma.product.findMany({
        where: { stock: { lte: threshold }, is_active: true },
        orderBy: { stock: "asc" }
      });
      res.json(products);
    } catch (err: any) {
      logger.error("GET /api/stocks/low failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // Dashboard & Reports
  app.get("/api/dashboard", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const threshold = parseInt(await getSetting("low_stock_threshold", "5"));

      const todayString = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const startDate = new Date(`${todayString}T00:00:00.000Z`);
      const endDate = new Date(`${todayString}T23:59:59.999Z`);

      // Calculate today stats
      const todayAggregate = await prisma.transaction.aggregate({
        _sum: { total_amount: true },
        _count: { id: true },
        where: {
          transaction_date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const todayTotal = todayAggregate._sum.total_amount || 0;
      const todayCount = todayAggregate._count.id || 0;

      const lowStock = await prisma.product.findMany({
        where: { stock: { lte: threshold }, is_active: true },
        orderBy: { stock: "asc" },
        take: 5
      });

      // Getting top products for today
      // Using queryRaw since Prisma aggregation doesn't easily JOIN and GROUP BY relation correctly
      const topProducts: any[] = await prisma.$queryRaw`
        SELECT p.name, SUM(ti.qty) as total_qty
        FROM TransactionItem ti
        JOIN Product p ON ti.product_id = p.id
        JOIN Transaction t ON ti.transaction_id = t.id
        WHERE t.transaction_date >= ${startDate} AND t.transaction_date <= ${endDate}
        GROUP BY p.name
        ORDER BY total_qty DESC
        LIMIT 5
      `;

      res.json({
        today_total: Number(todayTotal),
        today_count: todayCount,
        low_stock: lowStock,
        top_products: topProducts.map(tp => ({
          name: tp.name,
          total_qty: Number(tp.total_qty)
        }))
      });
    } catch (err: any) {
      logger.error("GET /api/dashboard failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/reports", authenticateToken, async (req, res) => {
    try {
      const { month } = req.query; // YYYY-MM
      if (!month) return res.status(400).json({ error: "Month is required" });

      const startDate = new Date(`${month}-01T00:00:00.000Z`);
      const nextMonthDate = new Date(startDate);
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

      const monthlyAggregate = await prisma.transaction.aggregate({
        _sum: { total_amount: true },
        _count: { id: true },
        where: {
          transaction_date: {
            gte: startDate,
            lt: nextMonthDate
          }
        }
      });

      const totalRevenue = monthlyAggregate._sum.total_amount || 0;
      const totalTransactions = monthlyAggregate._count.id || 0;

      // Profit and top products using raw query
      const profitData: any[] = await prisma.$queryRaw`
        SELECT SUM((ti.price - p.purchase_price) * ti.qty) as profit
        FROM TransactionItem ti
        JOIN Product p ON ti.product_id = p.id
        JOIN Transaction t ON ti.transaction_id = t.id
        WHERE t.transaction_date >= ${startDate} AND t.transaction_date < ${nextMonthDate}
      `;

      const topProducts: any[] = await prisma.$queryRaw`
        SELECT p.name, SUM(ti.qty) as total_qty, SUM(ti.subtotal) as total_revenue
        FROM TransactionItem ti
        JOIN Product p ON ti.product_id = p.id
        JOIN Transaction t ON ti.transaction_id = t.id
        WHERE t.transaction_date >= ${startDate} AND t.transaction_date < ${nextMonthDate}
        GROUP BY p.name
        ORDER BY total_qty DESC
        LIMIT 10
      `;

      res.json({
        total_revenue: Number(totalRevenue),
        total_transactions: totalTransactions,
        total_profit: profitData.length ? Number(profitData[0].profit) : 0,
        top_products: topProducts.map(tp => ({
          name: tp.name,
          total_qty: Number(tp.total_qty),
          total_revenue: Number(tp.total_revenue)
        }))
      });
    } catch (err: any) {
      logger.error("GET /api/reports failed", { month: req.query.month, error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  // Global Error Handler (must be after all routes, before Vite)
  app.use(globalErrorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
