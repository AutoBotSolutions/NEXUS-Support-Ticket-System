/**
 * NEXUS Automated Reporting System
 * Provides automated reporting capabilities for monitoring data
 */

class AutomatedReporting {
    constructor() {
        this.reports = new Map();
        this.reportTemplates = new Map();
        this.schedules = new Map();
        this.subscriptions = new Map();
        this.deliveryMethods = new Map();
        this.reportHistory = [];
        
        this.initializeReportTemplates();
        this.initializeDeliveryMethods();
        this.initializeDefaultSchedules();
    }

    initializeReportTemplates() {
        // Initialize report templates
        this.reportTemplates.set('system_health', {
            id: 'system_health',
            name: 'System Health Report',
            description: 'Comprehensive system health and performance report',
            type: 'system',
            frequency: 'daily',
            sections: [
                'overview',
                'performance',
                'security',
                'incidents',
                'recommendations'
            ],
            metrics: [
                'uptime',
                'response_time',
                'error_rate',
                'cpu_usage',
                'memory_usage',
                'active_users',
                'ticket_volume'
            ],
            format: 'html',
            recipients: ['admin@nexus-support.com'],
            enabled: true
        });

        this.reportTemplates.set('security_summary', {
            id: 'security_summary',
            name: 'Security Summary Report',
            description: 'Security events and threat intelligence summary',
            type: 'security',
            frequency: 'daily',
            sections: [
                'threat_overview',
                'security_events',
                'vulnerabilities',
                'threat_intelligence',
                'recommendations'
            ],
            metrics: [
                'security_events',
                'blocked_ips',
                'threat_indicators',
                'vulnerabilities_found',
                'authentication_failures'
            ],
            format: 'html',
            recipients: ['security@nexus-support.com'],
            enabled: true
        });

        this.reportTemplates.set('business_metrics', {
            id: 'business_metrics',
            name: 'Business Metrics Report',
            description: 'Business KPIs and analytics report',
            type: 'business',
            frequency: 'weekly',
            sections: [
                'overview',
                'kpis',
                'user_analytics',
                'ticket_analytics',
                'trends'
            ],
            metrics: [
                'user_growth',
                'ticket_resolution_rate',
                'customer_satisfaction',
                'system_usage',
                'revenue_impact'
            ],
            format: 'pdf',
            recipients: ['management@nexus-support.com'],
            enabled: true
        });

        this.reportTemplates.set('performance_analysis', {
            id: 'performance_analysis',
            name: 'Performance Analysis Report',
            description: 'Detailed performance analysis and optimization recommendations',
            type: 'performance',
            frequency: 'weekly',
            sections: [
                'performance_summary',
                'bottlenecks',
                'trends',
                'comparisons',
                'recommendations'
            ],
            metrics: [
                'response_time',
                'throughput',
                'error_rate',
                'resource_utilization',
                'user_experience'
            ],
            format: 'html',
            recipients: ['devops@nexus-support.com'],
            enabled: true
        });

        this.reportTemplates.set('incident_summary', {
            id: 'incident_summary',
            name: 'Incident Summary Report',
            description: 'Summary of incidents and on-call performance',
            type: 'incidents',
            frequency: 'weekly',
            sections: [
                'incident_overview',
                'response_times',
                'escalations',
                'on_call_performance',
                'lessons_learned'
            ],
            metrics: [
                'incident_count',
                'mean_time_to_resolve',
                'escalation_rate',
                'on_call_coverage',
                'customer_impact'
            ],
            format: 'html',
            recipients: ['ops@nexus-support.com'],
            enabled: true
        });
    }

    initializeDeliveryMethods() {
        // Initialize delivery methods
        this.deliveryMethods.set('email', {
            id: 'email',
            name: 'Email',
            type: 'email',
            enabled: true,
            config: {
                smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
                smtp_port: process.env.SMTP_PORT || 587,
                username: process.env.SMTP_USERNAME,
                password: process.env.SMTP_PASSWORD,
                from: process.env.SMTP_FROM || 'reports@nexus-support.com'
            }
        });

        this.deliveryMethods.set('webhook', {
            id: 'webhook',
            name: 'Webhook',
            type: 'webhook',
            enabled: true,
            config: {
                url: process.env.REPORT_WEBHOOK_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.REPORT_WEBHOOK_TOKEN || ''}`
                }
            }
        });

        this.deliveryMethods.set('slack', {
            id: 'slack',
            name: 'Slack',
            type: 'slack',
            enabled: true,
            config: {
                webhook_url: process.env.SLACK_WEBHOOK_URL,
                channel: '#reports'
            }
        });

        this.deliveryMethods.set('storage', {
            id: 'storage',
            name: 'File Storage',
            type: 'storage',
            enabled: true,
            config: {
                path: './reports',
                retention_days: 90
            }
        });
    }

    initializeDefaultSchedules() {
        // Initialize default schedules
        this.schedules.set('daily_reports', {
            id: 'daily_reports',
            name: 'Daily Reports',
            type: 'recurring',
            frequency: 'daily',
            time: '08:00',
            timezone: 'UTC',
            reports: ['system_health', 'security_summary'],
            enabled: true,
            nextRun: this.getNextRunTime('daily', '08:00')
        });

        this.schedules.set('weekly_reports', {
            id: 'weekly_reports',
            name: 'Weekly Reports',
            type: 'recurring',
            frequency: 'weekly',
            day: 'monday',
            time: '09:00',
            timezone: 'UTC',
            reports: ['business_metrics', 'performance_analysis', 'incident_summary'],
            enabled: true,
            nextRun: this.getNextRunTime('weekly', '09:00', 'monday')
        });

        this.schedules.set('monthly_reports', {
            id: 'monthly_reports',
            name: 'Monthly Reports',
            type: 'recurring',
            frequency: 'monthly',
            day: 1,
            time: '10:00',
            timezone: 'UTC',
            reports: ['system_health', 'business_metrics'],
            enabled: true,
            nextRun: this.getNextRunTime('monthly', '10:00', 1)
        });
    }

    async generateReport(templateId, options = {}) {
        const template = this.reportTemplates.get(templateId);
        if (!template) {
            throw new Error(`Report template ${templateId} not found`);
        }

        const reportId = this.generateReportId();
        const startTime = Date.now();

        try {
            // Collect data for the report
            const data = await this.collectReportData(template, options);
            
            // Generate report content
            const content = await this.generateReportContent(template, data, options);
            
            // Create report object
            const report = {
                id: reportId,
                templateId: templateId,
                name: template.name,
                type: template.type,
                format: template.format,
                generatedAt: new Date().toISOString(),
                generatedBy: options.generatedBy || 'system',
                duration: Date.now() - startTime,
                status: 'completed',
                data: data,
                content: content,
                metadata: {
                    template: template,
                    options: options,
                    sections: template.sections,
                    metrics: template.metrics
                }
            };

            this.reports.set(reportId, report);
            this.reportHistory.push(report);

            return report;

        } catch (error) {
            const report = {
                id: reportId,
                templateId: templateId,
                name: template.name,
                type: template.type,
                format: template.format,
                generatedAt: new Date().toISOString(),
                generatedBy: options.generatedBy || 'system',
                duration: Date.now() - startTime,
                status: 'failed',
                error: error.message,
                data: null,
                content: null,
                metadata: {
                    template: template,
                    options: options
                }
            };

            this.reports.set(reportId, report);
            this.reportHistory.push(report);

            throw error;
        }
    }

    async collectReportData(template, options) {
        const data = {
            reportPeriod: this.getReportPeriod(options),
            generatedAt: new Date().toISOString(),
            sections: {}
        };

        // Collect data for each section
        for (const section of template.sections) {
            data.sections[section] = await this.collectSectionData(section, template.type, options);
        }

        return data;
    }

    async collectSectionData(section, reportType, options) {
        const sectionData = {
            title: this.formatSectionTitle(section),
            metrics: {},
            charts: [],
            summary: ''
        };

        switch (section) {
            case 'overview':
                sectionData.metrics = await this.getOverviewMetrics();
                sectionData.summary = 'System overview shows current operational status';
                break;

            case 'performance':
                sectionData.metrics = await this.getPerformanceMetrics();
                sectionData.charts = await this.getPerformanceCharts();
                sectionData.summary = 'Performance metrics indicate system health';
                break;

            case 'security':
                sectionData.metrics = await this.getSecurityMetrics();
                sectionData.charts = await this.getSecurityCharts();
                sectionData.summary = 'Security posture analysis completed';
                break;

            case 'incidents':
                sectionData.metrics = await this.getIncidentMetrics();
                sectionData.charts = await this.getIncidentCharts();
                sectionData.summary = 'Incident response performance reviewed';
                break;

            case 'threat_overview':
                sectionData.metrics = await this.getThreatOverviewMetrics();
                sectionData.charts = await this.getThreatCharts();
                sectionData.summary = 'Threat landscape analysis completed';
                break;

            case 'vulnerabilities':
                sectionData.metrics = await this.getVulnerabilityMetrics();
                sectionData.charts = await this.getVulnerabilityCharts();
                sectionData.summary = 'Vulnerability assessment results';
                break;

            case 'kpis':
                sectionData.metrics = await this.getKPIMetrics();
                sectionData.charts = await this.getKPICharts();
                sectionData.summary = 'Key performance indicators analyzed';
                break;

            case 'user_analytics':
                sectionData.metrics = await this.getUserAnalyticsMetrics();
                sectionData.charts = await this.getUserAnalyticsCharts();
                sectionData.summary = 'User behavior and engagement analyzed';
                break;

            case 'recommendations':
                sectionData.recommendations = await this.generateRecommendations(reportType);
                sectionData.summary = 'Actionable recommendations generated';
                break;

            default:
                sectionData.summary = `Data collected for ${section}`;
                break;
        }

        return sectionData;
    }

    async getOverviewMetrics() {
        // Simulate collecting overview metrics
        return {
            uptime: 99.9,
            activeUsers: 125,
            totalTickets: 156,
            resolvedTickets: 138,
            systemHealth: 'good',
            lastIncident: '2 days ago'
        };
    }

    async getPerformanceMetrics() {
        // Simulate collecting performance metrics
        return {
            averageResponseTime: 245,
            p95ResponseTime: 850,
            errorRate: 0.02,
            throughput: 1250,
            cpuUsage: 45.2,
            memoryUsage: 67.8,
            diskUsage: 23.4
        };
    }

    async getPerformanceCharts() {
        return [
            {
                type: 'line',
                title: 'Response Time Trend',
                data: this.generateTimeSeriesData('response_time', 24)
            },
            {
                type: 'bar',
                title: 'Error Rate by Hour',
                data: this.generateBarData('error_rate', 24)
            }
        ];
    }

    async getSecurityMetrics() {
        // Simulate collecting security metrics
        return {
            securityEvents: 25,
            blockedIPs: 12,
            authenticationFailures: 8,
            threatIndicators: 15,
            vulnerabilitiesFound: 3,
            securityScore: 85
        };
    }

    async getSecurityCharts() {
        return [
            {
                type: 'pie',
                title: 'Security Events by Type',
                data: [
                    { label: 'Failed Login', value: 8 },
                    { label: 'Blocked IP', value: 12 },
                    { label: 'Suspicious Activity', value: 5 }
                ]
            }
        ];
    }

    async getIncidentMetrics() {
        // Simulate collecting incident metrics
        return {
            totalIncidents: 15,
            meanTimeToResolve: 45.6,
            escalationRate: 0.13,
            onCallCoverage: 95.2,
            customerImpact: 'low'
        };
    }

    async getIncidentCharts() {
        return [
            {
                type: 'line',
                title: 'Incident Resolution Time Trend',
                data: this.generateTimeSeriesData('mttr', 30)
            }
        ];
    }

    async getThreatOverviewMetrics() {
        // Simulate collecting threat metrics
        return {
            totalIndicators: 156,
            highSeverityIndicators: 12,
            newThreats: 8,
            blockedThreats: 23,
            threatScore: 72.5
        };
    }

    async getThreatCharts() {
        return [
            {
                type: 'bar',
                title: 'Threat Indicators by Severity',
                data: [
                    { label: 'Critical', value: 12 },
                    { label: 'High', value: 34 },
                    { label: 'Medium', value: 67 },
                    { label: 'Low', value: 43 }
                ]
            }
        ];
    }

    async getVulnerabilityMetrics() {
        // Simulate collecting vulnerability metrics
        return {
            totalVulnerabilities: 8,
            criticalVulnerabilities: 2,
            highVulnerabilities: 3,
            patchedThisWeek: 5,
            averagePatchTime: 3.2
        };
    }

    async getVulnerabilityCharts() {
        return [
            {
                type: 'pie',
                title: 'Vulnerabilities by Severity',
                data: [
                    { label: 'Critical', value: 2 },
                    { label: 'High', value: 3 },
                    { label: 'Medium', value: 2 },
                    { label: 'Low', value: 1 }
                ]
            }
        ];
    }

    async getKPIMetrics() {
        // Simulate collecting KPI metrics
        return {
            userGrowthRate: 9.6,
            ticketResolutionRate: 88.5,
            customerSatisfaction: 4.2,
            systemAvailability: 99.9,
            meanTimeToResolution: 45.6
        };
    }

    async getKPICharts() {
        return [
            {
                type: 'gauge',
                title: 'Customer Satisfaction',
                data: { value: 4.2, max: 5 }
            }
        ];
    }

    async getUserAnalyticsMetrics() {
        // Simulate collecting user analytics metrics
        return {
            totalUsers: 125,
            activeUsers: 89,
            newUsers: 12,
            userRetentionRate: 94.2,
            averageSessionDuration: 8.5
        };
    }

    async getUserAnalyticsCharts() {
        return [
            {
                type: 'line',
                title: 'User Growth Trend',
                data: this.generateTimeSeriesData('user_count', 30)
            }
        ];
    }

    async generateRecommendations(reportType) {
        const recommendations = [];

        switch (reportType) {
            case 'system':
                recommendations.push('Consider scaling up resources during peak hours');
                recommendations.push('Implement automated failover for critical services');
                break;

            case 'security':
                recommendations.push('Update security policies based on recent threats');
                recommendations.push('Conduct security awareness training for staff');
                break;

            case 'business':
                recommendations.push('Focus on improving customer satisfaction scores');
                recommendations.push('Optimize ticket resolution processes');
                break;

            case 'performance':
                recommendations.push('Investigate response time bottlenecks');
                recommendations.push('Optimize database queries for better performance');
                break;

            default:
                recommendations.push('Review system metrics regularly');
                break;
        }

        return recommendations;
    }

    async generateReportContent(template, data, options) {
        switch (template.format) {
            case 'html':
                return this.generateHTMLReport(template, data);
            case 'pdf':
                return this.generatePDFReport(template, data);
            case 'json':
                return this.generateJSONReport(template, data);
            default:
                return this.generateHTMLReport(template, data);
        }
    }

    generateHTMLReport(template, data) {
        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>${template.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 12px; color: #666; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${template.name}</h1>
        <p>Generated: ${data.generatedAt}</p>
        <p>Period: ${data.reportPeriod}</p>
    </div>
`;

        // Add sections
        for (const [sectionName, sectionData] of Object.entries(data.sections)) {
            html += `
    <div class="section">
        <h2>${sectionData.title}</h2>
        <p>${sectionData.summary}</p>
`;

            // Add metrics
            if (sectionData.metrics && Object.keys(sectionData.metrics).length > 0) {
                html += `
        <div class="metrics">
`;
                for (const [metricName, metricValue] of Object.entries(sectionData.metrics)) {
                    html += `
            <div class="metric">
                <div class="metric-value">${metricValue}</div>
                <div class="metric-label">${this.formatMetricName(metricName)}</div>
            </div>
`;
                }
                html += `
        </div>
`;
            }

            // Add recommendations
            if (sectionData.recommendations && sectionData.recommendations.length > 0) {
                html += `
        <div class="recommendations">
            <h3>Recommendations</h3>
            <ul>
`;
                for (const recommendation of sectionData.recommendations) {
                    html += `<li>${recommendation}</li>`;
                }
                html += `
            </ul>
        </div>
`;
            }

            html += `
    </div>
`;
        }

        html += `
    <div class="footer">
        <p>This report was generated automatically by the NEXUS Monitoring System.</p>
    </div>
</body>
</html>
`;

        return html;
    }

    generatePDFReport(template, data) {
        // In production, this would use a PDF generation library
        // For now, return the HTML content
        return {
            type: 'pdf',
            content: this.generateHTMLReport(template, data),
            note: 'PDF generation requires additional library'
        };
    }

    generateJSONReport(template, data) {
        return JSON.stringify({
            report: {
                template: template,
                data: data,
                generatedAt: new Date().toISOString()
            }
        }, null, 2);
    }

    async deliverReport(report, deliveryMethods = []) {
        const results = [];

        for (const deliveryMethodId of deliveryMethods) {
            const method = this.deliveryMethods.get(deliveryMethodId);
            if (!method || !method.enabled) continue;

            try {
                const result = await this.deliverViaMethod(report, method);
                results.push(result);
            } catch (error) {
                results.push({
                    method: deliveryMethodId,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    async deliverViaMethod(report, method) {
        switch (method.type) {
            case 'email':
                return this.deliverViaEmail(report, method);
            case 'webhook':
                return this.deliverViaWebhook(report, method);
            case 'slack':
                return this.deliverViaSlack(report, method);
            case 'storage':
                return this.deliverViaStorage(report, method);
            default:
                throw new Error(`Unsupported delivery method: ${method.type}`);
        }
    }

    async deliverViaEmail(report, method) {
        // In production, this would send actual email
        console.log(`Email report sent to ${report.metadata.template.recipients.join(', ')}`);
        
        return {
            method: method.id,
            success: true,
            deliveredAt: new Date().toISOString(),
            recipients: report.metadata.template.recipients
        };
    }

    async deliverViaWebhook(report, method) {
        // In production, this would send actual webhook
        console.log(`Webhook report sent to ${method.config.url}`);
        
        return {
            method: method.id,
            success: true,
            deliveredAt: new Date().toISOString(),
            url: method.config.url
        };
    }

    async deliverViaSlack(report, method) {
        // In production, this would send actual Slack message
        console.log(`Slack report sent to ${method.config.channel}`);
        
        return {
            method: method.id,
            success: true,
            deliveredAt: new Date().toISOString(),
            channel: method.config.channel
        };
    }

    async deliverViaStorage(report, method) {
        const filename = `${report.id}.${report.format}`;
        const filepath = path.join(method.config.path, filename);
        
        // In production, this would save actual file
        console.log(`Report saved to ${filepath}`);
        
        return {
            method: method.id,
            success: true,
            deliveredAt: new Date().toISOString(),
            filepath: filepath
        };
    }

    async scheduleReport(templateId, scheduleOptions) {
        const template = this.reportTemplates.get(templateId);
        if (!template) {
            throw new Error(`Report template ${templateId} not found`);
        }

        const schedule = {
            id: this.generateScheduleId(),
            templateId: templateId,
            name: scheduleOptions.name || `Scheduled ${template.name}`,
            frequency: scheduleOptions.frequency || template.frequency,
            time: scheduleOptions.time || '09:00',
            timezone: scheduleOptions.timezone || 'UTC',
            deliveryMethods: scheduleOptions.deliveryMethods || ['email'],
            recipients: scheduleOptions.recipients || template.recipients,
            enabled: scheduleOptions.enabled !== false,
            nextRun: this.getNextRunTime(scheduleOptions.frequency, scheduleOptions.time),
            createdAt: new Date().toISOString()
        };

        this.schedules.set(schedule.id, schedule);
        return schedule;
    }

    async runScheduledReports() {
        const now = new Date();
        const reports = [];

        for (const [scheduleId, schedule] of this.schedules) {
            if (!schedule.enabled) continue;

            if (now >= new Date(schedule.nextRun)) {
                try {
                    const report = await this.generateReport(schedule.templateId, {
                        scheduled: true,
                        scheduleId: scheduleId
                    });

                    await this.deliverReport(report, schedule.deliveryMethods);

                    // Update next run time
                    schedule.nextRun = this.getNextRunTime(schedule.frequency, schedule.time);
                    schedule.lastRun = new Date().toISOString();

                    reports.push(report);
                } catch (error) {
                    console.error(`Error running scheduled report ${scheduleId}:`, error);
                }
            }
        }

        return reports;
    }

    getReport(reportId) {
        return this.reports.get(reportId);
    }

    getReports(templateId = null, limit = 50) {
        let reports = Array.from(this.reports.values());

        if (templateId) {
            reports = reports.filter(report => report.templateId === templateId);
        }

        return reports
            .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
            .slice(0, limit);
    }

    getReportTemplates() {
        return Array.from(this.reportTemplates.values());
    }

    getSchedules() {
        return Array.from(this.schedules.values());
    }

    getDeliveryMethods() {
        return Array.from(this.deliveryMethods.values());
    }

    // Helper methods
    generateReportId() {
        return 'report-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    }

    generateScheduleId() {
        return 'schedule-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
    }

    getReportPeriod(options) {
        const now = new Date();
        const period = options.period || 'last_24_hours';
        
        switch (period) {
            case 'last_24_hours':
                return {
                    start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
                    end: now.toISOString(),
                    type: '24h'
                };
            case 'last_7_days':
                return {
                    start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    end: now.toISOString(),
                    type: '7d'
                };
            case 'last_30_days':
                return {
                    start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    end: now.toISOString(),
                    type: '30d'
                };
            default:
                return {
                    start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
                    end: now.toISOString(),
                    type: '24h'
                };
        }
    }

    formatSectionTitle(section) {
        return section.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatMetricName(metric) {
        return metric.split(/(?=[A-Z])/).join(' ').toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    generateTimeSeriesData(metric, points) {
        const data = [];
        const now = Date.now();
        
        for (let i = 0; i < points; i++) {
            data.push({
                x: new Date(now - (points - i) * 60 * 60 * 1000).toISOString(),
                y: Math.random() * 100 + 50
            });
        }
        
        return data;
    }

    generateBarData(metric, points) {
        const data = [];
        
        for (let i = 0; i < points; i++) {
            data.push({
                x: `Hour ${i}`,
                y: Math.random() * 50 + 10
            });
        }
        
        return data;
    }

    getNextRunTime(frequency, time, day = null) {
        const now = new Date();
        let nextRun = new Date();

        switch (frequency) {
            case 'daily':
                nextRun.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
                if (nextRun <= now) {
                    nextRun.setDate(nextRun.getDate() + 1);
                }
                break;

            case 'weekly':
                nextRun.setDate(now.getDate() + ((7 - now.getDay() + this.getDayNumber(day)) % 7));
                nextRun.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
                if (nextRun <= now) {
                    nextRun.setDate(nextRun.getDate() + 7);
                }
                break;

            case 'monthly':
                nextRun.setDate(day || 1);
                nextRun.setHours(parseInt(time.split(':')[0]), parseInt(time.split(':')[1]), 0, 0);
                if (nextRun <= now) {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }
                break;
        }

        return nextRun.toISOString();
    }

    getDayNumber(dayName) {
        const days = { 'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6 };
        return days[dayName.toLowerCase()] || 1;
    }
}

// Create global instance
const automatedReporting = new AutomatedReporting();

// Run scheduled reports every minute
setInterval(() => {
    automatedReporting.runScheduledReports().catch(console.error);
}, 60000);

module.exports = {
    automatedReporting
};
