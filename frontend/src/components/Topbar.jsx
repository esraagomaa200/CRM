import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NOTIFICATIONS = [
  {
    id: 1,
    color: "bg-brand",
    title: "New order received",
    desc: "ORD-4819 from Priya Sharma",
    time: "2 min ago",
  },
  {
    id: 2,
    color: "bg-amber-500",
    title: "Low stock alert",
    desc: "Ergonomic Standing Desk — 23 left",
    time: "18 min ago",
  },
  {
    id: 3,
    color: "bg-red-500",
    title: "Refund processed",
    desc: "ORD-4818 — $179.99 refunded",
    time: "1 hr ago",
  },
];

function IconSearch() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export default function Topbar({ onMenuClick }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.name || "Guest";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSignOut() {
    setProfileOpen(false);
    logout();
    navigate("/signin", { replace: true });
  }

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center px-4 md:px-8">
      <div className="flex items-center justify-between w-full">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <IconMenu />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-gray-400">
            <IconSearch />

            <input
              type="text"
              placeholder="Search..."
              className="w-40 md:w-56 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <IconBell />

            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
          </button>

          {/* Notifications */}
          {open && (
            <div className="absolute top-[calc(100%+12px)] right-0 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <strong className="text-sm text-gray-900">
                  Notifications
                </strong>

                <button
                  type="button"
                  className="text-brand text-xs font-semibold hover:underline"
                >
                  Mark all read
                </button>
              </div>

              {/* Notification list */}
              <div>
                {NOTIFICATIONS.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex gap-3 px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${notification.color} mt-1.5 shrink-0`}
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {notification.desc}
                      </p>

                      <p className="text-[11px] text-gray-400 mt-1.5">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile / sign out */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
              {initials}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute top-[calc(100%+12px)] right-0 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}