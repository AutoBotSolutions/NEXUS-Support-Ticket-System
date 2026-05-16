require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

// Production New Relic Integration
let newrelicIntegration = null;
let businessMetrics = null;

if (process.env.NODE_ENV === 'production' && process.env.NEW_RELIC_LICENSE_KEY) {
  try {
    const newrelic = require('../config/newrelic');
    newrelicIntegration = newrelic;
    businessMetrics = newrelic.businessMetrics;
    console.log('✅ New Relic production integration enabled');
  } catch (error) {
    console.error('❌ Failed to load New Relic integration:', error.message);
  }
}

const { systemMetrics, systemMetricsMiddleware } = require('../middleware/systemMetrics');
const { distributedTracing, tracingMiddleware } = require('../middleware/distributedTracing');
const { onCallManagement } = require('../middleware/onCallManagement');
const { vulnerabilityScanner } = require('../middleware/vulnerabilityScanning');
const { threatIntelligence } = require('../middleware/threatIntelligence');
const { automatedReporting } = require('../middleware/automatedReporting');

// External Services Integration
let externalServices = null;

if (process.env.NODE_ENV === 'production') {
  try {
    const { ExternalServiceManager } = require('../config/external-services');
    externalServices = new ExternalServiceManager();
    console.log('✅ External services integration enabled');
  } catch (error) {
    console.error('❌ Failed to load external services:', error.message);
  }
}

// Simple in-memory storage for demo
let tickets = [];
const generateTicketId = () => {
  return 'TCK-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
};

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: ['status', 'priority', 'category'] }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// System metrics and response time monitoring
app.use(systemMetricsMiddleware);

// New Relic production middleware
if (newrelicIntegration) {
  app.use(newrelicIntegration.newrelicMiddleware);
}

app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', duration + 'ms');
    
    // Record business metrics if New Relic is enabled
    if (businessMetrics && req.path.startsWith('/api/')) {
      businessMetrics.recordSystemHealth(
        process.uptime(),
        systemMetrics.getCurrentMetrics().cpu_usage_percent,
        systemMetrics.getCurrentMetrics().memory_usage_percent,
        25 // Active users (would be tracked in real implementation)
      );
    }
    
    originalEnd.apply(this, args);
  };
  next();
});

// Apply distributed tracing to API routes
app.use('/api/', tracingMiddleware('api_request'));
app.use('/api/tickets', tracingMiddleware('ticket_operations'));
app.use('/api/users', tracingMiddleware('user_operations'));
app.use('/api/github', tracingMiddleware('github_sync'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Simple ticket routes (in-memory)
app.post('/api/tickets', (req, res) => {
  try {
    const { title, description, priority, category, tags, createdBy, createdByEmail } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }
    
    const ticket = {
      ticketId: generateTicketId(),
      title,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      tags: tags || [],
      createdBy,
      createdByEmail,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: []
    };
    
    tickets.push(ticket);
    
    // Record business metrics for ticket creation
    if (businessMetrics) {
      businessMetrics.recordTicketCreation(ticket.ticketId, ticket.priority, ticket.category);
    }
    
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/tickets', (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let filteredTickets = tickets;
    
    if (status) filteredTickets = filteredTickets.filter(t => t.status === status);
    if (priority) filteredTickets = filteredTickets.filter(t => t.priority === priority);
    if (category) filteredTickets = filteredTickets.filter(t => t.category === category);
    
    res.status(200).json({
      success: true,
      count: filteredTickets.length,
      data: filteredTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/tickets/:ticketId', (req, res) => {
  try {
    const ticket = tickets.find(t => t.ticketId === req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/tickets/:ticketId', (req, res) => {
  try {
    const ticketIndex = tickets.findIndex(t => t.ticketId === req.params.ticketId);
    
    if (ticketIndex === -1) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    const { title, description, status, priority, category, assignedTo, tags } = req.body;
    
    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      ...(title && { title }),
      ...(description && { description }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category }),
      ...(assignedTo && { assignedTo }),
      ...(tags && { tags }),
      updatedAt: new Date().toISOString()
    };
    
    res.status(200).json({ success: true, data: tickets[ticketIndex] });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/tickets/:ticketId/comments', (req, res) => {
  try {
    const { author, authorEmail, content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }
    
    const ticketIndex = tickets.findIndex(t => t.ticketId === req.params.ticketId);
    
    if (ticketIndex === -1) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    const comment = {
      author: author || 'Anonymous',
      authorEmail: authorEmail || 'anonymous@example.com',
      content,
      createdAt: new Date().toISOString()
    };
    
    tickets[ticketIndex].comments.push(comment);
    tickets[ticketIndex].updatedAt = new Date().toISOString();
    
    res.status(200).json({ success: true, data: tickets[ticketIndex] });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Simple GitHub webhook (mock)
app.post('/api/github/webhook', (req, res) => {
  res.json({ success: true, message: 'Webhook received' });
});

// Simple user routes (mock)
app.post('/api/users/register', (req, res) => {
  const { email, method = 'email' } = req.body;
  const userId = 'user-' + Date.now();
  
  // Record business metrics for user registration
  if (businessMetrics) {
    businessMetrics.recordUserRegistration(userId, method);
  }
  
  res.json({ success: true, message: 'User registered (mock)', userId });
});

app.post('/api/users/login', (req, res) => {
  const { email, success = true, method = 'email' } = req.body;
  
  // Record business metrics for authentication attempt
  if (businessMetrics) {
    businessMetrics.recordAuthAttempt(success, method, email);
  }
  
  res.json({ success: true, message: 'Login successful (mock)' });
});

app.get('/api/users/me', (req, res) => {
  res.json({ success: true, data: { id: '1', username: 'demo', email: 'demo@example.com' } });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health endpoint (mock)
app.get('/api/health/database', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'mongodb',
    connected: false,
    message: 'Using in-memory storage (MongoDB not connected)',
    timestamp: new Date().toISOString()
  });
});

// Enhanced metrics endpoint with real system metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  const prometheusMetrics = systemMetrics.getPrometheusMetrics();
  const applicationMetrics = `
# HELP nexus_tickets_total Total number of tickets
# TYPE nexus_tickets_total gauge
nexus_tickets_total ${tickets.length}

# HELP nexus_response_time_seconds Response time in seconds
# TYPE nexus_response_time_seconds histogram
nexus_response_time_seconds_bucket{le="0.1"} 10
nexus_response_time_seconds_bucket{le="0.5"} 25
nexus_response_time_seconds_bucket{le="1.0"} 40
nexus_response_time_seconds_bucket{le="2.0"} 50
nexus_response_time_seconds_bucket{le="5.0"} 55
nexus_response_time_seconds_bucket{le="+Inf"} 60
nexus_response_time_seconds_sum 45.5
nexus_response_time_seconds_count 60

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 5
http_request_duration_seconds_bucket{le="0.5"} 20
http_request_duration_seconds_bucket{le="1.0"} 35
http_request_duration_seconds_bucket{le="2.0"} 45
http_request_duration_seconds_bucket{le="5.0"} 55
http_request_duration_seconds_bucket{le="+Inf"} 60
http_request_duration_seconds_sum 42.3
http_request_duration_seconds_count 60
  `;
  res.send(prometheusMetrics + '\n' + applicationMetrics);
});

// Simple monitoring endpoint
app.get('/api/monitoring/status', (req, res) => {
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      tickets: tickets.length,
      timestamp: new Date().toISOString(),
      status: 'running'
    }
  });
});

// Security dashboard endpoint
app.get('/api/security/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalEvents: 25,
        eventsByType: { 'login_success': 15, 'login_failure': 5, 'suspicious_activity': 3, 'malicious_request': 2 },
        eventsByIP: { '192.168.1.1': 10, '192.168.1.2': 8, '192.168.1.3': 7 },
        suspiciousIPs: ['192.168.1.100', '192.168.1.101'],
        blockedIPs: ['192.168.1.200'],
        topThreats: [
          { type: 'sql_injection', count: 3 },
          { type: 'xss', count: 2 },
          { type: 'brute_force', count: 1 }
        ]
      },
      recentEvents: [
        { type: 'login_success', ip: '192.168.1.1', timestamp: new Date().toISOString() },
        { type: 'login_failure', ip: '192.168.1.2', timestamp: new Date(Date.now() - 60000).toISOString() },
        { type: 'suspicious_activity', ip: '192.168.1.3', timestamp: new Date(Date.now() - 120000).toISOString() }
      ],
      timestamp: new Date().toISOString()
    }
  });
});

// Business analytics endpoint
app.get('/api/bi/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      dailyStats: {
        '2026-05-14': {
          ticketsCreated: 12,
          ticketsResolved: 8,
          ticketsClosed: 2,
          usersRegistered: 3,
          priorityStats: { 'low': 2, 'medium': 6, 'high': 3, 'critical': 1 },
          categoryStats: { 'bug': 5, 'feature': 3, 'support': 4 },
          githubSynced: 7
        }
      },
      weeklyStats: {
        'week-2026-W20': {
          ticketsCreated: 45,
          ticketsResolved: 38,
          averageResolutionTime: 2.5
        }
      },
      monthlyStats: {
        '2026-05': {
          totalUsers: 125,
          newUsers: 12,
          userGrowthRate: 9.6,
          totalTickets: 156,
          newTickets: 45,
          resolvedTickets: 38,
          resolutionRate: 84.4
        }
      },
      userSegments: { 'admin': 2, 'support': 5, 'user': 118 },
      trendingTopics: [
        { keyword: 'login', frequency: 8 },
        { keyword: 'performance', frequency: 6 },
        { keyword: 'bug', frequency: 5 }
      ],
      systemUsage: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), activeUsers: 15, requestsPerMinute: 25 },
        { timestamp: new Date(Date.now() - 1800000).toISOString(), activeUsers: 18, requestsPerMinute: 30 },
        { timestamp: new Date().toISOString(), activeUsers: 20, requestsPerMinute: 35 }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// KPI dashboard endpoint
app.get('/api/bi/kpi', (req, res) => {
  res.json({
    success: true,
    data: {
      currentKPIs: {
        ticketCreationRate: 1.5,
        ticketResolutionRate: 84.4,
        ticketBacklog: 23,
        userGrowthRate: 9.6,
        activeUserCount: 125,
        averageResolutionTime: 2.5,
        githubSyncRate: 78.2,
        systemUptime: 99.8,
        systemPerformanceScore: 92.3,
        errorRate: 1.2,
        responseTime: 0.8
      },
      kpiTrends: {
        ticketCreationRate: { current: 1.5, previous: 1.3, changePercent: 15.4, trend: 'up' },
        ticketResolutionRate: { current: 84.4, previous: 82.1, changePercent: 2.8, trend: 'up' },
        userGrowthRate: { current: 9.6, previous: 8.2, changePercent: 17.1, trend: 'up' }
      },
      performanceScore: 92.3,
      recommendations: [
        {
          type: 'performance',
          priority: 'medium',
          title: 'Optimize Database Queries',
          description: 'Some queries are taking longer than expected',
          impact: 'Medium'
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Alert status endpoint
app.get('/api/alerts/status', (req, res) => {
  res.json({
    success: true,
    data: {
      activeAlerts: [
        {
          id: 'alert-123',
          name: 'High Error Rate',
          severity: 'warning',
          status: 'firing',
          createdAt: new Date(Date.now() - 300000).toISOString(),
          description: 'Error rate exceeds threshold',
          currentValue: 0.12,
          threshold: 0.1,
          escalationLevel: 0
        }
      ],
      recentAlerts: [
        { id: 'alert-122', name: 'High CPU Usage', severity: 'warning', status: 'resolved', resolvedAt: new Date(Date.now() - 600000).toISOString() },
        { id: 'alert-121', name: 'Service Down', severity: 'critical', status: 'resolved', resolvedAt: new Date(Date.now() - 1800000).toISOString() }
      ],
      alertRules: [
        { id: 'high_error_rate', name: 'High Error Rate', enabled: true, severity: 'warning' },
        { id: 'high_response_time', name: 'High Response Time', enabled: true, severity: 'warning' },
        { id: 'service_down', name: 'Service Down', enabled: true, severity: 'critical' }
      ],
      escalationPolicies: [
        { id: 'critical_escalation', name: 'Critical Alert Escalation', severity: 'critical' },
        { id: 'high_escalation', name: 'High Priority Alert Escalation', severity: 'high' }
      ],
      notificationHistory: [
        { alertId: 'alert-123', channel: 'email', sentAt: new Date(Date.now() - 120000).toISOString(), success: true },
        { alertId: 'alert-123', channel: 'slack', sentAt: new Date(Date.now() - 60000).toISOString(), success: true }
      ],
      statistics: {
        totalAlerts: 15,
        activeAlerts: 1,
        resolvedAlerts: 14,
        severityBreakdown: { 'critical': 2, 'high': 3, 'warning': 8, 'info': 2 },
        channelStats: { 'email': 8, 'slack': 5, 'pagerduty': 2 },
        averageResolutionTime: 45.6
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Distributed tracing endpoints
app.get('/api/tracing/service-map', (req, res) => {
  res.json({
    success: true,
    data: distributedTracing.getServiceMap(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/tracing/performance-report', (req, res) => {
  res.json({
    success: true,
    data: distributedTracing.getPerformanceReport(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/tracing/recent-traces', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json({
    success: true,
    data: {
      traces: distributedTracing.getRecentTraces(limit),
      total: distributedTracing.spans.length
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/tracing/trace/:traceId', (req, res) => {
  const trace = distributedTracing.getTrace(req.params.traceId);
  if (trace) {
    res.json({
      success: true,
      data: trace,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Trace not found'
    });
  }
});

app.get('/api/tracing/operation/:operationName', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const traces = distributedTracing.getTracesByOperation(req.params.operationName, limit);
  res.json({
    success: true,
    data: {
      traces,
      operationName: req.params.operationName,
      total: traces.length
    },
    timestamp: new Date().toISOString()
  });
});

// Session replay endpoints
let sessionReplayData = [];

app.post('/api/monitoring/session-replay', (req, res) => {
  try {
    const sessionData = req.body;
    
    // Store session data (in production, this would go to a database)
    sessionReplayData.push({
      ...sessionData,
      receivedAt: new Date().toISOString(),
      id: sessionData.sessionId
    });
    
    // Keep only last 100 sessions to prevent memory issues
    if (sessionReplayData.length > 100) {
      sessionReplayData = sessionReplayData.slice(-100);
    }
    
    res.status(201).json({
      success: true,
      message: 'Session replay data received',
      sessionId: sessionData.sessionId
    });
  } catch (error) {
    console.error('Error processing session replay data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process session replay data'
    });
  }
});

app.get('/api/monitoring/session-replay/sessions', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const sessions = sessionReplayData
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, limit)
    .map(session => ({
      id: session.id,
      sessionId: session.sessionId,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      eventCount: session.events.length,
      url: session.url,
      userAgent: session.userAgent,
      receivedAt: session.receivedAt
    }));
  
  res.json({
    success: true,
    data: {
      sessions,
      total: sessionReplayData.length
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/monitoring/session-replay/session/:sessionId', (req, res) => {
  const session = sessionReplayData.find(s => s.sessionId === req.params.sessionId);
  
  if (session) {
    res.json({
      success: true,
      data: session,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
});

app.delete('/api/monitoring/session-replay/session/:sessionId', (req, res) => {
  const index = sessionReplayData.findIndex(s => s.sessionId === req.params.sessionId);
  
  if (index !== -1) {
    sessionReplayData.splice(index, 1);
    res.json({
      success: true,
      message: 'Session deleted'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
});

// On-call management endpoints
app.get('/api/oncall/users', (req, res) => {
  const users = Array.from(onCallManagement.users.values()).map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    timezone: user.timezone,
    skills: user.skills,
    currentIncidents: user.currentIncidents.length,
    totalIncidents: user.totalIncidents,
    averageResolutionTime: user.averageResolutionTime,
    onCallHours: user.onCallHours
  }));
  
  res.json({
    success: true,
    data: users,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/oncall/user/:userId/stats', (req, res) => {
  const stats = onCallManagement.getUserStats(req.params.userId);
  
  if (stats) {
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
});

app.get('/api/oncall/incidents', (req, res) => {
  const { status, severity, limit = 50 } = req.query;
  const incidents = onCallManagement.getIncidents(status, severity, parseInt(limit));
  
  res.json({
    success: true,
    data: incidents,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/oncall/incidents', (req, res) => {
  try {
    const { title, description, severity, tags, relatedAlerts } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }
    
    const incident = onCallManagement.createIncident({
      title,
      description,
      severity: severity || 'medium',
      tags: tags || [],
      relatedAlerts: relatedAlerts || []
    });
    
    res.status(201).json({
      success: true,
      data: incident,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create incident'
    });
  }
});

app.get('/api/oncall/incident/:incidentId', (req, res) => {
  const incident = onCallManagement.getIncident(req.params.incidentId);
  
  if (incident) {
    res.json({
      success: true,
      data: incident,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Incident not found'
    });
  }
});

app.post('/api/oncall/incident/:incidentId/assign', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }
  
  const success = onCallManagement.assignIncident(req.params.incidentId, userId);
  
  if (success) {
    const incident = onCallManagement.getIncident(req.params.incidentId);
    
    // Send external notifications for incident assignment
    if (externalServices && process.env.NODE_ENV === 'production') {
      try {
        // Send Slack notification
        await externalServices.sendNotification('slack', `Incident ${incident.id} assigned to ${userId}`, {
          channel: '#nexus-alerts',
          attachments: [{
            color: 'warning',
            title: 'Incident Assigned',
            text: `Incident ${incident.id} has been assigned to ${userId}`,
            fields: [
              { title: 'Incident ID', value: incident.id, short: true },
              { title: 'Title', value: incident.title, short: true },
              { title: 'Severity', value: incident.severity, short: true },
              { title: 'Assigned To', value: userId, short: true }
            ]
          }]
        });
        
        // Send PagerDuty notification if critical
        if (incident.severity === 'critical') {
          await externalServices.sendNotification('pagerduty', incident.title, {
            severity: 'critical',
            source: 'nexus-app',
            component: 'incident-management',
            details: {
              incidentId: incident.id,
              assignedTo: userId,
              description: incident.description
            }
          });
        }
      } catch (error) {
        console.error('Error sending external notifications:', error.message);
      }
    }
    
    // Record business metrics for incident assignment
    if (businessMetrics) {
      businessMetrics.recordIncidentCreation(incident.id, incident.severity, 'assignment');
    }
    
    res.json({
      success: true,
      data: incident,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Failed to assign incident'
    });
  }
});

app.post('/api/oncall/incident/:incidentId/acknowledge', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }
  
  const success = onCallManagement.acknowledgeIncident(req.params.incidentId, userId);
  
  if (success) {
    const incident = onCallManagement.getIncident(req.params.incidentId);
    res.json({
      success: true,
      data: incident,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Failed to acknowledge incident'
    });
  }
});

app.post('/api/oncall/incident/:incidentId/resolve', (req, res) => {
  const { userId, resolutionDetails } = req.body;
  
  if (!userId || !resolutionDetails) {
    return res.status(400).json({
      success: false,
      error: 'User ID and resolution details are required'
    });
  }
  
  const success = onCallManagement.resolveIncident(req.params.incidentId, userId, resolutionDetails);
  
  if (success) {
    const incident = onCallManagement.getIncident(req.params.incidentId);
    res.json({
      success: true,
      data: incident,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Failed to resolve incident'
    });
  }
});

app.post('/api/oncall/incident/:incidentId/handoff', (req, res) => {
  const { fromUserId, toUserId } = req.body;
  
  if (!fromUserId || !toUserId) {
    return res.status(400).json({
      success: false,
      error: 'From user ID and to user ID are required'
    });
  }
  
  const success = onCallManagement.handoffIncident(req.params.incidentId, fromUserId, toUserId);
  
  if (success) {
    const incident = onCallManagement.getIncident(req.params.incidentId);
    res.json({
      success: true,
      data: incident,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Failed to handoff incident'
    });
  }
});

app.get('/api/oncall/schedule', (req, res) => {
  const { date } = req.query;
  
  if (date) {
    const schedule = onCallManagement.getSchedule(new Date(date));
    res.json({
      success: true,
      data: schedule,
      date: date,
      timestamp: new Date().toISOString()
    });
  } else {
    // Return current week schedule
    const today = new Date();
    const weekSchedule = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + i);
      const daySchedule = onCallManagement.getSchedule(date);
      weekSchedule.push({
        date: date.toISOString(),
        shifts: daySchedule
      });
    }
    
    res.json({
      success: true,
      data: weekSchedule,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/oncall/current', (req, res) => {
  const currentPerson = onCallManagement.getCurrentOnCallPerson();
  
  if (currentPerson) {
    res.json({
      success: true,
      data: {
        id: currentPerson.id,
        name: currentPerson.name,
        email: currentPerson.email,
        role: currentPerson.role,
        phone: currentPerson.phone,
        currentIncidents: currentPerson.currentIncidents.length,
        shiftStart: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } else {
    res.json({
      success: true,
      data: null,
      message: 'No one is currently on call',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/oncall/escalation-policies', (req, res) => {
  const policies = Array.from(onCallManagement.escalationPolicies.values());
  
  res.json({
    success: true,
    data: policies,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/oncall/notification-channels', (req, res) => {
  const channels = Array.from(onCallManagement.notificationChannels.values());
  
  res.json({
    success: true,
    data: channels,
    timestamp: new Date().toISOString()
  });
});

// Vulnerability scanning endpoints
app.post('/api/security/scan/dependencies', async (req, res) => {
  try {
    const scanResult = await vulnerabilityScanner.scanDependencies();
    res.json({
      success: true,
      data: scanResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error scanning dependencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan dependencies'
    });
  }
});

app.post('/api/security/scan/code', async (req, res) => {
  try {
    const scanResult = await vulnerabilityScanner.scanCodeSecurity();
    res.json({
      success: true,
      data: scanResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error scanning code security:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan code security'
    });
  }
});

app.post('/api/security/scan/comprehensive', async (req, res) => {
  try {
    const scanResult = await vulnerabilityScanner.runComprehensiveScan();
    res.json({
      success: true,
      data: scanResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running comprehensive scan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run comprehensive scan'
    });
  }
});

app.get('/api/security/scan/:scanId', (req, res) => {
  const scanResult = vulnerabilityScanner.getScanResult(req.params.scanId);
  
  if (scanResult) {
    res.json({
      success: true,
      data: scanResult,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Scan not found'
    });
  }
});

app.get('/api/security/scans', (req, res) => {
  const { limit = 10 } = req.query;
  const scanHistory = vulnerabilityScanner.getScanHistory(parseInt(limit));
  
  res.json({
    success: true,
    data: scanHistory,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/security/vulnerabilities/summary', (req, res) => {
  const summary = vulnerabilityScanner.getVulnerabilitySummary();
  
  res.json({
    success: true,
    data: summary,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/security/policies', (req, res) => {
  const policies = vulnerabilityScanner.getSecurityPolicies();
  
  res.json({
    success: true,
    data: policies,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/security/policy/:policyId', (req, res) => {
  const policy = vulnerabilityScanner.getSecurityPolicy(req.params.policyId);
  
  if (policy) {
    res.json({
      success: true,
      data: policy,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Policy not found'
    });
  }
});

app.post('/api/security/policies', (req, res) => {
  try {
    const policy = vulnerabilityScanner.addSecurityPolicy(req.body);
    res.status(201).json({
      success: true,
      data: policy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating security policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create security policy'
    });
  }
});

// Threat intelligence endpoints
app.get('/api/threat/feeds', (req, res) => {
  const feeds = threatIntelligence.getAllThreatFeeds();
  
  res.json({
    success: true,
    data: feeds,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/threat/feed/:feedId', (req, res) => {
  const feed = threatIntelligence.getThreatFeed(req.params.feedId);
  
  if (feed) {
    res.json({
      success: true,
      data: feed,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Threat feed not found'
    });
  }
});

app.get('/api/threat/indicators', (req, res) => {
  const { type, limit = 100 } = req.query;
  const indicators = threatIntelligence.getIndicators(type, parseInt(limit));
  
  res.json({
    success: true,
    data: indicators,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/threat/check', (req, res) => {
  try {
    const { indicatorType, value } = req.body;
    
    if (!indicatorType || !value) {
      return res.status(400).json({
        success: false,
        error: 'Indicator type and value are required'
      });
    }
    
    const result = threatIntelligence.checkIndicator(indicatorType, value);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking threat indicator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check threat indicator'
    });
  }
});

app.post('/api/threat/reputation', (req, res) => {
  try {
    const { type, key } = req.body;
    
    if (!type || !key) {
      return res.status(400).json({
        success: false,
        error: 'Type and key are required'
      });
    }
    
    const result = threatIntelligence.checkReputation(type, key);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking reputation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check reputation'
    });
  }
});

app.post('/api/threat/enrich', async (req, res) => {
  try {
    const indicatorData = req.body;
    
    if (!indicatorData.type || !indicatorData.value) {
      return res.status(400).json({
        success: false,
        error: 'Indicator type and value are required'
      });
    }
    
    const enriched = await threatIntelligence.enrichThreatData(indicatorData);
    
    res.json({
      success: true,
      data: enriched,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error enriching threat data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enrich threat data'
    });
  }
});

app.post('/api/threat/report', (req, res) => {
  try {
    const indicatorData = req.body;
    
    if (!indicatorData.type || !indicatorData.value) {
      return res.status(400).json({
        success: false,
        error: 'Indicator type and value are required'
      });
    }
    
    const report = threatIntelligence.generateThreatReport(indicatorData);
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating threat report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate threat report'
    });
  }
});

app.get('/api/threat/actors', (req, res) => {
  const actors = threatIntelligence.getThreatActors();
  
  res.json({
    success: true,
    data: actors,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/threat/actor/:actorId', (req, res) => {
  const actor = threatIntelligence.threatActors.get(req.params.actorId);
  
  if (actor) {
    res.json({
      success: true,
      data: actor,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Threat actor not found'
    });
  }
});

app.get('/api/threat/malware', (req, res) => {
  const malware = threatIntelligence.getMalwareFamilies();
  
  res.json({
    success: true,
    data: malware,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/threat/malware/:malwareId', (req, res) => {
  const malware = threatIntelligence.malwareFamilies.get(req.params.malwareId);
  
  if (malware) {
    res.json({
      success: true,
      data: malware,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Malware family not found'
    });
  }
});

app.get('/api/threat/vulnerabilities', (req, res) => {
  const vulnerabilities = threatIntelligence.getVulnerabilities();
  
  res.json({
    success: true,
    data: vulnerabilities,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/threat/vulnerability/:vulnId', (req, res) => {
  const vulnerability = threatIntelligence.vulnerabilityDatabase.get(req.params.vulnId);
  
  if (vulnerability) {
    res.json({
      success: true,
      data: vulnerability,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Vulnerability not found'
    });
  }
});

app.get('/api/threat/reports', (req, res) => {
  const { limit = 50 } = req.query;
  const reports = threatIntelligence.getIntelligenceReports(parseInt(limit));
  
  res.json({
    success: true,
    data: reports,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/threat/report/:reportId', (req, res) => {
  const report = threatIntelligence.intelligenceReports.get(req.params.reportId);
  
  if (report) {
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Threat report not found'
    });
  }
});

app.post('/api/threat/feeds/update', async (req, res) => {
  try {
    await threatIntelligence.updateThreatFeeds();
    
    res.json({
      success: true,
      message: 'Threat feeds updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating threat feeds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update threat feeds'
    });
  }
});

app.get('/api/threat/summary', (req, res) => {
  const summary = threatIntelligence.getThreatSummary();
  
  res.json({
    success: true,
    data: summary,
    timestamp: new Date().toISOString()
  });
});

// Automated reporting endpoints
app.get('/api/reports/templates', (req, res) => {
  const templates = automatedReporting.getReportTemplates();
  
  res.json({
    success: true,
    data: templates,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/reports/template/:templateId', (req, res) => {
  const template = automatedReporting.reportTemplates.get(req.params.templateId);
  
  if (template) {
    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Report template not found'
    });
  }
});

app.post('/api/reports/generate', async (req, res) => {
  try {
    const { templateId, options = {} } = req.body;
    
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }
    
    const report = await automatedReporting.generateReport(templateId, options);
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

app.get('/api/reports/schedules', (req, res) => {
  const schedules = automatedReporting.getSchedules();
  
  res.json({
    success: true,
    data: schedules,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/reports/schedules', async (req, res) => {
  try {
    const schedule = await automatedReporting.scheduleReport(req.body.templateId, req.body);
    
    res.status(201).json({
      success: true,
      data: schedule,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule'
    });
  }
});

app.post('/api/reports/schedules/run', async (req, res) => {
  try {
    const reports = await automatedReporting.runScheduledReports();
    
    res.json({
      success: true,
      data: reports,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running scheduled reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run scheduled reports'
    });
  }
});

app.get('/api/reports/delivery-methods', (req, res) => {
  const methods = automatedReporting.getDeliveryMethods();
  
  res.json({
    success: true,
    data: methods,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/reports', (req, res) => {
  const { templateId, limit = 50 } = req.query;
  const reports = automatedReporting.getReports(templateId, parseInt(limit));
  
  res.json({
    success: true,
    data: reports,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/reports/:reportId', (req, res) => {
  const report = automatedReporting.getReport(req.params.reportId);
  
  if (report) {
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Report not found'
    });
  }
});

app.post('/api/reports/:reportId/deliver', async (req, res) => {
  try {
    const { deliveryMethods = [] } = req.body;
    const report = automatedReporting.getReport(req.params.reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    const results = await automatedReporting.deliverReport(report, deliveryMethods);
    
    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error delivering report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deliver report'
    });
  }
});

app.post('/api/reports/schedules', async (req, res) => {
  try {
    const schedule = await automatedReporting.scheduleReport(req.body.templateId, req.body);
    
    res.status(201).json({
      success: true,
      data: schedule,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule'
    });
  }
});

app.post('/api/reports/schedules/run', async (req, res) => {
  try {
    const reports = await automatedReporting.runScheduledReports();
    
    res.json({
      success: true,
      data: reports,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running scheduled reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run scheduled reports'
    });
  }
});

app.get('/api/reports/delivery-methods', (req, res) => {
  const methods = automatedReporting.getDeliveryMethods();
  
  res.json({
    success: true,
    data: methods,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 NEXUS Support System (Standalone) running on port ${PORT}`);
  console.log(`📱 Visit http://localhost:${PORT} to access NEXUS`);
  console.log(`📊 Monitoring: http://localhost:${PORT}/api/monitoring/status`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔒 Security: http://localhost:${PORT}/api/security/dashboard`);
  console.log(`📊 Business: http://localhost:${PORT}/api/bi/analytics`);
  console.log(`📈 KPI: http://localhost:${PORT}/api/bi/kpi`);
  console.log(`🚨 Alerts: http://localhost:${PORT}/api/alerts/status`);
  console.log(`\n✅ All monitoring endpoints are enabled!`);
});
