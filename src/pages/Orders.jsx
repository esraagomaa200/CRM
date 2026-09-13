import React, { useState } from 'react';

export default function Orders() {
    const [orders, setOrders] = useState(
        JSON.parse(localStorage.getItem('crm_orders_styled')) || [
            { id: '#ORD-101', customer: 'Marisol Vega', product: 'Dell Laptop', price: 25000, status: 'Delivered' },
            { id: '#ORD-102', customer: 'Theo Nakamura', product: 'Samsung Mobile', price: 12000, status: 'Processing' }
        ]
    );

    const [currentFilter, setCurrentFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [newCustomer, setNewCustomer] = useState('');
    const [newProduct, setNewProduct] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newStatus, setNewStatus] = useState('Processing');

    const updateStatus = (index, newStatus) => {
        const updated = [...orders];
        updated[index].status = newStatus;
        setOrders(updated);
        localStorage.setItem('crm_orders_styled', JSON.stringify(updated));
    };

    const deleteOrder = (index) => {
        if (confirm('Are you sure you want to delete this order?')) {
            const updated = orders.filter((_, i) => i !== index);
            setOrders(updated);
            localStorage.setItem('crm_orders_styled', JSON.stringify(updated));
        }
    };

    const handleAddOrder = (e) => {
        e.preventDefault();
        const newOrder = {
            id: '#ORD-' + Math.floor(100 + Math.random() * 900),
            customer: newCustomer,
            product: newProduct,
            price: newPrice,
            status: newStatus
        };
        const updated = [...orders, newOrder];
        setOrders(updated);
        localStorage.setItem('crm_orders_styled', JSON.stringify(updated));
        
        setNewCustomer('');
        setNewProduct('');
        setNewPrice('');
        
        const modalEl = document.getElementById('addOrderModal');
        const modal = window.bootstrap?.Modal?.getInstance(modalEl);
        if (modal) modal.hide();
    };

    const filteredOrders = orders.filter(order => {
        const matchesFilter = currentFilter === 'All' || order.status === currentFilter;
        const matchesSearch = order.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              order.product.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const processingCount = orders.filter(o => o.status === 'Processing').length;
    const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
    const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;

    return (
        <div className="container-fluid px-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1"><i className="fas fa-shopping-cart text-primary me-2"></i> Orders</h2>
                    <p className="text-muted mb-0">{orders.length} total orders</p>
                </div>
                <button className="btn btn-primary shadow-sm" data-bs-toggle="modal" data-bs-target="#addOrderModal">
                    <i className="fas fa-plus me-1"></i> Add Order
                </button>
            </div>

            <div className="mb-4">
                <button className={`btn btn-sm me-2 px-3 rounded-pill ${currentFilter === 'All' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setCurrentFilter('All')}>
                    All <span className="badge bg-white text-primary ms-1">{orders.length}</span>
                </button>
                <button className={`btn btn-sm me-2 px-3 rounded-pill ${currentFilter === 'Processing' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setCurrentFilter('Processing')}>
                    Processing <span className="badge bg-secondary ms-1">{processingCount}</span>
                </button>
                <button className={`btn btn-sm me-2 px-3 rounded-pill ${currentFilter === 'Delivered' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setCurrentFilter('Delivered')}>
                    Delivered <span className="badge bg-secondary ms-1">{deliveredCount}</span>
                </button>
                <button className={`btn btn-sm px-3 rounded-pill ${currentFilter === 'Cancelled' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setCurrentFilter('Cancelled')}>
                    Cancelled <span className="badge bg-secondary ms-1">{cancelledCount}</span>
                </button>
            </div>

            <div className="mb-4">
                <div className="input-group shadow-sm bg-white rounded-3">
                    <span className="input-group-text bg-transparent border-0 ps-3"><i className="fas fa-search text-muted"></i></span>
                    <input type="text" className="form-control border-0 shadow-none py-2" placeholder="Search by customer name or product..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-uppercase fs-7 text-muted">
                                <tr>
                                    <th className="ps-4">Order ID</th>
                                    <th>Customer Name</th>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th className="text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => {
                                    const realIndex = orders.findIndex(o => o.id === order.id);
                                    let badgeClass = 'bg-secondary';
                                    if (order.status === 'Processing') badgeClass = 'bg-warning text-dark';
                                    else if (order.status === 'Delivered') badgeClass = 'bg-success';
                                    else if (order.status === 'Cancelled') badgeClass = 'bg-danger';

                                    return (
                                        <tr key={order.id}>
                                            <td className="ps-4 fw-semibold text-dark">{order.id}</td>
                                            <td>{order.customer}</td>
                                            <td className="text-muted">{order.product}</td>
                                            <td className="fw-bold">{Number(order.price).toLocaleString()} EGP</td>
                                            <td>
                                                <select className={`form-select form-select-sm w-auto d-inline-block ${badgeClass} text-white border-0`} value={order.status} onChange={(e) => updateStatus(realIndex, e.target.value)}>
                                                    <option value="Processing" className="bg-white text-dark">Processing</option>
                                                    <option value="Delivered" className="bg-white text-dark">Delivered</option>
                                                    <option value="Cancelled" className="bg-white text-dark">Cancelled</option>
                                                </select>
                                            </td>
                                            <td className="text-end pe-4">
                                                <button className="btn btn-sm btn-light text-danger" onClick={() => deleteOrder(realIndex)} title="Delete Order">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <div className="modal fade" id="addOrderModal" tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold"><i className="fas fa-plus-circle text-primary me-1"></i> Add New Order</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleAddOrder}>
                                <div className="mb-3">
                                    <label className="form-label">Customer Name</label>
                                    <input type="text" className="form-control" placeholder="e.g. Marisol Vega" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Product Name</label>
                                    <input type="text" className="form-control" placeholder="e.g. Dell Laptop" value={newProduct} onChange={(e) => setNewProduct(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Price (EGP)</label>
                                    <input type="number" className="form-control" placeholder="e.g. 25000" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Order Status</label>
                                    <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                                        <option value="Processing">Processing</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary w-100 py-2">Save Order</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}