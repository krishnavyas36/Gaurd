import { storage } from './storage';

export async function initializeDefaultData() {
  try {
    console.log("🔧 Initializing database with default data...");

    // Check if we already have API sources
    const existingSources = await storage.getApiSources();
    
    if (existingSources.length === 0) {
      // Create default API sources
      await storage.createApiSource({
        name: "Plaid API",
        url: "https://production.plaid.com",
        status: "active",
        callsToday: 0,
        alertStatus: "normal"
      });

      await storage.createApiSource({
        name: "OpenAI API", 
        url: "https://api.openai.com",
        status: "active",
        callsToday: 0,
        alertStatus: "normal"
      });

      console.log("✅ Default API sources created");
    }

    // Check if we have compliance rules
    const existingRules = await storage.getComplianceRules();
    
    if (existingRules.length === 0) {
      // Create default compliance rules
      await storage.createComplianceRule({
        name: "API Rate Limit",
        description: "Maximum 1000 API calls per day per source",
        ruleType: "rate_limit",
        config: { maxCallsPerHour: 1000 },
        isActive: true
      });

      await storage.createComplianceRule({
        name: "PII Detection",
        description: "Scan for SSN, credit card numbers, and personal identifiers",
        ruleType: "pii_detection", 
        config: { patterns: ["ssn", "credit_card", "email"] },
        isActive: true
      });

      await storage.createComplianceRule({
        name: "GDPR Consent",
        description: "Verify consent documentation for EU user data processing",
        ruleType: "gdpr_consent",
        config: { requiredFields: ["consent", "purpose"] },
        isActive: true
      });

      console.log("✅ Default compliance rules created");
    }

    // Initialize today's stats if they don't exist
    const todaysStats = await storage.getTodaysStats();
    console.log(`📊 Today's stats initialized - Total API calls: ${todaysStats.totalApiCalls}`);

    console.log("🎉 Database initialization complete");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
}