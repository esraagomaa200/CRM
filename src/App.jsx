import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import Customers from "./pages/Customers";
import Products from "./pages/Products";

function Placeholder({ title }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Placeholder title="Dashboard" />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Placeholder title="Orders" />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/analytics" element={<Placeholder title="Analytics" />} />
        <Route path="*" element={<Navigate to="/customers" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
