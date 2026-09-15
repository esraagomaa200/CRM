import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, "crm.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    segment TEXT NOT NULL DEFAULT 'new',
    location TEXT NOT NULL DEFAULT '',
    orders_count INTEGER NOT NULL DEFAULT 0,
    ltv REAL NOT NULL DEFAULT 0,
    last_order TEXT NOT NULL DEFAULT '',
    joined TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer TEXT NOT NULL,
    product TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Processing',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function seed() {
  const productCount = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
  const customerCount = db.prepare("SELECT COUNT(*) AS n FROM customers").get().n;
  const orderCount = db.prepare("SELECT COUNT(*) AS n FROM orders").get().n;
  if (productCount > 0 && customerCount > 0 && orderCount > 0) return;

  const products = [
    { name: 'Apple MacBook Pro 14" M4', sku: "LPT-MBP14-M4", category: "Laptops", price: 1999.0, stock: 18, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=150&auto=format&fit=crop&q=80" },
    { name: "Dell XPS 15 9530", sku: "LPT-DLXPS15", category: "Laptops", price: 1649.99, stock: 12, image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=150&auto=format&fit=crop&q=80" },
    { name: "Samsung Galaxy S25 Ultra", sku: "MOB-SGS25U", category: "Mobiles", price: 1299.99, stock: 34, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=150&auto=format&fit=crop&q=80" },
    { name: "iPhone 16 Pro", sku: "MOB-IP16P", category: "Mobiles", price: 1199.0, stock: 27, image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=150&auto=format&fit=crop&q=80" },
    { name: "Sony WH-1000XM5 Headphones", sku: "AUD-SONYXM5", category: "Audio", price: 349.99, stock: 56, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=80" },
    { name: "Apple AirPods Pro 2", sku: "AUD-APP2", category: "Audio", price: 249.0, stock: 84, image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=150&auto=format&fit=crop&q=80" },
    { name: 'Samsung Odyssey G9 49" Monitor', sku: "DSP-ODYG9", category: "Displays", price: 1099.99, stock: 9, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150&auto=format&fit=crop&q=80" },
    { name: 'LG UltraFine 27" 4K Monitor', sku: "DSP-LG27UF", category: "Displays", price: 549.0, stock: 21, image: "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=150&auto=format&fit=crop&q=80" },
    { name: "Logitech MX Master 3S", sku: "PRF-MXM3S", category: "Peripherals", price: 99.99, stock: 120, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=150&auto=format&fit=crop&q=80" },
    { name: "Keychron K8 Pro Keyboard", sku: "PRF-KK8P", category: "Peripherals", price: 119.0, stock: 66, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150&auto=format&fit=crop&q=80" },
    { name: "Samsung 990 Pro 2TB SSD", sku: "STG-990P2T", category: "Storage", price: 189.99, stock: 75, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=150&auto=format&fit=crop&q=80" },
    { name: "SanDisk Extreme 1TB Portable SSD", sku: "STG-SDE1T", category: "Storage", price: 129.99, stock: 90, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=150&auto=format&fit=crop&q=80" },
    { name: "Apple Watch Series 10", sku: "WER-AWS10", category: "Wearables", price: 429.0, stock: 42, image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=150&auto=format&fit=crop&q=80" },
    { name: "Anker 737 Power Bank", sku: "PWR-ANK737", category: "Power", price: 109.99, stock: 58, image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=150&auto=format&fit=crop&q=80" },
    { name: "TP-Link Deco XE75 Mesh WiFi", sku: "NET-DXE75", category: "Networking", price: 299.99, stock: 31, image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=150&auto=format&fit=crop&q=80" },
    { name: "Google Nest Hub (2nd Gen)", sku: "SMH-GNH2", category: "Smart Home", price: 99.99, stock: 47, image: "https://images.unsplash.com/photo-1512446816042-444d641267d4?w=150&auto=format&fit=crop&q=80" },
  ];

  const customers = [
    { name: "Marisol Vega", email: "marisol.vega@email.com", segment: "vip", location: "Austin, TX", orders_count: 18, ltv: 4820.5, last_order: "Aug 28, 2026", joined: "Jan 14, 2024" },
    { name: "Theo Nakamura", email: "theo.nakamura@email.com", segment: "regular", location: "Portland, OR", orders_count: 5, ltv: 1240, last_order: "Sep 1, 2026", joined: "Mar 3, 2025" },
    { name: "Priya Sharma", email: "priya.sharma@email.com", segment: "new", location: "Seattle, WA", orders_count: 1, ltv: 429.5, last_order: "Sep 2, 2026", joined: "Aug 30, 2026" },
    { name: "Rafael Okafor", email: "rafael.okafor@email.com", segment: "at-risk", location: "Chicago, IL", orders_count: 4, ltv: 892, last_order: "Aug 30, 2026", joined: "Jul 22, 2024" },
    { name: "Sienna Holbrook", email: "sienna.holbrook@email.com", segment: "vip", location: "Denver, CO", orders_count: 24, ltv: 6102.75, last_order: "Aug 25, 2026", joined: "Oct 5, 2023" },
    { name: "Leon Marchetti", email: "leon.marchetti@email.com", segment: "regular", location: "Miami, FL", orders_count: 7, ltv: 1890, last_order: "Sep 1, 2026", joined: "Feb 18, 2025" },
    { name: "Anika Brennan", email: "anika.brennan@email.com", segment: "at-risk", location: "Boston, MA", orders_count: 9, ltv: 2100, last_order: "Jun 14, 2026", joined: "Apr 1, 2024" },
    { name: "Darius Wren", email: "darius.wren@email.com", segment: "new", location: "Atlanta, GA", orders_count: 1, ltv: 179.99, last_order: "Aug 31, 2026", joined: "Aug 31, 2026" },
    { name: "Layla Hassan", email: "layla.hassan@email.com", segment: "vip", location: "Cairo, EG", orders_count: 11, ltv: 3560, last_order: "Sep 10, 2026", joined: "May 20, 2024" },
    { name: "Omar El-Sayed", email: "omar.elsayed@email.com", segment: "new", location: "Giza, EG", orders_count: 2, ltv: 349.99, last_order: "Sep 12, 2026", joined: "Sep 5, 2026" },
  ];

  const orders = [
    { id: "#ORD-101", customer: "Marisol Vega", product: 'Apple MacBook Pro 14" M4', price: 1999.0, status: "Delivered", created_at: "2026-03-14 12:00:00" },
    { id: "#ORD-102", customer: "Theo Nakamura", product: "Samsung Galaxy S25 Ultra", price: 1299.99, status: "Processing", created_at: "2026-04-09 12:00:00" },
    { id: "#ORD-103", customer: "Priya Sharma", product: "Apple AirPods Pro 2", price: 249.0, status: "Delivered", created_at: "2026-05-21 12:00:00" },
    { id: "#ORD-104", customer: "Rafael Okafor", product: "Keychron K8 Pro Keyboard", price: 119.0, status: "Cancelled", created_at: "2026-06-05 12:00:00" },
    { id: "#ORD-105", customer: "Sienna Holbrook", product: 'LG UltraFine 27" 4K Monitor', price: 549.0, status: "Delivered", created_at: "2026-07-18 12:00:00" },
    { id: "#ORD-106", customer: "Leon Marchetti", product: "Logitech MX Master 3S", price: 99.99, status: "Processing", created_at: "2026-08-11 12:00:00" },
    { id: "#ORD-107", customer: "Anika Brennan", product: "Sony WH-1000XM5 Headphones", price: 349.99, status: "Processing", created_at: "2026-09-02 12:00:00" },
    { id: "#ORD-108", customer: "Layla Hassan", product: "iPhone 16 Pro", price: 1199.0, status: "Delivered", created_at: "2026-09-10 12:00:00" },
  ];

  const insertProduct = db.prepare(
    "INSERT OR IGNORE INTO products (name, sku, category, price, stock, image) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertCustomer = db.prepare(
    "INSERT OR IGNORE INTO customers (name, email, segment, location, orders_count, ltv, last_order, joined) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertOrder = db.prepare(
    "INSERT OR IGNORE INTO orders (id, customer, product, price, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );

  for (const p of products) insertProduct.run(p.name, p.sku, p.category, p.price, p.stock, p.image);
  for (const c of customers)
    insertCustomer.run(c.name, c.email, c.segment, c.location, c.orders_count, c.ltv, c.last_order, c.joined);
  for (const o of orders) insertOrder.run(o.id, o.customer, o.product, o.price, o.status, o.created_at);

  console.log(`Seeded DB (${todayLabel()}): ${products.length} products, ${customers.length} customers, ${orders.length} orders`);
}


try {
  db.exec("ALTER TABLE users ADD COLUMN birth_date TEXT DEFAULT ''");
} catch {
}

seed();

seed();

// One demo login so the Sign In page has something to log in with out of the box.
function seedDemoUser() {
  const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (userCount > 0) return;
  const passwordHash = bcrypt.hashSync("demo1234", 10);
  db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run(
    "Demo Admin",
    "demo@nexacrm.com",
    passwordHash
  );
  console.log("Seeded demo user: demo@nexacrm.com / demo1234");
}

seedDemoUser();

// One-time backfill for databases seeded before order dates existed:
// spread the original 8 seed orders across Mar–Sep 2026 (for the revenue trend),
// but only if they are still untouched (all share the same day).
function backfillOrderDates() {
  const SEED_IDS = ["#ORD-101", "#ORD-102", "#ORD-103", "#ORD-104", "#ORD-105", "#ORD-106", "#ORD-107", "#ORD-108"];
  const SPREAD = {
    "#ORD-101": "2026-03-14 12:00:00",
    "#ORD-102": "2026-04-09 12:00:00",
    "#ORD-103": "2026-05-21 12:00:00",
    "#ORD-104": "2026-06-05 12:00:00",
    "#ORD-105": "2026-07-18 12:00:00",
    "#ORD-106": "2026-08-11 12:00:00",
    "#ORD-107": "2026-09-02 12:00:00",
    "#ORD-108": "2026-09-10 12:00:00",
  };
  try {
    const placeholders = SEED_IDS.map(() => "?").join(",");
    const rows = db
      .prepare(`SELECT id, substr(created_at, 1, 10) AS day FROM orders WHERE id IN (${placeholders})`)
      .all(...SEED_IDS);
    if (rows.length !== SEED_IDS.length) return;
    if (new Set(rows.map((r) => r.day)).size !== 1) return;
    const update = db.prepare("UPDATE orders SET created_at = ? WHERE id = ?");
    for (const id of SEED_IDS) update.run(SPREAD[id], id);
    console.log("Backfilled seed order dates across Mar–Sep 2026");
  } catch {
    // orders table from a newer seed already has dates — nothing to do
  }
}

backfillOrderDates();

export default db;
