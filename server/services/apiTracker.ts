import { storage } from "../storage";
import { discordService } from "./discordService";

export class ApiTracker {
  private static instance: ApiTracker;
  private callCounts: Map<string, number> = new Map();

  static getInstance(): ApiTracker {
    if (!ApiTracker.instance) {
      ApiTracker.instance = new ApiTracker();
    }
    return ApiTracker.instance;
  }

  /**
   * Track an API call for a specific source
   */
  async trackApiCall(sourceName: string, endpoint: string, responseTime?: number, metadata?: any) {
    try {
      // Find or create the API source
      let apiSource = await this.findOrCreateApiSource(sourceName, endpoint);
      
      // Increment call count
      const newCallCount = (apiSource.callsToday || 0) + 1;
      
      // Update the API source with new call count
      apiSource = await storage.updateApiSource(apiSource.id, {
        callsToday: newCallCount,
        lastActivity: new Date(),
        alertStatus: this.determineAlertStatus(newCallCount)
      }) || apiSource;

      // Update daily stats
      await this.updateDailyStats();

      // Check for rate limit violations
      await this.checkRateLimits(apiSource);

      console.log(`📊 API Call Tracked: ${sourceName} - Total calls: ${newCallCount}`);

      return {
        source: sourceName,
        endpoint,
        callsToday: newCallCount,
        responseTime,
        metadata
      };
    } catch (error) {
      console.error(`Error tracking API call for ${sourceName}:`, error);
      throw error;
    }
  }

  /**
   * Find existing API source or create a new one
   */
  private async findOrCreateApiSource(sourceName: string, endpoint: string) {
    const sources = await storage.getApiSources();
    let apiSource = sources.find(s => s.name === sourceName);

    if (!apiSource) {
      // Create new API source
      apiSource = await storage.createApiSource({
        name: sourceName,
        url: this.extractBaseUrl(endpoint),
        status: "active",
        callsToday: 0,
        alertStatus: "normal"
      });
      console.log(`🔧 Created new API source: ${sourceName}`);
    }

    return apiSource;
  }

  /**
   * Extract base URL from endpoint
   */
  private extractBaseUrl(endpoint: string): string {
    try {
      const url = new URL(endpoint);
      return `${url.protocol}//${url.host}`;
    } catch {
      // If not a full URL, return as is
      return endpoint;
    }
  }

  /**
   * Determine alert status based on call count
   */
  private determineAlertStatus(callCount: number): string {
    if (callCount > 1000) return "critical";
    if (callCount > 500) return "elevated";
    if (callCount > 100) return "warning";
    return "normal";
  }

  /**
   * Check for rate limit violations
   */
  private async checkRateLimits(apiSource: any) {
    const rules = await storage.getActiveComplianceRules();
    const rateLimitRule = rules.find(rule => rule.ruleType === "rate_limit");
    
    if (rateLimitRule && rateLimitRule.config) {
      const maxCalls = (rateLimitRule.config as any).maxCallsPerHour || 1000;
      
      if (apiSource.callsToday > maxCalls) {
        const alert = await storage.createAlert({
          title: "API Rate Limit Exceeded",
          description: `${apiSource.name} has exceeded the rate limit with ${apiSource.callsToday} calls today`,
          severity: "critical",
          source: apiSource.name,
          status: "active"
        });

        // Send Discord notification
        await discordService.sendSecurityAlert({
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          source: alert.source,
          timestamp: new Date()
        });

        console.log(`🚨 Rate limit alert created for ${apiSource.name}`);
      }
    }
  }

  /**
   * Update daily monitoring statistics
   */
  private async updateDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    const stats = await storage.getMonitoringStats(today);
    
    if (stats) {
      await storage.createOrUpdateMonitoringStats({
        ...stats,
        totalApiCalls: (stats.totalApiCalls || 0) + 1
      });
    } else {
      await storage.createOrUpdateMonitoringStats({
        date: today,
        totalApiCalls: 1,
        alertsGenerated: 0,
        complianceScore: 100,
        sensitiveDataDetected: 0,
        llmResponsesScanned: 0,
        llmResponsesFlagged: 0,
        llmResponsesBlocked: 0
      });
    }
  }

  /**
   * Track Plaid API call specifically
   */
  async trackPlaidCall(endpoint: string, responseTime?: number) {
    return await this.trackApiCall("Plaid API", `https://production.plaid.com${endpoint}`, responseTime, {
      service: "plaid",
      environment: process.env.PLAID_ENV || "sandbox"
    });
  }

  /**
   * Track OpenAI API call specifically
   */
  async trackOpenAICall(endpoint: string, responseTime?: number, tokens?: number) {
    return await this.trackApiCall("OpenAI API", `https://api.openai.com${endpoint}`, responseTime, {
      service: "openai",
      tokens: tokens || 0
    });
  }

  /**
   * Get current call statistics
   */
  async getCallStats() {
    const sources = await storage.getApiSources();
    const todaysStats = await storage.getTodaysStats();
    
    return {
      sources: sources.map(source => ({
        name: source.name,
        callsToday: source.callsToday || 0,
        alertStatus: source.alertStatus,
        lastActivity: source.lastActivity
      })),
      totalCallsToday: todaysStats.totalApiCalls,
      lastUpdate: new Date()
    };
  }

  /**
   * Reset daily counters (should be called at midnight)
   */
  async resetDailyCounters() {
    const sources = await storage.getApiSources();
    
    for (const source of sources) {
      await storage.updateApiSource(source.id, {
        callsToday: 0,
        alertStatus: "normal"
      });
    }
    
    console.log("🔄 Daily API call counters reset");
  }
}

export const apiTracker = ApiTracker.getInstance();