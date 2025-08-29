# 🔍 How LLM Risk Control Monitors LLM Input/Output

## Current Implementation: Middleware Approach

Your WalletGyde Security Agent uses a **middleware pattern** to monitor LLM communications. Here's how it works:

### **🔄 LLM Monitoring Flow**

```
User Input → Your Application → LLM API (OpenAI/Claude/etc.) → LLM Response → Security Scanner → Filtered Response → User
```

### **📡 Integration Points**

#### **1. Outbound Response Filtering (Currently Implemented)**
Your application sends LLM responses to our security scanner:

```javascript
// After getting response from OpenAI/Claude
const llmResponse = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{"role": "user", "content": userInput}]
});

// Send to WalletGyde security scanner
const scanResult = await fetch('/api/llm/scan-response', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    content: llmResponse.choices[0].message.content,
    metadata: {
      model: "gpt-4",
      user_id: userId,
      timestamp: new Date().toISOString()
    }
  })
});

// Handle security decision
if (scanResult.action === 'block') {
  return "I cannot provide that type of financial advice. Please consult a qualified advisor.";
} else if (scanResult.action === 'rewrite') {
  return scanResult.modifiedContent; // Sanitized version
} else {
  return llmResponse.choices[0].message.content; // Original content
}
```

#### **2. Input Monitoring (Can Be Added)**
You can also monitor user inputs before sending to LLM:

```javascript
// Before sending to LLM, check user input
const inputScan = await fetch('/api/llm/scan-response', {
  method: 'POST',
  body: JSON.stringify({
    content: userInput,
    metadata: {direction: "input", user_id: userId}
  })
});

// Clean input if needed before sending to LLM
const cleanInput = inputScan.action === 'rewrite' ? inputScan.modifiedContent : userInput;
```

### **🎯 What Gets Monitored**

#### **Current Capabilities:**
- **Financial Advice**: "You should buy Tesla stock" → BLOCKED
- **Unverified Claims**: "According to my insider analysis" → REWRITTEN
- **PII Exposure**: SSNs, credit cards, emails → REDACTED
- **Investment Guarantees**: "Guaranteed 50% return" → BLOCKED

#### **How It Captures Data:**
1. **Your Application Integration**: You call our `/api/llm/scan-response` endpoint
2. **Real-time Analysis**: Content analyzed using pattern matching and risk scoring
3. **Action Decisions**: Block, rewrite, or allow based on violation type
4. **Audit Logging**: All scanned content logged for compliance and review

### **📊 Monitoring Dashboard**

Your security dashboard shows:
- **LLM Responses Scanned**: Total count processed
- **Violations Detected**: Financial advice, unverified data, PII exposure
- **Actions Taken**: Blocked vs rewritten vs allowed
- **Risk Trends**: Violation patterns over time

### **🔧 Integration Examples**

#### **OpenAI Integration**
```javascript
import { openai } from './openai-client';
import { scanLLMResponse } from './security-scanner';

async function getChatResponse(userMessage, userId) {
  // Get LLM response
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{"role": "user", "content": userMessage}]
  });

  // Security scan
  const scanResult = await scanLLMResponse(response.choices[0].message.content, {
    user_id: userId,
    model: "gpt-4",
    direction: "output"
  });

  // Return filtered content
  return scanResult.action === 'allow' ? 
    response.choices[0].message.content : 
    scanResult.modifiedContent || "Content filtered for security.";
}
```

#### **Claude Integration**
```javascript
import Anthropic from '@anthropic-ai/sdk';
import { scanLLMResponse } from './security-scanner';

const anthropic = new Anthropic();

async function getClaudeResponse(prompt, userId) {
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    messages: [{"role": "user", "content": prompt}]
  });

  // Security filtering
  const scanResult = await scanLLMResponse(response.content[0].text, {
    user_id: userId,
    model: "claude-3-sonnet",
    direction: "output"
  });

  return scanResult.filteredContent;
}
```

### **🚀 Advanced Integration Options**

#### **1. Proxy Server Approach**
Instead of manual integration, you could route all LLM traffic through WalletGyde:

```
Your App → WalletGyde Proxy → LLM API → WalletGyde Scanner → Your App
```

#### **2. SDK Integration**
A WalletGyde SDK could wrap LLM clients automatically:

```javascript
import { WalletGydeOpenAI } from 'walletgyde-sdk';

const secureOpenAI = new WalletGydeOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  securityEndpoint: 'http://localhost:5000'
});

// Automatically scanned responses
const response = await secureOpenAI.chat.completions.create({...});
```

#### **3. Webhook Integration**
WalletGyde could receive webhooks from LLM providers:

```javascript
// LLM provider sends responses to WalletGyde first
POST /webhook/llm-response
{
  "provider": "openai",
  "response": "...",
  "user_id": "123",
  "callback_url": "https://yourapp.com/llm-callback"
}
```

### **📈 Current Testing**

Your system is currently operational and can be tested at:
- **Interactive Testing**: `/llm-testing` page
- **API Endpoint**: `POST /api/llm/scan-response`
- **Live Examples**: Financial advice detection, unverified claims filtering, PII redaction

The system monitors **what you send to it** - meaning you control which LLM responses get scanned by integrating the security scanning into your application's LLM pipeline.