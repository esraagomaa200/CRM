import React from 'react';

export default function ProductHeader({ totalProducts, onOpenAddModal }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <p className="text-sm text-slate-500 font-medium">{totalProducts} total products</p>
      </div>
      <button
        onClick={onOpenAddModal}
        className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition duration-200"
      >
        <span className="text-xl leading-none">+</span>
        <span>Add Product</span>
      </button>
    </div>
  );
}