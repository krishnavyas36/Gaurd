import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

// Types
export type User = typeof users.$inferSelect;
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
