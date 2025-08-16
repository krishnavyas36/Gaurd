import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { monitoringService } from "./services/monitoring";
import { complianceService } from "./services/compliance";
import { llmScannerService } from "./services/llmScanner";
import { insertAlertSchema, insertComplianceRuleSchema, insertIncidentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });

    // Send initial data
    sendDashboardUpdate(ws);
  });

  // Broadcast function for real-time updates
  function broadcastToAllClients(data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  async function sendDashboardUpdate(ws: WebSocket) {
    try {
      const [
        apiSources,
        alerts,
        complianceRules,
        dataClassifications,
        llmViolations,
        incidents,
        todaysStats
      ] = await Promise.all([
        storage.getApiSources(),
        storage.getAlerts(10),
        storage.getComplianceRules(),
        storage.getDataClassifications(20),
        storage.getLlmViolations(10),
        storage.getIncidents(10),
        storage.getTodaysStats()
      ]);

      const complianceScore = await complianceService.calculateComplianceScore();

      const dashboardData = {
        type: 'dashboard_update',
        data: {
          apiSources,
          alerts,
          complianceRules,
          dataClassifications,
          llmViolations,
          incidents,
          stats: todaysStats,
          complianceScore
        }
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(dashboardData));
      }
    } catch (error) {
      console.error('Error sending dashboard update:', error);
    }
  }

  // Dashboard data endpoint
  app.get("/api/dashboard", async (_req, res) => {
    try {
      const [
        apiSources,
        alerts,
        complianceRules,
        dataClassifications,
        llmViolations,
        incidents,
        todaysStats
      ] = await Promise.all([
        storage.getApiSources(),
        storage.getAlerts(10),
        storage.getComplianceRules(),
        storage.getDataClassifications(20),
        storage.getLlmViolations(10),
        storage.getIncidents(10),
        storage.getTodaysStats()
      ]);

      const complianceScore = await complianceService.calculateComplianceScore();

      res.json({
        apiSources,
        alerts,
        complianceRules,
        dataClassifications,
        llmViolations,
        incidents,
        stats: todaysStats,
        complianceScore
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // API Sources endpoints
  app.get("/api/sources", async (_req, res) => {
    try {
      const sources = await storage.getApiSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch API sources" });
    }
  });

  app.post("/api/sources/:id/test", async (req, res) => {
    try {
      const { id } = req.params;
      const source = await storage.getApiSource(id);
      
      if (!source) {
        return res.status(404).json({ error: "API source not found" });
      }

      // Simulate API call monitoring
      await monitoringService.processApiCall(source.name, "/test", { test: true });
      
      // Broadcast update
      broadcastToAllClients({ type: 'source_updated', sourceId: id });
      
      res.json({ success: true, message: "API call processed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to test API source" });
    }
  });

  // Alerts endpoints
  app.get("/api/alerts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const alerts = await storage.getAlerts(limit);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const validatedData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(validatedData);
      
      // Broadcast new alert
      broadcastToAllClients({ type: 'new_alert', alert });
      
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ error: "Invalid alert data" });
    }
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedAlert = await storage.updateAlert(id, updates);
      
      if (!updatedAlert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      // Broadcast alert update
      broadcastToAllClients({ type: 'alert_updated', alert: updatedAlert });
      
      res.json(updatedAlert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Compliance Rules endpoints
  app.get("/api/compliance/rules", async (_req, res) => {
    try {
      const rules = await storage.getComplianceRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance rules" });
    }
  });

  app.post("/api/compliance/rules", async (req, res) => {
    try {
      const validatedData = insertComplianceRuleSchema.parse(req.body);
      const rule = await storage.createComplianceRule(validatedData);
      
      // Broadcast new rule
      broadcastToAllClients({ type: 'new_compliance_rule', rule });
      
      res.status(201).json(rule);
    } catch (error) {
      res.status(400).json({ error: "Invalid compliance rule data" });
    }
  });

  app.patch("/api/compliance/rules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedRule = await storage.updateComplianceRule(id, updates);
      
      if (!updatedRule) {
        return res.status(404).json({ error: "Compliance rule not found" });
      }

      // Broadcast rule update
      broadcastToAllClients({ type: 'compliance_rule_updated', rule: updatedRule });
      
      res.json(updatedRule);
    } catch (error) {
      res.status(500).json({ error: "Failed to update compliance rule" });
    }
  });

  app.delete("/api/compliance/rules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteComplianceRule(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Compliance rule not found" });
      }

      // Broadcast rule deletion
      broadcastToAllClients({ type: 'compliance_rule_deleted', ruleId: id });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete compliance rule" });
    }
  });

  // Data Classification endpoints
  app.get("/api/data-classifications", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const riskLevel = req.query.risk as string;
      
      let classifications;
      if (riskLevel) {
        classifications = await storage.getDataClassificationsByRisk(riskLevel);
      } else {
        classifications = await storage.getDataClassifications(limit);
      }
      
      res.json(classifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data classifications" });
    }
  });

  // LLM Scanning endpoints
  app.post("/api/llm/scan", async (req, res) => {
    try {
      const { content, metadata } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const scanResult = await llmScannerService.scanResponse({ content, metadata });
      
      res.json(scanResult);
    } catch (error) {
      res.status(500).json({ error: "Failed to scan LLM response" });
    }
  });

  app.get("/api/llm/violations", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const violations = await storage.getLlmViolations(limit);
      res.json(violations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch LLM violations" });
    }
  });

  app.get("/api/llm/stats", async (_req, res) => {
    try {
      const stats = await llmScannerService.getViolationStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch LLM stats" });
    }
  });

  // Incidents endpoints
  app.get("/api/incidents", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const incidents = await storage.getIncidents(limit);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  app.post("/api/incidents", async (req, res) => {
    try {
      const validatedData = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(validatedData);
      
      // Broadcast new incident
      broadcastToAllClients({ type: 'new_incident', incident });
      
      res.status(201).json(incident);
    } catch (error) {
      res.status(400).json({ error: "Invalid incident data" });
    }
  });

  app.patch("/api/incidents/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (updates.status === "resolved") {
        updates.resolvedAt = new Date();
      }
      
      const updatedIncident = await storage.updateIncident(id, updates);
      
      if (!updatedIncident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      // Broadcast incident update
      broadcastToAllClients({ type: 'incident_updated', incident: updatedIncident });
      
      res.json(updatedIncident);
    } catch (error) {
      res.status(500).json({ error: "Failed to update incident" });
    }
  });

  // Monitoring and Analytics
  app.get("/api/monitoring/stats", async (req, res) => {
    try {
      const date = req.query.date as string;
      const stats = await storage.getMonitoringStats(date);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monitoring stats" });
    }
  });

  app.post("/api/monitoring/detect-anomalies", async (_req, res) => {
    try {
      await monitoringService.detectAnomalies();
      res.json({ success: true, message: "Anomaly detection completed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to detect anomalies" });
    }
  });

  app.get("/api/compliance/score", async (_req, res) => {
    try {
      const score = await complianceService.calculateComplianceScore();
      res.json({ score });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate compliance score" });
    }
  });

  // Periodic tasks
  setInterval(async () => {
    try {
      // Detect anomalies every 5 minutes
      await monitoringService.detectAnomalies();
      
      // Broadcast dashboard updates
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          sendDashboardUpdate(client);
        }
      });
    } catch (error) {
      console.error('Error in periodic tasks:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  return httpServer;
}
