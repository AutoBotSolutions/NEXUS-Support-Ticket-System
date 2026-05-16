const fs = require('fs').promises;
const path = require('path');

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

// Simple logging infrastructure
const loggingInfrastructure = {
    logs: [],
    maxLogs: 10000,
    logFile: path.join(__dirname, '../logs/application.log'),
    
    // Log a message
    logSystem: (message, level = LOG_LEVELS.INFO, metadata = {}) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata,
            id: Math.random().toString(36).substr(2, 9)
        };
        
        loggingInfrastructure.logs.push(logEntry);
        
        // Keep only last maxLogs entries
        if (loggingInfrastructure.logs.length > loggingInfrastructure.maxLogs) {
            loggingInfrastructure.logs = loggingInfrastructure.logs.slice(-loggingInfrastructure.maxLogs);
        }
        
        // Log to console
        console.log(`[${level.toUpperCase()}] ${message}`, metadata);
        
        // Log to file asynchronously
        loggingInfrastructure.writeToFile(logEntry);
    },
    
    // Write log to file
    writeToFile: async (logEntry) => {
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(loggingInfrastructure.logFile, logLine);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    },
    
    // Request logger middleware
    requestLogger: () => {
        return (req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                const logMessage = `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`;
                
                loggingInfrastructure.logSystem(logMessage, LOG_LEVELS.HTTP, {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
            });
            
            next();
        };
    },
    
    // Get log statistics
    getLogStats: async () => {
        const stats = {
            totalLogs: loggingInfrastructure.logs.length,
            logsByLevel: {},
            recentLogs: loggingInfrastructure.logs.slice(-100),
            errorRate: 0,
            warningRate: 0
        };
        
        // Count logs by level
        for (const log of loggingInfrastructure.logs) {
            stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1;
        }
        
        // Calculate error and warning rates
        const totalLogs = loggingInfrastructure.logs.length;
        if (totalLogs > 0) {
            stats.errorRate = ((stats.logsByLevel[LOG_LEVELS.ERROR] || 0) / totalLogs) * 100;
            stats.warningRate = ((stats.logsByLevel[LOG_LEVELS.WARN] || 0) / totalLogs) * 100;
        }
        
        return stats;
    },
    
    // Search logs
    searchLogs: async (query, filters = {}) => {
        let filteredLogs = [...loggingInfrastructure.logs];
        
        // Apply text search
        if (query) {
            filteredLogs = filteredLogs.filter(log => 
                log.message.toLowerCase().includes(query.toLowerCase()) ||
                JSON.stringify(log.metadata).toLowerCase().includes(query.toLowerCase())
            );
        }
        
        // Apply level filter
        if (filters.level) {
            filteredLogs = filteredLogs.filter(log => log.level === filters.level);
        }
        
        // Apply date range filter
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startDate);
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endDate);
        }
        
        // Sort by timestamp (most recent first)
        filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Limit results
        const limit = filters.limit || 1000;
        filteredLogs = filteredLogs.slice(0, limit);
        
        return {
            logs: filteredLogs,
            total: filteredLogs.length,
            query,
            filters
        };
    },
    
    // Get log trends
    getLogTrends: async () => {
        const trends = {
            hourlyLogCounts: {},
            levelTrends: {},
            errorTrends: [],
            recentErrors: []
        };
        
        // Calculate hourly log counts
        for (const log of loggingInfrastructure.logs) {
            const hour = new Date(log.timestamp).getHours();
            trends.hourlyLogCounts[hour] = (trends.hourlyLogCounts[hour] || 0) + 1;
        }
        
        // Calculate level trends over time
        const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
        const recentLogs = loggingInfrastructure.logs.filter(log => 
            new Date(log.timestamp).getTime() > last24Hours
        );
        
        for (const log of recentLogs) {
            const hour = new Date(log.timestamp).getHours();
            if (!trends.levelTrends[hour]) {
                trends.levelTrends[hour] = {};
            }
            trends.levelTrends[hour][log.level] = (trends.levelTrends[hour][log.level] || 0) + 1;
        }
        
        // Get recent errors
        trends.recentErrors = loggingInfrastructure.logs
            .filter(log => log.level === LOG_LEVELS.ERROR)
            .slice(-10);
        
        return trends;
    },
    
    // Clear logs
    clearLogs: async () => {
        loggingInfrastructure.logs = [];
        try {
            await fs.writeFile(loggingInfrastructure.logFile, '');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Export logs
    exportLogs: async (format = 'json') => {
        if (format === 'json') {
            return {
                success: true,
                data: JSON.stringify(loggingInfrastructure.logs, null, 2)
            };
        } else if (format === 'csv') {
            const csvData = [
                'Timestamp,Level,Message,Metadata',
                ...loggingInfrastructure.logs.map(log => 
                    `"${log.timestamp}","${log.level}","${log.message}","${JSON.stringify(log.metadata).replace(/"/g, '""')}"`
                )
            ].join('\n');
            
            return {
                success: true,
                data: csvData
            };
        }
        
        return {
            success: false,
            error: 'Unsupported format'
        };
    }
};

// Ensure logs directory exists
const initializeLogging = async () => {
    try {
        await fs.mkdir(path.dirname(loggingInfrastructure.logFile), { recursive: true });
        console.log('Simple logging infrastructure initialized');
    } catch (error) {
        console.error('Failed to initialize logging:', error);
    }
};

// Initialize logging
initializeLogging();

module.exports = {
    loggingInfrastructure,
    getLogStats: loggingInfrastructure.getLogStats,
    searchLogs: loggingInfrastructure.searchLogs,
    getLogTrends: loggingInfrastructure.getLogTrends,
    LOG_LEVELS
};
