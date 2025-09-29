import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Settings, AlertTriangle, Shield, Eye, FileText, TestTube } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface LLMResponseMonitorProps {
  violations: any[];
  stats: any;
}

export default function LLMResponseMonitor({ violations, stats }: LLMResponseMonitorProps) {
  const queryClient = useQueryClient();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [scanSettings, setScanSettings] = useState({
    enableFinancialAdviceDetection: true,
    enablePIIDetection: true,
    enableUnverifiedDataDetection: true,
    autoBlockViolations: true,
    realtimeScanning: true
  });

  const scanResponse = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/llm/scan', { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    }
  });

  const testLLMResponse = useMutation({
    mutationFn: async (testType: string) => {
      const testPrompts = {
        financial: "You should invest all your money in Bitcoin right now for guaranteed returns!",
        pii: "Here's my social security number: 123-45-6789 and credit card: 4532-1234-5678-9012",
        unverified: "According to my insider sources, this company will announce major news tomorrow"
      };
      return apiRequest('POST', '/api/llm/generate', { 
        prompt: testPrompts[testType as keyof typeof testPrompts], 
        type: 'test' 
      });
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
  return 'bg-gray-100 text-white';
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
  return 'bg-gray-100 text-white';
    }
  };

  const recentViolations = violations.slice(0, 5);

  return (
    <Card className="border border-gray-200" data-testid="llm-response-monitor">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">LLM Response Monitor</h2>
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 border-emerald-500 text-emerald-500 dark:text-emerald-300 dark:border-emerald-400 hover:bg-emerald-500/10 focus:ring-emerald-500"
                data-testid="button-configure-scanning"
                style={{ fontWeight: 600, letterSpacing: '0.03em' }}
              >
                <Settings className="h-4 w-4 mr-1 text-emerald-500 dark:text-emerald-300" />
                <span>Configure</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-700 shadow-xl backdrop-blur-sm" aria-describedby="config-dialog-description">
              <DialogHeader>
                <DialogTitle className="text-emerald-600 dark:text-emerald-400">LLM Scanner Configuration</DialogTitle>
                <p id="config-dialog-description" className="text-sm text-slate-700 dark:text-slate-300">
                  Configure LLM response scanning settings and test detection capabilities
                </p>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                {/* Scanning Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">Detection Settings</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">Financial Advice Detection</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setScanSettings(prev => ({ ...prev, enableFinancialAdviceDetection: !prev.enableFinancialAdviceDetection }))}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                            ${scanSettings.enableFinancialAdviceDetection 
                              ? 'bg-emerald-600 hover:bg-emerald-700' 
                              : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
                            }
                          `}
                        >
                          <span className="sr-only">Toggle financial advice detection</span>
                          <span
                            className={`
                              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                              ${scanSettings.enableFinancialAdviceDetection ? 'translate-x-6' : 'translate-x-1'}
                            `}
                          />
                        </button>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          scanSettings.enableFinancialAdviceDetection 
                            ? 'bg-emerald-700/20 text-emerald-400 border-emerald-500' 
                            : 'bg-slate-700/30 text-slate-400 border-slate-500'
                        }`}>
                              {scanSettings.enableFinancialAdviceDetection ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">PII Detection</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setScanSettings(prev => ({ ...prev, enablePIIDetection: !prev.enablePIIDetection }))}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                            ${scanSettings.enablePIIDetection 
                              ? 'bg-emerald-600 hover:bg-emerald-700' 
                              : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
                            }
                          `}
                        >
                          <span className="sr-only">Toggle PII detection</span>
                          <span
                            className={`
                              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                              ${scanSettings.enablePIIDetection ? 'translate-x-6' : 'translate-x-1'}
                            `}
                          />
                        </button>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          scanSettings.enablePIIDetection 
                            ? 'bg-emerald-700/20 text-emerald-400 border-emerald-500' 
                            : 'bg-slate-700/30 text-slate-400 border-slate-500'
                        }`}>
                              {scanSettings.enablePIIDetection ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">Unverified Data Detection</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setScanSettings(prev => ({ ...prev, enableUnverifiedDataDetection: !prev.enableUnverifiedDataDetection }))}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                            ${scanSettings.enableUnverifiedDataDetection 
                              ? 'bg-emerald-600 hover:bg-emerald-700' 
                              : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
                            }
                          `}
                        >
                          <span className="sr-only">Toggle unverified data detection</span>
                          <span
                            className={`
                              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                              ${scanSettings.enableUnverifiedDataDetection ? 'translate-x-6' : 'translate-x-1'}
                            `}
                          />
                        </button>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          scanSettings.enableUnverifiedDataDetection 
                            ? 'bg-emerald-700/20 text-emerald-400 border-emerald-500' 
                            : 'bg-slate-700/30 text-slate-400 border-slate-500'
                        }`}>
                              {scanSettings.enableUnverifiedDataDetection ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">Auto-block Violations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setScanSettings(prev => ({ ...prev, autoBlockViolations: !prev.autoBlockViolations }))}
                          className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                            ${scanSettings.autoBlockViolations 
                              ? 'bg-emerald-600 hover:bg-emerald-700' 
                              : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
                            }
                          `}
                        >
                          <span className="sr-only">Toggle auto-block violations</span>
                          <span
                            className={`
                              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                              ${scanSettings.autoBlockViolations ? 'translate-x-6' : 'translate-x-1'}
                            `}
                          />
                        </button>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          scanSettings.autoBlockViolations 
                            ? 'bg-emerald-700/20 text-emerald-400 border-emerald-500' 
                            : 'bg-slate-700/30 text-slate-400 border-slate-500'
                        }`}>
                              {scanSettings.autoBlockViolations ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Functions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">Test Scanner</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testLLMResponse.mutate('financial')}
                      disabled={testLLMResponse.isPending}
                      className="flex items-center space-x-2 border-emerald-500 text-emerald-500 dark:text-emerald-300 dark:border-emerald-400 hover:bg-emerald-500/10 focus:ring-emerald-500"
                    >
                      <TestTube className="h-4 w-4 mr-1 text-emerald-500 dark:text-emerald-300" />
                      <span>Test Financial Advice Detection</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testLLMResponse.mutate('pii')}
                      disabled={testLLMResponse.isPending}
                      className="flex items-center space-x-2 border-emerald-500 text-emerald-500 dark:text-emerald-300 dark:border-emerald-400 hover:bg-emerald-500/10 focus:ring-emerald-500"
                    >
                      <TestTube className="h-4 w-4 mr-1 text-emerald-500 dark:text-emerald-300" />
                      <span>Test PII Detection</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testLLMResponse.mutate('unverified')}
                      disabled={testLLMResponse.isPending}
                      className="flex items-center space-x-2 border-emerald-500 text-emerald-500 dark:text-emerald-300 dark:border-emerald-400 hover:bg-emerald-500/10 focus:ring-emerald-500"
                    >
                      <TestTube className="h-4 w-4 mr-1 text-emerald-500 dark:text-emerald-300" />
                      <span>Test Unverified Data Detection</span>
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsConfigOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Here you could save settings to backend
                      setIsConfigOpen(false);
                    }}
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <CardContent className="p-6">
        {/* Scanning Statistics */}
        <div className="grid grid-cols-3 gap-6 mb-6" data-testid="llm-stats">
          <div className="text-center">
            <div className="text-2xl font-semibold text-white" data-testid="text-total-scanned">
              {stats?.llmResponsesScanned || 0}
            </div>
            <div className="text-sm text-white/70">Responses Scanned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-white" data-testid="text-flagged-responses">
              {stats?.llmResponsesFlagged || 0}
            </div>
            <div className="text-sm text-white/70">Flagged Responses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-white" data-testid="text-blocked-responses">
              {stats?.llmResponsesBlocked || 0}
            </div>
            <div className="text-sm text-white/70">Blocked Responses</div>
          </div>
        </div>

        {/* Recent LLM Violations */}
        <div>
          <h3 className="text-sm font-medium text-white mb-4">Recent Violations</h3>
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
                      <span className="text-xs text-white/70" data-testid={`text-violation-time-${index}`}> 
                          {formatTimeAgo(violation.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 mb-2" data-testid={`text-violation-content-${index}`}> 
                      "{violation.content?.substring(0, 100)}..."
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-white/70">Action:</span>
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
              <div className="text-center py-8 text-white/70" data-testid="no-violations">
                <Eye className="h-12 w-12 text-white/30 mx-auto mb-2" />
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
