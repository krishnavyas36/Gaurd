import fs from 'fs';
import path from 'path';
import { storage } from '../storage';
import { discordService } from './discordService';
import { monitoringService } from './monitoring';

interface ComplianceRule {
  enabled: boolean;
  severity: string;
  patterns?: { [key: string]: any };
  rules?: { [key: string]: any };
}

interface ComplianceConfig {
  version: string;
  lastUpdated: string;
  rules: { [key: string]: ComplianceRule };
  notification_settings: any;
  monitoring_settings: any;
}

class ComplianceEngine {
  private config: ComplianceConfig;
  private configPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), 'server', 'config', 'complianceRules.json');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      console.log(`Loaded compliance config version ${this.config.version}`);
    } catch (error) {
      console.error('Error loading compliance config:', error);
      // Load default config
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): ComplianceConfig {
    return {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      rules: {
        pii_detection: {
          enabled: true,
          severity: "high",
          patterns: {
            credit_card: {
              regex: "\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b",
              description: "Credit card number pattern",
              action: "alert_and_redact",
              severity: "critical"
            }
          }
        }
      },
      notification_settings: {
        discord: { enabled: true, severity_threshold: "medium" }
      },
      monitoring_settings: {
        real_time_scanning: true,
        retention_days: 90
      }
    };
  }

  async scanTextForCompliance(text: string, source: string): Promise<any[]> {
    const violations = [];

    if (!this.config.rules.pii_detection?.enabled) {
      return violations;
    }

    const patterns = this.config.rules.pii_detection.patterns;

    for (const [patternName, patternConfig] of Object.entries(patterns)) {
      const regex = new RegExp(patternConfig.regex, 'gi');
      const matches = text.match(regex);

      if (matches) {
        const violation = {
          type: 'pii_detection',
          subtype: patternName,
          pattern: patternConfig.description,
          matches: matches.length,
          action: patternConfig.action,
          severity: patternConfig.severity,
          source: source,
          content: this.redactMatches(text, regex, patternName),
          timestamp: new Date()
        };

        violations.push(violation);

        // Process the violation
        await this.processViolation(violation);
      }
    }

    return violations;
  }

  async scanTransactionForCompliance(transactionData: any, source: string): Promise<any[]> {
    const violations = [];

    if (!this.config.rules.financial_compliance?.enabled) {
      return violations;
    }

    const rules = this.config.rules.financial_compliance.rules;

    // Check high value transaction rule
    if (rules.high_value_transaction && transactionData.amount > rules.high_value_transaction.threshold) {
      const violation = {
        type: 'financial_compliance',
        subtype: 'high_value_transaction',
        description: `Transaction amount $${transactionData.amount} exceeds threshold`,
        action: rules.high_value_transaction.action,
        severity: rules.high_value_transaction.severity,
        source: source,
        data: {
          amount: transactionData.amount,
          threshold: rules.high_value_transaction.threshold,
          account_id: transactionData.account_id
        },
        timestamp: new Date()
      };

      violations.push(violation);
      await this.processViolation(violation);
    }

    // Check for rapid transactions (if we have transaction history)
    if (rules.rapid_transactions && transactionData.recent_count) {
      if (transactionData.recent_count > rules.rapid_transactions.count) {
        const violation = {
          type: 'financial_compliance',
          subtype: 'rapid_transactions',
          description: `${transactionData.recent_count} transactions detected in short timeframe`,
          action: rules.rapid_transactions.action,
          severity: rules.rapid_transactions.severity,
          source: source,
          data: {
            transaction_count: transactionData.recent_count,
            threshold: rules.rapid_transactions.count,
            timeWindow: rules.rapid_transactions.timeWindow
          },
          timestamp: new Date()
        };

        violations.push(violation);
        await this.processViolation(violation);
      }
    }

    return violations;
  }

  async scanAPICallForCompliance(apiData: any, source: string): Promise<any[]> {
    const violations = [];

    if (!this.config.rules.api_security?.enabled) {
      return violations;
    }

    const rules = this.config.rules.api_security.rules;

    // Check authentication failures
    if (rules.authentication_failures && apiData.status_code === 401) {
      // This would typically check against stored failure counts
      const violation = {
        type: 'api_security',
        subtype: 'authentication_failure',
        description: `Authentication failure from ${apiData.client_ip}`,
        action: rules.authentication_failures.action,
        severity: rules.authentication_failures.severity,
        source: source,
        data: {
          ip: apiData.client_ip,
          endpoint: apiData.endpoint,
          user_agent: apiData.user_agent
        },
        timestamp: new Date()
      };

      violations.push(violation);
      await this.processViolation(violation);
    }

    // Check suspicious user agents
    if (rules.suspicious_user_agents && apiData.user_agent) {
      const suspiciousPatterns = rules.suspicious_user_agents.patterns;
      const userAgent = apiData.user_agent.toLowerCase();

      for (const pattern of suspiciousPatterns) {
        if (userAgent.includes(pattern)) {
          const violation = {
            type: 'api_security',
            subtype: 'suspicious_user_agent',
            description: `Suspicious user agent detected: ${pattern}`,
            action: rules.suspicious_user_agents.action,
            severity: rules.suspicious_user_agents.severity,
            source: source,
            data: {
              user_agent: apiData.user_agent,
              pattern: pattern,
              ip: apiData.client_ip
            },
            timestamp: new Date()
          };

          violations.push(violation);
          await this.processViolation(violation);
          break; // Only report first match
        }
      }
    }

    // Check large payload
    if (rules.large_payload && apiData.body_size) {
      const maxSizeBytes = rules.large_payload.max_size_mb * 1024 * 1024;
      if (apiData.body_size > maxSizeBytes) {
        const violation = {
          type: 'api_security',
          subtype: 'large_payload',
          description: `Request payload size ${(apiData.body_size / 1024 / 1024).toFixed(2)}MB exceeds limit`,
          action: rules.large_payload.action,
          severity: rules.large_payload.severity,
          source: source,
          data: {
            size_mb: apiData.body_size / 1024 / 1024,
            limit_mb: rules.large_payload.max_size_mb
          },
          timestamp: new Date()
        };

        violations.push(violation);
        await this.processViolation(violation);
      }
    }

    return violations;
  }

  async scanAIUsageForCompliance(aiData: any, source: string): Promise<any[]> {
    const violations = [];

    if (!this.config.rules.ai_usage_compliance?.enabled) {
      return violations;
    }

    const rules = this.config.rules.ai_usage_compliance.rules;

    // Check high token usage
    if (rules.high_token_usage && aiData.tokens?.total > rules.high_token_usage.threshold) {
      const violation = {
        type: 'ai_usage_compliance',
        subtype: 'high_token_usage',
        description: `AI request used ${aiData.tokens.total} tokens`,
        action: rules.high_token_usage.action,
        severity: rules.high_token_usage.severity,
        source: source,
        data: {
          tokens: aiData.tokens.total,
          threshold: rules.high_token_usage.threshold,
          model: aiData.model,
          cost: aiData.cost
        },
        timestamp: new Date()
      };

      violations.push(violation);
      await this.processViolation(violation);
    }

    // Check cost threshold
    if (rules.cost_threshold && aiData.cost > rules.cost_threshold.single_request_limit) {
      const violation = {
        type: 'ai_usage_compliance',
        subtype: 'cost_threshold',
        description: `AI request cost $${aiData.cost.toFixed(4)} exceeds limit`,
        action: rules.cost_threshold.action,
        severity: rules.cost_threshold.severity,
        source: source,
        data: {
          cost: aiData.cost,
          limit: rules.cost_threshold.single_request_limit,
          model: aiData.model
        },
        timestamp: new Date()
      };

      violations.push(violation);
      await this.processViolation(violation);
    }

    // Check for PII in prompts/responses
    if (rules.pii_in_prompts && (aiData.prompt || aiData.response)) {
      const textToScan = `${aiData.prompt || ''} ${aiData.response || ''}`;
      const piiViolations = await this.scanTextForCompliance(textToScan, `${source} - AI Content`);
      violations.push(...piiViolations);
    }

    return violations;
  }

  private async processViolation(violation: any): Promise<void> {
    try {
      // Create data classification for PII violations
      if (violation.type === 'pii_detection') {
        await storage.createDataClassification({
          dataType: violation.subtype,
          riskLevel: violation.severity,
          source: violation.source,
          content: violation.content || `${violation.subtype} detected`,
          isResolved: false
        });

        // Send Discord notification
        await discordService.sendDataClassificationAlert({
          dataType: violation.subtype,
          riskLevel: violation.severity,
          source: violation.source,
          content: violation.pattern,
          timestamp: violation.timestamp
        });
      }

      // Create security alert for other violations
      if (violation.type !== 'pii_detection') {
        await storage.createAlert({
          title: `${violation.type.replace('_', ' ').toUpperCase()}: ${violation.subtype}`,
          description: violation.description,
          severity: violation.severity,
          source: violation.source,
          status: 'active'
        });
      }

      // Create incident for critical violations
      if (violation.severity === 'critical') {
        await storage.createIncident({
          severity: violation.severity,
          description: `Critical compliance violation: ${violation.description}`,
          status: 'investigating',
          source: violation.source
        });

        // Send Discord incident notification
        await discordService.sendIncidentAlert({
          severity: violation.severity,
          description: violation.description,
          status: 'investigating',
          source: violation.source,
          timestamp: violation.timestamp
        });
      }

      console.log(`Processed compliance violation: ${violation.type}/${violation.subtype}`);

    } catch (error) {
      console.error('Error processing violation:', error);
    }
  }

  private redactMatches(text: string, regex: RegExp, patternType: string): string {
    return text.replace(regex, (match) => {
      switch (patternType) {
        case 'credit_card':
          return `****-****-****-${match.slice(-4)}`;
        case 'ssn':
          return `***-**-${match.slice(-4)}`;
        case 'email':
          return '[EMAIL_REDACTED]';
        case 'phone':
          return `***-***-${match.slice(-4)}`;
        default:
          return '[REDACTED]';
      }
    });
  }

  async updateConfig(newConfig: Partial<ComplianceConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      this.config.lastUpdated = new Date().toISOString();
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('Compliance config updated successfully');
    } catch (error) {
      console.error('Error updating compliance config:', error);
      throw error;
    }
  }

  getConfig(): ComplianceConfig {
    return this.config;
  }

  async getComplianceReport(): Promise<any> {
    // This would typically aggregate compliance data from storage
    const today = new Date().toISOString().split('T')[0];
    
    return {
      date: today,
      config_version: this.config.version,
      rules_enabled: Object.keys(this.config.rules).filter(key => this.config.rules[key].enabled).length,
      total_rules: Object.keys(this.config.rules).length,
      monitoring_status: this.config.monitoring_settings.real_time_scanning ? 'active' : 'inactive',
      last_updated: this.config.lastUpdated
    };
  }
}

export const complianceEngine = new ComplianceEngine();