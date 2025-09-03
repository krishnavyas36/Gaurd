import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Clock } from "lucide-react";
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
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pii_detection':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'gdpr_consent':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300';
    }
  };

  return (
    <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-sm shadow-sm dark:bg-slate-800/70 dark:border-slate-700/60" data-testid="compliance-rules">
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Compliance Rules</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{rules.length} rules configured</span>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3" data-testid="rules-list">
          {rules.map((rule, index) => (
            <div 
              key={rule.id || index} 
              className="border border-slate-200/60 rounded-lg p-3 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700/60"
              data-testid={`rule-${index}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white" data-testid={`text-rule-name-${index}`}>
                    {rule.name}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={`${getRuleTypeColor(rule.ruleType)} text-xs px-2 py-1`}
                    data-testid={`badge-rule-type-${index}`}
                  >
                    {rule.ruleType?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {rule.isActive ? 'On' : 'Off'}
                    </span>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={() => toggleRule.mutate({ id: rule.id, isActive: rule.isActive })}
                      disabled={toggleRule.isPending}
                      data-testid={`switch-toggle-rule-${index}`}
                      className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300"
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2" data-testid={`text-rule-description-${index}`}>
                {rule.description}
              </p>
              
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-500">
                <Clock className="h-3 w-3 mr-1" />
                <span data-testid={`text-rule-last-triggered-${index}`}>
                  Last triggered: {formatLastTriggered(rule.lastTriggered)}
                </span>
              </div>
            </div>
          ))}
          
          {rules.length === 0 && (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400" data-testid="no-rules">
              <Check className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p>No compliance rules configured</p>
              <p className="text-sm">System ready for compliance monitoring</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
