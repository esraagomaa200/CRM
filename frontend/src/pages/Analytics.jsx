import React, { useState, useEffect } from "react";
import { analyticsApi } from "../lib/api";
import { Download } from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

const BRAND = "#5b4fe5";
const ORDERS_LINE = "#4f46e5";
const REVENUE_LINE = "#10b981";

const CHANNEL_COLORS = {
  Direct: "#4338ca",
  "Organic Search": "#6366f1",
  "Social Media": "#10b981",
  "Paid Ads": "#f59e0b",
  Referral: "#f43f5e",
};

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCompact(value) {
  const num = Number(value || 0);
  if (Math.abs(num) >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  return formatMoney(num);
}

function Delta({ value }) {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  return (
    <p className={`text-xs font-semibold mt-1.5 ${up ? "text-emerald-600" : "text-rose-500"}`}>
      {up ? "+" : ""}
      {value}% <span className="font-normal">vs prior period</span>
    </p>
  );
}

function KpiCard({ label, value, delta }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex-1 min-w-[220px]">
      <p className="text-xs font-medium text-slate-400 tracking-wide">{label}</p>
      <p className="text-[26px] leading-8 font-bold text-slate-900 mt-2">{value}</p>
      <Delta value={delta} />
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sm:p-6">
      <p className="font-bold text-slate-900 text-[15px]">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function exportCsv(data) {
  const lines = ["section,metric,value"];
  const { kpis, deltas, revenueByMonth, ordersByDay, salesChannels, revenueByCategory } = data;
  lines.push(`kpis,total_revenue,${kpis.totalRevenue}`);
  lines.push(`kpis,total_orders,${kpis.totalOrders}`);
  lines.push(`kpis,avg_order_value,${kpis.avgOrderValue}`);
  lines.push(`kpis,delivered_rate_pct,${kpis.deliveredRate}`);
  lines.push(`kpis,revenue_delta_pct,${deltas?.revenue ?? ""}`);
  lines.push(`kpis,orders_delta_pct,${deltas?.orders ?? ""}`);
  lines.push(`kpis,avg_delta_pct,${deltas?.avg ?? ""}`);
  revenueByMonth.forEach((m) => lines.push(`revenue_by_month,${m.ym},${m.value}`));
  ordersByDay.forEach((d) => lines.push(`orders_by_day,${d.day},${d.orders}`));
  salesChannels.forEach((c) => lines.push(`sales_channels,${c.name},${c.value}`));
  revenueByCategory.forEach((c) => lines.push(`revenue_by_category,${c.name},${c.revenue}`));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "analytics.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    analyticsApi
      .summary()
      .then((summary) => {
        if (!cancelled) {
          setData(summary);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load analytics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500 py-20">Loading analytics…</div>;
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
        {error || "Failed to load analytics"} — make sure the backend is running
        (`npm run dev` in `backend/`).
      </div>
    );
  }

  const { kpis, deltas, revenueByMonth, ordersByDay, salesChannels, revenueByCategory } = data;
  const last7 = revenueByMonth.slice(-7);
  const rangeLabel =
    last7.length > 0 ? `${last7[0].month} – ${last7[last7.length - 1].month} ${last7[last7.length - 1].year} · All channels` : "";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold text-slate-900 mb-1">Analytics & Reports</h1>
          <p className="text-sm text-slate-400">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => exportCsv(data)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-[10px] px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-brand text-white rounded-[10px] px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Download size={15} />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="flex flex-wrap gap-4 mb-6">
        <KpiCard label="TOTAL REVENUE" value={formatCompact(kpis.totalRevenue)} delta={deltas?.revenue} />
        <KpiCard label="TOTAL ORDERS" value={Number(kpis.totalOrders).toLocaleString()} delta={deltas?.orders} />
        <KpiCard label="AVG ORDER VALUE" value={formatMoney(kpis.avgOrderValue)} delta={deltas?.avg} />
      </div>

      {/* Revenue by month */}
      <div className="mb-6">
        <Card title="Revenue by Month" subtitle="Monthly revenue vs orders placed">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7} margin={{ left: -5, right: 5 }}>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v) => `$${v / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v) => [formatMoney(v), "Revenue"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="value" fill={BRAND} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Orders & revenue, last 7 days */}
      <div className="mb-6">
        <Card title="Orders & Revenue" subtitle="Orders vs revenue (last 7 days)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersByDay} margin={{ left: -15, right: 5 }}>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="orders"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis yAxisId="revenue" orientation="right" hide />
                <Tooltip
                  formatter={(v, name) =>
                    name === "revenue" ? [formatMoney(v), "Revenue"] : [`${v}`, "Orders"]
                  }
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke={ORDERS_LINE}
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke={REVENUE_LINE}
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: ORDERS_LINE }} />
              Orders
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded-full" style={{ backgroundColor: REVENUE_LINE }} />
              Revenue
            </span>
          </div>
        </Card>
      </div>

      {/* Sales channels */}
      <div className="mb-6">
        <Card title="Sales Channels">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesChannels}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {salesChannels.map((entry) => (
                      <Cell key={entry.name} fill={CHANNEL_COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${v} orders`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full space-y-3">
              {salesChannels.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5 text-slate-600">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHANNEL_COLORS[c.name] || "#94a3b8" }}
                    />
                    {c.name}
                  </span>
                  <span className="font-bold text-slate-900">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue by category */}
      <div>
        <Card title="Revenue by Category">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByCategory} layout="vertical" margin={{ left: 10, right: 15 }}>
                <CartesianGrid horizontal={false} stroke="#eef2f7" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${v / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={95}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v) => [formatMoney(v), "Revenue"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill={BRAND} radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
