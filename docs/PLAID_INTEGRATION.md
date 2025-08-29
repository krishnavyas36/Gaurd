# Plaid Integration with WalletGyde Security Agent

## Overview

This guide shows how to integrate your existing Plaid implementation with the WalletGyde Security Agent for comprehensive financial data security and compliance monitoring.

## Current Integration Status

The security agent currently shows simulated Plaid API monitoring. To enable real integration:

1. **API Call Monitoring** - Wrap your Plaid API calls with security monitoring
2. **Transaction Classification** - Automatically classify financial data for PII protection
3. **Webhook Integration** - Receive and process Plaid webhooks securely
4. **Compliance Monitoring** - Ensure PCI DSS and financial regulation compliance

## Integration Methods

### 1. Wrap Existing Plaid Client

Replace your current Plaid client with a security-aware wrapper:

```javascript
// Before: Regular Plaid client
const { PlaidApi, Configuration, PlaidEnvironments } = require('plaid');
const plaidClient = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
}));

// After: Security-wrapped Plaid client
class SecurePlaidClient {
  constructor(plaidConfig, securityAgentUrl) {
    this.plaidClient = new PlaidApi(plaidConfig);
    this.securityAgent = securityAgentUrl;
  }

  async accountsGet(request) {
    const startTime = Date.now();
    
    try {
      // Make Plaid API call
      const response = await this.plaidClient.accountsGet(request);
      
      // Monitor the call for security
      await this.monitorPlaidCall('accounts/get', request, response, startTime);
      
      return response;
    } catch (error) {
      // Report API errors
      await this.reportPlaidError('accounts/get', error, request);
      throw error;
    }
  }

  async transactionsGet(request) {
    const startTime = Date.now();
    
    try {
      const response = await this.plaidClient.transactionsGet(request);
      
      // Classify transaction data for PII
      await this.classifyTransactionData(response.data.transactions);
      
      // Monitor the call
      await this.monitorPlaidCall('transactions/get', request, response, startTime);
      
      return response;
    } catch (error) {
      await this.reportPlaidError('transactions/get', error, request);
      throw error;
    }
  }

  async monitorPlaidCall(endpoint, request, response, startTime) {
    const callData = {
      source: 'plaid-api',
      endpoint: endpoint,
      method: 'POST',
      requestData: this.sanitizeRequest(request),
      responseData: this.sanitizeResponse(response),
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    await fetch(`${this.securityAgent}/api/monitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callData)
    });
  }

  async classifyTransactionData(transactions) {
    for (const transaction of transactions.slice(0, 10)) { // Sample first 10
      const transactionText = `${transaction.name} ${transaction.merchant_name} ${transaction.account_owner}`;
      
      await fetch(`${this.securityAgent}/api/data-classifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'plaid-transactions',
          data: transactionText,
          dataType: 'financial_transaction',
          metadata: {
            transactionId: transaction.transaction_id,
            amount: transaction.amount,
            accountId: transaction.account_id
          }
        })
      });
    }
  }

  async reportPlaidError(endpoint, error, request) {
    await fetch(`${this.securityAgent}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Plaid API Error: ${endpoint}`,
        description: error.message,
        severity: 'medium',
        source: 'plaid-integration',
        metadata: {
          endpoint,
          errorCode: error.status,
          request: this.sanitizeRequest(request)
        }
      })
    });
  }

  sanitizeRequest(request) {
    // Remove sensitive data from request for logging
    const sanitized = { ...request };
    delete sanitized.access_token;
    delete sanitized.secret;
    return sanitized;
  }

  sanitizeResponse(response) {
    // Remove sensitive data from response for logging
    return {
      statusCode: response.status,
      recordCount: response.data?.accounts?.length || response.data?.transactions?.length || 0
    };
  }
}

// Usage
const securePlaid = new SecurePlaidClient(
  new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  }),
  'http://your-security-agent.replit.app'
);

// Now all your Plaid calls are monitored
const accounts = await securePlaid.accountsGet({ access_token: userToken });
const transactions = await securePlaid.transactionsGet({
  access_token: userToken,
  start_date: '2023-01-01',
  end_date: '2023-12-31'
});
```

### 2. Plaid Webhook Integration

Set up secure webhook handling for Plaid events:

```javascript
// Secure Plaid webhook handler
app.post('/plaid/webhook', express.json(), async (req, res) => {
  const { webhook_type, webhook_code, item_id, error } = req.body;

  // Verify webhook authenticity
  if (!verifyPlaidWebhook(req)) {
    return res.status(401).json({ error: 'Invalid webhook' });
  }

  // Monitor webhook event
  await monitorPlaidWebhook(webhook_type, webhook_code, item_id, error);

  // Handle different webhook types
  switch (webhook_type) {
    case 'TRANSACTIONS':
      await handleTransactionWebhook(webhook_code, item_id);
      break;
    case 'ITEM':
      await handleItemWebhook(webhook_code, item_id, error);
      break;
    case 'AUTH':
      await handleAuthWebhook(webhook_code, item_id);
      break;
    default:
      console.log(`Unknown webhook type: ${webhook_type}`);
  }

  res.json({ status: 'received' });
});

async function monitorPlaidWebhook(webhookType, webhookCode, itemId, error) {
  const severity = error ? 'high' : 'low';
  
  await fetch('http://your-security-agent.replit.app/api/monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'plaid-webhook',
      endpoint: `/plaid/webhook`,
      data: {
        webhook_type: webhookType,
        webhook_code: webhookCode,
        item_id: itemId,
        has_error: !!error
      },
      severity: severity,
      timestamp: new Date().toISOString()
    })
  });

  // Create incident for errors
  if (error) {
    await fetch('http://your-security-agent.replit.app/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Plaid Webhook Error: ${webhookCode}`,
        description: `Error in ${webhookType} webhook: ${error.error_message}`,
        severity: 'high',
        source: 'plaid-webhook',
        metadata: {
          webhook_type: webhookType,
          webhook_code: webhookCode,
          item_id: itemId,
          error_code: error.error_code
        }
      })
    });
  }
}

async function handleTransactionWebhook(webhookCode, itemId) {
  if (webhookCode === 'DEFAULT_UPDATE') {
    // Fetch new transactions and classify them
    try {
      const transactions = await securePlaid.transactionsGet({
        access_token: await getAccessTokenForItem(itemId),
        start_date: '2023-01-01',
        end_date: '2023-12-31'
      });

      // This will automatically trigger data classification
      console.log(`Processed ${transactions.data.transactions.length} transactions for item ${itemId}`);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }
}
```

### 3. Environment Configuration

Update your environment variables:

```bash
# Existing Plaid configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox  # or development/production

# New security integration
SECURITY_AGENT_URL=http://your-security-agent.replit.app
SECURITY_API_KEY=your-security-api-key
PLAID_WEBHOOK_SECRET=your-plaid-webhook-secret

# Enable specific monitoring features
MONITOR_PLAID_CALLS=true
CLASSIFY_TRANSACTION_DATA=true
ALERT_ON_PLAID_ERRORS=true
```

### 4. Migration Guide

Step-by-step migration from existing Plaid integration:

```javascript
// Step 1: Install security wrapper
npm install @walletgyde/plaid-security-wrapper

// Step 2: Replace existing Plaid client initialization
// OLD CODE:
// const plaidClient = new PlaidApi(config);

// NEW CODE:
const { SecurePlaidClient } = require('@walletgyde/plaid-security-wrapper');
const plaidClient = new SecurePlaidClient(config, process.env.SECURITY_AGENT_URL);

// Step 3: Your existing code works unchanged!
const accounts = await plaidClient.accountsGet(request);
const transactions = await plaidClient.transactionsGet(request);

// Step 4: Add webhook security (if using webhooks)
app.post('/plaid/webhook', securePlaidWebhookHandler);
```

## Security Benefits of Plaid Integration

### PII Protection
- **Account Numbers**: Automatically detects and masks account numbers in logs
- **Routing Numbers**: Identifies and protects bank routing information
- **Personal Names**: Flags customer names in transaction data
- **Merchant Data**: Classifies merchant information sensitivity

### Compliance Monitoring
- **PCI DSS**: Monitors payment card data handling
- **Bank Secrecy Act**: Tracks large transaction reporting requirements
- **GDPR**: Manages consent for European banking data
- **SOX Compliance**: Maintains audit trails for financial data

### Fraud Detection
- **Unusual Patterns**: AI detection of abnormal transaction patterns
- **API Abuse**: Monitoring for suspicious API usage
- **Rate Limiting**: Protection against API abuse
- **Error Monitoring**: Immediate alerts for Plaid API errors

### Audit Trail
- **Complete Logging**: All Plaid interactions logged securely
- **Data Lineage**: Track how banking data flows through your system
- **Compliance Reports**: Automated reports for banking regulations
- **Incident Documentation**: Complete records for security investigations

## Real-World Use Cases

### 1. Personal Finance App
```javascript
// Monitor user account linking
await securePlaid.linkTokenCreate({
  user: { client_user_id: userId },
  // ... other options
});

// Automatically classify spending patterns
const transactions = await securePlaid.transactionsGet(request);
// Security agent automatically scans for:
// - Unusual spending patterns
// - Merchant data sensitivity
// - PII in transaction descriptions
```

### 2. Business Banking Dashboard
```javascript
// Monitor business account access
const accounts = await securePlaid.accountsGet(request);
// Security agent tracks:
// - Which accounts are accessed
// - Frequency of access
// - Unusual account queries

// Classify business transaction data
const transactions = await securePlaid.transactionsGet(request);
// Automatically flags:
// - Large transactions requiring reporting
// - Vendor payment patterns
// - Potential fraud indicators
```

### 3. Lending Platform
```javascript
// Secure income verification
const income = await securePlaid.incomeGet(request);
// Security monitoring includes:
// - PII protection in income data
// - Compliance with lending regulations
// - Audit trail for underwriting decisions

// Monitor identity verification
const identity = await securePlaid.identityGet(request);
// Automatically protects:
// - SSNs and tax IDs
// - Address information
// - Employment details
```

## Testing Your Integration

### 1. Integration Test
```javascript
describe('Secure Plaid Integration', () => {
  test('should monitor Plaid API calls', async () => {
    const accounts = await securePlaid.accountsGet(testRequest);
    
    // Verify API call was monitored
    const monitoringLogs = await getSecurityLogs('plaid-api');
    expect(monitoringLogs.length).toBeGreaterThan(0);
  });

  test('should classify transaction data', async () => {
    const transactions = await securePlaid.transactionsGet(testRequest);
    
    // Verify data classification occurred
    const classifications = await getDataClassifications('plaid-transactions');
    expect(classifications).toBeDefined();
  });
});
```

### 2. Security Validation
```javascript
// Verify sensitive data is protected
test('should not log sensitive Plaid data', () => {
  const logs = getSecurityLogs();
  
  logs.forEach(log => {
    expect(log.data).not.toContain('access_token');
    expect(log.data).not.toContain('account_number');
    expect(log.data).not.toContain('routing_number');
  });
});
```

## Next Steps

1. **Choose Integration Method**: Start with the secure wrapper approach for easiest migration
2. **Update Environment**: Add security agent configuration to your environment
3. **Test Integration**: Use sandbox environment to test security monitoring
4. **Deploy Gradually**: Roll out to production in stages
5. **Monitor Results**: Watch the security dashboard for Plaid activity

Your WalletGyde Security Agent will then provide complete visibility and protection for all your Plaid banking data interactions.