"use client";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthContext } from '@/context/AuthContext';
import { useToastContext } from '@/context/ToastContext';

interface ServiceType {
  id: string;
  type_code: string;
  type_name: string;
  category: string;
  description: string;
  estimated_duration: number;
  base_price: number;
  requires_parts: boolean;
  skill_level: string;
  priority_level: number;
  is_emergency: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

const categories = [
  'installation',
  'maintenance', 
  'repair',
  'inspection'
];

const skillLevels = [
  'basic',
  'intermediate',
  'advanced',
  'expert'
];

export default function ServiceTypesPage() {
  const { user } = useAuthContext();
  const { success, error } = useToastContext();
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [formData, setFormData] = useState({
    type_code: '',
    type_name: '',
    category: 'maintenance',
    description: '',
    estimated_duration: 60,
    base_price: 0,
    requires_parts: false,
    skill_level: 'basic',
    priority_level: 3,
    is_emergency: false,
    status: 'active'
  });

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      const response = await fetch('/api/service-types');
      if (response.ok) {
        const data = await response.json();
        setServiceTypes(data);
      } else {
        error({ title: 'Failed to fetch service types' });
      }
    } catch (err) {
      console.error('Error fetching service types:', err);
      error({ title: 'Error loading service types' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = '/api/service-types';
      const method = editingType ? 'PUT' : 'POST';
      const body = editingType 
        ? { ...formData, id: editingType.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        success({
          title: editingType ? 'Service type updated successfully' : 'Service type created successfully'
        });
        resetForm();
        fetchServiceTypes();
      } else {
        const errorData = await response.json();
        error({ title: errorData.error || 'Failed to save service type' });
      }
    } catch (err) {
      console.error('Error saving service type:', err);
      error({ title: 'Error saving service type' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (serviceType: ServiceType) => {
    setEditingType(serviceType);
    setFormData({
      type_code: serviceType.type_code,
      type_name: serviceType.type_name,
      category: serviceType.category,
      description: serviceType.description,
      estimated_duration: serviceType.estimated_duration,
      base_price: serviceType.base_price,
      requires_parts: serviceType.requires_parts,
      skill_level: serviceType.skill_level,
      priority_level: serviceType.priority_level,
      is_emergency: serviceType.is_emergency,
      status: serviceType.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service type?')) {
      return;
    }

    try {
      const response = await fetch(`/api/service-types?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        success({ title: 'Service type deleted successfully' });
        fetchServiceTypes();
      } else {
        const errorData = await response.json();
        error({ title: errorData.error || 'Failed to delete service type' });
      }
    } catch (err) {
      console.error('Error deleting service type:', err);
      error({ title: 'Error deleting service type' });
    }
  };

  const resetForm = () => {
    setFormData({
      type_code: '',
      type_name: '',
      category: 'maintenance',
      description: '',
      estimated_duration: 60,
      base_price: 0,
      requires_parts: false,
      skill_level: 'basic',
      priority_level: 3,
      is_emergency: false,
      status: 'active'
    });
    setEditingType(null);
    setShowForm(false);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  if (loading && serviceTypes.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Service Types Management</h1>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Service Types Management</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Add New Service Type
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">
              {editingType ? 'Edit Service Type' : 'Add New Service Type'}
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type Code</label>
                  <Input
                    type="text"
                    value={formData.type_code}
                    onChange={(e) => setFormData({ ...formData, type_code: e.target.value })}
                    placeholder="e.g., INSTALL_RO"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type Name</label>
                  <Input
                    type="text"
                    value={formData.type_name}
                    onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
                    placeholder="e.g., RO System Installation"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Skill Level</label>
                  <select
                    value={formData.skill_level}
                    onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {skillLevels.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Duration (minutes)</label>
                  <Input
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Base Price (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority Level (1-5)</label>
                  <Input
                    type="number"
                    value={formData.priority_level}
                    onChange={(e) => setFormData({ ...formData, priority_level: parseInt(e.target.value) })}
                    min="1"
                    max="5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Service description..."
                  required
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.requires_parts}
                    onChange={(e) => setFormData({ ...formData, requires_parts: e.target.checked })}
                    className="mr-2"
                  />
                  Requires Parts
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_emergency}
                    onChange={(e) => setFormData({ ...formData, is_emergency: e.target.checked })}
                    className="mr-2"
                  />
                  Emergency Service
                </label>
              </div>
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? 'Saving...' : editingType ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Service Types ({serviceTypes.length})</h2>
        </CardHeader>
        <CardContent>
          {serviceTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No service types found.</p>
              <Button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add First Service Type
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Code</th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Duration</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Skill Level</th>
                    <th className="text-left py-3 px-4">Priority</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceTypes.map((serviceType) => (
                    <tr key={serviceType.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{serviceType.type_code}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{serviceType.type_name}</div>
                          {serviceType.is_emergency && (
                            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                              Emergency
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">{serviceType.category}</td>
                      <td className="py-3 px-4">{formatDuration(serviceType.estimated_duration)}</td>
                      <td className="py-3 px-4">{formatPrice(serviceType.base_price)}</td>
                      <td className="py-3 px-4 capitalize">{serviceType.skill_level}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          serviceType.priority_level >= 4 ? 'bg-red-100 text-red-800' :
                          serviceType.priority_level >= 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {serviceType.priority_level}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          serviceType.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {serviceType.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(serviceType)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(serviceType.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
