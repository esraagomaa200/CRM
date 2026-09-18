import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ChatWidget from "./ChatWidget";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full min-w-0">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 min-w-0 w-full p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}