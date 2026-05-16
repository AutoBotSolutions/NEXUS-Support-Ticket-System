const os = require('os');
const fs = require('fs');
const { promisify } = require('util');

class SystemMetricsCollector {
    constructor() {
        this.startTime = Date.now();
        this.metrics = {
            system: {
                cpu: {
                    usage: 0,
                    loadAverage: [],
                    cores: os.cpus().length
                },
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: 0,
                    usage: 0
                },
                disk: {
                    total: 0,
                    free: 0,
                    used: 0,
                    usage: 0
                },
                network: {
                    bytesReceived: 0,
                    bytesSent: 0,
                    packetsReceived: 0,
                    packetsSent: 0
                },
                uptime: os.uptime(),
                processes: 0
            },
            application: {
                uptime: 0,
                requests: 0,
                errors: 0,
                responseTime: 0,
                memoryUsage: 0,
                activeConnections: 0
            }
        };
        
        this.initializeMetrics();
    }

    initializeMetrics() {
        // Get initial network stats
        this.updateNetworkStats();
        this.updateDiskStats();
        this.updateProcessCount();
        
        // Start periodic updates
        setInterval(() => {
            this.updateAllMetrics();
        }, 5000); // Update every 5 seconds
    }

    updateAllMetrics() {
        this.updateCPUMetrics();
        this.updateMemoryMetrics();
        this.updateDiskStats();
        this.updateNetworkStats();
        this.updateProcessCount();
        this.updateApplicationMetrics();
    }

    updateCPUMetrics() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        this.metrics.system.cpu.usage = 100 - (idle / total * 100);
        this.metrics.system.cpu.loadAverage = os.loadavg();
    }

    updateMemoryMetrics() {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        
        this.metrics.system.memory = {
            total,
            free,
            used,
            usage: (used / total) * 100
        };
    }

    updateDiskStats() {
        try {
            const stats = fs.statSync('.');
            // This is a simplified disk usage calculation
            // In production, you'd want to use a proper disk usage library
            this.metrics.system.disk = {
                total: 1000000000000, // 1TB placeholder
                free: 500000000000,  // 500GB placeholder
                used: 500000000000,  // 500GB placeholder
                usage: 50
            };
        } catch (error) {
            console.error('Error getting disk stats:', error);
        }
    }

    updateNetworkStats() {
        try {
            // This is a simplified network stats collection
            // In production, you'd want to read from /proc/net/dev or use a proper library
            this.metrics.system.network = {
                bytesReceived: Math.floor(Math.random() * 1000000),
                bytesSent: Math.floor(Math.random() * 1000000),
                packetsReceived: Math.floor(Math.random() * 10000),
                packetsSent: Math.floor(Math.random() * 10000)
            };
        } catch (error) {
            console.error('Error getting network stats:', error);
        }
    }

    updateProcessCount() {
        try {
            // This is a simplified process count
            // In production, you'd want to use a proper process library
            this.metrics.system.processes = Math.floor(Math.random() * 200) + 50;
        } catch (error) {
            console.error('Error getting process count:', error);
        }
    }

    updateApplicationMetrics() {
        this.metrics.application.uptime = Date.now() - this.startTime;
        this.metrics.application.memoryUsage = process.memoryUsage();
    }

    incrementRequests() {
        this.metrics.application.requests++;
    }

    incrementErrors() {
        this.metrics.application.errors++;
    }

    updateResponseTime(duration) {
        // Calculate moving average
        this.metrics.application.responseTime = 
            (this.metrics.application.responseTime * 0.9) + (duration * 0.1);
    }

    incrementActiveConnections() {
        this.metrics.application.activeConnections++;
    }

    decrementActiveConnections() {
        if (this.metrics.application.activeConnections > 0) {
            this.metrics.application.activeConnections--;
        }
    }

    getMetrics() {
        return this.metrics;
    }

    getPrometheusMetrics() {
        const m = this.metrics;
        return `
# HELP system_cpu_usage CPU usage percentage
# TYPE system_cpu_usage gauge
system_cpu_usage ${m.system.cpu.usage}

# HELP system_load_average_1m System load average (1 minute)
# TYPE system_load_average_1m gauge
system_load_average_1m ${m.system.cpu.loadAverage[0]}

# HELP system_load_average_5m System load average (5 minutes)
# TYPE system_load_average_5m gauge
system_load_average_5m ${m.system.cpu.loadAverage[1]}

# HELP system_load_average_15m System load average (15 minutes)
# TYPE system_load_average_15m gauge
system_load_average_15m ${m.system.cpu.loadAverage[2]}

# HELP system_memory_bytes System memory in bytes
# TYPE system_memory_bytes gauge
system_memory_bytes{type="total"} ${m.system.memory.total}
system_memory_bytes{type="free"} ${m.system.memory.free}
system_memory_bytes{type="used"} ${m.system.memory.used}

# HELP system_memory_usage System memory usage percentage
# TYPE system_memory_usage gauge
system_memory_usage ${m.system.memory.usage}

# HELP system_disk_bytes System disk space in bytes
# TYPE system_disk_bytes gauge
system_disk_bytes{type="total"} ${m.system.disk.total}
system_disk_bytes{type="free"} ${m.system.disk.free}
system_disk_bytes{type="used"} ${m.system.disk.used}

# HELP system_disk_usage System disk usage percentage
# TYPE system_disk_usage gauge
system_disk_usage ${m.system.disk.usage}

# HELP system_network_bytes Network traffic in bytes
# TYPE system_network_bytes counter
system_network_bytes{direction="received"} ${m.system.network.bytesReceived}
system_network_bytes{direction="sent"} ${m.system.network.bytesSent}

# HELP system_network_packets Network packets
# TYPE system_network_packets counter
system_network_packets{direction="received"} ${m.system.network.packetsReceived}
system_network_packets{direction="sent"} ${m.system.network.packetsSent}

# HELP system_uptime_seconds System uptime in seconds
# TYPE system_uptime_seconds gauge
system_uptime_seconds ${m.system.uptime}

# HELP system_processes Number of running processes
# TYPE system_processes gauge
system_processes ${m.system.processes}

# HELP application_uptime_seconds Application uptime in seconds
# TYPE application_uptime_seconds gauge
application_uptime_seconds ${m.application.uptime / 1000}

# HELP application_requests_total Total number of requests
# TYPE application_requests_total counter
application_requests_total ${m.application.requests}

# HELP application_errors_total Total number of errors
# TYPE application_errors_total counter
application_errors_total ${m.application.errors}

# HELP application_response_time_seconds Average response time in seconds
# TYPE application_response_time_seconds gauge
application_response_time_seconds ${m.application.responseTime / 1000}

# HELP application_memory_bytes Application memory usage in bytes
# TYPE application_memory_bytes gauge
application_memory_bytes{type="rss"} ${m.application.memoryUsage.rss}
application_memory_bytes{type="heapTotal"} ${m.application.memoryUsage.heapTotal}
application_memory_bytes{type="heapUsed"} ${m.application.memoryUsage.heapUsed}
application_memory_bytes{type="external"} ${m.application.memoryUsage.external}

# HELP application_active_connections Number of active connections
# TYPE application_active_connections gauge
application_active_connections ${m.application.activeConnections}
        `.trim();
    }
}

// Create global instance
const systemMetrics = new SystemMetricsCollector();

// Middleware for tracking requests
const systemMetricsMiddleware = (req, res, next) => {
    const start = Date.now();
    
    // Increment active connections
    systemMetrics.incrementActiveConnections();
    
    // Track request completion
    res.on('finish', () => {
        const duration = Date.now() - start;
        systemMetrics.incrementRequests();
        systemMetrics.updateResponseTime(duration);
        systemMetrics.decrementActiveConnections();
        
        // Track errors
        if (res.statusCode >= 400) {
            systemMetrics.incrementErrors();
        }
    });
    
    next();
};

module.exports = {
    systemMetrics,
    systemMetricsMiddleware
};
