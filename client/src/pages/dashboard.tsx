import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Bell, User, Filter, Settings, Shield, Activity } from "lucide-react";
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
              {/* Connection Status */}
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-400'}`}></div>
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
                <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">System Online</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{dashboardData.stats.totalApiCalls} calls tracked today</div>
              </div>
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
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
