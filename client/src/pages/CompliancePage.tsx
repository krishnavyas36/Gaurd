import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Scan,
  Database,
  TrendingUp,
  Eye,
  Settings
} from "lucide-react";

interface Violation {
  type: string;
  subtype: string;
  pattern: string;
  matches: number;
  action: string;
  severity: string;
  source: string;
  content: string;
  timestamp: string;
}

interface LogMetrics {
  totalLogs: number;
  errorRate: number;
  services: {
    FastAPI: number;
    OpenAI: number;
  };
  avgResponseTime: number;
  totalAICost: number;
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState("scanner");
  const [scanText, setScanText] = useState("");
  const [scanSource, setScanSource] = useState("");
  const [scanType, setScanType] = useState("text");
  const [fastApiLog, setFastApiLog] = useState("");
  const [openAiLog, setOpenAiLog] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: complianceReport } = useQuery({
    queryKey: ["/api/compliance/report"],
    refetchInterval: 30000,
  });

  const { data: logMetrics } = useQuery({
    queryKey: ["/api/logs/metrics"],
    refetchInterval: 10000,
  });

  const { data: complianceConfig } = useQuery({
    queryKey: ["/api/compliance/config"],
  });

  // Mutations
  const scanMutation = useMutation({
    mutationFn: async (data: { text: string; source: string; type: string }) => {
      const response = await fetch("/api/compliance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Scan failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Compliance Scan Complete",
        description: `Found ${data.violation_count} violations`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/data-classifications"] });
    },
    onError: () => {
      toast({
        title: "Scan Failed",
        description: "Unable to complete compliance scan",
        variant: "destructive",
      });
    },
  });

  const fastApiLogMutation = useMutation({
    mutationFn: async (logData: any) => {
      const response = await fetch("/api/logs/fastapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      if (!response.ok) throw new Error("Log ingestion failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "FastAPI Log Ingested",
        description: "Log successfully processed and analyzed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logs/metrics"] });
    },
  });

  const openAiLogMutation = useMutation({
    mutationFn: async (logData: any) => {
      const response = await fetch("/api/logs/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      if (!response.ok) throw new Error("Log ingestion failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "OpenAI Log Ingested",
        description: "AI usage log processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logs/metrics"] });
    },
  });

  const handleScan = () => {
    if (!scanText || !scanSource) {
      toast({
        title: "Missing Information",
        description: "Please provide both text and source",
        variant: "destructive",
      });
      return;
    }
    scanMutation.mutate({ text: scanText, source: scanSource, type: scanType });
  };

  const handleFastApiLogSubmit = () => {
    try {
      const logData = JSON.parse(fastApiLog);
      fastApiLogMutation.mutate(logData);
      setFastApiLog("");
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please provide valid JSON log data",
        variant: "destructive",
      });
    }
  };

  const handleOpenAiLogSubmit = () => {
    try {
      const logData = JSON.parse(openAiLog);
      openAiLogMutation.mutate(logData);
      setOpenAiLog("");
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please provide valid JSON log data",
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-background p-6" data-testid="compliance-page">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <Shield className="h-8 w-8" />
              Advanced Compliance Engine
            </h1>
            <p className="text-muted-foreground mt-2">
              Enhanced PII detection, log ingestion, and real-time compliance monitoring
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-bold">
                    {complianceReport?.report?.rules_enabled || 0}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Logs Processed</p>
                  <p className="text-2xl font-bold">
                    {logMetrics?.metrics?.totalLogs || 0}
                  </p>
                </div>
                <Database className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Cost</p>
                  <p className="text-2xl font-bold">
                    ${(logMetrics?.metrics?.totalAICost || 0).toFixed(3)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">
                    {Math.round(logMetrics?.metrics?.avgResponseTime || 0)}ms
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              Compliance Scanner
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Log Ingestion
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Metrics & Analytics
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Compliance Scanner Tab */}
          <TabsContent value="scanner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Real-time Compliance Scanner
                </CardTitle>
                <CardDescription>
                  Scan text, transactions, API calls, and AI usage for compliance violations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scan-source">Source</Label>
                    <Input
                      id="scan-source"
                      placeholder="e.g., Customer Data, API Response"
                      value={scanSource}
                      onChange={(e) => setScanSource(e.target.value)}
                      data-testid="input-scan-source"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scan-type">Scan Type</Label>
                    <Select value={scanType} onValueChange={setScanType}>
                      <SelectTrigger data-testid="select-scan-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Content</SelectItem>
                        <SelectItem value="transaction">Transaction Data</SelectItem>
                        <SelectItem value="api">API Call Data</SelectItem>
                        <SelectItem value="ai">AI Usage Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scan-text">Content to Scan</Label>
                  <Textarea
                    id="scan-text"
                    placeholder="Enter text content, JSON data, or paste logs to scan for compliance violations..."
                    value={scanText}
                    onChange={(e) => setScanText(e.target.value)}
                    rows={6}
                    data-testid="textarea-scan-content"
                  />
                </div>

                <Button 
                  onClick={handleScan} 
                  disabled={scanMutation.isPending}
                  className="w-full"
                  data-testid="button-run-scan"
                >
                  {scanMutation.isPending ? "Scanning..." : "Run Compliance Scan"}
                </Button>

                {/* Example buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setScanText("User John Doe with SSN 123-45-6789 and credit card 4532-1234-5678-9012");
                      setScanSource("Customer Database");
                      setScanType("text");
                    }}
                    data-testid="button-example-pii"
                  >
                    Example: PII Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setScanText('{"amount": 15000, "account_id": "acc_123", "recent_count": 75}');
                      setScanSource("Transaction API");
                      setScanType("transaction");
                    }}
                    data-testid="button-example-transaction"
                  >
                    Example: High Volume Transaction
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setScanText('{"model": "gpt-5", "tokens": {"total": 15000}, "cost": 2.5}');
                      setScanSource("AI Service");
                      setScanType("ai");
                    }}
                    data-testid="button-example-ai"
                  >
                    Example: AI Usage
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Scan Results */}
            {scanMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Scan Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {scanMutation.data.violation_count} violations found
                      </Badge>
                      <Badge variant="outline">
                        Source: {scanMutation.data.source}
                      </Badge>
                      <Badge variant="outline">
                        Type: {scanMutation.data.type}
                      </Badge>
                    </div>
                    
                    {scanMutation.data.violations?.map((violation: Violation, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {violation.type.replace('_', ' ').toUpperCase()} - {violation.subtype}
                          </h4>
                          <Badge className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {violation.pattern}
                        </p>
                        <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                          {violation.content}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Action: {violation.action} • Matches: {violation.matches}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Log Ingestion Tab */}
          <TabsContent value="logs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* FastAPI Logs */}
              <Card>
                <CardHeader>
                  <CardTitle>FastAPI Log Ingestion</CardTitle>
                  <CardDescription>
                    Submit API logs for security analysis and compliance checking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder='{"timestamp":"2025-08-31T02:20:00Z","level":"INFO","method":"POST","url":"/api/users","status_code":401,"response_time":150,"user_agent":"suspicious-bot","client_ip":"192.168.1.100"}'
                    value={fastApiLog}
                    onChange={(e) => setFastApiLog(e.target.value)}
                    rows={8}
                    data-testid="textarea-fastapi-log"
                  />
                  <Button 
                    onClick={handleFastApiLogSubmit}
                    disabled={fastApiLogMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-fastapi-log"
                  >
                    {fastApiLogMutation.isPending ? "Processing..." : "Ingest FastAPI Log"}
                  </Button>
                </CardContent>
              </Card>

              {/* OpenAI Logs */}
              <Card>
                <CardHeader>
                  <CardTitle>OpenAI Usage Log Ingestion</CardTitle>
                  <CardDescription>
                    Submit AI usage logs for cost monitoring and compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder='{"timestamp":"2025-08-31T02:20:00Z","model":"gpt-5","usage":{"prompt_tokens":1500,"completion_tokens":500,"total_tokens":2000},"duration":3000,"cost":0.15}'
                    value={openAiLog}
                    onChange={(e) => setOpenAiLog(e.target.value)}
                    rows={8}
                    data-testid="textarea-openai-log"
                  />
                  <Button 
                    onClick={handleOpenAiLogSubmit}
                    disabled={openAiLogMutation.isPending}
                    className="w-full"
                    data-testid="button-submit-openai-log"
                  >
                    {openAiLogMutation.isPending ? "Processing..." : "Ingest OpenAI Log"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Log Processing Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Logs Processed:</span>
                      <span className="font-bold">{logMetrics?.metrics?.totalLogs || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error Rate:</span>
                      <span className="font-bold">
                        {((logMetrics?.metrics?.errorRate || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>FastAPI Logs:</span>
                      <span className="font-bold">{logMetrics?.metrics?.services?.FastAPI || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>OpenAI Logs:</span>
                      <span className="font-bold">{logMetrics?.metrics?.services?.OpenAI || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Response Time:</span>
                      <span className="font-bold">
                        {Math.round(logMetrics?.metrics?.avgResponseTime || 0)}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total AI Cost:</span>
                      <span className="font-bold">
                        ${(logMetrics?.metrics?.totalAICost || 0).toFixed(4)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Config Version:</span>
                      <span className="font-bold">{complianceReport?.report?.config_version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Rules:</span>
                      <span className="font-bold">{complianceReport?.report?.rules_enabled}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Rules:</span>
                      <span className="font-bold">{complianceReport?.report?.total_rules}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monitoring Status:</span>
                      <Badge className={complianceReport?.report?.monitoring_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {complianceReport?.report?.monitoring_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="text-sm text-muted-foreground">
                        {complianceReport?.report?.last_updated}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Configuration</CardTitle>
                <CardDescription>
                  Current compliance rules and monitoring settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {complianceConfig?.config?.rules && Object.entries(complianceConfig.config.rules).map(([ruleType, rule]: [string, any]) => (
                    <div key={ruleType} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">
                          {ruleType.replace('_', ' ')}
                        </h4>
                        <Badge className={rule.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Severity: {rule.severity}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {rule.patterns && `${Object.keys(rule.patterns).length} patterns configured`}
                        {rule.rules && `${Object.keys(rule.rules).length} rules configured`}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}