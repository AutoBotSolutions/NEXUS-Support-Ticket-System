require('dotenv').config();

// Initialize New Relic APM (if license key is available)
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const securityLogger = require('../middleware/securityLogger');
const { requestMetrics, metricsEndpoint } = require('../middleware/apmMonitoringSimple');
const { databaseMonitoring, monitorDatabasePerformance, databaseHealthCheck } = require('../middleware/databaseMonitoring');
const { securityMonitoring, enhancedAuthMonitoring, getSecurityDashboard } = require('../middleware/securityMonitoring');
const { getBIAnalytics, getKPIDashboard } = require('../middleware/businessIntelligence');
const { 
  getAlertStatus, 
  createAlertRule, 
  updateAlertRule, 
  deleteAlertRule, 
  silenceAlert 
} = require('../middleware/alertingSystem');
const { 
  loggingInfrastructure, 
  getLogStats, 
  searchLogs, 
  getLogTrends,
  LOG_LEVELS 
} = require('../middleware/loggingInfrastructureSimple');

// Import routes
const ticketRoutes = require('../routes/ticketRoutes');
const githubRoutes = require('../routes/githubRoutes');
const userRoutes = require('../routes/userRoutes');
const monitoringRoutes = require('../routes/monitoringRoutes');
const comprehensiveMonitoringRoutes = require('../routes/comprehensiveMonitoringRoutes');
const { sessionReplayMiddleware } = require('../middleware/sessionReplay');

const app = express();

// Try to connect to MongoDB (optional for testing)
let dbConnected = false;
try {
  const connectDB = require('../config/database');
  connectDB();
  dbConnected = true;
  console.log('MongoDB connection attempted');
} catch (error) {
  console.log('MongoDB not available, running in test mode');
}

// Initialize database monitoring (only if DB is connected)
if (dbConnected) {
  monitorDatabasePerformance();
}

// Initialize logging infrastructure
loggingInfrastructure.logSystem('NEXUS Support System started', LOG_LEVELS.INFO, {
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  dbConnected: dbConnected
});

// Security middleware
// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Helmet with explicit Content Security Policy
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
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request metrics middleware
app.use(requestMetrics);

// Authentication monitoring middleware
app.use(enhancedAuthMonitoring);

// Request logging
app.use(loggingInfrastructure.requestLogger());

// Security audit logging
app.use(securityLogger);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session replay middleware
app.use(sessionReplayMiddleware);

// API routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/users', userRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/comprehensive-monitoring', comprehensiveMonitoringRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dbConnected: dbConnected
  });
});

// Database health check endpoint
app.get('/api/health/database', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.json({
        status: 'disabled',
        message: 'Database not connected (running in test mode)'
      });
    }
    const health = await databaseHealthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', metricsEndpoint);

// Security dashboard endpoint
app.get('/api/security/dashboard', getSecurityDashboard);

// Business Intelligence endpoints
app.get('/api/bi/analytics', getBIAnalytics);
app.get('/api/bi/kpi', getKPIDashboard);

// Alerting endpoints
app.get('/api/alerts/status', getAlertStatus);
app.post('/api/alerts/rules', createAlertRule);
app.put('/api/alerts/rules/:ruleId', updateAlertRule);
app.delete('/api/alerts/rules/:ruleId', deleteAlertRule);
app.post('/api/alerts/:alertId/silence', silenceAlert);

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
  console.log(`NEXUS Support System running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access NEXUS`);
  console.log(`Database connected: ${dbConnected}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  loggingInfrastructure.logSystem(`Unhandled Rejection: ${err.message}`, LOG_LEVELS.ERROR, {
    stack: err.stack
  });
  // Close server & exit process
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
