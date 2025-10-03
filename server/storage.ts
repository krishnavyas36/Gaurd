import { 
  type User, type UpsertUser,
  type ApiSource, type InsertApiSource,
  type Alert, type InsertAlert,
  type ComplianceRule, type InsertComplianceRule,
  type DataClassification, type InsertDataClassification,
  type LlmViolation, type InsertLlmViolation,
  type Incident, type InsertIncident,
  type MonitoringStats, type InsertMonitoringStats,
  type ExternalApiCall, type InsertExternalApiCall,
  type CrossAppUsageStats, type InsertCrossAppUsageStats,
  type RequestCorrelation, type InsertRequestCorrelation,
  users, apiSources, alerts, complianceRules, dataClassifications,
  llmViolations, incidents, monitoringStats, externalApiCalls,
  crossAppUsageStats, requestCorrelations
} from "@shared/schema";
import { randomUUID } from "crypto";
import fs from 'fs';
import path from 'path';
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  private reviveDates<T extends Record<string, any>>(item: T): T {
    if (!item) return item;
    const keys = ['createdAt', 'updatedAt', 'lastActivity', 'timestamp'];
    for (const key of keys) {
      if (item[key]) {
        const parsed = new Date(item[key]);
        if (!Number.isNaN(parsed.getTime())) {
          item[key] = parsed as any;
        }
      }
    }
    return item;
  }

  private loadState() {
    try {
      const raw = fs.readFileSync(this.dataFilePath, 'utf8');
      const state = JSON.parse(raw);

      this.users = new Map((state.users || []).map((item: User) => [item.id, this.reviveDates({ ...item })]));
      this.apiSources = new Map((state.apiSources || []).map((item: ApiSource) => [item.id, this.reviveDates({ ...item })]));
      this.alerts = new Map((state.alerts || []).map((item: Alert) => [item.id, this.reviveDates({ ...item })]));
      this.complianceRules = new Map((state.complianceRules || []).map((item: ComplianceRule) => [item.id, this.reviveDates({ ...item })]));
      this.dataClassifications = new Map((state.dataClassifications || []).map((item: DataClassification) => [item.id, this.reviveDates({ ...item })]));
      this.llmViolations = new Map((state.llmViolations || []).map((item: LlmViolation) => [item.id, this.reviveDates({ ...item })]));
      this.incidents = new Map((state.incidents || []).map((item: Incident) => [item.id, this.reviveDates({ ...item })]));
      this.monitoringStats = new Map((state.monitoringStats || []).map((item: MonitoringStats) => [item.date, { ...item }]));
      this.externalApiCalls = new Map((state.externalApiCalls || []).map((item: ExternalApiCall) => [item.id, this.reviveDates({ ...item })]));
      this.crossAppUsageStats = new Map((state.crossAppUsageStats || []).map((item: CrossAppUsageStats) => [`${item.date}-${item.applicationSource}`, { ...item }]));
      this.requestCorrelations = new Map((state.requestCorrelations || []).map((item: RequestCorrelation) => [item.id, this.reviveDates({ ...item })]));
    } catch (error) {
      console.error('Failed to load storage state, falling back to defaults:', error);
      this.initializeDefaultData();
      this.persistState();
    }
  }

  private persistState() {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const state = {
        users: Array.from(this.users.values()),
        apiSources: Array.from(this.apiSources.values()),
        alerts: Array.from(this.alerts.values()),
        complianceRules: Array.from(this.complianceRules.values()),
        dataClassifications: Array.from(this.dataClassifications.values()),
        llmViolations: Array.from(this.llmViolations.values()),
        incidents: Array.from(this.incidents.values()),
        monitoringStats: Array.from(this.monitoringStats.values()),
        externalApiCalls: Array.from(this.externalApiCalls.values()),
        crossAppUsageStats: Array.from(this.crossAppUsageStats.values()),
        requestCorrelations: Array.from(this.requestCorrelations.values()),
      };

      fs.writeFileSync(this.dataFilePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to persist storage state:', error);
    }
  }

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

  // Cross-Application API Tracking
  getExternalApiCalls(limit?: number): Promise<ExternalApiCall[]>;
  getExternalApiCallsBySource(applicationSource: string, limit?: number): Promise<ExternalApiCall[]>;
  createExternalApiCall(call: InsertExternalApiCall): Promise<ExternalApiCall>;
  getExternalApiCallsByRequestId(requestId: string): Promise<ExternalApiCall[]>;

  // Cross-Application Usage Stats
  getCrossAppUsageStats(date?: string): Promise<CrossAppUsageStats[]>;
  getCrossAppUsageStatsBySource(applicationSource: string, date?: string): Promise<CrossAppUsageStats | undefined>;
  createOrUpdateCrossAppUsageStats(stats: InsertCrossAppUsageStats): Promise<CrossAppUsageStats>;

  // Request Correlation Tracking
  getRequestCorrelations(limit?: number): Promise<RequestCorrelation[]>;
  createRequestCorrelation(correlation: InsertRequestCorrelation): Promise<RequestCorrelation>;
  getCorrelationsByRequestId(requestId: string): Promise<RequestCorrelation[]>;
  markCorrelationProcessed(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private dataFilePath = path.join(process.cwd(), 'server', 'data', 'storageState.json');
  private users: Map<string, User> = new Map();
  private apiSources: Map<string, ApiSource> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private complianceRules: Map<string, ComplianceRule> = new Map();
  private dataClassifications: Map<string, DataClassification> = new Map();
  private llmViolations: Map<string, LlmViolation> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private monitoringStats: Map<string, MonitoringStats> = new Map();
  private externalApiCalls: Map<string, ExternalApiCall> = new Map();
  private crossAppUsageStats: Map<string, CrossAppUsageStats> = new Map();
  private requestCorrelations: Map<string, RequestCorrelation> = new Map();

  constructor() {
    if (fs.existsSync(this.dataFilePath)) {
      this.loadState();
    } else {
      this.initializeDefaultData();
      this.persistState();
    }
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

  private reviveDates<T extends Record<string, any>>(item: T): T {
    if (!item) return item;
    const keys = ['createdAt', 'updatedAt', 'lastActivity', 'timestamp'];
    for (const key of keys) {
      if (item[key]) {
        const parsed = new Date(item[key]);
        if (!Number.isNaN(parsed.getTime())) {
          item[key] = parsed as any;
        }
      }
    }
    return item;
  }

  private loadState() {
    try {
      const raw = fs.readFileSync(this.dataFilePath, 'utf8');
      const state = JSON.parse(raw);

      this.users = new Map((state.users || []).map((item: User) => [item.id, this.reviveDates({ ...item })]));
      this.apiSources = new Map((state.apiSources || []).map((item: ApiSource) => [item.id, this.reviveDates({ ...item })]));
      this.alerts = new Map((state.alerts || []).map((item: Alert) => [item.id, this.reviveDates({ ...item })]));
      this.complianceRules = new Map((state.complianceRules || []).map((item: ComplianceRule) => [item.id, this.reviveDates({ ...item })]));
      this.dataClassifications = new Map((state.dataClassifications || []).map((item: DataClassification) => [item.id, this.reviveDates({ ...item })]));
      this.llmViolations = new Map((state.llmViolations || []).map((item: LlmViolation) => [item.id, this.reviveDates({ ...item })]));
      this.incidents = new Map((state.incidents || []).map((item: Incident) => [item.id, this.reviveDates({ ...item })]));
      this.monitoringStats = new Map((state.monitoringStats || []).map((item: MonitoringStats) => [item.date, { ...item }]));
      this.externalApiCalls = new Map((state.externalApiCalls || []).map((item: ExternalApiCall) => [item.id, this.reviveDates({ ...item })]));
      this.crossAppUsageStats = new Map((state.crossAppUsageStats || []).map((item: CrossAppUsageStats) => [`${item.date}-${item.applicationSource}`, { ...item }]));
      this.requestCorrelations = new Map((state.requestCorrelations || []).map((item: RequestCorrelation) => [item.id, this.reviveDates({ ...item })]));
    } catch (error) {
      console.error('Failed to load storage state, falling back to defaults:', error);
      this.initializeDefaultData();
      this.persistState();
    }
  }

  private persistState() {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const state = {
        users: Array.from(this.users.values()),
        apiSources: Array.from(this.apiSources.values()),
        alerts: Array.from(this.alerts.values()),
        complianceRules: Array.from(this.complianceRules.values()),
        dataClassifications: Array.from(this.dataClassifications.values()),
        llmViolations: Array.from(this.llmViolations.values()),
        incidents: Array.from(this.incidents.values()),
        monitoringStats: Array.from(this.monitoringStats.values()),
        externalApiCalls: Array.from(this.externalApiCalls.values()),
        crossAppUsageStats: Array.from(this.crossAppUsageStats.values()),
        requestCorrelations: Array.from(this.requestCorrelations.values()),
      };

      fs.writeFileSync(this.dataFilePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to persist storage state:', error);
    }
  }

  private reviveDates<T extends Record<string, any>>(item: T): T {
    if (!item) return item;
    const keys = ['createdAt', 'updatedAt', 'lastActivity', 'timestamp'];
    for (const key of keys) {
      if (item[key]) {
        const parsed = new Date(item[key]);
        if (!Number.isNaN(parsed.getTime())) {
          item[key] = parsed as any;
        }
      }
    }
    return item;
  }

  private loadState() {
    try {
      const raw = fs.readFileSync(this.dataFilePath, 'utf8');
      const state = JSON.parse(raw);

      this.users = new Map((state.users || []).map((item: User) => [item.id, this.reviveDates({ ...item })]));
      this.apiSources = new Map((state.apiSources || []).map((item: ApiSource) => [item.id, this.reviveDates({ ...item })]));
      this.alerts = new Map((state.alerts || []).map((item: Alert) => [item.id, this.reviveDates({ ...item })]));
      this.complianceRules = new Map((state.complianceRules || []).map((item: ComplianceRule) => [item.id, this.reviveDates({ ...item })]));
      this.dataClassifications = new Map((state.dataClassifications || []).map((item: DataClassification) => [item.id, this.reviveDates({ ...item })]));
      this.llmViolations = new Map((state.llmViolations || []).map((item: LlmViolation) => [item.id, this.reviveDates({ ...item })]));
      this.incidents = new Map((state.incidents || []).map((item: Incident) => [item.id, this.reviveDates({ ...item })]));
      this.monitoringStats = new Map((state.monitoringStats || []).map((item: MonitoringStats) => [item.date, { ...item }]));
      this.externalApiCalls = new Map((state.externalApiCalls || []).map((item: ExternalApiCall) => [item.id, this.reviveDates({ ...item })]));
      this.crossAppUsageStats = new Map((state.crossAppUsageStats || []).map((item: CrossAppUsageStats) => [`${item.date}-${item.applicationSource}`, { ...item }]));
      this.requestCorrelations = new Map((state.requestCorrelations || []).map((item: RequestCorrelation) => [item.id, this.reviveDates({ ...item })]));
    } catch (error) {
      console.error('Failed to load storage state, falling back to defaults:', error);
      this.initializeDefaultData();
      this.persistState();
    }
  }

  private persistState() {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const state = {
        users: Array.from(this.users.values()),
        apiSources: Array.from(this.apiSources.values()),
        alerts: Array.from(this.alerts.values()),
        complianceRules: Array.from(this.complianceRules.values()),
        dataClassifications: Array.from(this.dataClassifications.values()),
        llmViolations: Array.from(this.llmViolations.values()),
        incidents: Array.from(this.incidents.values()),
        monitoringStats: Array.from(this.monitoringStats.values()),
        externalApiCalls: Array.from(this.externalApiCalls.values()),
        crossAppUsageStats: Array.from(this.crossAppUsageStats.values()),
        requestCorrelations: Array.from(this.requestCorrelations.values()),
      };

      fs.writeFileSync(this.dataFilePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to persist storage state:', error);
    }
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
      this.persistState();
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
      this.persistState();
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
    this.persistState();
    return apiSource;
  }

  async updateApiSource(id: string, updates: Partial<ApiSource>): Promise<ApiSource | undefined> {
    const existing = this.apiSources.get(id);
    if (!existing) return undefined;
    
    const updated: ApiSource = { ...existing, ...updates };
    this.apiSources.set(id, updated);
    this.persistState();
    return updated;
  }

  async deleteApiSource(id: string): Promise<boolean> {
    const deleted = this.apiSources.delete(id);
    if (deleted) this.persistState();
    return deleted;
  }

  // Alerts
  async getAlerts(limit: number = 50): Promise<Alert[]> {
    const alerts = Array.from(this.alerts.values())
      .sort((a, b) => (b.timestamp ? new Date(b.timestamp) : new Date()).getTime() - (a.timestamp ? new Date(a.timestamp) : new Date()).getTime());
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
    this.persistState();
    return newAlert;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const existing = this.alerts.get(id);
    if (!existing) return undefined;
    
    const updated: Alert = { ...existing, ...updates };
    this.alerts.set(id, updated);
    this.persistState();
    return updated;
  }

  async deleteAlert(id: string): Promise<boolean> {
    const deleted = this.alerts.delete(id);
    if (deleted) this.persistState();
    return deleted;
  }

  async deleteLlmViolation(id: string): Promise<boolean> {
    const deleted = this.llmViolations.delete(id);
    if (deleted) this.persistState();
    return deleted;
  }

  async clearAllLlmViolations(): Promise<void> {
    this.llmViolations.clear();
    this.persistState();
  }

  async clearAllAlerts(): Promise<void> {
    this.alerts.clear();
    this.persistState();
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
    this.persistState();
    return newRule;
  }

  async updateComplianceRule(id: string, updates: Partial<ComplianceRule>): Promise<ComplianceRule | undefined> {
    const existing = this.complianceRules.get(id);
    if (!existing) return undefined;
    
    const updated: ComplianceRule = { ...existing, ...updates };
    this.complianceRules.set(id, updated);
    this.persistState();
    return updated;
  }

  async deleteComplianceRule(id: string): Promise<boolean> {
    const deleted = this.complianceRules.delete(id);
    if (deleted) this.persistState();
    return deleted;
  }

  // Data Classifications
  async getDataClassifications(limit: number = 20): Promise<DataClassification[]> {
    const classifications = Array.from(this.dataClassifications.values())
      .sort((a, b) => (b.timestamp ? new Date(b.timestamp) : new Date()).getTime() - (a.timestamp ? new Date(a.timestamp) : new Date()).getTime());
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
    this.persistState();
    return newClassification;
  }

  async updateDataClassification(id: string, updates: Partial<DataClassification>): Promise<DataClassification | undefined> {
    const existing = this.dataClassifications.get(id);
    if (!existing) return undefined;
    
    const updated: DataClassification = { ...existing, ...updates };
    this.dataClassifications.set(id, updated);
    this.persistState();
    return updated;
  }

  // LLM Violations
  async getLlmViolations(limit: number = 10): Promise<LlmViolation[]> {
    const violations = Array.from(this.llmViolations.values())
      .sort((a, b) => (b.timestamp ? new Date(b.timestamp) : new Date()).getTime() - (a.timestamp ? new Date(a.timestamp) : new Date()).getTime());
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
    this.persistState();
    return newViolation;
  }

  // Incidents
  async getIncidents(limit: number = 10): Promise<Incident[]> {
    const incidents = Array.from(this.incidents.values())
      .sort((a, b) => (b.timestamp ? new Date(b.timestamp) : new Date()).getTime() - (a.timestamp ? new Date(a.timestamp) : new Date()).getTime());
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
    this.persistState();
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
    this.persistState();
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
      this.persistState();
      return updated;
    } else {
      const id = randomUUID();
      const newStats: MonitoringStats = { 
        ...stats, 
        id, 
        date: targetDate,
        totalApiCalls: stats.totalApiCalls ?? 0,
        alertsGenerated: stats.alertsGenerated ?? 0,
        complianceScore: stats.complianceScore ?? 100,
        sensitiveDataDetected: stats.sensitiveDataDetected ?? 0,
        llmResponsesScanned: stats.llmResponsesScanned ?? 0,
        llmResponsesFlagged: stats.llmResponsesFlagged ?? 0,
        llmResponsesBlocked: stats.llmResponsesBlocked ?? 0
      };
      this.monitoringStats.set(targetDate, newStats);
      this.persistState();
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

  // Cross-Application API Tracking
  async getExternalApiCalls(limit: number = 50): Promise<ExternalApiCall[]> {
    const calls = Array.from(this.externalApiCalls.values())
      .sort((a, b) => (b.timestamp ? new Date(b.timestamp) : new Date()).getTime() - (a.timestamp ? new Date(a.timestamp) : new Date()).getTime());
    return calls.slice(0, limit);
  }

  async getExternalApiCallsBySource(applicationSource: string, limit: number = 50): Promise<ExternalApiCall[]> {
    const calls = Array.from(this.externalApiCalls.values())
      .filter(call => call.applicationSource === applicationSource)
      .sort((a, b) => (b.timestamp ? new Date(b.timestamp) : new Date()).getTime() - (a.timestamp ? new Date(a.timestamp) : new Date()).getTime());
    return calls.slice(0, limit);
  }

  async createExternalApiCall(call: InsertExternalApiCall): Promise<ExternalApiCall> {
    const id = randomUUID();
    const newCall: ExternalApiCall = {
      ...call,
      id,
      timestamp: new Date(),
      requestId: call.requestId || null,
      method: call.method || null,
      clientId: call.clientId || null,
      responseTime: call.responseTime || null,
      statusCode: call.statusCode || null,
      metadata: call.metadata || null
    };
    this.externalApiCalls.set(id, newCall);
    this.persistState();
    return newCall;
  }

  async getExternalApiCallsByRequestId(requestId: string): Promise<ExternalApiCall[]> {
    return Array.from(this.externalApiCalls.values())
      .filter(call => call.requestId === requestId);
  }

  // Cross-Application Usage Stats
  async getCrossAppUsageStats(date?: string): Promise<CrossAppUsageStats[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return Array.from(this.crossAppUsageStats.values())
      .filter(stats => stats.date === targetDate);
  }

  async getCrossAppUsageStatsBySource(applicationSource: string, date?: string): Promise<CrossAppUsageStats | undefined> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const key = `${targetDate}-${applicationSource}`;
    return this.crossAppUsageStats.get(key);
  }

  async createOrUpdateCrossAppUsageStats(stats: InsertCrossAppUsageStats): Promise<CrossAppUsageStats> {
    const targetDate = stats.date || new Date().toISOString().split('T')[0];
    const key = `${targetDate}-${stats.applicationSource}`;
    const existing = this.crossAppUsageStats.get(key);

    if (existing) {
      const updated: CrossAppUsageStats = {
        ...existing,
        ...stats,
        totalCalls: stats.totalCalls ?? existing.totalCalls ?? 0,
        successfulCalls: stats.successfulCalls ?? existing.successfulCalls ?? 0,
        errorCalls: stats.errorCalls ?? existing.errorCalls ?? 0,
        avgResponseTime: stats.avgResponseTime ?? existing.avgResponseTime ?? 0,
        securityViolations: stats.securityViolations ?? existing.securityViolations ?? 0
      };
      this.crossAppUsageStats.set(key, updated);
      this.persistState();
      return updated;
    } else {
      const id = randomUUID();
      const newStats: CrossAppUsageStats = {
        ...stats,
        id,
        date: targetDate,
        totalCalls: stats.totalCalls ?? 0,
        successfulCalls: stats.successfulCalls ?? 0,
        errorCalls: stats.errorCalls ?? 0,
        avgResponseTime: stats.avgResponseTime ?? 0,
        securityViolations: stats.securityViolations ?? 0
      };
      this.crossAppUsageStats.set(key, newStats);
      this.persistState();
      return newStats;
    }
  }

  // Request Correlation Tracking
  async getRequestCorrelations(limit: number = 100): Promise<RequestCorrelation[]> {
    const correlations = Array.from(this.requestCorrelations.values())
      .sort((a, b) => (b.timestamp ? new Date(b.timestamp) : new Date()).getTime() - (a.timestamp ? new Date(a.timestamp) : new Date()).getTime());
    return correlations.slice(0, limit);
  }

  async createRequestCorrelation(correlation: InsertRequestCorrelation): Promise<RequestCorrelation> {
    const id = randomUUID();
    const newCorrelation: RequestCorrelation = {
      ...correlation,
      id,
      timestamp: new Date(),
      correlationId: correlation.correlationId || null,
      processed: correlation.processed ?? false
    };
    this.requestCorrelations.set(id, newCorrelation);
    this.persistState();
    return newCorrelation;
  }

  async getCorrelationsByRequestId(requestId: string): Promise<RequestCorrelation[]> {
    return Array.from(this.requestCorrelations.values())
      .filter(correlation => correlation.requestId === requestId);
  }

  async markCorrelationProcessed(id: string): Promise<boolean> {
    const existing = this.requestCorrelations.get(id);
    if (!existing) return false;
    
    const updated: RequestCorrelation = { ...existing, processed: true };
    this.requestCorrelations.set(id, updated);
    this.persistState();
    return true;
  }
}

export const storage = new MemStorage();