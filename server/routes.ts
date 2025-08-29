import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { monitoringService } from "./services/monitoring";
import { complianceService } from "./services/compliance";
import { llmScannerService } from "./services/llmScanner";
import { plaidService } from "./services/plaidService";
import { insertAlertSchema, insertComplianceRuleSchema, insertIncidentSchema } from "@shared/schema";
import { nanoid } from "nanoid";

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

  // Enhanced monitoring endpoint for external integrations (including Plaid)
  app.post('/api/monitor', async (req, res) => {
    try {
      const { source, endpoint, data, responseTime, metadata } = req.body;
      
      console.log(`Monitoring data received from ${source}: ${endpoint}`);
      
      // Process monitoring data
      const monitoringResult = await processMonitoringData({
        source,
        endpoint,
        data,
        responseTime,
        metadata,
        timestamp: new Date()
      });
      
      // Check for compliance violations or security issues
      const complianceCheck = await checkMonitoringCompliance(source, data);
      
      // Generate alerts if needed
      if (complianceCheck.violations.length > 0) {
        await generateComplianceAlert(source, endpoint, complianceCheck.violations);
      }
      
      res.json({ 
        success: true, 
        message: 'Monitoring data processed',
        result: monitoringResult,
        compliance: complianceCheck,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing monitoring data:', error);
      res.status(500).json({ error: 'Failed to process monitoring data' });
    }
  });

  // Helper function for processing monitoring data
  async function processMonitoringData(monitoringData: any) {
    const riskScore = calculateRiskScore(monitoringData);
    const patterns = detectPatterns(monitoringData);
    
    // Store monitoring statistics
    const stats = {
      date: new Date().toISOString().split('T')[0],
      totalApiCalls: 1,
      avgResponseTime: monitoringData.responseTime || 0,
      source: monitoringData.source
    };
    
    return {
      processed: true,
      riskScore,
      patterns,
      stats
    };
  }

  async function checkMonitoringCompliance(source: string, data: any) {
    const violations = [];
    
    if (data && typeof data === 'object') {
      const dataString = JSON.stringify(data).toLowerCase();
      
      // PII detection patterns
      if (dataString.match(/\b\d{3}-\d{2}-\d{4}\b/) || dataString.includes('ssn')) {
        violations.push({ type: 'ssn_detected', severity: 'high', description: 'Social Security Number detected' });
      }
      
      if (dataString.match(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/) || dataString.includes('card')) {
        violations.push({ type: 'credit_card_detected', severity: 'high', description: 'Credit card information detected' });
      }
      
      if (dataString.match(/\b[a-za-z0-9._%+-]+@[a-za-z0-9.-]+\.[a-z]{2,}\b/)) {
        violations.push({ type: 'email_detected', severity: 'medium', description: 'Email address detected' });
      }
      
      if (dataString.includes('account') && dataString.includes('number')) {
        violations.push({ type: 'account_number_detected', severity: 'high', description: 'Account number detected' });
      }
    }
    
    // Create data classifications for violations
    for (const violation of violations) {
      const classification = {
        id: nanoid(),
        dataType: violation.type,
        content: `${violation.description} from ${source}`,
        riskLevel: violation.severity,
        source: source,
        timestamp: new Date(),
        isResolved: false
      };
      
      await storage.createDataClassification(classification);
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      score: violations.length === 0 ? 100 : Math.max(0, 100 - (violations.length * 20))
    };
  }

  async function generateComplianceAlert(source: string, endpoint: string, violations: any[]) {
    const alert = {
      title: `Compliance Violation: ${source}`,
      description: `Detected ${violations.length} compliance violation(s) in ${endpoint}`,
      severity: violations.some((v: any) => v.severity === 'high') ? 'high' : 'medium',
      source: 'compliance-monitor',
      status: 'active',
      metadata: {
        violations,
        endpoint,
        originalSource: source
      }
    };
    
    await storage.createAlert(alert);
    
    // Broadcast via WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'new_alert',
          data: alert
        }));
      }
    });
    
    console.log(`Generated compliance alert for ${source}: ${violations.length} violations`);
  }

  function calculateRiskScore(monitoringData: any) {
    let score = 0;
    
    if (monitoringData.responseTime > 5000) score += 20;
    if (monitoringData.source === 'plaid-api') score += 10;
    if (monitoringData.metadata?.recordCount > 100) score += 15;
    
    return Math.min(100, score);
  }

  function detectPatterns(monitoringData: any) {
    return {
      highVolume: monitoringData.metadata?.recordCount > 50,
      slowResponse: monitoringData.responseTime > 3000,
      financialData: monitoringData.source?.includes('plaid')
    };
  }

  // ============================================
  // PLAID INTEGRATION ENDPOINTS
  // ============================================

  // Create Plaid Link token for user onboarding
  app.post("/api/plaid/link-token", async (req, res) => {
    try {
      const { userId, userEmail } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      console.log(`🔗 Creating Plaid Link token for user: ${userId}`);
      
      const response = await plaidService.createLinkToken(userId, userEmail);
      
      res.json({
        link_token: response.data.link_token,
        expiration: response.data.expiration,
        request_id: response.data.request_id
      });
    } catch (error: any) {
      console.error('Error creating link token:', error.message);
      res.status(500).json({ 
        error: "Failed to create link token",
        details: error.response?.data || error.message
      });
    }
  });

  // Exchange public token for access token
  app.post("/api/plaid/exchange-token", async (req, res) => {
    try {
      const { public_token } = req.body;
      
      if (!public_token) {
        return res.status(400).json({ error: "public_token is required" });
      }

      console.log(`🔄 Exchanging Plaid public token...`);
      
      const response = await plaidService.exchangePublicToken(public_token);
      
      res.json({
        access_token: response.data.access_token,
        item_id: response.data.item_id,
        request_id: response.data.request_id
      });
    } catch (error: any) {
      console.error('Error exchanging token:', error.message);
      res.status(500).json({ 
        error: "Failed to exchange token",
        details: error.response?.data || error.message
      });
    }
  });

  // Get user accounts with security monitoring
  app.post("/api/plaid/accounts", async (req, res) => {
    try {
      const { access_token } = req.body;
      
      if (!access_token) {
        return res.status(400).json({ error: "access_token is required" });
      }

      console.log(`🏦 Fetching Plaid accounts with security monitoring...`);
      
      const response = await plaidService.getAccounts(access_token);
      
      res.json({
        accounts: response.data.accounts,
        item: response.data.item,
        request_id: response.data.request_id,
        total_accounts: response.data.accounts.length
      });
    } catch (error: any) {
      console.error('Error fetching accounts:', error.message);
      res.status(500).json({ 
        error: "Failed to fetch accounts",
        details: error.response?.data || error.message
      });
    }
  });

  // Get user transactions with security monitoring  
  app.post("/api/plaid/transactions", async (req, res) => {
    try {
      const { access_token, start_date, end_date, count = 100, offset = 0 } = req.body;
      
      if (!access_token || !start_date || !end_date) {
        return res.status(400).json({ 
          error: "access_token, start_date, and end_date are required" 
        });
      }

      console.log(`💳 Fetching Plaid transactions from ${start_date} to ${end_date} with security monitoring...`);
      
      const response = await plaidService.getTransactions(access_token, start_date, end_date);
      
      res.json({
        transactions: response.data.transactions.slice(offset, offset + count),
        accounts: response.data.accounts,
        total_transactions: response.data.total_transactions,
        request_id: response.data.request_id
      });
    } catch (error: any) {
      console.error('Error fetching transactions:', error.message);
      res.status(500).json({ 
        error: "Failed to fetch transactions",
        details: error.response?.data || error.message
      });
    }
  });

  // Get user identity with security monitoring
  app.post("/api/plaid/identity", async (req, res) => {
    try {
      const { access_token } = req.body;
      
      if (!access_token) {
        return res.status(400).json({ error: "access_token is required" });
      }

      console.log(`🆔 Fetching Plaid identity data with security monitoring...`);
      
      const response = await plaidService.getIdentity(access_token);
      
      res.json({
        accounts: response.data.accounts,
        item: response.data.item,
        request_id: response.data.request_id
      });
    } catch (error: any) {
      console.error('Error fetching identity:', error.message);
      res.status(500).json({ 
        error: "Failed to fetch identity",
        details: error.response?.data || error.message
      });
    }
  });

  // Get user income with security monitoring
  app.post("/api/plaid/income", async (req, res) => {
    try {
      const { access_token } = req.body;
      
      if (!access_token) {
        return res.status(400).json({ error: "access_token is required" });
      }

      console.log(`💰 Fetching Plaid income data with security monitoring...`);
      
      const response = await plaidService.getIncome(access_token);
      
      res.json({
        income: response.data.income,
        item: response.data.item,
        request_id: response.data.request_id
      });
    } catch (error: any) {
      console.error('Error fetching income:', error.message);
      res.status(500).json({ 
        error: "Failed to fetch income",
        details: error.response?.data || error.message
      });
    }
  });

  // Get auth data with security monitoring
  app.post("/api/plaid/auth", async (req, res) => {
    try {
      const { access_token } = req.body;
      
      if (!access_token) {
        return res.status(400).json({ error: "access_token is required" });
      }

      console.log(`🔐 Fetching Plaid auth data with security monitoring...`);
      
      const response = await plaidService.getAuth(access_token);
      
      res.json({
        accounts: response.data.accounts,
        numbers: response.data.numbers,
        item: response.data.item,
        request_id: response.data.request_id
      });
    } catch (error: any) {
      console.error('Error fetching auth data:', error.message);
      res.status(500).json({ 
        error: "Failed to fetch auth data",
        details: error.response?.data || error.message
      });
    }
  });

  // Enhanced Compliance endpoints for filtering
  app.get("/api/compliance/stats", async (_req, res) => {
    try {
      const [
        totalFiltered,
        highRiskItems,
        complianceScore
      ] = await Promise.all([
        storage.getDataClassifications(1000).then(items => items.length),
        storage.getDataClassifications(1000).then(items => 
          items.filter(item => item.riskLevel === 'high' && !item.isResolved).length
        ),
        complianceService.calculateComplianceScore()
      ]);

      res.json({
        totalFiltered,
        highRiskItems,
        complianceScore,
        activeRules: await storage.getActiveComplianceRules().then(rules => rules.length),
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance stats" });
    }
  });

  app.get("/api/compliance/filtered-items", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const riskLevel = req.query.risk as string;
      
      // Get recent data classifications as filtered items
      let items = await storage.getDataClassifications(limit);
      
      if (riskLevel) {
        items = items.filter(item => item.riskLevel === riskLevel);
      }

      // Transform to filtered items format
      const filteredItems = items.map(item => ({
        id: item.id,
        type: item.dataType || 'unknown',
        content: `${item.dataType} detected in API response`,
        riskLevel: item.riskLevel,
        timestamp: item.timestamp,
        action: item.riskLevel === 'high' ? 'blocked' : 
                item.riskLevel === 'medium' ? 'flagged' : 'monitored',
        source: item.source || 'API Monitor'
      }));

      res.json(filteredItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch filtered items" });
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
