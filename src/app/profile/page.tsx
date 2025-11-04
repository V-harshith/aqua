'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { validateName, validatePhone, validateEmail } from '@/lib/validation';
import { LoadingSpinner, FormSkeleton } from '@/components/ui/LoadingStates';

export default function ProfilePage() {
  const { userProfile, user, updateProfile } = useAuthContext();
  const { success: showSuccess, error: showError } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    department: '',
    employee_id: '',
    address: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
        department: userProfile.department || '',
        employee_id: userProfile.employee_id || '',
        address: userProfile.address || ''
      });
    }
  }, [userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = () => {
    const validationErrors: string[] = [];

    // Validate name
    const nameValidation = validateName(formData.full_name);
    if (!nameValidation.isValid) {
      validationErrors.push(...nameValidation.errors);
    }

    // Validate phone (optional)
    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        validationErrors.push(...phoneValidation.errors);
      }
    }

    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);
    
    try {
      await updateProfile({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || undefined,
        department: formData.department.trim() || undefined,
        employee_id: formData.employee_id.trim() || undefined,
        address: formData.address.trim() || undefined
      });
      
      showSuccess({ title: 'Profile updated successfully' });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showError({ title: 'Failed to update profile', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userProfile) {
    return <FormSkeleton />;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Account Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                  {user?.email}
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                  {userProfile.role?.replace('_', ' ').toUpperCase()}
                </div>
                <p className="text-xs text-gray-500 mt-1">Role is managed by administrators</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userProfile.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {userProfile.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <div className="text-gray-600">
                  {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Personal Information</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Display */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Full Name *"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <Input
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Enter your department"
                  />
                </div>

                <div>
                  <Input
                    label="Employee ID"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    placeholder="Enter your employee ID"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your address"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </div>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Security</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Password</h3>
                  <p className="text-sm text-gray-600">Change your account password</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/reset-password'}
                >
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Account Security</h3>
                  <p className="text-sm text-gray-600">Last login: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  ✓ Secure
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}