import { Card, CardContent } from "@/components/ui/card";
import { Activity, AlertTriangle, Shield, Eye, ArrowUp, CheckCircle } from "lucide-react";

interface StatusOverviewProps {
  stats: any;
  apiSources: any[];
  activeAlerts: number;
  complianceScore: number;
}

export default function StatusOverview({ stats, apiSources, activeAlerts, complianceScore }: StatusOverviewProps) {
  const activeSources = apiSources.filter(source => source.status === 'active').length;
  const totalApiCalls = stats?.totalApiCalls || 0;
  const sensitiveDataDetected = stats?.sensitiveDataDetected || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="status-overview">
      {/* API Monitoring Status */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">API Monitoring</p>
              <p className="text-2xl font-semibold text-secondary" data-testid="text-api-status">
                Active
              </p>
            </div>
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Activity className="text-secondary h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="flex items-center text-secondary">
                <CheckCircle className="mr-1 h-4 w-4" />
                <span data-testid="text-sources-monitored">{activeSources} sources monitored</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="text-2xl font-semibold text-error" data-testid="text-active-alerts">
                {activeAlerts}
              </p>
            </div>
            <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-error h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="flex items-center text-error">
                <ArrowUp className="mr-1 h-4 w-4" />
                <span data-testid="text-alert-trend">
                  {activeAlerts > 5 ? 'High' : activeAlerts > 2 ? 'Elevated' : 'Normal'} activity
                </span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Score */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-semibold text-secondary" data-testid="text-compliance-score">
                {complianceScore}%
              </p>
            </div>
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Shield className="text-secondary h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="flex items-center text-secondary">
                <ArrowUp className="mr-1 h-4 w-4" />
                <span data-testid="text-compliance-trend">
                  {complianceScore >= 95 ? 'Excellent' : complianceScore >= 85 ? 'Good' : 'Needs attention'}
                </span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Classification */}
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sensitive Data Detected</p>
              <p className="text-2xl font-semibold text-warning" data-testid="text-sensitive-data">
                {sensitiveDataDetected}
              </p>
            </div>
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Eye className="text-warning h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="flex items-center text-gray-600">
                <span data-testid="text-data-timeframe">Last 24 hours</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
