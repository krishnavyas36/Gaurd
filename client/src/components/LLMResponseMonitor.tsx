import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, AlertTriangle, Shield, Eye } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface LLMResponseMonitorProps {
  violations: any[];
  stats: any;
}

export default function LLMResponseMonitor({ violations, stats }: LLMResponseMonitorProps) {
  const queryClient = useQueryClient();

  const scanResponse = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/llm/scan', { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const violationTime = new Date(timestamp);
    const diffMs = now.getTime() - violationTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const getViolationBadgeColor = (violationType: string) => {
    switch (violationType) {
      case 'financial_advice':
        return 'bg-error/10 text-error';
      case 'unverified_data':
        return 'bg-warning/10 text-warning';
      case 'pii_exposure':
        return 'bg-error/10 text-error';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getViolationLabel = (violationType: string) => {
    switch (violationType) {
      case 'financial_advice':
        return 'Financial Advice';
      case 'unverified_data':
        return 'Unverified Data';
      case 'pii_exposure':
        return 'PII Exposure';
      default:
        return violationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'blocked':
        return 'bg-error/10 text-error';
      case 'rewritten':
        return 'bg-warning/10 text-warning';
      case 'flagged':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const recentViolations = violations.slice(0, 5);

  return (
    <Card className="border border-gray-200" data-testid="llm-response-monitor">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">LLM Response Monitor</h2>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
            data-testid="button-configure-scanning"
          >
            <Settings className="h-4 w-4" />
            <span>Configure</span>
          </Button>
        </div>
      </div>
      <CardContent className="p-6">
        {/* Scanning Statistics */}
        <div className="grid grid-cols-3 gap-6 mb-6" data-testid="llm-stats">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900" data-testid="text-total-scanned">
              {stats?.llmResponsesScanned || 0}
            </div>
            <div className="text-sm text-gray-600">Responses Scanned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-warning" data-testid="text-flagged-responses">
              {stats?.llmResponsesFlagged || 0}
            </div>
            <div className="text-sm text-gray-600">Flagged Responses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-error" data-testid="text-blocked-responses">
              {stats?.llmResponsesBlocked || 0}
            </div>
            <div className="text-sm text-gray-600">Blocked Responses</div>
          </div>
        </div>

        {/* Recent LLM Violations */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Violations</h3>
          <div className="space-y-3" data-testid="violations-list">
            {recentViolations.map((violation, index) => (
              <div 
                key={violation.id || index} 
                className="border border-gray-200 rounded-lg p-4"
                data-testid={`violation-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge 
                        className={getViolationBadgeColor(violation.violationType)}
                        data-testid={`badge-violation-type-${index}`}
                      >
                        {getViolationLabel(violation.violationType)}
                      </Badge>
                      <span className="text-xs text-gray-500" data-testid={`text-violation-time-${index}`}>
                        {formatTimeAgo(violation.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2" data-testid={`text-violation-content-${index}`}>
                      "{violation.content?.substring(0, 100)}..."
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Action:</span>
                      <Badge 
                        className={getActionBadgeColor(violation.action)}
                        data-testid={`badge-violation-action-${index}`}
                      >
                        {violation.action === 'blocked' ? 'Response Blocked' : 
                         violation.action === 'rewritten' ? 'Response Rewritten' : 
                         violation.action === 'flagged' ? 'Response Flagged' : 
                         violation.action}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {recentViolations.length === 0 && (
              <div className="text-center py-8 text-gray-500" data-testid="no-violations">
                <Eye className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p>No recent violations</p>
                <p className="text-sm">LLM responses are operating within guidelines</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
