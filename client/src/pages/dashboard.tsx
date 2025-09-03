import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Bell, User, Filter, Settings, Shield, Activity, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import WalletGydeLogo from "@/components/WalletGydeLogo";
import StatusOverview from "@/components/StatusOverview";
import APIActivityMonitor from "@/components/APIActivityMonitor";
import RecentAlerts from "@/components/RecentAlerts";
import ComplianceRules from "@/components/ComplianceRules";
import DataClassification from "@/components/DataClassification";
import LLMResponseMonitor from "@/components/LLMResponseMonitor";
import IncidentLog from "@/components/IncidentLog";

interface DashboardData {
  apiSources: any[];
  alerts: any[];
  complianceRules: any[];
  dataClassifications: any[];
  llmViolations: any[];
  incidents: any[];
  stats: any;
  complianceScore: number;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  const { data: initialData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
    refetchInterval: 30000, // Fallback polling every 30 seconds
  });

  // Temporarily disable WebSocket to fix connection issues
  const isConnected = false;
  
  // const { isConnected } = useWebSocket({
  //   onMessage: (message) => {
  //     if (message.type === 'dashboard_update') {
  //       setDashboardData(message.data);
  //     } else if (message.type === 'new_alert') {
  //       setActiveAlertCount(prev => prev + 1);
  //     }
  //   },
  //   onOpen: () => {
  //     console.log('Connected to WebSocket');
  //   },
  //   onClose: () => {
  //     console.log('Disconnected from WebSocket');
  //   },
  //   maxReconnectAttempts: 0 // Disable automatic reconnection
  // });

  useEffect(() => {
    if (initialData) {
      setDashboardData(initialData);
      setActiveAlertCount(initialData.alerts.filter(alert => alert.status === 'active').length);
    }
  }, [initialData]);

  // Fetch monitoring status on component mount
  useEffect(() => {
    fetch('/api/monitoring/status')
      .then(response => response.json())
      .then(data => setIsMonitoring(data.monitoring_enabled))
      .catch(console.error);
  }, []);

  // Toggle monitoring function
  const toggleMonitoring = async () => {
    setIsToggling(true);
    try {
      const response = await fetch('/api/monitoring/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isMonitoring })
      });
      
      if (response.ok) {
        setIsMonitoring(!isMonitoring);
        console.log(`Monitoring ${!isMonitoring ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // Quick security scan function
  const performQuickScan = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/security/quick-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        setLastScanTime(new Date());
        console.log('Quick scan completed:', result);
        
        // Refresh dashboard data after scan
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to perform quick scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (dashboardData) {
      setActiveAlertCount(dashboardData.alerts.filter(alert => alert.status === 'active').length);
    }
  }, [dashboardData]);

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" data-testid="security-dashboard">
      {/* Clean Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm dark:bg-slate-900/80 dark:border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <WalletGydeLogo variant="dark" data-testid="logo" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white" data-testid="app-title">
                    WalletGyde
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Security Agent</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Quick Scan Button */}
              <Button
                onClick={performQuickScan}
                disabled={isScanning}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 transition-colors flex items-center space-x-2"
                data-testid="button-quick-scan"
              >
                <Zap className="h-4 w-4" />
                <span>{isScanning ? 'Scanning...' : 'Quick Scan'}</span>
              </Button>

              {/* Monitoring Toggle */}
              <Button
                onClick={toggleMonitoring}
                disabled={isToggling}
                className={`${
                  isMonitoring 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } text-sm px-4 py-2 transition-colors`}
                data-testid="button-monitoring-toggle"
              >
                {isToggling ? 'Updating...' : (isMonitoring ? 'Monitoring ON' : 'Monitoring OFF')}
              </Button>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-green-500'
                }`}></div>
                <span className="text-slate-600 dark:text-slate-400">
                  {isConnected ? 'Live' : 'Polling'}
                </span>
              </div>
              
              {/* Alert Counter */}
              <div className="relative">
                <button 
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800" 
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {activeAlertCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                      data-testid="text-alert-count"
                    >
                      {activeAlertCount}
                    </span>
                  )}
                </button>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                  <User className="text-white w-4 h-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white" data-testid="text-username">
                    Security Admin
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Clean Status Banner */}
        <div className="mb-6 p-4 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm dark:bg-slate-800/70 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">API Security Monitoring</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Real-time tracking active with {dashboardData.apiSources.length} API sources</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className={`text-sm font-medium ${
                  isMonitoring 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {isMonitoring ? 'System Online' : 'Monitoring Disabled'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {dashboardData.stats.totalApiCalls} calls tracked today
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}></div>
            </div>
          </div>
        </div>
        
        {/* Status Overview Cards */}
        <StatusOverview 
          stats={dashboardData.stats} 
          apiSources={dashboardData.apiSources}
          activeAlerts={activeAlertCount}
          complianceScore={dashboardData.complianceScore}
        />

        {/* Real-time Monitoring and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <APIActivityMonitor apiSources={dashboardData.apiSources} />
          </div>
          <div>
            <RecentAlerts alerts={dashboardData.alerts} />
          </div>
        </div>

        {/* Compliance Rules and Data Classification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ComplianceRules rules={dashboardData.complianceRules} />
          <DataClassification classifications={dashboardData.dataClassifications} />
        </div>

        {/* LLM Response Monitoring and Incident Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <LLMResponseMonitor 
              violations={dashboardData.llmViolations}
              stats={dashboardData.stats}
            />
          </div>
          <div>
            <IncidentLog incidents={dashboardData.incidents} />
          </div>
        </div>
      </main>
    </div>
  );
}
