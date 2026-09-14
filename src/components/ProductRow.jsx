import React, { useState } from 'react';

export default function ProductRow({ product, isSelected, onSelect, onEdit, onDelete }) {
  const [imgError, setImgError] = useState(false);

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition duration-150">
      {/* Checkbox */}
      <td className="py-4 px-6 w-12">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(product.id)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
        />
      </td>

      {/* Product Image & Name */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {!imgError && product.image ? (
              <img
                src={product.image}
                alt={product.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-slate-400 text-xs font-semibold">No Image</span>
            )}
          </div>
          <span className="font-medium text-slate-800 text-sm">{product.name}</span>
        </div>
      </td>

      {/* SKU */}
      <td className="py-4 px-4 text-sm font-mono text-slate-400 tracking-wider">
        {product.sku}
      </td>

      {/* Category Badge */}
      <td className="py-4 px-4">
        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
          {product.category}
        </span>
      </td>

      {/* Price */}
      <td className="py-4 px-4 text-sm font-semibold text-slate-800">
        ${Number(product.price).toFixed(2)}
      </td>

      {/* Stock */}
      <td className="py-4 px-4 text-sm">
        <span className={product.stock === 0 ? "text-red-500 font-bold" : "text-slate-700 font-medium"}>
          {product.stock}
        </span>
      </td>

      {/* Quick Actions */}
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg text-xs font-medium transition"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg text-xs font-medium transition"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}