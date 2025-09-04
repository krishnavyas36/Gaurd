import { 
  type User, type UpsertUser,
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
  // Users (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
    
    // Initialize real API sources with zero calls (real tracking starts from here)
    const defaultSources: InsertApiSource[] = [
      { name: "Plaid API", url: "https://production.plaid.com", status: "active", callsToday: 0, alertStatus: "normal" },
      { name: "OpenAI API", url: "https://api.openai.com", status: "active", callsToday: 0, alertStatus: "normal" }
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

    // Initialize compliance rules (these are legitimate system rules)
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

    // Initialize today's stats with zero - real tracking starts from here
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

    // No default alerts, incidents, data classifications, or LLM violations
    // These will be created only when real security events occur
  }

  // Users (for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id!, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: userData.id || randomUUID(),
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
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
    
    const updated: ApiSource = { ...existing, ...updates };
    this.apiSources.set(id, updated);
    return updated;
  }

  async deleteApiSource(id: string): Promise<boolean> {
    return this.apiSources.delete(id);
  }

  // Alerts
  async getAlerts(limit: number = 50): Promise<Alert[]> {
    const alerts = Array.from(this.alerts.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return alerts.slice(0, limit);
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
      status: alert.status || "active",
      metadata: alert.metadata || null
    };
    this.alerts.set(id, newAlert);
    return newAlert;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const existing = this.alerts.get(id);
    if (!existing) return undefined;
    
    const updated: Alert = { ...existing, ...updates };
    this.alerts.set(id, updated);
    return updated;
  }

  async deleteAlert(id: string): Promise<boolean> {
    return this.alerts.delete(id);
  }

  async deleteLlmViolation(id: string): Promise<boolean> {
    return this.llmViolations.delete(id);
  }

  async clearAllLlmViolations(): Promise<void> {
    this.llmViolations.clear();
  }

  async clearAllAlerts(): Promise<void> {
    this.alerts.clear();
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
    
    const updated: ComplianceRule = { ...existing, ...updates };
    this.complianceRules.set(id, updated);
    return updated;
  }

  async deleteComplianceRule(id: string): Promise<boolean> {
    return this.complianceRules.delete(id);
  }

  // Data Classifications
  async getDataClassifications(limit: number = 20): Promise<DataClassification[]> {
    const classifications = Array.from(this.dataClassifications.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return classifications.slice(0, limit);
  }

  async getDataClassificationsByRisk(riskLevel: string): Promise<DataClassification[]> {
    return Array.from(this.dataClassifications.values()).filter(
      classification => classification.riskLevel === riskLevel
    );
  }

  async createDataClassification(classification: InsertDataClassification): Promise<DataClassification> {
    const id = randomUUID();
    const newClassification: DataClassification = { 
      ...classification, 
      id, 
      timestamp: new Date(),
      isResolved: classification.isResolved ?? false,
      content: classification.content || null
    };
    this.dataClassifications.set(id, newClassification);
    return newClassification;
  }

  async updateDataClassification(id: string, updates: Partial<DataClassification>): Promise<DataClassification | undefined> {
    const existing = this.dataClassifications.get(id);
    if (!existing) return undefined;
    
    const updated: DataClassification = { ...existing, ...updates };
    this.dataClassifications.set(id, updated);
    return updated;
  }

  // LLM Violations
  async getLlmViolations(limit: number = 10): Promise<LlmViolation[]> {
    const violations = Array.from(this.llmViolations.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return violations.slice(0, limit);
  }

  async createLlmViolation(violation: InsertLlmViolation): Promise<LlmViolation> {
    const id = randomUUID();
    const newViolation: LlmViolation = { 
      ...violation, 
      id, 
      timestamp: new Date(),
      metadata: violation.metadata || {}
    };
    this.llmViolations.set(id, newViolation);
    return newViolation;
  }

  // Incidents
  async getIncidents(limit: number = 10): Promise<Incident[]> {
    const incidents = Array.from(this.incidents.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return incidents.slice(0, limit);
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const id = randomUUID();
    const newIncident: Incident = { 
      ...incident, 
      id, 
      timestamp: new Date(),
      resolvedAt: incident.status === "resolved" ? new Date() : null,
      metadata: incident.metadata || null,
      status: incident.status || "investigating"
    };
    this.incidents.set(id, newIncident);
    return newIncident;
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | undefined> {
    const existing = this.incidents.get(id);
    if (!existing) return undefined;
    
    const updated: Incident = { ...existing, ...updates };
    if (updated.status === "resolved" && !updated.resolvedAt) {
      updated.resolvedAt = new Date();
    }
    this.incidents.set(id, updated);
    return updated;
  }

  // Monitoring Stats
  async getMonitoringStats(date?: string): Promise<MonitoringStats | undefined> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.monitoringStats.get(targetDate);
  }

  async createOrUpdateMonitoringStats(stats: InsertMonitoringStats): Promise<MonitoringStats> {
    const targetDate = stats.date || new Date().toISOString().split('T')[0];
    const existing = this.monitoringStats.get(targetDate);
    
    if (existing) {
      const updated: MonitoringStats = { ...existing, ...stats };
      this.monitoringStats.set(targetDate, updated);
      return updated;
    } else {
      const id = randomUUID();
      const newStats: MonitoringStats = { ...stats, id, date: targetDate };
      this.monitoringStats.set(targetDate, newStats);
      return newStats;
    }
  }

  async getTodaysStats(): Promise<MonitoringStats> {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.monitoringStats.get(today);
    
    if (existing) {
      return existing;
    }
    
    // Create today's stats if they don't exist
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

export const storage = new MemStorage();