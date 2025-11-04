"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalInventoryValue: number;
  categoriesCount: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock_level: number;
  unit_price: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  supplier?: { name: string; contact: string };
  last_restocked: string;
  created_at: string;
}

interface StockAlert {
  id: string;
  product_name: string;
  current_stock: number;
  min_stock_level: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  days_until_out: number;
}

interface InventoryMovement {
  id: string;
  product_name: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  timestamp: string;
  user_name: string;
}

export const ProductManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalInventoryValue: 0,
    categoriesCount: 0
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'product_manager') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadProductStats(),
        loadProducts(),
        loadStockAlerts(),
        loadInventoryMovements()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError({ title: 'Failed to load dashboard data' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductStats = async () => {
    try {
      const response = await fetch('/api/dashboard/overview?type=product_manager');
      const result = await response.json();

      if (result.success) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Error loading product stats:', error);
      showError({ title: 'Failed to load product statistics' });
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/inventory');
      const result = await response.json();

      if (result.success) {
        setProducts(result.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showError({ title: 'Failed to load products' });
    }
  };

  const loadStockAlerts = async () => {
    try {
      const response = await fetch('/api/inventory?action=alerts');
      const result = await response.json();

      if (result.success) {
        setStockAlerts(result.alerts || []);
      }
    } catch (error) {
      console.error('Error loading stock alerts:', error);
      showError({ title: 'Failed to load stock alerts' });
    }
  };

  const loadInventoryMovements = async () => {
    try {
      const mockMovements: InventoryMovement[] = [
        {
          id: '1',
          product_name: 'Water Filter Cartridge Type A',
          movement_type: 'in',
          quantity: 50,
          reason: 'Purchase order #PO-001',
          timestamp: new Date().toISOString(),
          user_name: 'Product Manager'
        },
        {
          id: '2',
          product_name: 'RO Membrane 75 GPD',
          movement_type: 'out',
          quantity: 5,
          reason: 'Service installation',
          timestamp: new Date().toISOString(),
          user_name: 'Technician A'
        }
      ];

      setRecentMovements(mockMovements);
    } catch (error) {
      console.error('Error loading inventory movements:', error);
      showError({ title: 'Failed to load inventory movements' });
    }
  };

  const restockProduct = async (productId: string, quantity: number) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restock',
          productId,
          quantity,
          reason: 'Manual restock'
        })
      });

      const result = await response.json();

      if (result.success) {
        showSuccess({ title: result.message || 'Product restocked successfully' });
        loadDashboardData();
      } else {
        showError({ title: result.error || 'Failed to restock product' });
      }
    } catch (error: any) {
      console.error('Error restocking product:', error);
      showError({ title: error.message || 'Failed to restock product' });
    }
  };

  const adjustStock = async (productId: string, newQuantity: number, reason: string) => {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust',
          productId,
          quantity: newQuantity,
          reason
        })
      });

      const result = await response.json();

      if (result.success) {
        showSuccess({ title: result.message || 'Stock adjusted successfully' });
        loadDashboardData();
      } else {
        showError({ title: result.error || 'Failed to adjust stock' });
      }
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      showError({ title: error.message || 'Failed to adjust stock' });
    }
  };

  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (currentStock <= minStock * 0.5) return { status: 'Critical', color: 'text-red-600 bg-red-100' };
    if (currentStock <= minStock) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-100';
      case 'out': return 'text-red-600 bg-red-100';
      case 'adjustment': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showSuccess({ title: 'Signed out successfully' });
      router.replace('/');
    } catch (err: any) {
      showError({ title: 'Sign out failed', message: err.message });
    }
  };

  if (user?.role !== 'product_manager') {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p>You don't have permission to access the product manager dashboard.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Dashboard Header */}
      <Card>
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Manager Dashboard</h1>
            <p className="text-gray-600">Inventory and Product Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={loadDashboardData}
              variant="secondary"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </Button>
            <Button
              onClick={handleSignOut}
              variant="danger"
              size="sm"
            >
              🚪 Sign Out
            </Button>
          </div>
        </div>
      </Card>

      {/* Product Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Products</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Active Products</h3>
          <p className="text-2xl font-bold text-green-600">{stats.activeProducts}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Low Stock</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.lowStockProducts}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Out of Stock</h3>
          <p className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Inventory Value</h3>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalInventoryValue)}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Categories</h3>
          <p className="text-2xl font-bold text-indigo-600">{stats.categoriesCount}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Alerts */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Stock Alerts</h2>
            <Button
              onClick={loadDashboardData}
              className="bg-blue-600 hover:bg-blue-700 text-sm"
            >
              Refresh
            </Button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stockAlerts.map((alert) => (
              <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.product_name}</h4>
                    <p className="text-sm text-gray-600">
                      Stock: {alert.current_stock} / Min: {alert.min_stock_level}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {alert.days_until_out === 0 ? 'Out of stock' : `${alert.days_until_out} days until out`}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => restockProduct(alert.id, alert.min_stock_level * 2)}
                    className="bg-green-600 hover:bg-green-700 text-xs"
                  >
                    Quick Restock
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Products */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Inventory</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {products.map((product) => {
              const stockStatus = getStockStatus(product.current_stock, product.min_stock_level);
              return (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.category}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(product.unit_price)} per {product.unit}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${stockStatus.color}`}>
                      {stockStatus.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">
                      Stock: {product.current_stock} {product.unit}s
                    </span>
                    {product.supplier && (
                      <span className="text-xs text-blue-600">
                        {product.supplier.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Movements */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Movements</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentMovements.map((movement) => (
              <div key={movement.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{movement.product_name}</h4>
                    <p className="text-sm text-gray-600">{movement.reason}</p>
                    <p className="text-xs text-gray-500">by {movement.user_name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${getMovementColor(movement.movement_type)}`}>
                      {movement.movement_type}
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {movement.movement_type === 'out' ? '-' : '+'}
                      {movement.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(movement.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions and Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/products'}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              🏭 Product Management
            </Button>
            <Button 
              onClick={() => window.location.href = '/products/new'}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              📦 Add New Product
            </Button>
            <Button 
              onClick={() => window.location.href = '/inventory/restock'}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              📈 Restock Inventory
            </Button>
            <Button 
              onClick={() => window.location.href = '/reports/inventory'}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              📊 Inventory Reports
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Filters</span>
              <span className="text-sm font-medium text-blue-600">18 items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Membranes</span>
              <span className="text-sm font-medium text-green-600">12 items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tanks</span>
              <span className="text-sm font-medium text-purple-600">8 items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pumps</span>
              <span className="text-sm font-medium text-orange-600">7 items</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Stock Turnover</span>
              <span className="text-sm font-medium text-green-600">Good</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Dead Stock</span>
              <span className="text-sm font-medium text-yellow-600">2 items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Reorder Point</span>
              <span className="text-sm font-medium text-red-600">8 items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Stock Accuracy</span>
              <span className="text-sm font-medium text-green-600">98.5%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Supplier Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplier Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">12</p>
            <p className="text-sm text-gray-600">Active Suppliers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">95%</p>
            <p className="text-sm text-gray-600">On-time Delivery</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">₹85,500</p>
            <p className="text-sm text-gray-600">Monthly Purchases</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">4.2/5</p>
            <p className="text-sm text-gray-600">Avg Quality Rating</p>
          </div>
        </div>
      </Card>
    </div>
  );
};