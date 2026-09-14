import React, { useState } from "react";
import {
  LayoutGrid,
  ShoppingBag,
  ShoppingCart,
  Users,
  LineChart as LineChartIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const revenueData = [
  { month: "Mar", value: 38000 },
  { month: "Apr", value: 42000 },
  { month: "May", value: 51000 },
  { month: "Jun", value: 47000 },
  { month: "Jul", value: 55000 },
  { month: "Aug", value: 62000 },
  { month: "Sep", value: 71000 },
];

const topProducts = [
  { name: "USB-C Hub 12-in-1", units: 3182 },
  { name: "Mechanical Keyboard Pro", units: 2341 },
  { name: "Wireless Noise-Cancelling Headphones", units: 1847 },
  { name: "Ultra HD Monitor 27\"", units: 928 },
  { name: "Smart Home Hub", units: 784 },
];

const orders = [
  {
    id: "ORD-4821",
    customer: "Marisol Vega",
    email: "marisol.vega@email.com",
    product: "Wireless Noise-Cancelling Headphones",
    amount: "$289.99",
    status: "Delivered",
    date: "2026-08-28",
  },
  {
    id: "ORD-4820",
    customer: "Theo Nakamura",
    email: "theo.nakamura@email.com",
    product: "Ergonomic Standing Desk",
    amount: "$649.00",
    status: "Shipped",
    date: "2026-09-01",
  },
  {
    id: "ORD-4819",
    customer: "Priya Sharma",
    email: "priya.sharma@email.com",
    product: "Ultra HD Monitor 27\"",
    amount: "$429.50",
    status: "Pending",
    date: "2026-09-02",
  },
  {
    id: "ORD-4818",
    customer: "Rafael Okafor",
    email: "rafael.okafor@email.com",
    product: "Mechanical Keyboard Pro",
    amount: "$179.99",
    status: "Cancelled",
    date: "2026-08-30",
  },
  {
    id: "ORD-4817",
    customer: "Sienna Holbrook",
    email: "sienna.holbrook@email.com",
    product: "Smart Home Hub + Sensors",
    amount: "$218.00",
    status: "Delivered",
    date: "2026-08-25",
  },
  {
    id: "ORD-4816",
    customer: "Leon Marchetti",
    email: "leon.marchetti@email.com",
    product: "Portable Power Station",
    amount: "$349.00",
    status: "Shipped",
    date: "2026-09-01",
  },
];

const statusStyles = {
  Delivered: "bg-emerald-50 text-emerald-600",
  Shipped: "bg-sky-50 text-sky-600",
  Pending: "bg-amber-50 text-amber-600",
  Cancelled: "bg-rose-50 text-rose-600",
};

// const navItems = [
//   { label: "Dashboard", icon: LayoutGrid, active: true },
//   { label: "Products", icon: ShoppingBag },
//   { label: "Orders", icon: ShoppingCart },
//   { label: "Customers", icon: Users },
//   { label: "Analytics", icon: LineChartIcon },
// ];

function StatCard({ label, value, delta, deltaDirection, deltaLabel }) {
  const isUp = deltaDirection === "up";
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex-1 min-w-[220px]">
      <p className="text-xs font-medium text-slate-400 tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-slate-800 mt-2">{value}</p>
      <div className="flex items-center gap-1 mt-2 text-xs">
        <span
          className={`flex items-center gap-0.5 font-medium ${
            isUp ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {delta}
        </span>
        <span className="text-slate-400">{deltaLabel}</span>
      </div>
    </div>
  );
}

export default function NexaCRMDashboard() {
  const [collapsed, setCollapsed] = useState(false);

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
              value="$342,180"
              delta="12.4%"
              deltaDirection="up"
              deltaLabel="vs last month"
            />
            <StatCard
              label="ACTIVE ORDERS"
              value="1,284"
              delta="8.1%"
              deltaDirection="up"
              deltaLabel="vs last week"
            />
            <StatCard
              label="NEW CUSTOMERS"
              value="389"
              delta="3.2%"
              deltaDirection="down"
              deltaLabel="vs last month"
            />
            <StatCard
              label="CONVERSION RATE"
              value="4.78%"
              delta="0.6%"
              deltaDirection="up"
              deltaLabel="vs last month"
            />
          </div>

          {/* Chart + Top products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Revenue Trend</p>
                  <p className="text-xs text-slate-400 mt-0.5">Mar – Sep 2026</p>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  +12.4% MoM
                </span>
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
              <div className="space-y-3.5">
                {topProducts.map((p) => {
                  const max = topProducts[0].units;
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
            </div>
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-slate-800 text-sm">Recent Orders</p>
              <button className="text-xs font-medium text-indigo-600 hover:underline">
                View all
              </button>
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
                      <td className="py-3 pr-4 text-slate-700 font-medium">{o.amount}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[o.status]}`}
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