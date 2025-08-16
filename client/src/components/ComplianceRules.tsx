import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Check, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ComplianceRulesProps {
  rules: any[];
}

export default function ComplianceRules({ rules }: ComplianceRulesProps) {
  const queryClient = useQueryClient();

  const toggleRule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest('PATCH', `/api/compliance/rules/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  });

  const formatLastTriggered = (lastTriggered: string | null) => {
    if (!lastTriggered) return 'Never';
    
    const now = new Date();
    const triggeredTime = new Date(lastTriggered);
    const diffMs = now.getTime() - triggeredTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'rate_limit':
        return 'bg-blue-100 text-blue-800';
      case 'pii_detection':
        return 'bg-red-100 text-red-800';
      case 'gdpr_consent':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border border-gray-200" data-testid="compliance-rules">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Compliance Rules</h2>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
            data-testid="button-add-rule"
          >
            <Plus className="h-4 w-4" />
            <span>Add Rule</span>
          </Button>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="space-y-4" data-testid="rules-list">
          {rules.map((rule, index) => (
            <div 
              key={rule.id || index} 
              className="border border-gray-200 rounded-lg p-4"
              data-testid={`rule-${index}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="text-sm font-medium text-gray-900" data-testid={`text-rule-name-${index}`}>
                    {rule.name}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={getRuleTypeColor(rule.ruleType)}
                    data-testid={`badge-rule-type-${index}`}
                  >
                    {rule.ruleType?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={rule.isActive ? "default" : "secondary"}
                    className={rule.isActive ? "bg-secondary/10 text-secondary" : "bg-gray-100 text-gray-600"}
                    data-testid={`badge-rule-status-${index}`}
                  >
                    {rule.isActive ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      'Inactive'
                    )}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRule.mutate({ id: rule.id, isActive: rule.isActive })}
                    disabled={toggleRule.isPending}
                    data-testid={`button-toggle-rule-${index}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-2" data-testid={`text-rule-description-${index}`}>
                {rule.description}
              </p>
              
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                <span data-testid={`text-rule-last-triggered-${index}`}>
                  Last triggered: {formatLastTriggered(rule.lastTriggered)}
                </span>
              </div>
            </div>
          ))}
          
          {rules.length === 0 && (
            <div className="text-center py-8 text-gray-500" data-testid="no-rules">
              <Check className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No compliance rules configured</p>
              <p className="text-sm">Add rules to start monitoring compliance</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
