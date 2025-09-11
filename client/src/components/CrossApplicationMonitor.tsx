import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, AlertTriangle, Activity, Zap, BarChart3 } from "lucide-react";
import { formatTimeAgoEST } from "@/lib/timeUtils";

interface ExternalApplication {
  applicationSource: string;
  totalCalls: number;
  successfulCalls: number;
  errorCalls: number;
  securityViolations: number;
  errorRate: number;
  healthScore: number;
}

interface CrossAppSummary {
  date: string;
  totalApplications: number;
  totalExternalCalls: number;
  totalSecurityViolations: number;
  applications: ExternalApplication[];
  recentCalls: any[];
  pendingCorrelations: number;
  overallHealthScore: number;
}

export default function CrossApplicationMonitor() {
  const { data: crossAppData, isLoading } = useQuery<CrossAppSummary>({
    queryKey: ['/api/external/summary'],
    refetchInterval: 30000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['/api/external/stats'],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-sm dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="h-5 w-5 text-blue-500" />
            <span>Cross-Application API Monitoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4 dark:bg-slate-700"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 dark:bg-slate-700"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!crossAppData) {
    return (
      <Card className="border-slate-200 shadow-sm dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="h-5 w-5 text-blue-500" />
            <span>Cross-Application API Monitoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">No external application activity detected</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Configure webhooks or use the API to start tracking cross-application usage
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getHealthScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  return (
    <div className="space-y-6">
      {/* Cross-Application Summary Header */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-5 w-5 text-blue-500" />
              <span>Cross-Application API Monitoring</span>
            </div>
            <Badge className={getHealthScoreBadgeColor(crossAppData.overallHealthScore)}>
              Health: {crossAppData.overallHealthScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
              <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-total-applications">
                {crossAppData.totalApplications}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">External Apps</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
              <Activity className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-total-calls">
                {crossAppData.totalExternalCalls}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">API Calls</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-security-violations">
                {crossAppData.totalSecurityViolations}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Security Violations</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
              <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-pending-correlations">
                {crossAppData.pendingCorrelations}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Pending Correlations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* External Applications List */}
        <Card className="border-slate-200 shadow-sm dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <span>External Applications</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crossAppData.applications.map((app, index) => (
                <div key={app.applicationSource} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-slate-800" data-testid={`row-application-${index}`}>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {app.applicationSource.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {app.totalCalls || 0} calls • {(app.errorRate || 0).toFixed(1)}% error rate
                    </div>
                    {(app.securityViolations || 0) > 0 && (
                      <div className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{app.securityViolations || 0} security violations</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getHealthScoreColor(app.healthScore || 0)}`}>
                      {app.healthScore || 0}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Health Score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent External API Calls */}
        <Card className="border-slate-200 shadow-sm dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Recent External API Calls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crossAppData.recentCalls.slice(0, 5).map((call, index) => (
                <div key={call.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-slate-800" data-testid={`row-external-call-${index}`}>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {call.endpoint}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {call.applicationSource} • via {call.tracked_via}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {formatTimeAgoEST(call.timestamp)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {call.method || 'POST'}
                    </Badge>
                  </div>
                </div>
              ))}
              {crossAppData.recentCalls.length === 0 && (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                  No recent external API calls
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Information */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-700 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <ExternalLink className="h-6 w-6 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Cross-Application Monitoring Active
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Tracking API usage across multiple applications using the same credentials. 
                Configure webhooks in your external applications to automatically monitor their API activity.
              </p>
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Webhook URL:</strong> <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                    POST /api/external/webhook
                  </code>
                </div>
                <div className="text-sm">
                  <strong>Manual Tracking:</strong> <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                    POST /api/external/track
                  </code>
                </div>
                <div className="text-sm">
                  <strong>Request Correlation:</strong> <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                    POST /api/external/correlate
                  </code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}