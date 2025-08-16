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