import React, { useState, useMemo, useEffect } from 'react';
import { productsApi } from '../lib/api';
import ProductHeader from '../components/ProductHeader';
import ProductFilters from '../components/ProductFilters';
import ProductTable from '../components/ProductTable';
import Pagination from '../components/Pagination';
import ProductModal from '../components/ProductModal';
import DeleteModal from '../components/DeleteModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productsApi
      .list()
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load products');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // مثل الصورة (Showing 1–6 of 8)

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Extract Categories dynamically from server data
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  // Filter Products Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Paginate Logic
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Handlers (persisted to backend)
  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct) {
        const updated = await productsApi.update(editingProduct.id, formData);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? updated : p))
        );
      } else {
        const created = await productsApi.create(formData);
        setProducts((prev) => [created, ...prev]);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      alert(err.message || 'Failed to save product');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingProduct) {
      try {
        await productsApi.remove(deletingProduct.id);
        setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
        setDeletingProduct(null);
      } catch (err) {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-8 text-center text-slate-500 py-20">
        Loading products…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error} — make sure the backend is running (`npm run dev` in `backend/`).
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <ProductHeader
        totalProducts={products.length}
        onOpenAddModal={() => {
          setEditingProduct(null);
          setIsProductModalOpen(true);
        }}
      />

      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />

      <ProductTable
        products={currentProducts}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onEdit={(product) => {
          setEditingProduct(product);
          setIsProductModalOpen(true);
        }}
        onDelete={(product) => setDeletingProduct(product)}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
      />

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleSaveProduct}
        initialData={editingProduct}
      />

      <DeleteModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteConfirm}
        productName={deletingProduct?.name}
      />
    </div>
  );
}