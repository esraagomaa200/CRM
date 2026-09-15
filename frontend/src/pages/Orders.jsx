import React, { useState, useEffect } from 'react';
import { ordersApi, customersApi } from '../lib/api';

const FILTERS = ['All', 'Processing', 'Delivered', 'Cancelled'];
const CHANNELS = ['Direct', 'Organic Search', 'Social Media', 'Paid Ads', 'Referral'];

const STATUS_BADGE = {
    Processing: 'bg-amber-100 text-amber-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-600',
};

const STATUS_DOT = {
    Processing: 'bg-amber-500',
    Delivered: 'bg-green-500',
    Cancelled: 'bg-red-500',
};

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [currentFilter, setCurrentFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState('');
    const [newProduct, setNewProduct] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newStatus, setNewStatus] = useState('Processing');
    const [newChannel, setNewChannel] = useState('Direct');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([ordersApi.list(), customersApi.list()])
            .then(([ordersData, customersData]) => {
                if (!cancelled) {
                    setOrders(ordersData);
                    setCustomers(customersData);
                    setLoadError('');
                }
            })
            .catch((err) => {
                if (!cancelled) setLoadError(err.message || 'Failed to load orders');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const updateStatus = async (id, nextStatus) => {
        try {
            const updated = await ordersApi.updateStatus(id, nextStatus);
            setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
        } catch (err) {
            alert(err.message || 'Failed to update order');
        }
    };

    const deleteOrder = async (id) => {
        if (confirm('Are you sure you want to delete this order?')) {
            try {
                await ordersApi.remove(id);
                setOrders((prev) => prev.filter((o) => o.id !== id));
            } catch (err) {
                alert(err.message || 'Failed to delete order');
            }
        }
    };

    const handleAddOrder = async (e) => {
        e.preventDefault();
        try {
            const created = await ordersApi.create({
                customer: newCustomer,
                product: newProduct,
                price: Number(newPrice) || 0,
                status: newStatus,
                channel: newChannel,
            });
            setOrders((prev) => [created, ...prev]);

            setNewCustomer('');
            setNewProduct('');
            setNewPrice('');
            setNewStatus('Processing');
            setNewChannel('Direct');
            setShowAddModal(false);
        } catch (err) {
            alert(err.message || 'Failed to add order');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesFilter = currentFilter === 'All' || order.status === currentFilter;
        const matchesSearch = order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.product.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const counts = {
        All: orders.length,
        Processing: orders.filter(o => o.status === 'Processing').length,
        Delivered: orders.filter(o => o.status === 'Delivered').length,
        Cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };

    if (loading) {
        return <div className="text-center text-gray-500 py-20">Loading orders…</div>;
    }

    return (
        <div>
            {loadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                    {loadError} — make sure the backend is running (`npm run dev` in `backend/`).
                </div>
            )}
            {/* Header — نفس ستايل Customers */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 mb-1">
                        Orders
                    </h1>
                    <p className="text-sm text-gray-500">
                        {orders.length} total orders
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-brand text-white rounded-[10px] px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
                >
                    <i className="fas fa-plus text-xs"></i>
                    Add Order
                </button>
            </div>

            {/* Filters — نفس ستايل Tabs في Customers */}
            <div className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-[10px] p-1.5 my-6 overflow-x-auto max-w-full">
                {FILTERS.map((filter) => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => setCurrentFilter(filter)}
                        className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                            currentFilter === filter
                                ? 'bg-brand text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {filter}
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                currentFilter === filter
                                    ? 'bg-white/25 text-white'
                                    : 'bg-gray-100 text-gray-500'
                            }`}
                        >
                            {counts[filter]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search — نفس ستايل Customers */}
            <div className="bg-white border border-gray-200 rounded-[14px] p-3 w-full shadow-sm mb-5">
                <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 w-full max-w-[480px] text-gray-400">
                    <i className="fas fa-search text-sm"></i>
                    <input
                        type="text"
                        placeholder="Search by customer name or product..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-none outline-none bg-transparent text-sm w-full text-gray-900 min-w-0"
                    />
                </div>
            </div>

            {/* Table — نفس ستايل Customers */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-full">
                <div className="overflow-x-auto">
                    <table className="border-collapse min-w-[900px] w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Order ID', 'Customer Name', 'Product', 'Price', 'Status', ''].map((header, index) => (
                                    <th
                                        key={`${header}-${index}`}
                                        className={`text-xs font-semibold uppercase tracking-wide text-gray-500 px-5 py-3.5 border-b border-gray-200 whitespace-nowrap ${index === 5 ? 'text-right' : 'text-left'}`}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => {
                                return (
                                    <tr key={order.id} className="bg-white hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4 border-b border-gray-200 whitespace-nowrap font-semibold text-sm text-gray-900">
                                            {order.id}
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 whitespace-nowrap text-sm text-gray-900">
                                            {order.customer}
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 whitespace-nowrap text-sm text-gray-500">
                                            {order.product}
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 whitespace-nowrap font-bold text-brand tabular-nums text-sm">
                                            ${Number(order.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-2 rounded-full pl-2 pr-1 py-1 text-xs font-semibold ${STATUS_BADGE[order.status]}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[order.status]}`}></span>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                                    className="bg-transparent border-none outline-none text-xs font-semibold cursor-pointer pr-1"
                                                    aria-label={`Change status for ${order.id}`}
                                                >
                                                    <option value="Processing">Processing</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 border-b border-gray-200 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => deleteOrder(order.id)}
                                                    title="Delete Order"
                                                    className="bg-transparent border-none text-risk-text text-sm font-medium hover:underline cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500 text-sm">
                                        No orders match this search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal — نفس ستايل Customers (React state بدل Bootstrap JS) */}
            {showAddModal && (
                <div
                    className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        className="bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900">Add New Order</h2>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-xl leading-none"
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleAddOrder}>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                        Customer
                                    </label>
                                    {customers.length > 0 ? (
                                        <select
                                            value={newCustomer}
                                            onChange={(e) => setNewCustomer(e.target.value)}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 outline-none"
                                        >
                                            <option value="">Select a customer…</option>
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.name}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder="e.g. Marisol Vega"
                                            value={newCustomer}
                                            onChange={(e) => setNewCustomer(e.target.value)}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 outline-none"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Dell Laptop"
                                        value={newProduct}
                                        onChange={(e) => setNewProduct(e.target.value)}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                        Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 1999"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                        Order Status
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 outline-none"
                                    >
                                        <option value="Processing">Processing</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                        Sales Channel
                                    </label>
                                    <select
                                        value={newChannel}
                                        onChange={(e) => setNewChannel(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-[10px] px-4 py-3 text-sm text-gray-900 outline-none"
                                    >
                                        {CHANNELS.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="rounded-[10px] px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white bg-brand hover:opacity-90"
                                >
                                    Save Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
