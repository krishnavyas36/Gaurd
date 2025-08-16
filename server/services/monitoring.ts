import { storage } from "../storage";
import { sendSecurityAlert } from "./slack";
import { emailService } from "./email";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export class MonitoringService {
  private readonly pythonScriptPath = path.join(process.cwd(), "server", "python");

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
      
      if (apiSource.callsToday > maxCalls) {
        await this.createAlert({
          title: "API Rate Limit Exceeded",
          description: `${apiSource.name} has exceeded the rate limit with ${apiSource.callsToday} calls`,
          severity: "critical",
          source: apiSource.name,
          status: "active"
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
      // Call Python data classifier
      const dataString = JSON.stringify(data);
      const { stdout } = await execFileAsync("python3", [
        path.join(this.pythonScriptPath, "data_classifier.py"),
        dataString
      ]);

      const classifications = JSON.parse(stdout);
      
      for (const classification of classifications) {
        await storage.createDataClassification({
          dataType: classification.type,
          riskLevel: classification.risk,
          source: source,
          content: classification.redactedContent,
          isResolved: false
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
      const { stdout } = await execFileAsync("python3", [
        path.join(this.pythonScriptPath, "anomaly_detector.py"),
        JSON.stringify(apiSources)
      ]);

      const anomalies = JSON.parse(stdout);
      
      for (const anomaly of anomalies) {
        await this.createAlert({
          title: "API Usage Anomaly Detected",
          description: anomaly.description,
          severity: anomaly.severity,
          source: anomaly.source,
          status: "active"
        });
      }
    } catch (error) {
      console.error("Error detecting anomalies:", error);
    }
  }

  async createAlert(alertData: any) {
    const alert = await storage.createAlert(alertData);
    
    // Send Slack notification for critical alerts
    if (alert.severity === "critical") {
      await sendSecurityAlert(alert.title, alert.description, alert.severity);
    }

    // Send email notification
    const emailRecipients = process.env.SECURITY_EMAIL_RECIPIENTS?.split(",") || [];
    if (emailRecipients.length > 0) {
      await emailService.sendSecurityAlert(
        emailRecipients,
        alert.title,
        alert.description,
        alert.severity
      );
    }

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

    // Send report via email
    const emailRecipients = process.env.SECURITY_EMAIL_RECIPIENTS?.split(",") || [];
    if (emailRecipients.length > 0) {
      await emailService.sendComplianceReport(emailRecipients, report);
    }

    return report;
  }
}

export const monitoringService = new MonitoringService();
