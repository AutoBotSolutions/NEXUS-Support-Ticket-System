const crypto = require('crypto');
const { performance } = require('perf_hooks');

class DistributedTracing {
    constructor() {
        this.traces = new Map();
        this.services = new Map();
        this.performanceBudgets = new Map();
        this.spans = [];
        this.maxSpans = 10000; // Limit memory usage
        
        this.initializePerformanceBudgets();
        this.initializeServiceMap();
    }

    initializePerformanceBudgets() {
        // Define performance budgets for different operations
        this.performanceBudgets.set('api_request', {
            maxDuration: 500, // ms
            warningThreshold: 300,
            criticalThreshold: 500
        });
        
        this.performanceBudgets.set('database_query', {
            maxDuration: 100,
            warningThreshold: 50,
            criticalThreshold: 100
        });
        
        this.performanceBudgets.set('authentication', {
            maxDuration: 200,
            warningThreshold: 100,
            criticalThreshold: 200
        });
        
        this.performanceBudgets.set('ticket_creation', {
            maxDuration: 1000,
            warningThreshold: 500,
            criticalThreshold: 1000
        });
        
        this.performanceBudgets.set('github_sync', {
            maxDuration: 2000,
            warningThreshold: 1000,
            criticalThreshold: 2000
        });
    }

    initializeServiceMap() {
        // Initialize service map with known services
        this.services.set('nexus-app', {
            name: 'NEXUS Application',
            type: 'application',
            version: '1.0.0',
            endpoints: ['/api/health', '/api/tickets', '/api/users'],
            dependencies: ['mongodb', 'github-api']
        });
        
        this.services.set('mongodb', {
            name: 'MongoDB',
            type: 'database',
            version: '5.0',
            endpoints: ['mongodb://localhost:27017'],
            dependencies: []
        });
        
        this.services.set('github-api', {
            name: 'GitHub API',
            type: 'external',
            version: 'v4',
            endpoints: ['https://api.github.com'],
            dependencies: []
        });
    }

    generateTraceId() {
        return crypto.randomBytes(16).toString('hex');
    }

    generateSpanId() {
        return crypto.randomBytes(8).toString('hex');
    }

    startTrace(operationName, serviceName = 'nexus-app', parentSpanId = null) {
        const traceId = this.generateTraceId();
        const spanId = this.generateSpanId();
        const startTime = performance.now();
        
        const trace = {
            traceId,
            spanId,
            parentSpanId,
            operationName,
            serviceName,
            startTime,
            endTime: null,
            duration: null,
            status: 'pending',
            tags: {},
            logs: [],
            metrics: {}
        };
        
        this.traces.set(traceId, trace);
        this.spans.push(trace);
        
        // Limit memory usage
        if (this.spans.length > this.maxSpans) {
            this.spans = this.spans.slice(-this.maxSpans);
        }
        
        return trace;
    }

    finishTrace(traceId, status = 'success', error = null) {
        const trace = this.traces.get(traceId);
        if (!trace) return null;
        
        const endTime = performance.now();
        trace.endTime = endTime;
        trace.duration = endTime - trace.startTime;
        trace.status = status;
        
        if (error) {
            trace.error = error;
            trace.tags.error = true;
        }
        
        // Check against performance budgets
        this.checkPerformanceBudget(trace);
        
        // Update service map
        this.updateServiceMap(trace);
        
        return trace;
    }

    addTag(traceId, key, value) {
        const trace = this.traces.get(traceId);
        if (trace) {
            trace.tags[key] = value;
        }
    }

    addLog(traceId, level, message, fields = {}) {
        const trace = this.traces.get(traceId);
        if (trace) {
            trace.logs.push({
                timestamp: performance.now(),
                level,
                message,
                fields
            });
        }
    }

    addMetric(traceId, name, value) {
        const trace = this.traces.get(traceId);
        if (trace) {
            trace.metrics[name] = value;
        }
    }

    checkPerformanceBudget(trace) {
        const budget = this.performanceBudgets.get(trace.operationName);
        if (!budget) return;
        
        if (trace.duration > budget.criticalThreshold) {
            trace.performanceLevel = 'critical';
            this.addLog(trace.traceId, 'error', 'Performance budget exceeded - critical', {
                budget: budget.criticalThreshold,
                actual: trace.duration
            });
        } else if (trace.duration > budget.warningThreshold) {
            trace.performanceLevel = 'warning';
            this.addLog(trace.traceId, 'warn', 'Performance budget exceeded - warning', {
                budget: budget.warningThreshold,
                actual: trace.duration
            });
        } else {
            trace.performanceLevel = 'good';
        }
    }

    updateServiceMap(trace) {
        const service = this.services.get(trace.serviceName);
        if (service) {
            // Update service metrics
            if (!service.metrics) service.metrics = {};
            if (!service.metrics.requestCount) service.metrics.requestCount = 0;
            if (!service.metrics.totalDuration) service.metrics.totalDuration = 0;
            if (!service.metrics.errorCount) service.metrics.errorCount = 0;
            
            service.metrics.requestCount++;
            service.metrics.totalDuration += trace.duration;
            
            if (trace.status === 'error') {
                service.metrics.errorCount++;
            }
            
            service.metrics.averageDuration = service.metrics.totalDuration / service.metrics.requestCount;
            service.metrics.errorRate = (service.metrics.errorCount / service.metrics.requestCount) * 100;
        }
    }

    getServiceMap() {
        const serviceMap = {
            services: {},
            connections: [],
            timestamp: new Date().toISOString()
        };
        
        // Add services
        for (const [serviceId, service] of this.services) {
            serviceMap.services[serviceId] = {
                ...service,
                health: this.calculateServiceHealth(service)
            };
        }
        
        // Add connections based on dependencies
        for (const [serviceId, service] of this.services) {
            for (const dependency of service.dependencies) {
                serviceMap.connections.push({
                    from: serviceId,
                    to: dependency,
                    type: 'dependency'
                });
            }
        }
        
        return serviceMap;
    }

    calculateServiceHealth(service) {
        if (!service.metrics) return 'unknown';
        
        const { errorRate, averageDuration } = service.metrics;
        
        if (errorRate > 10) return 'critical';
        if (errorRate > 5) return 'warning';
        if (averageDuration > 1000) return 'warning';
        
        return 'healthy';
    }

    getPerformanceReport() {
        const report = {
            summary: {
                totalTraces: this.spans.length,
                averageDuration: 0,
                errorRate: 0,
                performanceBudgetCompliance: 0
            },
            budgets: {},
            slowOperations: [],
            errors: [],
            timestamp: new Date().toISOString()
        };
        
        if (this.spans.length === 0) return report;
        
        // Calculate summary metrics
        let totalDuration = 0;
        let errorCount = 0;
        let budgetCompliance = 0;
        
        for (const trace of this.spans) {
            totalDuration += trace.duration || 0;
            if (trace.status === 'error') errorCount++;
            if (trace.performanceLevel === 'good') budgetCompliance++;
            
            // Track slow operations
            if (trace.duration > 500) {
                report.slowOperations.push({
                    operationName: trace.operationName,
                    duration: trace.duration,
                    traceId: trace.traceId
                });
            }
            
            // Track errors
            if (trace.status === 'error') {
                report.errors.push({
                    operationName: trace.operationName,
                    error: trace.error,
                    traceId: trace.traceId
                });
            }
        }
        
        report.summary.averageDuration = totalDuration / this.spans.length;
        report.summary.errorRate = (errorCount / this.spans.length) * 100;
        report.summary.performanceBudgetCompliance = (budgetCompliance / this.spans.length) * 100;
        
        // Budget compliance by operation
        for (const [operation, budget] of this.performanceBudgets) {
            const operationTraces = this.spans.filter(t => t.operationName === operation);
            if (operationTraces.length > 0) {
                const compliant = operationTraces.filter(t => t.performanceLevel === 'good').length;
                report.budgets[operation] = {
                    compliance: (compliant / operationTraces.length) * 100,
                    averageDuration: operationTraces.reduce((sum, t) => sum + t.duration, 0) / operationTraces.length,
                    budget: budget.maxDuration
                };
            }
        }
        
        return report;
    }

    getTrace(traceId) {
        return this.traces.get(traceId);
    }

    getRecentTraces(limit = 100) {
        return this.spans
            .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
            .slice(0, limit);
    }

    getTracesByOperation(operationName, limit = 100) {
        return this.spans
            .filter(trace => trace.operationName === operationName)
            .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
            .slice(0, limit);
    }

    clearTraces(olderThan = 3600000) { // Default: 1 hour
        const cutoff = performance.now() - olderThan;
        this.spans = this.spans.filter(trace => (trace.startTime || 0) > cutoff);
        
        // Clean up trace map
        for (const [traceId, trace] of this.traces) {
            if ((trace.startTime || 0) < cutoff) {
                this.traces.delete(traceId);
            }
        }
    }
}

// Create global instance
const distributedTracing = new DistributedTracing();

// Middleware for distributed tracing
const tracingMiddleware = (operationName, serviceName = 'nexus-app') => {
    return (req, res, next) => {
        const trace = distributedTracing.startTrace(operationName, serviceName);
        
        // Add trace context to request
        req.traceId = trace.traceId;
        req.spanId = trace.spanId;
        req.trace = trace;
        
        // Add common tags
        distributedTracing.addTag(trace.traceId, 'http.method', req.method);
        distributedTracing.addTag(trace.traceId, 'http.url', req.url);
        distributedTracing.addTag(trace.traceId, 'http.user_agent', req.get('User-Agent'));
        distributedTracing.addTag(trace.traceId, 'http.remote_addr', req.ip);
        
        // Track response
        const originalEnd = res.end;
        res.end = function(...args) {
            const endTime = performance.now();
            const duration = endTime - trace.startTime;
            
            distributedTracing.addTag(trace.traceId, 'http.status_code', res.statusCode);
            distributedTracing.addMetric(trace.traceId, 'response_time', duration);
            
            // Determine status
            let status = 'success';
            if (res.statusCode >= 400) {
                status = 'error';
                distributedTracing.addLog(trace.traceId, 'error', 'HTTP request failed', {
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage
                });
            }
            
            distributedTracing.finishTrace(trace.traceId, status);
            originalEnd.apply(this, args);
        };
        
        next();
    };
};

// Cleanup old traces periodically
setInterval(() => {
    distributedTracing.clearTraces();
}, 300000); // Clean up every 5 minutes

module.exports = {
    distributedTracing,
    tracingMiddleware
};
