import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken, authorizeRole, AuthRequest } from "./src/middlewares/authMiddleware";
import { requestLogger, globalErrorHandler } from "./src/middlewares/errorHandler";
import { logger } from "./src/utils/logger";
import { CheckoutValidationError, validateCheckoutItems } from "./src/domain/transaction";
import { z } from "zod";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import XLSX from "xlsx";

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
        { id: user.id, name: user.name, email: user.email, role: user.role, store_id: user.store_id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      logger.success("User logged in", { email: user.email });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, store_id: user.store_id } });
    } catch (err: any) {
      logger.error("Login failed", { error: err.message });
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/users", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          store_id: true,
          created_at: true
        }
      });
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/users", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Name, email, password, and role are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      if (role === "owner" && req.user?.role !== "owner") {
        return res.status(403).json({ error: "Only owners can create another owner" });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const password_hash = await bcrypt.hash(password, 12);
      
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password_hash,
          role,
          store_id: req.user?.store_id
        },
        select: { id: true, name: true, email: true, role: true, store_id: true }
      });

      res.status(201).json(newUser);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/users/:id/role", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const { role } = req.body;
      const targetUserId = req.params.id;

      if (!["owner", "manager", "cashier"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      if (role === "owner" && req.user?.role !== "owner") {
        return res.status(403).json({ error: "Only owners can promote someone to owner" });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) return res.status(404).json({ error: "User not found" });

      if (targetUser.role === "owner" && req.user?.role !== "owner") {
         return res.status(403).json({ error: "Managers cannot demote an owner" });
      }

      await prisma.user.update({
        where: { id: targetUserId },
        data: { role }
      });

      res.json({ message: "Role updated successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
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

  app.post("/api/products", authenticateToken, authorizeRole(["owner", "manager"]), async (req, res) => {
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

  app.put("/api/products/:id", authenticateToken, authorizeRole(["owner", "manager"]), async (req, res) => {
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
              qty: stock - existingProduct.stock,
              stock_before: existingProduct.stock,
              stock_after: stock,
              actor: (req as any).user?.email || "System",
              reason: "Product Edit"
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

  app.delete("/api/products/:id", authenticateToken, authorizeRole(["owner", "manager"]), async (req, res) => {
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
      const payment_method = req.body?.payment_method === "credit" ? "credit" : "cash";
      const customer_id = req.body?.customer_id || null;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      if (payment_method === "credit") {
        if (!customer_id) {
          return res.status(400).json({ error: "Transaksi kredit wajib memilih pelanggan" });
        }
        const customer = await prisma.customer.findFirst({
          where: { id: customer_id, is_active: true }
        });
        if (!customer) {
          return res.status(400).json({ error: "Pelanggan tidak ditemukan atau tidak aktif" });
        }
      }

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
            payment_method,
            customer_id,
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

  app.post("/api/transactions/:id/void", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const txId = req.params.id;
      const { void_reason } = req.body;

      if (!void_reason) {
        return res.status(400).json({ error: "Void reason is required" });
      }

      await prisma.$transaction(async (txPrisma) => {
        const tx = await txPrisma.transaction.findUnique({
          where: { id: txId },
          include: { items: true }
        });

        if (!tx) throw new Error("Transaction not found");
        if (tx.status === "void") throw new Error("Transaction is already voided");

        // Restore stock
        for (const item of tx.items) {
          await txPrisma.product.update({
            where: { id: item.product_id },
            data: { stock: { increment: item.qty } }
          });

          const currentProd = await txPrisma.product.findUnique({ where: { id: item.product_id } });
          
          await txPrisma.stockLog.create({
            data: {
              product_id: item.product_id,
              change_type: "void_reversal",
              qty: item.qty,
              stock_before: (currentProd?.stock || item.qty) - item.qty,
              stock_after: currentProd?.stock || 0,
              actor: req.user?.email || "System",
              reason: `Void TX: ${txId}`,
              reference_id: txId
            }
          });
        }

        // Mark as void
        await txPrisma.transaction.update({
          where: { id: txId },
          data: {
            status: "void",
            void_reason,
            voided_by: req.user?.id
          }
        });
      });

      logger.info("Transaction voided", { txId, by: req.user?.email });
      res.json({ message: "Transaction voided successfully" });
    } catch (err: any) {
      logger.error("POST /api/transactions/:id/void failed", { error: err.message });
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
            qty: diff, // Store raw diff to indicate direction
            stock_before: product.stock,
            stock_after: newStock,
            actor: req.user?.email || "System",
            reason: reason || "Stock Adjustment"
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
      const localDate = new Date(`${todayString}T00:00:00`);
      const tzDate = toZonedTime(localDate, TIMEZONE);
      const startDate = startOfDay(tzDate);
      const endDate = endOfDay(tzDate);

      // Calculate today stats
      const todayAggregate = await prisma.transaction.aggregate({
        _sum: { total_amount: true },
        _count: { id: true },
        where: {
          transaction_date: {
            gte: startDate,
            lte: endDate
          },
          status: { not: "void" }
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
      const topProducts: any[] = await prisma.$queryRaw`
        SELECT p.name, SUM(ti.qty) as total_qty
        FROM TransactionItem ti
        JOIN Product p ON ti.product_id = p.id
        JOIN Transaction t ON ti.transaction_id = t.id
        WHERE t.transaction_date >= ${startDate} AND t.transaction_date <= ${endDate} AND t.status != 'void'
        GROUP BY p.name
        ORDER BY total_qty DESC
        LIMIT 5
      `;

      // Sales data for chart
      const days = parseInt(req.query.days as string) || 7;
      const historyStartLocal = new Date();
      historyStartLocal.setDate(historyStartLocal.getDate() - (days - 1));
      const historyStartTz = toZonedTime(historyStartLocal, TIMEZONE);
      const historyStartStart = startOfDay(historyStartTz);

      const salesDataRaw: any[] = await prisma.$queryRaw`
        SELECT DATE(CONVERT_TZ(transaction_date, '+00:00', '+07:00')) as date, SUM(total_amount) as total
        FROM Transaction 
        WHERE transaction_date >= ${historyStartStart} AND status != 'void'
        GROUP BY DATE(CONVERT_TZ(transaction_date, '+00:00', '+07:00'))
        ORDER BY date ASC
      `;

      const chart_data = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(historyStartLocal);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        const found = salesDataRaw.find(r => {
          const rDateStr = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0];
          return rDateStr === dateStr;
        });

        // Use short date formatting if looking at larger datasets, or just weekday if 7 days
        const labelFormat = days > 14 
          ? d.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })
          : d.toLocaleDateString("id-ID", { weekday: 'short' });

        chart_data.push({
          date: labelFormat,
          total: found ? Number(found.total) : 0
        });
      }

      res.json({
        today_total: Number(todayTotal),
        today_count: todayCount,
        low_stock: lowStock,
        chart_data: chart_data,
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

  // --- Customer Ledger (Utang/Piutang) ---
  const customerSchema = z.object({
    name: z.string().min(1, "Nama pelanggan wajib diisi").max(100),
    phone: z.string().max(20).optional().nullable(),
    address: z.string().max(200).optional().nullable(),
  });

  app.get("/api/customers", authenticateToken, async (req, res) => {
    try {
      const customers = await prisma.customer.findMany({
        where: { is_active: true },
        orderBy: { name: "asc" },
      });

      // Compute outstanding balance per customer:
      // credit transactions (completed) minus payments received.
      const [creditTx, payments] = await Promise.all([
        prisma.transaction.groupBy({
          by: ["customer_id"],
          where: { payment_method: "credit", status: "completed", customer_id: { not: null } },
          _sum: { total_amount: true },
        }),
        prisma.customerPayment.groupBy({
          by: ["customer_id"],
          _sum: { amount: true },
        }),
      ]);

      const creditMap = new Map(creditTx.map((t) => [t.customer_id, Number(t._sum.total_amount || 0)]));
      const paidMap = new Map(payments.map((p) => [p.customer_id, Number(p._sum.amount || 0)]));

      const result = customers.map((c) => {
        const totalCredit = creditMap.get(c.id) || 0;
        const totalPaid = paidMap.get(c.id) || 0;
        return { ...c, total_credit: totalCredit, total_paid: totalPaid, balance: totalCredit - totalPaid };
      });

      res.json(result);
    } catch (err: any) {
      logger.error("GET /api/customers failed", { error: err.message });
      res.status(500).json({ error: "Gagal mengambil data pelanggan" });
    }
  });

  app.post("/api/customers", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const parsed = customerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { name, phone, address } = parsed.data;
      const customer = await prisma.customer.create({
        data: { name, phone: phone || null, address: address || null }
      });
      logger.success("Customer created", { id: customer.id, name });
      res.json(customer);
    } catch (err: any) {
      logger.error("POST /api/customers failed", { error: err.message });
      res.status(500).json({ error: "Gagal menambah pelanggan" });
    }
  });

  app.put("/api/customers/:id", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const parsed = customerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { name, phone, address } = parsed.data;
      const customer = await prisma.customer.update({
        where: { id: req.params.id },
        data: { name, phone: phone || null, address: address || null }
      });
      logger.success("Customer updated", { id: customer.id });
      res.json(customer);
    } catch (err: any) {
      logger.error("PUT /api/customers failed", { error: err.message });
      res.status(500).json({ error: "Gagal memperbarui pelanggan" });
    }
  });

  app.delete("/api/customers/:id", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const txCount = await prisma.transaction.count({ where: { customer_id: req.params.id } });
      if (txCount > 0) {
        return res.status(400).json({ error: "Pelanggan masih punya riwayat transaksi, tidak bisa dihapus" });
      }
      await prisma.customer.update({ where: { id: req.params.id }, data: { is_active: false } });
      logger.success("Customer deactivated", { id: req.params.id });
      res.json({ success: true });
    } catch (err: any) {
      logger.error("DELETE /api/customers failed", { error: err.message });
      res.status(500).json({ error: "Gagal menghapus pelanggan" });
    }
  });

  // Ledger detail: transactions + payments for one customer
  app.get("/api/customers/:id/ledger", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
      if (!customer) return res.status(404).json({ error: "Pelanggan tidak ditemukan" });

      const [transactions, payments] = await Promise.all([
        prisma.transaction.findMany({
          where: { customer_id: req.params.id, payment_method: "credit" },
          orderBy: { transaction_date: "desc" },
          include: { user: { select: { name: true } } },
        }),
        prisma.customerPayment.findMany({
          where: { customer_id: req.params.id },
          orderBy: { created_at: "desc" },
        }),
      ]);

      const totalCredit = transactions.filter((t) => t.status === "completed").reduce((s, t) => s + Number(t.total_amount), 0);
      const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

      res.json({
        customer,
        transactions,
        payments,
        total_credit: totalCredit,
        total_paid: totalPaid,
        balance: totalCredit - totalPaid,
      });
    } catch (err: any) {
      logger.error("GET /api/customers/ledger failed", { error: err.message });
      res.status(500).json({ error: "Gagal mengambil buku pelanggan" });
    }
  });

  // Record a payment (bayar cicilan utang)
  app.post("/api/customers/:id/payments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const parsed = z.object({
        amount: z.number().positive("Jumlah pembayaran harus lebih dari 0"),
        note: z.string().max(200).optional().nullable(),
      }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const customer = await prisma.customer.findFirst({ where: { id: req.params.id, is_active: true } });
      if (!customer) return res.status(404).json({ error: "Pelanggan tidak ditemukan" });

      const payment = await prisma.customerPayment.create({
        data: {
          customer_id: req.params.id,
          amount: parsed.data.amount,
          note: parsed.data.note || null,
          created_by: req.user?.id || "unknown",
        }
      });
      logger.success("Customer payment recorded", { customer_id: req.params.id, amount: parsed.data.amount });
      res.json(payment);
    } catch (err: any) {
      logger.error("POST /api/customers/payments failed", { error: err.message });
      res.status(500).json({ error: "Gagal mencatat pembayaran" });
    }
  });

  // --- Export APIs ---
  function sendXlsx(res: any, data: any[], sheetName: string, filename: string) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(buf));
  }

  app.get("/api/export/products", authenticateToken, authorizeRole(["owner", "manager"]), async (_req: AuthRequest, res) => {
    try {
      const products = await prisma.product.findMany({ where: { is_active: true }, orderBy: { name: "asc" } });
      const rows = products.map(p => ({
        Nama: p.name,
        Kategori: p.category || "-",
        "Harga Beli": Number(p.purchase_price),
        "Harga Jual": Number(p.selling_price),
        Stok: p.stock,
        Satuan: p.unit
      }));
      sendXlsx(res, rows, "Produk", `produk-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/export/stock-history", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const { from, to } = req.query;
      const where: any = {};
      if (from && to) {
        where.created_at = { gte: new Date(from as string), lte: new Date(`${to}T23:59:59.999Z`) };
      }
      const logs = await prisma.stockLog.findMany({ where, include: { product: true }, orderBy: { created_at: "desc" } });
      const rows = logs.map(l => ({
        Tanggal: l.created_at.toISOString().split("T")[0],
        Produk: l.product.name,
        Tipe: l.change_type,
        Qty: l.qty,
        "Stok Sebelum": l.stock_before,
        "Stok Sesudah": l.stock_after,
        Aktor: l.actor || "-",
        Alasan: l.reason || "-"
      }));
      sendXlsx(res, rows, "Riwayat Stok", `stok-history-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/export/sales-daily", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const { date } = req.query;
      if (typeof date !== "string" || !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date)) {
        return res.status(400).json({ error: "date must use YYYY-MM-DD format" });
      }
      const localDate = new Date(`${date}T00:00:00`);
      const tzDate = toZonedTime(localDate, TIMEZONE);
      const sd = startOfDay(tzDate);
      const ed = endOfDay(tzDate);

      const txs = await prisma.transaction.findMany({
        where: { transaction_date: { gte: sd, lte: ed }, status: { not: "void" } },
        include: { items: true },
        orderBy: { transaction_date: "asc" }
      });

      const rows = txs.flatMap(tx => tx.items.map(ti => ({
        "ID Transaksi": tx.id.slice(0, 8),
        Waktu: tx.transaction_date.toISOString().replace("T", " ").slice(0, 19),
        Produk: ti.product_name,
        Qty: ti.qty,
        Harga: Number(ti.price),
        "Harga Modal": Number(ti.unit_cost),
        Subtotal: Number(ti.subtotal),
        Profit: (Number(ti.price) - Number(ti.unit_cost)) * ti.qty
      })));

      sendXlsx(res, rows, "Penjualan Harian", `penjualan-${date}.xlsx`);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/export/sales-monthly", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const { month } = req.query;
      if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return res.status(400).json({ error: "month must use YYYY-MM format" });
      }
      const localDate = new Date(`${month}-01T00:00:00`);
      const tzDate = toZonedTime(localDate, TIMEZONE);
      const sd = startOfMonth(tzDate);
      const ed = endOfMonth(tzDate);

      const txs = await prisma.transaction.findMany({
        where: { transaction_date: { gte: sd, lte: ed }, status: { not: "void" } },
        include: { items: true },
        orderBy: { transaction_date: "asc" }
      });

      const rows = txs.flatMap(tx => tx.items.map(ti => ({
        Tanggal: tx.transaction_date.toISOString().split("T")[0],
        "ID Transaksi": tx.id.slice(0, 8),
        Produk: ti.product_name,
        Qty: ti.qty,
        Harga: Number(ti.price),
        "Harga Modal": Number(ti.unit_cost),
        Subtotal: Number(ti.subtotal),
        Profit: (Number(ti.price) - Number(ti.unit_cost)) * ti.qty
      })));

      sendXlsx(res, rows, "Penjualan Bulanan", `penjualan-${month}.xlsx`);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Restock/Kulakan API ---
  app.post("/api/stocks/restock", authenticateToken, authorizeRole(["owner", "manager"]), async (req: AuthRequest, res) => {
    try {
      const { product_id, qty, cost_per_unit, supplier, receipt_ref } = req.body;

      if (!product_id || typeof qty !== "number" || qty <= 0) {
        return res.status(400).json({ error: "product_id and qty (positive number) are required" });
      }

      await prisma.$transaction(async (txPrisma) => {
        const product = await txPrisma.product.findUnique({ where: { id: product_id } });
        if (!product) throw new Error("Product not found");

        const newStock = product.stock + qty;

        // Update stock and optionally purchase price
        const updateData: any = { stock: newStock };
        if (typeof cost_per_unit === "number" && cost_per_unit > 0) {
          updateData.purchase_price = cost_per_unit;
        }

        await txPrisma.product.update({ where: { id: product_id }, data: updateData });

        await txPrisma.stockLog.create({
          data: {
            product_id,
            change_type: "restock",
            qty,
            stock_before: product.stock,
            stock_after: newStock,
            actor: req.user?.email || "System",
            reason: [supplier, receipt_ref].filter(Boolean).join(" | ") || "Restock",
            reference_id: receipt_ref || null
          }
        });
      });

      logger.success("Product restocked", { product_id, qty, supplier });
      res.json({ success: true });
    } catch (err: any) {
      logger.error("POST /api/stocks/restock failed", { error: err.message });
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
