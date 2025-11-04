'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
export default function ReportsPage() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const reportTypes = [
    {
      id: 'customer-summary',
      name: 'Customer Summary Report',
      description: 'Overview of all customers and their service history',
      icon: '👥'
    },
    {
      id: 'service-performance',
      name: 'Service Performance Report',
      description: 'Analysis of service delivery metrics and technician performance',
      icon: '🔧'
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary Report',
      description: 'Revenue, expenses, and financial performance overview',
      icon: '💰'
    },
    {
      id: 'inventory-status',
      name: 'Inventory Status Report',
      description: 'Current stock levels, low stock alerts, and inventory movements',
      icon: '📦'
    },
    {
      id: 'complaint-analysis',
      name: 'Complaint Analysis Report',
      description: 'Complaint trends, resolution times, and customer satisfaction',
      icon: '📋'
    },
    {
      id: 'technician-workload',
      name: 'Technician Workload Report',
      description: 'Individual technician performance and assignment distribution',
      icon: '👷'
    },
    {
      id: 'water-distribution',
      name: 'Water Distribution Report',
      description: 'Distribution routes, delivery efficiency, and driver performance',
      icon: '🚚'
    },
    {
      id: 'monthly-summary',
      name: 'Monthly Summary Report',
      description: 'Comprehensive monthly business overview and KPIs',
      icon: '📈'
    }
  ];
  const generateReport = async () => {
    if (!selectedReport) {
      showError({ title: 'Please select a report type' });
      return;
    }
    if (!dateRange.startDate || !dateRange.endDate) {
      showError({ title: 'Please select date range' });
      return;
    }
    setIsGenerating(true);
    try {
      // Mock report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess({ title: 'Report generated successfully' });
      // Mock download
      const reportName = reportTypes.find(r => r.id === selectedReport)?.name || 'Report';
    } catch (error) {
      showError({ title: 'Failed to generate report' });
    } finally {
      setIsGenerating(false);
    }
  };
  const quickReports = [
    { name: 'Today\'s Summary', period: 'today' },
    { name: 'This Week', period: 'week' },
    { name: 'This Month', period: 'month' },
    { name: 'Last Quarter', period: 'quarter' }
  ];
  const generateQuickReport = async (period: string) => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      showSuccess({ title: `${period.charAt(0).toUpperCase() + period.slice(1)} report generated` });
    } catch (error) {
      showError({ title: 'Failed to generate quick report' });
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports Center</h1>
          <p className="text-gray-600">Generate comprehensive business reports and analytics</p>
        </div>
      </div>
      {/* Quick Reports */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickReports.map((report) => (
            <Button
              key={report.period}
              variant="secondary"
              onClick={() => generateQuickReport(report.period)}
              disabled={isGenerating}
              className="w-full"
            >
              📊 {report.name}
            </Button>
          ))}
        </div>
      </Card>
      {/* Custom Report Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Type Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h3>
          <div className="space-y-3">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedReport === report.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{report.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  </div>
                  {selectedReport === report.id && (
                    <div className="text-blue-500">✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
        {/* Date Range & Generation */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Report
                </label>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">
                      {reportTypes.find(r => r.id === selectedReport)?.icon}
                    </span>
                    <span className="font-medium text-blue-900">
                      {reportTypes.find(r => r.id === selectedReport)?.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Export Options</h4>
                <div className="flex space-x-3">
                  <Button
                    onClick={generateReport}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? '⏳ Generating...' : '📄 Generate PDF'}
                  </Button>
                  <Button
                    onClick={generateReport}
                    disabled={isGenerating}
                    variant="secondary"
                    className="flex-1"
                  >
                    📊 Generate Excel
                  </Button>
                </div>
              </div>
            </div>
          )}
          {!selectedReport && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📋</div>
              <p className="text-gray-500">Select a report type to configure generation options</p>
            </div>
          )}
        </Card>
      </div>
      {/* Recent Reports */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
        <div className="space-y-3">
          {[
            { name: 'Monthly Summary Report - December 2024', date: '2024-12-01', size: '2.4 MB', type: 'PDF' },
            { name: 'Service Performance Report - November 2024', date: '2024-11-28', size: '1.8 MB', type: 'Excel' },
            { name: 'Customer Summary Report - November 2024', date: '2024-11-25', size: '3.1 MB', type: 'PDF' },
            { name: 'Inventory Status Report - November 2024', date: '2024-11-20', size: '0.9 MB', type: 'Excel' }
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {report.type === 'PDF' ? '📄' : '📊'}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{report.name}</h4>
                  <p className="text-sm text-gray-600">
                    Generated on {new Date(report.date).toLocaleDateString()} • {report.size}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="secondary">
                  👁️ View
                </Button>
                <Button size="sm" variant="secondary">
                  ⬇️ Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      {/* Report Scheduling */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h3>
        <p className="text-gray-600 mb-4">
          Set up automatic report generation and delivery to your email
        </p>
        <div className="space-y-4">
          {[
            { name: 'Weekly Service Summary', frequency: 'Every Monday', nextRun: '2024-01-08', status: 'Active' },
            { name: 'Monthly Financial Report', frequency: 'First of every month', nextRun: '2024-02-01', status: 'Active' },
            { name: 'Quarterly Business Review', frequency: 'Every quarter', nextRun: '2024-04-01', status: 'Paused' }
          ].map((schedule, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                <p className="text-sm text-gray-600">
                  {schedule.frequency} • Next run: {new Date(schedule.nextRun).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  schedule.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {schedule.status}
                </span>
                <Button size="sm" variant="secondary">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="secondary">
            ➕ Add New Schedule
          </Button>
        </div>
      </Card>
    </div>
  );
} 