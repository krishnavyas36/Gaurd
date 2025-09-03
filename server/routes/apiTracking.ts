import type { Express } from "express";
import { apiTracker } from "../services/apiTracker";

export function registerApiTrackingRoutes(app: Express) {
  // Test endpoint to simulate API calls for demonstration
  app.post("/api/track/test", async (req, res) => {
    try {
      const { service = "Test API", endpoint = "/test", count = 1 } = req.body;
      
      const results = [];
      
      // Simulate multiple API calls
      for (let i = 0; i < count; i++) {
        const result = await apiTracker.trackApiCall(
          service,
          endpoint,
          Math.random() * 500 + 50, // Random response time
          { test: true, iteration: i + 1 }
        );
        results.push(result);
        
        // Add small delay to simulate real API calls
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      res.json({
        success: true,
        message: `Tracked ${count} API calls for ${service}`,
        results
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to track test API calls",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get current tracking statistics
  app.get("/api/track/stats", async (_req, res) => {
    try {
      const stats = await apiTracker.getCallStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch tracking stats",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Manually trigger a Plaid API call track (for testing)
  app.post("/api/track/plaid", async (req, res) => {
    try {
      const { endpoint = "/transactions/get", count = 1 } = req.body;
      
      const results = [];
      for (let i = 0; i < count; i++) {
        const result = await apiTracker.trackPlaidCall(endpoint, Math.random() * 300 + 100);
        results.push(result);
      }
      
      res.json({
        success: true,
        message: `Simulated ${count} Plaid API calls`,
        results
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to simulate Plaid API calls",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Reset daily counters (for testing)
  app.post("/api/track/reset", async (_req, res) => {
    try {
      await apiTracker.resetDailyCounters();
      res.json({
        success: true,
        message: "Daily counters reset successfully"
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to reset daily counters",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}