/**
 * NEXUS Production New Relic Configuration
 * Production-ready New Relic APM integration
 */

require('newrelic');

// New Relic Configuration
exports.config = {
  // Application Configuration
  app_name: ['NEXUS-Support-System'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '',
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    enabled: process.env.NEW_RELIC_LOGGING_ENABLED === 'true'
  },
  
  // Agent Configuration
  agent_enabled: process.env.NEW_RELIC_AGENT_ENABLED !== 'false',
  utilization: {
    detect_aws: process.env.NEW_RELIC_DETECT_AWS === 'true',
    detect_pcf: process.env.NEW_RELIC_DETECT_PCF === 'true',
    detect_gcp: process.env.NEW_RELIC_DETECT_GCP === 'true',
    detect_azure: process.env.NEW_RELIC_DETECT_AZURE === 'true'
  },
  
  // Browser Monitoring
  browser_monitoring: {
    enabled: process.env.NEW_RELIC_BROWSER_MONITORING_ENABLED !== 'false'
  },
  
  // Error Collection
  error_collector: {
    enabled: process.env.NEW_RELIC_ERROR_COLLECTOR_ENABLED !== 'false',
    capture_source_map_exceptions: process.env.NEW_RELIC_CAPTURE_SOURCE_MAP === 'true'
  },
  
  // Transaction Tracing
  transaction_tracer: {
    enabled: process.env.NEW_RELIC_TRANSACTION_TRACER_ENABLED !== 'false',
    record_sql: process.env.NEW_RELIC_RECORD_SQL === 'true',
    stack_trace_threshold: process.env.NEW_RELIC_STACK_TRACE_THRESHOLD || 20,
    explain_enabled: process.env.NEW_RELIC_EXPLAIN_ENABLED === 'true',
    explain_threshold: process.env.NEW_RELIC_EXPLAIN_THRESHOLD || 0.5
  },
  
  // Distributed Tracing
  distributed_tracing: {
    enabled: process.env.NEW_RELIC_DISTRIBUTED_TRACING_ENABLED !== 'false',
    exclude_newrelic_header: false,
    trusted_account_key: process.env.NEW_RELIC_TRUSTED_ACCOUNT_KEY || ''
  },
  
  // Custom Metrics
  custom_insights_events: {
    enabled: process.env.NEW_RELIC_CUSTOM_INSIGHTS_ENABLED !== 'false',
    max_samples_stored: process.env.NEW_RELIC_MAX_SAMPLES_STORED || 1000
  },
  
  // Real User Monitoring
  real_user_monitoring: {
    enabled: process.env.NEW_RELIC_REAL_USER_MONITORING_ENABLED !== 'false',
    timing: {
      enabled: process.env.NEW_RELIC_RUM_TIMING_ENABLED !== 'false'
    }
  },
  
  // Serverless Mode
  serverless_mode: {
    enabled: process.env.NEW_RELIC_SERVERLESS_MODE_ENABLED === 'true'
  },
  
  // Logging
  logging: {
    enabled: process.env.NEW_RELIC_LOGGING_ENABLED === 'true',
    filepath: process.env.NEW_RELIC_LOG_FILE_PATH || '/var/log/newrelic/newrelic.log',
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info'
  },
  
  // Security
  security: {
    enabled: process.env.NEW_RELIC_SECURITY_ENABLED !== 'false',
    utils: {
      obfuscate_sql: process.env.NEW_RELIC_OBFUSCATE_SQL === 'true'
    }
  },
  
  // Application Logging
  application_logging: {
    enabled: process.env.NEW_RELIC_APPLICATION_LOGGING_ENABLED === 'true',
    forwarding: {
      enabled: process.env.NEW_RELIC_LOG_FORWARDING_ENABLED === 'true',
      max_samples_stored: process.env.NEW_RELIC_LOG_MAX_SAMPLES_STORED || 10000,
      log_level: process.env.NEW_RELIC_LOG_LEVEL || 'info'
    },
    metrics: {
      enabled: process.env.NEW_RELIC_LOG_METRICS_ENABLED === 'true'
    },
    local_decorating: {
      enabled: process.env.NEW_RELIC_LOG_DECORATING_ENABLED === 'false'
    }
  },
  
  // Slow Query Detection
  slow_sql: {
    enabled: process.env.NEW_RELIC_SLOW_SQL_ENABLED !== 'false',
    max_samples: process.env.NEW_RELIC_SLOW_SQL_MAX_SAMPLES || 10
  },
  
  // Database Monitoring
  database_monitoring: {
    enabled: process.env.NEW_RELIC_DATABASE_MONITORING_ENABLED !== 'false',
    mode: process.env.NEW_RELIC_DATABASE_MONITORING_MODE || 'automatic'
  },
  
  // Thread Profiling
  thread_profiler: {
    enabled: process.env.NEW_RELIC_THREAD_PROFILER_ENABLED === 'true'
  },
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Version
  version: process.env.APP_VERSION || '1.0.0'
};

// Custom Event and Metric API
const newrelic = require('newrelic');

// Custom Metrics Collection
class NewRelicMetrics {
  constructor() {
    this.metrics = new Map();
  }

  // Record custom metric
  recordMetric(name, value, attributes = {}) {
    try {
      newrelic.recordMetric(name, value, attributes);
    } catch (error) {
      console.error('Error recording New Relic metric:', error);
    }
  }

  // Record custom event
  recordCustomEvent(eventType, attributes = {}) {
    try {
      newrelic.recordCustomEvent(eventType, attributes);
    } catch (error) {
      console.error('Error recording New Relic custom event:', error);
    }
  }

  // Record database query
  recordDatabaseQuery(query, duration, attributes = {}) {
    try {
      newrelic.recordDatabaseQuery(query, duration, attributes);
    } catch (error) {
      console.error('Error recording New Relic database query:', error);
    }
  }

  // Record error
  recordError(error, attributes = {}) {
    try {
      newrelic.noticeError(error, attributes);
    } catch (err) {
      console.error('Error recording New Relic error:', err);
    }
  }

  // Add custom attribute to current transaction
  addCustomAttribute(key, value) {
    try {
      newrelic.addCustomAttribute(key, value);
    } catch (error) {
      console.error('Error adding New Relic custom attribute:', error);
    }
  }

  // Set transaction name
  setTransactionName(name) {
    try {
      newrelic.setTransactionName(name);
    } catch (error) {
      console.error('Error setting New Relic transaction name:', error);
    }
  }

  // Ignore current transaction
  ignoreTransaction() {
    try {
      newrelic.ignoreTransaction();
    } catch (error) {
      console.error('Error ignoring New Relic transaction:', error);
    }
  }
}

// Create metrics instance
const metrics = new NewRelicMetrics();

// Business Metrics Collection
class BusinessMetrics {
  constructor(newrelicMetrics) {
    this.metrics = newrelicMetrics;
  }

  // Record ticket creation
  recordTicketCreation(ticketId, priority, category) {
    this.metrics.recordCustomEvent('TicketCreated', {
      ticketId,
      priority,
      category,
      timestamp: new Date().toISOString()
    });
    this.metrics.recordMetric('Support/Tickets/Created', 1, {
      priority,
      category
    });
  }

  // Record ticket resolution
  recordTicketResolution(ticketId, resolutionTime, priority) {
    this.metrics.recordCustomEvent('TicketResolved', {
      ticketId,
      resolutionTime,
      priority,
      timestamp: new Date().toISOString()
    });
    this.metrics.recordMetric('Support/Tickets/ResolutionTime', resolutionTime, {
      priority
    });
  }

  // Record user registration
  recordUserRegistration(userId, method) {
    this.metrics.recordCustomEvent('UserRegistered', {
      userId,
      method,
      timestamp: new Date().toISOString()
    });
    this.metrics.recordMetric('Support/Users/Registered', 1, {
      method
    });
  }

  // Record authentication attempt
  recordAuthAttempt(success, method, userId = null) {
    this.metrics.recordCustomEvent('AuthAttempt', {
      success,
      method,
      userId,
      timestamp: new Date().toISOString()
    });
    this.metrics.recordMetric('Support/Auth/Attempts', 1, {
      success,
      method
    });
  }

  // Record GitHub API call
  recordGitHubAPICall(endpoint, method, status, duration) {
    this.metrics.recordCustomEvent('GitHubAPICall', {
      endpoint,
      method,
      status,
      duration,
      timestamp: new Date().toISOString()
    });
    this.metrics.recordMetric('Support/GitHub/API/Calls', 1, {
      endpoint,
      method,
      status
    });
  }

  // Record incident creation
  recordIncidentCreation(incidentId, severity, type) {
    this.metrics.recordCustomEvent('IncidentCreated', {
      incidentId,
      severity,
      type,
      timestamp: new Date().toISOString()
    });
    this.metrics.recordMetric('Support/Incidents/Created', 1, {
      severity,
      type
    });
  }

  // Record system health metrics
  recordSystemHealth(uptime, cpuUsage, memoryUsage, activeUsers) {
    this.metrics.recordCustomEvent('SystemHealth', {
      uptime,
      cpuUsage,
      memoryUsage,
      activeUsers,
      timestamp: new Date().toISOString()
    });
    this.metrics.recordMetric('System/Uptime', uptime);
    this.metrics.recordMetric('System/CPU/Usage', cpuUsage);
    this.metrics.recordMetric('System/Memory/Usage', memoryUsage);
    this.metrics.recordMetric('System/Active/Users', activeUsers);
  }
}

// Create business metrics instance
const businessMetrics = new BusinessMetrics(metrics);

// Middleware for automatic metrics collection
const newrelicMiddleware = (req, res, next) => {
  // Add request attributes
  metrics.addCustomAttribute('request.method', req.method);
  metrics.addCustomAttribute('request.url', req.url);
  metrics.addCustomAttribute('request.userAgent', req.get('User-Agent'));
  metrics.addCustomAttribute('request.ip', req.ip);
  
  // Add transaction name based on route
  const routeName = req.route ? req.route.path : req.path;
  metrics.setTransactionName(`${req.method} ${routeName}`);
  
  // Record start time
  const startTime = Date.now();
  
  // Record response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.addCustomAttribute('response.statusCode', res.statusCode);
    metrics.addCustomAttribute('response.duration', duration);
    
    // Record custom metrics for different endpoints
    if (req.path.startsWith('/api/tickets')) {
      metrics.recordMetric('API/Tickets/Requests', 1, {
        method: req.method,
        status: res.statusCode
      });
    } else if (req.path.startsWith('/api/users')) {
      metrics.recordMetric('API/Users/Requests', 1, {
        method: req.method,
        status: res.statusCode
      });
    } else if (req.path.startsWith('/api/security')) {
      metrics.recordMetric('API/Security/Requests', 1, {
        method: req.method,
        status: res.statusCode
      });
    }
  });
  
  next();
};

// Error handling middleware
const newrelicErrorHandler = (error, req, res, next) => {
  // Record error in New Relic
  metrics.recordError(error, {
    requestMethod: req.method,
    requestUrl: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Add error attributes
  metrics.addCustomAttribute('error.name', error.name);
  metrics.addCustomAttribute('error.message', error.message);
  metrics.addCustomAttribute('error.stack', error.stack);
  
  next(error);
};

// Database query monitoring
const monitorDatabaseQuery = (query, duration, database = 'mongodb') => {
  metrics.recordDatabaseQuery(query, duration, {
    database,
    timestamp: new Date().toISOString()
  });
  metrics.recordMetric('Database/Queries', 1, {
    database
  });
};

// Health check for New Relic
const checkNewRelicHealth = () => {
  try {
    const agent = require('newrelic').getAgent();
    return {
      connected: agent && agent.connected,
      configured: !!exports.config.license_key,
      enabled: exports.config.agent_enabled,
      app_name: exports.config.app_name,
      environment: exports.config.environment
    };
  } catch (error) {
    return {
      connected: false,
      configured: false,
      enabled: false,
      error: error.message
    };
  }
};

// Export all components
module.exports = {
  config: exports.config,
  metrics,
  businessMetrics,
  newrelicMiddleware,
  newrelicErrorHandler,
  monitorDatabaseQuery,
  checkNewRelicHealth
};
