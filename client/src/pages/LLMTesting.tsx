import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ScanResult {
  isViolation: boolean;
  violationType?: string;
  action: "allow" | "block" | "rewrite";
  modifiedContent?: string;
  confidence: number;
  message: string;
}

interface GenerationResult {
  original: {
    content: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  security: ScanResult;
  finalContent: string;
}

export default function LLMTesting() {
  const [testContent, setTestContent] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // LLM Generation states
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generationType, setGenerationType] = useState<"general" | "financial_advice" | "insider_claims">("general");
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const testExamples = [
    {
      title: "Financial Advice Violation",
      content: "You should definitely invest in Tesla stock right now. I guarantee you'll make a 50% return within a month. This is insider information from a reliable source.",
      expected: "Should be BLOCKED for financial advice"
    },
    {
      title: "Unverified Data Claims",
      content: "According to my analysis, Bitcoin will reach $100,000 next week. Trust me on this - I have confidential data that supports this prediction.",
      expected: "Should be REWRITTEN to remove unverified claims"
    },
    {
      title: "PII Exposure",
      content: "The customer's details are: John Smith, SSN: 123-45-6789, Email: john@example.com, Credit Card: 4532-1234-5678-9012",
      expected: "Should be REWRITTEN to mask PII"
    },
    {
      title: "Safe Content",
      content: "Here's some general information about investment strategies. It's important to diversify your portfolio and consider consulting with a financial advisor before making decisions.",
      expected: "Should PASS security scan"
    }
  ];

  const handleScanContent = async () => {
    if (!testContent.trim()) return;
    
    setIsScanning(true);
    try {
      const result = await apiRequest('/api/llm/scan-response', {
        method: 'POST',
        body: JSON.stringify({
          content: testContent,
          metadata: { source: 'manual-test', timestamp: new Date().toISOString() }
        })
      });
      
      setScanResult(result);
    } catch (error: any) {
      console.error('Scan failed:', error);
      setScanResult({
        isViolation: true,
        action: "block",
        confidence: 0,
        message: "Error: Failed to scan content"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!generationPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const result = await apiRequest('/api/llm/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: generationPrompt,
          type: generationType,
          context: `Generate ${generationType} content for testing security scanning.`
        })
      });
      
      setGenerationResult(result);
    } catch (error: any) {
      console.error('Generation failed:', error);
      setGenerationResult({
        original: {
          content: `Generation failed: ${error.message}`,
          model: "error",
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        },
        security: {
          isViolation: true,
          action: "block",
          confidence: 0,
          message: "Error: Failed to generate content"
        },
        finalContent: "Generation failed"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "allow":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "block":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "rewrite":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "allow": return "bg-green-100 text-green-800";
      case "block": return "bg-red-100 text-red-800";
      case "rewrite": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6" data-testid="llm-testing-page">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary flex items-center justify-center gap-3">
            <Shield className="h-8 w-8" />
            LLM Risk Control Testing
          </h1>
          <p className="text-xl text-muted-foreground">
            Phase 5: Test LLM response scanning for financial advice and unverified data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Testing Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Test LLM Response Scanner</CardTitle>
              <CardDescription>
                Enter content to test the LLM scanning middleware
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter LLM response content to scan..."
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                rows={8}
                data-testid="input-test-content"
              />
              
              <Button 
                onClick={handleScanContent}
                disabled={!testContent.trim() || isScanning}
                className="w-full"
                data-testid="button-scan-content"
              >
                {isScanning ? "Scanning..." : "Scan Content"}
              </Button>

              {scanResult && (
                <Alert className={`border-2 ${scanResult.isViolation ? "border-red-200" : "border-green-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getActionIcon(scanResult.action)}
                      <span className="font-semibold">Scan Result</span>
                    </div>
                    <Badge className={getActionColor(scanResult.action)}>
                      {scanResult.action.toUpperCase()}
                    </Badge>
                  </div>
                  <AlertDescription className="mt-2">
                    <div className="space-y-2">
                      <p><strong>Status:</strong> {scanResult.message}</p>
                      {scanResult.violationType && (
                        <p><strong>Violation Type:</strong> {scanResult.violationType.replace('_', ' ')}</p>
                      )}
                      <p><strong>Confidence:</strong> {(scanResult.confidence * 100).toFixed(1)}%</p>
                      
                      {scanResult.modifiedContent && (
                        <div className="mt-4 p-3 bg-gray-50 rounded border">
                          <p className="font-semibold text-sm">Modified Content:</p>
                          <p className="text-sm mt-1">{scanResult.modifiedContent}</p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Test Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Test Examples</CardTitle>
              <CardDescription>
                Click any example to test different violation scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testExamples.map((example, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setTestContent(example.content)}
                  data-testid={`example-${index}`}
                >
                  <h4 className="font-semibold text-sm">{example.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{example.expected}</p>
                  <p className="text-sm mt-2 line-clamp-3">{example.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>LLM Risk Control Features</CardTitle>
            <CardDescription>
              Comprehensive scanning for financial advice violations and unverified data claims
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <XCircle className="h-8 w-8 text-red-500 mx-auto" />
                <h4 className="font-semibold">Financial Advice Detection</h4>
                <p className="text-sm text-muted-foreground">
                  Blocks responses containing investment recommendations, guaranteed returns, or unauthorized financial advice
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
                <h4 className="font-semibold">Unverified Data Filtering</h4>
                <p className="text-sm text-muted-foreground">
                  Rewrites responses claiming insider information, confidential sources, or unsubstantiated predictions
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <Shield className="h-8 w-8 text-blue-500 mx-auto" />
                <h4 className="font-semibold">PII Protection</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically redacts SSNs, credit cards, emails, and other sensitive information in responses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}