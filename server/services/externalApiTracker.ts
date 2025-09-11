import { storage } from "../storage";
import { discordService } from "./discordService";
import { complianceEngine } from "./complianceEngine";
import type { InsertExternalApiCall, InsertCrossAppUsageStats, InsertRequestCorrelation } from "@shared/schema";

export class ExternalApiTracker {
  private static instance: ExternalApiTracker;

  static getInstance(): ExternalApiTracker {
    if (!ExternalApiTracker.instance) {
      ExternalApiTracker.instance = new ExternalApiTracker();
    }
    return ExternalApiTracker.instance;
  }

  /**
   * Track an external API call from another application
   */
  async trackExternalApiCall(callData: {
    requestId?: string;
    applicationSource: string;
    endpoint: string;
    method?: string;
    clientId?: string;
    responseTime?: number;
    statusCode?: number;
    metadata?: any;
    tracked_via: 'webhook' | 'proxy' | 'correlation' | 'manual';
  }) {
    try {
      console.log(`🌐 Tracking external API call from: ${callData.applicationSource}`);

      // Create external API call record
      const externalCall: InsertExternalApiCall = {
        requestId: callData.requestId || null,
        applicationSource: callData.applicationSource,
        endpoint: callData.endpoint,
        method: callData.method || "POST",
        clientId: callData.clientId || null,
        responseTime: callData.responseTime || null,
        statusCode: callData.statusCode || null,
        metadata: callData.metadata || null,
        tracked_via: callData.tracked_via
      };

      const savedCall = await storage.createExternalApiCall(externalCall);

      // Update cross-application usage stats
      await this.updateCrossAppStats(callData.applicationSource, {
        success: callData.statusCode ? callData.statusCode < 400 : true,
        responseTime: callData.responseTime
      });

      // Create request correlation if requestId is available
      if (callData.requestId) {
        await this.createRequestCorrelation(
          callData.requestId,
          callData.applicationSource,
          callData.endpoint
        );
      }

      // Security scanning for external calls
      await this.performSecurityAnalysis(savedCall, callData);

      console.log(`✅ External API call tracked: ${callData.applicationSource} -> ${callData.endpoint}`);
      
      return savedCall;
    } catch (error) {
      console.error("Error tracking external API call:", error);
      throw error;
    }
  }

  /**
   * Track API calls via webhook notifications
   */
  async trackViaWebhook(webhookData: {
    webhookType: string;
    webhookCode: string;
    itemId?: string;
    requestId?: string;
    metadata?: any;
  }) {
    try {
      // Determine application source from webhook metadata or headers
      const applicationSource = this.determineApplicationSource(webhookData);
      
      return await this.trackExternalApiCall({
        requestId: webhookData.requestId,
        applicationSource: applicationSource,
        endpoint: `/webhook/${webhookData.webhookType}`,
        method: "POST",
        metadata: {
          webhookType: webhookData.webhookType,
          webhookCode: webhookData.webhookCode,
          itemId: webhookData.itemId,
          ...webhookData.metadata
        },
        tracked_via: 'webhook'
      });
    } catch (error) {
      console.error("Error tracking webhook:", error);
      throw error;
    }
  }

  /**
   * Track API calls via request correlation
   */
  async trackViaCorrelation(correlationData: {
    requestId: string;
    endpoint: string;
    timestamp: Date;
    applicationHint?: string;
  }) {
    try {
      // Try to identify the application source
      const applicationSource = correlationData.applicationHint || 'unknown_application';
      
      return await this.trackExternalApiCall({
        requestId: correlationData.requestId,
        applicationSource: applicationSource,
        endpoint: correlationData.endpoint,
        metadata: {
          correlationTimestamp: correlationData.timestamp,
          detectionMethod: 'request_correlation'
        },
        tracked_via: 'correlation'
      });
    } catch (error) {
      console.error("Error tracking via correlation:", error);
      throw error;
    }
  }

  /**
   * Update cross-application usage statistics
   */
  private async updateCrossAppStats(applicationSource: string, callMetrics: {
    success: boolean;
    responseTime?: number;
  }) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = await storage.getCrossAppUsageStatsBySource(applicationSource, today);

      const stats: InsertCrossAppUsageStats = {
        date: today,
        applicationSource: applicationSource,
        totalCalls: (existing?.totalCalls || 0) + 1,
        successfulCalls: (existing?.successfulCalls || 0) + (callMetrics.success ? 1 : 0),
        errorCalls: (existing?.errorCalls || 0) + (callMetrics.success ? 0 : 1),
        avgResponseTime: callMetrics.responseTime ? 
          this.calculateAverageResponseTime(
            existing?.avgResponseTime || 0,
            existing?.totalCalls || 0,
            callMetrics.responseTime
          ) : (existing?.avgResponseTime || 0),
        securityViolations: existing?.securityViolations || 0
      };

      await storage.createOrUpdateCrossAppUsageStats(stats);
    } catch (error) {
      console.error("Error updating cross-app stats:", error);
    }
  }

  /**
   * Create request correlation for tracking
   */
  private async createRequestCorrelation(
    requestId: string, 
    applicationSource: string, 
    endpoint: string
  ) {
    try {
      const correlation: InsertRequestCorrelation = {
        requestId: requestId,
        correlationId: `cross-app-${Date.now()}`,
        applicationSource: applicationSource,
        endpoint: endpoint,
        processed: false
      };

      await storage.createRequestCorrelation(correlation);
    } catch (error) {
      console.error("Error creating request correlation:", error);
    }
  }

  /**
   * Perform security analysis on external API calls
   */
  private async performSecurityAnalysis(externalCall: any, callData: any) {
    try {
      // Check for suspicious patterns
      const suspiciousPatterns = this.detectSuspiciousPatterns(callData);
      
      if (suspiciousPatterns.length > 0) {
        // Create security alert
        await storage.createAlert({
          title: "Suspicious External API Activity",
          description: `Suspicious patterns detected in external API call from ${callData.applicationSource}: ${suspiciousPatterns.join(', ')}`,
          severity: "warning",
          source: `External API Tracker - ${callData.applicationSource}`,
          status: "active"
        });

        // Send Discord notification
        await discordService.sendSecurityAlert({
          title: "External API Security Alert",
          description: `Suspicious activity detected from application: ${callData.applicationSource}`,
          severity: "warning",
          source: "Cross-Application Monitor",
          timestamp: new Date()
        });

        // Update security violations count
        await this.incrementSecurityViolations(callData.applicationSource);
      }

      // Scan metadata for compliance issues
      if (callData.metadata) {
        await this.scanForComplianceViolations(callData);
      }

    } catch (error) {
      console.error("Error performing security analysis:", error);
    }
  }

  /**
   * Detect suspicious patterns in API calls
   */
  private detectSuspiciousPatterns(callData: any): string[] {
    const patterns: string[] = [];

    // High frequency calls
    if (callData.metadata?.callFrequency > 100) {
      patterns.push("high_frequency_calls");
    }

    // Error-heavy applications
    if (callData.statusCode && callData.statusCode >= 400) {
      patterns.push("error_response");
    }

    // Unusual response times
    if (callData.responseTime && callData.responseTime > 10000) {
      patterns.push("slow_response");
    }

    // Unknown applications
    if (callData.applicationSource === 'unknown_application') {
      patterns.push("unknown_source");
    }

    return patterns;
  }

  /**
   * Scan external API call data for compliance violations
   */
  private async scanForComplianceViolations(callData: any) {
    try {
      const dataToScan = JSON.stringify(callData.metadata || {});
      
      // Use existing compliance engine to scan for violations
      const violations = await complianceEngine.scanTextForCompliance(dataToScan, `External API - ${callData.applicationSource}`);

      // Log any violations found
      if (violations.length > 0) {
        console.log(`🚨 Compliance violations found in external API call from ${callData.applicationSource}:`, violations);
        await this.incrementSecurityViolations(callData.applicationSource);
      }
    } catch (error) {
      console.error("Error scanning for compliance violations:", error);
    }
  }

  /**
   * Increment security violations count for an application
   */
  private async incrementSecurityViolations(applicationSource: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = await storage.getCrossAppUsageStatsBySource(applicationSource, today);

      if (existing) {
        const updatedStats: InsertCrossAppUsageStats = {
          ...existing,
          securityViolations: (existing.securityViolations || 0) + 1
        };
        await storage.createOrUpdateCrossAppUsageStats(updatedStats);
      }
    } catch (error) {
      console.error("Error incrementing security violations:", error);
    }
  }

  /**
   * Determine application source from webhook data
   */
  private determineApplicationSource(webhookData: any): string {
    // Try to identify the application from webhook metadata
    if (webhookData.metadata?.applicationName) {
      return webhookData.metadata.applicationName;
    }
    
    // Use webhook type as a hint
    if (webhookData.webhookType) {
      return `external_app_${webhookData.webhookType}`;
    }

    return 'unknown_application';
  }

  /**
   * Calculate rolling average response time
   */
  private calculateAverageResponseTime(
    currentAvg: number, 
    callCount: number, 
    newResponseTime: number
  ): number {
    if (callCount === 0) return newResponseTime;
    return Math.round(((currentAvg * callCount) + newResponseTime) / (callCount + 1));
  }

  /**
   * Get cross-application monitoring summary
   */
  async getCrossAppMonitoringSummary(date?: string) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Get usage stats for all applications
      const allStats = await storage.getCrossAppUsageStats(targetDate);
      
      // Get recent external API calls
      const recentCalls = await storage.getExternalApiCalls(20);
      
      // Get correlations that need processing
      const pendingCorrelations = (await storage.getRequestCorrelations(50))
        .filter(correlation => !correlation.processed);

      return {
        date: targetDate,
        totalApplications: allStats.length,
        totalExternalCalls: allStats.reduce((sum, stat) => sum + (stat.totalCalls || 0), 0),
        totalSecurityViolations: allStats.reduce((sum, stat) => sum + (stat.securityViolations || 0), 0),
        applications: allStats,
        recentCalls: recentCalls.slice(0, 10),
        pendingCorrelations: pendingCorrelations.length,
        overallHealthScore: this.calculateHealthScore(allStats)
      };
    } catch (error) {
      console.error("Error getting cross-app monitoring summary:", error);
      throw error;
    }
  }

  /**
   * Calculate overall health score for cross-application monitoring
   */
  private calculateHealthScore(allStats: any[]): number {
    if (allStats.length === 0) return 100;

    let totalScore = 0;
    
    for (const stat of allStats) {
      let appScore = 100;
      
      // Deduct points for errors
      const errorRate = (stat.errorCalls || 0) / (stat.totalCalls || 1);
      appScore -= errorRate * 50;
      
      // Deduct points for security violations
      appScore -= (stat.securityViolations || 0) * 10;
      
      // Deduct points for slow response times
      if (stat.avgResponseTime > 5000) {
        appScore -= 20;
      }
      
      totalScore += Math.max(0, appScore);
    }
    
    return Math.round(totalScore / allStats.length);
  }
}

export const externalApiTracker = ExternalApiTracker.getInstance();