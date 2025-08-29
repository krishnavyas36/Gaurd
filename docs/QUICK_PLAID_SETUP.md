# Quick Plaid Security Integration

## 2-Minute Setup Guide

Add security monitoring to your existing Plaid integration without changing any of your current code.

## Step 1: Add the Security Wrapper

Copy the security wrapper file to your project:
- Copy `server/integrations/plaid-security-wrapper.js` to your project
- Or install via npm: `npm install @walletgyde/plaid-security`

## Step 2: Wrap Your Existing Plaid Client

**Before:**
```javascript
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
```

**After (add just 2 lines):**
```javascript
const { PlaidApi, Configuration, PlaidEnvironments } = require('plaid');
const PlaidSecurityWrapper = require('./plaid-security-wrapper'); // ADD THIS

const plaidClient = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
}));

new PlaidSecurityWrapper(plaidClient, 'http://your-security-agent.replit.app'); // ADD THIS
```

## Step 3: Add Environment Variable

Add to your `.env` file:
```bash
SECURITY_AGENT_URL=http://your-security-agent.replit.app
```

## That's It!

Your existing Plaid code now automatically has:
- ✅ Real-time API monitoring
- ✅ PII detection and protection
- ✅ Compliance checking (GDPR, PCI DSS)
- ✅ Fraud detection
- ✅ Error reporting and incident management

## What Happens Automatically

### When you call `plaidClient.accountsGet()`:
1. **Your call works exactly the same**
2. Security agent logs the API call
3. Account data is scanned for PII
4. Compliance rules are checked
5. Results appear in your security dashboard

### When you call `plaidClient.transactionsGet()`:
1. **Your transactions are returned normally**
2. Transaction data is classified for sensitivity
3. Spending patterns are analyzed for anomalies
4. Merchant information is protected
5. Financial compliance is verified

### When errors occur:
1. **Error is thrown to your code as normal**
2. Security incident is automatically created
3. Error patterns are analyzed
4. Alerts are sent if needed
5. Incident appears in your security dashboard

## See It Working

1. Make any Plaid API call in your existing application
2. Check your WalletGyde Security Agent dashboard
3. See real-time monitoring data
4. View compliance scores and classifications

## Zero Risk

- **No breaking changes** - all your existing code works exactly the same
- **No performance impact** - security monitoring runs in background
- **No data exposure** - sensitive data is sanitized before monitoring
- **Easy removal** - just remove the wrapper line to disable

## Advanced Features

Once basic monitoring is working, you can enable additional features:

### Webhook Security (Optional)
```javascript
// Add to your Plaid webhook handler
app.post('/plaid/webhook', async (req, res) => {
  // Your existing webhook code
  await handlePlaidWebhook(req.body);
  
  // Add security monitoring
  await monitorPlaidWebhook(req.body);
  
  res.json({ status: 'received' });
});
```

### Custom Alerts (Optional)
```javascript
// Set up custom alerts for your business rules
const wrapper = new PlaidSecurityWrapper(plaidClient, securityAgentUrl);
wrapper.setCustomAlerts({
  largeTransactionThreshold: 10000,
  unusualPatternDetection: true,
  complianceViolationAlert: true
});
```

## Support

If you need help:
1. Check the example file: `examples/plaid-integration-example.js`
2. Review the full integration guide: `docs/PLAID_INTEGRATION.md`
3. Monitor your security dashboard for real-time feedback

Your existing Plaid integration is now protected with enterprise-grade security monitoring!