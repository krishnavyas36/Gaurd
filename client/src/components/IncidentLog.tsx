import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, AlertCircle, AlertTriangle, Info, ExternalLink, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface IncidentLogProps {
  incidents: any[];
}

export default function IncidentLog({ incidents }: IncidentLogProps) {
  const queryClient = useQueryClient();
  const [isAllIncidentsOpen, setIsAllIncidentsOpen] = useState(false);

  const updateIncident = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return apiRequest('PATCH', `/api/incidents/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  });

  const exportIncidents = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/incidents/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security_incidents_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    },
    onSuccess: () => {
      console.log(`Exported ${incidents.length} incidents to CSV`);
    }
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const incidentTime = new Date(timestamp);
    const diffMs = now.getTime() - incidentTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-4 border-error bg-error/5';
      case 'warning':
        return 'border-l-4 border-warning bg-warning/5';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'completed':
        return 'bg-secondary/10 text-secondary';
      case 'investigating':
        return 'bg-gray-100 text-gray-800';
      case 'open':
        return 'bg-error/10 text-error';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'completed':
        return 'Completed';
      case 'investigating':
        return 'Investigating';
      case 'open':
        return 'Open';
      default:
        return status;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'investigating':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const recentIncidents = incidents.slice(0, 5);

  const handleExportIncidents = () => {
    try {
      // Create CSV content
      const csvHeaders = ['Date', 'Severity', 'Description', 'Status', 'Source', 'ID'];
      const csvRows = incidents.map(incident => [
        new Date(incident.timestamp).toLocaleString(),
        incident.severity,
        `"${incident.description.replace(/"/g, '""')}"`, // Escape quotes
        incident.status,
        incident.source,
        incident.id
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `security_incidents_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Exported ${incidents.length} incidents to CSV`);
    } catch (error) {
      console.error('Error exporting incidents:', error);
    }
  };

  return (
    <Card className="border border-gray-200" data-testid="incident-log">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Incident Log</h2>
          <Button 
            variant="ghost"
            size="sm"
            onClick={handleExportIncidents}
            className="text-primary hover:text-primary/80 text-sm font-medium flex items-center space-x-2"
            data-testid="button-export-incidents"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="space-y-4" data-testid="incidents-list">
          {recentIncidents.map((incident, index) => (
            <div 
              key={incident.id || index} 
              className={`${getSeverityBorderColor(incident.severity)} p-3 rounded-r-lg`}
              data-testid={`incident-${index}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getSeverityTextColor(incident.severity)}`}>
                    {getSeverityIcon(incident.severity)}
                  </span>
                  <span className={`text-sm font-medium ${getSeverityTextColor(incident.severity)}`} data-testid={`text-incident-severity-${index}`}>
                    {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                  </span>
                </div>
                <span className="text-xs text-gray-500" data-testid={`text-incident-time-${index}`}>
                  {formatTimeAgo(incident.timestamp)}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mb-2" data-testid={`text-incident-description-${index}`}>
                {incident.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge 
                  className={getStatusBadgeColor(incident.status)}
                  data-testid={`badge-incident-status-${index}`}
                >
                  {getStatusLabel(incident.status)}
                </Badge>
                
                {incident.status === 'open' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateIncident.mutate({ 
                      id: incident.id, 
                      updates: { status: 'investigating' } 
                    })}
                    disabled={updateIncident.isPending}
                    className="text-xs"
                    data-testid={`button-update-incident-${index}`}
                  >
                    {updateIncident.isPending ? 'Updating...' : 'Investigate'}
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {recentIncidents.length === 0 && (
            <div className="text-center py-8 text-gray-500" data-testid="no-incidents">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No recent incidents</p>
              <p className="text-sm">All systems operating normally</p>
            </div>
          )}
        </div>

        {incidents.length > 5 && (
          <div className="mt-6">
            <Dialog open={isAllIncidentsOpen} onOpenChange={setIsAllIncidentsOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full text-center text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                  data-testid="button-view-all-incidents"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Incidents ({incidents.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl" aria-describedby="incidents-dialog-description">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>All Security Incidents ({incidents.length})</span>
                    </DialogTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportIncidents.mutate()}
                      disabled={exportIncidents.isPending}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export CSV</span>
                    </Button>
                  </div>
                  <p id="incidents-dialog-description" className="text-sm text-slate-600 dark:text-slate-400">
                    Complete list of security incidents with details and resolution status
                  </p>
                </DialogHeader>
                <div className="space-y-4 overflow-y-auto max-h-96">
                  {incidents.map((incident, index) => (
                    <div 
                      key={incident.id || index} 
                      className={`p-4 rounded-lg border transition-colors ${getSeverityBorderColor(incident.severity)}`}
                      data-testid={`incident-${index}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`flex items-center space-x-1 ${
                              incident.severity === 'critical' ? 'text-error' : 
                              incident.severity === 'warning' ? 'text-warning' : 
                              'text-info'
                            }`}>
                              {getSeverityIcon(incident.severity)}
                              <Badge 
                                className={getSeverityColor(incident.severity)}
                                data-testid={`badge-severity-${index}`}
                              >
                                {incident.severity?.toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400" data-testid={`text-time-${index}`}>
                              {formatTimeAgo(incident.timestamp)}
                            </span>
                            <Badge 
                              className={getStatusColor(incident.status)}
                              data-testid={`badge-status-${index}`}
                            >
                              {incident.status || 'Open'}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1" data-testid={`text-description-${index}`}>
                            {incident.description}
                          </h4>
                          {incident.source && (
                            <div className="flex items-center space-x-1 mb-2">
                              <span className="text-xs text-slate-500">Source:</span>
                              <Badge variant="outline" className="text-xs">
                                {incident.source}
                              </Badge>
                            </div>
                          )}
                          {incident.id && (
                            <div className="text-xs text-slate-400 font-mono">
                              ID: {incident.id}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {incident.status !== 'resolved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateIncident.mutate({ 
                                id: incident.id, 
                                updates: { status: 'resolved' } 
                              })}
                              disabled={updateIncident.isPending}
                              className="text-xs"
                              data-testid={`button-resolve-${index}`}
                            >
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
