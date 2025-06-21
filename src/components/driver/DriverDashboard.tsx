'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';

interface WaterDistribution {
  id?: string;
  driver_id: string;
  distribution_date: string;
  start_time: string;
  end_time?: string;
  total_liters: number;
  route_details: string;
  status: 'active' | 'completed';
  created_at?: string;
}

interface DriverOperation {
  id?: string;
  driver_id: string;
  operation_type: 'start_distribution' | 'end_distribution' | 'complaint_register' | 'leave_request';
  details: any;
  timestamp: string;
}

// Toast helper functions
let globalToast: any = null;

const useGlobalToast = () => {
  const toast = useToast();
  globalToast = toast;
  return {
    showSuccess: (message: string) => toast.success({ title: message }),
    showError: (message: string) => toast.error({ title: message })
  };
};

const showToast = (message: string) => {
  if (globalToast) globalToast.success({ title: message });
};

const showError = (message: string) => {
  if (globalToast) globalToast.error({ title: message });
};

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const showToast = (message: string) => {
    toast.success({ title: message });
  };
  const showError = (message: string) => {
    toast.error({ title: message });
  };
  
  const [activeDistribution, setActiveDistribution] = useState<WaterDistribution | null>(null);
  const [distributionForm, setDistributionForm] = useState({
    route_details: '',
    estimated_liters: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    totalDistributions: 0,
    totalLiters: 0,
    activeRoutes: 0
  });

  useEffect(() => {
    if (user?.role === 'driver_manager') {
      loadActiveDistribution();
      loadDailyStats();
    }
  }, [user]);

  // Load any active distribution for today
  const loadActiveDistribution = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('water_distributions')
        .select('*')
        .eq('driver_id', user?.id)
        .eq('distribution_date', today)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Error loading active distribution:', error);
        return;
      }

      setActiveDistribution(data);
    } catch (error) {
      console.error('Error loading active distribution:', error);
    }
  };

  // Load daily statistics
  const loadDailyStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('water_distributions')
        .select('total_liters, status')
        .eq('distribution_date', today);

      if (error) {
        console.error('Error loading daily stats:', error);
        return;
      }

      const stats = data.reduce(
        (acc, dist) => ({
          totalDistributions: acc.totalDistributions + 1,
          totalLiters: acc.totalLiters + (dist.total_liters || 0),
          activeRoutes: acc.activeRoutes + (dist.status === 'active' ? 1 : 0)
        }),
        { totalDistributions: 0, totalLiters: 0, activeRoutes: 0 }
      );

      setDailyStats(stats);
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  };

  // Start water distribution
  const startDistribution = async () => {
    if (!distributionForm.route_details || distributionForm.estimated_liters <= 0) {
      showError('Please provide route details and estimated liters');
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const distribution: WaterDistribution = {
        driver_id: user!.id,
        distribution_date: now.toISOString().split('T')[0],
        start_time: now.toISOString(),
        route_details: distributionForm.route_details,
        total_liters: distributionForm.estimated_liters,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('water_distributions')
        .insert([distribution])
        .select()
        .single();

      if (error) throw error;

      // Log the operation
      await logDriverOperation('start_distribution', {
        distribution_id: data.id,
        route: distributionForm.route_details,
        estimated_liters: distributionForm.estimated_liters
      });

      setActiveDistribution(data);
      setDistributionForm({ route_details: '', estimated_liters: 0 });
      showToast('Water distribution started successfully');
      loadDailyStats();
    } catch (error: any) {
      console.error('Error starting distribution:', error);
      showError(error.message || 'Failed to start distribution');
    } finally {
      setIsLoading(false);
    }
  };

  // End water distribution
  const endDistribution = async (actualLiters: number) => {
    if (!activeDistribution || actualLiters <= 0) {
      showError('Please provide actual liters distributed');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('water_distributions')
        .update({
          end_time: new Date().toISOString(),
          total_liters: actualLiters,
          status: 'completed'
        })
        .eq('id', activeDistribution.id);

      if (error) throw error;

      // Log the operation
      await logDriverOperation('end_distribution', {
        distribution_id: activeDistribution.id,
        actual_liters: actualLiters,
        duration: calculateDuration(activeDistribution.start_time)
      });

      setActiveDistribution(null);
      showToast('Water distribution completed successfully');
      loadDailyStats();
    } catch (error: any) {
      console.error('Error ending distribution:', error);
      showError(error.message || 'Failed to end distribution');
    } finally {
      setIsLoading(false);
    }
  };

  // Log driver operations for audit trail
  const logDriverOperation = async (operation_type: string, details: any) => {
    try {
      await supabase
        .from('driver_operations')
        .insert([{
          driver_id: user!.id,
          operation_type,
          details,
          timestamp: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging operation:', error);
    }
  };

  // Calculate duration in hours
  const calculateDuration = (startTime: string): number => {
    const start = new Date(startTime);
    const end = new Date();
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 100) / 100;
  };

  if (user?.role !== 'driver_manager') {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p>You don't have permission to access the driver dashboard.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Today's Distributions</h3>
          <p className="text-2xl font-bold text-blue-600">{dailyStats.totalDistributions}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Liters</h3>
          <p className="text-2xl font-bold text-green-600">{dailyStats.totalLiters.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Active Routes</h3>
          <p className="text-2xl font-bold text-orange-600">{dailyStats.activeRoutes}</p>
        </Card>
      </div>

      {/* Active Distribution Card */}
      {activeDistribution ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-green-600 mb-4">Active Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p><strong>Route:</strong> {activeDistribution.route_details}</p>
              <p><strong>Started:</strong> {new Date(activeDistribution.start_time).toLocaleTimeString()}</p>
            </div>
            <div>
              <p><strong>Estimated Liters:</strong> {activeDistribution.total_liters.toLocaleString()}</p>
              <p><strong>Duration:</strong> {calculateDuration(activeDistribution.start_time)} hours</p>
            </div>
          </div>
          <EndDistributionForm onEnd={endDistribution} isLoading={isLoading} />
        </Card>
      ) : (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-blue-600 mb-4">Start Water Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Details
              </label>
              <Input
                value={distributionForm.route_details}
                onChange={(e) => setDistributionForm(prev => ({ ...prev, route_details: e.target.value }))}
                placeholder="e.g., Sector 1 to Sector 5, Main Road"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Liters
              </label>
              <Input
                type="number"
                value={distributionForm.estimated_liters}
                onChange={(e) => setDistributionForm(prev => ({ ...prev, estimated_liters: parseInt(e.target.value) || 0 }))}
                placeholder="Enter estimated liters"
                min="1"
                required
              />
            </div>
          </div>
          <Button 
            onClick={startDistribution}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Starting...' : 'Start Distribution'}
          </Button>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComplaintRegistrationCard />
        <LeaveRequestCard />
      </div>
    </div>
  );
};

// End Distribution Form Component
const EndDistributionForm: React.FC<{ onEnd: (liters: number) => void; isLoading: boolean }> = ({ onEnd, isLoading }) => {
  const [actualLiters, setActualLiters] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEnd(actualLiters);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Actual Liters Distributed
        </label>
        <Input
          type="number"
          value={actualLiters}
          onChange={(e) => setActualLiters(parseInt(e.target.value) || 0)}
          placeholder="Enter actual liters"
          min="1"
          required
        />
      </div>
      <Button 
        type="submit"
        disabled={isLoading || actualLiters <= 0}
        className="bg-red-600 hover:bg-red-700"
      >
        {isLoading ? 'Ending...' : 'End Distribution'}
      </Button>
    </form>
  );
};

// Complaint Registration Component
const ComplaintRegistrationCard: React.FC = () => {
  const [complaint, setComplaint] = useState({ type: 'plant', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const submitComplaint = async () => {
    if (!complaint.description.trim()) {
      toast.error({ title: 'Please describe the complaint' });
      return;
    }

    setIsLoading(true);
    try {
      const complaintData = {
        complaint_number: `CPL-${Date.now()}`,
        customer_id: null, // Driver complaints don't have customer
        title: `Driver ${complaint.type === 'plant' ? 'Plant' : 'Personal'} Issue`,
        description: complaint.description,
        category: complaint.type === 'plant' ? 'operational' : 'hr',
        priority: 'medium' as const,
        status: 'open' as const,
        reported_by: user?.id,
        location: 'Field Operation'
      };

      const { error } = await supabase
        .from('complaints')
        .insert([complaintData]);

      if (error) throw error;

      setComplaint({ type: 'plant', description: '' });
      toast.success({ title: 'Complaint registered successfully' });
    } catch (error: any) {
      console.error('Error registering complaint:', error);
      toast.error({ title: error.message || 'Failed to register complaint' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Register Complaint</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complaint Type
          </label>
          <select
            value={complaint.type}
            onChange={(e) => setComplaint(prev => ({ ...prev, type: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="plant">Plant Issue</option>
            <option value="personal">Personal Driver Issue</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={complaint.description}
            onChange={(e) => setComplaint(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the issue..."
          />
        </div>
        <Button
          onClick={submitComplaint}
          disabled={isLoading}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {isLoading ? 'Submitting...' : 'Submit Complaint'}
        </Button>
      </div>
    </Card>
  );
};

// Leave Request Component
const LeaveRequestCard: React.FC = () => {
  const [leave, setLeave] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    type: 'sick'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const submitLeaveRequest = async () => {
    if (!leave.start_date || !leave.end_date || !leave.reason.trim()) {
      toast.error({ title: 'Please fill all leave request fields' });
      return;
    }

    setIsLoading(true);
    try {
      const leaveData = {
        employee_id: user?.id,
        leave_type: leave.type,
        start_date: leave.start_date,
        end_date: leave.end_date,
        reason: leave.reason,
        status: 'pending',
        applied_date: new Date().toISOString().split('T')[0]
      };

      const { error } = await supabase
        .from('leave_requests')
        .insert([leaveData]);

      if (error) throw error;

      setLeave({ start_date: '', end_date: '', reason: '', type: 'sick' });
      toast.success({ title: 'Leave request submitted successfully' });
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      toast.error({ title: error.message || 'Failed to submit leave request' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Request Leave</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <Input
              type="date"
              value={leave.start_date}
              onChange={(e) => setLeave(prev => ({ ...prev, start_date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <Input
              type="date"
              value={leave.end_date}
              onChange={(e) => setLeave(prev => ({ ...prev, end_date: e.target.value }))}
              min={leave.start_date || new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Leave Type
          </label>
          <select
            value={leave.type}
            onChange={(e) => setLeave(prev => ({ ...prev, type: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="emergency">Emergency Leave</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason
          </label>
          <textarea
            value={leave.reason}
            onChange={(e) => setLeave(prev => ({ ...prev, reason: e.target.value }))}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Reason for leave..."
          />
        </div>
        <Button
          onClick={submitLeaveRequest}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? 'Submitting...' : 'Submit Leave Request'}
        </Button>
      </div>
    </Card>
  );
};