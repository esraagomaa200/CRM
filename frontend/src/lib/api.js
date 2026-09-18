// Central API client — every list/detail/mutation in the app goes through here.
// No static data lives in the frontend anymore; the backend (SQLite) is the source of truth.
//
// Dev:  Vite proxies "/api" -> http://localhost:5000 (see vite.config.js),
//       so no env config is needed locally.
// Prod: set VITE_API_URL to the deployed backend, e.g. https://api.example.com/api

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}, token) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

const id = (value) => encodeURIComponent(value);

export const productsApi = {
  list: () => request("/products"),
  get: (productId) => request(`/products/${id(productId)}`),
  create: (payload) =>
    request("/products", { method: "POST", body: JSON.stringify(payload) }),
  update: (productId, payload) =>
    request(`/products/${id(productId)}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (productId) => request(`/products/${id(productId)}`, { method: "DELETE" }),
};

export const customersApi = {
  list: () => request("/customers"),
  get: (customerId) => request(`/customers/${id(customerId)}`),
  create: (payload) =>
    request("/customers", { method: "POST", body: JSON.stringify(payload) }),
  update: (customerId, payload) =>
    request(`/customers/${id(customerId)}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (customerId) => request(`/customers/${id(customerId)}`, { method: "DELETE" }),
};

export const ordersApi = {
  list: () => request("/orders"),
  get: (orderId) => request(`/orders/${id(orderId)}`),
  create: (payload) =>
    request("/orders", { method: "POST", body: JSON.stringify(payload) }),
  updateStatus: (orderId, status) =>
    request(`/orders/${id(orderId)}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  remove: (orderId) => request(`/orders/${id(orderId)}`, { method: "DELETE" }),
};

export const dashboardApi = {
  summary: () => request("/dashboard"),
};

export const analyticsApi = {
  summary: () => request("/analytics"),
};

export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: (token) => request("/auth/me", {}, token),
  updateMe: (payload, token) =>
    request("/auth/me", { method: "PUT", body: JSON.stringify(payload) }, token),
  logout: (token) => request("/auth/logout", { method: "POST" }, token),
};

export const chatApi = {
  ask: (message, history) =>
    request("/chat", { method: "POST", body: JSON.stringify({ message, history }) }),
};
