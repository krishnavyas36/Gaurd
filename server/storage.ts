import { 
  type User, type InsertUser,
  type ApiSource, type InsertApiSource,
  type Alert, type InsertAlert,
  type ComplianceRule, type InsertComplianceRule,
  type DataClassification, type InsertDataClassification,
  type LlmViolation, type InsertLlmViolation,
  type Incident, type InsertIncident,
  type MonitoringStats, type InsertMonitoringStats,
  users, apiSources, alerts, complianceRules, dataClassifications,
  llmViolations, incidents, monitoringStats
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // API Sources
  getApiSources(): Promise<ApiSource[]>;
  getApiSource(id: string): Promise<ApiSource | undefined>;
  createApiSource(source: InsertApiSource): Promise<ApiSource>;
  updateApiSource(id: string, updates: Partial<ApiSource>): Promise<ApiSource | undefined>;
  deleteApiSource(id: string): Promise<boolean>;

  // Alerts
  getAlerts(limit?: number): Promise<Alert[]>;
  getActiveAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined>;
  deleteAlert(id: string): Promise<boolean>;

  // Compliance Rules
  getComplianceRules(): Promise<ComplianceRule[]>;
  getActiveComplianceRules(): Promise<ComplianceRule[]>;
  createComplianceRule(rule: InsertComplianceRule): Promise<ComplianceRule>;
  updateComplianceRule(id: string, updates: Partial<ComplianceRule>): Promise<ComplianceRule | undefined>;
  deleteComplianceRule(id: string): Promise<boolean>;

  // Data Classifications
  getDataClassifications(limit?: number): Promise<DataClassification[]>;
  getDataClassificationsByRisk(riskLevel: string): Promise<DataClassification[]>;
  createDataClassification(classification: InsertDataClassification): Promise<DataClassification>;
  updateDataClassification(id: string, updates: Partial<DataClassification>): Promise<DataClassification | undefined>;

  // LLM Violations
  getLlmViolations(limit?: number): Promise<LlmViolation[]>;
  createLlmViolation(violation: InsertLlmViolation): Promise<LlmViolation>;

  // Incidents
  getIncidents(limit?: number): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | undefined>;

  // Monitoring Stats
  getMonitoringStats(date?: string): Promise<MonitoringStats | undefined>;
  createOrUpdateMonitoringStats(stats: InsertMonitoringStats): Promise<MonitoringStats>;
  getTodaysStats(): Promise<MonitoringStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private apiSources: Map<string, ApiSource> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private complianceRules: Map<string, ComplianceRule> = new Map();
  private dataClassifications: Map<string, DataClassification> = new Map();
  private llmViolations: Map<string, LlmViolation> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private monitoringStats: Map<string, MonitoringStats> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const today = new Date().toISOString().split('T')[0];
    
    // Initialize default API sources
    const defaultSources: InsertApiSource[] = [
      { name: "Plaid API", url: "https://api.plaid.com", status: "active", callsToday: 1247, alertStatus: "normal" },
      { name: "OpenAI API", url: "https://api.openai.com", status: "active", callsToday: 892, alertStatus: "elevated" },
      { name: "Internal CRM", url: "https://internal.crm.com", status: "active", callsToday: 456, alertStatus: "normal" }
    ];

    defaultSources.forEach(source => {
      const id = randomUUID();
      this.apiSources.set(id, { 
        ...source, 
        id, 
        lastActivity: new Date(),
        status: source.status || "active",
        callsToday: source.callsToday || 0,
        alertStatus: source.alertStatus || "normal"
      });
    });

    // Initialize default compliance rules
    const defaultRules: InsertComplianceRule[] = [
      {
        name: "API Rate Limit",
        description: "Maximum 1000 API calls per hour per source",
        ruleType: "rate_limit",
        config: { maxCallsPerHour: 1000 },
        isActive: true
      },
      {
        name: "PII Detection",
        description: "Scan for SSN, credit card numbers, and personal identifiers",
        ruleType: "pii_detection",
        config: { patterns: ["ssn", "credit_card", "email"] },
        isActive: true
      },
      {
        name: "GDPR Consent",
        description: "Verify consent documentation for EU user data processing",
        ruleType: "gdpr_consent",
        config: { requiredFields: ["consent", "purpose"] },
        isActive: true
      }
    ];

    defaultRules.forEach(rule => {
      const id = randomUUID();
      this.complianceRules.set(id, { 
        ...rule, 
        id, 
        lastTriggered: null, 
        createdAt: new Date(),
        isActive: rule.isActive ?? true
      });
    });

    // Initialize default alerts
    const defaultAlerts: InsertAlert[] = [
      {
        title: "API Usage Anomaly Detected",
        description: "OpenAI API alert status escalated to elevated",
        severity: "high",
        source: "Monitoring Service",
        status: "active"
      },
      {
        title: "PII Detection Alert",
        description: "Potential SSN found in API response data",
        severity: "critical", 
        source: "Compliance Engine",
        status: "active"
      },
      {
        title: "Rate Limit Warning",
        description: "API calls approaching hourly limit threshold",
        severity: "medium",
        source: "Rate Monitor",
        status: "acknowledged"
      },
      {
        title: "GDPR Compliance Check",
        description: "User consent verification required",
        severity: "medium",
        source: "Compliance Engine",
        status: "resolved"
      }
    ];

    defaultAlerts.forEach(alert => {
      const id = randomUUID();
      this.alerts.set(id, { 
        ...alert, 
        id, 
        timestamp: new Date(),
        status: alert.status || "active",
        metadata: {}
      });
    });

    // Initialize sample data classifications
    const defaultClassifications: InsertDataClassification[] = [
      {
        dataType: "SSN",
        riskLevel: "high",
        source: "Plaid API Response",
        content: "***-**-1234 (redacted)",
        isResolved: false
      },
      {
        dataType: "Credit Card",
        riskLevel: "high", 
        source: "Transaction Data",
        content: "****-****-****-5678 (redacted)",
        isResolved: true
      },
      {
        dataType: "Email Address",
        riskLevel: "medium",
        source: "User Profile API",
        content: "user@example.com",
        isResolved: false
      }
    ];

    defaultClassifications.forEach(classification => {
      const id = randomUUID();
      this.dataClassifications.set(id, { 
        ...classification, 
        id, 
        timestamp: new Date(),
        isResolved: classification.isResolved ?? false,
        content: classification.content || null
      });
    });

    // Initialize sample incidents
    const defaultIncidents: InsertIncident[] = [
      {
        severity: "high",
        description: "Unauthorized API access attempt detected from suspicious IP address",
        status: "investigating",
        source: "API Gateway Monitor"
      },
      {
        severity: "medium", 
        description: "Multiple failed authentication attempts detected",
        status: "resolved",
        source: "Auth Service"
      }
    ];

    defaultIncidents.forEach(incident => {
      const id = randomUUID();
      this.incidents.set(id, { 
        ...incident, 
        id, 
        timestamp: new Date(),
        resolvedAt: incident.status === "resolved" ? new Date() : null,
        metadata: {},
        status: incident.status || null
      });
    });

    // Initialize sample LLM violations  
    const defaultViolations: InsertLlmViolation[] = [
      {
        violationType: "financial_advice",
        content: "You should definitely invest all your money in this stock",
        action: "blocked"
      },
      {
        violationType: "unverified_data",
        content: "Based on insider information, this company will announce...",
        action: "rewritten"
      }
    ];

    defaultViolations.forEach(violation => {
      const id = randomUUID();
      this.llmViolations.set(id, { 
        ...violation, 
        id, 
        timestamp: new Date(),
        metadata: {}
      });
    });

    // Initialize today's stats
    const defaultStats: InsertMonitoringStats = {
      date: today,
      totalApiCalls: 2595,
      alertsGenerated: 3,
      complianceScore: 98,
      sensitiveDataDetected: 24,
      llmResponsesScanned: 1247,
      llmResponsesFlagged: 23,
      llmResponsesBlocked: 5
    };

    const statsId = randomUUID();
    this.monitoringStats.set(today, { 
      ...defaultStats, 
      id: statsId,
      totalApiCalls: defaultStats.totalApiCalls ?? 0,
      alertsGenerated: defaultStats.alertsGenerated ?? 0,
      complianceScore: defaultStats.complianceScore ?? 100,
      sensitiveDataDetected: defaultStats.sensitiveDataDetected ?? 0,
      llmResponsesScanned: defaultStats.llmResponsesScanned ?? 0,
      llmResponsesFlagged: defaultStats.llmResponsesFlagged ?? 0,
      llmResponsesBlocked: defaultStats.llmResponsesBlocked ?? 0
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // API Sources
  async getApiSources(): Promise<ApiSource[]> {
    return Array.from(this.apiSources.values());
  }

  async getApiSource(id: string): Promise<ApiSource | undefined> {
    return this.apiSources.get(id);
  }

  async createApiSource(source: InsertApiSource): Promise<ApiSource> {
    const id = randomUUID();
    const apiSource: ApiSource = { 
      ...source, 
      id, 
      lastActivity: new Date(),
      status: source.status || "active",
      callsToday: source.callsToday || 0,
      alertStatus: source.alertStatus || "normal"
    };
    this.apiSources.set(id, apiSource);
    return apiSource;
  }

  async updateApiSource(id: string, updates: Partial<ApiSource>): Promise<ApiSource | undefined> {
    const existing = this.apiSources.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.apiSources.set(id, updated);
    return updated;
  }

  async deleteApiSource(id: string): Promise<boolean> {
    return this.apiSources.delete(id);
  }

  // Alerts
  async getAlerts(limit = 50): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit);
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => alert.status === "active");
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const newAlert: Alert = { 
      ...alert, 
      id, 
      timestamp: new Date(),
      metadata: alert.metadata || null,
      status: alert.status || "active"
    };
    this.alerts.set(id, newAlert);
    return newAlert;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const existing = this.alerts.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.alerts.set(id, updated);
    return updated;
  }

  async deleteAlert(id: string): Promise<boolean> {
    return this.alerts.delete(id);
  }

  // Compliance Rules
  async getComplianceRules(): Promise<ComplianceRule[]> {
    return Array.from(this.complianceRules.values());
  }

  async getActiveComplianceRules(): Promise<ComplianceRule[]> {
    return Array.from(this.complianceRules.values()).filter(rule => rule.isActive);
  }

  async createComplianceRule(rule: InsertComplianceRule): Promise<ComplianceRule> {
    const id = randomUUID();
    const newRule: ComplianceRule = { 
      ...rule, 
      id, 
      lastTriggered: null, 
      createdAt: new Date(),
      isActive: rule.isActive ?? true
    };
    this.complianceRules.set(id, newRule);
    return newRule;
  }

  async updateComplianceRule(id: string, updates: Partial<ComplianceRule>): Promise<ComplianceRule | undefined> {
    const existing = this.complianceRules.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.complianceRules.set(id, updated);
    return updated;
  }

  async deleteComplianceRule(id: string): Promise<boolean> {
    return this.complianceRules.delete(id);
  }

  // Data Classifications
  async getDataClassifications(limit = 50): Promise<DataClassification[]> {
    return Array.from(this.dataClassifications.values())
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit);
  }

  async getDataClassificationsByRisk(riskLevel: string): Promise<DataClassification[]> {
    return Array.from(this.dataClassifications.values()).filter(item => item.riskLevel === riskLevel);
  }

  async createDataClassification(classification: InsertDataClassification): Promise<DataClassification> {
    const id = randomUUID();
    const newClassification: DataClassification = { 
      ...classification, 
      id, 
      timestamp: new Date(),
      content: classification.content || null,
      isResolved: classification.isResolved ?? false
    };
    this.dataClassifications.set(id, newClassification);
    return newClassification;
  }

  async updateDataClassification(id: string, updates: Partial<DataClassification>): Promise<DataClassification | undefined> {
    const existing = this.dataClassifications.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.dataClassifications.set(id, updated);
    return updated;
  }

  // LLM Violations
  async getLlmViolations(limit = 50): Promise<LlmViolation[]> {
    return Array.from(this.llmViolations.values())
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit);
  }

  async createLlmViolation(violation: InsertLlmViolation): Promise<LlmViolation> {
    const id = randomUUID();
    const newViolation: LlmViolation = { 
      ...violation, 
      id, 
      timestamp: new Date(),
      metadata: violation.metadata || null
    };
    this.llmViolations.set(id, newViolation);
    return newViolation;
  }

  // Incidents
  async getIncidents(limit = 50): Promise<Incident[]> {
    return Array.from(this.incidents.values())
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, limit);
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const id = randomUUID();
    const newIncident: Incident = { 
      ...incident, 
      id, 
      timestamp: new Date(),
      metadata: incident.metadata || null,
      status: incident.status || "open",
      resolvedAt: null
    };
    this.incidents.set(id, newIncident);
    return newIncident;
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | undefined> {
    const existing = this.incidents.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.incidents.set(id, updated);
    return updated;
  }

  // Monitoring Stats
  async getMonitoringStats(date?: string): Promise<MonitoringStats | undefined> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.monitoringStats.get(targetDate);
  }

  async createOrUpdateMonitoringStats(stats: InsertMonitoringStats): Promise<MonitoringStats> {
    const existing = this.monitoringStats.get(stats.date);
    if (existing) {
      const updated = { ...existing, ...stats };
      this.monitoringStats.set(stats.date, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newStats: MonitoringStats = { 
      ...stats, 
      id,
      totalApiCalls: stats.totalApiCalls ?? 0,
      alertsGenerated: stats.alertsGenerated ?? 0,
      complianceScore: stats.complianceScore ?? 100,
      sensitiveDataDetected: stats.sensitiveDataDetected ?? 0,
      llmResponsesScanned: stats.llmResponsesScanned ?? 0,
      llmResponsesFlagged: stats.llmResponsesFlagged ?? 0,
      llmResponsesBlocked: stats.llmResponsesBlocked ?? 0
    };
      this.monitoringStats.set(stats.date, newStats);
      return newStats;
    }
  }

  async getTodaysStats(): Promise<MonitoringStats> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getMonitoringStats(today);
    if (existing) return existing;

    // Create default stats for today
    const defaultStats: InsertMonitoringStats = {
      date: today,
      totalApiCalls: 0,
      alertsGenerated: 0,
      complianceScore: 100,
      sensitiveDataDetected: 0,
      llmResponsesScanned: 0,
      llmResponsesFlagged: 0,
      llmResponsesBlocked: 0
    };

    return this.createOrUpdateMonitoringStats(defaultStats);
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // API Sources
  async getApiSources(): Promise<ApiSource[]> {
    return await db.select().from(apiSources);
  }

  async getApiSource(id: string): Promise<ApiSource | undefined> {
    const [source] = await db.select().from(apiSources).where(eq(apiSources.id, id));
    return source || undefined;
  }

  async createApiSource(source: InsertApiSource): Promise<ApiSource> {
    const [newSource] = await db.insert(apiSources).values(source).returning();
    return newSource;
  }

  async updateApiSource(id: string, updates: Partial<ApiSource>): Promise<ApiSource | undefined> {
    const [updated] = await db.update(apiSources)
      .set(updates)
      .where(eq(apiSources.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteApiSource(id: string): Promise<boolean> {
    const result = await db.delete(apiSources).where(eq(apiSources.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Alerts
  async getAlerts(limit: number = 50): Promise<Alert[]> {
    return await db.select().from(alerts)
      .orderBy(desc(alerts.timestamp))
      .limit(limit);
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).where(eq(alerts.status, "active"));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const [updated] = await db.update(alerts)
      .set(updates)
      .where(eq(alerts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAlert(id: string): Promise<boolean> {
    const result = await db.delete(alerts).where(eq(alerts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Compliance Rules
  async getComplianceRules(): Promise<ComplianceRule[]> {
    return await db.select().from(complianceRules);
  }

  async getActiveComplianceRules(): Promise<ComplianceRule[]> {
    return await db.select().from(complianceRules).where(eq(complianceRules.isActive, true));
  }

  async createComplianceRule(rule: InsertComplianceRule): Promise<ComplianceRule> {
    const [newRule] = await db.insert(complianceRules).values(rule).returning();
    return newRule;
  }

  async updateComplianceRule(id: string, updates: Partial<ComplianceRule>): Promise<ComplianceRule | undefined> {
    const [updated] = await db.update(complianceRules)
      .set(updates)
      .where(eq(complianceRules.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteComplianceRule(id: string): Promise<boolean> {
    const result = await db.delete(complianceRules).where(eq(complianceRules.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Data Classifications
  async getDataClassifications(limit: number = 100): Promise<DataClassification[]> {
    return await db.select().from(dataClassifications)
      .orderBy(desc(dataClassifications.timestamp))
      .limit(limit);
  }

  async getDataClassificationsByRisk(riskLevel: string): Promise<DataClassification[]> {
    return await db.select().from(dataClassifications)
      .where(eq(dataClassifications.riskLevel, riskLevel));
  }

  async createDataClassification(classification: InsertDataClassification): Promise<DataClassification> {
    const [newClassification] = await db.insert(dataClassifications).values(classification).returning();
    return newClassification;
  }

  async updateDataClassification(id: string, updates: Partial<DataClassification>): Promise<DataClassification | undefined> {
    const [updated] = await db.update(dataClassifications)
      .set(updates)
      .where(eq(dataClassifications.id, id))
      .returning();
    return updated || undefined;
  }

  // LLM Violations
  async getLlmViolations(limit: number = 50): Promise<LlmViolation[]> {
    return await db.select().from(llmViolations)
      .orderBy(desc(llmViolations.timestamp))
      .limit(limit);
  }

  async createLlmViolation(violation: InsertLlmViolation): Promise<LlmViolation> {
    const [newViolation] = await db.insert(llmViolations).values(violation).returning();
    return newViolation;
  }

  // Incidents
  async getIncidents(limit: number = 50): Promise<Incident[]> {
    return await db.select().from(incidents)
      .orderBy(desc(incidents.timestamp))
      .limit(limit);
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | undefined> {
    const [updated] = await db.update(incidents)
      .set(updates)
      .where(eq(incidents.id, id))
      .returning();
    return updated || undefined;
  }

  // Monitoring Stats
  async getMonitoringStats(date?: string): Promise<MonitoringStats | undefined> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const [stats] = await db.select().from(monitoringStats)
      .where(eq(monitoringStats.date, targetDate));
    return stats || undefined;
  }

  async createOrUpdateMonitoringStats(stats: InsertMonitoringStats): Promise<MonitoringStats> {
    const existing = await this.getMonitoringStats(stats.date);
    
    if (existing) {
      const [updated] = await db.update(monitoringStats)
        .set(stats)
        .where(eq(monitoringStats.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newStats] = await db.insert(monitoringStats).values(stats).returning();
      return newStats;
    }
  }

  async getTodaysStats(): Promise<MonitoringStats> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.getMonitoringStats(today);
    
    if (existing) {
      return existing;
    }

    // Create default stats for today
    const defaultStats: InsertMonitoringStats = {
      date: today,
      totalApiCalls: 0,
      alertsGenerated: 0,
      complianceScore: 100,
      sensitiveDataDetected: 0,
      llmResponsesScanned: 0,
      llmResponsesFlagged: 0,
      llmResponsesBlocked: 0
    };

    return await this.createOrUpdateMonitoringStats(defaultStats);
  }
}

export const storage = new DatabaseStorage();
