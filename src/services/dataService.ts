export interface PumpData {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'maintenance';
  lastChecked: string;
  location: string;
  totalRunTime: number;
  maintenanceScheduled?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  pumpId: string;
  user: string;
  details: string;
}

class DataService {
  private static PUMPS_KEY = 'aqua_pumps_data';
  private static LOGS_KEY = 'aqua_system_logs';

  // Initialize default pump data
  private defaultPumps: PumpData[] = [
    {
      id: '1',
      name: 'मुख्य पंप / Main Pump',
      status: 'running',
      lastChecked: new Date().toLocaleString('hi-IN'),
      location: 'केंद्रीय कुआं / Central Well',
      totalRunTime: 245,
      maintenanceScheduled: '2024-02-15'
    },
    {
      id: '2',
      name: 'बैकअप पंप / Backup Pump',
      status: 'stopped',
      lastChecked: new Date(Date.now() - 5 * 60000).toLocaleString('hi-IN'),
      location: 'उत्तरी कुआं / North Well',
      totalRunTime: 128,
      maintenanceScheduled: '2024-02-20'
    },
    {
      id: '3',
      name: 'आपातकालीन पंप / Emergency Pump',
      status: 'maintenance',
      lastChecked: new Date(Date.now() - 60 * 60000).toLocaleString('hi-IN'),
      location: 'दक्षिणी कुआं / South Well',
      totalRunTime: 89,
      maintenanceScheduled: '2024-01-30'
    }
  ];

  // Get all pumps
  getPumps(): PumpData[] {
    try {
      const stored = localStorage.getItem(DataService.PUMPS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with default data
      this.savePumps(this.defaultPumps);
      return this.defaultPumps;
    } catch (error) {
      console.error('Error loading pumps:', error);
      return this.defaultPumps;
    }
  }

  // Save pumps to localStorage
  private savePumps(pumps: PumpData[]): void {
    try {
      localStorage.setItem(DataService.PUMPS_KEY, JSON.stringify(pumps));
    } catch (error) {
      console.error('Error saving pumps:', error);
    }
  }

  // Update pump status
  updatePumpStatus(pumpId: string, status: 'running' | 'stopped' | 'maintenance', user: string): PumpData | null {
    try {
      const pumps = this.getPumps();
      const pumpIndex = pumps.findIndex(p => p.id === pumpId);
      
      if (pumpIndex === -1) return null;

      const oldStatus = pumps[pumpIndex].status;
      pumps[pumpIndex].status = status;
      pumps[pumpIndex].lastChecked = new Date().toLocaleString('hi-IN');
      
      // Update run time if pump is being started
      if (status === 'running' && oldStatus !== 'running') {
        pumps[pumpIndex].totalRunTime += 1; // Add 1 hour for demo
      }

      this.savePumps(pumps);
      
      // Log the action
      this.addLog({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('hi-IN'),
        action: `Pump ${status}`,
        pumpId,
        user,
        details: `पंप स्थिति बदली: ${oldStatus} → ${status} / Status changed: ${oldStatus} → ${status}`
      });

      return pumps[pumpIndex];
    } catch (error) {
      console.error('Error updating pump:', error);
      return null;
    }
  }

  // Get system logs
  getLogs(): SystemLog[] {
    try {
      const stored = localStorage.getItem(DataService.LOGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading logs:', error);
      return [];
    }
  }

  // Add new log entry
  addLog(log: SystemLog): void {
    try {
      const logs = this.getLogs();
      logs.unshift(log); // Add to beginning
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(100);
      }
      
      localStorage.setItem(DataService.LOGS_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }

  // Start all pumps
  startAllPumps(user: string): PumpData[] {
    const pumps = this.getPumps();
    const updatedPumps = pumps.map(pump => {
      if (pump.status !== 'maintenance') {
        return {
          ...pump,
          status: 'running' as const,
          lastChecked: new Date().toLocaleString('hi-IN'),
          totalRunTime: pump.totalRunTime + 1
        };
      }
      return pump;
    });
    
    this.savePumps(updatedPumps);
    this.addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('hi-IN'),
      action: 'Start All Pumps',
      pumpId: 'all',
      user,
      details: 'सभी उपलब्ध पंप चालू किए गए / All available pumps started'
    });
    
    return updatedPumps;
  }

  // Stop all pumps
  stopAllPumps(user: string): PumpData[] {
    const pumps = this.getPumps();
    const updatedPumps = pumps.map(pump => ({
      ...pump,
      status: pump.status === 'maintenance' ? 'maintenance' as const : 'stopped' as const,
      lastChecked: new Date().toLocaleString('hi-IN')
    }));
    
    this.savePumps(updatedPumps);
    this.addLog({
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('hi-IN'),
      action: 'Stop All Pumps',
      pumpId: 'all',
      user,
      details: 'सभी पंप बंद किए गए / All pumps stopped'
    });
    
    return updatedPumps;
  }

  // Get system statistics
  getStats(): {
    totalPumps: number;
    runningPumps: number;
    stoppedPumps: number;
    maintenancePumps: number;
    totalRunTime: number;
    lastActivity: string;
  } {
    const pumps = this.getPumps();
    const logs = this.getLogs();
    
    return {
      totalPumps: pumps.length,
      runningPumps: pumps.filter(p => p.status === 'running').length,
      stoppedPumps: pumps.filter(p => p.status === 'stopped').length,
      maintenancePumps: pumps.filter(p => p.status === 'maintenance').length,
      totalRunTime: pumps.reduce((sum, p) => sum + p.totalRunTime, 0),
      lastActivity: logs[0]?.timestamp || 'कोई गतिविधि नहीं / No activity'
    };
  }

  // Clear all data (for testing)
  clearAllData(): void {
    localStorage.removeItem(DataService.PUMPS_KEY);
    localStorage.removeItem(DataService.LOGS_KEY);
  }

  // Export data for backup
  exportData(): { pumps: PumpData[]; logs: SystemLog[] } {
    return {
      pumps: this.getPumps(),
      logs: this.getLogs()
    };
  }
}

export const dataService = new DataService(); 