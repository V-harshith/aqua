'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  collectionsToday: number;
  outstandingInvoices: number;
}

interface RecentInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  customer?: { business_name?: string; contact_person?: string };
  created_at: string;
}

interface PaymentSummary {
  date: string;
  totalCollected: number;
  invoicesPaid: number;
  averagePaymentTime: number;
}

export const AccountsManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
    collectionsToday: 0,
    outstandingInvoices: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'accounts_manager') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        'Authorization': `Bearer ${session?.access_token}`
      };

      // Fetch stats
      const statsRes = await fetch('/api/accounts?type=stats', { headers }).then(r => r.json());
      if (statsRes.success) setStats(statsRes.stats);

      // Fetch invoices
      const invRes = await fetch('/api/accounts?type=invoices', { headers }).then(r => r.json());
      if (invRes.success) setRecentInvoices(invRes.invoices);

      // Fetch payments
      const payRes = await fetch('/api/accounts?type=payments', { headers }).then(r => r.json());
      if (payRes.success) {
        setPaymentSummary(payRes.payments.map((p: any) => ({
          date: p.payment_date,
          totalCollected: p.amount,
          invoicesPaid: 1,
          averagePaymentTime: 0
        })));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError({ title: 'Failed to load dashboard data' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFinancialStats = async () => { /* Removed mock util */ };
  const loadRecentInvoices = async () => { /* Removed mock util */ };
  const loadPaymentSummary = async () => { /* Removed mock util */ };

  const generateInvoice = async (customerId: string, amount: number) => {
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_invoice',
          customer_id: customerId,
          amount,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      });

      const result = await response.json();
      if (result.success) {
        showSuccess({ title: 'Invoice generated successfully' });
        loadDashboardData();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      showError({ title: error.message || 'Failed to generate invoice' });
    }
  };

  const sendPaymentReminder = async (invoiceId: string) => {
    try {
      // Mock payment reminder - replace with actual reminder system
      showSuccess({ title: 'Payment reminder sent successfully' });
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      showError({ title: error.message || 'Failed to send reminder' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (user?.role !== 'accounts_manager') {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p>You don't have permission to access the accounts manager dashboard.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Accounts Manager Dashboard</h1>
            <p className="text-gray-600">Financial Management & Collections</p>
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
          </div>
        </div>
      </Card>

      {/* Financial Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Monthly Revenue</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.monthlyRevenue)}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Pending Payments</h3>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingPayments)}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Overdue</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overduePayments)}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Today's Collections</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.collectionsToday)}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Outstanding Invoices</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.outstandingInvoices}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Invoices</h2>
            <Button
              onClick={loadDashboardData}
              className="bg-blue-600 hover:bg-blue-700 text-sm"
            >
              Refresh
            </Button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{invoice.invoice_number}</h4>
                    <p className="text-sm text-gray-600">{formatCurrency(invoice.amount)}</p>
                    {invoice.customer && (
                      <p className="text-xs text-gray-500">
                        {invoice.customer.business_name || invoice.customer.contact_person}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      Due: {new Date(invoice.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {invoice.status === 'pending' && (
                    <Button
                      onClick={() => sendPaymentReminder(invoice.id)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                    >
                      Send Reminder
                    </Button>
                  )}
                  {invoice.status === 'overdue' && (
                    <Button
                      onClick={() => sendPaymentReminder(invoice.id)}
                      className="bg-red-600 hover:bg-red-700 text-xs"
                    >
                      Follow Up
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Summary (Last 7 Days)</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {paymentSummary.map((summary, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {new Date(summary.date).toLocaleDateString()}
                    </h4>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      <span>Collected: {formatCurrency(summary.totalCollected)}</span>
                      <span>Invoices: {summary.invoicesPaid}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Avg Payment Time
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {summary.averagePaymentTime} days
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions and Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              onClick={() => window.location.href = '/invoices/new'}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Generate Invoice
            </Button>
            <Button
              onClick={() => window.location.href = '/payments'}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              💳 Process Payment
            </Button>
            <Button
              onClick={() => window.location.href = '/reports/financial'}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Financial Reports
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Collection Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="text-sm font-medium text-green-600">₹21,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-sm font-medium text-green-600">₹85,200</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Collection Rate</span>
              <span className="text-sm font-medium text-green-600">92%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">DSO (Days Sales Outstanding)</span>
              <span className="text-sm font-medium text-yellow-600">18 days</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aging Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">0-30 days</span>
              <span className="text-sm font-medium text-green-600">₹8,500 (68%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">31-60 days</span>
              <span className="text-sm font-medium text-yellow-600">₹2,800 (22%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">61-90 days</span>
              <span className="text-sm font-medium text-orange-600">₹800 (6%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">90+ days</span>
              <span className="text-sm font-medium text-red-600">₹400 (4%)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* GST and Compliance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">GST & Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">₹3,330</p>
            <p className="text-sm text-gray-600">CGST Collected</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">₹3,330</p>
            <p className="text-sm text-gray-600">SGST Collected</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">₹6,660</p>
            <p className="text-sm text-gray-600">Total GST</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">25th</p>
            <p className="text-sm text-gray-600">Next Filing Due</p>
          </div>
        </div>
      </Card>
    </div>
  );
};