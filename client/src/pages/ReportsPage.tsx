import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, AlertTriangle, Shield, Eye, CheckCircle, Clock } from "lucide-react";

interface DataClassification {
  id: string;
  dataType: string;
  riskLevel: "high" | "medium" | "low";
  source: string;
  content: string;
  timestamp: string;
  isResolved: boolean;
}

interface Incident {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  status: "open" | "investigating" | "resolved";
  source: string;
  timestamp: string;
  resolvedAt?: string;
  metadata?: any;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("classifications");

  const { data: dataClassifications, isLoading: classificationsLoading } = useQuery({
    queryKey: ["/api/data-classifications"],
    refetchInterval: 10000,
  });

  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ["/api/incidents"],
    refetchInterval: 10000,
  });

  const { data: llmViolations, isLoading: llmLoading } = useQuery({
    queryKey: ["/api/llm/violations"],
    refetchInterval: 10000,
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      case "open":
        return "bg-red-100 text-red-800";
      case "investigating":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (classificationsLoading && incidentsLoading && llmLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading security reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" data-testid="reports-page">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <FileText className="h-8 w-8" />
              Security Reports & Incidents
            </h1>
            <p className="text-muted-foreground mt-2">
              View all reported security items, data classifications, and incidents
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="classifications" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Data Classifications ({Array.isArray(dataClassifications) ? dataClassifications.length : 0})
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Security Incidents ({Array.isArray(incidents) ? incidents.length : 0})
            </TabsTrigger>
            <TabsTrigger value="llm" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              LLM Violations ({Array.isArray(llmViolations) ? llmViolations.length : 0})
            </TabsTrigger>
          </TabsList>

          {/* Data Classifications Tab */}
          <TabsContent value="classifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Sensitive Data Classifications
                </CardTitle>
                <CardDescription>
                  Detected sensitive information in API responses and system data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!Array.isArray(dataClassifications) || dataClassifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Data Classifications Found</h3>
                    <p className="text-muted-foreground">
                      No sensitive data has been detected in your system yet. This is good for security!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dataClassifications.map((item: DataClassification) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`classification-${item.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getRiskColor(item.riskLevel)}>
                                {item.riskLevel.toUpperCase()} RISK
                              </Badge>
                              <Badge variant="outline">{item.dataType}</Badge>
                              {item.isResolved && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  RESOLVED
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Source: {item.source}
                            </p>
                            <p className="text-sm font-mono bg-muted p-2 rounded">
                              {item.content || "Content redacted for security"}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Incidents Tab */}
          <TabsContent value="incidents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Security Incidents
                </CardTitle>
                <CardDescription>
                  Reported security incidents and their investigation status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!Array.isArray(incidents) || incidents.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Security Incidents</h3>
                    <p className="text-muted-foreground">
                      No security incidents have been reported. Your system is secure!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incidents.map((incident: Incident) => (
                      <div
                        key={incident.id}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`incident-${incident.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getSeverityColor(incident.severity)}>
                                {incident.severity.toUpperCase()}
                              </Badge>
                              <Badge className={getStatusColor(incident.status)}>
                                {incident.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="font-medium mb-2">{incident.description}</p>
                            <p className="text-sm text-muted-foreground">
                              Source: {incident.source} • Created: {new Date(incident.timestamp).toLocaleString()}
                              {incident.resolvedAt && (
                                <span> • Resolved: {new Date(incident.resolvedAt).toLocaleString()}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LLM Violations Tab */}
          <TabsContent value="llm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  LLM Response Violations
                </CardTitle>
                <CardDescription>
                  AI responses that were flagged, blocked, or rewritten for security
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!Array.isArray(llmViolations) || llmViolations.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No LLM Violations</h3>
                    <p className="text-muted-foreground">
                      All AI responses have passed security checks. Great job!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {llmViolations.map((violation: any) => (
                      <div
                        key={violation.id}
                        className="border rounded-lg p-4 space-y-3"
                        data-testid={`violation-${violation.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{violation.violationType}</Badge>
                              <Badge className={
                                violation.action === "blocked" ? "bg-red-100 text-red-800" :
                                violation.action === "rewritten" ? "bg-yellow-100 text-yellow-800" :
                                "bg-blue-100 text-blue-800"
                              }>
                                {violation.action.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm font-mono bg-muted p-2 rounded">
                              {violation.content}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(violation.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}