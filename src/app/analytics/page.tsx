'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
interface AnalyticsData {
  totalComplaints: number;
  resolvedComplaints: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
  serviceCompletionRate: number;
  revenueMetrics: {
    thisMonth: number;
    lastMonth: number;
    yearToDate: number;
  };
  trends: {
    complaintsThisWeek: number[];
    servicesThisWeek: number[];
    revenueThisWeek: number[];
  };
}
export default function AnalyticsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeframe]);
  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Mock analytics data - in production this would fetch from API
      const mockData: AnalyticsData = {
        totalComplaints: 156,
        resolvedComplaints: 142,
        averageResolutionTime: 2.4,
        customerSatisfaction: 4.2,
        serviceCompletionRate: 91.0,
        revenueMetrics: {
          thisMonth: 45678,
          lastMonth: 42341,
          yearToDate: 456789
        },
        trends: {
          complaintsThisWeek: [12, 8, 15, 9, 11, 6, 13],
          servicesThisWeek: [18, 22, 17, 20, 19, 15, 21],
          revenueThisWeek: [3200, 2800, 3500, 2900, 3100, 2600, 3400]
        }
      };
      setAnalyticsData(mockData);
      success({ title: 'Analytics Loaded', message: 'Analytics data updated successfully' });
    } catch (err) {
      error({ title: 'Load Failed', message: 'Failed to load analytics data' });
    } finally {
      setIsLoading(false);
    }
  };
  const getResolutionRate = () => {
    if (!analyticsData) return 0;
    return Math.round((analyticsData.resolvedComplaints / analyticsData.totalComplaints) * 100);
  };
  const getRevenueGrowth = () => {
    if (!analyticsData) return 0;
    const { thisMonth, lastMonth } = analyticsData.revenueMetrics;
    return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }
  return (
    <RoleGuard allowedRoles={['admin', 'dept_head', 'service_manager', 'product_manager', 'accounts_manager']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights and performance metrics</p>
          </div>
          {/* Time Range Selector */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {['7d', '30d', '90d', '1y'].map((timeframe) => (
                <Button
                  key={timeframe}
                  variant={selectedTimeframe === timeframe ? 'primary' : 'outline'}
                  onClick={() => setSelectedTimeframe(timeframe as any)}
                  className="text-sm"
                >
                  {timeframe === '7d' ? '7 Days' : 
                   timeframe === '30d' ? '30 Days' :
                   timeframe === '90d' ? '90 Days' : '1 Year'}
                </Button>
              ))}
            </div>
          </div>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolution Rate</p>
                    <p className="text-3xl font-bold text-green-600">{getResolutionRate()}%</p>
                  </div>
                  <div className="text-4xl text-green-600">✓</div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {analyticsData?.resolvedComplaints} of {analyticsData?.totalComplaints} resolved
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Resolution Time</p>
                    <p className="text-3xl font-bold text-blue-600">{analyticsData?.averageResolutionTime}h</p>
                  </div>
                  <div className="text-4xl text-blue-600">⏱️</div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Average hours to resolve</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Customer Satisfaction</p>
                    <p className="text-3xl font-bold text-yellow-600">{analyticsData?.customerSatisfaction}/5</p>
                  </div>
                  <div className="text-4xl text-yellow-600">⭐</div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Average rating</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Revenue Growth</p>
                    <p className="text-3xl font-bold text-purple-600">+{getRevenueGrowth()}%</p>
                  </div>
                  <div className="text-4xl text-purple-600">📈</div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Month over month</p>
              </div>
            </Card>
          </div>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Complaints Trend */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Complaints Trend</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {analyticsData?.trends.complaintsThisWeek.map((value, index) => (
                    <div
                      key={index}
                      className="bg-red-400 rounded-t flex-1 flex items-end justify-center text-white text-sm"
                      style={{ height: `${(value / 20) * 100}%`, minHeight: '20px' }}
                    >
                      {value}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>
            </Card>
            {/* Services Trend */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Services Completed</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {analyticsData?.trends.servicesThisWeek.map((value, index) => (
                    <div
                      key={index}
                      className="bg-green-400 rounded-t flex-1 flex items-end justify-center text-white text-sm"
                      style={{ height: `${(value / 25) * 100}%`, minHeight: '20px' }}
                    >
                      {value}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          {/* Performance Summary */}
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{analyticsData?.serviceCompletionRate}%</div>
                  <div className="text-sm text-gray-600">Service Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">₹{analyticsData?.revenueMetrics.thisMonth.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">This Month Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">₹{analyticsData?.revenueMetrics.yearToDate.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Year to Date Revenue</div>
                </div>
              </div>
            </div>
          </Card>
          {/* Actions */}
          <div className="mt-8 flex space-x-4">
            <Button variant="primary" onClick={loadAnalyticsData}>
              Refresh Data
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              Export Report
            </Button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}