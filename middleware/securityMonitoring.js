const crypto = require('crypto');
const { 
  trackAuthenticationAttempt, 
  trackSecurityEvent, 
  updateBlockedIPs, 
  updateSuspiciousIPs, 
  trackThreatDetected 
} = require('./apmMonitoringSimple');

// Security event types
const SECURITY_EVENTS = {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILURE: 'login_failure',
    BRUTE_FORCE_DETECTED: 'brute_force_detected',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    UNAUTHORIZED_ACCESS: 'unauthorized_access',
    MALICIOUS_REQUEST: 'malicious_request',
    INJECTION_ATTEMPT: 'injection_attempt',
    XSS_ATTEMPT: 'xss_attempt',
    CSRF_ATTEMPT: 'csrf_attempt',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    ANOMALOUS_BEHAVIOR: 'anomalous_behavior',
    SECURITY_VIOLATION: 'security_violation',
    THREAT_INTELLIGENCE: 'threat_intelligence'
};

// Security monitoring data store (in production, use database)
const securityEvents = [];
const suspiciousIPs = new Set();
const blockedIPs = new Set();
const userBehaviorPatterns = new Map();

// Rate limiting for security events
const securityEventRateLimit = new Map();

class SecurityMonitor {
    constructor() {
        this.initializeThreatPatterns();
        this.startPeriodicCleanup();
    }

    initializeThreatPatterns() {
        // Common attack patterns
        this.threatPatterns = {
            sqlInjection: [
                /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
                /(\b(UNION|OR|AND)\b.*\b(1=1|1=2|true|false)\b)/i,
                /(--|#|\/\*|\*\/)/,
                /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR)\b)/i
            ],
            xss: [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/i,
                /on\w+\s*=/i,
                /<iframe\b[^>]*>/gi,
                /<object\b[^>]*>/gi,
                /<embed\b[^>]*>/gi
            ],
            pathTraversal: [
                /\.\.\//g,
                /\.\.\\/g,
                /%2e%2e%2f/gi,
                /%2e%2e%5c/gi
            ],
            commandInjection: [
                /(;|\||&|`|\$\()/,
                /(rm|del|format|shutdown|reboot|halt)/i,
                /(wget|curl|nc|netcat)/i,
                /(eval|exec|system|passthru)/i
            ]
        };
    }

    startPeriodicCleanup() {
        // Clean up old data every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 3600000);
    }

    cleanupOldData() {
        const oneHourAgo = Date.now() - 3600000;
        
        // Clean old security events
        while (securityEvents.length > 0 && securityEvents[0].timestamp < oneHourAgo) {
            securityEvents.shift();
        }
        
        // Clean rate limiting data
        for (const [key, data] of securityEventRateLimit.entries()) {
            if (data.lastReset < oneHourAgo) {
                securityEventRateLimit.delete(key);
            }
        }
    }

    detectThreats(req) {
        const threats = [];
        const url = req.url;
        const body = JSON.stringify(req.body);
        const headers = JSON.stringify(req.headers);
        const userAgent = req.get('User-Agent') || '';
        const ip = req.ip;

        // Check for SQL injection
        for (const pattern of this.threatPatterns.sqlInjection) {
            if (pattern.test(url) || pattern.test(body)) {
                threats.push({ type: 'sql_injection', pattern: pattern.toString(), severity: 'high' });
            }
        }

        // Check for XSS
        for (const pattern of this.threatPatterns.xss) {
            if (pattern.test(url) || pattern.test(body)) {
                threats.push({ type: 'xss', pattern: pattern.toString(), severity: 'high' });
            }
        }

        // Check for path traversal
        for (const pattern of this.threatPatterns.pathTraversal) {
            if (pattern.test(url)) {
                threats.push({ type: 'path_traversal', pattern: pattern.toString(), severity: 'medium' });
            }
        }

        // Check for command injection
        for (const pattern of this.threatPatterns.commandInjection) {
            if (pattern.test(body)) {
                threats.push({ type: 'command_injection', pattern: pattern.toString(), severity: 'critical' });
            }
        }

        // Check for suspicious user agents
        const suspiciousAgents = [
            /bot/i, /crawler/i, /spider/i, /scraper/i,
            /curl/i, /wget/i, /python/i, /java/i,
            /sqlmap/i, /nikto/i, /nmap/i
        ];

        for (const pattern of suspiciousAgents) {
            if (pattern.test(userAgent)) {
                threats.push({ type: 'suspicious_user_agent', pattern: pattern.toString(), severity: 'low' });
            }
        }

        // Check for missing headers
        if (!req.get('User-Agent')) {
            threats.push({ type: 'missing_user_agent', severity: 'low' });
        }

        return threats;
    }

    detectAnomalies(req) {
        const anomalies = [];
        const ip = req.ip;
        const userAgent = req.get('User-Agent') || '';
        const endpoint = req.path;

        // Check request frequency
        const rateKey = `${ip}:${endpoint}`;
        const now = Date.now();
        const rateData = securityEventRateLimit.get(rateKey) || { count: 0, lastReset: now };

        if (now - rateData.lastReset > 60000) { // Reset every minute
            rateData.count = 0;
            rateData.lastReset = now;
        }

        rateData.count++;
        securityEventRateLimit.set(rateKey, rateData);

        if (rateData.count > 100) { // More than 100 requests per minute
            anomalies.push({ type: 'high_request_frequency', count: rateData.count, severity: 'medium' });
        }

        // Check for unusual request patterns
        if (req.method === 'POST' && !req.get('Content-Type')) {
            anomalies.push({ type: 'post_without_content_type', severity: 'low' });
        }

        // Check for large payloads
        const contentLength = parseInt(req.get('Content-Length') || '0');
        if (contentLength > 1000000) { // > 1MB
            anomalies.push({ type: 'large_payload', size: contentLength, severity: 'medium' });
        }

        return anomalies;
    }

    logSecurityEvent(eventType, req, additionalData = {}) {
        const event = {
            id: crypto.randomUUID(),
            type: eventType,
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.url,
            headers: this.sanitizeHeaders(req.headers),
            body: this.sanitizeBody(req.body),
            ...additionalData
        };

        securityEvents.push(event);

        // Track in Prometheus
        const severity = this.getEventSeverity(eventType);
        trackSecurityEvent(eventType, severity);

        // Keep only last 1000 events
        if (securityEvents.length > 1000) {
            securityEvents.shift();
        }

        // Log to console for immediate visibility
        console.warn(`[SECURITY] ${eventType}:`, {
            ip: event.ip,
            url: event.url,
            timestamp: event.timestamp,
            ...additionalData
        });

        return event;
    }

    getEventSeverity(eventType) {
        const severityMap = {
            'login_success': 'info',
            'login_failure': 'warning',
            'brute_force_detected': 'critical',
            'suspicious_activity': 'medium',
            'unauthorized_access': 'high',
            'malicious_request': 'critical',
            'injection_attempt': 'critical',
            'xss_attempt': 'critical',
            'csrf_attempt': 'high',
            'rate_limit_exceeded': 'medium',
            'anomalous_behavior': 'medium',
            'security_violation': 'high',
            'threat_intelligence': 'high'
        };
        
        return severityMap[eventType] || 'info';
    }

    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        // Remove sensitive headers
        delete sanitized.authorization;
        delete sanitized.cookie;
        delete sanitized['x-api-key'];
        return sanitized;
    }

    sanitizeBody(body) {
        if (!body || typeof body !== 'object') return body;
        
        const sanitized = { ...body };
        // Remove sensitive fields
        delete sanitized.password;
        delete sanitized.token;
        delete sanitized.secret;
        delete sanitized.key;
        return sanitized;
    }

    blockIP(ip, duration = 3600000) { // Default 1 hour
        blockedIPs.add(ip);
        updateBlockedIPs(blockedIPs.size);
        
        setTimeout(() => {
            blockedIPs.delete(ip);
            updateBlockedIPs(blockedIPs.size);
        }, duration);
        
        this.logSecurityEvent(SECURITY_EVENTS.SECURITY_VIOLATION, { ip, url: '/blocked' }, {
            action: 'ip_blocked',
            duration: duration
        });
        
        trackSecurityEvent('ip_blocked', 'high');
    }

    isIPBlocked(ip) {
        return blockedIPs.has(ip);
    }

    isIPSuspicious(ip) {
        return suspiciousIPs.has(ip);
    }

    markIPSuspicious(ip, reason) {
        suspiciousIPs.add(ip);
        updateSuspiciousIPs(suspiciousIPs.size);
        
        this.logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, { ip, url: '/suspicious' }, {
            reason: reason
        });
        
        trackSecurityEvent('ip_suspicious', 'medium');
    }

    getSecurityStats() {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        
        const recentEvents = securityEvents.filter(event => 
            new Date(event.timestamp).getTime() > oneHourAgo
        );

        const eventsByType = {};
        const eventsByIP = {};
        
        recentEvents.forEach(event => {
            eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
            eventsByIP[event.ip] = (eventsByIP[event.ip] || 0) + 1;
        });

        return {
            totalEvents: recentEvents.length,
            eventsByType,
            eventsByIP,
            suspiciousIPs: Array.from(suspiciousIPs),
            blockedIPs: Array.from(blockedIPs),
            topThreats: this.getTopThreats(recentEvents)
        };
    }

    getTopThreats(events) {
        const threats = {};
        events.forEach(event => {
            if (event.threats) {
                event.threats.forEach(threat => {
                    threats[threat.type] = (threats[threat.type] || 0) + 1;
                });
            }
        });
        
        return Object.entries(threats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([type, count]) => ({ type, count }));
    }
}

// Create global security monitor instance
const securityMonitor = new SecurityMonitor();

// Security monitoring middleware
const securityMonitoring = (req, res, next) => {
    const ip = req.ip;

    // Check if IP is blocked
    if (securityMonitor.isIPBlocked(ip)) {
        return res.status(403).json({ 
            error: 'Access denied',
            code: 'IP_BLOCKED'
        });
    }

    // Detect threats
    const threats = securityMonitor.detectThreats(req);
    if (threats.length > 0) {
        securityMonitor.logSecurityEvent(SECURITY_EVENTS.MALICIOUS_REQUEST, req, { threats });
        
        // Track threats in Prometheus
        threats.forEach(threat => {
            trackThreatDetected(threat.type, threat.severity);
        });
        
        // Block IP for critical threats
        const criticalThreats = threats.filter(t => t.severity === 'critical');
        if (criticalThreats.length > 0) {
            securityMonitor.blockIP(ip, 3600000); // 1 hour block
            return res.status(403).json({ 
                error: 'Access denied',
                code: 'THREAT_DETECTED'
            });
        }
    }

    // Detect anomalies
    const anomalies = securityMonitor.detectAnomalies(req);
    if (anomalies.length > 0) {
        securityMonitor.logSecurityEvent(SECURITY_EVENTS.ANOMALOUS_BEHAVIOR, req, { anomalies });
        
        // Mark IP as suspicious for multiple anomalies
        if (anomalies.length > 2) {
            securityMonitor.markIPSuspicious(ip, 'multiple_anomalies');
        }
    }

    next();
};

// Enhanced authentication monitoring
const enhancedAuthMonitoring = (req, res, next) => {
    const originalSend = res.send;
    const ip = req.ip;
    const userAgent = req.get('User-Agent') || '';

    res.send = function(data) {
        // Check if this is an authentication endpoint
        if (req.path.includes('/login') || req.path.includes('/auth')) {
            const isSuccess = res.statusCode < 400;
            
            if (isSuccess) {
                securityMonitor.logSecurityEvent(SECURITY_EVENTS.LOGIN_SUCCESS, req, {
                    userAgent: userAgent
                });
                trackAuthenticationAttempt('true', 'enhanced_auth');
            } else {
                securityMonitor.logSecurityEvent(SECURITY_EVENTS.LOGIN_FAILURE, req, {
                    statusCode: res.statusCode,
                    userAgent: userAgent
                });
                trackAuthenticationAttempt('false', 'enhanced_auth');
                
                // Check for brute force
                const recentFailures = securityEvents.filter(event => 
                    event.type === SECURITY_EVENTS.LOGIN_FAILURE &&
                    event.ip === ip &&
                    new Date(event.timestamp).getTime() > (Date.now() - 300000) // Last 5 minutes
                );
                
                if (recentFailures.length > 5) {
                    securityMonitor.logSecurityEvent(SECURITY_EVENTS.BRUTE_FORCE_DETECTED, req, {
                        attempts: recentFailures.length,
                        timeWindow: '5 minutes'
                    });
                    
                    // Block IP temporarily
                    securityMonitor.blockIP(ip, 900000); // 15 minutes
                }
            }
        }

        return originalSend.call(this, data);
    };

    next();
};

// Security dashboard data endpoint
const getSecurityDashboard = (req, res) => {
    try {
        const stats = securityMonitor.getSecurityStats();
        const recentEvents = securityEvents.slice(-50);
        
        res.json({
            success: true,
            data: {
                stats,
                recentEvents,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting security dashboard:', error);
        res.status(500).json({ success: false, error: 'Failed to get security data' });
    }
};

module.exports = {
    securityMonitoring,
    enhancedAuthMonitoring,
    getSecurityDashboard,
    securityMonitor,
    SECURITY_EVENTS
};
