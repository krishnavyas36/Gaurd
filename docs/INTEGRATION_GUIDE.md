# Integration Guide: Connecting WalletGyde Security Agent

## Overview

The WalletGyde Security Agent is designed to integrate seamlessly with existing applications, AI models, and financial systems. This guide shows you how to connect it to your current infrastructure.

## Integration Patterns

### 1. API Integration (Recommended)

#### Direct API Calls
Integrate through RESTful API endpoints for real-time security monitoring:

```javascript
// Example: Monitor API calls in your existing application
async function makeSecureAPICall(endpoint, data) {
  try {
    // Make your normal API call
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Send to WalletGyde for security monitoring
    await fetch('http://your-security-agent.replit.app/api/monitor', {
      method: 'POST',
      body: JSON.stringify({
        source: 'payment-api',
        endpoint: endpoint,
        data: data,
        response: await response.clone().json()
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    return response;
  } catch (error) {
    // Log security incident
    await fetch('http://your-security-agent.replit.app/api/incidents', {
      method: 'POST',
      body: JSON.stringify({
        title: 'API Call Failed',
        description: error.message,
        severity: 'high',
        source: endpoint
      })
    });
    throw error;
  }
}
```

#### Middleware Integration
For Express.js applications, use middleware to automatically monitor all requests:

```javascript
// Security monitoring middleware
const securityMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture request data
  const requestData = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    ip: req.ip,
    timestamp: new Date().toISOString()
  };
  
  // Monitor response
  const originalSend = res.send;
  res.send = function(data) {
    const responseData = {
      statusCode: res.statusCode,
      responseTime: Date.now() - startTime,
      data: data
    };
    
    // Send to WalletGyde Security Agent
    fetch('http://your-security-agent.replit.app/api/monitor', {
      method: 'POST',
      body: JSON.stringify({
        source: 'main-app',
        request: requestData,
        response: responseData
      }),
      headers: { 'Content-Type': 'application/json' }
    }).catch(console.error);
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Use in your Express app
app.use(securityMiddleware);
```

### 2. LLM Model Integration

#### OpenAI Integration
Monitor your ChatGPT/OpenAI API usage for compliance:

```javascript
// Wrapper for OpenAI calls with security monitoring
class SecureOpenAI {
  constructor(apiKey, securityAgentUrl) {
    this.openai = new OpenAI({ apiKey });
    this.securityAgent = securityAgentUrl;
  }
  
  async createChatCompletion(messages, options = {}) {
    try {
      // Make OpenAI API call
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        ...options
      });
      
      // Send to WalletGyde for LLM scanning
      await this.scanLLMResponse(messages, response);
      
      return response;
    } catch (error) {
      await this.reportLLMError(error, messages);
      throw error;
    }
  }
  
  async scanLLMResponse(messages, response) {
    const content = response.choices[0]?.message?.content;
    if (!content) return;
    
    // Send to security agent for scanning
    await fetch(`${this.securityAgent}/api/llm/scan`, {
      method: 'POST',
      body: JSON.stringify({
        prompt: messages,
        response: content,
        model: response.model,
        timestamp: new Date().toISOString()
      }),
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  async reportLLMError(error, messages) {
    await fetch(`${this.securityAgent}/api/incidents`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'LLM API Error',
        description: error.message,
        severity: 'medium',
        source: 'openai-integration',
        metadata: { prompt: messages }
      })
    });
  }
}

// Usage
const secureAI = new SecureOpenAI(
  process.env.OPENAI_API_KEY,
  'http://your-security-agent.replit.app'
);

const response = await secureAI.createChatCompletion([
  { role: 'user', content: 'Explain investment strategies' }
]);
```

#### Custom Model Integration
For self-hosted or custom AI models:

```python
# Python example for custom model integration
import requests
import json
from datetime import datetime

class SecureModelWrapper:
    def __init__(self, model, security_agent_url):
        self.model = model
        self.security_agent = security_agent_url
    
    def generate_response(self, prompt):
        try:
            # Generate response with your model
            response = self.model.generate(prompt)
            
            # Send to WalletGyde for scanning
            self.scan_response(prompt, response)
            
            return response
        except Exception as e:
            self.report_error(e, prompt)
            raise
    
    def scan_response(self, prompt, response):
        payload = {
            'prompt': prompt,
            'response': response,
            'model': self.model.__class__.__name__,
            'timestamp': datetime.now().isoformat()
        }
        
        requests.post(
            f"{self.security_agent}/api/llm/scan",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
    
    def report_error(self, error, prompt):
        payload = {
            'title': 'Model Generation Error',
            'description': str(error),
            'severity': 'medium',
            'source': 'custom-model',
            'metadata': {'prompt': prompt}
        }
        
        requests.post(
            f"{self.security_agent}/api/incidents",
            json=payload
        )

# Usage
secure_model = SecureModelWrapper(your_model, 'http://your-security-agent.replit.app')
response = secure_model.generate_response("What are the best investment options?")
```

### 3. Database Integration

#### Real-time Data Monitoring
Monitor database operations for sensitive data:

```javascript
// Database wrapper with security monitoring
class SecureDatabase {
  constructor(db, securityAgentUrl) {
    this.db = db;
    this.securityAgent = securityAgentUrl;
  }
  
  async query(sql, params = []) {
    const startTime = Date.now();
    
    try {
      const result = await this.db.query(sql, params);
      
      // Check for sensitive data in results
      await this.scanQueryResults(sql, result, Date.now() - startTime);
      
      return result;
    } catch (error) {
      await this.reportDatabaseError(error, sql);
      throw error;
    }
  }
  
  async scanQueryResults(sql, result, duration) {
    // Send query info to security agent
    await fetch(`${this.securityAgent}/api/data-classifications`, {
      method: 'POST',
      body: JSON.stringify({
        source: 'database-query',
        query: sql,
        resultCount: result.rows?.length || 0,
        executionTime: duration,
        data: this.sanitizeForScan(result.rows),
        timestamp: new Date().toISOString()
      }),
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  sanitizeForScan(rows) {
    if (!rows || rows.length === 0) return [];
    
    // Send sample data for classification (first few rows)
    return rows.slice(0, 5).map(row => {
      // Convert to string for pattern detection
      return Object.values(row).join(' ');
    });
  }
  
  async reportDatabaseError(error, sql) {
    await fetch(`${this.securityAgent}/api/incidents`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Database Query Error',
        description: error.message,
        severity: 'high',
        source: 'database',
        metadata: { query: sql }
      })
    });
  }
}
```

### 4. Webhook Integration

#### Receiving Security Alerts
Set up webhooks to receive real-time security alerts in your application:

```javascript
// Express endpoint to receive security alerts
app.post('/security-webhook', express.json(), (req, res) => {
  const { type, data, timestamp } = req.body;
  
  switch (type) {
    case 'security_alert':
      handleSecurityAlert(data);
      break;
    case 'compliance_violation':
      handleComplianceViolation(data);
      break;
    case 'llm_violation':
      handleLLMViolation(data);
      break;
    case 'incident_created':
      handleIncident(data);
      break;
    default:
      console.log('Unknown webhook type:', type);
  }
  
  res.status(200).json({ received: true });
});

async function handleSecurityAlert(alert) {
  // Immediate response for critical alerts
  if (alert.severity === 'critical') {
    // Disable user account, block IP, etc.
    await emergencyResponse(alert);
  }
  
  // Log to your monitoring system
  logger.error('Security Alert', alert);
  
  // Notify relevant teams
  await notifySecurityTeam(alert);
}

async function handleLLMViolation(violation) {
  // Block AI responses if needed
  if (violation.violationType === 'financial_advice') {
    await disableAIForUser(violation.source);
  }
  
  // Log compliance violation
  await logComplianceEvent(violation);
}
```

#### Sending Custom Events
Send custom security events to WalletGyde:

```javascript
// Custom event sender
class SecurityEventSender {
  constructor(securityAgentUrl, apiKey) {
    this.baseUrl = securityAgentUrl;
    this.apiKey = apiKey;
  }
  
  async sendCustomEvent(eventType, data) {
    try {
      await fetch(`${this.baseUrl}/api/custom-events`, {
        method: 'POST',
        body: JSON.stringify({
          type: eventType,
          data: data,
          timestamp: new Date().toISOString(),
          source: 'main-application'
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
    } catch (error) {
      console.error('Failed to send security event:', error);
    }
  }
  
  // Predefined event types
  async reportSuspiciousLogin(userId, ipAddress, userAgent) {
    await this.sendCustomEvent('suspicious_login', {
      userId,
      ipAddress,
      userAgent,
      severity: 'medium'
    });
  }
  
  async reportDataExport(userId, dataType, recordCount) {
    await this.sendCustomEvent('data_export', {
      userId,
      dataType,
      recordCount,
      severity: 'high'
    });
  }
  
  async reportPaymentAnomaly(transactionId, amount, reason) {
    await this.sendCustomEvent('payment_anomaly', {
      transactionId,
      amount,
      reason,
      severity: 'critical'
    });
  }
}
```

## Integration Examples by Application Type

### E-commerce Platform

```javascript
// E-commerce integration example
class SecureEcommerce {
  constructor() {
    this.security = new SecurityEventSender(
      'http://your-security-agent.replit.app',
      process.env.SECURITY_API_KEY
    );
  }
  
  async processPayment(paymentData) {
    // Monitor payment processing
    await this.security.sendCustomEvent('payment_attempt', {
      amount: paymentData.amount,
      currency: paymentData.currency,
      userId: paymentData.userId,
      severity: 'medium'
    });
    
    try {
      const result = await this.paymentProcessor.charge(paymentData);
      
      // Check for unusual patterns
      if (paymentData.amount > 10000) {
        await this.security.reportPaymentAnomaly(
          result.transactionId,
          paymentData.amount,
          'Large transaction amount'
        );
      }
      
      return result;
    } catch (error) {
      await this.security.sendCustomEvent('payment_failed', {
        error: error.message,
        paymentData: this.sanitizePaymentData(paymentData),
        severity: 'high'
      });
      throw error;
    }
  }
  
  async handleUserRegistration(userData) {
    // Scan user data for PII
    await fetch('http://your-security-agent.replit.app/api/data-classifications', {
      method: 'POST',
      body: JSON.stringify({
        source: 'user-registration',
        data: userData,
        dataType: 'user_profile'
      })
    });
    
    // Proceed with registration
    return await this.createUser(userData);
  }
}
```

### Financial Services Platform

```javascript
// Financial services integration
class SecureFinancialApp {
  constructor() {
    this.compliance = new ComplianceChecker('http://your-security-agent.replit.app');
  }
  
  async provideLoanAdvice(customerId, loanDetails) {
    // Ensure compliance before providing advice
    const complianceCheck = await this.compliance.checkAdviceCompliance(
      'loan_advice',
      loanDetails
    );
    
    if (!complianceCheck.isCompliant) {
      throw new Error('Advice not compliant with regulations');
    }
    
    // Generate advice
    const advice = await this.loanAdvisor.generateAdvice(loanDetails);
    
    // Scan advice for compliance
    await this.compliance.scanAdviceContent(advice);
    
    return advice;
  }
  
  async processKYC(customerData) {
    // Enhanced PII protection for KYC
    await this.security.sendCustomEvent('kyc_processing', {
      customerId: customerData.id,
      documentTypes: customerData.documents.map(d => d.type),
      severity: 'high'
    });
    
    // Process KYC with monitoring
    return await this.kycProcessor.verify(customerData);
  }
}
```

### Customer Support with AI

```javascript
// AI customer support integration
class SecureCustomerSupport {
  constructor() {
    this.ai = new SecureOpenAI(
      process.env.OPENAI_API_KEY,
      'http://your-security-agent.replit.app'
    );
  }
  
  async handleCustomerQuery(customerId, query) {
    // Check if query contains sensitive information
    await this.scanCustomerInput(query, customerId);
    
    // Generate AI response
    const response = await this.ai.createChatCompletion([
      {
        role: 'system',
        content: 'You are a customer support agent. Do not provide financial advice.'
      },
      {
        role: 'user',
        content: query
      }
    ]);
    
    return response.choices[0].message.content;
  }
  
  async scanCustomerInput(query, customerId) {
    await fetch('http://your-security-agent.replit.app/api/data-classifications', {
      method: 'POST',
      body: JSON.stringify({
        source: 'customer-support',
        data: query,
        customerId: customerId,
        dataType: 'customer_query'
      })
    });
  }
}
```

## Environment Configuration

### Docker Integration

```dockerfile
# Dockerfile for your application with security integration
FROM node:18-alpine

WORKDIR /app

# Copy application files
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Environment variables for security integration
ENV SECURITY_AGENT_URL=http://walletgyde-security:5000
ENV SECURITY_API_KEY=your-api-key

# Health check that includes security agent connectivity
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables

```bash
# .env file for your application
# Security Agent Configuration
SECURITY_AGENT_URL=http://your-security-agent.replit.app
SECURITY_API_KEY=your-api-key
SECURITY_WEBHOOK_SECRET=your-webhook-secret

# Enable/disable security features
ENABLE_SECURITY_MONITORING=true
ENABLE_LLM_SCANNING=true
ENABLE_DATA_CLASSIFICATION=true
ENABLE_COMPLIANCE_CHECKING=true

# Security levels
SECURITY_ALERT_THRESHOLD=medium
AUTO_BLOCK_ENABLED=true
COMPLIANCE_MODE=strict
```

## Testing Integration

### Integration Test Examples

```javascript
// Test your security integration
describe('Security Integration Tests', () => {
  const security = new SecurityEventSender(
    'http://localhost:5000',
    'test-api-key'
  );
  
  test('should report suspicious activity', async () => {
    const response = await security.reportSuspiciousLogin(
      'user123',
      '192.168.1.1',
      'suspicious-bot-agent'
    );
    
    expect(response).toBeDefined();
  });
  
  test('should scan LLM responses', async () => {
    const aiResponse = 'Buy this stock now for guaranteed profits!';
    
    const scanResult = await fetch('http://localhost:5000/api/llm/scan', {
      method: 'POST',
      body: JSON.stringify({
        response: aiResponse,
        source: 'test'
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(scanResult.ok).toBe(true);
  });
  
  test('should classify sensitive data', async () => {
    const testData = 'Customer SSN: 123-45-6789';
    
    const classification = await fetch('http://localhost:5000/api/data-classifications', {
      method: 'POST',
      body: JSON.stringify({
        source: 'test',
        data: testData
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(classification.ok).toBe(true);
  });
});
```

## Deployment Considerations

### Production Deployment
1. **Network Security**: Ensure secure communication between applications
2. **Authentication**: Use API keys or JWT tokens for service-to-service communication
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Monitoring**: Monitor the integration performance and health
5. **Fallback**: Design graceful degradation when security agent is unavailable

### Performance Optimization
- **Async Processing**: Make security calls asynchronous to avoid blocking
- **Batching**: Batch multiple security events for efficiency
- **Caching**: Cache compliance results for repeated operations
- **Circuit Breaker**: Implement circuit breaker pattern for resilience

This integration guide shows you exactly how to connect your existing applications and AI models with the WalletGyde Security Agent for comprehensive security and compliance monitoring.