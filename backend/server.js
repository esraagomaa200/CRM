import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------- helpers ----------
const ORDER_STATUSES = ["Processing", "Delivered", "Cancelled"];

function toCustomer(row) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    segment: row.segment,
    location: row.location,
    orders: row.orders_count,
    ltv: row.ltv,
    lastOrder: row.last_order,
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
