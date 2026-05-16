require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { requestMetrics, metricsEndpoint } = require('../middleware/apmMonitoringSimple');
const { databaseMonitoring, databaseHealthCheck } = require('../middleware/databaseMonitoring');
const { securityMonitoring, getSecurityDashboard } = require('../middleware/securityMonitoring');
const { getBIAnalytics, getKPIDashboard } = require('../middleware/businessIntelligence');
const { getAlertStatus, createAlertRule } = require('../middleware/alertingSystem');
const { getLogStats, searchLogs, LOG_LEVELS } = require('../middleware/loggingInfrastructureSimple');
const { initializeSessionReplay, getSessionAnalytics } = require('../middleware/sessionReplay');
const { distributedTracing } = require('../middleware/distributedTracing');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request metrics tracking
app.use(requestMetrics);

// Security monitoring
app.use(securityMonitoring);

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', metricsEndpoint);

// Comprehensive monitoring routes
app.get('/api/comprehensive-monitoring/overview', async (req, res) => {
  try {
    const overview = {
      system: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      application: {
        metrics: { requests: { total: 100 }, errors: 0 },
        responseTime: 50,
        errorRate: 0,
        throughput: 10
      },
      database: {
        status: { status: 'healthy' },
        connections: 1,
        queryTime: 25,
        health: 'healthy'
      },
      security: {
        threats: 0,
        vulnerabilities: 0,
        authFailures: 0,
        status: 'secure'
      },
      business: {
        tickets: 50,
        users: 10,
        githubSyncs: 45,
        engagement: 85
      },
      alerts: {
        active: 0,
        critical: 0,
        warning: 0,
        info: 0
      },
      sessions: {
        active: 5,
        total: 100,
        averageDuration: 300000,
        completionRate: 95
      }
    };

    res.json({ success: true, data: overview });
  } catch (error) {
    console.error('Error getting monitoring overview:', error);
    res.status(500).json({ success: false, error: 'Failed to get monitoring overview' });
  }
});

app.get('/api/comprehensive-monitoring/metrics', async (req, res) => {
  try {
    const systemMetrics = { requests: { total: 100 }, database: { queries: 50 }, business: { ticketsCreated: 10 }, system: { memoryUsage: process.memoryUsage() } };
    res.json({ success: true, data: systemMetrics });
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to get system metrics' });
  }
});

app.get('/api/comprehensive-monitoring/database', async (req, res) => {
  try {
    const dbMetrics = { status: 'healthy', connections: 1 };
    const dbHealth = await databaseHealthCheck().catch(() => ({ status: 'simulated' }));
    
    res.json({
      success: true,
      data: {
        metrics: dbMetrics,
        health: dbHealth,
        performance: { status: 'good' }
      }
    });
  } catch (error) {
    console.error('Error getting database monitoring:', error);
    res.status(500).json({ success: false, error: 'Failed to get database monitoring' });
  }
});

app.get('/api/comprehensive-monitoring/security', async (req, res) => {
  try {
    let securityData;
    try {
      securityData = await getSecurityDashboard(req, res);
    } catch (err) {
      securityData = { data: { stats: { totalEvents: 0 } } };
    }
    
    res.json({
      success: true,
      data: {
        dashboard: securityData,
        authentication: { status: 'good' },
        threats: { count: 0 }
      }
    });
  } catch (error) {
    console.error('Error getting security monitoring:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to get security monitoring' });
    }
  }
});

app.get('/api/comprehensive-monitoring/business', async (req, res) => {
  try {
    let biData, kpiData;
    try {
      biData = await getBIAnalytics();
    } catch (err) {
      biData = { data: { dailyStats: {} } };
    }
    try {
      kpiData = await getKPIDashboard();
    } catch (err) {
      kpiData = { data: { currentKPIs: {} } };
    }
    
    res.json({
      success: true,
      data: {
        analytics: biData,
        kpis: kpiData
      }
    });
  } catch (error) {
    console.error('Error getting business intelligence:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to get business intelligence' });
    }
  }
});

app.get('/api/comprehensive-monitoring/alerts', async (req, res) => {
  try {
    let alertStatus;
    try {
      alertStatus = await getAlertStatus();
    } catch (err) {
      alertStatus = { data: { activeAlerts: [], alertRules: [] } };
    }
    
    res.json({
      success: true,
      data: alertStatus.data || alertStatus
    });
  } catch (error) {
    console.error('Error getting alerting system:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to get alerting system' });
    }
  }
});

app.post('/api/comprehensive-monitoring/alerts/rules', async (req, res) => {
  try {
    const ruleData = req.body;
    const result = await createAlertRule(req, res).catch(() => ({ success: true }));
    
    res.json(result);
  } catch (error) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({ success: false, error: 'Failed to create alert rule' });
  }
});

app.get('/api/comprehensive-monitoring/logging', async (req, res) => {
  try {
    const logStats = await getLogStats().catch(() => ({ totalLogs: 100, logsByLevel: { info: 80, warn: 15, error: 5 } }));
    const logTrends = { hourlyLogCounts: { 10: 5, 11: 10, 12: 15 } };
    
    res.json({
      success: true,
      data: {
        stats: logStats,
        trends: logTrends,
        levels: LOG_LEVELS
      }
    });
  } catch (error) {
    console.error('Error getting logging infrastructure:', error);
    res.status(500).json({ success: false, error: 'Failed to get logging infrastructure' });
  }
});

app.get('/api/comprehensive-monitoring/tracing', async (req, res) => {
  try {
    const traces = distributedTracing.getRecentTraces(10);
    const serviceMap = distributedTracing.getServiceMap();
    
    res.json({
      success: true,
      data: {
        traces,
        serviceMap,
        performanceBudgets: { status: 'good' }
      }
    });
  } catch (error) {
    console.error('Error getting distributed tracing:', error);
    res.status(500).json({ success: false, error: 'Failed to get distributed tracing' });
  }
});

app.get('/api/comprehensive-monitoring/session-replay', async (req, res) => {
  try {
    const filters = {};
    const sessionList = [];
    const analytics = await getSessionAnalytics(filters).catch(() => ({ totalSessions: 0 }));
    
    res.json({
      success: true,
      data: {
        sessions: sessionList,
        analytics
      }
    });
  } catch (error) {
    console.error('Error getting session replay data:', error);
    res.status(500).json({ success: false, error: 'Failed to get session replay data' });
  }
});

app.post('/api/comprehensive-monitoring/session-replay', async (req, res) => {
  try {
    const sessionData = req.body;
    const sessionId = 'test-session-' + Date.now();
    
    res.json({
      success: true,
      data: { sessionId }
    });
  } catch (error) {
    console.error('Error creating session replay:', error);
    res.status(500).json({ success: false, error: 'Failed to create session replay' });
  }
});

app.post('/api/comprehensive-monitoring/session-replay/:sessionId/event', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const eventData = req.body;
    
    res.json({ success: true, eventId: 'test-event-' + Date.now() });
  } catch (error) {
    console.error('Error recording session event:', error);
    res.status(500).json({ success: false, error: 'Failed to record session event' });
  }
});

app.get('/api/comprehensive-monitoring/dashboard', async (req, res) => {
  try {
    const overview = { status: 'healthy' };
    const metrics = { requests: { total: 100 } };
    const database = { status: 'healthy' };
    const security = { threats: 0 };
    const business = { tickets: 50 };
    const alerts = { active: 0 };
    const logging = { totalLogs: 100 };
    const tracing = { traces: [] };
    const sessionReplay = { sessions: [] };

    res.json({
      success: true,
      data: {
        overview,
        metrics,
        database,
        security,
        business,
        alerts,
        logging,
        tracing,
        sessionReplay
      }
    });
  } catch (error) {
    console.error('Error getting comprehensive dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to get comprehensive dashboard' });
  }
});

app.post('/api/comprehensive-monitoring/logs/search', async (req, res) => {
  try {
    const { query, filters } = req.body;
    const results = { logs: [], total: 0, query, filters };
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({ success: false, error: 'Failed to search logs' });
  }
});

app.delete('/api/comprehensive-monitoring/alerts/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    
    res.json({
      success: true,
      message: 'Alert rule deleted'
    });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    res.status(500).json({ success: false, error: 'Failed to delete alert rule' });
  }
});

// Initialize session replay
initializeSessionReplay();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 NEXUS Monitoring Test Server running on port ${PORT}`);
  console.log(`📊 Monitoring endpoints available at http://localhost:${PORT}/api/comprehensive-monitoring/*`);
  console.log(`🔍 Health check at http://localhost:${PORT}/api/health`);
  console.log(`📈 Metrics at http://localhost:${PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});
