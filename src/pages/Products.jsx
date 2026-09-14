import React, { useState, useMemo } from 'react';
import { initialProducts } from '../data/products';
import ProductHeader from '../components/ProductHeader';
import ProductFilters from '../components/ProductFilters';
import ProductTable from '../components/ProductTable';
import Pagination from '../components/Pagination';
import ProductModal from '../components/ProductModal';
import DeleteModal from '../components/DeleteModal';

export default function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // مثل الصورة (Showing 1–6 of 8)

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Extract Categories dynamically
  const categories = useMemo(() => {
    return Array.from(new Set(initialProducts.map((p) => p.category)));
  }, []);

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

  // Handlers
  const handleSaveProduct = (formData) => {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...formData } : p))
      );
    } else {
      setProducts((prev) => [
        { ...formData, id: Date.now() },
        ...prev,
      ]);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingProduct) {
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setDeletingProduct(null);
    }
  };

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