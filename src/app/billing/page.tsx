'use client';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RoleGuard } from '@/components/auth/RoleGuard';
interface Bill {
  id: string;
  bill_number: string;
  amount: number;
  due_date: string;
  status: string;
  billing_period: string;
  water_usage: number;
}
export default function BillingPage() {
  const { user } = useAuthContext();
  const { success } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadBills();
  }, []);
  const loadBills = async () => {
    try {
      // Mock billing data for demo
      const mockBills: Bill[] = [
        {
          id: '1',
          bill_number: 'WB-2024-001',
          amount: 156.50,
          due_date: '2024-02-15',
          status: 'pending',
          billing_period: 'January 2024',
          water_usage: 1250
        },
        {
          id: '2',
          bill_number: 'WB-2023-012',
          amount: 142.30,
          due_date: '2024-01-15',
          status: 'paid',
          billing_period: 'December 2023',
          water_usage: 1180
        },
        {
          id: '3',
          bill_number: 'WB-2023-011',
          amount: 168.75,
          due_date: '2023-12-15',
          status: 'paid',
          billing_period: 'November 2023',
          water_usage: 1320
        }
      ];
      setBills(mockBills);
    } catch (err) {
      console.error('Error loading bills:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const totalPending = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }
  return (
    <RoleGuard allowedRoles={['customer', 'admin', 'accounts_manager']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
            <p className="text-gray-600">Manage your water service bills and payments</p>
          </div>
          {/* Billing Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="p-6 text-center">
                <div className="text-3xl font-bold text-red-600">
                  ${totalPending.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Outstanding Balance</div>
              </div>
            </Card>
            <Card>
              <div className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {bills.find(b => b.status === 'pending')?.due_date || 'N/A'}
                </div>
                <div className="text-sm text-gray-600 mt-1">Next Due Date</div>
              </div>
            </Card>
            <Card>
              <div className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  ${(bills.reduce((sum, b) => sum + b.amount, 0) / bills.length).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Average Monthly</div>
              </div>
            </Card>
          </div>
          {/* Bills Table */}
          <Card title="Billing History">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2">Bill Number</th>
                    <th className="text-left py-3 px-2">Period</th>
                    <th className="text-left py-3 px-2">Amount</th>
                    <th className="text-left py-3 px-2">Usage (L)</th>
                    <th className="text-left py-3 px-2">Due Date</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(bill => (
                    <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{bill.bill_number}</td>
                      <td className="py-3 px-2">{bill.billing_period}</td>
                      <td className="py-3 px-2 font-semibold">${bill.amount.toFixed(2)}</td>
                      <td className="py-3 px-2">{bill.water_usage.toLocaleString()}</td>
                      <td className="py-3 px-2">{bill.due_date}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                          {bill.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => success({ title: 'Bill details feature coming soon!' })}
                          >
                            View
                          </Button>
                          {bill.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => success({ title: 'Payment feature coming soon!' })}
                            >
                              Pay
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {/* Payment Methods */}
          <Card title="Payment Methods" className="mt-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💳</div>
              <p className="text-gray-500">Payment methods and auto-pay setup coming soon!</p>
              <Button
                className="mt-4"
                onClick={() => success({ title: 'Payment setup feature coming soon!' })}
              >
                Setup Auto-Pay
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
} 