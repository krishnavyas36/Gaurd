# API Documentation

## Base URL
```
https://your-security-agent.replit.app/api
```

## Authentication
Include your API key in the Authorization header:
```
Authorization: Bearer your-api-key
```

## Core API Endpoints

### Dashboard Endpoints

#### GET /dashboard
Returns complete dashboard data including API sources, alerts, compliance score, and statistics.

**Response:**
```json
{
  "apiSources": [
    {
      "id": "uuid",
      "name": "Plaid API",
      "url": "https://api.plaid.com",
      "status": "active",
      "callsToday": 1247,
      "alertStatus": "normal",
      "lastActivity": "2025-08-17T00:58:15.024Z"
    }
  ],
  "alerts": [
    {
      "id": "uuid",
      "title": "Suspicious API Activity",
      "message": "Unusual request pattern detected",
      "severity": "high",
      "status": "active",
      "source": "api-monitor",
      "timestamp": "2025-08-17T00:58:15.024Z"
    }
  ],
  "complianceScore": 87.5,
  "stats": {
    "totalApiCalls": 2595,
    "totalAlerts": 12,
    "criticalAlerts": 2,
    "avgResponseTime": 150.5,
    "uptimePercentage": 99.8
  }
}
```

### Security Monitoring Endpoints

#### POST /monitor
Monitor API calls and system activities.

**Request Body:**
```json
{
  "source": "payment-api",
  "endpoint": "/api/payments",
  "method": "POST",
  "data": {
    "amount": 1000,
    "currency": "USD",
    "userId": "user123"
  },
  "response": {
    "statusCode": 200,
    "responseTime": 150
  },
  "timestamp": "2025-08-17T00:58:15.024Z"
}
```

**Response:**
```json
{
  "success": true,
  "alertsGenerated": 0,
  "riskScore": "low",
  "complianceStatus": "compliant"
}
```

#### POST /monitoring/detect-anomalies
Trigger anomaly detection analysis.

**Request Body:**
```json
{
  "sources": ["api1", "api2"],
  "timeRange": "1h"
}
```

**Response:**
```json
{
  "anomaliesDetected": [
    {
      "source": "api1",
      "type": "rate_spike",
      "severity": "medium",
      "description": "Request rate increased by 300%"
    }
  ],
  "analysisTimestamp": "2025-08-17T00:58:15.024Z"
}
```

### Alert Management Endpoints

#### GET /alerts
Retrieve security alerts with optional filtering.

**Query Parameters:**
- `severity`: Filter by severity (low, medium, high, critical)
- `status`: Filter by status (active, acknowledged, resolved)
- `limit`: Number of alerts to return (default: 50)
- `offset`: Number of alerts to skip (default: 0)

**Response:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "title": "PII Detection Alert",
      "message": "Personal information detected in API response",
      "severity": "high",
      "status": "active",
      "source": "data-classifier",
      "metadata": {
        "dataType": "ssn",
        "count": 1
      },
      "timestamp": "2025-08-17T00:58:15.024Z"
    }
  ],
  "total": 125,
  "page": 1,
  "totalPages": 3
}
```

#### POST /alerts
Create a new security alert.

**Request Body:**
```json
{
  "title": "Suspicious Login Attempt",
  "message": "Multiple failed login attempts from IP 192.168.1.1",
  "severity": "medium",
  "source": "auth-system",
  "metadata": {
    "ipAddress": "192.168.1.1",
    "attempts": 5,
    "userId": "user123"
  }
}
```

#### PATCH /alerts/:id
Update alert status or add notes.

**Request Body:**
```json
{
  "status": "acknowledged",
  "notes": "Investigating with security team"
}
```

### Compliance Endpoints

#### GET /compliance/stats
Get compliance statistics and scores.

**Response:**
```json
{
  "overallScore": 87.5,
  "breakdown": {
    "gdpr": 92.0,
    "soc2": 85.5,
    "pci": 84.0,
    "custom": 89.0
  },
  "activeRules": 15,
  "violationsLastWeek": 3,
  "trends": {
    "daily": [85.2, 86.1, 87.5],
    "weekly": [84.0, 85.5, 87.5]
  }
}
```

#### GET /compliance/rules
Retrieve compliance rules.

**Response:**
```json
{
  "rules": [
    {
      "id": "uuid",
      "name": "PII Detection Rule",
      "description": "Detect and flag personal identifiable information",
      "ruleType": "pii_detection",
      "severity": "high",
      "isActive": true,
      "config": {
        "patterns": ["ssn", "credit_card", "email"],
        "threshold": 0.8
      },
      "createdAt": "2025-08-17T00:58:15.024Z"
    }
  ]
}
```

#### POST /compliance/rules
Create a new compliance rule.

**Request Body:**
```json
{
  "name": "Rate Limiting Rule",
  "description": "Monitor API request rates",
  "ruleType": "rate_limit",
  "severity": "medium",
  "isActive": true,
  "config": {
    "threshold": 100,
    "timeWindow": "15m"
  }
}
```

#### GET /compliance/filtered-items
Get items filtered by compliance rules.

**Query Parameters:**
- `riskLevel`: Filter by risk level (low, medium, high, critical)
- `action`: Filter by action taken (blocked, flagged, monitored, encrypted)
- `limit`: Number of items to return
- `offset`: Number of items to skip

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "content": "Customer SSN: ***-**-6789",
      "riskLevel": "high",
      "action": "blocked",
      "source": "api-response",
      "detectedAt": "2025-08-17T00:58:15.024Z",
      "ruleName": "PII Detection"
    }
  ],
  "total": 45,
  "summary": {
    "blocked": 12,
    "flagged": 20,
    "monitored": 10,
    "encrypted": 3
  }
}
```

#### POST /compliance/report
Generate compliance report.

**Request Body:**
```json
{
  "reportType": "executive",
  "timeRange": "30d",
  "includeRecommendations": true
}
```

**Response:**
```json
{
  "reportId": "uuid",
  "status": "generating",
  "estimatedCompletion": "2025-08-17T01:05:15.024Z",
  "downloadUrl": "/api/reports/uuid/download"
}
```

### Data Classification Endpoints

#### POST /data-classifications
Classify data for PII and sensitive information.

**Request Body:**
```json
{
  "source": "user-input",
  "data": "Customer information: John Doe, SSN: 123-45-6789, Email: john@example.com",
  "dataType": "form_submission",
  "userId": "user123"
}
```

**Response:**
```json
{
  "classifications": [
    {
      "type": "ssn",
      "confidence": 0.95,
      "location": "characters 35-47",
      "riskLevel": "high",
      "action": "encrypt"
    },
    {
      "type": "email",
      "confidence": 0.99,
      "location": "characters 55-72",
      "riskLevel": "medium",
      "action": "monitor"
    }
  ],
  "overallRiskLevel": "high",
  "recommendedActions": ["encrypt_ssn", "log_access", "notify_compliance"]
}
```

#### GET /data-classifications
Retrieve classification history.

**Query Parameters:**
- `dataType`: Filter by data type
- `riskLevel`: Filter by risk level
- `limit`: Number of results to return
- `offset`: Number of results to skip

### LLM Monitoring Endpoints

#### POST /llm/scan
Scan LLM responses for compliance violations.

**Request Body:**
```json
{
  "prompt": "What investment advice do you have?",
  "response": "I recommend investing in diversified index funds for long-term growth.",
  "model": "gpt-4",
  "source": "customer-chat",
  "userId": "user123"
}
```

**Response:**
```json
{
  "violations": [
    {
      "type": "financial_advice",
      "severity": "medium",
      "confidence": 0.75,
      "description": "Response contains investment advice",
      "recommendation": "Add disclaimer or block response"
    }
  ],
  "overallRisk": "medium",
  "action": "flag_for_review",
  "scanId": "uuid"
}
```

#### GET /llm/violations
Retrieve LLM violation history.

**Response:**
```json
{
  "violations": [
    {
      "id": "uuid",
      "content": "You should definitely buy Bitcoin now...",
      "violationType": "financial_advice",
      "severity": "high",
      "source": "chatbot",
      "timestamp": "2025-08-17T00:58:15.024Z",
      "isResolved": false,
      "action": "blocked"
    }
  ]
}
```

#### GET /llm/stats
Get LLM scanning statistics.

**Response:**
```json
{
  "totalScanned": 1250,
  "violationsFound": 23,
  "violationTypes": {
    "financial_advice": 12,
    "unverified_claims": 8,
    "data_exposure": 3
  },
  "actionsTaken": {
    "blocked": 15,
    "flagged": 6,
    "monitored": 2
  },
  "trendsLastWeek": [2, 3, 1, 4, 2, 5, 6]
}
```

### Incident Management Endpoints

#### GET /incidents
Retrieve security incidents.

**Query Parameters:**
- `status`: Filter by status (open, investigating, resolved, closed)
- `severity`: Filter by severity
- `assignedTo`: Filter by assigned user

**Response:**
```json
{
  "incidents": [
    {
      "id": "uuid",
      "title": "Data Breach Investigation",
      "description": "Unauthorized access to customer database",
      "severity": "critical",
      "status": "investigating",
      "source": "database-monitor",
      "detectedAt": "2025-08-17T00:58:15.024Z",
      "assignedTo": "security-team@company.com",
      "estimatedResolution": "2025-08-17T04:00:15.024Z"
    }
  ]
}
```

#### POST /incidents
Create a new security incident.

**Request Body:**
```json
{
  "title": "Suspicious Payment Pattern",
  "description": "Multiple high-value transactions from new account",
  "severity": "high",
  "source": "payment-monitor",
  "assignedTo": "fraud-team@company.com",
  "metadata": {
    "userId": "user123",
    "transactionCount": 5,
    "totalAmount": 50000
  }
}
```

#### PATCH /incidents/:id
Update incident status or details.

**Request Body:**
```json
{
  "status": "resolved",
  "resolutionNotes": "False positive - verified legitimate transactions",
  "resolvedAt": "2025-08-17T01:30:15.024Z"
}
```

### Webhook Endpoints

#### POST /webhooks/register
Register a webhook endpoint to receive security notifications.

**Request Body:**
```json
{
  "url": "https://your-app.com/security-webhook",
  "events": ["security_alert", "compliance_violation", "incident_created"],
  "secret": "your-webhook-secret"
}
```

#### GET /webhooks
List registered webhooks.

#### DELETE /webhooks/:id
Remove a webhook registration.

## Webhook Events

### Security Alert Event
```json
{
  "type": "security_alert",
  "data": {
    "id": "uuid",
    "title": "Suspicious Activity Detected",
    "severity": "high",
    "source": "api-monitor",
    "timestamp": "2025-08-17T00:58:15.024Z"
  },
  "timestamp": "2025-08-17T00:58:15.024Z"
}
```

### Compliance Violation Event
```json
{
  "type": "compliance_violation",
  "data": {
    "ruleId": "uuid",
    "ruleName": "PII Detection",
    "violation": "SSN detected in API response",
    "severity": "high",
    "action": "blocked"
  },
  "timestamp": "2025-08-17T00:58:15.024Z"
}
```

### Incident Created Event
```json
{
  "type": "incident_created",
  "data": {
    "id": "uuid",
    "title": "Security Incident",
    "severity": "critical",
    "status": "open",
    "assignedTo": "security-team@company.com"
  },
  "timestamp": "2025-08-17T00:58:15.024Z"
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "severity",
      "issue": "must be one of: low, medium, high, critical"
    }
  },
  "timestamp": "2025-08-17T00:58:15.024Z",
  "requestId": "uuid"
}
```

### Common Error Codes
- `AUTHENTICATION_FAILED`: Invalid or missing API key
- `AUTHORIZATION_DENIED`: Insufficient permissions
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Rate Limits

- **Default**: 1000 requests per hour per API key
- **Monitoring endpoints**: 10,000 requests per hour
- **Webhook delivery**: 5 retries with exponential backoff

## SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @walletgyde/security-sdk
```

```javascript
import { WalletGydeSecurityClient } from '@walletgyde/security-sdk';

const client = new WalletGydeSecurityClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-security-agent.replit.app'
});

// Monitor API call
await client.monitor({
  source: 'payment-api',
  endpoint: '/payments',
  data: paymentData
});

// Scan LLM response
const scanResult = await client.scanLLMResponse({
  prompt: userPrompt,
  response: aiResponse
});
```

### Python
```bash
pip install walletgyde-security
```

```python
from walletgyde_security import SecurityClient

client = SecurityClient(
    api_key='your-api-key',
    base_url='https://your-security-agent.replit.app'
)

# Monitor activity
client.monitor(
    source='payment-api',
    endpoint='/payments',
    data=payment_data
)

# Classify data
classification = client.classify_data(
    source='user-input',
    data=user_data
)
```

This API documentation provides complete integration guidance for connecting your applications with the WalletGyde Security Agent.