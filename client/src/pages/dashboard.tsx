import { useQuery } from "@tanstack/react-query";
// import { useWebSocket } from "@/hooks/useWebSocket"; // Disabled - using polling instead
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Bell, User, Filter, Settings, Shield, Activity, Search, Zap, X, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import WalletGydeLogo from "@/components/WalletGydeLogo";
import StatusOverview from "@/components/StatusOverview";
import APIActivityMonitor from "@/components/APIActivityMonitor";
import RecentAlerts from "@/components/RecentAlerts";
import ComplianceRules from "@/components/ComplianceRules";
import DataClassification from "@/components/DataClassification";
import LLMResponseMonitor from "@/components/LLMResponseMonitor";
import IncidentLog from "@/components/IncidentLog";
import { formatTimeAgoEST, formatFullDateTimeEST, getCurrentESTString } from "@/lib/timeUtils";

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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentESTString());

  const { data: initialData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
    refetchInterval: 30000, // Fallback polling every 30 seconds
  });

  // WebSocket completely disabled - using reliable 30-second polling instead
  const isConnected = false;

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

  // Update current time every 5 seconds for visible refreshing
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentESTString());
    }, 5000); // Update every 5 seconds for visible changes

    return () => clearInterval(timer);
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

  const formatAlertTime = (timestamp: string) => {
    return formatTimeAgoEST(timestamp);
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
              
              {/* Alert Counter with Dropdown */}
              <div className="relative">
                <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                  <DialogTrigger asChild>
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
                  </DialogTrigger>
                  <DialogContent className="max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl" aria-describedby="alert-dialog-description">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Bell className="h-5 w-5" />
                        <span>Security Alerts ({activeAlertCount})</span>
                      </DialogTitle>
                      <p id="alert-dialog-description" className="text-sm text-slate-600 dark:text-slate-400">
                        View and manage your active security alerts and incidents
                      </p>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {dashboardData.alerts.filter(alert => alert.status === 'active').length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                          <p>No active alerts</p>
                          <p className="text-sm">Your security monitoring is working properly</p>
                        </div>
                      ) : (
                        dashboardData.alerts
                          .filter(alert => alert.status === 'active')
                          .slice(0, 10)
                          .map((alert, index) => (
                            <div 
                              key={alert.id || index} 
                              className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 space-y-2"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Badge 
                                      className={getAlertSeverityColor(alert.severity)}
                                    >
                                      {alert.severity?.toUpperCase() || 'UNKNOWN'}
                                    </Badge>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {formatAlertTime(alert.timestamp)}
                                    </span>
                                  </div>
                                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                                    {alert.title || alert.type || 'Security Alert'}
                                  </h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                    {alert.description || alert.message || 'Security incident detected'}
                                  </p>
                                  {alert.apiSource && (
                                    <div className="flex items-center space-x-1 mt-2">
                                      <span className="text-xs text-slate-500">Source:</span>
                                      <Badge variant="outline" className="text-xs">
                                        {alert.apiSource}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                <AlertTriangle className="h-4 w-4 text-orange-500 mt-1" />
                              </div>
                            </div>
                          ))
                      )}
                      
                      {dashboardData.alerts.filter(alert => alert.status === 'active').length > 10 && (
                        <div className="text-center py-2">
                          <Button variant="outline" size="sm">
                            View All Alerts
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Current Time Display */}
              <div className="hidden sm:block text-right mr-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Current Time • Updates every 5s</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300" data-testid="current-time-est">
                  {currentTime}
                </p>
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
                  {dashboardData.stats.totalApiCalls} calls tracked today • Refreshing every 30s • EST
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
          isMonitoring={isMonitoring}
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
