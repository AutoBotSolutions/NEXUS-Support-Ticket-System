const { performance } = require('perf_hooks');

// Simple metrics storage
const metrics = {
    requests: {
        total: 0,
        errors: 0,
        responseTimes: []
    },
    database: {
        connections: 0,
        queries: 0,
        queryTimes: []
    },
    business: {
        ticketsCreated: 0,
        usersRegistered: 0,
        githubApiCalls: 0
    },
    system: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
    }
};

// Request metrics middleware
const requestMetrics = (req, res, next) => {
    const startTime = performance.now();
    
    res.on('finish', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        metrics.requests.total++;
        metrics.requests.responseTimes.push(responseTime);
        
        if (res.statusCode >= 400) {
            metrics.requests.errors++;
        }
        
        // Keep only last 1000 response times
        if (metrics.requests.responseTimes.length > 1000) {
            metrics.requests.responseTimes = metrics.requests.responseTimes.slice(-1000);
        }
    });
    
    next();
};

// Track business metrics
const trackTicketCreated = (priority, category) => {
    metrics.business.ticketsCreated++;
};

const trackUserRegistered = () => {
    metrics.business.usersRegistered++;
};

const trackGitHubApiCall = () => {
    metrics.business.githubApiCalls++;
};

// Track database metrics
const trackDatabaseQuery = (queryTime) => {
    metrics.database.queries++;
    metrics.database.queryTimes.push(queryTime);
    
    if (metrics.database.queryTimes.length > 1000) {
        metrics.database.queryTimes = metrics.database.queryTimes.slice(-1000);
    }
};

// Get metrics summary
const getMetricsSummary = () => {
    const avgResponseTime = metrics.requests.responseTimes.length > 0 
        ? metrics.requests.responseTimes.reduce((a, b) => a + b, 0) / metrics.requests.responseTimes.length 
        : 0;
    
    const avgQueryTime = metrics.database.queryTimes.length > 0 
        ? metrics.database.queryTimes.reduce((a, b) => a + b, 0) / metrics.database.queryTimes.length 
        : 0;
    
    const errorRate = metrics.requests.total > 0 
        ? (metrics.requests.errors / metrics.requests.total) * 100 
        : 0;
    
    return {
        requests: {
            total: metrics.requests.total,
            errors: metrics.requests.errors,
            errorRate: errorRate.toFixed(2),
            averageResponseTime: avgResponseTime.toFixed(2),
            requestsPerMinute: metrics.requests.total / (process.uptime() / 60)
        },
        database: {
            queries: metrics.database.queries,
            averageQueryTime: avgQueryTime.toFixed(2),
            queriesPerMinute: metrics.database.queries / (process.uptime() / 60)
        },
        business: {
            ticketsCreated: metrics.business.ticketsCreated,
            usersRegistered: metrics.business.usersRegistered,
            githubApiCalls: metrics.business.githubApiCalls
        },
        system: {
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            cpuUsage: process.cpuUsage()
        }
    };
};

// Metrics endpoint
const metricsEndpoint = (req, res) => {
    const summary = getMetricsSummary();
    
    // Simple Prometheus-like format
    const prometheusMetrics = `
# HELP nexus_requests_total Total number of HTTP requests
# TYPE nexus_requests_total counter
nexus_requests_total ${metrics.requests.total}

# HELP nexus_requests_errors Total number of HTTP errors
# TYPE nexus_requests_errors counter
nexus_requests_errors ${metrics.requests.errors}

# HELP nexus_response_time_average Average response time in milliseconds
# TYPE nexus_response_time_average gauge
nexus_response_time_average ${summary.requests.averageResponseTime}

# HELP nexus_database_queries_total Total number of database queries
# TYPE nexus_database_queries_total counter
nexus_database_queries_total ${metrics.database.queries}

# HELP nexus_database_query_time_average Average database query time in milliseconds
# TYPE nexus_database_query_time_average gauge
nexus_database_query_time_average ${summary.database.averageQueryTime}

# HELP nexus_tickets_created_total Total number of tickets created
# TYPE nexus_tickets_created_total counter
nexus_tickets_created_total ${metrics.business.ticketsCreated}

# HELP nexus_users_registered_total Total number of users registered
# TYPE nexus_users_registered_total counter
nexus_users_registered_total ${metrics.business.usersRegistered}

# HELP nexus_github_api_calls_total Total number of GitHub API calls
# TYPE nexus_github_api_calls_total counter
nexus_github_api_calls_total ${metrics.business.githubApiCalls}

# HELP nexus_memory_usage_bytes Memory usage in bytes
# TYPE nexus_memory_usage_bytes gauge
nexus_memory_usage_bytes ${metrics.system.memoryUsage.heapUsed}

# HELP nexus_uptime_seconds Process uptime in seconds
# TYPE nexus_uptime_seconds counter
nexus_uptime_seconds ${metrics.system.uptime}
`;
    
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics.trim());
};

// Frontend tracking functions (for compatibility)
const trackFrontendError = (type, url) => {
    console.log(`Frontend error tracked: ${type} at ${url}`);
};

const trackFrontendPageLoad = (url, loadTime) => {
    console.log(`Frontend page load tracked: ${url} - ${loadTime}ms`);
};

const trackFrontendUserInteraction = (type) => {
    console.log(`Frontend user interaction tracked: ${type}`);
};

const trackFrontendApiCall = (url, method, status) => {
    console.log(`Frontend API call tracked: ${method} ${url} - ${status}`);
};

// Additional functions for compatibility
const updateBusinessKPI = (kpiData) => {
    console.log('Business KPI updated:', kpiData);
};

const trackTicketResolutionTime = (resolutionTime) => {
    console.log(`Ticket resolution time tracked: ${resolutionTime}ms`);
};

const trackUserActivity = (activity) => {
    console.log('User activity tracked:', activity);
};

const updateGitHubIntegrationRate = (rate) => {
    console.log(`GitHub integration rate updated: ${rate}%`);
};

const trackAuthenticationAttempt = (result, ip) => {
    console.log(`Authentication attempt tracked: ${result} from ${ip}`);
};

const trackSecurityEvent = (event) => {
    console.log('Security event tracked:', event);
};

const updateBlockedIPs = (count) => {
    console.log(`Blocked IPs updated: ${count}`);
};

const updateSuspiciousIPs = (count) => {
    console.log(`Suspicious IPs updated: ${count}`);
};

const trackThreatDetected = (threat) => {
    console.log('Threat detected:', threat);
};

const updateDatabaseConnections = (count) => {
    metrics.database.connections = count;
};

module.exports = {
    requestMetrics,
    metricsEndpoint,
    trackTicketCreated,
    trackUserRegistered,
    trackGitHubApiCall,
    trackDatabaseQuery,
    getMetricsSummary,
    trackFrontendError,
    trackFrontendPageLoad,
    trackFrontendUserInteraction,
    trackFrontendApiCall,
    updateBusinessKPI,
    trackTicketResolutionTime,
    trackUserActivity,
    updateGitHubIntegrationRate,
    trackAuthenticationAttempt,
    trackSecurityEvent,
    updateBlockedIPs,
    updateSuspiciousIPs,
    trackThreatDetected,
    updateDatabaseConnections,
    metrics
};
