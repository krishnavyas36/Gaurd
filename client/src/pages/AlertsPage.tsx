import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Clock, XCircle, Shield, Bell } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  status: "active" | "acknowledged" | "resolved";
  timestamp: string;
  metadata?: any;
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "critical">("all");

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["/api/alerts"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800";
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    console.log('Acknowledging alert with ID:', alertId);
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to acknowledge alert: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Alert acknowledged successfully:', result);
      // Refresh will happen automatically due to refetchInterval
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to resolve alert: ${response.statusText}`);
      }
      
      console.log('Alert resolved successfully');
      // Refresh will happen automatically due to refetchInterval
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const alertsList = Array.isArray(alerts) ? alerts : [];
  const filteredAlerts = alertsList.filter((alert: SecurityAlert) => {
    if (filter === "all") return true;
    if (filter === "active") return alert.status === "active";
    if (filter === "critical") return alert.severity === "critical";
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading security alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" data-testid="alerts-page">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Security Alerts
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage security incidents and compliance violations
            </p>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              data-testid="filter-all"
            >
              All ({alertsList.length})
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("active")}
              data-testid="filter-active"
            >
              Active ({alertsList.filter((a: SecurityAlert) => a.status === "active").length})
            </Button>
            <Button
              variant={filter === "critical" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("critical")}
              data-testid="filter-critical"
            >
              Critical ({alertsList.filter((a: SecurityAlert) => a.severity === "critical").length})
            </Button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
                <p className="text-muted-foreground">
                  {filter === "all" 
                    ? "Your system is secure. No alerts have been generated."
                    : `No ${filter} alerts found. Try adjusting your filter.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert: SecurityAlert) => (
              <Alert
                key={alert.id}
                className={`p-6 ${getSeverityColor(alert.severity)}`}
                data-testid={`alert-${alert.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status.toUpperCase()}
                        </Badge>
                      </div>
                      <AlertDescription className="mb-3">
                        {alert.description}
                      </AlertDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Source: {alert.source}</span>
                        <span>•</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {alert.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.id)}
                        data-testid={`acknowledge-${alert.id}`}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {alert.status !== "resolved" && (
                      <Button
                        size="sm"
                        onClick={() => handleResolve(alert.id)}
                        data-testid={`resolve-${alert.id}`}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </Alert>
            ))
          )}
        </div>
      </div>
    </div>
  );
}