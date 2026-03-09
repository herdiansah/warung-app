import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const dbDir = path.join(__dirname, "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const db = new Database(path.join(dbDir, "warung.db"));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    purchase_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    total REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products ORDER BY name").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, category, purchase_price, selling_price, stock, unit } = req.body;
    const stmt = db.prepare(
      "INSERT INTO products (name, category, purchase_price, selling_price, stock, unit) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const info = stmt.run(name, category || "", purchase_price, selling_price, stock, unit);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, category, purchase_price, selling_price, stock, unit } = req.body;
    const stmt = db.prepare(
      "UPDATE products SET name = ?, category = ?, purchase_price = ?, selling_price = ?, stock = ?, unit = ? WHERE id = ?"
    );
    stmt.run(name, category || "", purchase_price, selling_price, stock, unit, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    // Check if product is used in transactions
    const count = db.prepare("SELECT COUNT(*) as count FROM transaction_items WHERE product_id = ?").get(req.params.id) as {count: number};
    if (count.count > 0) {
      return res.status(400).json({ error: "Cannot delete product used in transactions" });
    }
    const stmt = db.prepare("DELETE FROM products WHERE id = ?");
    stmt.run(req.params.id);
    res.json({ success: true });
  });

  // Transactions
  app.post("/api/transactions", (req, res) => {
    const { items, total } = req.body; // items: [{product_id, qty, price, subtotal}]
    const date = new Date().toISOString();

    const insertTx = db.transaction((items, total, date) => {
      const txStmt = db.prepare("INSERT INTO transactions (date, total) VALUES (?, ?)");
      const txInfo = txStmt.run(date, total);
      const transactionId = txInfo.lastInsertRowid;

      const itemStmt = db.prepare(
        "INSERT INTO transaction_items (transaction_id, product_id, qty, price, subtotal) VALUES (?, ?, ?, ?, ?)"
      );
      const updateStockStmt = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

      for (const item of items) {
        itemStmt.run(transactionId, item.product_id, item.qty, item.price, item.subtotal);
        updateStockStmt.run(item.qty, item.product_id);
      }
      return transactionId;
    });

    try {
      const txId = insertTx(items, total, date);
      res.json({ id: txId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/transactions", (req, res) => {
    const { date } = req.query; // YYYY-MM-DD
    let query = "SELECT * FROM transactions";
    let params: any[] = [];
    if (date) {
      query += " WHERE date LIKE ?";
      params.push(`${date}%`);
    }
    query += " ORDER BY date DESC";
    
    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  });

  app.get("/api/transactions/:id", (req, res) => {
    const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
    if (!tx) return res.status(404).json({ error: "Not found" });
    
    const items = db.prepare(`
      SELECT ti.*, p.name as product_name 
      FROM transaction_items ti 
      JOIN products p ON ti.product_id = p.id 
      WHERE ti.transaction_id = ?
    `).all(req.params.id);
    
    res.json({ ...tx, items });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const txId = req.params.id;
    const deleteTx = db.transaction((id) => {
      // Restore stock
      const items = db.prepare("SELECT product_id, qty FROM transaction_items WHERE transaction_id = ?").all(id) as any[];
      const updateStockStmt = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
      for (const item of items) {
        updateStockStmt.run(item.qty, item.product_id);
      }
      
      // Delete items and tx
      db.prepare("DELETE FROM transaction_items WHERE transaction_id = ?").run(id);
      db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
    });

    try {
      deleteTx(txId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dashboard & Reports
  app.get("/api/dashboard", (req, res) => {
    const today = new Date().toISOString().split("T")[0];
    
    const todaySales = db.prepare("SELECT SUM(total) as total, COUNT(id) as count FROM transactions WHERE date LIKE ?").get(`${today}%`) as any;
    
    const lowStock = db.prepare("SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 5").all();
    
    const topProducts = db.prepare(`
      SELECT p.name, SUM(ti.qty) as total_qty
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.date LIKE ?
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT 5
    `).all(`${today}%`);

    res.json({
      today_total: todaySales.total || 0,
      today_count: todaySales.count || 0,
      low_stock: lowStock,
      top_products: topProducts
    });
  });

  app.get("/api/reports", (req, res) => {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ error: "Month is required" });

    const monthlySales = db.prepare("SELECT SUM(total) as total, COUNT(id) as count FROM transactions WHERE date LIKE ?").get(`${month}%`) as any;
    
    // Calculate profit: sum( (selling_price - purchase_price) * qty )
    const profitData = db.prepare(`
      SELECT SUM((ti.price - p.purchase_price) * ti.qty) as profit
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.date LIKE ?
    `).get(`${month}%`) as any;

    const topProducts = db.prepare(`
      SELECT p.name, SUM(ti.qty) as total_qty, SUM(ti.subtotal) as total_revenue
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.date LIKE ?
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT 10
    `).all(`${month}%`);

    res.json({
      total_revenue: monthlySales.total || 0,
      total_transactions: monthlySales.count || 0,
      total_profit: profitData.profit || 0,
      top_products: topProducts
    });
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
