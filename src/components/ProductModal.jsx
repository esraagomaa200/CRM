import React from 'react';
import ProductForm from './ProductForm';

export default function ProductModal({ isOpen, onClose, onSubmit, initialData }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {initialData ? 'Edit Product' : 'Add New Product'}
        </h2>
        <ProductForm initialData={initialData} onSubmit={onSubmit} onCancel={onClose} />
      </div>
    </div>
  );
}