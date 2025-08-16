# System Architecture Documentation

## Overview

The WalletGyde Security Agent is built using a modern, scalable architecture that provides real-time security monitoring, compliance enforcement, and incident management for financial applications.

## Architecture Principles

### 1. Security-First Design
- **Zero Trust Architecture**: Never trust, always verify approach
- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege**: Minimal access rights for all components
- **Secure by Default**: Security controls enabled by default

### 2. Scalability & Performance
- **Microservices Architecture**: Loosely coupled, independently deployable services
- **Event-Driven Design**: Asynchronous event processing for real-time responsiveness
- **Horizontal Scaling**: Support for scaling across multiple instances
- **Caching Strategy**: Intelligent caching for optimal performance

### 3. Compliance & Auditability
- **Audit Trails**: Comprehensive logging of all system activities
- **Data Lineage**: Complete tracking of data flow and transformations
- **Immutable Logs**: Tamper-proof logging for compliance requirements
- **Regulatory Support**: Built-in support for multiple compliance frameworks

## System Components

### Frontend Architecture

#### React Application Structure
```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── WalletGydeLogo.tsx
│   │   ├── Navigation.tsx
│   │   ├── StatusOverview.tsx
│   │   ├── APIActivityMonitor.tsx
│   │   ├── RecentAlerts.tsx
│   │   ├── ComplianceRules.tsx
│   │   ├── DataClassification.tsx
│   │   ├── LLMResponseMonitor.tsx
│   │   └── IncidentLog.tsx
│   ├── pages/              # Page components
│   │   ├── dashboard.tsx
│   │   ├── ComplianceFilter.tsx
│   │   ├── landing.tsx
│   │   └── not-found.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useWebSocket.ts
│   │   └── use-toast.ts
│   ├── lib/                # Utility libraries
│   │   └── queryClient.ts
│   └── App.tsx             # Main application component
```

#### Technology Stack
- **React 18**: Modern UI framework with concurrent features
- **TypeScript**: Type-safe development with enhanced IDE support
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **shadcn/ui**: Accessible component library built on Radix UI
- **TanStack Query**: Powerful data synchronization for React
- **Wouter**: Lightweight client-side routing solution

#### Key Features
- **Real-time Updates**: WebSocket integration for live data
- **Responsive Design**: Mobile-first responsive interface
- **Dark Mode Support**: User preference-based theming
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized bundle splitting and lazy loading

### Backend Architecture

#### Express.js Server Structure
```
server/
├── index.ts                # Application entry point
├── routes.ts               # API route definitions
├── storage.ts              # Data storage abstraction
├── services/               # Business logic services
│   ├── monitoring.ts       # API monitoring service
│   ├── compliance.ts       # Compliance checking service
│   ├── email.ts           # Email notification service
│   ├── llm-scanner.ts     # LLM response scanning service
│   └── slack.ts           # Slack notification service
├── python/                 # Python analysis scripts
│   ├── anomaly_detector.py
│   └── data_classifier.py
└── vite.ts                # Vite development server integration
```

#### Core Services

**1. Monitoring Service**
```typescript
interface MonitoringService {
  processApiCall(source: string, endpoint: string, data: any): Promise<void>;
  detectAnomalies(): Promise<void>;
  generateSecurityReport(): Promise<SecurityReport>;
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
}
```

**2. Compliance Service**
```typescript
interface ComplianceService {
  checkGDPRCompliance(data: any): Promise<ComplianceResult>;
  calculateComplianceScore(): Promise<number>;
  validateSOC2Controls(): Promise<ControlResults>;
  assessPCICompliance(): Promise<PCIAssessment>;
}
```

**3. LLM Scanner Service**
```typescript
interface LLMScannerService {
  scanResponse(content: LLMResponse): Promise<ViolationResult>;
  detectFinancialAdvice(content: string): Promise<boolean>;
  checkUnverifiedClaims(content: string): Promise<ClaimResult>;
  getViolationStats(): Promise<ViolationStats>;
}
```

### Database Architecture

#### PostgreSQL Schema Design
```sql
-- Core security tables
CREATE TABLE api_sources (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL,
  calls_today INTEGER DEFAULT 0,
  alert_status VARCHAR(50) DEFAULT 'normal',
  last_activity TIMESTAMP WITH TIME ZONE
);

CREATE TABLE security_alerts (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  source VARCHAR(255),
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE data_classifications (
  id UUID PRIMARY KEY,
  data_type VARCHAR(100),
  content TEXT,
  risk_level VARCHAR(50),
  source VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT false
);

CREATE TABLE security_incidents (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  source VARCHAR(255),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  assigned_to VARCHAR(255)
);

CREATE TABLE llm_violations (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  violation_type VARCHAR(100),
  severity VARCHAR(50),
  source VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT false
);

CREATE TABLE monitoring_stats (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  total_api_calls INTEGER DEFAULT 0,
  total_alerts INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  compliance_score DECIMAL(5,2),
  avg_response_time DECIMAL(10,2),
  uptime_percentage DECIMAL(5,2)
);
```

#### Database Design Principles
- **Normalization**: Properly normalized schema to reduce redundancy
- **Indexing**: Strategic indexing for query performance
- **Partitioning**: Time-based partitioning for large tables
- **Constraints**: Data integrity constraints and foreign keys
- **Audit Trails**: Comprehensive audit logging for all changes

### Real-time Communication

#### WebSocket Architecture
```typescript
interface WebSocketMessage {
  type: 'dashboard_update' | 'new_alert' | 'compliance_update' | 'incident_update';
  data: any;
  timestamp: Date;
}

class WebSocketService {
  private wss: WebSocket.Server;
  private clients: Set<WebSocket>;

  broadcast(message: WebSocketMessage): void {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  sendToClient(clientId: string, message: WebSocketMessage): void {
    // Send message to specific client
  }
}
```

#### Event Types
- **Dashboard Updates**: Real-time dashboard data refresh
- **Security Alerts**: Immediate security event notifications
- **Compliance Changes**: Compliance status updates
- **Incident Updates**: Security incident status changes
- **System Health**: System performance and health metrics

### Data Processing Pipeline

#### Stream Processing Architecture
```
API Request → Ingestion → Classification → Analysis → Storage → Notification
     ↓             ↓           ↓           ↓         ↓          ↓
 Rate Limiting → Parsing → PII Detection → Risk → Database → Alerts
                    ↓           ↓        Scoring      ↓          ↓
              Validation → Compliance → ML Analysis → Audit → Actions
                           Checking                   Logs
```

#### Processing Stages

**1. Data Ingestion**
- **API Request Capture**: Intercept and log all API requests
- **Data Validation**: Validate incoming data format and structure
- **Rate Limiting**: Apply configurable rate limiting rules
- **Authentication**: Verify request authentication and authorization

**2. Data Classification**
- **Content Analysis**: Analyze request/response content for sensitive data
- **Pattern Matching**: Apply regex patterns for PII and financial data
- **ML Classification**: Use machine learning for advanced data classification
- **Risk Scoring**: Assign risk scores based on data sensitivity

**3. Compliance Checking**
- **Rule Evaluation**: Apply configured compliance rules
- **Policy Validation**: Check against organizational policies
- **Regulatory Compliance**: Verify regulatory compliance requirements
- **Violation Detection**: Identify potential compliance violations

**4. Storage and Audit**
- **Data Persistence**: Store processed data in PostgreSQL
- **Audit Logging**: Create immutable audit trails
- **Retention Management**: Apply data retention policies
- **Encryption**: Encrypt sensitive data at rest

**5. Notification and Response**
- **Alert Generation**: Create alerts for security events
- **Notification Dispatch**: Send notifications via multiple channels
- **Automated Response**: Execute automated response actions
- **Escalation**: Escalate critical issues to appropriate teams

## Security Architecture

### Authentication & Authorization

#### Multi-layered Security
```typescript
interface SecurityLayer {
  name: string;
  type: 'authentication' | 'authorization' | 'encryption' | 'monitoring';
  implementation: string;
  controls: SecurityControl[];
}

const securityLayers: SecurityLayer[] = [
  {
    name: 'API Gateway',
    type: 'authentication',
    implementation: 'JWT tokens with refresh mechanism',
    controls: ['rate_limiting', 'ip_filtering', 'request_validation']
  },
  {
    name: 'Application Layer',
    type: 'authorization',
    implementation: 'Role-based access control (RBAC)',
    controls: ['permission_checking', 'resource_access', 'audit_logging']
  },
  {
    name: 'Data Layer',
    type: 'encryption',
    implementation: 'AES-256 encryption at rest and in transit',
    controls: ['data_encryption', 'key_management', 'secure_storage']
  },
  {
    name: 'Monitoring Layer',
    type: 'monitoring',
    implementation: 'Real-time security monitoring',
    controls: ['anomaly_detection', 'threat_intelligence', 'incident_response']
  }
];
```

### Encryption Strategy

#### Data Encryption
- **At Rest**: AES-256 encryption for database storage
- **In Transit**: TLS 1.3 for all network communications
- **Key Management**: Secure key rotation and storage
- **Field-Level**: Selective field encryption for sensitive data

#### Key Management
```typescript
interface EncryptionKey {
  id: string;
  algorithm: 'AES-256' | 'RSA-2048' | 'ECDSA-P256';
  purpose: 'data_encryption' | 'signing' | 'authentication';
  created: Date;
  expires: Date;
  rotationSchedule: string;
}
```

### Network Security

#### Security Controls
- **Firewall Rules**: Restrictive ingress/egress rules
- **DDoS Protection**: Multi-layer DDoS mitigation
- **Intrusion Detection**: Network-based intrusion detection
- **VPN Access**: Secure remote access for administrators
- **Network Segmentation**: Isolated network segments for different components

## Monitoring & Observability

### Application Monitoring

#### Metrics Collection
```typescript
interface SystemMetrics {
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  security: {
    alertsGenerated: number;
    incidentsDetected: number;
    complianceScore: number;
    vulnerabilitiesFound: number;
  };
  business: {
    apiCallsProcessed: number;
    dataClassified: number;
    rulesExecuted: number;
    reportsGenerated: number;
  };
}
```

#### Logging Strategy
- **Structured Logging**: JSON-formatted logs for easy parsing
- **Log Levels**: Appropriate log levels for different event types
- **Log Aggregation**: Centralized log collection and analysis
- **Log Retention**: Configurable log retention policies
- **Log Security**: Encrypted and tamper-proof logging

### Health Checks

#### System Health Monitoring
```typescript
interface HealthCheck {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: Date;
  responseTime: number;
  dependencies: HealthCheck[];
  metrics: Record<string, any>;
}
```

#### Health Check Components
- **Database Connectivity**: PostgreSQL connection health
- **External Services**: Third-party service availability
- **Memory Usage**: Application memory consumption
- **Disk Space**: Available storage capacity
- **Network Connectivity**: Network interface status

## Deployment Architecture

### Infrastructure Components

#### Production Environment
```yaml
# Docker Compose Configuration
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
      - redis
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=walletgyde_security
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7
    volumes:
      - redis_data:/data
```

#### Scalability Configuration
- **Load Balancing**: Multiple application instances with load balancer
- **Database Scaling**: Read replicas for improved performance
- **Caching**: Redis caching for frequently accessed data
- **CDN**: Content delivery network for static assets
- **Auto-scaling**: Automatic scaling based on load metrics

### Security Deployment

#### Production Security
- **Container Security**: Secure container images with minimal attack surface
- **Secret Management**: Secure secret storage and rotation
- **Network Isolation**: Isolated network environments
- **Access Controls**: Strict production access controls
- **Monitoring**: Comprehensive security monitoring and alerting

## Performance Optimization

### Frontend Optimization

#### Performance Strategies
- **Code Splitting**: Lazy loading of route components
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: Intelligent caching of API responses
- **Virtual Scrolling**: Efficient rendering of large data sets
- **Image Optimization**: Optimized image formats and sizes

### Backend Optimization

#### Database Performance
- **Query Optimization**: Optimized database queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Caching Strategy**: Redis caching for frequently accessed data
- **Read Replicas**: Read replicas for improved query performance
- **Partitioning**: Table partitioning for large datasets

#### API Performance
- **Response Compression**: Gzip compression for API responses
- **Pagination**: Efficient pagination for large datasets
- **Batch Operations**: Batch processing for bulk operations
- **Async Processing**: Asynchronous processing for time-consuming operations
- **Rate Limiting**: Intelligent rate limiting to prevent abuse

## Disaster Recovery

### Backup Strategy

#### Data Backup
- **Automated Backups**: Regular automated database backups
- **Point-in-Time Recovery**: Ability to restore to specific points in time
- **Cross-Region Replication**: Backup replication across multiple regions
- **Backup Testing**: Regular backup restoration testing
- **Encryption**: Encrypted backups for security compliance

### Business Continuity

#### Recovery Procedures
- **RTO (Recovery Time Objective)**: Target recovery time of 4 hours
- **RPO (Recovery Point Objective)**: Maximum data loss of 1 hour
- **Failover Procedures**: Automated failover to backup systems
- **Communication Plan**: Incident communication procedures
- **Testing Schedule**: Regular disaster recovery testing

## API Design

### RESTful API Structure

#### Endpoint Organization
```
/api/
├── dashboard              # Dashboard data
├── sources               # API source management
├── alerts                # Security alerts
├── compliance/
│   ├── rules            # Compliance rules
│   ├── stats            # Compliance statistics
│   ├── filtered-items   # Filtered data items
│   └── report           # Compliance reports
├── data-classifications  # Data classification results
├── llm/
│   ├── scan             # LLM response scanning
│   ├── violations       # LLM violations
│   └── stats            # LLM scanning statistics
├── incidents            # Security incidents
└── monitoring/
    ├── stats            # Monitoring statistics
    └── detect-anomalies # Anomaly detection
```

#### API Standards
- **HTTP Methods**: Proper use of GET, POST, PUT, DELETE, PATCH
- **Status Codes**: Appropriate HTTP status codes for all responses
- **Error Handling**: Consistent error response format
- **Versioning**: API versioning strategy for backward compatibility
- **Documentation**: Comprehensive API documentation with examples

### WebSocket API

#### Real-time Communication
```typescript
// WebSocket message types
type WebSocketMessageType = 
  | 'dashboard_update'
  | 'new_alert'
  | 'compliance_rule_updated'
  | 'incident_updated'
  | 'source_updated'
  | 'system_health';

interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
  timestamp: string;
}
```

#### Event Broadcasting
- **Dashboard Updates**: Real-time dashboard data updates
- **Alert Notifications**: Immediate security alert delivery
- **Compliance Changes**: Real-time compliance status updates
- **System Events**: System health and performance updates
- **User Notifications**: Personalized user notifications

## Integration Architecture

### External Service Integration

#### Third-party Services
- **Slack Integration**: Real-time security notifications
- **Email Services**: SMTP-based email notifications
- **Cloud Storage**: Secure backup and archival storage
- **Threat Intelligence**: External threat intelligence feeds
- **Monitoring Services**: External monitoring and alerting

#### API Integration Patterns
- **Circuit Breaker**: Prevent cascading failures from external services
- **Retry Logic**: Intelligent retry mechanisms for failed requests
- **Timeout Handling**: Appropriate timeout configurations
- **Error Handling**: Graceful degradation when services are unavailable
- **Monitoring**: Comprehensive monitoring of external service health

### Webhook Architecture

#### Incoming Webhooks
- **Security Events**: Receive security events from external systems
- **Compliance Updates**: Receive compliance status updates
- **Threat Intelligence**: Receive threat intelligence updates
- **System Alerts**: Receive system health alerts

#### Outgoing Webhooks
- **Alert Notifications**: Send alerts to external systems
- **Compliance Reports**: Send compliance reports to stakeholders
- **Incident Updates**: Send incident status updates
- **System Events**: Send system health updates