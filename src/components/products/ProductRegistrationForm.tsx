"use client";
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
interface Product {
  id: string;
  product_code: string;
  product_name: string;
  category: string;
  brand: string;
  model: string;
  description: string;
  base_price: number;
  warranty_months: number;
}
interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
}
interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}
interface ProductRegistrationData {
  customer_id: string;
  product_id: string;
  serial_number: string;
  installation_date: string;
  installation_address: string;
  installation_technician_id: string;
  subscription_type: 'none' | 'amc' | 'cmc';
  subscription_plan: string;
  subscription_amount: number;
  subscription_duration: number;
}
export const ProductRegistrationForm: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      showSuccess({ title: message });
    } else {
      showError({ title: message });
    }
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductRegistrationData>({
    customer_id: '',
    product_id: '',
    serial_number: '',
    installation_date: new Date().toISOString().split('T')[0],
    installation_address: '',
    installation_technician_id: '',
    subscription_type: 'none',
    subscription_plan: '',
    subscription_amount: 0,
    subscription_duration: 12,
  });
  const [subscriptionPlans] = useState({
    amc: [
      { name: 'Basic AMC', amount: 2000, duration: 12, services: ['Quarterly service', 'Filter replacement'] },
      { name: 'Premium AMC', amount: 3500, duration: 12, services: ['Monthly service', 'All consumables', 'Emergency support'] },
    ],
    cmc: [
      { name: 'Comprehensive CMC', amount: 5000, duration: 12, services: ['All AMC services', 'Part replacement', 'Annual overhaul'] },
      { name: 'Premium CMC', amount: 8000, duration: 12, services: ['All services', 'Upgrade support', '24/7 emergency'] },
    ],
  });
  useEffect(() => {
    loadInitialData();
  }, []);
  const loadInitialData = async () => {
    try {
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('status', 'active');
      if (productsError) throw productsError;
      setProducts(productsData || []);
      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, phone, address')
        .eq('role', 'customer')
        .eq('status', 'active');
      if (customersError) throw customersError;
      setCustomers(customersData || []);
      // Load technicians
      const { data: techniciansData, error: techniciansError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('role', 'technician')
        .eq('status', 'active');
      if (techniciansError) throw techniciansError;
      setTechnicians(techniciansData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      showToast(error.message || 'Failed to load data', 'error');
    }
  };
  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setFormData(prev => ({ ...prev, product_id: productId }));
  };
  const handleSubscriptionTypeChange = (type: 'none' | 'amc' | 'cmc') => {
    setFormData(prev => ({
      ...prev,
      subscription_type: type,
      subscription_plan: '',
      subscription_amount: 0,
    }));
  };
  const handleSubscriptionPlanChange = (planName: string) => {
    const plans = formData.subscription_type === 'amc' ? subscriptionPlans.amc : subscriptionPlans.cmc;
    const plan = plans.find(p => p.name === planName);
    if (plan) {
      setFormData(prev => ({
        ...prev,
        subscription_plan: planName,
        subscription_amount: plan.amount,
        subscription_duration: plan.duration,
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.product_id || !formData.serial_number) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setIsLoading(true);
    try {
      // Create customer product registration
      const warrantyEndDate = new Date(formData.installation_date);
      warrantyEndDate.setMonth(warrantyEndDate.getMonth() + (selectedProduct?.warranty_months || 12));
      const { data: customerProduct, error: productError } = await supabase
        .from('customer_products')
        .insert([{
          customer_id: formData.customer_id,
          product_id: formData.product_id,
          serial_number: formData.serial_number,
          installation_date: formData.installation_date,
          installation_address: formData.installation_address,
          installation_technician_id: formData.installation_technician_id || null,
          warranty_end_date: warrantyEndDate.toISOString().split('T')[0],
          status: 'active',
        }])
        .select()
        .single();
      if (productError) throw productError;
      // Create subscription if selected
      if (formData.subscription_type !== 'none' && formData.subscription_plan) {
        const subscriptionStartDate = new Date(formData.installation_date);
        const subscriptionEndDate = new Date(subscriptionStartDate);
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + formData.subscription_duration);
        const nextServiceDate = new Date(subscriptionStartDate);
        nextServiceDate.setMonth(nextServiceDate.getMonth() + 3); // First service after 3 months
        const plans = formData.subscription_type === 'amc' ? subscriptionPlans.amc : subscriptionPlans.cmc;
        const planDetails = plans.find(p => p.name === formData.subscription_plan);
        const { error: subscriptionError } = await supabase
          .from('product_subscriptions')
          .insert([{
            customer_product_id: customerProduct.id,
            subscription_type: formData.subscription_type,
            plan_name: formData.subscription_plan,
            start_date: subscriptionStartDate.toISOString().split('T')[0],
            end_date: subscriptionEndDate.toISOString().split('T')[0],
            amount: formData.subscription_amount,
            services_included: planDetails?.services || [],
            service_frequency: formData.subscription_type === 'amc' ? 90 : 60, // Days
            status: 'active',
            next_service_due: nextServiceDate.toISOString().split('T')[0],
            total_services_allowed: formData.subscription_type === 'amc' ? 4 : 6,
            created_by: user?.id,
          }]);
        if (subscriptionError) throw subscriptionError;
      }
      showToast('Product registered successfully!', 'success');
      // Reset form
      setFormData({
        customer_id: '',
        product_id: '',
        serial_number: '',
        installation_date: new Date().toISOString().split('T')[0],
        installation_address: '',
        installation_technician_id: '',
        subscription_type: 'none',
        subscription_plan: '',
        subscription_amount: 0,
        subscription_duration: 12,
      });
      setSelectedProduct(null);
    } catch (error: any) {
      console.error('Error registering product:', error);
      showToast(error.message || 'Failed to register product', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Registration</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer *
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product *
                </label>
                <select
                  value={formData.product_id}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.product_name} - {product.brand} {product.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Product Details */}
            {selectedProduct && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Selected Product Details</h3>
                <p className="text-blue-800">
                  {selectedProduct.description} - ₹{selectedProduct.base_price.toLocaleString()} 
                  ({selectedProduct.warranty_months} months warranty)
                </p>
              </div>
            )}
            {/* Installation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number *
                </label>
                <Input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                  placeholder="Enter product serial number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installation Date *
                </label>
                <Input
                  type="date"
                  value={formData.installation_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, installation_date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Installation Address *
              </label>
              <textarea
                value={formData.installation_address}
                onChange={(e) => setFormData(prev => ({ ...prev, installation_address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter installation address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Installation Technician
              </label>
              <select
                value={formData.installation_technician_id}
                onChange={(e) => setFormData(prev => ({ ...prev, installation_technician_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Technician (Optional)</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.first_name} {tech.last_name}
                  </option>
                ))}
              </select>
            </div>
            {/* Subscription Options */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="subscription_type"
                    value="none"
                    checked={formData.subscription_type === 'none'}
                    onChange={(e) => handleSubscriptionTypeChange(e.target.value as 'none')}
                    className="text-blue-600"
                  />
                  <span>No Subscription</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="subscription_type"
                    value="amc"
                    checked={formData.subscription_type === 'amc'}
                    onChange={(e) => handleSubscriptionTypeChange(e.target.value as 'amc')}
                    className="text-blue-600"
                  />
                  <span>AMC (Annual Maintenance)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="subscription_type"
                    value="cmc"
                    checked={formData.subscription_type === 'cmc'}
                    onChange={(e) => handleSubscriptionTypeChange(e.target.value as 'cmc')}
                    className="text-blue-600"
                  />
                  <span>CMC (Comprehensive Maintenance)</span>
                </label>
              </div>
              {formData.subscription_type !== 'none' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subscription Plan
                    </label>
                    <select
                      value={formData.subscription_plan}
                      onChange={(e) => handleSubscriptionPlanChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Plan</option>
                      {(formData.subscription_type === 'amc' ? subscriptionPlans.amc : subscriptionPlans.cmc).map(plan => (
                        <option key={plan.name} value={plan.name}>
                          {plan.name} - ₹{plan.amount.toLocaleString()}/year
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.subscription_plan && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900">Plan Includes:</h4>
                      <ul className="text-green-800 list-disc list-inside mt-2">
                        {(formData.subscription_type === 'amc' ? subscriptionPlans.amc : subscriptionPlans.cmc)
                          .find(p => p.name === formData.subscription_plan)?.services.map((service, index) => (
                          <li key={index}>{service}</li>
                        ))}
                      </ul>
                      <p className="text-green-900 font-semibold mt-2">
                        Total: ₹{formData.subscription_amount.toLocaleString()}/year
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormData({
                    customer_id: '',
                    product_id: '',
                    serial_number: '',
                    installation_date: new Date().toISOString().split('T')[0],
                    installation_address: '',
                    installation_technician_id: '',
                    subscription_type: 'none',
                    subscription_plan: '',
                    subscription_amount: 0,
                    subscription_duration: 12,
                  });
                  setSelectedProduct(null);
                }}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? 'Registering...' : 'Register Product'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}; 