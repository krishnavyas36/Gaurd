import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiSources = pgTable("api_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  status: text("status").notNull().default("active"),
  callsToday: integer("calls_today").default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
  alertStatus: text("alert_status").default("normal"),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // critical, warning, info
  source: text("source").notNull(),
  status: text("status").default("active"), // active, acknowledged, resolved
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
});

export const complianceRules = pgTable("compliance_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ruleType: text("rule_type").notNull(), // rate_limit, pii_detection, gdpr_consent
  config: jsonb("config").notNull(),
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dataClassifications = pgTable("data_classifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dataType: text("data_type").notNull(), // ssn, credit_card, email, phone, etc.
  riskLevel: text("risk_level").notNull(), // high, medium, low
  source: text("source").notNull(),
  content: text("content"), // redacted content snippet
  timestamp: timestamp("timestamp").defaultNow(),
  isResolved: boolean("is_resolved").default(false),
});

export const llmViolations = pgTable("llm_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  violationType: text("violation_type").notNull(), // financial_advice, unverified_data
  content: text("content").notNull(),
  action: text("action").notNull(), // blocked, rewritten, flagged
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
});

export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  severity: text("severity").notNull(), // critical, warning, info
  description: text("description").notNull(),
  status: text("status").default("open"), // open, investigating, resolved
  source: text("source").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata"),
});

export const monitoringStats = pgTable("monitoring_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // YYYY-MM-DD
  totalApiCalls: integer("total_api_calls").default(0),
  alertsGenerated: integer("alerts_generated").default(0),
  complianceScore: integer("compliance_score").default(100),
  sensitiveDataDetected: integer("sensitive_data_detected").default(0),
  llmResponsesScanned: integer("llm_responses_scanned").default(0),
  llmResponsesFlagged: integer("llm_responses_flagged").default(0),
  llmResponsesBlocked: integer("llm_responses_blocked").default(0),
});

// Cross-application API tracking table
export const externalApiCalls = pgTable("external_api_calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: text("request_id"), // Plaid request_id for correlation
  applicationSource: text("application_source").notNull(), // Which app made the call
  endpoint: text("endpoint").notNull(),
  method: text("method").default("POST"),
  clientId: text("client_id"), // Plaid client_id if available
  responseTime: integer("response_time"), // ms
  statusCode: integer("status_code"),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
  tracked_via: text("tracked_via").notNull(), // webhook, proxy, correlation
});

// Cross-application usage analytics
export const crossAppUsageStats = pgTable("cross_app_usage_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // YYYY-MM-DD
  applicationSource: text("application_source").notNull(),
  totalCalls: integer("total_calls").default(0),
  successfulCalls: integer("successful_calls").default(0),
  errorCalls: integer("error_calls").default(0),
  avgResponseTime: integer("avg_response_time").default(0),
  securityViolations: integer("security_violations").default(0),
});

// Request correlation tracking
export const requestCorrelations = pgTable("request_correlations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: text("request_id").notNull(),
  correlationId: text("correlation_id"), // For grouping related requests
  applicationSource: text("application_source").notNull(),
  endpoint: text("endpoint").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  processed: boolean("processed").default(false),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertApiSourceSchema = createInsertSchema(apiSources).omit({
  id: true,
  lastActivity: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
});

export const insertComplianceRuleSchema = createInsertSchema(complianceRules).omit({
  id: true,
  lastTriggered: true,
  createdAt: true,
});

export const insertDataClassificationSchema = createInsertSchema(dataClassifications).omit({
  id: true,
  timestamp: true,
});

export const insertLlmViolationSchema = createInsertSchema(llmViolations).omit({
  id: true,
  timestamp: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  timestamp: true,
  resolvedAt: true,
});

export const insertMonitoringStatsSchema = createInsertSchema(monitoringStats).omit({
  id: true,
});

export const insertExternalApiCallSchema = createInsertSchema(externalApiCalls).omit({
  id: true,
  timestamp: true,
});

export const insertCrossAppUsageStatsSchema = createInsertSchema(crossAppUsageStats).omit({
  id: true,
});

export const insertRequestCorrelationSchema = createInsertSchema(requestCorrelations).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ApiSource = typeof apiSources.$inferSelect;
export type InsertApiSource = z.infer<typeof insertApiSourceSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type ComplianceRule = typeof complianceRules.$inferSelect;
export type InsertComplianceRule = z.infer<typeof insertComplianceRuleSchema>;

export type DataClassification = typeof dataClassifications.$inferSelect;
export type InsertDataClassification = z.infer<typeof insertDataClassificationSchema>;

export type LlmViolation = typeof llmViolations.$inferSelect;
export type InsertLlmViolation = z.infer<typeof insertLlmViolationSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export type MonitoringStats = typeof monitoringStats.$inferSelect;
export type InsertMonitoringStats = z.infer<typeof insertMonitoringStatsSchema>;

export type ExternalApiCall = typeof externalApiCalls.$inferSelect;
export type InsertExternalApiCall = z.infer<typeof insertExternalApiCallSchema>;

export type CrossAppUsageStats = typeof crossAppUsageStats.$inferSelect;
export type InsertCrossAppUsageStats = z.infer<typeof insertCrossAppUsageStatsSchema>;

export type RequestCorrelation = typeof requestCorrelations.$inferSelect;
export type InsertRequestCorrelation = z.infer<typeof insertRequestCorrelationSchema>;
