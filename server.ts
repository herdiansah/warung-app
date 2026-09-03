import "dotenv/config";
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
import { CheckoutValidationError, validateCheckoutItems } from "./src/domain/transaction";
import { z } from "zod";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().nullable().optional(),
  purchase_price: z.coerce.number().min(0, "Purchase price must be positive"),
  selling_price: z.coerce.number().min(0, "Selling price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  is_active: z.boolean().optional(),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be configured and be at least 32 characters long");
  }

  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const HOST = process.env.HOST || "127.0.0.1";

  app.use(express.json({ limit: "100kb" }));
  app.use(requestLogger);

  // --- Auth API ---
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
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
      const parsed = productSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }
      const { name, category, purchase_price, selling_price, stock, unit } = parsed.data;

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
      const parsed = productSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }
      const { name, category, purchase_price, selling_price, stock, unit, is_active } = parsed.data;

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
      const items = validateCheckoutItems(req.body?.items);
      const idempotency_key = req.body?.idempotency_key;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      if (idempotency_key) {
        const existingTx = await prisma.transaction.findUnique({
          where: { idempotency_key },
          include: { items: true }
        });
        if (existingTx) {
          // If already processed, just return success
          return res.status(200).json(existingTx);
        }
      }

      const tx = await prisma.$transaction(async (txPrisma) => {
        // Prepare items with names and calculate server-side totals
        const preparedItems = [];
        let calculatedTotal = 0;

        for (const item of items) {
          // Decrement stock conditionally (Atomic update)
          const updateResult = await txPrisma.product.updateMany({
            where: {
              id: item.product_id,
              stock: { gte: item.qty },
              is_active: true
            },
            data: {
              stock: { decrement: item.qty }
            }
          });

          if (updateResult.count === 0) {
            const product = await txPrisma.product.findUnique({ where: { id: item.product_id } });
            if (!product || !product.is_active) {
              throw new CheckoutValidationError(`Produk dengan ID ${item.product_id} tidak ditemukan atau tidak aktif`);
            }
            throw new CheckoutValidationError(`Stok tidak cukup untuk ${product.name}`);
          }

          // Fetch the updated product for price/cost details
          const product = await txPrisma.product.findUnique({ where: { id: item.product_id } });
          if (!product) throw new CheckoutValidationError("Product not found");

          const subtotal = Number(product.selling_price) * Number(item.qty);
          calculatedTotal += subtotal;

          preparedItems.push({
            product_id: item.product_id,
            qty: item.qty,
            price: Number(product.selling_price),
            unit_cost: Number(product.purchase_price),
            subtotal,
            product_name: product.name,
          });

          await txPrisma.stockLog.create({
            data: {
              product_id: product.id,
              change_type: "sale",
              qty: -item.qty, // Express as negative for out
              stock_before: product.stock + item.qty,
              stock_after: product.stock,
              actor: userId,
              reason: "Sales Checkout"
            }
          });
        }

        const newTx = await txPrisma.transaction.create({
          data: {
            idempotency_key,
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
      const status = err instanceof CheckoutValidationError || err.message?.includes("Stok tidak cukup") || err.message === "Product not found" ? 400 : 500;
      res.status(status).json({ error: err.message });
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

  const TIMEZONE = "Asia/Jakarta";

  app.get("/api/reports/daily", authenticateToken, async (req, res) => {
    try {
      const { date } = req.query; // YYYY-MM-DD
      if (typeof date !== "string" || !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date)) {
        return res.status(400).json({ error: "date must use YYYY-MM-DD format" });
      }

      // Convert local date string to TZ-aware start/end in UTC for Prisma
      const localDate = new Date(`${date}T00:00:00`);
      const tzDate = toZonedTime(localDate, TIMEZONE);
      const startDate = startOfDay(tzDate);
      const endDate = endOfDay(tzDate);

      const transactions = await prisma.transaction.findMany({
        where: {
          transaction_date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: { items: true }
      });

      const totalSales = transactions.reduce((acc, tx) => acc + Number(tx.total_amount), 0);
      const totalTransactions = transactions.length;
      
      let totalProfit = 0;
      for (const tx of transactions) {
        for (const item of tx.items) {
          totalProfit += (Number(item.price) - Number(item.unit_cost)) * item.qty;
        }
      }

      res.json({
        date,
        totalSales,
        totalProfit,
        totalTransactions
      });
    } catch (err: any) {
      logger.error("GET /api/reports/daily failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/reports/monthly", authenticateToken, async (req, res) => {
    try {
      const { month } = req.query; // YYYY-MM
      if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return res.status(400).json({ error: "month must use YYYY-MM format" });
      }

      const localDate = new Date(`${month}-01T00:00:00`);
      const tzDate = toZonedTime(localDate, TIMEZONE);

      const startDate = startOfMonth(tzDate);
      const endDate = endOfMonth(tzDate);

      const monthlyAggregate = await prisma.transaction.aggregate({
        _sum: { total_amount: true },
        _count: { id: true },
        where: {
          transaction_date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalRevenue = monthlyAggregate._sum.total_amount || 0;
      const totalTransactions = monthlyAggregate._count.id || 0;

      // Profit and top products using raw query
      const profitData: any[] = await prisma.$queryRaw`
        SELECT SUM((ti.price - ti.unit_cost) * ti.qty) as profit
        FROM TransactionItem ti
        JOIN Transaction t ON ti.transaction_id = t.id
        WHERE t.transaction_date >= ${startDate} AND t.transaction_date <= ${endDate}
      `;

      const topProducts: any[] = await prisma.$queryRaw`
        SELECT p.name, SUM(ti.qty) as total_qty, SUM(ti.subtotal) as total_revenue
        FROM TransactionItem ti
        JOIN Product p ON ti.product_id = p.id
        JOIN Transaction t ON ti.transaction_id = t.id
        WHERE t.transaction_date >= ${startDate} AND t.transaction_date <= ${endDate}
        GROUP BY p.name
        ORDER BY total_qty DESC
        LIMIT 10
      `;

      res.json({
        month,
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

  if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  }
  
  return app;
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default startServer;
