import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken, AuthRequest } from "./src/middlewares/authMiddleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API Routes ---

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        where: { is_active: true },
        orderBy: { name: "asc" }
      });
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { name, category, purchase_price, selling_price, stock, unit } = req.body;
      const product = await prisma.product.create({
        data: {
          name,
          category,
          purchase_price,
          selling_price,
          stock,
          unit,
        }
      });
      res.json({ id: product.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { name, category, purchase_price, selling_price, stock, unit } = req.body;
      await prisma.product.update({
        where: { id: req.params.id },
        data: { name, category, purchase_price, selling_price, stock, unit }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      // Check if product is used in transactions
      const count = await prisma.transactionItem.count({
        where: { product_id: req.params.id }
      });

      if (count > 0) {
        // Soft delete if used
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
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Transactions
  app.post("/api/transactions", async (req, res) => {
    try {
      const { items, total } = req.body;
      const user = await getDefaultUser();

      const tx = await prisma.$transaction(async (txPrisma) => {
        // Prepare items with names
        const preparedItems = [];
        for (const item of items) {
          const product = await txPrisma.product.findUnique({ where: { id: item.product_id } });
          if (!product) throw new Error("Product not found");
          if (product.stock < item.qty) {
            throw new Error(`Stok tidak cukup untuk ${product.name}`);
          }
          preparedItems.push({
            product_id: item.product_id,
            qty: item.qty,
            price: item.price,
            subtotal: item.subtotal,
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
            total_amount: total,
            created_by: user.id,
            items: {
              create: preparedItems
            }
          }
        });

        return newTx;
      });

      res.json({ id: tx.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/transactions", async (req, res) => {
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
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const tx = await prisma.transaction.findUnique({
        where: { id: req.params.id },
        include: { items: true }
      });
      if (!tx) return res.status(404).json({ error: "Not found" });
      res.json(tx);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
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

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dashboard & Reports
  app.get("/api/dashboard", async (req, res) => {
    try {
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
        where: { stock: { lte: 5 }, is_active: true },
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
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/reports", async (req, res) => {
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
      res.status(500).json({ error: err.message });
    }
  });

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
