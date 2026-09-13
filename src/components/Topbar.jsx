import React, { useState } from "react";

const NOTIFICATIONS = [
  { id: 1, color: "bg-brand", title: "New order received", desc: "ORD-4819 from Priya Sharma", time: "2 min ago" },
  { id: 2, color: "bg-amber-500", title: "Low stock alert", desc: "Ergonomic Standing Desk — 23 left", time: "18 min ago" },
  { id: 3, color: "bg-red-500", title: "Refund processed", desc: "ORD-4818 — $179.99 refunded", time: "1 hr ago" },
];

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function Topbar({ onMenuClick }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between gap-3 md:gap-6 px-4 md:px-8 py-4 bg-white border-b border-gray-200 sticky top-0 z-20">
      <button className="md:hidden text-gray-500 shrink-0" onClick={onMenuClick}>
        <IconMenu />
      </button>

      <div className="flex-1 max-w-[520px] flex items-center gap-2.5 bg-appbg border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-gray-400 min-w-0">
        <IconSearch />
        <input
          type="text"
          placeholder="Search orders, products, customers..."
          className="border-none bg-transparent outline-none text-sm text-gray-900 w-full min-w-0"
        />
      </div>

      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        <div className="relative">
          <button
            className="relative bg-transparent border-none text-gray-500 cursor-pointer p-1.5 flex hover:bg-gray-100 rounded-lg transition-colors duration-200"
            onClick={() => setOpen((v) => !v)}
          >
            <IconBell />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
          </button>

          {open && (
  <div className="absolute top-[calc(100%+12px)] right-0 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">

    <div className="flex items-center justify-between px-5 py-4 text-sm border-b border-gray-100">
  <strong>Notifications</strong>

  <button className="bg-transparent border-none text-brand text-xs font-semibold cursor-pointer">
    Mark all read
  </button>
</div>

    <ul className="flex flex-col list-none m-0 p-0">
      {NOTIFICATIONS.map((n) => (
        <li
          key={n.id}
          className="flex gap-2.5 items-start px-5 py-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${n.color}`}
          />

          <div>
            <div className="text-[13px] font-semibold text-gray-900">
              {n.title}
            </div>

            <div className="text-sm text-gray-500 mt-0.5">
              {n.desc}
            </div>

            <div className="text-xs text-gray-400 mt-1">
              {n.time}
            </div>
          </div>
        </li>
      ))}
    </ul>

  </div>
)}
        </div>

        <div className="hidden sm:flex items-center gap-2.5">
          <span className="w-[34px] h-[34px] rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
            JK
          </span>
          <span className="text-sm font-semibold text-gray-900">Jordan Kim</span>
        </div>
      </div>
    </header>
  );
}