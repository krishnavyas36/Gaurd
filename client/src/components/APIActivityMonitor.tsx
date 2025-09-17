import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface APIActivityMonitorProps {
  apiSources: any[];
}

export default function APIActivityMonitor({ apiSources }: APIActivityMonitorProps) {
  const getStatusColor = (alertStatus: string) => {
    switch (alertStatus) {
      case 'critical': return 'bg-red-500';
      case 'elevated': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getStatusBadge = (alertStatus: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    
    switch (alertStatus) {
      case 'critical':
        return `${baseClasses} bg-error/10 text-error`;
      case 'elevated':
        return `${baseClasses} bg-warning/10 text-warning`;
      case 'warning':
        return `${baseClasses} bg-warning/10 text-warning`;
      default:
        return `${baseClasses} bg-secondary/10 text-secondary`;
    }
  };

  const getStatusText = (alertStatus: string) => {
    switch (alertStatus) {
      case 'critical': return 'Critical';
      case 'elevated': return 'Elevated';
      case 'warning': return 'Warning';
      default: return 'Normal';
    }
  };

  return (
    <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm dark:bg-slate-800/70 dark:border-slate-700/60" data-testid="api-activity-monitor">
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">API Activity Monitor</h2>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
              Real-time
            </span>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        {/* Real API Data Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Live API Tracking</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Updated every 30s</span>
          </div>
          <div className="h-32 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg flex items-center justify-center" data-testid="api-chart-placeholder">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-slate-400 dark:text-slate-500 mb-2 mx-auto" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Showing {apiSources.length} API sources</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">Database-backed tracking active</p>
            </div>
          </div>
        </div>

        {/* API Source Breakdown */}
        <div className="space-y-3" data-testid="api-sources-list">
          {apiSources.map((source, index) => (
            <div 
              key={source.id || index} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              data-testid={`api-source-${source.name?.toLowerCase().replace(/\s+/g, '-') || index}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(source.alertStatus || 'normal')}`}></div>
                <span className="font-medium text-white" data-testid={`text-source-name-${index}`}> 
                  {source.name || 'Unknown Source'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600" data-testid={`text-call-count-${index}`}>
                  {source.callsToday || 0} calls today
                </span>
                <span className={getStatusBadge(source.alertStatus || 'normal')} data-testid={`status-badge-${index}`}>
                  {getStatusText(source.alertStatus || 'normal')}
                </span>
              </div>
            </div>
          ))}
          
          {apiSources.length === 0 && (
            <div className="text-center py-8 text-gray-500" data-testid="no-api-sources">
              No API sources configured
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
