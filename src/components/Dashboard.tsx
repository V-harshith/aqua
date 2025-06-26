'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { dataService, PumpData } from '../services/dataService';
import Button from './ui/Button';
const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [pumps, setPumps] = useState<PumpData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Load pumps on component mount
  useEffect(() => {
    loadPumps();
  }, []);
  const loadPumps = () => {
    try {
      const pumpData = dataService.getPumps();
      setPumps(pumpData);
    } catch (error) {
      showError({ title: 'डेटा लोड नहीं हो सका / Failed to load data' });
    } finally {
      setIsLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'maintenance': return '🟡';
      default: return '⚫';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'चालू / Running';
      case 'stopped': return 'बंद / Stopped';
      case 'maintenance': return 'मरम्मत / Maintenance';
      default: return 'अज्ञात / Unknown';
    }
  };
  const togglePump = async (pumpId: string) => {
    const pump = pumps.find(p => p.id === pumpId);
    if (!pump) return;
    const newStatus = pump.status === 'running' ? 'stopped' : 'running';
    const userEmail = user?.email || 'Unknown User';
    try {
      const updatedPump = dataService.updatePumpStatus(pumpId, newStatus, userEmail);
      if (updatedPump) {
        loadPumps(); // Reload all pumps to get fresh data
        showSuccess({ 
          title: `पंप ${newStatus === 'running' ? 'चालू' : 'बंद'} किया गया / Pump ${newStatus}` 
        });
      } else {
        showError({ title: 'पंप अपडेट नहीं हो सका / Pump update failed' });
      }
    } catch (error) {
      showError({ title: 'पंप कंट्रोल में समस्या / Pump control error' });
    }
  };
  const handleStartAll = async () => {
    try {
      const userEmail = user?.email || 'Unknown User';
      const updatedPumps = dataService.startAllPumps(userEmail);
      setPumps(updatedPumps);
      showSuccess({ title: 'सभी उपलब्ध पंप चालू किए गए / All available pumps started' });
    } catch (error) {
      showError({ title: 'सभी पंप चालू नहीं हो सके / Failed to start all pumps' });
    }
  };
  const handleStopAll = async () => {
    try {
      const userEmail = user?.email || 'Unknown User';
      const updatedPumps = dataService.stopAllPumps(userEmail);
      setPumps(updatedPumps);
      showSuccess({ title: 'सभी पंप बंद किए गए / All pumps stopped' });
    } catch (error) {
      showError({ title: 'सभी पंप बंद नहीं हो सके / Failed to stop all pumps' });
    }
  };
  const handleSignOut = async () => {
    try {
      await signOut();
      showSuccess({ title: 'सफलतापूर्वक लॉगआउट / Successfully signed out' });
    } catch (error) {
      showError({ title: 'लॉगआउट में समस्या / Sign out failed' });
    }
  };
  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💧</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">डेटा लोड हो रहा है... / Loading data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">💧</div>
            <div>
              <h1 className="text-xl font-bold">प्रोजेक्ट अक्वा</h1>
              <p className="text-blue-100 text-sm">Project Aqua</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            🚪 बाहर निकलें / Exit
          </button>
        </div>
        {/* User Info */}
        <div className="mt-4 bg-blue-500/50 rounded-lg p-3">
          <p className="text-sm">
            स्वागत / Welcome: <span className="font-semibold">{user?.email || 'User'}</span>
          </p>
          <p className="text-xs text-blue-100 mt-1">
            आज का दिन / Today: {new Date().toLocaleDateString('hi-IN')}
          </p>
        </div>
      </div>
      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-green-500 text-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold">
              {pumps.filter(p => p.status === 'running').length}
            </div>
            <div className="text-sm">चालू / Running</div>
          </div>
          <div className="bg-red-500 text-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold">
              {pumps.filter(p => p.status === 'stopped').length}
            </div>
            <div className="text-sm">बंद / Stopped</div>
          </div>
          <div className="bg-yellow-500 text-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold">
              {pumps.filter(p => p.status === 'maintenance').length}
            </div>
            <div className="text-sm">मरम्मत / Repair</div>
          </div>
        </div>
        {/* Total Runtime Display */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">⏱️</div>
              <div>
                <h3 className="font-bold text-gray-800">कुल रन टाइम / Total Runtime</h3>
                <p className="text-sm text-gray-600">सभी पंप मिलाकर / All pumps combined</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {pumps.reduce((sum, p) => sum + p.totalRunTime, 0)} घंटे
              </div>
              <div className="text-sm text-gray-500">hours</div>
            </div>
          </div>
        </div>
        {/* Pump List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🚰 पंप की स्थिति / Pump Status
          </h2>
          {pumps.map((pump) => (
            <div key={pump.id} className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getStatusIcon(pump.status)}</div>
                  <div>
                    <h3 className="font-bold text-gray-800">{pump.name}</h3>
                    <p className="text-sm text-gray-600">{pump.location}</p>
                    <p className="text-xs text-gray-500">
                      रन टाइम / Runtime: {pump.totalRunTime} घंटे / hours
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(pump.status)}`}>
                  {getStatusText(pump.status)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  अंतिम जांच / Last Check: {pump.lastChecked}
                </div>
                {pump.status !== 'maintenance' && (
                  <Button
                    onClick={() => togglePump(pump.id)}
                    className={`px-6 py-3 rounded-xl font-bold text-lg ${
                      pump.status === 'running' 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {pump.status === 'running' ? '⏹️ बंद करें / Stop' : '▶️ चालू करें / Start'}
                  </Button>
                )}
                {pump.status === 'maintenance' && (
                  <button
                    onClick={() => showError({ title: 'मरम्मत चल रही है / Under maintenance' })}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-bold text-lg opacity-50 cursor-not-allowed"
                  >
                    🔧 मरम्मत / Repair
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Quick Actions */}
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ⚡ त्वरित कार्य / Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleStartAll}
              className="bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105"
            >
              🟢 सभी चालू करें<br/>
              <span className="text-sm font-normal">Start All</span>
            </button>
            <button
              onClick={handleStopAll}
              className="bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105"
            >
              🔴 सभी बंद करें<br/>
              <span className="text-sm font-normal">Stop All</span>
            </button>
            <button
              onClick={() => window.open('tel:+919876543210')}
              className="bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105"
            >
              📞 मदद चाहिए<br/>
              <span className="text-sm font-normal">Need Help</span>
            </button>
            <button
              onClick={() => window.location.href = '/logs'}
              className="bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105"
            >
              📋 गतिविधि लॉग<br/>
              <span className="text-sm font-normal">Activity Log</span>
            </button>
          </div>
        </div>
        {/* Emergency Alert */}
        <div className="mt-8 bg-red-100 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🚨</div>
            <div>
              <h3 className="font-bold text-red-800">आपातकाल / Emergency</h3>
              <p className="text-red-700 text-sm mt-1">
                किसी भी समस्या के लिए तुरंत कॉल करें: +91-9876543210<br/>
                For any problem, call immediately: +91-9876543210
              </p>
            </div>
          </div>
        </div>
        {/* Data Export Option */}
        <div className="mt-6">
          <button
            onClick={() => {
              const data = dataService.exportData();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `aqua-data-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              showSuccess({ title: 'डेटा एक्सपोर्ट हो गया / Data exported successfully' });
            }}
            className="w-full py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            💾 डेटा एक्सपोर्ट करें / Export Data
          </button>
        </div>
      </div>
    </div>
  );
};
export default Dashboard; 