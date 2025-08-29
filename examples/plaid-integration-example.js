/**
 * Example: How to add security monitoring to your existing Plaid integration
 * This shows before/after code - your existing functionality stays the same!
 */

const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const PlaidSecurityWrapper = require('../server/integrations/plaid-security-wrapper');

// ==========================================
// BEFORE: Your existing Plaid setup
// ==========================================

// Your original Plaid client setup
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // or development/production
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
      'Plaid-Version': '2020-09-14',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// ==========================================
// AFTER: Add security monitoring (ONE LINE!)
// ==========================================

// Add security monitoring to your existing client
const securityWrapper = new PlaidSecurityWrapper(
  plaidClient, 
  process.env.SECURITY_AGENT_URL || 'http://localhost:5000'
);

// That's it! Now all your existing Plaid code automatically gets security monitoring

// ==========================================
// Your existing code works exactly the same!
// ==========================================

async function getUserAccounts(accessToken) {
  try {
    // This call now automatically:
    // - Monitors API usage
    // - Classifies account data for PII
    // - Reports errors as security incidents
    // - Tracks compliance metrics
    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    
    return response.data.accounts;
  } catch (error) {
    // Errors are automatically reported to security agent
    console.error('Error fetching accounts:', error);
    throw error;
  }
}

async function getUserTransactions(accessToken, startDate, endDate) {
  try {
    // This call now automatically:
    // - Monitors transaction API usage
    // - Scans transaction data for PII (names, merchants, etc.)
    // - Detects unusual spending patterns
    // - Ensures compliance with financial regulations
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      count: 100,
      offset: 0,
    });
    
    return response.data.transactions;
  } catch (error) {
    // Automatically creates security incident
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

async function getUserIdentity(accessToken) {
  try {
    // This call now automatically:
    // - Protects identity data (names, emails, phone numbers)
    // - Ensures GDPR compliance for personal data
    // - Monitors for identity verification patterns
    const response = await plaidClient.identityGet({
      access_token: accessToken,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching identity:', error);
    throw error;
  }
}

// ==========================================
// Example Express.js routes with security
// ==========================================

const express = require('express');
const app = express();

app.get('/api/accounts', async (req, res) => {
  try {
    const { access_token } = req.body;
    
    // Your existing code - now with automatic security monitoring
    const accounts = await getUserAccounts(access_token);
    
    res.json(accounts);
  } catch (error) {
    // Security incident automatically created
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { access_token, start_date, end_date } = req.body;
    
    // Your existing code - now with PII protection and compliance monitoring
    const transactions = await getUserTransactions(access_token, start_date, end_date);
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// What you get automatically:
// ==========================================

/*
✅ API Monitoring
- All Plaid API calls tracked in real-time
- Response times and error rates monitored
- Unusual usage patterns detected

✅ PII Protection
- Account numbers, routing numbers protected
- Customer names and personal data classified
- Merchant information sensitivity analyzed

✅ Compliance Monitoring
- GDPR compliance for personal banking data
- PCI DSS compliance for payment information
- SOX compliance for financial data handling

✅ Fraud Detection
- Unusual transaction patterns flagged
- Suspicious API usage detected
- Error patterns analyzed for security threats

✅ Incident Management
- Plaid API errors become security incidents
- Failed authentication attempts tracked
- System outages and issues documented

✅ Audit Trail
- Complete logs of all banking data access
- Compliance reports for regulatory audits
- Data lineage tracking for investigations
*/

// ==========================================
// Environment Configuration
// ==========================================

/*
Add to your .env file:

# Existing Plaid configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# New security monitoring
SECURITY_AGENT_URL=http://your-security-agent.replit.app

# Optional: Enable specific features
MONITOR_PLAID_TRANSACTIONS=true
CLASSIFY_FINANCIAL_DATA=true
ALERT_ON_PLAID_ERRORS=true
*/

module.exports = {
  getUserAccounts,
  getUserTransactions,
  getUserIdentity
};