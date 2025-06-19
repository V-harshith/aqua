"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { ProductRegistrationForm } from './ProductRegistrationForm';

interface DashboardStats {
  totalProducts: number;
  activeSubscriptions: number;
  dueServices: number;
  monthlyRevenue: number;
  pendingInstallations: number;
  warrantyExpiring: number;
}

interface CustomerProduct {
  id: string;
  serial_number: string;
  installation_date: string;
  warranty_end_date: string;
  status: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  product: {
    product_name: string;
    brand: string;
    model: string;
    category: string;
  };
  subscription?: {
    id: string;
    subscription_type: string;
    plan_name: string;
    next_service_due: string;
    status: string;
    amount: number;
  };
}

interface ServiceDue {
  id: string;
  next_service_due: string;
  customer_name: string;
  product_name: string;
  subscription_type: string;
  plan_name: string;
  phone: string;
  address: string;
}

export const ProductManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      showSuccess({ title: message });
    } else {
      showError({ title: message });
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeSubscriptions: 0,
    dueServices: 0,
    monthlyRevenue: 0,
    pendingInstallations: 0,
    warrantyExpiring: 0,
  });
  const [customerProducts, setCustomerProducts] = useState<CustomerProduct[]>([]);
  const [servicesDue, setServicesDue] = useState<ServiceDue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadCustomerProducts(),
        loadServicesDue(),
      ]);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      showToast(error.message || 'Failed to load dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total products
      const { count: totalProducts, error: productsError } = await supabase
        .from('customer_products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (productsError) throw productsError;

      // Get active subscriptions
      const { count: activeSubscriptions, error: subscriptionsError } = await supabase
        .from('product_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (subscriptionsError) throw subscriptionsError;

      // Get services due this month
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { count: dueServices, error: dueServicesError } = await supabase
        .from('product_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('next_service_due', nextMonth.toISOString().split('T')[0]);

      if (dueServicesError) throw dueServicesError;

      // Calculate monthly revenue from active subscriptions
      const { data: revenueData, error: revenueError } = await supabase
        .from('product_subscriptions')
        .select('amount')
        .eq('status', 'active');

      if (revenueError) throw revenueError;

      const monthlyRevenue = revenueData?.reduce((sum, sub) => sum + (sub.amount / 12), 0) || 0;

      // Get warranty expiring in next 3 months
      const threeMonthsFromNow = new Date(today);
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      const { count: warrantyExpiring, error: warrantyError } = await supabase
        .from('customer_products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('warranty_end_date', threeMonthsFromNow.toISOString().split('T')[0]);

      if (warrantyError) throw warrantyError;

      setStats({
        totalProducts: totalProducts || 0,
        activeSubscriptions: activeSubscriptions || 0,
        dueServices: dueServices || 0,
        monthlyRevenue,
        pendingInstallations: 0, // This would need additional tracking
        warrantyExpiring: warrantyExpiring || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadCustomerProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_products')
        .select(`
          id,
          serial_number,
          installation_date,
          warranty_end_date,
          status,
          customer:customer_id (
            first_name,
            last_name,
            email,
            phone
          ),
          product:product_id (
            product_name,
            brand,
            model,
            category
          ),
          product_subscriptions (
            id,
            subscription_type,
            plan_name,
            next_service_due,
            status,
            amount
          )
        `)
        .eq('status', 'active')
        .order('installation_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        customer: Array.isArray(item.customer) ? item.customer[0] : item.customer,
        product: Array.isArray(item.product) ? item.product[0] : item.product,
        subscription: item.product_subscriptions?.[0] || null,
      })) || [];

      setCustomerProducts(formattedData);
    } catch (error) {
      console.error('Error loading customer products:', error);
    }
  };

  const loadServicesDue = async () => {
    try {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { data, error } = await supabase
        .from('product_subscriptions')
        .select(`
          id,
          next_service_due,
          subscription_type,
          plan_name,
          customer_products!inner (
            customer:customer_id (
              first_name,
              last_name,
              phone,
              address
            ),
            product:product_id (
              product_name
            )
          )
        `)
        .eq('status', 'active')
        .lte('next_service_due', nextMonth.toISOString().split('T')[0])
        .order('next_service_due', { ascending: true });

      if (error) throw error;

      const formattedServicesDue = data?.map(item => {
        const customerProduct = Array.isArray(item.customer_products) ? item.customer_products[0] : item.customer_products;
        const customer = Array.isArray(customerProduct.customer) ? customerProduct.customer[0] : customerProduct.customer;
        const product = Array.isArray(customerProduct.product) ? customerProduct.product[0] : customerProduct.product;

        return {
          id: item.id,
          next_service_due: item.next_service_due,
          customer_name: `${customer.first_name} ${customer.last_name}`,
          product_name: product.product_name,
          subscription_type: item.subscription_type,
          plan_name: item.plan_name,
          phone: customer.phone,
          address: customer.address,
        };
      }) || [];

      setServicesDue(formattedServicesDue);
    } catch (error) {
      console.error('Error loading services due:', error);
    }
  };

  const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; color?: string }> = ({ 
    title, 
    value, 
    subtitle, 
    color = 'blue' 
  }) => (
    <Card>
      <div className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full bg-${color}-100 mr-4`}>
            <div className={`w-8 h-8 bg-${color}-500 rounded`}></div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle="Active installations"
          color="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          subtitle="AMC/CMC contracts"
          color="green"
        />
        <StatCard
          title="Services Due"
          value={stats.dueServices}
          subtitle="Next 30 days"
          color="orange"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${stats.monthlyRevenue.toLocaleString()}`}
          subtitle="From subscriptions"
          color="purple"
        />
        <StatCard
          title="Warranty Expiring"
          value={stats.warrantyExpiring}
          subtitle="Next 3 months"
          color="red"
        />
        <StatCard
          title="Pending Installations"
          value={stats.pendingInstallations}
          subtitle="Awaiting technician"
          color="yellow"
        />
      </div>

      {/* Services Due Today */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Due Soon</h3>
          {servicesDue.length > 0 ? (
            <div className="space-y-3">
              {servicesDue.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{service.customer_name}</p>
                    <p className="text-sm text-gray-600">{service.product_name} - {service.plan_name}</p>
                    <p className="text-sm text-gray-500">Due: {new Date(service.next_service_due).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{service.phone}</p>
                    <Button size="sm" variant="outline">
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No services due in the next 30 days.</p>
          )}
        </div>
      </Card>

      {/* Recent Products */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Product Registrations</h3>
          {customerProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warranty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerProducts.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.customer.first_name} {item.customer.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{item.customer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product.product_name}</div>
                          <div className="text-sm text-gray-500">{item.product.brand} {item.product.model}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.serial_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.subscription ? (
                          <div>
                            <div className="text-sm font-medium text-green-900">
                              {item.subscription.subscription_type.toUpperCase()}
                            </div>
                            <div className="text-sm text-green-600">{item.subscription.plan_name}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No subscription</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.warranty_end_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No products registered yet.</p>
          )}
        </div>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <p className="text-gray-600">Manage customer products, registrations, and subscriptions</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'register'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Register Product
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Inventory
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'register' && <ProductRegistrationForm />}
      {activeTab === 'subscriptions' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Management</h3>
            <p className="text-gray-500">Subscription management features coming soon...</p>
          </div>
        </Card>
      )}
      {activeTab === 'inventory' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Management</h3>
            <p className="text-gray-500">Inventory tracking features coming soon...</p>
          </div>
        </Card>
      )}
    </div>
  );
}; 