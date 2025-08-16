import { storage } from "../storage";
import { monitoringService } from "./monitoring";

export class ComplianceService {
  async checkGDPRCompliance(userData: any, userConsent: any) {
    const gdprRules = await storage.getActiveComplianceRules();
    const gdprRule = gdprRules.find(rule => rule.ruleType === "gdpr_consent");
    
    if (!gdprRule) return true;

    const requiredFields = (gdprRule.config as any).requiredFields || [];
    const violations = [];

    for (const field of requiredFields) {
      if (!userConsent[field]) {
        violations.push(`Missing ${field} consent`);
      }
    }

    if (violations.length > 0) {
      await monitoringService.createAlert({
        title: "GDPR Compliance Violation",
        description: `GDPR violations detected: ${violations.join(", ")}`,
        severity: "critical",
        source: "GDPR Checker",
        status: "active"
      });

      await storage.updateComplianceRule(gdprRule.id, {
        lastTriggered: new Date()
      });

      return false;
    }

    return true;
  }

  async checkSOC2Compliance() {
    // Check logging requirements
    const recentIncidents = await storage.getIncidents(100);
    const unloggedIncidents = recentIncidents.filter(incident => 
      !incident.metadata || !(incident.metadata as any).logged
    );

    if (unloggedIncidents.length > 0) {
      await monitoringService.createAlert({
        title: "SOC2 Logging Violation",
        description: `${unloggedIncidents.length} incidents not properly logged`,
        severity: "warning",
        source: "SOC2 Checker",
        status: "active"
      });
    }

    return unloggedIncidents.length === 0;
  }

  async calculateComplianceScore(): Promise<number> {
    const totalChecks = 10;
    let passedChecks = 0;

    // Check recent alerts
    const recentAlerts = await storage.getActiveAlerts();
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === "critical");
    
    if (criticalAlerts.length === 0) passedChecks += 3;
    else if (criticalAlerts.length <= 2) passedChecks += 2;
    else if (criticalAlerts.length <= 5) passedChecks += 1;

    // Check data classification coverage
    const dataClassifications = await storage.getDataClassifications(100);
    const highRiskUnresolved = dataClassifications.filter(
      item => item.riskLevel === "high" && !item.isResolved
    );
    
    if (highRiskUnresolved.length === 0) passedChecks += 3;
    else if (highRiskUnresolved.length <= 5) passedChecks += 2;
    else if (highRiskUnresolved.length <= 10) passedChecks += 1;

    // Check rule compliance
    const rules = await storage.getActiveComplianceRules();
    const recentlyTriggered = rules.filter(rule => 
      rule.lastTriggered && 
      new Date().getTime() - new Date(rule.lastTriggered).getTime() < 24 * 60 * 60 * 1000
    );

    if (recentlyTriggered.length === 0) passedChecks += 2;
    else if (recentlyTriggered.length <= 2) passedChecks += 1;

    // Check incident response time
    const recentIncidents = await storage.getIncidents(50);
    const openIncidents = recentIncidents.filter(incident => incident.status === "open");
    
    if (openIncidents.length === 0) passedChecks += 2;
    else if (openIncidents.length <= 3) passedChecks += 1;

    const score = Math.round((passedChecks / totalChecks) * 100);
    
    // Update today's compliance score
    const today = new Date().toISOString().split('T')[0];
    const stats = await storage.getMonitoringStats(today);
    if (stats) {
      await storage.createOrUpdateMonitoringStats({
        ...stats,
        complianceScore: score
      });
    }

    return score;
  }

  async auditApiAccess(apiCalls: any[]) {
    const suspiciousPatterns = [];

    // Check for unusual IP activity
    const ipCounts = apiCalls.reduce((acc: any, call) => {
      const ip = call.clientIP || "unknown";
      acc[ip] = (acc[ip] || 0) + 1;
      return acc;
    }, {});

    for (const [ip, count] of Object.entries(ipCounts)) {
      if (count > 100) { // Threshold for suspicious activity
        suspiciousPatterns.push({
          type: "unusual_ip_activity",
          description: `IP ${ip} made ${count} API calls`,
          severity: "warning"
        });
      }
    }

    // Check for data volume spikes
    const dataVolumes = apiCalls.map(call => call.responseSize || 0);
    const averageVolume = dataVolumes.reduce((a, b) => a + b, 0) / dataVolumes.length;
    const largeResponses = dataVolumes.filter(size => size > averageVolume * 3);

    if (largeResponses.length > 5) {
      suspiciousPatterns.push({
        type: "data_volume_spike",
        description: `${largeResponses.length} API calls with unusually large responses`,
        severity: "warning"
      });
    }

    // Create alerts for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      await monitoringService.createAlert({
        title: "Suspicious API Activity",
        description: pattern.description,
        severity: pattern.severity,
        source: "API Auditor",
        status: "active"
      });
    }

    return suspiciousPatterns;
  }
}

export const complianceService = new ComplianceService();
