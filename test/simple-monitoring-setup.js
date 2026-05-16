// Simple Monitoring Setup - Works without Docker
const express = require('express');
const fs = require('fs');
const path = require('path');

// Create simple monitoring server
const app = express();
const PORT = 3001; // Different port from main app

// Simple metrics storage
let metrics = {
  requests: 0,
  errors: 0,
  startTime: Date.now(),
  uptime: 0
};

// Simple log storage
let logs = [];

// Middleware to collect metrics
const collectMetrics = (req, res, next) => {
  metrics.requests++;
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      metrics.errors++;
    }
    
    // Log the request
    logs.push({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip
    });
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }
  });
  
  next();
};

app.use(collectMetrics);
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - metrics.startTime
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  metrics.uptime = Date.now() - metrics.startTime;
  
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP nexus_requests_total Total number of requests
# TYPE nexus_requests_total counter
nexus_requests_total ${metrics.requests}

# HELP nexus_errors_total Total number of errors
# TYPE nexus_errors_total counter
nexus_errors_total ${metrics.errors}

# HELP nexus_uptime_seconds Uptime in seconds
# TYPE nexus_uptime_seconds gauge
nexus_uptime_seconds ${metrics.uptime / 1000}
  `);
});

// Dashboard endpoint
app.get('/dashboard', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>NEXUS Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric { display: inline-block; margin: 10px 20px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; }
        .log-entry { padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 0.9em; }
        .status-200 { color: #4CAF50; }
        .status-400 { color: #FF9800; }
        .status-500 { color: #F44336; }
        h1 { color: #333; }
        h2 { color: #666; margin-top: 30px; }
        .refresh-btn { background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background: #1976D2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 NEXUS Monitoring Dashboard</h1>
        
        <div class="card">
            <h2>System Metrics</h2>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
            <div class="metric">
                <div class="metric-value">${metrics.requests}</div>
                <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric">
                <div class="metric-value">${metrics.errors}</div>
                <div class="metric-label">Errors</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.floor(metrics.uptime / 1000)}s</div>
                <div class="metric-label">Uptime</div>
            </div>
        </div>
        
        <div class="card">
            <h2>Recent Logs (Last 20)</h2>
            <div id="logs">
                ${logs.slice(-20).reverse().map(log => `
                    <div class="log-entry">
                        <span class="status-${log.statusCode >= 500 ? '500' : log.statusCode >= 400 ? '400' : '200'}">
                            [${log.timestamp}] ${log.method} ${log.url} → ${log.statusCode} (${log.duration}ms)
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="card">
            <h2>Quick Links</h2>
            <ul>
                <li><a href="http://localhost:3000" target="_blank">🎯 NEXUS Application</a></li>
                <li><a href="/metrics" target="_blank">📊 Raw Metrics</a></li>
                <li><a href="/health" target="_blank">💚 Health Check</a></li>
            </ul>
        </div>
        
        <div class="card">
            <h2>Setup Instructions</h2>
            <p><strong>Current Status:</strong> Simple monitoring is running!</p>
            <ol>
                <li>Main NEXUS app should run on <a href="http://localhost:3000" target="_blank">http://localhost:3000</a></li>
                <li>This monitoring dashboard is on <a href="http://localhost:3001" target="_blank">http://localhost:3001</a></li>
                <li>For full monitoring, install Docker and run: <code>docker-compose up -d</code></li>
            </ol>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>
  `);
});

// Start simple monitoring server
app.listen(PORT, () => {
  console.log(`🚀 Simple NEXUS Monitoring running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

// Export for use in main app
module.exports = { app, metrics, logs };
