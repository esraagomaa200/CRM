import React, { useMemo, useState, useEffect } from "react";
import { customersApi } from "../lib/api";

const SEGMENTS = {
  vip: "VIP",
  regular: "Regular",
  new: "New",
  "at-risk": "At Risk",
};

const TABS = ["all", "vip", "new", "regular", "at-risk"];
const PAGE_SIZE = 6;

const BADGE_CLASSES = {
  vip: "bg-vip-bg text-vip-text",
  regular: "bg-regular-bg text-regular-text",
  new: "bg-new-bg text-new-text",
  "at-risk": "bg-risk-bg text-risk-text",
};

const EMPTY_FORM = {
  name: "",
  email: "",
  segment: "new",
  location: "",
};

function getInitials(name) {
  const parts = name.trim().split(" ");
  const first = parts[0] || "";
  const last = parts[parts.length - 1] || "";

  return `${first[0] || ""}${last[0] || ""}`;
}

function IconSearch() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    customersApi
      .list()
      .then((data) => {
        if (!cancelled) {
          setCustomers(data);
          setLoadError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "Failed to load customers");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const counts = useMemo(() => {
    const base = {
      all: customers.length,
      vip: 0,
      new: 0,
      regular: 0,
      "at-risk": 0,
    };

    customers.forEach((customer) => {
      if (base[customer.segment] !== undefined) {
        base[customer.segment] += 1;
      }
    });

    return base;
  }, [customers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesTab = tab === "all" || customer.segment === tab;

      const matchesSearch =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [customers, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const rangeStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  function handleTabChange(nextTab) {
    setTab(nextTab);
    setPage(1);
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function openAddModal() {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setFormError("");
  }

  function handleFormChange(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setFormError("");
  }

  async function handleAddCustomer(event) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const location = form.location.trim();

    if (!name || !email) {
      setFormError("Name and email are required.");
      return;
    }

    try {
      const newCustomer = await customersApi.create({
        name,
        email,
        segment: form.segment,
        location,
      });

      setCustomers((currentCustomers) => [newCustomer, ...currentCustomers]);

      setShowAddModal(false);
      setForm(EMPTY_FORM);
      setFormError("");
      setTab("all");
      setSearch("");
      setPage(1);
    } catch (err) {
      setFormError(err.message || "Failed to add customer.");
    }
  }

  async function handleDeleteCustomer(id) {
    const confirmed = window.confirm("Remove this customer?");

    if (!confirmed) {
      return;
    }

    try {
      await customersApi.remove(id);
      setCustomers((currentCustomers) =>
        currentCustomers.filter((customer) => customer.id !== id),
      );
    } catch (err) {
      window.alert(err.message || "Failed to delete customer.");
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-20">Loading customers…</div>;
  }

  return (
    <div>
      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
          {loadError} — make sure the backend is running (`npm run dev` in `backend/`).
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 mb-1">
            Customers
          </h1>

          <p className="text-sm text-gray-500">
            {customers.length} total customers
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 bg-brand text-white rounded-[10px] px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <IconPlus />
          Add Customer
        </button>
      </div>

      {/* Tabs */}
      <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-[10px] p-1.5 my-6 overflow-x-auto max-w-full">
        {TABS.map((key) => (
          <button
            type="button"
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              tab === key
                ? "bg-brand text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {key === "all" ? "All" : SEGMENTS[key]}

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                tab === key
                  ? "bg-white/25 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-[14px] p-3 w-full shadow-sm mb-5">
        <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 w-full max-w-[480px] text-gray-400">
          <IconSearch />

          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="border-none outline-none bg-transparent text-sm w-full text-gray-900 min-w-0"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-full">
        <div className="overflow-x-auto">
          <table className="border-collapse min-w-[900px] w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Customer",
                  "Segment",
                  "Location",
                  "Orders",
                  "LTV",
                  "Last Order",
                  "Joined",
                  "",
                ].map((header, index) => (
                  <th
                    key={`${header}-${index}`}
                    className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 px-5 py-3.5 border-b border-gray-200 whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paged.map((customer) => (
                <tr
                  key={customer.id}
                  className="bg-white hover:bg-gray-50 transition-colors"
                >
                  {/* Customer */}
                  <td className="px-5 py-4 border-b border-gray-200 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
                          BADGE_CLASSES[customer.segment]
                        }`}
                      >
                        {getInitials(customer.name)}
                      </span>

                      <div>
                        <span className="font-semibold text-sm text-gray-900 block">
                          {customer.name}
                        </span>

                        <span className="text-xs text-gray-500">
                          {customer.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Segment */}
                  <td className="px-5 py-4 border-b border-gray-200 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        BADGE_CLASSES[customer.segment]
                      }`}
                    >
                      {SEGMENTS[customer.segment]}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900 whitespace-nowrap">
                    {customer.location}
                  </td>

                  {/* Orders */}
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-900 whitespace-nowrap">
                    {customer.orders}
                  </td>

                  {/* LTV */}
                  <td className="px-5 py-4 border-b border-gray-200 font-bold text-brand tabular-nums text-sm whitespace-nowrap">
                    $
                    {customer.ltv.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Last Order */}
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-500 whitespace-nowrap">
                    {customer.lastOrder}
                  </td>

                  {/* Joined */}
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-500 whitespace-nowrap">
                    {customer.joined}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 border-b border-gray-200 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        className="bg-transparent border-none text-brand text-sm font-medium hover:underline cursor-pointer"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="bg-transparent border-none text-risk-text text-sm font-medium hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    No customers match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 text-[13px] text-gray-500 border-t border-gray-100">
          <span>
            Showing {rangeStart}–{rangeEnd} of {filtered.length}
          </span>

          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 text-sm disabled:opacity-40"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (number) => (
                <button
                  type="button"
                  key={number}
                  onClick={() => setPage(number)}
                  className={`w-8 h-8 rounded-lg border text-sm ${
                    number === currentPage
                      ? "bg-brand border-brand text-white"
                      : "bg-white border-gray-200 text-gray-500"
                  }`}
                >
                  {number}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 text-sm disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeAddModal}
        >
          <div
            className="bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-md p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Customer</h2>

              <button
                type="button"
                onClick={closeAddModal}
                className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
              >
                <IconClose />
              </button>
            </div>

            <form onSubmit={handleAddCustomer}>
              <div className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      handleFormChange("name", event.target.value)
                    }
                    placeholder="Full name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      handleFormChange("email", event.target.value)
                    }
                    placeholder="name@email.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 outline-none"
                  />
                </div>

                {/* Segment */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Segment
                  </label>

                  <select
                    value={form.segment}
                    onChange={(event) =>
                      handleFormChange("segment", event.target.value)
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 outline-none"
                  >
                    {Object.entries(SEGMENTS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                    Location
                  </label>

                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) =>
                      handleFormChange("location", event.target.value)
                    }
                    placeholder="City, State"
                    className="w-full bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 outline-none"
                  />
                </div>

                {formError && (
                  <p className="text-sm text-risk-text">{formError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="rounded-[10px] px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white bg-brand hover:opacity-90"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
