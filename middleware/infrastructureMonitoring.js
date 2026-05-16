/**
 * Infrastructure Monitoring System
 * Provides comprehensive infrastructure monitoring capabilities including
 * Prometheus/Grafana integration, Docker deployment monitoring, and system health checks
 */

class InfrastructureMonitoring {
    constructor() {
        this.metrics = new Map();
        this.alerts = [];
        this.systemHealth = {
            status: 'healthy',
            lastCheck: new Date(),
            uptime: 0
        };
        this.prometheusMetrics = new Map();
        this.grafanaDashboards = new Map();
        this.dockerContainers = new Map();
        this.systemResources = {
            cpu: { usage: 0, cores: 0, loadAverage: [0, 0, 0] },
            memory: { total: 0, used: 0, free: 0, percentage: 0 },
            disk: { total: 0, used: 0, free: 0, percentage: 0 },
            network: { bytesIn: 0, bytesOut: 0, connections: 0 }
        };
        this.initializeMetrics();
    }

    initializeMetrics() {
        // Initialize Prometheus metrics
        this.prometheusMetrics.set('infrastructure_health', {
            type: 'gauge',
            help: 'Infrastructure health status',
            value: 1
        });
        
        this.prometheusMetrics.set('system_cpu_usage', {
            type: 'gauge',
            help: 'System CPU usage percentage',
            value: 0
        });
        
        this.prometheusMetrics.set('system_memory_usage', {
            type: 'gauge',
            help: 'System memory usage percentage',
            value: 0
        });
        
        this.prometheusMetrics.set('system_disk_usage', {
            type: 'gauge',
            help: 'System disk usage percentage',
            value: 0
        });
        
        this.prometheusMetrics.set('docker_containers_running', {
            type: 'gauge',
            help: 'Number of running Docker containers',
            value: 0
        });
        
        this.prometheusMetrics.set('prometheus_scrape_success', {
            type: 'counter',
            help: 'Prometheus scrape success count',
            value: 0
        });
        
        this.prometheusMetrics.set('grafana_dashboard_requests', {
            type: 'counter',
            help: 'Grafana dashboard request count',
            value: 0
        });
    }

    // System Resource Monitoring
    updateSystemResources() {
        const now = Date.now();
        
        // Simulate CPU monitoring
        const cpuUsage = Math.random() * 20; // 0-20% CPU usage
        this.systemResources.cpu = {
            usage: cpuUsage,
            cores: 4,
            loadAverage: [
                cpuUsage * 0.8,
                cpuUsage * 0.9,
                cpuUsage * 1.1
            ]
        };
        
        // Simulate memory monitoring
        const totalMemory = 8 * 1024 * 1024 * 1024; // 8GB
        const usedMemory = totalMemory * (0.3 + Math.random() * 0.2); // 30-50%
        this.systemResources.memory = {
            total: totalMemory,
            used: usedMemory,
            free: totalMemory - usedMemory,
            percentage: (usedMemory / totalMemory) * 100
        };
        
        // Simulate disk monitoring
        const totalDisk = 100 * 1024 * 1024 * 1024; // 100GB
        const usedDisk = totalDisk * (0.4 + Math.random() * 0.3); // 40-70%
        this.systemResources.disk = {
            total: totalDisk,
            used: usedDisk,
            free: totalDisk - usedDisk,
            percentage: (usedDisk / totalDisk) * 100
        };
        
        // Simulate network monitoring
        this.systemResources.network = {
            bytesIn: Math.floor(Math.random() * 1000000), // 0-1MB/s
            bytesOut: Math.floor(Math.random() * 500000), // 0-500KB/s
            connections: Math.floor(Math.random() * 100) // 0-100 connections
        };
        
        // Update Prometheus metrics
        this.prometheusMetrics.get('system_cpu_usage').value = cpuUsage;
        this.prometheusMetrics.get('system_memory_usage').value = this.systemResources.memory.percentage;
        this.prometheusMetrics.get('system_disk_usage').value = this.systemResources.disk.percentage;
        
        return this.systemResources;
    }

    // Docker Container Monitoring
    updateDockerContainers() {
        // Simulate Docker container monitoring
        const containers = [
            { id: 'nexus-api', name: 'nexus-api-server', status: 'running', cpu: 5.2, memory: 256 },
            { id: 'nexus-db', name: 'nexus-database', status: 'running', cpu: 2.1, memory: 512 },
            { id: 'nexus-cache', name: 'nexus-redis', status: 'running', cpu: 1.5, memory: 128 },
            { id: 'prometheus', name: 'prometheus-server', status: 'running', cpu: 3.8, memory: 384 },
            { id: 'grafana', name: 'grafana-dashboard', status: 'running', cpu: 2.3, memory: 256 }
        ];
        
        containers.forEach(container => {
            this.dockerContainers.set(container.id, {
                ...container,
                lastUpdate: new Date(),
                uptime: Math.floor(Math.random() * 86400), // 0-24 hours
                restartCount: Math.floor(Math.random() * 3)
            });
        });
        
        this.prometheusMetrics.get('docker_containers_running').value = containers.length;
        
        return Array.from(this.dockerContainers.values());
    }

    // Prometheus Integration
    updatePrometheusMetrics() {
        const success = Math.random() > 0.05; // 95% success rate
        if (success) {
            const currentCount = this.prometheusMetrics.get('prometheus_scrape_success').value;
            this.prometheusMetrics.get('prometheus_scrape_success').value = currentCount + 1;
        }
        
        return {
            success,
            metricsCount: this.prometheusMetrics.size,
            lastScrape: new Date(),
            scrapeInterval: 5000 // 5 seconds
        };
    }

    // Grafana Dashboard Monitoring
    updateGrafanaDashboards() {
        const dashboards = [
            { id: 'nexus-overview', name: 'NEXUS System Overview', panels: 12, requests: 145 },
            { id: 'infrastructure', name: 'Infrastructure Metrics', panels: 8, requests: 89 },
            { id: 'application', name: 'Application Performance', panels: 10, requests: 123 },
            { id: 'business', name: 'Business Intelligence', panels: 6, requests: 67 }
        ];
        
        dashboards.forEach(dashboard => {
            this.grafanaDashboards.set(dashboard.id, {
                ...dashboard,
                lastUpdate: new Date(),
                avgLoadTime: Math.random() * 1000 + 200 // 200-1200ms
            });
        });
        
        // Update request counter
        const currentCount = this.prometheusMetrics.get('grafana_dashboard_requests').value;
        this.prometheusMetrics.get('grafana_dashboard_requests').value = currentCount + 1;
        
        return Array.from(this.grafanaDashboards.values());
    }

    // System Health Check
    performHealthCheck() {
        const now = Date.now();
        const cpuHealthy = this.systemResources.cpu.usage < 80;
        const memoryHealthy = this.systemResources.memory.percentage < 85;
        const diskHealthy = this.systemResources.disk.percentage < 90;
        const networkHealthy = this.systemResources.network.connections < 1000;
        
        const overallHealthy = cpuHealthy && memoryHealthy && diskHealthy && networkHealthy;
        
        this.systemHealth = {
            status: overallHealthy ? 'healthy' : 'warning',
            lastCheck: new Date(),
            uptime: now,
            checks: {
                cpu: cpuHealthy ? 'pass' : 'fail',
                memory: memoryHealthy ? 'pass' : 'fail',
                disk: diskHealthy ? 'pass' : 'fail',
                network: networkHealthy ? 'pass' : 'fail'
            },
            score: overallHealthy ? 100 : Math.floor(
                (cpuHealthy ? 25 : 0) +
                (memoryHealthy ? 25 : 0) +
                (diskHealthy ? 25 : 0) +
                (networkHealthy ? 25 : 0)
            )
        };
        
        this.prometheusMetrics.get('infrastructure_health').value = overallHealthy ? 1 : 0;
        
        return this.systemHealth;
    }

    // Alert Management
    generateAlerts() {
        const alerts = [];
        const now = new Date();
        
        // CPU Alert
        if (this.systemResources.cpu.usage > 75) {
            alerts.push({
                id: `cpu_alert_${now.getTime()}`,
                type: 'cpu',
                severity: 'warning',
                message: `High CPU usage: ${this.systemResources.cpu.usage.toFixed(2)}%`,
                value: this.systemResources.cpu.usage,
                threshold: 75,
                timestamp: now
            });
        }
        
        // Memory Alert
        if (this.systemResources.memory.percentage > 80) {
            alerts.push({
                id: `memory_alert_${now.getTime()}`,
                type: 'memory',
                severity: 'critical',
                message: `High memory usage: ${this.systemResources.memory.percentage.toFixed(2)}%`,
                value: this.systemResources.memory.percentage,
                threshold: 80,
                timestamp: now
            });
        }
        
        // Disk Alert
        if (this.systemResources.disk.percentage > 85) {
            alerts.push({
                id: `disk_alert_${now.getTime()}`,
                type: 'disk',
                severity: 'warning',
                message: `High disk usage: ${this.systemResources.disk.percentage.toFixed(2)}%`,
                value: this.systemResources.disk.percentage,
                threshold: 85,
                timestamp: now
            });
        }
        
        this.alerts = alerts;
        return alerts;
    }

    // Get comprehensive infrastructure data
    getInfrastructureData() {
        return {
            systemResources: this.updateSystemResources(),
            dockerContainers: this.updateDockerContainers(),
            prometheusMetrics: this.updatePrometheusMetrics(),
            grafanaDashboards: this.updateGrafanaDashboards(),
            systemHealth: this.performHealthCheck(),
            alerts: this.generateAlerts(),
            metrics: {
                totalMetrics: this.prometheusMetrics.size,
                totalDashboards: this.grafanaDashboards.size,
                totalContainers: this.dockerContainers.size,
                activeAlerts: this.alerts.length
            }
        };
    }

    // Get Prometheus formatted metrics
    getPrometheusMetrics() {
        let metricsText = '';
        
        this.prometheusMetrics.forEach((metric, name) => {
            metricsText += `# HELP ${name} ${metric.help}\n`;
            metricsText += `# TYPE ${name} ${metric.type}\n`;
            metricsText += `${name} ${metric.value}\n\n`;
        });
        
        return metricsText;
    }

    // Get infrastructure analytics
    getInfrastructureAnalytics() {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        return {
            performance: {
                avgCpuUsage: this.systemResources.cpu.usage,
                avgMemoryUsage: this.systemResources.memory.percentage,
                avgDiskUsage: this.systemResources.disk.percentage,
                networkThroughput: this.systemResources.network.bytesIn + this.systemResources.network.bytesOut
            },
            availability: {
                uptime: this.systemHealth.uptime,
                healthScore: this.systemHealth.score,
                lastHealthCheck: this.systemHealth.lastCheck
            },
            containers: {
                total: this.dockerContainers.size,
                running: Array.from(this.dockerContainers.values()).filter(c => c.status === 'running').length,
                avgCpuUsage: Array.from(this.dockerContainers.values()).reduce((sum, c) => sum + c.cpu, 0) / this.dockerContainers.size,
                avgMemoryUsage: Array.from(this.dockerContainers.values()).reduce((sum, c) => sum + c.memory, 0) / this.dockerContainers.size
            },
            monitoring: {
                prometheusSuccess: this.prometheusMetrics.get('prometheus_scrape_success').value,
                grafanaRequests: this.prometheusMetrics.get('grafana_dashboard_requests').value,
                activeAlerts: this.alerts.length,
                lastUpdate: now
            }
        };
    }
}

// Create singleton instance
const infrastructureMonitoring = new InfrastructureMonitoring();

// Export the instance and utility functions
module.exports = {
    infrastructureMonitoring,
    updateSystemResources: () => infrastructureMonitoring.updateSystemResources(),
    updateDockerContainers: () => infrastructureMonitoring.updateDockerContainers(),
    updatePrometheusMetrics: () => infrastructureMonitoring.updatePrometheusMetrics(),
    updateGrafanaDashboards: () => infrastructureMonitoring.updateGrafanaDashboards(),
    performHealthCheck: () => infrastructureMonitoring.performHealthCheck(),
    generateAlerts: () => infrastructureMonitoring.generateAlerts(),
    getInfrastructureData: () => infrastructureMonitoring.getInfrastructureData(),
    getPrometheusMetrics: () => infrastructureMonitoring.getPrometheusMetrics(),
    getInfrastructureAnalytics: () => infrastructureMonitoring.getInfrastructureAnalytics()
};
