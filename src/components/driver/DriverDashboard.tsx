'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../context/ToastContext';

interface DeliveryRoute {
  id: string;
  route_name: string;
  customer_name: string;
  delivery_address: string;
  water_quantity: number;
  delivery_time: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  priority: 'high' | 'medium' | 'low';
  delivery_date: string;
  driver_id?: string;
  contact_number?: string;
  notes?: string;
}

interface DriverStats {
  assignedDeliveries: number;
  completedDeliveries: number;
  inTransitDeliveries: number;
  totalLitersDelivered: number;
}

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

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToastContext();
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [stats, setStats] = useState<DriverStats>({
    assignedDeliveries: 0,
    completedDeliveries: 0,
    inTransitDeliveries: 0,
    totalLitersDelivered: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'routes' | 'completed'>('overview');
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [activeDistribution, setActiveDistribution] = useState<WaterDistribution | null>(null);
  const [isStartingDistribution, setIsStartingDistribution] = useState(false);

  // Load data when component mounts and every 30 seconds for real-time updates
  useEffect(() => {
    if (user?.id) {
      loadDriverData();
      loadActiveDistribution();
      const interval = setInterval(() => {
        loadDriverData();
        loadActiveDistribution();
      }, 30000); // Auto-refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id]); // Only depend on stable user.id

  const loadDriverData = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, fetch from API
      // For now, create realistic mock data for drivers
      const mockRoutes: DeliveryRoute[] = [
        {
          id: '1',
          route_name: 'Downtown Area Route',
          customer_name: 'Metro Shopping Center',
          delivery_address: '123 Main St, Downtown',
          water_quantity: 500,
          delivery_time: '09:00',
          status: 'pending',
          priority: 'high',
          delivery_date: new Date().toISOString().split('T')[0],
          driver_id: user?.id,
          contact_number: '+1234567890',
          notes: 'Call before delivery'
        },
        {
          id: '2',
          route_name: 'Residential District',
          customer_name: 'Green Valley Apartments',
          delivery_address: '456 Oak Avenue',
          water_quantity: 300,
          delivery_time: '11:30',
          status: 'in_transit',
          priority: 'medium',
          delivery_date: new Date().toISOString().split('T')[0],
          driver_id: user?.id,
          contact_number: '+1234567891'
        },
        {
          id: '3',
          route_name: 'Industrial Zone',
          customer_name: 'Blue Tech Industries',
          delivery_address: '789 Industrial Blvd',
          water_quantity: 1000,
          delivery_time: '14:00',
          status: 'pending',
          priority: 'high',
          delivery_date: new Date().toISOString().split('T')[0],
          driver_id: user?.id,
          contact_number: '+1234567892',
          notes: 'Use loading dock entrance'
        }
      ];

      setRoutes(mockRoutes);
      
      // Calculate real-time stats
      const assigned = mockRoutes.filter(r => r.status === 'pending').length;
      const inTransit = mockRoutes.filter(r => r.status === 'in_transit').length;
      const completed = mockRoutes.filter(r => r.status === 'delivered').length;
      const totalLiters = mockRoutes
        .filter(r => r.status === 'delivered')
        .reduce((sum, r) => sum + r.water_quantity, 0);
      
      setStats({
        assignedDeliveries: assigned,
        completedDeliveries: completed,
        inTransitDeliveries: inTransit,
        totalLitersDelivered: totalLiters
      });
      
      console.log('✅ Driver data loaded:', { assigned, inTransit, completed, totalLiters });
      
    } catch (error) {
      console.error('Error loading driver data:', error);
      showError({ title: 'Error', message: 'Failed to load dashboard data' });
      setRoutes([]); // Ensure we have fallback data
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveDistribution = async () => {
    try {
      // Mock active distribution data
      const mockDistribution: WaterDistribution = {
        id: '1',
        driver_id: user?.id || '',
        distribution_date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        total_liters: 2000,
        route_details: 'Downtown -> Residential -> Industrial',
        status: 'active'
      };
      setActiveDistribution(mockDistribution);
    } catch (error) {
      console.error('Error loading active distribution:', error);
    }
  };

  const updateDeliveryStatus = async (routeId: string, newStatus: 'in_transit' | 'delivered' | 'failed') => {
    try {
      setRoutes(prev => 
        prev.map(route => 
          route.id === routeId 
            ? { ...route, status: newStatus }
            : route
        )
      );
      
      showSuccess({ 
        title: 'Status Updated', 
        message: `Delivery marked as ${newStatus.replace('_', ' ')}` 
      });
      
      // Recalculate stats after status update
      loadDriverData();
      
    } catch (error) {
      console.error('Error updating delivery status:', error);
      showError({ 
        title: 'Error', 
        message: 'Failed to update delivery status' 
      });
    }
  };

  const toggleDutyStatus = async () => {
    try {
      setIsOnDuty(!isOnDuty);
      showSuccess({ 
        title: 'Status Updated', 
        message: `You are now ${!isOnDuty ? 'On Duty' : 'Off Duty'}` 
      });
    } catch (error) {
      console.error('Error updating duty status:', error);
      showError({ 
        title: 'Error', 
        message: 'Failed to update duty status' 
      });
    }
  };

  const startDistribution = async () => {
    try {
      setIsStartingDistribution(true);
      
      const newDistribution: WaterDistribution = {
        driver_id: user?.id || '',
        distribution_date: new Date().toISOString().split('T')[0],
        start_time: new Date().toTimeString().slice(0, 5),
        total_liters: 2000,
        route_details: 'Starting new distribution route',
        status: 'active'
      };
      
      setActiveDistribution(newDistribution);
      showSuccess({ 
        title: 'Distribution Started', 
        message: 'Water distribution has been started successfully' 
      });
      
    } catch (error) {
      console.error('Error starting distribution:', error);
      showError({ 
        title: 'Error', 
        message: 'Failed to start distribution' 
      });
    } finally {
      setIsStartingDistribution(false);
    }
  };

  const endDistribution = async (actualLiters: number) => {
    try {
      if (activeDistribution) {
        const updatedDistribution = {
          ...activeDistribution,
          end_time: new Date().toTimeString().slice(0, 5),
          total_liters: actualLiters,
          status: 'completed' as const
        };
        
        setActiveDistribution(null);
        showSuccess({ 
          title: 'Distribution Completed', 
          message: `Distribution completed with ${actualLiters}L delivered` 
        });
      }
    } catch (error) {
      console.error('Error ending distribution:', error);
      showError({ 
        title: 'Error', 
        message: 'Failed to end distribution' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
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
            <h2 className="text-2xl font-bold text-gray-900">Driver Dashboard</h2>
            <p className="text-gray-600">Welcome back, {(user as any)?.full_name || user?.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={toggleDutyStatus}
              variant={isOnDuty ? "secondary" : "primary"}
              size="sm"
            >
              {isOnDuty ? '🟢 On Duty' : '🔴 Off Duty'}
            </Button>
            <Button
              onClick={loadDriverData}
              variant="secondary"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Real-Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.assignedDeliveries}</div>
            <div className="text-sm text-gray-600">Assigned Deliveries</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.inTransitDeliveries}</div>
            <div className="text-sm text-gray-600">In Transit</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedDeliveries}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalLitersDelivered}L</div>
            <div className="text-sm text-gray-600">Total Delivered</div>
          </div>
        </Card>
      </div>

      {/* Distribution Control */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Water Distribution Control</h3>
          {activeDistribution ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Active Distribution</h4>
                  <p className="text-sm text-blue-700">
                    Started at {formatTime(activeDistribution.start_time)} • 
                    Route: {activeDistribution.route_details}
                  </p>
                  <p className="text-sm text-blue-700">
                    Target: {activeDistribution.total_liters}L
                  </p>
                </div>
                <EndDistributionForm onEnd={endDistribution} isLoading={false} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🚛</div>
              <p className="text-gray-600 mb-4">No active distribution</p>
              <Button
                onClick={startDistribution}
                disabled={isStartingDistribution}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isStartingDistribution ? 'Starting...' : 'Start Distribution'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'routes', label: 'Routes', icon: '🚛' },
              { id: 'completed', label: 'Completed', icon: '✅' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Today's Routes ({routes.length})</h3>
              <div className="space-y-4">
                {routes.slice(0, 5).map(route => (
                  <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{route.route_name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(route.status)}`}>
                          {route.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(route.priority)}`}>
                          {route.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(route.delivery_time)}
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="font-medium text-gray-900">{route.customer_name}</div>
                      <div className="text-sm text-gray-600">{route.delivery_address}</div>
                      <div className="text-sm text-gray-600">{route.water_quantity}L</div>
                    </div>
                    {route.notes && (
                      <div className="text-sm text-gray-600 mb-2">
                        📝 {route.notes}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        📞 {route.contact_number}
                      </div>
                      <div className="flex items-center space-x-2">
                        {route.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(route.id, 'in_transit')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Start Delivery
                          </Button>
                        )}
                        {route.status === 'in_transit' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(route.id, 'delivered')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {routes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No routes assigned for today
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'routes' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">All Routes ({routes.length})</h3>
              <div className="space-y-4">
                {routes.map(route => (
                  <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{route.route_name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(route.status)}`}>
                          {route.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(route.priority)}`}>
                          {route.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(route.delivery_time)}
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="font-medium text-gray-900">{route.customer_name}</div>
                      <div className="text-sm text-gray-600">{route.delivery_address}</div>
                      <div className="text-sm text-gray-600">{route.water_quantity}L • 📞 {route.contact_number}</div>
                    </div>
                    {route.notes && (
                      <div className="text-sm text-gray-600 mb-2">
                        📝 {route.notes}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      {route.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateDeliveryStatus(route.id, 'in_transit')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Delivery
                        </Button>
                      )}
                      {route.status === 'in_transit' && (
                        <Button
                          size="sm"
                          onClick={() => updateDeliveryStatus(route.id, 'delivered')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'completed' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Completed Deliveries</h3>
              <div className="space-y-4">
                {routes.filter(r => r.status === 'delivered').map(route => (
                  <div key={route.id} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{route.route_name}</span>
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          ✅ Delivered
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(route.delivery_time)}
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="font-medium text-gray-900">{route.customer_name}</div>
                      <div className="text-sm text-gray-600">{route.delivery_address}</div>
                      <div className="text-sm text-gray-600">{route.water_quantity}L delivered</div>
                    </div>
                  </div>
                ))}
                {routes.filter(r => r.status === 'delivered').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No completed deliveries yet
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

const EndDistributionForm: React.FC<{ onEnd: (liters: number) => void; isLoading: boolean }> = ({ onEnd, isLoading }) => {
  const [actualLiters, setActualLiters] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const liters = parseInt(actualLiters);
    if (liters > 0) {
      onEnd(liters);
      setActualLiters('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <Input
        type="number"
        placeholder="Actual liters"
        value={actualLiters}
        onChange={(e) => setActualLiters(e.target.value)}
        className="w-24"
        required
      />
      <Button
        type="submit"
        size="sm"
        disabled={!actualLiters || isLoading}
        className="bg-red-600 hover:bg-red-700"
      >
        End Distribution
      </Button>
    </form>
  );
};