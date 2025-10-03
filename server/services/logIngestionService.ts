import { storage } from '../storage';
import { monitoringService } from './monitoring';
import { apiTracker } from './apiTracker';
import { discordService } from './discordService';
import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
  metadata?: any;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  statusCode?: number;
  responseTime?: number;
}

interface FastAPILogEntry extends LogEntry {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
}

interface OpenAILogEntry extends LogEntry {
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  duration: number;
}

class LogIngestionService {
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;
  private readonly flushInterval = 5000; // 5 seconds

  constructor() {
    // Start the log flushing timer
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  async ingestFastAPILog(logData: any): Promise<void> {
    try {
      const logEntry: FastAPILogEntry = {
        timestamp: logData.timestamp || new Date().toISOString(),
        level: logData.level || 'INFO',
        service: 'FastAPI',
        message: logData.message || 'API Request',
        method: logData.method,
        url: logData.url,
        endpoint: logData.endpoint,
        statusCode: logData.status_code,
        responseTime: logData.response_time,
        userAgent: logData.user_agent,
        ip: logData.client_ip,
        requestId: logData.request_id,
        endpoint: logData.endpoint || '/openai/usage',
        userId: logData.user_id,
        metadata: {
          headers: logData.headers,
          queryParams: logData.query_params,
          bodySize: logData.body_size
        }
      };

      // Add to buffer
      this.logBuffer.push(logEntry);

      // Check for immediate security concerns
      await this.analyzeFastAPILogSecurity(logEntry);

      // Flush if buffer is full
      if (this.logBuffer.length >= this.maxBufferSize) {
        await this.flushLogs();
      }

    } catch (error) {
      console.error('Error ingesting FastAPI log:', error);
    }
  }

  async ingestOpenAILog(logData: any): Promise<void> {
    try {
      const logEntry: OpenAILogEntry = {
        timestamp: logData.timestamp || new Date().toISOString(),
        level: 'INFO',
        service: 'OpenAI',
        message: `AI API call to ${logData.model}`,
        model: logData.model,
        tokens: {
          prompt: logData.usage?.prompt_tokens || 0,
          completion: logData.usage?.completion_tokens || 0,
          total: logData.usage?.total_tokens || 0
        },
        cost: this.calculateOpenAICost(logData.model, logData.usage),
        duration: logData.duration || 0,
        requestId: logData.request_id,
        endpoint: logData.endpoint || '/openai/usage',
        userId: logData.user_id,
        metadata: {
          temperature: logData.temperature,
          maxTokens: logData.max_tokens,
          finishReason: logData.finish_reason,
          prompt: logData.prompt?.substring(0, 100) + '...', // Store first 100 chars
          response: logData.response?.substring(0, 100) + '...' // Store first 100 chars
        }
      };

      // Add to buffer
      this.logBuffer.push(logEntry);

      // Check for security concerns in AI usage
      await this.analyzeOpenAILogSecurity(logEntry);

      // Record usage in API tracker for dashboard metrics
      await apiTracker.trackOpenAICall(logEntry.endpoint || '/openai/usage', logEntry.duration, logEntry.tokens.total);

      // Flush if buffer is full
      if (this.logBuffer.length >= this.maxBufferSize) {
        await this.flushLogs();
      }

    } catch (error) {
      console.error('Error ingesting OpenAI log:', error);
    }
  }

  private async analyzeFastAPILogSecurity(logEntry: FastAPILogEntry): Promise<void> {
    // Check for suspicious HTTP status codes
    if (logEntry.statusCode && logEntry.statusCode >= 400) {
      if (logEntry.statusCode === 401 || logEntry.statusCode === 403) {
        await storage.createAlert({
          title: 'Authentication Failure Detected',
          description: `HTTP ${logEntry.statusCode} from ${logEntry.ip} to ${logEntry.endpoint}`,
          severity: 'medium',
          source: 'FastAPI Log Monitor',
          status: 'active'
        });
      } else if (logEntry.statusCode >= 500) {
        await storage.createAlert({
          title: 'Server Error Detected',
          description: `HTTP ${logEntry.statusCode} error on ${logEntry.endpoint}`,
          severity: 'high',
          source: 'FastAPI Log Monitor',
          status: 'active'
        });
      }
    }

    // Check for slow response times (potential DoS)
    if (logEntry.responseTime && logEntry.responseTime > 5000) {
      await storage.createAlert({
        title: 'Slow Response Time Detected',
        description: `Response time of ${logEntry.responseTime}ms on ${logEntry.endpoint}`,
        severity: 'medium',
        source: 'FastAPI Performance Monitor',
        status: 'active'
      });
    }

    // Check for suspicious user agents
    const suspiciousAgents = ['bot', 'crawler', 'scanner', 'sqlmap', 'nmap'];
    if (logEntry.userAgent && suspiciousAgents.some(agent => logEntry.userAgent!.toLowerCase().includes(agent))) {
      await storage.createIncident({
        severity: 'medium',
        description: `Suspicious user agent detected: ${logEntry.userAgent} from ${logEntry.ip}`,
        status: 'investigating',
        source: 'FastAPI Security Monitor'
      });

      await discordService.sendIncidentAlert({
        severity: 'medium',
        description: `Suspicious user agent detected from ${logEntry.ip}`,
        status: 'investigating',
        source: 'FastAPI Security Monitor',
        timestamp: new Date()
      });
    }

    // Check for PII in request URLs or metadata
    const dataString = JSON.stringify({
      url: logEntry.url,
      metadata: logEntry.metadata
    });

    await this.scanLogDataForPII(dataString, `FastAPI ${logEntry.method} ${logEntry.endpoint}`);
  }

  private async analyzeOpenAILogSecurity(logEntry: OpenAILogEntry): Promise<void> {
    // Check for high token usage (potential abuse)
    if (logEntry.tokens.total > 10000) {
      await storage.createAlert({
        title: 'High Token Usage Detected',
        description: `OpenAI API call used ${logEntry.tokens.total} tokens (cost: $${logEntry.cost.toFixed(4)})`,
        severity: 'medium',
        source: 'OpenAI Usage Monitor',
        status: 'active'
      });
    }

    // Check for high cost
    if (logEntry.cost > 1.0) {
      await storage.createAlert({
        title: 'High Cost AI Request',
        description: `OpenAI API call cost $${logEntry.cost.toFixed(4)} with ${logEntry.tokens.total} tokens`,
        severity: 'high',
        source: 'OpenAI Cost Monitor',
        status: 'active'
      });

      await discordService.sendSecurityAlert({
        title: 'High Cost AI Request Alert',
        description: `Expensive AI API call detected: $${logEntry.cost.toFixed(4)} for ${logEntry.tokens.total} tokens`,
        severity: 'high',
        source: 'OpenAI Cost Monitor',
        timestamp: new Date()
      });
    }

    // Check for unusually long processing times
    if (logEntry.duration > 30000) { // 30 seconds
      await storage.createAlert({
        title: 'Long AI Processing Time',
        description: `OpenAI API call took ${(logEntry.duration / 1000).toFixed(2)} seconds`,
        severity: 'medium',
        source: 'OpenAI Performance Monitor',
        status: 'active'
      });
    }

    // Check prompt and response for sensitive content
    if (logEntry.metadata?.prompt || logEntry.metadata?.response) {
      const contentToScan = `${logEntry.metadata.prompt || ''} ${logEntry.metadata.response || ''}`;
      await this.scanLogDataForPII(contentToScan, `OpenAI ${logEntry.model}`);
    }
  }

  private async scanLogDataForPII(data: string, source: string): Promise<void> {
    // Credit card pattern detection
    const creditCardPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
    const creditCardMatches = data.match(creditCardPattern);
    
    if (creditCardMatches) {
      await storage.createDataClassification({
        dataType: 'Credit Card',
        riskLevel: 'high',
        source: source,
        content: `Credit card detected: ****-****-****-${creditCardMatches[0].slice(-4)}`,
        isResolved: false
      });

      await discordService.sendDataClassificationAlert({
        dataType: 'Credit Card',
        riskLevel: 'high',
        source: source,
        content: 'Credit card information detected in log data',
        timestamp: new Date()
      });
    }

    // SSN pattern detection
    const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/g;
    const ssnMatches = data.match(ssnPattern);
    
    if (ssnMatches) {
      await storage.createDataClassification({
        dataType: 'SSN',
        riskLevel: 'high',
        source: source,
        content: `SSN detected: ***-**-${ssnMatches[0].slice(-4)}`,
        isResolved: false
      });

      await discordService.sendDataClassificationAlert({
        dataType: 'SSN',
        riskLevel: 'high',
        source: source,
        content: 'SSN detected in log data',
        timestamp: new Date()
      });
    }

    // Email pattern detection
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = data.match(emailPattern);
    
    if (emailMatches) {
      await storage.createDataClassification({
        dataType: 'Email Address',
        riskLevel: 'medium',
        source: source,
        content: `Email detected: ${emailMatches[0]}`,
        isResolved: false
      });
    }

    // Phone number pattern detection
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const phoneMatches = data.match(phonePattern);
    
    if (phoneMatches) {
      await storage.createDataClassification({
        dataType: 'Phone Number',
        riskLevel: 'medium',
        source: source,
        content: `Phone detected: ***-***-${phoneMatches[0].slice(-4)}`,
        isResolved: false
      });
    }
  }

  private calculateOpenAICost(model: string, usage: any): number {
    if (!usage) return 0;

    // OpenAI pricing as of 2025 (approximate)
    const pricing: { [key: string]: { prompt: number; completion: number } } = {
      'gpt-5': { prompt: 0.03, completion: 0.06 }, // per 1K tokens
      'gpt-4o': { prompt: 0.005, completion: 0.015 },
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-3.5-turbo': { prompt: 0.001, completion: 0.002 }
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    
    const promptCost = (usage.prompt_tokens / 1000) * modelPricing.prompt;
    const completionCost = (usage.completion_tokens / 1000) * modelPricing.completion;
    
    return promptCost + completionCost;
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      // Process logs for analytics
      await this.processLogAnalytics(this.logBuffer);

      // Store critical logs in database (optional - for now just console log)
      const criticalLogs = this.logBuffer.filter(log => 
        log.level === 'ERROR' || 
        (log.metadata && (log.metadata.statusCode >= 500 || log.metadata.cost > 0.5))
      );

      if (criticalLogs.length > 0) {
        console.log(`Processed ${criticalLogs.length} critical log entries`);
      }

      // Clear buffer
      this.logBuffer = [];

    } catch (error) {
      console.error('Error flushing logs:', error);
    }
  }

  private async processLogAnalytics(logs: LogEntry[]): Promise<void> {
    const analytics = {
      totalLogs: logs.length,
      errorCount: logs.filter(log => log.level === 'ERROR').length,
      warnCount: logs.filter(log => log.level === 'WARN').length,
      fastAPILogs: logs.filter(log => log.service === 'FastAPI').length,
      openAILogs: logs.filter(log => log.service === 'OpenAI').length,
      averageResponseTime: 0,
      totalOpenAICost: 0
    };

    // Calculate average response time for FastAPI logs
    const fastAPILogs = logs.filter(log => log.service === 'FastAPI') as FastAPILogEntry[];
    const responseTimes = fastAPILogs
      .filter(log => log.responseTime)
      .map(log => log.responseTime!);
    
    if (responseTimes.length > 0) {
      analytics.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    // Calculate total OpenAI cost
    const openAILogs = logs.filter(log => log.service === 'OpenAI') as OpenAILogEntry[];
    analytics.totalOpenAICost = openAILogs.reduce((sum, log) => sum + log.cost, 0);

    // Update monitoring statistics
    await monitoringService.updateDailyStats();

    console.log('Log Analytics:', analytics);
  }

  async getLogMetrics(timeWindow: number = 24): Promise<any> {
    // This would typically query stored logs, but for now return current buffer stats
    const recentLogs = this.logBuffer.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      const cutoff = Date.now() - (timeWindow * 60 * 60 * 1000);
      return logTime > cutoff;
    });

    return {
      totalLogs: recentLogs.length,
      errorRate: recentLogs.filter(log => log.level === 'ERROR').length / recentLogs.length,
      services: {
        FastAPI: recentLogs.filter(log => log.service === 'FastAPI').length,
        OpenAI: recentLogs.filter(log => log.service === 'OpenAI').length
      },
      avgResponseTime: this.calculateAverageResponseTime(recentLogs),
      totalAICost: this.calculateTotalAICost(recentLogs)
    };
  }

  private calculateAverageResponseTime(logs: LogEntry[]): number {
    const fastAPILogs = logs.filter(log => log.service === 'FastAPI') as FastAPILogEntry[];
    const responseTimes = fastAPILogs
      .filter(log => log.responseTime)
      .map(log => log.responseTime!);
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
  }

  private calculateTotalAICost(logs: LogEntry[]): number {
    const openAILogs = logs.filter(log => log.service === 'OpenAI') as OpenAILogEntry[];
    return openAILogs.reduce((sum, log) => sum + log.cost, 0);
  }
}

export const logIngestionService = new LogIngestionService();
