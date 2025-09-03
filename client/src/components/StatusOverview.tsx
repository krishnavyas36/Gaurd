import { Card, CardContent } from "@/components/ui/card";
import { Activity, AlertTriangle, Shield, Eye, ArrowUp, CheckCircle } from "lucide-react";

interface StatusOverviewProps {
  stats: any;
  apiSources: any[];
  activeAlerts: number;
  complianceScore: number;
  isMonitoring: boolean;
}

export default function StatusOverview({ stats, apiSources, activeAlerts, complianceScore, isMonitoring }: StatusOverviewProps) {
  const activeSources = apiSources.filter(source => source.status === 'active').length;
  const totalApiCalls = stats?.totalApiCalls || 0;
  const sensitiveDataDetected = stats?.sensitiveDataDetected || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="status-overview">
      {/* API Monitoring Status */}
      <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm dark:bg-slate-800/70 dark:border-slate-700/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">API Monitoring</p>
              <p className={`text-xl font-bold ${
                isMonitoring 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} data-testid="text-api-status">
                {isMonitoring ? 'Active' : 'Disabled'}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isMonitoring 
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <Activity className={`h-4 w-4 ${
                isMonitoring 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
              <CheckCircle className={`mr-1 h-3 w-3 ${
                isMonitoring ? 'text-emerald-500' : 'text-red-500'
              }`} />
              <span data-testid="text-sources-monitored">
                {isMonitoring ? `${activeSources} sources monitored` : 'Monitoring disabled'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm dark:bg-slate-800/70 dark:border-slate-700/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Active Alerts</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-active-alerts">
                {activeAlerts}
              </p>
            </div>
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-orange-600 dark:text-orange-400 h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
              <ArrowUp className="mr-1 h-3 w-3 text-orange-500" />
              <span data-testid="text-alert-trend">
                {activeAlerts > 5 ? 'High' : activeAlerts > 2 ? 'Elevated' : 'Normal'} activity
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Score */}
      <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm dark:bg-slate-800/70 dark:border-slate-700/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Compliance Score</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-compliance-score">
                {complianceScore}%
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Shield className="text-blue-600 dark:text-blue-400 h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
              <ArrowUp className="mr-1 h-3 w-3 text-blue-500" />
              <span data-testid="text-compliance-trend">
                {complianceScore >= 95 ? 'Excellent' : complianceScore >= 85 ? 'Good' : 'Needs attention'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Calls Today */}
      <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm dark:bg-slate-800/70 dark:border-slate-700/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">API Calls Today</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400" data-testid="text-sensitive-data">
                {totalApiCalls}
              </p>
            </div>
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <Eye className="text-indigo-600 dark:text-indigo-400 h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
              <span data-testid="text-data-timeframe">Real-time tracking</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
