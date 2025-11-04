'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function SettingsPage() {
  const { userProfile } = useAuthContext();
  const { success: showSuccess } = useToast();
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    darkMode: false,
    language: 'en',
    timezone: 'Asia/Kolkata'
  });

  const handlePreferenceChange = (key: string, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const savePreferences = () => {
    // TODO: Implement preferences saving to backend
    showSuccess({ title: 'Settings saved successfully' });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your application preferences and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Account Settings</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Profile Information</h3>
                <p className="text-sm text-gray-600">Update your personal information</p>
              </div>
              <Link href="/profile">
                <Button variant="outline" size="sm">Edit Profile</Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Password</h3>
                <p className="text-sm text-gray-600">Change your account password</p>
              </div>
              <Link href="/reset-password">
                <Button variant="outline" size="sm">Change Password</Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Account Status</h3>
                <p className="text-sm text-gray-600">
                  {userProfile?.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userProfile?.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {userProfile?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Notification Preferences</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-600">Receive browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(e) => handlePreferenceChange('pushNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-600">Receive notifications via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.smsNotifications}
                  onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Application Preferences */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Application Preferences</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Language</h3>
                <p className="text-sm text-gray-600">Choose your preferred language</p>
              </div>
              <select
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Timezone</h3>
                <p className="text-sm text-gray-600">Your local timezone</p>
              </div>
              <select
                value={preferences.timezone}
                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Mumbai">Asia/Mumbai (IST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Dark Mode</h3>
                <p className="text-sm text-gray-600">Use dark theme (Coming Soon)</p>
              </div>
              <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                <input
                  type="checkbox"
                  checked={preferences.darkMode}
                  disabled
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">System Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Version:</span>
                <p className="text-gray-600">1.0.0</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">User ID:</span>
                <p className="text-gray-600 font-mono text-xs">{userProfile?.id?.slice(0, 8)}...</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Role:</span>
                <p className="text-gray-600">{userProfile?.role?.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Data Export</h3>
                  <p className="text-sm text-gray-600">Download your account data</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={savePreferences}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}