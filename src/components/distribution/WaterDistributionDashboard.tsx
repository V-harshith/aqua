'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
interface WaterDistribution {
  id: string;
  distribution_date: string;
  driver_id: string;
  vehicle_id: string;
  route_name: string;
  planned_liters: number;
  actual_liters?: number;
  start_time?: string;
  end_time?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  driver?: {
    full_name: string;
    phone: string;
  };
  vehicle?: {
    vehicle_number: string;
    capacity: number;
  };
}
interface DistributionStats {
  totalDistributions: number;
  activeDistributions: number;
  totalLitersPlanned: number;
  totalLitersDelivered: number;
  averageEfficiency: number;
}
interface RouteLocation {
  id: string;
  route_name: string;
  location_name: string;
  address: string;
  estimated_liters: number;
  priority: 'low' | 'medium' | 'high';
  last_delivery?: string;
}
export const WaterDistributionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [distributions, setDistributions] = useState<WaterDistribution[]>([]);
  const [stats, setStats] = useState<DistributionStats>({
    totalDistributions: 0,
    activeDistributions: 0,
    totalLitersPlanned: 0,
    totalLitersDelivered: 0,
    averageEfficiency: 0
  });
  const [routes, setRoutes] = useState<RouteLocation[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'distributions' | 'routes' | 'vehicles'>('overview');
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [distributionForm, setDistributionForm] = useState({
    driver_id: '',
    vehicle_id: '',
    route_name: '',
    planned_liters: 0,
    distribution_date: new Date().toISOString().split('T')[0],
  });
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadDistributions(),
        loadStats(),
        loadRoutes(),
        loadDriversAndVehicles()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const loadDistributions = async () => {
    try {
      // For now, using water_distributions table or mock data if it doesn't exist
      const { data, error } = await supabase
        .from('water_distributions')
        .select(`
          id,
          distribution_date,
          driver_id,
          start_time,
          end_time,
          route_details,
          total_liters,
          status,
          created_at,
          driver:users!driver_id(full_name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading distributions:', error);
        // Use mock data if table doesn't exist
        setDistributions(getMockDistributions());
        return;
      }
      const transformedData = data?.map(d => ({
        id: d.id,
        distribution_date: d.distribution_date,
        driver_id: d.driver_id,
        vehicle_id: 'VEH-001', // Mock vehicle
        route_name: d.route_details || 'Route A',
        planned_liters: d.total_liters,
        actual_liters: d.status === 'completed' ? d.total_liters : undefined,
        start_time: d.start_time,
        end_time: d.end_time,
        status: (d.status === 'active' ? 'in_progress' : 'completed') as 'planned' | 'in_progress' | 'completed' | 'cancelled',
        created_at: d.created_at,
        driver: Array.isArray(d.driver) ? d.driver[0] : d.driver,
        vehicle: {
          vehicle_number: 'KA-01-AB-1234',
          capacity: 5000
        }
      })) || [];
      setDistributions(transformedData);
    } catch (error) {
      console.error('Error loading distributions:', error);
      setDistributions(getMockDistributions());
    }
  };
  const getMockDistributions = (): WaterDistribution[] => [
    {
      id: '1',
      distribution_date: new Date().toISOString().split('T')[0],
      driver_id: 'driver1',
      vehicle_id: 'VEH-001',
      route_name: 'Central District',
      planned_liters: 3000,
      actual_liters: 2850,
      start_time: '08:00',
      end_time: '14:30',
      status: 'completed',
      created_at: new Date().toISOString(),
      driver: { full_name: 'Rajesh Kumar', phone: '+91-9876543210' },
      vehicle: { vehicle_number: 'KA-01-AB-1234', capacity: 5000 }
    },
    {
      id: '2',
      distribution_date: new Date().toISOString().split('T')[0],
      driver_id: 'driver2',
      vehicle_id: 'VEH-002',
      route_name: 'North Zone',
      planned_liters: 4000,
      start_time: '09:00',
      status: 'in_progress',
      created_at: new Date().toISOString(),
      driver: { full_name: 'Suresh Patel', phone: '+91-9876543211' },
      vehicle: { vehicle_number: 'KA-01-AB-5678', capacity: 6000 }
    }
  ];
  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Calculate stats from distributions
      const totalDistributions = distributions.length;
      const activeDistributions = distributions.filter(d => d.status === 'in_progress').length;
      const totalLitersPlanned = distributions.reduce((sum, d) => sum + d.planned_liters, 0);
      const totalLitersDelivered = distributions
        .filter(d => d.actual_liters)
        .reduce((sum, d) => sum + (d.actual_liters || 0), 0);
      const averageEfficiency = totalLitersPlanned > 0 
        ? Math.round((totalLitersDelivered / totalLitersPlanned) * 100)
        : 0;
      setStats({
        totalDistributions,
        activeDistributions,
        totalLitersPlanned,
        totalLitersDelivered,
        averageEfficiency
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  const loadRoutes = async () => {
    // Mock routes data - in real implementation, this would come from a routes table
    const mockRoutes: RouteLocation[] = [
      {
        id: '1',
        route_name: 'Central District',
        location_name: 'City Center',
        address: 'Main Street, Central District',
        estimated_liters: 3000,
        priority: 'high',
        last_delivery: '2024-01-20'
      },
      {
        id: '2',
        route_name: 'North Zone',
        location_name: 'Industrial Area',
        address: 'Industrial Park, North Zone',
        estimated_liters: 4000,
        priority: 'medium',
        last_delivery: '2024-01-19'
      },
      {
        id: '3',
        route_name: 'South Sector',
        location_name: 'Residential Complex',
        address: 'Housing Society, South Sector',
        estimated_liters: 2500,
        priority: 'low',
        last_delivery: '2024-01-18'
      }
    ];
    setRoutes(mockRoutes);
  };
  const loadDriversAndVehicles = async () => {
    try {
      // Load drivers
      const { data: driversData } = await supabase
        .from('users')
        .select('id, full_name, phone')
        .eq('role', 'driver_manager')
        .eq('is_active', true);
      setDrivers(driversData || []);
      // Mock vehicles data - in real implementation, this would come from a vehicles table
      const mockVehicles = [
        { id: 'VEH-001', vehicle_number: 'KA-01-AB-1234', capacity: 5000, status: 'available' },
        { id: 'VEH-002', vehicle_number: 'KA-01-AB-5678', capacity: 6000, status: 'in_use' },
        { id: 'VEH-003', vehicle_number: 'KA-01-AB-9012', capacity: 4000, status: 'maintenance' }
      ];
      setVehicles(mockVehicles);
    } catch (error) {
      console.error('Error loading drivers and vehicles:', error);
    }
  };
  const createDistribution = async () => {
    if (!distributionForm.driver_id || !distributionForm.vehicle_id || !distributionForm.planned_liters) {
      return;
    }
    setIsLoading(true);
    try {
      const newDistribution = {
        driver_id: distributionForm.driver_id,
        distribution_date: distributionForm.distribution_date,
        route_details: distributionForm.route_name,
        total_liters: distributionForm.planned_liters,
        status: 'active'
      };
      const { error } = await supabase
        .from('water_distributions')
        .insert([newDistribution]);
      if (error) {
        console.error('Error creating distribution:', error);
        // If table doesn't exist, just update local state
        const mockDistribution: WaterDistribution = {
          id: Date.now().toString(),
          ...distributionForm,
          status: 'planned',
          created_at: new Date().toISOString(),
          driver: drivers.find(d => d.id === distributionForm.driver_id),
          vehicle: vehicles.find(v => v.id === distributionForm.vehicle_id)
        };
        setDistributions(prev => [mockDistribution, ...prev]);
      } else {
        await loadDistributions();
      }
      setShowCreateForm(false);
      setDistributionForm({
        driver_id: '',
        vehicle_id: '',
        route_name: '',
        planned_liters: 0,
        distribution_date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error creating distribution:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const updateDistributionStatus = async (id: string, newStatus: string, actualLiters?: number) => {
    setIsLoading(true);
    try {
      const updates: any = { status: newStatus };
      if (actualLiters) updates.total_liters = actualLiters;
      if (newStatus === 'completed') updates.end_time = new Date().toISOString();
      const { error } = await supabase
        .from('water_distributions')
        .update(updates)
        .eq('id', id);
      if (error) {
        console.error('Error updating distribution:', error);
        // Update local state if database update fails
        setDistributions(prev =>
          prev.map(d =>
            d.id === id
              ? { ...d, status: newStatus as any, actual_liters: actualLiters }
              : d
          )
        );
      } else {
        await loadDistributions();
      }
      await loadStats();
    } catch (error) {
      console.error('Error updating distribution status:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Water Distribution Management</h1>
        <p className="text-gray-600 mt-1">Manage water delivery operations and logistics</p>
      </div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'distributions', label: 'Distributions', icon: '🚚' },
            { id: 'routes', label: 'Routes', icon: '🗺️' },
            { id: 'vehicles', label: 'Vehicles', icon: '🚛' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Distributions</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalDistributions}</p>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Deliveries</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.activeDistributions}</p>
                  </div>
                  <div className="text-3xl">🚚</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Planned Liters</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalLitersPlanned.toLocaleString()}L</p>
                  </div>
                  <div className="text-3xl">💧</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalLitersDelivered.toLocaleString()}L</p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Efficiency</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.averageEfficiency}%</p>
                  </div>
                  <div className="text-3xl">🎯</div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900">Recent Distributions</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {distributions.slice(0, 5).map((distribution) => (
                  <div key={distribution.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{distribution.route_name}</h4>
                      <p className="text-sm text-gray-600">
                        Driver: {distribution.driver?.full_name} | Vehicle: {distribution.vehicle?.vehicle_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {distribution.planned_liters}L planned | Date: {new Date(distribution.distribution_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(distribution.status)}`}>
                      {distribution.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Distributions Tab */}
      {selectedTab === 'distributions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Distribution Management</h2>
            <Button onClick={() => setShowCreateForm(true)}>
              Create New Distribution
            </Button>
          </div>
          <div className="space-y-4">
            {distributions.map((distribution) => (
              <Card key={distribution.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{distribution.route_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(distribution.status)}`}>
                          {distribution.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Driver:</span> {distribution.driver?.full_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Vehicle:</span> {distribution.vehicle?.vehicle_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span> {new Date(distribution.distribution_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Planned:</span> {distribution.planned_liters}L
                          </p>
                          {distribution.actual_liters && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Delivered:</span> {distribution.actual_liters}L
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Capacity:</span> {distribution.vehicle?.capacity}L
                          </p>
                        </div>
                        <div>
                          {distribution.start_time && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Start:</span> {distribution.start_time}
                            </p>
                          )}
                          {distribution.end_time && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">End:</span> {distribution.end_time}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      {distribution.status === 'planned' && (
                        <Button
                          onClick={() => updateDistributionStatus(distribution.id, 'in_progress')}
                          size="sm"
                        >
                          Start Delivery
                        </Button>
                      )}
                      {distribution.status === 'in_progress' && (
                        <Button
                          onClick={() => {
                            const actualLiters = prompt('Enter actual liters delivered:');
                            if (actualLiters) {
                              updateDistributionStatus(distribution.id, 'completed', parseInt(actualLiters));
                            }
                          }}
                          size="sm"
                        >
                          Complete Delivery
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* Routes Tab */}
      {selectedTab === 'routes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Delivery Routes</h2>
            <Button onClick={() => console.log('Add route functionality')}>
              Add New Route
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <Card key={route.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{route.route_name}</h3>
                      <p className="text-sm text-gray-600">{route.location_name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(route.priority)}`}>
                      {route.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Address:</span> {route.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Est. Demand:</span> {route.estimated_liters}L
                    </p>
                    {route.last_delivery && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Last Delivery:</span> {new Date(route.last_delivery).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setDistributionForm(prev => ({
                          ...prev,
                          route_name: route.route_name,
                          planned_liters: route.estimated_liters
                        }));
                        setShowCreateForm(true);
                      }}
                      size="sm"
                      variant="secondary"
                      className="w-full"
                    >
                      Schedule Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* Vehicles Tab */}
      {selectedTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Vehicle Fleet</h2>
            <Button onClick={() => console.log('Add vehicle functionality')}>
              Add New Vehicle
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{vehicle.vehicle_number}</h3>
                      <p className="text-sm text-gray-600">Capacity: {vehicle.capacity}L</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                      vehicle.status === 'in_use' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Status:</span> {vehicle.status.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> Water Tanker
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={() => console.log('Vehicle maintenance/tracking')}
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      disabled={vehicle.status === 'maintenance'}
                    >
                      {vehicle.status === 'maintenance' ? 'Under Maintenance' : 'View Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* Create Distribution Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="text-xl font-semibold text-gray-900">Create New Distribution</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                <select
                  value={distributionForm.driver_id}
                  onChange={(e) => setDistributionForm(prev => ({ ...prev, driver_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Driver</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  value={distributionForm.vehicle_id}
                  onChange={(e) => setDistributionForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.filter(v => v.status === 'available').map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number} ({vehicle.capacity}L)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                <input
                  type="text"
                  value={distributionForm.route_name}
                  onChange={(e) => setDistributionForm(prev => ({ ...prev, route_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter route name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planned Liters</label>
                <input
                  type="number"
                  value={distributionForm.planned_liters}
                  onChange={(e) => setDistributionForm(prev => ({ ...prev, planned_liters: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter planned liters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Date</label>
                <input
                  type="date"
                  value={distributionForm.distribution_date}
                  onChange={(e) => setDistributionForm(prev => ({ ...prev, distribution_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={createDistribution}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Creating...' : 'Create Distribution'}
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 