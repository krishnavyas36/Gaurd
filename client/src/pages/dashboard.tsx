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

  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'dashboard_update') {
        setDashboardData(message.data);
      } else if (message.type === 'new_alert') {
        setActiveAlertCount(prev => prev + 1);
      }
    },
    onOpen: () => {
      console.log('Connected to WebSocket');
    },
    onClose: () => {
      console.log('Disconnected from WebSocket');
    }
  });

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
    <div className="min-h-screen bg-background" data-testid="security-dashboard">
      {/* Header Navigation */}
      <header className="bg-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <WalletGydeLogo variant="light" data-testid="logo" />
                <h1 className="text-xl font-semibold text-white" data-testid="app-title">
                  Security Agent
                </h1>
              </div>
              
              {/* Navigation Menu */}
              <nav className="flex items-center space-x-1 ml-8">
                <Link href="/">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-300 hover:text-white hover:bg-slate-700"
                    data-testid="nav-dashboard"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Link href="/compliance">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-300 hover:text-white hover:bg-slate-700"
                    data-testid="nav-compliance"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Compliance Filtering
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {/* Alert Counter */}
              <div className="relative">
                <button 
                  className="p-2 text-gray-300 hover:text-white transition-colors" 
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
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <User className="text-white text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-200" data-testid="text-username">
                  Security Admin
                </span>
              </div>

              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-gray-300" data-testid="text-connection-status">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Monitoring Status Banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-blue-900">Security Monitoring Status</h2>
                <p className="text-blue-700">Ready to protect your financial applications with real-time monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm text-blue-600 font-medium">Status: Inactive</div>
                <div className="text-xs text-blue-500">Click to activate monitoring</div>
              </div>
              <Link href="/monitoring-control">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6" data-testid="button-activate-monitoring">
                  <Activity className="h-4 w-4 mr-2" />
                  Activate Monitoring
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-700">
                <strong>Quick Start:</strong> Activate monitoring → Test with sample data → View real-time alerts
              </div>
              <div className="flex space-x-2">
                <Link href="/advanced-compliance">
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    Test Scanner
                  </Button>
                </Link>
                <Link href="/alerts">
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    View Alerts
                  </Button>
                </Link>
              </div>
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
