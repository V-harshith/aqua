'use client';
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
interface Product {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_level: number;
  unit_price: number;
}
export default function InventoryPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadProducts();
  }, []);
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inventory');
      const result = await response.json();
      if (result.success) {
        setProducts(result.products || []);
      }
    } catch (error) {
      showError({ title: 'Failed to load products' });
    } finally {
      setIsLoading(false);
    }
  };
  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return 'Out of Stock';
    if (current < min) return 'Low Stock';
    return 'In Stock';
  };
  const getStockStatusColor = (current: number, min: number) => {
    if (current === 0) return 'bg-red-100 text-red-800';
    if (current < min) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };
  if (isLoading) {
    return <div className="p-6">Loading inventory...</div>;
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold">{product.name}</h3>
              <span className={`px-2 py-1 rounded text-xs ${getStockStatusColor(product.current_stock, product.min_stock_level)}`}>
                {getStockStatus(product.current_stock, product.min_stock_level)}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Category: {product.category}</p>
              <p>Stock: {product.current_stock}/{product.min_stock_level}</p>
              <p>Price: ₹{product.unit_price}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 