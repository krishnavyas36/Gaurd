import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Square, 
  Activity, 
  Settings,
  Shield,
  Eye,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Database,
  Cpu
} from "lucide-react";

interface MonitoringStatus {
  isActive: boolean;
  startTime?: string;
  monitoredAPIs: string[];
  totalChecks: number;
  lastActivity: string;
}

export default function MonitoringControlPage() {
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState("https://api.plaid.com");
  const [monitoringInterval, setMonitoringInterval] = useState(5);
  const [autoStartEnabled, setAutoStartEnabled] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulate monitoring status
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus>({
    isActive: false,
    monitoredAPIs: [],
    totalChecks: 0,
    lastActivity: "Not started"
  });

  // Auto-refresh monitoring status
  useEffect(() => {
    if (monitoringActive) {
      const interval = setInterval(() => {
        setMonitoringStatus(prev => ({
          ...prev,
          totalChecks: prev.totalChecks + 1,
          lastActivity: new Date().toLocaleTimeString()
        }));
      }, monitoringInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [monitoringActive, monitoringInterval]);

  const startMonitoring = useMutation({
    mutationFn: async () => {
      // Simulate API call to start monitoring
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      setMonitoringActive(true);
      setMonitoringStatus({
        isActive: true,
        startTime: new Date().toISOString(),
        monitoredAPIs: [apiEndpoint, "Internal APIs", "Database connections"],
        totalChecks: 0,
        lastActivity: "Monitoring started"
      });
      toast({
        title: "Monitoring Started",
        description: `Security monitoring is now active for ${apiEndpoint}`,
      });
      
      // Simulate some initial security events
      setTimeout(() => {
        simulateSecurityEvent("PII Detection", "Credit card pattern detected in API response");
      }, 3000);
      setTimeout(() => {
        simulateSecurityEvent("High Volume Alert", "Unusual transaction count detected");
      }, 8000);
    },
  });

  const stopMonitoring = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      setMonitoringActive(false);
      setMonitoringStatus(prev => ({
        ...prev,
        isActive: false,
        lastActivity: "Monitoring stopped"
      }));
      toast({
        title: "Monitoring Stopped",
        description: "Security monitoring has been deactivated",
      });
    },
  });

  const simulateSecurityEvent = (type: string, description: string) => {
    toast({
      title: `🚨 Security Alert: ${type}`,
      description: description,
      variant: "destructive",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
  };

  const triggerManualScan = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/compliance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Test user data with SSN 123-45-6789 and email john@example.com",
          source: "Manual Security Test",
          type: "text"
        }),
      });
      if (!response.ok) throw new Error("Scan failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Manual Scan Complete",
        description: `Found ${data.violation_count} compliance violations`,
      });
    },
  });

  const ingestTestLog = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logs/fastapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "ERROR",
          method: "POST",
          url: "/api/sensitive-data",
          status_code: 401,
          response_time: 2500,
          user_agent: "suspicious-scanner",
          client_ip: "192.168.1.100",
          endpoint: "/api/sensitive-data"
        }),
      });
      if (!response.ok) throw new Error("Log ingestion failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Log Ingested",
        description: "Suspicious log activity detected and processed",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background p-6" data-testid="monitoring-control-page">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <Activity className="h-8 w-8" />
              Security Monitoring Control Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Start, stop, and manage real-time security monitoring for your applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${monitoringActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium">
              {monitoringActive ? 'MONITORING ACTIVE' : 'MONITORING INACTIVE'}
            </span>
          </div>
        </div>

        {/* Control Panel */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Monitoring Controls
            </CardTitle>
            <CardDescription>
              Control when and how the security monitoring system operates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Start/Stop Controls */}
              <div className="space-y-4">
                <h4 className="font-medium">Primary Controls</h4>
                <div className="space-y-3">
                  <Button 
                    onClick={() => startMonitoring.mutate()}
                    disabled={monitoringActive || startMonitoring.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-start-monitoring"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {startMonitoring.isPending ? "Starting..." : "Start Monitoring"}
                  </Button>
                  
                  <Button 
                    onClick={() => stopMonitoring.mutate()}
                    disabled={!monitoringActive || stopMonitoring.isPending}
                    variant="destructive"
                    className="w-full"
                    data-testid="button-stop-monitoring"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    {stopMonitoring.isPending ? "Stopping..." : "Stop Monitoring"}
                  </Button>
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium">Configuration</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="api-endpoint">API Endpoint to Monitor</Label>
                    <Input
                      id="api-endpoint"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder="https://api.example.com"
                      disabled={monitoringActive}
                      data-testid="input-api-endpoint"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="monitoring-interval">Check Interval (seconds)</Label>
                    <Input
                      id="monitoring-interval"
                      type="number"
                      value={monitoringInterval}
                      onChange={(e) => setMonitoringInterval(parseInt(e.target.value))}
                      min="1"
                      max="60"
                      disabled={monitoringActive}
                      data-testid="input-monitoring-interval"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h4 className="font-medium">Current Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge className={monitoringActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {monitoringActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Checks Run:</span>
                    <span className="text-sm font-mono">{monitoringStatus.totalChecks}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">APIs Monitored:</span>
                    <span className="text-sm font-mono">{monitoringStatus.monitoredAPIs.length}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Last: {monitoringStatus.lastActivity}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Advanced Settings</h4>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-start">Auto-start monitoring on system boot</Label>
                  <p className="text-sm text-muted-foreground">Automatically begin monitoring when the application starts</p>
                </div>
                <Switch
                  id="auto-start"
                  checked={autoStartEnabled}
                  onCheckedChange={setAutoStartEnabled}
                  data-testid="switch-auto-start"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trigger Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Manual Security Scan
              </CardTitle>
              <CardDescription>
                Trigger an immediate compliance scan with test data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => triggerManualScan.mutate()}
                disabled={triggerManualScan.isPending}
                className="w-full"
                data-testid="button-manual-scan"
              >
                <Zap className="h-4 w-4 mr-2" />
                {triggerManualScan.isPending ? "Scanning..." : "Run Security Scan"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will scan test data for PII and compliance violations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Simulate Log Activity
              </CardTitle>
              <CardDescription>
                Inject a suspicious log entry to test alerting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => ingestTestLog.mutate()}
                disabled={ingestTestLog.isPending}
                className="w-full"
                data-testid="button-test-log"
              >
                <Eye className="h-4 w-4 mr-2" />
                {ingestTestLog.isPending ? "Processing..." : "Inject Test Log"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Simulates a suspicious API request with security violations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Monitoring
              </CardTitle>
              <CardDescription>
                View real-time monitoring activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monitoringActive ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Actively monitoring</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Next check in: {monitoringInterval - (monitoringStatus.totalChecks % monitoringInterval)}s
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm">Monitoring inactive</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              How Monitoring Works
            </CardTitle>
            <CardDescription>
              Understanding the automated security monitoring workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Automatic Triggers</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">API Call Monitoring</p>
                      <p className="text-xs text-muted-foreground">Every API call is automatically scanned for sensitive data</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Log Ingestion</p>
                      <p className="text-xs text-muted-foreground">Server logs are processed in real-time for security events</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Pattern Detection</p>
                      <p className="text-xs text-muted-foreground">Credit cards, SSNs, and other PII automatically flagged</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Integration Points</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Plaid API Integration</p>
                      <p className="text-xs text-muted-foreground">Financial transactions monitored for compliance</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">OpenAI Usage Tracking</p>
                      <p className="text-xs text-muted-foreground">AI responses scanned for policy violations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Discord/Slack Alerts</p>
                      <p className="text-xs text-muted-foreground">Instant notifications sent to your team channels</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Clock className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Click "Start Monitoring"</strong> to begin automatic security scanning</li>
              <li><strong>Test the system</strong> using "Run Security Scan" to see violation detection</li>
              <li><strong>Check alerts</strong> in the Alerts page to see detected issues</li>
              <li><strong>Review compliance</strong> in Advanced Compliance for detailed analysis</li>
              <li><strong>Monitor logs</strong> using "Inject Test Log" to see real-time processing</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}