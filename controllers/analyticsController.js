/**
 * NEXUS Analytics Controller
 * 
 * Handles all analytics operations including ticket analytics, user analytics,
 * system performance reports, and business intelligence.
 */

const AnalyticsService = require('../services/analyticsService');
const ReportingService = require('../services/reportingService');

class AnalyticsController {
    constructor() {
        this.analyticsService = new AnalyticsService();
        this.reportingService = new ReportingService();
    }

    /**
     * Get comprehensive ticket analytics
     */
    async getTicketAnalytics(req, res) {
        try {
            const { startDate, endDate, filters } = req.query;
            
            const analytics = await this.analyticsService.getTicketAnalytics({
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                filters: filters ? JSON.parse(filters) : {}
            });

            res.json({
                success: true,
                data: analytics,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting ticket analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get user analytics and performance metrics
     */
    async getUserAnalytics(req, res) {
        try {
            const { startDate, endDate, userId, role } = req.query;
            
            const analytics = await this.analyticsService.getUserAnalytics({
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                userId,
                role
            });

            res.json({
                success: true,
                data: analytics,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting user analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get system performance reports
     */
    async getSystemPerformance(req, res) {
        try {
            const { startDate, endDate, metrics } = req.query;
            
            const performance = await this.analyticsService.getSystemPerformance({
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                metrics: metrics ? JSON.parse(metrics) : ['api', 'database', 'system']
            });

            res.json({
                success: true,
                data: performance,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting system performance:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get GitHub integration analytics
     */
    async getGitHubAnalytics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            const analytics = await this.analyticsService.getGitHubAnalytics({
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null
            });

            res.json({
                success: true,
                data: analytics,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting GitHub analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get administrative reports
     */
    async getAdministrativeReports(req, res) {
        try {
            const { reportType, startDate, endDate } = req.query;
            
            const reports = await this.analyticsService.getAdministrativeReports({
                reportType,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null
            });

            res.json({
                success: true,
                data: reports,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting administrative reports:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get real-time dashboard data
     */
    async getDashboardData(req, res) {
        try {
            const { dashboardType, refreshInterval } = req.query;
            
            const dashboardData = await this.analyticsService.getDashboardData({
                dashboardType,
                refreshInterval: refreshInterval || 30000 // 30 seconds default
            });

            res.json({
                success: true,
                data: dashboardData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Generate custom report
     */
    async generateReport(req, res) {
        try {
            const reportConfig = req.body;
            
            const report = await this.reportingService.generateReport(reportConfig);

            res.json({
                success: true,
                data: report,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error generating report:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get available report templates
     */
    async getReportTemplates(req, res) {
        try {
            const templates = await this.reportingService.getReportTemplates();

            res.json({
                success: true,
                data: templates,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting report templates:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Export analytics data
     */
    async exportData(req, res) {
        try {
            const { format, type, filters } = req.query;
            
            const exportData = await this.analyticsService.exportData({
                format: format || 'json',
                type,
                filters: filters ? JSON.parse(filters) : {}
            });

            // Set appropriate headers based on format
            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
            } else if (format === 'excel') {
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=analytics.xlsx');
            } else if (format === 'pdf') {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=analytics.pdf');
            }

            res.send(exportData);
        } catch (error) {
            console.error('Error exporting data:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get KPI dashboard data
     */
    async getKPIDashboard(req, res) {
        try {
            const { timeRange, department } = req.query;
            
            const kpiData = await this.analyticsService.getKPIDashboard({
                timeRange: timeRange || '30d',
                department
            });

            res.json({
                success: true,
                data: kpiData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting KPI dashboard:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get analytics data for visualization
     */
    async getVisualizationData(req, res) {
        try {
            const { chartType, dataSource, filters } = req.query;
            
            const visualizationData = await this.analyticsService.getVisualizationData({
                chartType,
                dataSource,
                filters: filters ? JSON.parse(filters) : {}
            });

            res.json({
                success: true,
                data: visualizationData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting visualization data:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = AnalyticsController;
