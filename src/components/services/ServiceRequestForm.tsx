"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';

interface ServiceType {
  id: string;
  type_code: string;
  type_name: string;
  category: string;
  description: string;
  estimated_duration: number;
  base_price: number;
  is_emergency: boolean;
}

interface CustomerProduct {
  id: string;
  serial_number: string;
  product: {
    product_name: string;
    brand: string;
    model: string;
  };
  installation_address: string;
}

interface ServiceRequestData {
  customer_product_id: string;
  service_type_id: string;
  priority: string;
  preferred_date: string;
  preferred_time_slot: string;
  customer_address: string;
  contact_phone: string;
  problem_description: string;
  customer_notes: string;
}

export const ServiceRequestForm: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      showSuccess({ title: message });
    } else {
      showError({ title: message });
    }
  };

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [customerProducts, setCustomerProducts] = useState<CustomerProduct[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CustomerProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  const [formData, setFormData] = useState<ServiceRequestData>({
    customer_product_id: '',
    service_type_id: '',
    priority: 'normal',
    preferred_date: '',
    preferred_time_slot: 'anytime',
    customer_address: '',
    contact_phone: user?.phone || '',
    problem_description: '',
    customer_notes: '',
  });

  const priorityOptions = [
    { value: 'low', label: 'Low Priority', description: 'Can wait a few days' },
    { value: 'normal', label: 'Normal Priority', description: 'Within 1-2 days' },
    { value: 'high', label: 'High Priority', description: 'Within 24 hours' },
    { value: 'urgent', label: 'Urgent', description: 'Same day service needed' },
    { value: 'emergency', label: 'Emergency', description: 'Immediate assistance required' },
  ];

  const timeSlots = [
    { value: 'morning', label: 'Morning (9 AM - 12 PM)' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
    { value: 'evening', label: 'Evening (5 PM - 8 PM)' },
    { value: 'anytime', label: 'Anytime (Flexible)' },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.priority === 'emergency') {
      setIsEmergency(true);
    } else {
      setIsEmergency(false);
    }
  }, [formData.priority]);

  const loadInitialData = async () => {
    try {
      // Load service types
      const { data: serviceTypesData, error: serviceTypesError } = await supabase
        .from('service_types')
        .select('*')
        .eq('status', 'active')
        .order('category', { ascending: true });

      if (serviceTypesError) throw serviceTypesError;
      setServiceTypes(serviceTypesData || []);

      // Load customer's products
      const { data: productsData, error: productsError } = await supabase
        .from('customer_products')
        .select(`
          id,
          serial_number,
          installation_address,
          product:product_id (
            product_name,
            brand,
            model
          )
        `)
        .eq('customer_id', user?.id)
        .eq('status', 'active');

      if (productsError) throw productsError;
      
      const formattedProducts = productsData?.map(item => ({
        ...item,
        product: Array.isArray(item.product) ? item.product[0] : item.product,
      })) || [];

      setCustomerProducts(formattedProducts);

      // Pre-fill contact phone if available
      if (user?.phone) {
        setFormData(prev => ({ ...prev, contact_phone: user.phone || '' }));
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      showToast(error.message || 'Failed to load data', 'error');
    }
  };

  const handleServiceTypeChange = (serviceTypeId: string) => {
    const serviceType = serviceTypes.find(st => st.id === serviceTypeId);
    setSelectedServiceType(serviceType || null);
    setFormData(prev => ({ 
      ...prev, 
      service_type_id: serviceTypeId,
      priority: serviceType?.is_emergency ? 'emergency' : 'normal'
    }));
  };

  const handleProductChange = (productId: string) => {
    const product = customerProducts.find(p => p.id === productId);
    setSelectedProduct(product || null);
    setFormData(prev => ({ 
      ...prev, 
      customer_product_id: productId,
      customer_address: product?.installation_address || ''
    }));
  };

  const generateRequestNumber = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `SR-${timestamp}-${random}`.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.service_type_id || !formData.problem_description) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (!formData.customer_address || !formData.contact_phone) {
      showToast('Address and contact phone are required', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const requestNumber = generateRequestNumber();
      
      // Set minimum date for emergency requests
      let preferredDate = formData.preferred_date;
      if (formData.priority === 'emergency' && !preferredDate) {
        preferredDate = new Date().toISOString().split('T')[0];
      }

      const serviceRequestData = {
        request_number: requestNumber,
        customer_id: user?.id,
        customer_product_id: formData.customer_product_id || null,
        service_type_id: formData.service_type_id,
        priority: formData.priority,
        preferred_date: preferredDate || null,
        preferred_time_slot: formData.preferred_time_slot,
        customer_address: formData.customer_address,
        contact_phone: formData.contact_phone,
        problem_description: formData.problem_description,
        customer_notes: formData.customer_notes || null,
        source: 'web',
        status: 'pending',
        estimated_cost: selectedServiceType?.base_price || 0,
      };

      const { data, error } = await supabase
        .from('service_requests')
        .insert([serviceRequestData])
        .select()
        .single();

      if (error) throw error;

      showToast(`Service request ${requestNumber} submitted successfully!`, 'success');
      
      // Reset form
      setFormData({
        customer_product_id: '',
        service_type_id: '',
        priority: 'normal',
        preferred_date: '',
        preferred_time_slot: 'anytime',
        customer_address: '',
        contact_phone: (user?.phone as string) || '',
        problem_description: '',
        customer_notes: '',
      });
      setSelectedServiceType(null);
      setSelectedProduct(null);

      // For emergency requests, show additional information
      if (formData.priority === 'emergency') {
        showToast('Emergency request submitted! Our team will contact you within 15 minutes.', 'success');
      }

    } catch (error: any) {
      console.error('Error submitting service request:', error);
      showToast(error.message || 'Failed to submit service request', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Request Service</h2>
            <p className="text-gray-600">Submit a service request for your water system</p>
          </div>

          {isEmergency && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-500 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <h4 className="font-semibold text-red-900">Emergency Service Request</h4>
                  <p className="text-red-800 text-sm">
                    Our emergency response team will contact you within 15 minutes. 
                    For immediate assistance, call our emergency hotline: <strong>1800-AQUA-911</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </label>
              <select
                value={formData.service_type_id}
                onChange={(e) => handleServiceTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Service Type</option>
                {Object.entries(
                  serviceTypes.reduce((acc, serviceType) => {
                    if (!acc[serviceType.category]) {
                      acc[serviceType.category] = [];
                    }
                    acc[serviceType.category].push(serviceType);
                    return acc;
                  }, {} as Record<string, ServiceType[]>)
                ).map(([category, types]) => (
                  <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                    {types.map(serviceType => (
                      <option key={serviceType.id} value={serviceType.id}>
                        {serviceType.type_name} - ₹{serviceType.base_price}
                        {serviceType.is_emergency && ' (Emergency)'}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Service Type Details */}
            {selectedServiceType && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900">{selectedServiceType.type_name}</h4>
                <p className="text-blue-800 text-sm mt-1">{selectedServiceType.description}</p>
                <div className="flex justify-between items-center mt-2 text-sm text-blue-700">
                  <span>Estimated Duration: {selectedServiceType.estimated_duration} minutes</span>
                  <span>Base Price: ₹{selectedServiceType.base_price}</span>
                </div>
              </div>
            )}

            {/* Product Selection (Optional) */}
            {customerProducts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Product (Optional)
                </label>
                <select
                  value={formData.customer_product_id}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Product (if applicable)</option>
                  {customerProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.product.product_name} - {product.product.brand} {product.product.model} 
                      (S/N: {product.serial_number})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {priorityOptions.map(option => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={option.value}
                      checked={formData.priority === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="text-blue-600"
                    />
                    <div>
                      <div className={`text-sm font-medium ${
                        option.value === 'emergency' ? 'text-red-700' : 
                        option.value === 'urgent' ? 'text-orange-700' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Scheduling (not for emergency) */}
            {!isEmergency && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date
                  </label>
                  <Input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <select
                    value={formData.preferred_time_slot}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferred_time_slot: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <Input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="Enter contact phone number"
                  required
                />
              </div>
            </div>

            {/* Service Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Address *
              </label>
              <textarea
                value={formData.customer_address}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter complete address where service is needed"
                required
              />
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Description *
              </label>
              <textarea
                value={formData.problem_description}
                onChange={(e) => setFormData(prev => ({ ...prev, problem_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Please describe the problem in detail. The more information you provide, the better we can assist you."
                required
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.customer_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any additional information, special instructions, or access details"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormData({
                    customer_product_id: '',
                    service_type_id: '',
                    priority: 'normal',
                    preferred_date: '',
                    preferred_time_slot: 'anytime',
                    customer_address: '',
                    contact_phone: user?.phone || '',
                    problem_description: '',
                    customer_notes: '',
                  });
                  setSelectedServiceType(null);
                  setSelectedProduct(null);
                }}
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className={`min-w-[150px] ${
                  isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Submitting...' : isEmergency ? 'Submit Emergency Request' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}; 