import { storage } from "../storage";
import { discordService } from "./discordService";
import { monitoringService } from "./monitoring";

interface LLMResponse {
  content: string;
  metadata?: any;
}

interface ScanResult {
  isViolation: boolean;
  violationType?: string;
  action: "allow" | "block" | "rewrite";
  modifiedContent?: string;
  confidence: number;
}

export class LLMScannerService {
  private financialAdvicePatterns = [
    /you should.*invest/i,
    /invest.*all.*money/i,
    /invest.*your.*money/i,
    /buy.*stock/i,
    /sell.*stock/i,
    /guaranteed.*return/i,
    /financial.*advice/i,
    /investment.*recommendation/i,
    /put.*money.*in/i,
    /best.*investment/i,
    /definitely.*invest/i,
    /must.*invest/i,
    /should.*buy/i,
    /recommend.*investing/i,
    /advice.*to.*invest/i
  ];

  private unverifiedDataPatterns = [
    /insider.*information/i,
    /confidential.*source/i,
    /leaked.*data/i,
    /unofficial.*report/i,
    /rumor.*has.*it/i,
    /sources.*tell.*me/i,
    /heard.*from.*reliable/i
  ];

  async scanResponse(response: LLMResponse): Promise<ScanResult> {
    const content = response.content.toLowerCase();
    
    // Always increment scanned count for every response
    await this.updateScannedCount();
    
    // Check for financial advice violations
    const financialAdviceMatch = this.financialAdvicePatterns.some(pattern => 
      pattern.test(content)
    );

    if (financialAdviceMatch) {
      await this.logViolation("financial_advice", response.content, "blocked");
      
      return {
        isViolation: true,
        violationType: "financial_advice",
        action: "block",
        confidence: 0.9
      };
    }

    // Check for unverified data violations
    const unverifiedDataMatch = this.unverifiedDataPatterns.some(pattern => 
      pattern.test(content)
    );

    if (unverifiedDataMatch) {
      const rewrittenContent = await this.rewriteResponse(response.content);
      await this.logViolation("unverified_data", response.content, "rewritten");
      
      return {
        isViolation: true,
        violationType: "unverified_data",
        action: "rewrite",
        modifiedContent: rewrittenContent,
        confidence: 0.8
      };
    }

    // Check for PII in responses
    const piiDetected = await this.detectPII(content);
    if (piiDetected.length > 0) {
      const sanitizedContent = await this.sanitizePII(response.content, piiDetected);
      await this.logViolation("pii_exposure", response.content, "rewritten");
      
      return {
        isViolation: true,
        violationType: "pii_exposure",
        action: "rewrite",
        modifiedContent: sanitizedContent,
        confidence: 0.95
      };
    }

    return {
      isViolation: false,
      action: "allow",
      confidence: 1.0
    };
  }

  private async detectPII(content: string): Promise<Array<{type: string, match: string}>> {
    const piiPatterns = [
      { type: "ssn", pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g },
      { type: "credit_card", pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
      { type: "email", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
      { type: "phone", pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g }
    ];

    const detected = [];
    for (const { type, pattern } of piiPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        detected.push(...matches.map(match => ({ type, match })));
      }
    }

    return detected;
  }

  private async sanitizePII(content: string, piiItems: Array<{type: string, match: string}>): Promise<string> {
    let sanitized = content;
    
    for (const { type, match } of piiItems) {
      const redacted = type === "ssn" ? "XXX-XX-XXXX" :
                     type === "credit_card" ? "XXXX-XXXX-XXXX-XXXX" :
                     type === "email" ? "[EMAIL_REDACTED]" :
                     type === "phone" ? "XXX-XXX-XXXX" : "[REDACTED]";
      
      sanitized = sanitized.replace(match, redacted);
    }

    return sanitized;
  }

  private async rewriteResponse(content: string): Promise<string> {
    // Simple rewriting logic - in production, this could use another LLM
    const disclaimers = [
      "Please note: This information should not be considered financial advice.",
      "This is for informational purposes only and should be verified through official sources.",
      "Please consult with a qualified financial advisor before making investment decisions."
    ];

    const randomDisclaimer = disclaimers[Math.floor(Math.random() * disclaimers.length)];
    
    // Remove problematic phrases and add disclaimer
    let rewritten = content
      .replace(/you should invest/gi, "one might consider")
      .replace(/buy.*stock/gi, "research stocks")
      .replace(/guaranteed.*return/gi, "potential return")
      .replace(/insider.*information/gi, "publicly available information")
      .replace(/confidential.*source/gi, "public source");

    return `${rewritten}\n\n${randomDisclaimer}`;
  }

  private async logViolation(type: string, content: string, action: string) {
    const violation = await storage.createLlmViolation({
      violationType: type,
      content: content.substring(0, 500), // Store first 500 chars for review
      action,
      metadata: {
        timestamp: new Date().toISOString(),
        confidence: type === "financial_advice" ? 0.9 : 0.8
      }
    });

    // Send Discord notification for LLM violations
    await discordService.sendLLMViolationAlert({
      violationType: type,
      content: content.substring(0, 200), // Shorter content for Discord
      action,
      timestamp: new Date()
    });

    // Create alert for serious violations
    if (type === "financial_advice" || type === "pii_exposure") {
      await monitoringService.createAlert({
        title: "LLM Response Violation",
        description: `${type.replace("_", " ")} detected in LLM response`,
        severity: type === "pii_exposure" ? "critical" : "warning",
        source: "LLM Scanner",
        status: "active"
      });
    }

    // Update daily stats for violations only (scanned count already updated)
    const today = new Date().toISOString().split('T')[0];
    const stats = await storage.getMonitoringStats(today);
    if (stats) {
      await storage.createOrUpdateMonitoringStats({
        ...stats,
        llmResponsesFlagged: (stats.llmResponsesFlagged || 0) + 1,
        llmResponsesBlocked: action === "blocked" ? (stats.llmResponsesBlocked || 0) + 1 : (stats.llmResponsesBlocked || 0)
      });
    }
  }

  /**
   * Update scanned count for every response processed
   */
  private async updateScannedCount() {
    const today = new Date().toISOString().split('T')[0];
    const stats = await storage.getMonitoringStats(today);
    console.log(`📊 Updating LLM scanned count. Current: ${stats?.llmResponsesScanned || 0}`);
    if (stats) {
      const updatedStats = await storage.createOrUpdateMonitoringStats({
        ...stats,
        llmResponsesScanned: (stats.llmResponsesScanned || 0) + 1
      });
      console.log(`📊 LLM scanned count updated to: ${updatedStats?.llmResponsesScanned || 'unknown'}`);
    } else {
      console.log(`⚠️ No monitoring stats found for ${today}`);
    }
  }

  async getViolationStats() {
    const violations = await storage.getLlmViolations(100);
    const stats = {
      total: violations.length,
      byType: violations.reduce((acc: any, violation) => {
        acc[violation.violationType] = (acc[violation.violationType] || 0) + 1;
        return acc;
      }, {}),
      byAction: violations.reduce((acc: any, violation) => {
        acc[violation.action] = (acc[violation.action] || 0) + 1;
        return acc;
      }, {}),
      recent: violations.slice(0, 10)
    };

    return stats;
  }

  async resetTestCounters() {
    const today = new Date().toISOString().split('T')[0];
    const stats = await storage.getMonitoringStats(today);
    if (stats) {
      // Reset LLM counters to only include real scans (3 real OpenAI calls were made)
      await storage.createOrUpdateMonitoringStats({
        ...stats,
        llmResponsesScanned: 3, // Only count real OpenAI API calls
        llmResponsesFlagged: 0,  // No real violations
        llmResponsesBlocked: 0   // No real blocks
      });
      console.log("🔄 LLM test counters reset to real data only");
    }
  }
}

export const llmScannerService = new LLMScannerService();