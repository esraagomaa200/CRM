import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The Gemini key lives in its own file (backend/.env.gemini), separate from the
// main .env, so rotating/adding the key never touches anything else.
dotenv.config({ path: path.join(__dirname, ".env.gemini") });

const DEFAULT_MODEL = "gemini-3.6-flash";

function buildContext(db) {
  const totals = {
    products: db.prepare("SELECT COUNT(*) AS n FROM products").get().n,
    customers: db.prepare("SELECT COUNT(*) AS n FROM customers").get().n,
    orders: db.prepare("SELECT COUNT(*) AS n FROM orders").get().n,
  };

  const lowStock = db
    .prepare("SELECT name, sku, stock FROM products WHERE stock <= 10 ORDER BY stock ASC LIMIT 10")
    .all();

  const outOfStock = db.prepare("SELECT COUNT(*) AS n FROM products WHERE stock = 0").get().n;

  const totalRevenue = db
    .prepare("SELECT COALESCE(SUM(price), 0) AS total FROM orders WHERE status != 'Cancelled'")
    .get().total;

  const ordersByStatus = db
    .prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status")
    .all();

  const recentOrders = db
    .prepare(
      `SELECT id, customer, product, price, status, substr(created_at, 1, 10) AS date
       FROM orders ORDER BY rowid DESC LIMIT 8`
    )
    .all();

  const topProducts = db
    .prepare(
      `SELECT product AS name, COUNT(*) AS units, SUM(price) AS revenue FROM orders
       WHERE status != 'Cancelled' GROUP BY product ORDER BY units DESC LIMIT 5`
    )
    .all();

  const segments = db
    .prepare("SELECT segment, COUNT(*) AS n FROM customers GROUP BY segment")
    .all();

  const topCustomers = db
    .prepare("SELECT name, email, segment, orders_count, ltv FROM customers ORDER BY ltv DESC LIMIT 5")
    .all();

  const categories = db
    .prepare(
      `SELECT category, COUNT(*) AS products, SUM(stock) AS totalStock FROM products
       GROUP BY category ORDER BY products DESC`
    )
    .all();

  return {
    totals,
    totalRevenue,
    outOfStock,
    lowStock,
    ordersByStatus,
    recentOrders,
    topProducts,
    segments,
    topCustomers,
    categories,
  };
}

function systemPrompt(context) {
  return `You are the built-in AI assistant inside "NexaCRM", a CRM web dashboard for managing an
e-commerce/tech-products business. You are shown live, real data pulled straight from the app's
database below — treat it as ground truth, not an example.

App structure (for context, so you can point users to the right place):
- Dashboard: revenue, order and customer KPIs, recent orders, top products, revenue trend chart.
- Products: catalog with name, SKU, category, price, stock; supports add/edit/delete and search.
- Orders: order records (customer, product, price, status: Processing/Delivered/Cancelled); supports
  status updates, add/delete, search and filter by status.
- Customers: customer list with segment (vip/regular/new/at-risk), location, order count, lifetime
  value (LTV) and last order date; supports add/edit/delete and search.
- Analytics: sales performance, revenue growth and top-selling products (in progress).
- Sign In / Sign Up: real account system backed by the same database (bcrypt-hashed passwords).

Live data snapshot (JSON):
${JSON.stringify(context, null, 2)}

Guidelines:
- Answer using this real data whenever the question is about the business (revenue, stock, orders,
  customers, etc.) — do the arithmetic yourself if needed (totals, averages, comparisons).
- If asked about something not covered by the data above (e.g. a feature that doesn't exist yet),
  say so honestly rather than inventing numbers.
- Reply in the same language the user writes in (Arabic or English).
- Keep answers concise and to the point — short paragraphs or a tight bullet list, not long essays,
  unless the user explicitly asks for more detail.`;
}

export function registerChatRoutes(app, db) {
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        message:
          "The AI assistant isn't configured yet. Add your Google AI Studio key to backend/.env.gemini (see .env.gemini.example) and restart the server.",
      });
    }

    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const context = buildContext(db);

    const contents = [
      ...(Array.isArray(history) ? history : []).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.text || "") }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt(context) }] },
            contents,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const apiMessage = data?.error?.message || "Gemini request failed";
        return res.status(response.status === 400 ? 502 : response.status).json({ message: apiMessage });
      }

      const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
      if (!reply) {
        return res.status(502).json({ message: "The assistant returned an empty response. Try again." });
      }

      res.json({ reply });
    } catch (err) {
      console.error("Gemini chat error:", err);
      res.status(502).json({ message: "Could not reach the AI assistant. Please try again." });
    }
  });
}
