"use client";
import React, { useState, useEffect } from 'react';
import { dataService, SystemLog } from '../../services/dataService';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
export const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success: showSuccess } = useToast();
  useEffect(() => {
    loadLogs();
  }, []);
  const loadLogs = () => {
    try {
      const systemLogs = dataService.getLogs();
      setLogs(systemLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const clearLogs = () => {
    if (window.confirm('क्या आप सभी लॉग्स को साफ करना चाहते हैं?\n\nAre you sure you want to clear all logs?')) {
      dataService.clearAllData();
      setLogs([]);
      showSuccess({ title: 'सभी लॉग्स साफ किए गए / All logs cleared' });
    }
  };
  const getActionIcon = (action: string) => {
    // Icons removed for clean UI
    return '';
  };
  const getActionColor = (action: string) => {
    if (action.includes('Start') || action.includes('running')) return 'bg-green-100 border-green-300';
    if (action.includes('Stop') || action.includes('stopped')) return 'bg-red-100 border-red-300';
    if (action.includes('maintenance')) return 'bg-yellow-100 border-yellow-300';
    return 'bg-blue-100 border-blue-300';
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">लॉग्स लोड हो रहे हैं... / Loading logs...</p>
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
            <button
              onClick={() => window.history.back()}
              className="text-2xl hover:bg-blue-500 p-2 rounded-lg transition-colors"
            >
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold">सिस्टम लॉग्स</h1>
              <p className="text-blue-100 text-sm">System Logs</p>
            </div>
          </div>
          <div className="text-sm text-center">
            <div className="font-semibold">{logs.length}</div>
            <div className="text-blue-100 text-xs">Entries</div>
          </div>
        </div>
      </div>
      <div className="p-4">
        {/* Summary Stats */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(log => log.action.includes('Start')).length}
              </div>
              <div className="text-sm text-gray-600">Start Actions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.action.includes('Stop')).length}
              </div>
              <div className="text-sm text-gray-600">Stop Actions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {logs.length}
              </div>
              <div className="text-sm text-gray-600">Total Logs</div>
            </div>
          </div>
        </div>
        {/* Clear Logs Button */}
        {logs.length > 0 && (
          <div className="mb-6">
            <Button
              onClick={clearLogs}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium"
            >
              सभी लॉग्स साफ करें / Clear All Logs
            </Button>
          </div>
        )}
        {/* Logs List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📋 गतिविधि इतिहास / Activity History
          </h2>
          {logs.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-lg">

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                कोई लॉग्स नहीं मिले
              </h3>
              <p className="text-gray-600">
                No logs found. Start using the system to see activity here.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`bg-white rounded-xl shadow-lg p-4 border-l-4 ${getActionColor(log.action)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl mt-1">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-800">{log.action}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Pump {log.pumpId}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {log.details}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>👤 {log.user}</span>
                      <span>🕐 {log.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Export Logs */}
        {logs.length > 0 && (
          <div className="mt-8">
            <Button
              onClick={() => {
                const data = { logs, exportedAt: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `aqua-logs-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                showSuccess({ title: 'लॉग्स एक्सपोर्ट हो गए / Logs exported successfully' });
              }}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
            >
              💾 लॉग्स एक्सपोर्ट करें / Export Logs
            </Button>
          </div>
        )}
        {/* Bottom spacing for mobile */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}; 