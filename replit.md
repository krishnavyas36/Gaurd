# WalletGyde Security Agent

## Overview

WalletGyde Security Agent is a comprehensive security monitoring and compliance platform designed to protect financial applications. The system monitors API activity, detects sensitive data exposure, enforces compliance rules, and provides real-time security alerts. Built as a full-stack application with React frontend and Express backend, it integrates with external services like Slack for notifications and uses Python scripts for advanced data analysis and anomaly detection.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build tooling
- **Styling**: Tailwind CSS with custom design system using CSS variables for theming
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessibility
- **State Management**: TanStack Query for server state management and caching
- **Real-time Updates**: WebSocket integration for live dashboard updates and alerts
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework using TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Real-time Communication**: WebSocket server for broadcasting live updates to connected clients
- **API Structure**: RESTful endpoints with WebSocket support for real-time features
- **Data Processing**: Python scripts for anomaly detection and data classification
- **Service Layer**: Modular services for monitoring, compliance, email notifications, and LLM scanning

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect for schema management and migrations
- **Schema**: Comprehensive data model including users, API sources, alerts, compliance rules, data classifications, LLM violations, incidents, and monitoring statistics
- **Storage Interface**: Abstract storage layer supporting both in-memory (development) and database implementations

### Security Features
- **API Monitoring**: Real-time tracking of API calls with rate limiting and anomaly detection
- **Data Classification**: Automated detection of PII, financial data, and other sensitive information
- **Compliance Engine**: Configurable rules for GDPR, SOC2, and custom compliance requirements
- **LLM Response Scanning**: Content filtering for financial advice and unverified data in AI responses
- **Incident Management**: Comprehensive logging and tracking of security incidents

### External Dependencies
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Slack Integration**: Real-time security alerts and notifications via Slack bot
- **Email Service**: SMTP-based email notifications for critical alerts
- **Python Runtime**: External Python scripts for advanced analytics and machine learning-based detection

## Documentation
Comprehensive documentation has been created covering all system components, security features, compliance frameworks, and user guidance:

- **Technical Documentation**: Complete system architecture, security features, and compliance implementation details
- **User Guide**: Step-by-step instructions for using all features including dashboard navigation, compliance filtering, and incident management
- **API Documentation**: Detailed API endpoints and integration patterns with SDKs and examples
- **Integration Guide**: Complete guide for connecting existing applications, AI models, and databases with security monitoring
- **Security Framework**: Multi-layered security approach with encryption, monitoring, and compliance controls
- **Compliance Standards**: Implementation of GDPR, SOC2, PCI DSS, and financial services regulations

## Recent Changes (2025-08-31)
- **ALL 5 PHASES COMPLETE**: Successfully implemented complete 14-day security monitoring plan
- **COMPREHENSIVE COMPLIANCE ENGINE**: Created advanced compliance system with automated triggers
- **Enhanced Plaid Integration**: Transaction & metadata extraction with real-time security monitoring
- **Backend Log Ingestion**: FastAPI and OpenAI usage logs automatically processed for security analysis
- **Advanced Pattern Detection**: Credit cards, SSNs, high-volume transactions, suspicious API calls
- **Monitoring Control Center**: Clear start/stop controls showing users exactly how to activate monitoring
- **Visual Workflow Integration**: Dashboard banner guides users through activation → testing → monitoring
- **Real-time Compliance Scanning**: Interactive testing interface with immediate violation detection
- **Production APIs Active**: 
  - `/api/compliance/scan` - Live compliance scanning with pattern detection
  - `/api/logs/fastapi` & `/api/logs/openai` - Real-time log processing 
  - `/api/plaid/transactions/pull` - Enhanced Plaid data extraction with security
  - `/api/compliance/config` - Dynamic rule management
- **JSON Configuration Engine**: 7 compliance rule categories (PII, Financial, API Security, AI Usage, GDPR, SOX)
- **Automated Discord Alerts**: Rich notifications for all security findings and violations
- **User-Friendly Activation**: Clear "Start Monitoring" workflow solves activation confusion
- **Practical Testing Tools**: Example buttons for PII, high-volume transactions, AI usage violations
- **Live Dashboard Integration**: Monitoring status banner shows activation state and quick actions