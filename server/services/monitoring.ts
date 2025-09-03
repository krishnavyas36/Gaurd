import { storage } from "../storage";
import { discordService } from "./discordService";

export class MonitoringService {

  async processApiCall(source: string, endpoint: string, responseData: any) {
    try {
      // Update API source call count
      const apiSources = await storage.getApiSources();
      const apiSource = apiSources.find(s => s.name === source);
      
      if (apiSource) {
        await storage.updateApiSource(apiSource.id, {
          callsToday: (apiSource.callsToday || 0) + 1,
          lastActivity: new Date()
        });

        // Check rate limits
        await this.checkRateLimits(apiSource);
      }

      // Classify data in response
      await this.classifyData(responseData, source);

      // Update daily stats
      await this.updateDailyStats();

    } catch (error) {
      console.error("Error processing API call:", error);
    }
  }

  async checkRateLimits(apiSource: any) {
    const rules = await storage.getActiveComplianceRules();
    const rateLimitRule = rules.find(rule => rule.ruleType === "rate_limit");
    
    if (rateLimitRule && rateLimitRule.config) {
      const maxCalls = (rateLimitRule.config as any).maxCallsPerHour || 1000;
      
      if ((apiSource.callsToday || 0) > maxCalls) {
        const alert = {
          title: "API Rate Limit Exceeded",
          description: `${apiSource.name} has exceeded the rate limit with ${apiSource.callsToday} calls`,
          severity: "critical",
          source: apiSource.name,
          status: "active"
        };

        await this.createAlert(alert);

        // Send Discord notification
        await discordService.sendSecurityAlert({
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          source: alert.source,
          timestamp: new Date()
        });

        // Update API source alert status
        await storage.updateApiSource(apiSource.id, {
          alertStatus: "critical"
        });

        // Update rule last triggered
        await storage.updateComplianceRule(rateLimitRule.id, {
          lastTriggered: new Date()
        });
      }
    }
  }

  async classifyData(data: any, source: string) {
    try {
      // Simple data classification without Python scripts
      const dataString = JSON.stringify(data).toLowerCase();
      const classifications = [];

      // Check for PII patterns
      if (dataString.includes('ssn') || /\b\d{3}-?\d{2}-?\d{4}\b/.test(dataString)) {
        classifications.push({ type: 'SSN', risk: 'high', redactedContent: dataString.replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, 'XXX-XX-XXXX') });
      }
      if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(dataString)) {
        classifications.push({ type: 'Credit Card', risk: 'high', redactedContent: dataString.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, 'XXXX-XXXX-XXXX-XXXX') });
      }
      if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(dataString)) {
        classifications.push({ type: 'Email', risk: 'medium', redactedContent: dataString.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]') });
      }
      
      for (const classification of classifications) {
        await storage.createDataClassification({
          dataType: classification.type,
          riskLevel: classification.risk,
          source: source,
          content: classification.redactedContent,
          isResolved: false
        });

        // Send Discord notification for data classification
        await discordService.sendDataClassificationAlert({
          dataType: classification.type,
          riskLevel: classification.risk,
          source: source,
          content: classification.redactedContent,
          timestamp: new Date()
        });

        // Create alert for high-risk data
        if (classification.risk === "high") {
          await this.createAlert({
            title: "High-Risk Data Detected",
            description: `${classification.type} detected in ${source}`,
            severity: "warning",
            source: source,
            status: "active"
          });
        }
      }
    } catch (error) {
      console.error("Error classifying data:", error);
    }
  }

  async detectAnomalies() {
    try {
      const apiSources = await storage.getApiSources();
      
      // Simple anomaly detection without Python scripts
      for (const source of apiSources) {
        if (source.callsToday > 2000) { // Simple threshold
          await this.createAlert({
            title: "API Usage Anomaly Detected",
            description: `${source.name} has unusually high activity: ${source.callsToday} calls today`,
            severity: "warning",
            source: source.name,
            status: "active"
          });
        }
      }
    } catch (error) {
      console.error("Error detecting anomalies:", error);
    }
  }

  async createAlert(alertData: any) {
    const alert = await storage.createAlert(alertData);
    
    // Send Discord notification for all alerts
    await discordService.sendSecurityAlert({
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      source: alert.source,
      timestamp: alert.timestamp || new Date()
    });

    return alert;
  }

  async updateDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    const stats = await storage.getMonitoringStats(today);
    
    if (stats) {
      await storage.createOrUpdateMonitoringStats({
        ...stats,
        totalApiCalls: (stats.totalApiCalls || 0) + 1
      });
    }
  }

  async generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const stats = await storage.getMonitoringStats(today);
    const alerts = await storage.getAlerts(10);
    const incidents = await storage.getIncidents(10);
    
    const report = {
      date: today,
      stats,
      alerts: alerts.length,
      incidents: incidents.length,
      summary: `Daily security monitoring report for ${today}`
    };

    console.log('Daily monitoring report generated:', report);
    return report;
  }
}

export const monitoringService = new MonitoringService();
