import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------- helpers ----------
const ORDER_STATUSES = ["Processing", "Delivered", "Cancelled"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

function getUserFromToken(token) {
  if (!token) return null;
  const session = db.prepare("SELECT user_id FROM sessions WHERE token = ?").get(token);
  if (!session) return null;
  return db.prepare("SELECT * FROM users WHERE id = ?").get(session.user_id) || null;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = getUserFromToken(token);
  if (!user) return res.status(401).json({ message: "Not authenticated" });
  req.user = user;
  req.token = token;
  next();
}

function formatDay(isoDatetime) {
  if (!isoDatetime) return "";
  const d = new Date(isoDatetime.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Live per-customer aggregates from the orders table (by customer name).
// LTV = sum of non-cancelled orders; count = number of non-cancelled orders.
// Returns null only when the customer has no orders at all (stored values are kept then).
function customerOrderStats(name) {
  const rows = db
    .prepare("SELECT price, status, created_at FROM orders WHERE customer = ?")
    .all(name);
  if (rows.length === 0) return null;
  const valid = rows.filter((r) => r.status !== "Cancelled");
  const ltv = valid.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
  const latest = rows.map((r) => r.created_at).sort().pop();
  return { orders: valid.length, ltv: Math.round(ltv * 100) / 100, lastOrder: formatDay(latest) || "—" };
}

function toCustomer(row) {
  if (!row) return row;
  const live = customerOrderStats(row.name);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    segment: row.segment,
    location: row.location,
    orders: live ? live.orders : row.orders_count,
    ltv: live ? live.ltv : row.ltv,
    lastOrder: live ? live.lastOrder : row.last_order || "—",
    joined: row.joined,
  };
}

function applyFilters(rows, query, fields) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    fields.some((f) => String(row[f] ?? "").toLowerCase().includes(q))
  );
}

// ---------- health / stats ----------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "crm-backend" });
});

app.get("/api/stats", (req, res) => {
  const products = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
  const customers = db.prepare("SELECT COUNT(*) AS n FROM customers").get().n;
  const orders = db.prepare("SELECT COUNT(*) AS n FROM orders").get().n;
  const lowStock = db
    .prepare("SELECT COUNT(*) AS n FROM products WHERE stock <= 10")
    .get().n;
  res.json({ products, customers, orders, lowStock });
});

// ---------- auth ----------
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name.trim(), email.trim().toLowerCase(), passwordHash);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);

  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, user.id);

  res.status(201).json({ token, user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, user.id);

  res.json({ token, user: publicUser(user) });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post("/api/auth/logout", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  res.json({ ok: true });
});

// ---------- dashboard (one call for the whole Dashboard page) ----------
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

app.get("/api/dashboard", (req, res) => {
  const totalRevenue =
    db.prepare("SELECT COALESCE(SUM(price), 0) AS total FROM orders WHERE status != 'Cancelled'").get()
      .total;
  const activeOrders = db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'Processing'").get().n;
  const totalCustomers = db.prepare("SELECT COUNT(*) AS n FROM customers").get().n;
  const totalProducts = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
  const lowStock = db.prepare("SELECT COUNT(*) AS n FROM products WHERE stock <= 10").get().n;

  const recentOrders = db
    .prepare(
      `SELECT o.id, o.customer, c.email AS email, o.product, o.price AS amount, o.status,
              substr(o.created_at, 1, 10) AS date
       FROM orders o LEFT JOIN customers c ON c.name = o.customer
       ORDER BY o.rowid DESC LIMIT 6`
    )
    .all();

  const topProducts = db
    .prepare(
      `SELECT product AS name, COUNT(*) AS units FROM orders
       WHERE status != 'Cancelled' GROUP BY product
       ORDER BY units DESC, name ASC LIMIT 5`
    )
    .all();

  // Monthly revenue (non-cancelled), last 7 months ending at the latest order month
  const monthly = db
    .prepare(
      `SELECT substr(created_at, 1, 7) AS ym, SUM(price) AS total FROM orders
       WHERE status != 'Cancelled' GROUP BY ym ORDER BY ym`
    )
    .all();
  const latest = monthly.length ? monthly[monthly.length - 1].ym : new Date().toISOString().slice(0, 7);
  const [endY, endM] = latest.split("-").map(Number);
  const totalsByYm = Object.fromEntries(monthly.map((m) => [m.ym, m.total]));
  const revenueTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(endY, endM - 1 - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueTrend.push({ month: MONTH_LABELS[d.getMonth()], value: totalsByYm[ym] || 0 });
  }
  const last = revenueTrend[revenueTrend.length - 1].value;
  const prev = revenueTrend[revenueTrend.length - 2].value;
  const revenueDelta = prev > 0 ? +(((last - prev) / prev) * 100).toFixed(1) : null;

  res.json({
    stats: { totalRevenue, activeOrders, totalCustomers, totalProducts, lowStock, revenueDelta },
    recentOrders,
    topProducts,
    revenueTrend,
  });
});

// ---------- products ----------
app.get("/api/products", (req, res) => {
  let rows = db
    .prepare("SELECT * FROM products ORDER BY id DESC")
    .all();
  rows = applyFilters(rows, req.query.search, ["name", "sku"]);
  if (req.query.category && req.query.category !== "All") {
    rows = rows.filter((p) => p.category === req.query.category);
  }
  res.json(rows);
});

app.get("/api/products/categories", (req, res) => {
  const rows = db.prepare("SELECT DISTINCT category FROM products ORDER BY category").all();
  res.json(rows.map((r) => r.category));
});

app.get("/api/products/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ message: "Product not found" });
  res.json(row);
});

app.post("/api/products", (req, res) => {
  const { name, sku, category, price, stock, image } = req.body || {};
  if (!name || !sku || !category) {
    return res.status(400).json({ message: "name, sku and category are required" });
  }
  try {
    const result = db
      .prepare(
        "INSERT INTO products (name, sku, category, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(name, sku, category, Number(price) || 0, Number(stock) || 0, image || "");
    res.status(201).json(db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid));
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "SKU already exists" });
    }
    throw err;
  }
});

app.put("/api/products/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ message: "Product not found" });
  const { name, sku, category, price, stock, image } = req.body || {};
  try {
    db.prepare(
      "UPDATE products SET name = ?, sku = ?, category = ?, price = ?, stock = ?, image = ? WHERE id = ?"
    ).run(
      name ?? existing.name,
      sku ?? existing.sku,
      category ?? existing.category,
      price !== undefined ? Number(price) || 0 : existing.price,
      stock !== undefined ? Number(stock) || 0 : existing.stock,
      image ?? existing.image,
      req.params.id
    );
    res.json(db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id));
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "SKU already exists" });
    }
    throw err;
  }
});

app.delete("/api/products/:id", (req, res) => {
  const result = db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: "Product not found" });
  res.json({ ok: true });
});

// ---------- customers ----------
app.get("/api/customers", (req, res) => {
  let rows = db.prepare("SELECT * FROM customers ORDER BY id DESC").all().map(toCustomer);
  rows = applyFilters(rows, req.query.search, ["name", "email"]);
  if (req.query.segment && req.query.segment !== "all") {
    rows = rows.filter((c) => c.segment === req.query.segment);
  }
  res.json(rows);
});

app.get("/api/customers/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ message: "Customer not found" });
  res.json(toCustomer(row));
});

app.post("/api/customers", (req, res) => {
  const { name, email, segment, location } = req.body || {};
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ message: "Name and email are required" });
  }
  const joined = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  try {
    const result = db
      .prepare(
        "INSERT INTO customers (name, email, segment, location, orders_count, ltv, last_order, joined) VALUES (?, ?, ?, ?, 0, 0, '', ?)"
      )
      .run(name.trim(), email.trim(), segment || "new", location?.trim() || "", joined);
    res
      .status(201)
      .json(toCustomer(db.prepare("SELECT * FROM customers WHERE id = ?").get(result.lastInsertRowid)));
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "Email already exists" });
    }
    throw err;
  }
});

app.put("/api/customers/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ message: "Customer not found" });
  const { name, email, segment, location } = req.body || {};
  try {
    db.prepare(
      "UPDATE customers SET name = ?, email = ?, segment = ?, location = ? WHERE id = ?"
    ).run(
      name ?? existing.name,
      email ?? existing.email,
      segment ?? existing.segment,
      location ?? existing.location,
      req.params.id
    );
    res.json(toCustomer(db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id)));
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({ message: "Email already exists" });
    }
    throw err;
  }
});

app.delete("/api/customers/:id", (req, res) => {
  const result = db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: "Customer not found" });
  res.json({ ok: true });
});

// ---------- orders ----------
app.get("/api/orders", (req, res) => {
  let rows = db.prepare("SELECT * FROM orders ORDER BY rowid DESC").all();
  rows = applyFilters(rows, req.query.search, ["customer", "product", "id"]);
  if (req.query.status && req.query.status !== "All") {
    rows = rows.filter((o) => o.status === req.query.status);
  }
  res.json(rows);
});

app.get("/api/orders/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ message: "Order not found" });
  res.json(row);
});

function generateOrderId() {
  for (let i = 0; i < 20; i++) {
    const id = "#ORD-" + Math.floor(100 + Math.random() * 900);
    const exists = db.prepare("SELECT 1 FROM orders WHERE id = ?").get(id);
    if (!exists) return id;
  }
  return "#ORD-" + Date.now();
}

app.post("/api/orders", (req, res) => {
  const { customer, product, price, status } = req.body || {};
  if (!customer?.trim() || !product?.trim()) {
    return res.status(400).json({ message: "customer and product are required" });
  }
  if (status && !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  const id = generateOrderId();
  db.prepare("INSERT INTO orders (id, customer, product, price, status) VALUES (?, ?, ?, ?, ?)").run(
    id,
    customer.trim(),
    product.trim(),
    Number(price) || 0,
    status || "Processing"
  );
  res.status(201).json(db.prepare("SELECT * FROM orders WHERE id = ?").get(id));
});

function updateOrder(req, res) {
  const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ message: "Order not found" });
  const { customer, product, price, status } = req.body || {};
  if (status && !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  db.prepare("UPDATE orders SET customer = ?, product = ?, price = ?, status = ? WHERE id = ?").run(
    customer ?? existing.customer,
    product ?? existing.product,
    price !== undefined ? Number(price) || 0 : existing.price,
    status ?? existing.status,
    req.params.id
  );
  res.json(db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id));
}

app.patch("/api/orders/:id", updateOrder);

app.put("/api/orders/:id", updateOrder);

app.delete("/api/orders/:id", (req, res) => {
  const result = db.prepare("DELETE FROM orders WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: "Order not found" });
  res.json({ ok: true });
});

// ---------- errors ----------
app.use((req, res) => res.status(404).json({ message: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

app.listen(PORT, () => {
  console.log(`CRM backend running on http://localhost:${PORT}`);
});
