const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

// Log levels
const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    HTTP: 'http',
    VERBOSE: 'verbose',
    DEBUG: 'debug',
    SILLY: 'silly'
};

// Log categories
const LOG_CATEGORIES = {
    APPLICATION: 'application',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    DATABASE: 'database',
    API: 'api',
    AUTHENTICATION: 'authentication',
    MONITORING: 'monitoring',
    ALERTING: 'alerting',
    BUSINESS: 'business',
    SYSTEM: 'system'
};

class LoggingInfrastructure {
    constructor() {
        this.initializeLogger();
        this.setupLogRotation();
        this.startLogAggregation();
    }

    initializeLogger() {
        // Create Winston logger with multiple transports
        const logFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.printf(({ timestamp, level, message, category, ...meta }) => {
                return JSON.stringify({
                    timestamp,
                    level,
                    category: category || LOG_CATEGORIES.APPLICATION,
                    message,
                    ...meta
                });
            })
        );

        const transports = [
            // Console transport for development
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                ),
                level: process.env.LOG_LEVEL || 'info'
            }),

            // File transport for application logs
            new winston.transports.File({
                filename: 'logs/application.log',
                format: logFormat,
                level: 'info',
                maxsize: 10485760, // 10MB
                maxFiles: 5
            }),

            // File transport for error logs
            new winston.transports.File({
                filename: 'logs/error.log',
                format: logFormat,
                level: 'error',
                maxsize: 10485760, // 10MB
                maxFiles: 5
            }),

            // File transport for security logs
            new winston.transports.File({
                filename: 'logs/security.log',
                format: logFormat,
                level: 'warn',
                maxsize: 10485760, // 10MB
                maxFiles: 10
            })
        ];

        // Add Elasticsearch transport if configured
        if (process.env.ELASTICSEARCH_URL) {
            transports.push(new ElasticsearchTransport({
                level: 'info',
                clientOpts: {
                    node: process.env.ELASTICSEARCH_URL,
                    auth: process.env.ELASTICSEARCH_AUTH ? {
                        username: process.env.ELASTICSEARCH_USERNAME,
                        password: process.env.ELASTICSEARCH_PASSWORD
                    } : undefined
                },
                index: 'nexus-logs',
                transformer: (logInfo) => {
                    return {
                        '@timestamp': logInfo.timestamp,
                        level: logInfo.level,
                        category: logInfo.category || LOG_CATEGORIES.APPLICATION,
                        message: logInfo.message,
                        fields: logInfo.meta || {},
                        environment: process.env.NODE_ENV || 'development',
                        service: 'nexus-support-system',
                        version: process.env.APP_VERSION || '1.0.0'
                    };
                }
            }));
        }

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            transports,
            exitOnError: false
        });

        // Create category-specific loggers
        this.createCategoryLoggers();
    }

    createCategoryLoggers() {
        this.loggers = {};
        
        Object.values(LOG_CATEGORIES).forEach(category => {
            this.loggers[category] = this.logger.child({ category });
        });
    }

    setupLogRotation() {
        // Log rotation is handled by winston file transport
        // Additional cleanup can be added here if needed
        setInterval(() => {
            this.cleanupOldLogs();
        }, 24 * 60 * 60 * 1000); // Daily cleanup
    }

    cleanupOldLogs() {
        // Clean up logs older than 30 days
        // This would be implemented based on your log retention policy
        console.log('Log cleanup completed');
    }

    startLogAggregation() {
        // Start log aggregation pipeline
        // This would integrate with Logstash or other log aggregation tools
        console.log('Log aggregation started');
    }

    // Logging methods
    log(level, message, category = LOG_CATEGORIES.APPLICATION, meta = {}) {
        const logger = this.loggers[category] || this.logger;
        logger.log(level, message, meta);
    }

    error(message, category = LOG_CATEGORIES.APPLICATION, meta = {}) {
        this.log(LOG_LEVELS.ERROR, message, category, meta);
    }

    warn(message, category = LOG_CATEGORIES.APPLICATION, meta = {}) {
        this.log(LOG_LEVELS.WARN, message, category, meta);
    }

    info(message, category = LOG_CATEGORIES.APPLICATION, meta = {}) {
        this.log(LOG_LEVELS.INFO, message, category, meta);
    }

    debug(message, category = LOG_CATEGORIES.APPLICATION, meta = {}) {
        this.log(LOG_LEVELS.DEBUG, message, category, meta);
    }

    // Category-specific logging methods
    logSecurity(message, level = LOG_LEVELS.WARN, meta = {}) {
        this.log(level, message, LOG_CATEGORIES.SECURITY, meta);
    }

    logPerformance(message, level = LOG_LEVELS.INFO, meta = {}) {
        this.log(level, message, LOG_CATEGORIES.PERFORMANCE, meta);
    }

    logDatabase(message, level = LOG_LEVELS.INFO, meta = {}) {
        this.log(level, message, LOG_CATEGORIES.DATABASE, meta);
    }

    logAPI(message, level = LOG_LEVELS.INFO, meta = {}) {
        this.log(level, message, LOG_CATEGORIES.API, meta);
    }

    logAuthentication(message, level = LOG_LEVELS.INFO, meta = {}) {
        this.log(level, message, LOG_CATEGORIES.AUTHENTICATION, meta);
    }

    logMonitoring(message, level = LOG_LEVELS.INFO, meta = {}) {
        this.log(level, message, LOG_CATEGORIES.MONITORING, meta);
    }

    logAlerting(message, level = LOG_LEVELS.INFO, meta = {}) {
        this.log(level, message, LOG_CATEGORIES.ALERTING, meta);
    }

    logBusiness(message, level = LOG_LEVELS.INFO, meta = {}) {
        this.log(level, message, LOG_CATEGORIES.BUSINESS, meta);
    }

    logSystem(message, level = LOG_LEVELS.INFO, meta = {}) {
        this.log(level, message, LOG_CATEGORIES.SYSTEM, meta);
    }

    // Request logging middleware
    requestLogger() {
        return (req, res, next) => {
            const start = Date.now();
            const requestId = this.generateRequestId();
            
            // Add request ID to request object
            req.requestId = requestId;
            
            // Log request start
            this.logAPI('Request started', LOG_LEVELS.INFO, {
                requestId,
                method: req.method,
                url: req.url,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                headers: this.sanitizeHeaders(req.headers)
            });

            // Override res.end to log response
            const originalEnd = res.end;
            res.end = function(chunk, encoding) {
                const duration = Date.now() - start;
                
                // Log response
                loggingInfrastructure.logAPI('Request completed', LOG_LEVELS.INFO, {
                    requestId,
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    duration,
                    contentLength: res.get('Content-Length')
                });

                return originalEnd.call(this, chunk, encoding);
            };

            next();
        };
    }

    // Error logging middleware
    errorLogger() {
        return (err, req, res, next) => {
            this.error('Unhandled error', LOG_CATEGORIES.APPLICATION, {
                requestId: req.requestId,
                method: req.method,
                url: req.url,
                error: {
                    message: err.message,
                    stack: err.stack,
                    name: err.name
                },
                headers: this.sanitizeHeaders(req.headers),
                body: this.sanitizeBody(req.body)
            });

            next(err);
        };
    }

    // Security event logging
    logSecurityEvent(eventType, req, additionalData = {}) {
        this.logSecurity(`Security event: ${eventType}`, LOG_LEVELS.WARN, {
            requestId: req.requestId,
            eventType,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.url,
            headers: this.sanitizeHeaders(req.headers),
            body: this.sanitizeBody(req.body),
            ...additionalData
        });
    }

    // Performance logging
    logPerformanceMetric(metricName, value, unit = 'ms', additionalData = {}) {
        this.logPerformance(`Performance metric: ${metricName}`, LOG_LEVELS.INFO, {
            metric: metricName,
            value,
            unit,
            timestamp: new Date().toISOString(),
            ...additionalData
        });
    }

    // Database operation logging
    logDatabaseOperation(operation, collection, duration, additionalData = {}) {
        this.logDatabase(`Database operation: ${operation}`, LOG_LEVELS.INFO, {
            operation,
            collection,
            duration,
            timestamp: new Date().toISOString(),
            ...additionalData
        });
    }

    // Authentication event logging
    logAuthEvent(eventType, userId, success, additionalData = {}) {
        this.logAuthentication(`Authentication event: ${eventType}`, success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN, {
            eventType,
            userId,
            success,
            timestamp: new Date().toISOString(),
            ...additionalData
        });
    }

    // Business event logging
    logBusinessEvent(eventType, additionalData = {}) {
        this.logBusiness(`Business event: ${eventType}`, LOG_LEVELS.INFO, {
            eventType,
            timestamp: new Date().toISOString(),
            ...additionalData
        });
    }

    // System event logging
    logSystemEvent(eventType, additionalData = {}) {
        this.logSystem(`System event: ${eventType}`, LOG_LEVELS.INFO, {
            eventType,
            timestamp: new Date().toISOString(),
            ...additionalData
        });
    }

    // Utility methods
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        // Remove sensitive headers
        delete sanitized.authorization;
        delete sanitized.cookie;
        delete sanitized['x-api-key'];
        delete sanitized['x-auth-token'];
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
        delete sanitized.apiKey;
        return sanitized;
    }

    // Log analysis methods
    async getLogStats(timeRange = '1h') {
        try {
            // This would query Elasticsearch or other log storage
            // For now, return mock stats
            return {
                totalLogs: 1000,
                errorLogs: 10,
                warningLogs: 50,
                infoLogs: 940,
                topErrors: [
                    { message: 'Database connection failed', count: 5 },
                    { message: 'Authentication failed', count: 3 },
                    { message: 'Rate limit exceeded', count: 2 }
                ],
                logLevels: {
                    error: 10,
                    warn: 50,
                    info: 940
                },
                categories: {
                    application: 600,
                    security: 100,
                    performance: 150,
                    database: 80,
                    api: 70
                }
            };
        } catch (error) {
            console.error('Error getting log stats:', error);
            return null;
        }
    }

    async searchLogs(query, timeRange = '1h', limit = 100) {
        try {
            // This would search Elasticsearch or other log storage
            // For now, return mock results
            return {
                logs: [
                    {
                        timestamp: new Date().toISOString(),
                        level: 'info',
                        category: 'application',
                        message: 'Sample log message',
                        fields: {}
                    }
                ],
                total: 1,
                took: 10
            };
        } catch (error) {
            console.error('Error searching logs:', error);
            return null;
        }
    }

    async getLogTrends(timeRange = '24h') {
        try {
            // This would analyze log trends from Elasticsearch
            // For now, return mock trends
            return {
                errorRate: [
                    { timestamp: new Date(Date.now() - 3600000).toISOString(), value: 0.05 },
                    { timestamp: new Date(Date.now() - 1800000).toISOString(), value: 0.03 },
                    { timestamp: new Date().toISOString(), value: 0.02 }
                ],
                requestVolume: [
                    { timestamp: new Date(Date.now() - 3600000).toISOString(), value: 100 },
                    { timestamp: new Date(Date.now() - 1800000).toISOString(), value: 150 },
                    { timestamp: new Date().toISOString(), value: 120 }
                ],
                responseTime: [
                    { timestamp: new Date(Date.now() - 3600000).toISOString(), value: 200 },
                    { timestamp: new Date(Date.now() - 1800000).toISOString(), value: 180 },
                    { timestamp: new Date().toISOString(), value: 160 }
                ]
            };
        } catch (error) {
            console.error('Error getting log trends:', error);
            return null;
        }
    }
}

// Create global logging instance
const loggingInfrastructure = new LoggingInfrastructure();

// Logging endpoints
const getLogStats = async (req, res) => {
    try {
        const { timeRange = '1h' } = req.query;
        const stats = await loggingInfrastructure.getLogStats(timeRange);
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting log stats:', error);
        res.status(500).json({ success: false, error: 'Failed to get log stats' });
    }
};

const searchLogs = async (req, res) => {
    try {
        const { query, timeRange = '1h', limit = 100 } = req.query;
        const results = await loggingInfrastructure.searchLogs(query, timeRange, limit);
        
        res.json({
            success: true,
            data: results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error searching logs:', error);
        res.status(500).json({ success: false, error: 'Failed to search logs' });
    }
};

const getLogTrends = async (req, res) => {
    try {
        const { timeRange = '24h' } = req.query;
        const trends = await loggingInfrastructure.getLogTrends(timeRange);
        
        res.json({
            success: true,
            data: trends,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting log trends:', error);
        res.status(500).json({ success: false, error: 'Failed to get log trends' });
    }
};

module.exports = {
    loggingInfrastructure,
    getLogStats,
    searchLogs,
    getLogTrends,
    LOG_LEVELS,
    LOG_CATEGORIES
};
