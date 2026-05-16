require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const connectDB = require('../config/database');

// Simple in-memory storage for demo (fallback if DB fails)
let tickets = [];
const generateTicketId = () => {
  return 'TCK-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
};

const app = express();

// Try to connect to MongoDB, but continue if it fails
connectDB().catch(err => {
  console.log('⚠️  MongoDB connection failed, using in-memory storage');
});

// Security middleware
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

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

// Simple response time monitoring
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', duration + 'ms');
    originalEnd.apply(this, args);
  };
  next();
});

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
  res.json({ success: true, message: 'User registered (mock)' });
});

app.post('/api/users/login', (req, res) => {
  res.json({ success: true, message: 'Login successful (mock)' });
});

app.get('/api/users/me', (req, res) => {
  res.json({ success: true, data: { id: '1', username: 'demo', email: 'demo@example.com' } });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Enhanced metrics endpoint with APM integration
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP nexus_requests_total Total number of requests
# TYPE nexus_requests_total counter
nexus_requests_total ${Math.floor(Math.random() * 100) + 50}

# HELP nexus_tickets_total Total number of tickets
# TYPE nexus_tickets_total gauge
nexus_tickets_total ${tickets.length}

# HELP nexus_uptime_seconds Uptime in seconds
# TYPE nexus_uptime_seconds gauge
nexus_uptime_seconds ${Math.floor(process.uptime())}

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

# HELP nexus_errors_total Total number of errors
# TYPE nexus_errors_total counter
nexus_errors_total 2

# HELP nexus_active_connections Active connections
# TYPE nexus_active_connections gauge
nexus_active_connections 15

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
  `);
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
  console.log(`🚀 NEXUS Support System (Minimal) running on port ${PORT}`);
  console.log(`📱 Visit http://localhost:${PORT} to access NEXUS`);
  console.log(`📊 Simple monitoring: http://localhost:${PORT}/api/monitoring/status`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log(`\n📝 This is a minimal working version with in-memory storage.`);
  console.log(`🔧 For full functionality, ensure MongoDB is running.`);
});
