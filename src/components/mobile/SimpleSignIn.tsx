"use client";
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
export const SimpleSignIn: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const handleSignIn = async () => {
    if (!phone || !password) {
      showError({ title: 'कृपया फोन नंबर और पासवर्ड डालें / Please enter phone and password' });
      return;
    }
    setIsLoading(true);
    try {
      // Convert phone to email format for existing auth system
      const email = `${phone}@projectaqua.com`;
      await signIn(email, password);
      showSuccess({ title: 'सफलतापूर्वक लॉगिन हो गए / Successfully logged in' });
    } catch (error: any) {
      showError({ title: 'लॉगिन नहीं हो सका / Login failed' });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-8xl mb-6">💧</div>
          <h1 className="text-4xl font-bold text-white mb-4">
            प्रोजेक्ट अक्वा
          </h1>
          <p className="text-xl text-blue-100">
            Project Aqua Water Management
          </p>
        </div>
        {/* Sign In Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            <span className="block text-xl text-gray-600 mb-2">लॉगिन करें</span>
            Sign In
          </h2>
          <div className="space-y-6">
            {/* Phone Input */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                <span className="block">📱 फोन नंबर</span>
                <span className="text-sm text-gray-500">Phone Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                autoComplete="tel"
              />
            </div>
            {/* Password Input */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                <span className="block">🔒 पासवर्ड</span>
                <span className="text-sm text-gray-500">Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                autoComplete="current-password"
              />
            </div>
            {/* Sign In Button */}
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full py-6 text-2xl font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  <span>लॉगिन हो रहा है...</span>
                </div>
              ) : (
                <span>
                  🚀 लॉगिन करें / Sign In
                </span>
              )}
            </Button>
            {/* Help Section */}
            <div className="text-center pt-6">
              <p className="text-gray-600 mb-4">
                मदद चाहिए? / Need Help?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.open('tel:+919876543210')}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                >
                  📞 मदद के लिए कॉल करें / Call for Help
                </button>
                <button
                  onClick={() => alert('Admin से संपर्क करें: +91-9876543210')}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
                >
                  🔑 पासवर्ड भूल गए? / Forgot Password?
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Quick Login Shortcuts */}
        <div className="mt-8 bg-white/20 rounded-2xl p-6 backdrop-blur-sm">
          <p className="text-white text-center mb-4 font-medium">
            जल्दी लॉगिन / Quick Login
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setPhone('admin');
                setPassword('admin123');
              }}
              className="py-3 bg-white/30 hover:bg-white/40 text-white rounded-xl text-sm backdrop-blur-sm transition-all"
            >
              👨‍💼 Admin
            </button>
            <button
              onClick={() => {
                setPhone('technician');
                setPassword('tech123');
              }}
              className="py-3 bg-white/30 hover:bg-white/40 text-white rounded-xl text-sm backdrop-blur-sm transition-all"
            >
              🔧 Technician
            </button>
          </div>
        </div>
        {/* Version Info */}
        <div className="text-center mt-6 text-white/70 text-sm">
          प्रोजेक्ट अक्वा v1.0 | Made with ❤️ for India
        </div>
      </div>
    </div>
  );
}; 