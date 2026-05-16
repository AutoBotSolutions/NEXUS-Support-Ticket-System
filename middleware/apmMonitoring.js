const client = require('prom-client');

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label which can be used to identify metrics
register.setDefaultLabels({
  app: 'nexus-support-system'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for the NEXUS application
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseConnections = new client.Gauge({
  name: 'database_connections',
  help: 'Number of active database connections'
});

const ticketsCreated = new client.Counter({
  name: 'tickets_created_total',
  help: 'Total number of tickets created',
  labelNames: ['priority', 'category']
});

const usersRegistered = new client.Counter({
  name: 'users_registered_total',
  help: 'Total number of users registered'
});

const githubApiCalls = new client.Counter({
  name: 'github_api_calls_total',
  help: 'Total number of GitHub API calls',
  labelNames: ['endpoint', 'status']
});

const authenticationAttempts = new client.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['success', 'method']
});

const frontendErrors = new client.Counter({
  name: 'frontend_errors_total',
  help: 'Total number of frontend errors',
  labelNames: ['type', 'url']
});

const frontendPageLoadTime = new client.Histogram({
  name: 'frontend_page_load_time_seconds',
  help: 'Frontend page load time in seconds',
  labelNames: ['url'],
  buckets: [0.5, 1, 2, 3, 5, 7, 10, 15, 20]
});

const frontendApiCallTime = new client.Histogram({
  name: 'frontend_api_call_time_seconds',
  help: 'Frontend API call time in seconds',
  labelNames: ['endpoint', 'method', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 2, 3, 5, 7, 10]
});

const frontendUserInteractions = new client.Counter({
  name: 'frontend_user_interactions_total',
  help: 'Total number of frontend user interactions',
  labelNames: ['type']
});

const securityEvents = new client.Counter({
  name: 'security_events_total',
  help: 'Total number of security events',
  labelNames: ['event_type', 'severity']
});

const blockedIPs = new client.Gauge({
  name: 'blocked_ips_count',
  help: 'Number of currently blocked IP addresses'
});

const suspiciousIPs = new client.Gauge({
  name: 'suspicious_ips_count',
  help: 'Number of currently suspicious IP addresses'
});

const threatsDetected = new client.Counter({
  name: 'threats_detected_total',
  help: 'Total number of threats detected',
  labelNames: ['threat_type', 'severity']
});

const businessKPIs = new client.Gauge({
  name: 'business_kpi',
  help: 'Business KPI values',
  labelNames: ['kpi_name']
});

const ticketResolutionTime = new client.Histogram({
  name: 'ticket_resolution_time_hours',
  help: 'Time taken to resolve tickets in hours',
  labelNames: ['priority', 'category'],
  buckets: [0.5, 1, 2, 4, 8, 12, 24, 48, 72, 168]
});

const userActivity = new client.Counter({
  name: 'user_activity_total',
  help: 'User activity metrics',
  labelNames: ['activity_type', 'user_role']
});

const githubIntegration = new client.Gauge({
  name: 'github_integration_rate',
  help: 'GitHub integration success rate'
});

// Register the custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseConnections);
register.registerMetric(ticketsCreated);
register.registerMetric(usersRegistered);
register.registerMetric(githubApiCalls);
register.registerMetric(authenticationAttempts);
register.registerMetric(frontendErrors);
register.registerMetric(frontendPageLoadTime);
register.registerMetric(frontendApiCallTime);
register.registerMetric(frontendUserInteractions);
register.registerMetric(securityEvents);
register.registerMetric(blockedIPs);
register.registerMetric(suspiciousIPs);
register.registerMetric(threatsDetected);
register.registerMetric(businessKPIs);
register.registerMetric(ticketResolutionTime);
register.registerMetric(userActivity);
register.registerMetric(githubIntegration);

// Middleware to track HTTP requests
const requestMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// Business metrics tracking functions
const trackTicketCreated = (priority, category) => {
  ticketsCreated.labels(priority, category).inc();
};

const trackUserRegistered = () => {
  usersRegistered.inc();
};

const trackGitHubApiCall = (endpoint, status) => {
  githubApiCalls.labels(endpoint, status).inc();
};

const trackAuthenticationAttempt = (success, method) => {
  authenticationAttempts.labels(success, method).inc();
};

const updateActiveConnections = (count) => {
  activeConnections.set(count);
};

const updateDatabaseConnections = (count) => {
  databaseConnections.set(count);
};

// Frontend metrics tracking functions
const trackFrontendError = (type, url) => {
  frontendErrors.labels(type, url).inc();
};

const trackFrontendPageLoad = (url, duration) => {
  frontendPageLoadTime.labels(url).observe(duration);
};

const trackFrontendApiCall = (endpoint, method, status, duration) => {
  frontendApiCallTime.labels(endpoint, method, status).observe(duration);
};

const trackFrontendUserInteraction = (type) => {
  frontendUserInteractions.labels(type).inc();
};

// Security metrics tracking functions
const trackSecurityEvent = (eventType, severity) => {
  securityEvents.labels(eventType, severity).inc();
};

const updateBlockedIPs = (count) => {
  blockedIPs.set(count);
};

const updateSuspiciousIPs = (count) => {
  suspiciousIPs.set(count);
};

const trackThreatDetected = (threatType, severity) => {
  threatsDetected.labels(threatType, severity).inc();
};

// Business metrics tracking functions
const updateBusinessKPI = (kpiName, value) => {
  businessKPIs.labels(kpiName).set(value);
};

const trackTicketResolutionTime = (priority, category, hours) => {
  ticketResolutionTime.labels(priority, category).observe(hours);
};

const trackUserActivity = (activityType, userRole) => {
  userActivity.labels(activityType, userRole).inc();
};

const updateGitHubIntegrationRate = (rate) => {
  githubIntegration.set(rate);
};

// Metrics endpoint
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
};

module.exports = {
  requestMetrics,
  trackTicketCreated,
  trackUserRegistered,
  trackGitHubApiCall,
  trackAuthenticationAttempt,
  updateActiveConnections,
  updateDatabaseConnections,
  trackFrontendError,
  trackFrontendPageLoad,
  trackFrontendApiCall,
  trackFrontendUserInteraction,
  trackSecurityEvent,
  updateBlockedIPs,
  updateSuspiciousIPs,
  trackThreatDetected,
  updateBusinessKPI,
  trackTicketResolutionTime,
  trackUserActivity,
  updateGitHubIntegrationRate,
  metricsEndpoint,
  register
};
