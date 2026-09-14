import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../lib/api";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const statusStyles = {
  Delivered: "bg-emerald-50 text-emerald-600",
  Processing: "bg-amber-50 text-amber-600",
  Cancelled: "bg-rose-50 text-rose-600",
};

function StatCard({ label, value, delta, deltaDirection, deltaLabel }) {
  const isUp = deltaDirection === "up";
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex-1 min-w-[220px]">
      <p className="text-xs font-medium text-slate-400 tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 mt-2">{value}</p>
      {delta && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          <span
            className={`flex items-center gap-0.5 font-medium ${
              isUp ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {delta}
          </span>
          {deltaLabel && <span className="text-slate-400">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function NexaCRMDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardApi
      .summary()
      .then((summary) => {
        if (!cancelled) {
          setData(summary);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Loading dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error || "Failed to load dashboard"} — make sure the backend is running
              (`npm run dev` in `backend/`).
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { stats, recentOrders: orders, topProducts, revenueTrend: revenueData } = data;
  const revenueDelta = stats.revenueDelta;
  const trendStart = revenueData.length ? revenueData[0].month : "";
  const trendEnd = revenueData.length ? revenueData[revenueData.length - 1].month : "";

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
    
     

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
       

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Thursday, September 3, 2026</p>
          </div>

          {/* Stat cards */}
          <div className="flex flex-wrap gap-4 mb-6">
            <StatCard
              label="TOTAL REVENUE"
              value={formatMoney(stats.totalRevenue)}
              delta={revenueDelta !== null ? `${revenueDelta >= 0 ? "+" : ""}${revenueDelta}%` : undefined}
              deltaDirection={revenueDelta !== null && revenueDelta < 0 ? "down" : "up"}
              deltaLabel="vs last month"
            />
            <StatCard label="ACTIVE ORDERS" value={String(stats.activeOrders)} />
            <StatCard label="TOTAL CUSTOMERS" value={String(stats.totalCustomers)} />
            <StatCard
              label="TOTAL PRODUCTS"
              value={String(stats.totalProducts)}
              delta={stats.lowStock > 0 ? `${stats.lowStock} low stock` : undefined}
              deltaDirection="down"
            />
          </div>

          {/* Chart + Top products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Revenue Trend</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {trendStart} – {trendEnd} 2026
                  </p>
                </div>
                {revenueDelta !== null && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {revenueDelta >= 0 ? "+" : ""}
                    {revenueDelta}% MoM
                  </span>
                )}
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ left: -20, right: 10 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
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
                      formatter={(v) => [`$${v.toLocaleString()}`, "Revenue"]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#rev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <p className="font-semibold text-slate-800 text-sm mb-4">Top Products</p>
              {topProducts.length === 0 ? (
                <p className="text-xs text-slate-400">No sales yet.</p>
              ) : (
              <div className="space-y-3.5">
                {topProducts.map((p) => {
                  const max = topProducts[0].units || 1;
                  const pct = (p.units / max) * 100;
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 truncate pr-2">{p.name}</span>
                        <span className="text-slate-400 shrink-0">
                          {p.units.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-slate-800 text-sm">Recent Orders</p>
              <Link
                to="/orders"
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="font-medium py-2 pr-4">ORDER ID</th>
                    <th className="font-medium py-2 pr-4">CUSTOMER</th>
                    <th className="font-medium py-2 pr-4">PRODUCT</th>
                    <th className="font-medium py-2 pr-4">AMOUNT</th>
                    <th className="font-medium py-2 pr-4">STATUS</th>
                    <th className="font-medium py-2 pr-4">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="py-3 pr-4 font-medium text-indigo-600">{o.id}</td>
                      <td className="py-3 pr-4">
                        <p className="text-slate-700">{o.customer}</p>
                        <p className="text-xs text-slate-400">{o.email}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 max-w-[220px] truncate">
                        {o.product}
                      </td>
                      <td className="py-3 pr-4 text-slate-700 font-medium">{formatMoney(o.amount)}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[o.status] || "bg-slate-100 text-slate-500"}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-500">{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}