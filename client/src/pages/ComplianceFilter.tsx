import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Settings,
  Search,
  FileText,
  Lock,
  Eye,
  Ban
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";

interface FilterRule {
  id: string;
  name: string;
  ruleType: string;
  isActive: boolean;
  config: any;
  description: string;
  severity: string;
  lastTriggered: string | null;
}

interface FilteredItem {
  id: string;
  type: string;
  content: string;
  riskLevel: string;
  timestamp: string;
  action: string;
  source: string;
}

export default function ComplianceFilter() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("filters");
  const [newRule, setNewRule] = useState({
    name: "",
    ruleType: "pii_detection",
    description: "",
    severity: "medium",
    config: {}
  });

  const { data: filterRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/compliance/rules'],
  });

  const { data: filteredItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/compliance/filtered-items'],
  });

  const { data: complianceStats = {} } = useQuery({
    queryKey: ['/api/compliance/stats'],
  });

  const createRule = useMutation({
    mutationFn: async (rule: any) => {
      return apiRequest('POST', '/api/compliance/rules', rule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/rules'] });
      setNewRule({
        name: "",
        ruleType: "pii_detection",
        description: "",
        severity: "medium",
        config: {}
      });
    }
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest('PATCH', `/api/compliance/rules/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/rules'] });
    }
  });

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'pii_detection':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'financial_data':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'gdpr_consent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'rate_limit':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'data_export':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'blocked':
        return <Ban className="h-4 w-4 text-red-500" />;
      case 'flagged':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'monitored':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'encrypted':
        return <Lock className="h-4 w-4 text-green-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.description) return;
    
    const ruleConfig = {
      ...newRule,
      config: {
        threshold: newRule.ruleType === 'rate_limit' ? 100 : undefined,
        patterns: newRule.ruleType === 'pii_detection' ? ['ssn', 'credit_card', 'email'] : undefined,
        requiredFields: newRule.ruleType === 'gdpr_consent' ? ['marketing', 'analytics'] : undefined,
      }
    };
    
    createRule.mutate(ruleConfig);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="compliance-filter-page">
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Filter className="h-6 w-6 mr-2 text-primary" />
              Compliance Filtering & Security Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor, filter, and ensure compliance across your financial data
            </p>
          </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="compliance-stats">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Rules</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(filterRules as FilterRule[]).filter((rule: FilterRule) => rule.isActive).length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Items Filtered</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(complianceStats as any)?.totalFiltered || 0}
                </p>
              </div>
              <Filter className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Compliance Score</p>
                <p className="text-2xl font-bold text-primary">
                  {(complianceStats as any)?.complianceScore || 85}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">High Risk Items</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(complianceStats as any)?.highRiskItems || 3}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="filters">Filter Rules</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
        </TabsList>

        {/* Filter Rules Tab */}
        <TabsContent value="filters" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create New Rule */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Filter Rule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., Block SSN in API responses"
                    data-testid="input-rule-name"
                  />
                </div>

                <div>
                  <Label htmlFor="rule-type">Rule Type</Label>
                  <Select value={newRule.ruleType} onValueChange={(value) => setNewRule({ ...newRule, ruleType: value })}>
                    <SelectTrigger data-testid="select-rule-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pii_detection">PII Detection</SelectItem>
                      <SelectItem value="financial_data">Financial Data</SelectItem>
                      <SelectItem value="gdpr_consent">GDPR Consent</SelectItem>
                      <SelectItem value="rate_limit">Rate Limiting</SelectItem>
                      <SelectItem value="data_export">Data Export Control</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rule-severity">Severity</Label>
                  <Select value={newRule.severity} onValueChange={(value) => setNewRule({ ...newRule, severity: value })}>
                    <SelectTrigger data-testid="select-rule-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rule-description">Description</Label>
                  <Textarea
                    id="rule-description"
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    placeholder="Describe what this rule does..."
                    data-testid="textarea-rule-description"
                  />
                </div>

                <Button 
                  onClick={handleCreateRule}
                  disabled={createRule.isPending || !newRule.name || !newRule.description}
                  className="w-full"
                  data-testid="button-create-rule"
                >
                  {createRule.isPending ? 'Creating...' : 'Create Rule'}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Rules */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Active Filter Rules</h3>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search rules..." 
                    className="w-64"
                    data-testid="input-search-rules"
                  />
                </div>
              </div>

              <div className="space-y-3" data-testid="filter-rules-list">
                {rulesLoading ? (
                  <div className="text-center py-8">Loading rules...</div>
                ) : (filterRules as FilterRule[]).length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No filter rules configured</p>
                      <p className="text-sm text-gray-400">Create your first rule to start filtering</p>
                    </CardContent>
                  </Card>
                ) : (
                  (filterRules as FilterRule[]).map((rule: FilterRule, index: number) => (
                    <Card key={rule.id} className="border-l-4" style={{ borderLeftColor: getSeverityColor(rule.severity) }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white" data-testid={`text-rule-name-${index}`}>
                                {rule.name}
                              </h4>
                              <Badge className={getRuleTypeColor(rule.ruleType)} data-testid={`badge-rule-type-${index}`}>
                                {rule.ruleType.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2" data-testid={`text-rule-description-${index}`}>
                              {rule.description}
                            </p>
                            
                            {rule.lastTriggered && (
                              <p className="text-xs text-gray-500" data-testid={`text-rule-last-triggered-${index}`}>
                                Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={() => toggleRule.mutate({ id: rule.id, isActive: rule.isActive })}
                              data-testid={`switch-rule-active-${index}`}
                            />
                            <Button variant="ghost" size="sm" data-testid={`button-edit-rule-${index}`}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Live Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Live Security Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="filtered-items-list">
                {itemsLoading ? (
                  <div className="text-center py-8">Loading filtered items...</div>
                ) : (filteredItems as FilteredItem[]).length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-2" />
                    <p className="text-gray-500">No filtered items - all clear!</p>
                  </div>
                ) : (
                  (filteredItems as FilteredItem[]).map((item: FilteredItem, index: number) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                      data-testid={`filtered-item-${index}`}
                    >
                      <div className="flex items-center space-x-3">
                        {getActionIcon(item.action)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white" data-testid={`text-item-type-${index}`}>
                            {item.type.replace('_', ' ').toUpperCase()} detected
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-item-source-${index}`}>
                            Source: {item.source}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={item.riskLevel === 'high' ? 'destructive' : 'secondary'}
                          data-testid={`badge-risk-level-${index}`}
                        >
                          {item.riskLevel.toUpperCase()} RISK
                        </Badge>
                        <span className="text-xs text-gray-500" data-testid={`text-item-time-${index}`}>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Compliance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>GDPR Compliance</AlertTitle>
                  <AlertDescription>
                    All data processing activities comply with GDPR requirements. 
                    Last audit: {new Date().toLocaleDateString()}
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>SOC2 Compliance</AlertTitle>
                  <AlertDescription>
                    Security controls meet SOC2 Type II requirements. 
                    Next review scheduled for next month.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>PCI DSS</AlertTitle>
                  <AlertDescription>
                    Minor issues detected in payment data handling. 
                    3 items require attention.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" data-testid="button-export-compliance-report">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Compliance Report
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-run-audit">
                  <Search className="h-4 w-4 mr-2" />
                  Run Security Audit
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-review-policies">
                  <Shield className="h-4 w-4 mr-2" />
                  Review Security Policies
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-configure-alerts">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Configure Alert Thresholds
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
        </div>
      </main>
    </div>
  );
}