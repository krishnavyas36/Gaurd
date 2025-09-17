import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatTimeAgoEST } from "@/lib/timeUtils";

interface RecentAlertsProps {
  alerts: any[];
}

export default function RecentAlerts({ alerts }: RecentAlertsProps) {
  const queryClient = useQueryClient();

  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      return apiRequest('PATCH', `/api/alerts/${alertId}`, { status: 'acknowledged' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  });

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="text-error h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="text-warning h-4 w-4" />;
      default:
        return <Shield className="text-primary h-4 w-4" />;
    }
  };

  const getAlertBorderColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-error bg-error/5';
      case 'warning':
        return 'border-l-4 border-warning bg-warning/5';
      default:
        return 'border-l-4 border-primary bg-primary/5';
    }
  };

  const getAlertTextColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-primary';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    return formatTimeAgoEST(timestamp);
  };

  const recentAlerts = alerts.slice(0, 5); // Show only last 5 alerts

  return (
    <Card className="border border-gray-200" data-testid="recent-alerts">
      <div className="p-6 border-b border-gray-200">
  <h2 className="text-lg font-semibold text-white">Recent Alerts</h2>
      </div>
      <CardContent className="p-6">
        <div className="space-y-4" data-testid="alerts-list">
          {recentAlerts.map((alert, index) => (
            <div 
              key={alert.id || index} 
              className={`${getAlertBorderColor(alert.severity)} p-4 rounded-r-lg`}
              data-testid={`alert-${index}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getAlertIcon(alert.severity)}
                </div>
                <div className="ml-3 flex-1">
                  <h4 className={`text-sm font-medium ${getAlertTextColor(alert.severity)}`} data-testid={`text-alert-title-${index}`}>
                    {alert.title}
                  </h4>
                  <p className="text-sm text-white mt-1" data-testid={`text-alert-description-${index}`}>
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-white/70" data-testid={`text-alert-time-${index}`}>
                      {formatTimeAgo(alert.timestamp)}
                    </p>
                    {alert.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeAlert.mutate(alert.id)}
                        disabled={acknowledgeAlert.isPending}
                        className="text-xs"
                        data-testid={`button-acknowledge-${index}`}
                      >
                        {acknowledgeAlert.isPending ? 'Acknowledging...' : 'Acknowledge'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {recentAlerts.length === 0 && (
            <div className="text-center py-8 text-white/70" data-testid="no-alerts">
              <Shield className="h-12 w-12 text-white/30 mx-auto mb-2" />
              <p>No recent alerts</p>
              <p className="text-sm">All systems operating normally</p>
            </div>
          )}
        </div>

        {alerts.length > 5 && (
          <div className="mt-6">
            <Button 
              variant="ghost" 
              className="w-full text-center text-primary hover:text-primary/80 text-sm font-medium transition-colors"
              data-testid="button-view-all-alerts"
            >
              View All Alerts ({alerts.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
