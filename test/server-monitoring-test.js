require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { requestMetrics, metricsEndpoint } = require('../middleware/apmMonitoringSimple');
const { loggingInfrastructure, LOG_LEVELS } = require('../middleware/loggingInfrastructureSimple');
const { sessionReplayMiddleware } = require('../middleware/sessionReplay');

const app = express();

// Initialize logging infrastructure
loggingInfrastructure.logSystem('NEXUS Monitoring Test Server started', LOG_LEVELS.INFO, {
  version: '1.0.0',
  environment: 'development',
  port: process.env.PORT || 3000
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request metrics middleware
app.use(requestMetrics);

// Request logging
app.use(loggingInfrastructure.requestLogger());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session replay middleware
app.use(sessionReplayMiddleware);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'NEXUS Monitoring Test Server is running'
  });
});

// Database health check endpoint (mock)
app.get('/api/health/database', async (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Database health check (mock)',
    connected: false,
    mode: 'test'
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', metricsEndpoint);

// Frontend monitoring endpoints
app.post('/api/monitoring/error', (req, res) => {
  res.json({ success: true, message: 'Error logged' });
});

app.post('/api/monitoring/metrics', (req, res) => {
  res.json({ success: true, message: 'Metrics received' });
});

// Security monitoring endpoints
app.get('/api/security/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      threats: 0,
      vulnerabilities: 2,
      authFailures: 1,
      status: 'secure'
    }
  });
});

// Business intelligence endpoints
app.get('/api/bi/kpi', (req, res) => {
  res.json({
    success: true,
    data: {
      kpis: {
        resolutionTime: 120,
        satisfaction: 95,
        responseTime: 30
      }
    }
  });
});

app.get('/api/bi/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      analytics: {
        tickets: 50,
        users: 25,
        engagement: 85
      }
    }
  });
});

// Alerting endpoints
app.get('/api/alerts/status', (req, res) => {
  res.json({
    success: true,
    data: {
      active: 3,
      critical: 1,
      warning: 2,
      info: 0
    }
  });
});

// Logging endpoints
app.post('/api/comprehensive-monitoring/logs/search', (req, res) => {
  res.json({
    success: true,
    data: {
      logs: [
        { timestamp: '2024-01-01T12:00:00Z', level: 'info', message: 'Test log' }
      ],
      total: 1
    }
  });
});

// Session replay endpoints - must be defined before the GET route
app.post('/api/comprehensive-monitoring/session-replay/:sessionId/event', (req, res) => {
  res.json({
    success: true,
    data: { eventId: 'event-' + Date.now() }
  });
});

app.post('/api/comprehensive-monitoring/session-replay', (req, res) => {
  const sessionId = 'test-session-' + Date.now();
  res.json({
    success: true,
    data: { sessionId }
  });
});

app.get('/api/comprehensive-monitoring/session-replay', (req, res) => {
  res.json({
    success: true,
    data: {
      sessions: [
        { id: '1', startTime: '2024-01-01T12:00:00Z', duration: 300000, eventCount: 50 },
        { id: '2', startTime: '2024-01-01T11:30:00Z', duration: 180000, eventCount: 30 }
      ],
      analytics: { totalSessions: 2, averageSessionDuration: 240000, completionRate: 100 }
    }
  });
});

// Mock monitoring endpoints for testing
app.get('/api/comprehensive-monitoring/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      system: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      application: {
        metrics: { requests: 100, errors: 2, responseTime: 150 },
        responseTime: 150,
        errorRate: 2,
        throughput: 10
      },
      database: {
        status: 'healthy',
        connections: 5,
        queryTime: 25,
        health: 'healthy'
      },
      security: {
        threats: 0,
        vulnerabilities: 2,
        authFailures: 1,
        status: 'secure'
      },
      business: {
        tickets: 50,
        users: 25,
        githubSyncs: 100,
        engagement: 85
      },
      alerts: {
        active: 3,
        critical: 1,
        warning: 2,
        info: 0
      }
    }
  });
});

app.get('/api/comprehensive-monitoring/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      requests: { total: 100, errors: 2, errorRate: 2, averageResponseTime: 150 },
      database: { queries: 500, averageQueryTime: 25, queriesPerMinute: 10 },
      business: { ticketsCreated: 50, usersRegistered: 25, githubApiCalls: 100 },
      system: { memoryUsage: process.memoryUsage(), uptime: process.uptime() }
    }
  });
});

app.get('/api/comprehensive-monitoring/database', (req, res) => {
  res.json({
    success: true,
    data: {
      metrics: { connections: 5, queries: 500, avgQueryTime: 25 },
      health: { status: 'healthy', connected: false },
      performance: { queryTime: 25, connectionPool: 5 }
    }
  });
});

app.get('/api/comprehensive-monitoring/security', (req, res) => {
  res.json({
    success: true,
    data: {
      dashboard: { threats: 0, vulnerabilities: 2, authFailures: 1 },
      authentication: { attempts: 100, failures: 1, successRate: 99 },
      threats: { detected: 0, blocked: 0, severity: 'low' }
    }
  });
});

app.get('/api/comprehensive-monitoring/business', (req, res) => {
  res.json({
    success: true,
    data: {
      analytics: { tickets: 50, users: 25, engagement: 85 },
      kpis: { resolutionTime: 120, satisfaction: 95, responseTime: 30 }
    }
  });
});

app.get('/api/comprehensive-monitoring/alerts', (req, res) => {
  res.json({
    success: true,
    data: {
      active: 3,
      critical: 1,
      warning: 2,
      info: 0,
      alerts: [
        { id: 1, type: 'critical', message: 'High memory usage', time: '2024-01-01T12:00:00Z' },
        { id: 2, type: 'warning', message: 'Slow database query', time: '2024-01-01T11:30:00Z' },
        { id: 3, type: 'warning', message: 'High CPU usage', time: '2024-01-01T11:00:00Z' }
      ]
    }
  });
});

app.get('/api/comprehensive-monitoring/logging', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: { totalLogs: 1000, logsByLevel: { error: 10, warn: 50, info: 940 } },
      trends: { hourlyLogCounts: { 0: 50, 1: 30, 2: 20 } },
      levels: LOG_LEVELS
    }
  });
});

app.get('/api/comprehensive-monitoring/tracing', (req, res) => {
  res.json({
    success: true,
    data: {
      traces: [
        { id: '1', service: 'api', duration: 150, status: 'success' },
        { id: '2', service: 'database', duration: 25, status: 'success' }
      ],
      serviceMap: { api: { connections: ['database'] }, database: { connections: [] } },
      performanceBudgets: { api: { budget: 500, actual: 150 }, database: { budget: 100, actual: 25 } }
    }
  });
});

app.get('/api/comprehensive-monitoring/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: { system: { status: 'healthy' }, application: { responseTime: 150 } },
      metrics: { requests: { total: 100 }, database: { queries: 500 } },
      database: { status: 'healthy' },
      security: { status: 'secure' },
      business: { tickets: 50 },
      alerts: { active: 3 },
      logging: { totalLogs: 1000 },
      tracing: { traces: [] },
      sessionReplay: { sessions: [] }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  loggingInfrastructure.logSystem(`Global error: ${err.message}`, LOG_LEVELS.ERROR, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`NEXUS Monitoring Test Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access monitoring test`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  loggingInfrastructure.logSystem(`Unhandled Rejection: ${err.message}`, LOG_LEVELS.ERROR, {
    stack: err.stack
  });
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  loggingInfrastructure.logSystem(`Uncaught Exception: ${err.message}`, LOG_LEVELS.ERROR, {
    stack: err.stack
  });
  process.exit(1);
});

module.exports = app;
