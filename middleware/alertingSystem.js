const axios = require('axios');

// Alert severity levels
const ALERT_SEVERITY = {
    CRITICAL: 'critical',
    HIGH: 'high',
    WARNING: 'warning',
    INFO: 'info'
};

// Alert status
const ALERT_STATUS = {
    FIRING: 'firing',
    RESOLVED: 'resolved',
    SILENCED: 'silenced'
};

// Notification channels
const NOTIFICATION_CHANNELS = {
    EMAIL: 'email',
    SLACK: 'slack',
    PAGERDUTY: 'pagerduty',
    WEBHOOK: 'webhook',
    SMS: 'sms'
};

// Alert store (in production, use database)
const alerts = [];
const alertRules = [];
const notificationHistory = [];
const escalationPolicies = [];

class AlertingSystem {
    constructor() {
        this.initializeAlertRules();
        this.initializeEscalationPolicies();
        this.startAlertProcessing();
    }

    initializeAlertRules() {
        // Default alert rules
        alertRules.push(
            {
                id: 'high_error_rate',
                name: 'High Error Rate',
                condition: 'error_rate > 0.1',
                severity: ALERT_SEVERITY.CRITICAL,
                threshold: 0.1,
                duration: 300, // 5 minutes
                enabled: true,
                description: 'Error rate exceeds 10%'
            },
            {
                id: 'high_response_time',
                name: 'High Response Time',
                condition: 'response_time_p95 > 1000',
                severity: ALERT_SEVERITY.WARNING,
                threshold: 1000,
                duration: 300,
                enabled: true,
                description: '95th percentile response time exceeds 1 second'
            },
            {
                id: 'service_down',
                name: 'Service Down',
                condition: 'service_up == 0',
                severity: ALERT_SEVERITY.CRITICAL,
                threshold: 0,
                duration: 60,
                enabled: true,
                description: 'Service is not responding'
            },
            {
                id: 'high_cpu_usage',
                name: 'High CPU Usage',
                condition: 'cpu_usage > 80',
                severity: ALERT_SEVERITY.WARNING,
                threshold: 80,
                duration: 300,
                enabled: true,
                description: 'CPU usage exceeds 80%'
            },
            {
                id: 'memory_usage_high',
                name: 'High Memory Usage',
                condition: 'memory_usage > 85',
                severity: ALERT_SEVERITY.WARNING,
                threshold: 85,
                duration: 300,
                enabled: true,
                description: 'Memory usage exceeds 85%'
            },
            {
                id: 'disk_space_low',
                name: 'Low Disk Space',
                condition: 'disk_space_available < 15',
                severity: ALERT_SEVERITY.CRITICAL,
                threshold: 15,
                duration: 300,
                enabled: true,
                description: 'Available disk space is less than 15%'
            },
            {
                id: 'database_connections_high',
                name: 'High Database Connections',
                condition: 'db_connections > 80',
                severity: ALERT_SEVERITY.WARNING,
                threshold: 80,
                duration: 300,
                enabled: true,
                description: 'Database connections exceed 80'
            },
            {
                id: 'security_event_critical',
                name: 'Critical Security Event',
                condition: 'security_events_critical > 0',
                severity: ALERT_SEVERITY.CRITICAL,
                threshold: 0,
                duration: 60,
                enabled: true,
                description: 'Critical security events detected'
            }
        );
    }

    initializeEscalationPolicies() {
        escalationPolicies.push(
            {
                id: 'critical_escalation',
                name: 'Critical Alert Escalation',
                severity: ALERT_SEVERITY.CRITICAL,
                steps: [
                    {
                        delay: 0,
                        channels: [NOTIFICATION_CHANNELS.PAGERDUTY, NOTIFICATION_CHANNELS.SLACK],
                        message: 'Critical alert requiring immediate attention'
                    },
                    {
                        delay: 300, // 5 minutes
                        channels: [NOTIFICATION_CHANNELS.SMS, NOTIFICATION_CHANNELS.EMAIL],
                        message: 'Critical alert escalation - no response received'
                    },
                    {
                        delay: 900, // 15 minutes total
                        channels: [NOTIFICATION_CHANNELS.WEBHOOK],
                        message: 'Critical alert - emergency escalation'
                    }
                ]
            },
            {
                id: 'high_escalation',
                name: 'High Priority Alert Escalation',
                severity: ALERT_SEVERITY.HIGH,
                steps: [
                    {
                        delay: 0,
                        channels: [NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.SLACK],
                        message: 'High priority alert'
                    },
                    {
                        delay: 600, // 10 minutes
                        channels: [NOTIFICATION_CHANNELS.PAGERDUTY],
                        message: 'High priority alert escalation'
                    }
                ]
            },
            {
                id: 'warning_escalation',
                name: 'Warning Alert Escalation',
                severity: ALERT_SEVERITY.WARNING,
                steps: [
                    {
                        delay: 0,
                        channels: [NOTIFICATION_CHANNELS.EMAIL],
                        message: 'Warning alert'
                    }
                ]
            }
        );
    }

    startAlertProcessing() {
        // Process alerts every 30 seconds
        setInterval(() => {
            this.processAlerts();
        }, 30000);
        
        // Clean up old alerts every hour
        setInterval(() => {
            this.cleanupOldAlerts();
        }, 3600000);
    }

    async processAlerts() {
        try {
            // Check all alert rules
            for (const rule of alertRules) {
                if (!rule.enabled) continue;
                
                const isTriggered = await this.evaluateAlertRule(rule);
                const existingAlert = this.findActiveAlert(rule.id);
                
                if (isTriggered && !existingAlert) {
                    // New alert
                    await this.createAlert(rule);
                } else if (!isTriggered && existingAlert) {
                    // Alert resolved
                    await this.resolveAlert(existingAlert);
                } else if (isTriggered && existingAlert) {
                    // Check for escalation
                    await this.checkEscalation(existingAlert);
                }
            }
        } catch (error) {
            console.error('Error processing alerts:', error);
        }
    }

    async evaluateAlertRule(rule) {
        try {
            // This would integrate with monitoring metrics
            // For now, we'll simulate the evaluation
            
            switch (rule.id) {
                case 'high_error_rate':
                    return await this.checkErrorRate(rule.threshold);
                case 'high_response_time':
                    return await this.checkResponseTime(rule.threshold);
                case 'service_down':
                    return await this.checkServiceStatus();
                case 'high_cpu_usage':
                    return await this.checkCPUUsage(rule.threshold);
                case 'memory_usage_high':
                    return await this.checkMemoryUsage(rule.threshold);
                case 'disk_space_low':
                    return await this.checkDiskSpace(rule.threshold);
                case 'database_connections_high':
                    return await this.checkDatabaseConnections(rule.threshold);
                case 'security_event_critical':
                    return await this.checkSecurityEvents();
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Error evaluating alert rule ${rule.id}:`, error);
            return false;
        }
    }

    async checkErrorRate(threshold) {
        // Simulate error rate check
        const errorRate = Math.random() * 0.2; // 0-20% error rate
        return errorRate > threshold;
    }

    async checkResponseTime(threshold) {
        // Simulate response time check
        const responseTime = Math.random() * 2000; // 0-2000ms
        return responseTime > threshold;
    }

    async checkServiceStatus() {
        // Check if service is up
        try {
            const response = await axios.get('http://localhost:3000/api/health', { timeout: 5000 });
            return response.status !== 200;
        } catch (error) {
            return true; // Service is down
        }
    }

    async checkCPUUsage(threshold) {
        // Simulate CPU usage check
        const cpuUsage = Math.random() * 100;
        return cpuUsage > threshold;
    }

    async checkMemoryUsage(threshold) {
        // Simulate memory usage check
        const memoryUsage = Math.random() * 100;
        return memoryUsage > threshold;
    }

    async checkDiskSpace(threshold) {
        // Simulate disk space check
        const diskSpace = Math.random() * 100;
        return diskSpace < threshold;
    }

    async checkDatabaseConnections(threshold) {
        // Simulate database connections check
        const connections = Math.floor(Math.random() * 100);
        return connections > threshold;
    }

    async checkSecurityEvents() {
        // Check for critical security events
        try {
            const response = await axios.get('http://localhost:3000/api/security/dashboard', { timeout: 5000 });
            const data = response.data;
            const criticalEvents = data.data?.recentEvents?.filter(event => 
                event.type === 'brute_force_detected' || event.type === 'malicious_request'
            );
            return criticalEvents && criticalEvents.length > 0;
        } catch (error) {
            return false;
        }
    }

    findActiveAlert(ruleId) {
        return alerts.find(alert => 
            alert.ruleId === ruleId && 
            alert.status === ALERT_STATUS.FIRING
        );
    }

    async createAlert(rule) {
        const alert = {
            id: this.generateAlertId(),
            ruleId: rule.id,
            name: rule.name,
            severity: rule.severity,
            status: ALERT_STATUS.FIRING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            description: rule.description,
            condition: rule.condition,
            threshold: rule.threshold,
            currentValue: await this.getCurrentValue(rule.id),
            escalationLevel: 0,
            notificationsSent: []
        };
        
        alerts.push(alert);
        
        // Send initial notification
        await this.sendNotification(alert, 0);
        
        console.warn(`[ALERT] ${alert.name} - ${alert.severity.toUpperCase()}: ${alert.description}`);
        
        return alert;
    }

    async resolveAlert(alert) {
        alert.status = ALERT_STATUS.RESOLVED;
        alert.updatedAt = new Date().toISOString();
        alert.resolvedAt = new Date().toISOString();
        
        // Send resolution notification
        await this.sendResolutionNotification(alert);
        
        console.info(`[ALERT RESOLVED] ${alert.name}`);
        
        return alert;
    }

    async checkEscalation(alert) {
        const policy = escalationPolicies.find(p => p.severity === alert.severity);
        if (!policy) return;
        
        const timeSinceCreation = Date.now() - new Date(alert.createdAt).getTime();
        const nextEscalationStep = policy.steps[alert.escalationLevel + 1];
        
        if (nextEscalationStep && timeSinceCreation > nextEscalationStep.delay * 1000) {
            alert.escalationLevel++;
            alert.updatedAt = new Date().toISOString();
            
            await this.sendNotification(alert, alert.escalationLevel);
            
            console.warn(`[ALERT ESCALATED] ${alert.name} - Level ${alert.escalationLevel}`);
        }
    }

    async sendNotification(alert, escalationLevel) {
        const policy = escalationPolicies.find(p => p.severity === alert.severity);
        if (!policy || !policy.steps[escalationLevel]) return;
        
        const step = policy.steps[escalationLevel];
        
        for (const channel of step.channels) {
            try {
                await this.sendToChannel(channel, alert, step.message);
                
                notificationHistory.push({
                    alertId: alert.id,
                    channel,
                    message: step.message,
                    sentAt: new Date().toISOString(),
                    success: true
                });
                
                alert.notificationsSent.push({
                    channel,
                    sentAt: new Date().toISOString(),
                    escalationLevel
                });
                
            } catch (error) {
                console.error(`Failed to send notification to ${channel}:`, error);
                
                notificationHistory.push({
                    alertId: alert.id,
                    channel,
                    message: step.message,
                    sentAt: new Date().toISOString(),
                    success: false,
                    error: error.message
                });
            }
        }
    }

    async sendResolutionNotification(alert) {
        const resolutionMessage = `Resolved: ${alert.name} - ${alert.description}`;
        
        // Send resolution to all channels that received the alert
        const channelsSent = [...new Set(alert.notificationsSent.map(n => n.channel))];
        
        for (const channel of channelsSent) {
            try {
                await this.sendToChannel(channel, alert, resolutionMessage, true);
                
                notificationHistory.push({
                    alertId: alert.id,
                    channel,
                    message: resolutionMessage,
                    sentAt: new Date().toISOString(),
                    success: true,
                    type: 'resolution'
                });
                
            } catch (error) {
                console.error(`Failed to send resolution notification to ${channel}:`, error);
            }
        }
    }

    async sendToChannel(channel, alert, message, isResolution = false) {
        switch (channel) {
            case NOTIFICATION_CHANNELS.EMAIL:
                await this.sendEmailNotification(alert, message, isResolution);
                break;
            case NOTIFICATION_CHANNELS.SLACK:
                await this.sendSlackNotification(alert, message, isResolution);
                break;
            case NOTIFICATION_CHANNELS.PAGERDUTY:
                await this.sendPagerDutyNotification(alert, message, isResolution);
                break;
            case NOTIFICATION_CHANNELS.WEBHOOK:
                await this.sendWebhookNotification(alert, message, isResolution);
                break;
            case NOTIFICATION_CHANNELS.SMS:
                await this.sendSMSNotification(alert, message, isResolution);
                break;
            default:
                console.warn(`Unknown notification channel: ${channel}`);
        }
    }

    async sendEmailNotification(alert, message, isResolution) {
        // Email notification implementation
        console.log(`[EMAIL] ${isResolution ? 'RESOLVED' : 'ALERT'}: ${alert.name} - ${message}`);
        
        // In production, integrate with email service (SendGrid, AWS SES, etc.)
        const emailData = {
            to: process.env.ALERT_EMAIL_TO || 'admin@nexus-support.com',
            subject: `[${isResolution ? 'RESOLVED' : 'ALERT'}] ${alert.name}`,
            body: `
                Alert: ${alert.name}
                Severity: ${alert.severity}
                Status: ${isResolution ? 'RESOLVED' : 'FIRING'}
                Description: ${alert.description}
                Current Value: ${alert.currentValue}
                Threshold: ${alert.threshold}
                Created: ${alert.createdAt}
                ${isResolution ? `Resolved: ${alert.resolvedAt}` : ''}
                Message: ${message}
            `
        };
        
        // Send email (implementation depends on email service)
        // await emailService.send(emailData);
    }

    async sendSlackNotification(alert, message, isResolution) {
        // Slack notification implementation
        console.log(`[SLACK] ${isResolution ? 'RESOLVED' : 'ALERT'}: ${alert.name} - ${message}`);
        
        if (!process.env.SLACK_WEBHOOK_URL) {
            console.warn('Slack webhook URL not configured');
            return;
        }
        
        const slackMessage = {
            text: `${isResolution ? '✅ Resolved' : '🚨 Alert'}: ${alert.name}`,
            attachments: [{
                color: isResolution ? 'good' : (alert.severity === ALERT_SEVERITY.CRITICAL ? 'danger' : 'warning'),
                fields: [
                    { title: 'Severity', value: alert.severity, short: true },
                    { title: 'Status', value: isResolution ? 'RESOLVED' : 'FIRING', short: true },
                    { title: 'Description', value: alert.description, short: false },
                    { title: 'Current Value', value: alert.currentValue, short: true },
                    { title: 'Threshold', value: alert.threshold, short: true },
                    { title: 'Message', value: message, short: false }
                ],
                timestamp: Math.floor(new Date(alert.createdAt).getTime() / 1000)
            }]
        };
        
        try {
            await axios.post(process.env.SLACK_WEBHOOK_URL, slackMessage);
        } catch (error) {
            console.error('Failed to send Slack notification:', error);
        }
    }

    async sendPagerDutyNotification(alert, message, isResolution) {
        // PagerDuty notification implementation
        console.log(`[PAGERDUTY] ${isResolution ? 'RESOLVED' : 'ALERT'}: ${alert.name} - ${message}`);
        
        if (!process.env.PAGERDUTY_INTEGRATION_KEY) {
            console.warn('PagerDuty integration key not configured');
            return;
        }
        
        const payload = {
            routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
            event_action: isResolution ? 'resolve' : 'trigger',
            dedup_key: alert.id,
            payload: {
                summary: alert.name,
                source: 'nexus-support-system',
                severity: isResolution ? 'info' : alert.severity,
                timestamp: alert.createdAt,
                component: 'application',
                group: alert.severity,
                class: 'alert',
                custom_details: {
                    description: alert.description,
                    currentValue: alert.currentValue,
                    threshold: alert.threshold,
                    message: message
                }
            }
        };
        
        try {
            await axios.post('https://events.pagerduty.com/v2/enqueue', payload);
        } catch (error) {
            console.error('Failed to send PagerDuty notification:', error);
        }
    }

    async sendWebhookNotification(alert, message, isResolution) {
        // Webhook notification implementation
        console.log(`[WEBHOOK] ${isResolution ? 'RESOLVED' : 'ALERT'}: ${alert.name} - ${message}`);
        
        const webhookUrl = process.env.ALERT_WEBHOOK_URL;
        if (!webhookUrl) {
            console.warn('Alert webhook URL not configured');
            return;
        }
        
        const webhookPayload = {
            alert: {
                id: alert.id,
                name: alert.name,
                severity: alert.severity,
                status: isResolution ? 'RESOLVED' : 'FIRING',
                description: alert.description,
                currentValue: alert.currentValue,
                threshold: alert.threshold,
                createdAt: alert.createdAt,
                resolvedAt: alert.resolvedAt
            },
            message: message,
            timestamp: new Date().toISOString()
        };
        
        try {
            await axios.post(webhookUrl, webhookPayload);
        } catch (error) {
            console.error('Failed to send webhook notification:', error);
        }
    }

    async sendSMSNotification(alert, message, isResolution) {
        // SMS notification implementation
        console.log(`[SMS] ${isResolution ? 'RESOLVED' : 'ALERT'}: ${alert.name} - ${message}`);
        
        // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
        const smsData = {
            to: process.env.ALERT_SMS_TO || '+1234567890',
            body: `[${isResolution ? 'RESOLVED' : 'ALERT'}] ${alert.name}: ${message}`
        };
        
        // Send SMS (implementation depends on SMS service)
        // await smsService.send(smsData);
    }

    async getCurrentValue(ruleId) {
        // Get current metric value for the rule
        switch (ruleId) {
            case 'high_error_rate':
                return (Math.random() * 0.2).toFixed(3);
            case 'high_response_time':
                return Math.floor(Math.random() * 2000);
            case 'high_cpu_usage':
                return Math.floor(Math.random() * 100);
            case 'memory_usage_high':
                return Math.floor(Math.random() * 100);
            case 'disk_space_low':
                return Math.floor(Math.random() * 100);
            case 'database_connections_high':
                return Math.floor(Math.random() * 100);
            default:
                return 0;
        }
    }

    generateAlertId() {
        return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanupOldAlerts() {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        // Remove old resolved alerts
        const filteredAlerts = alerts.filter(alert => {
            if (alert.status === ALERT_STATUS.RESOLVED) {
                return new Date(alert.resolvedAt).getTime() > oneWeekAgo;
            }
            return true;
        });
        
        alerts.length = 0;
        alerts.push(...filteredAlerts);
        
        // Remove old notification history
        const filteredHistory = notificationHistory.filter(notification => 
            new Date(notification.sentAt).getTime() > oneWeekAgo
        );
        
        notificationHistory.length = 0;
        notificationHistory.push(...filteredHistory);
    }

    getAlertStatus() {
        return {
            activeAlerts: alerts.filter(alert => alert.status === ALERT_STATUS.FIRING),
            recentAlerts: alerts.slice(-20),
            alertRules: alertRules,
            escalationPolicies: escalationPolicies,
            notificationHistory: notificationHistory.slice(-50),
            statistics: this.calculateAlertStatistics()
        };
    }

    calculateAlertStatistics() {
        const totalAlerts = alerts.length;
        const activeAlerts = alerts.filter(alert => alert.status === ALERT_STATUS.FIRING).length;
        const resolvedAlerts = alerts.filter(alert => alert.status === ALERT_STATUS.RESOLVED).length;
        
        const severityBreakdown = {};
        Object.values(ALERT_SEVERITY).forEach(severity => {
            severityBreakdown[severity] = alerts.filter(alert => alert.severity === severity).length;
        });
        
        const channelStats = {};
        Object.values(NOTIFICATION_CHANNELS).forEach(channel => {
            channelStats[channel] = notificationHistory.filter(notification => notification.channel === channel).length;
        });
        
        return {
            totalAlerts,
            activeAlerts,
            resolvedAlerts,
            severityBreakdown,
            channelStats,
            averageResolutionTime: this.calculateAverageResolutionTime()
        };
    }

    calculateAverageResolutionTime() {
        const resolvedAlerts = alerts.filter(alert => alert.status === ALERT_STATUS.RESOLVED && alert.resolvedAt);
        
        if (resolvedAlerts.length === 0) return 0;
        
        const totalTime = resolvedAlerts.reduce((sum, alert) => {
            const created = new Date(alert.createdAt).getTime();
            const resolved = new Date(alert.resolvedAt).getTime();
            return sum + (resolved - created);
        }, 0);
        
        return totalTime / resolvedAlerts.length / (1000 * 60); // Convert to minutes
    }

    // Alert management methods
    addAlertRule(rule) {
        alertRules.push(rule);
    }

    updateAlertRule(ruleId, updates) {
        const rule = alertRules.find(r => r.id === ruleId);
        if (rule) {
            Object.assign(rule, updates);
        }
    }

    deleteAlertRule(ruleId) {
        const index = alertRules.findIndex(r => r.id === ruleId);
        if (index > -1) {
            alertRules.splice(index, 1);
        }
    }

    addEscalationPolicy(policy) {
        escalationPolicies.push(policy);
    }

    updateEscalationPolicy(policyId, updates) {
        const policy = escalationPolicies.find(p => p.id === policyId);
        if (policy) {
            Object.assign(policy, updates);
        }
    }

    deleteEscalationPolicy(policyId) {
        const index = escalationPolicies.findIndex(p => p.id === policyId);
        if (index > -1) {
            escalationPolicies.splice(index, 1);
        }
    }

    silenceAlert(alertId, duration = 3600000) { // Default 1 hour
        const alert = alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = ALERT_STATUS.SILENCED;
            alert.silencedUntil = new Date(Date.now() + duration).toISOString();
            
            // Auto-unsilence after duration
            setTimeout(() => {
                if (alert.status === ALERT_STATUS.SILENCED) {
                    alert.status = ALERT_STATUS.FIRING;
                    delete alert.silencedUntil;
                }
            }, duration);
        }
    }
}

// Create global alerting instance
const alertingSystem = new AlertingSystem();

// Alerting endpoints
const getAlertStatus = (req, res) => {
    try {
        const status = alertingSystem.getAlertStatus();
        
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting alert status:', error);
        res.status(500).json({ success: false, error: 'Failed to get alert status' });
    }
};

const createAlertRule = (req, res) => {
    try {
        const rule = req.body;
        alertingSystem.addAlertRule(rule);
        
        res.json({
            success: true,
            message: 'Alert rule created',
            data: rule
        });
    } catch (error) {
        console.error('Error creating alert rule:', error);
        res.status(500).json({ success: false, error: 'Failed to create alert rule' });
    }
};

const updateAlertRule = (req, res) => {
    try {
        const { ruleId } = req.params;
        const updates = req.body;
        
        alertingSystem.updateAlertRule(ruleId, updates);
        
        res.json({
            success: true,
            message: 'Alert rule updated'
        });
    } catch (error) {
        console.error('Error updating alert rule:', error);
        res.status(500).json({ success: false, error: 'Failed to update alert rule' });
    }
};

const deleteAlertRule = (req, res) => {
    try {
        const { ruleId } = req.params;
        
        alertingSystem.deleteAlertRule(ruleId);
        
        res.json({
            success: true,
            message: 'Alert rule deleted'
        });
    } catch (error) {
        console.error('Error deleting alert rule:', error);
        res.status(500).json({ success: false, error: 'Failed to delete alert rule' });
    }
};

const silenceAlert = (req, res) => {
    try {
        const { alertId } = req.params;
        const { duration } = req.body;
        
        alertingSystem.silenceAlert(alertId, duration);
        
        res.json({
            success: true,
            message: 'Alert silenced'
        });
    } catch (error) {
        console.error('Error silencing alert:', error);
        res.status(500).json({ success: false, error: 'Failed to silence alert' });
    }
};

module.exports = {
    getAlertStatus,
    createAlertRule,
    updateAlertRule,
    deleteAlertRule,
    silenceAlert,
    alertingSystem,
    ALERT_SEVERITY,
    ALERT_STATUS,
    NOTIFICATION_CHANNELS
};
