import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useState, useEffect } from "react";
import { Shield, Bell, User } from "lucide-react";
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="text-primary text-xl" data-testid="logo-icon" />
                <h1 className="text-xl font-semibold text-gray-900" data-testid="app-title">
                  WalletGyde Security Agent
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Alert Counter */}
              <div className="relative">
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors" 
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {activeAlertCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 h-5 w-5 bg-error text-white text-xs rounded-full flex items-center justify-center"
                      data-testid="text-alert-count"
                    >
                      {activeAlertCount}
                    </span>
                  )}
                </button>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="text-white text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700" data-testid="text-username">
                  Security Admin
                </span>
              </div>

              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-secondary' : 'bg-error'}`}></div>
                <span className="text-xs text-gray-500" data-testid="text-connection-status">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
