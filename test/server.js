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
const connectDB = require('../config/database');
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
const notificationRoutes = require('../routes/notificationRoutes');
const userManagementRoutes = require('../routes/userManagementRoutes');
const userManagementEnhancedRoutes = require('../routes/userManagementEnhancedRoutes');
const searchRoutes = require('../routes/searchRoutes');
const searchEnhancedRoutes = require('../routes/searchEnhancedRoutes');
const reportingRoutes = require('../routes/reportingRoutes');
const reportingEnhancedRoutes = require('../routes/reportingEnhancedRoutes');
const workflowAutomationRoutes = require('../routes/workflowAutomationRoutes');
const notificationDatabasePoolRoutes = require('../routes/notificationDatabasePoolRoutes');
const websocketRoutes = require('../routes/websocketRoutes');
const { sessionReplayMiddleware } = require('../middleware/sessionReplay');
const { sendNotification } = require('../middleware/notificationSystem');
const { addDocument, updateDocument, removeDocument } = require('../middleware/searchSystem');
const { initialize: initializeWebSocket, websocketServer } = require('../middleware/websocketServer');
const { initialize: initializeRealtimeNotifications } = require('../middleware/realtimeNotifications');

const app = express();

// Connect to MongoDB
connectDB();

// Initialize database monitoring
monitorDatabasePerformance();

// Initialize logging infrastructure
loggingInfrastructure.logSystem('NEXUS Support System started', LOG_LEVELS.INFO, {
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000
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
app.use(hpp({
  whitelist: ['status', 'priority', 'category']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Login attempt specific rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});
app.use('/api/users/login', loginLimiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Simple response time monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', duration + 'ms');
  });
  next();
});

// Request metrics tracking
app.use(requestMetrics);

// Database monitoring
app.use(databaseMonitoring);

// Security monitoring
app.use(securityMonitoring);

// Enhanced authentication monitoring
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
app.use('/api/admin', userManagementRoutes);
app.use('/api/users/management', userManagementEnhancedRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/search', searchEnhancedRoutes);
app.use('/api/reports', reportingRoutes);
app.use('/api/reports', reportingEnhancedRoutes);
app.use('/api/workflows', workflowAutomationRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/comprehensive-monitoring', comprehensiveMonitoringRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications', notificationDatabasePoolRoutes);
app.use('/api/websocket', websocketRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health check endpoint
app.get('/api/health/database', async (req, res) => {
  try {
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

// Logging endpoints
app.get('/api/logs/stats', getLogStats);
app.get('/api/logs/search', searchLogs);
app.get('/api/logs/trends', getLogTrends);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  loggingInfrastructure.error('Unhandled error', LOG_LEVELS.ERROR, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    }
  });
  
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  console.log(`NEXUS Support System running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access NEXUS`);
  
  // Initialize WebSocket server
  try {
    const websocketInitialized = initializeWebSocket(server, {
      corsOrigin: process.env.CORS_ORIGIN || "*"
    });
    
    if (websocketInitialized) {
      console.log('🚀 WebSocket server initialized successfully');
      
      // Initialize real-time notifications
      const realtimeInitialized = await initializeRealtimeNotifications();
      if (realtimeInitialized) {
        console.log('📬 Real-time notifications initialized successfully');
      } else {
        console.error('❌ Failed to initialize real-time notifications');
      }
    } else {
      console.error('❌ Failed to initialize WebSocket server');
    }
  } catch (error) {
    console.error('❌ Error initializing WebSocket system:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  // Shutdown WebSocket server
  if (websocketServer) {
    websocketServer.shutdown();
  }
  
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  // Shutdown WebSocket server
  if (websocketServer) {
    websocketServer.shutdown();
  }
  
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});
