"use client";
import React from 'react';
import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { useToastContext } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
interface ComplaintData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'water_quality' | 'delivery' | 'billing' | 'service' | 'technical' | 'other';
  location?: string;
  phone?: string;
}
interface ComplaintFormProps {
  onSubmit: (data: ComplaintData) => Promise<void>;
  loading?: boolean;
}
export default function ComplaintForm({ onSubmit, loading = false }: ComplaintFormProps) {
  const { userProfile } = useAuthContext();
  const { success, error: showError, info } = useToastContext();
  const [formData, setFormData] = useState<ComplaintData>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'service',
    location: '',
    phone: userProfile?.phone || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const categoryOptions = [
    { value: 'water_quality', label: '💧 Water Quality', description: 'Issues with water taste, smell, or appearance' },
    { value: 'delivery', label: '🚚 Delivery', description: 'Late or missed water deliveries' },
    { value: 'billing', label: '💰 Billing', description: 'Payment or billing issues' },
    { value: 'service', label: '🔧 Service', description: 'Customer service problems' },
    { value: 'technical', label: '⚙️ Technical', description: 'Equipment or technical issues' },
    { value: 'other', label: '📝 Other', description: 'Other complaints or feedback' }
  ];
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800', description: 'Non-urgent, can wait' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800', description: 'Normal priority' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800', description: 'Needs quick attention' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800', description: 'Immediate attention required' }
  ];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters';
    if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'service',
        location: '',
        phone: userProfile?.phone || ''
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
    }
  };
  const handleInputChange = (field: keyof ComplaintData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-gray-900">Submit a Complaint</h2>
        <p className="text-gray-600">
          Please provide details about your issue so we can assist you promptly.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complaint Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief summary of the issue"
              error={errors.title}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                disabled={loading}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                disabled={loading}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Please provide detailed information about your complaint..."
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Address or location of the issue"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Phone number for follow-up"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  priority: 'medium',
                  category: 'service',
                  location: '',
                  phone: userProfile?.phone || ''
                });
                setErrors({});
              }}
              disabled={loading}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 