/**
 * NEXUS Reporting Controller
 * 
 * Handles all reporting operations including report generation, scheduling,
 * templates, and export functionality.
 */

const ReportingService = require('../services/reportingService');
const AnalyticsService = require('../services/analyticsService');

class ReportingController {
    constructor() {
        this.reportingService = new ReportingService();
        this.analyticsService = new AnalyticsService();
    }

    /**
     * Generate a new report
     */
    async generateReport(req, res) {
        try {
            const reportConfig = req.body;
            
            // Validate report configuration
            if (!reportConfig.type || !reportConfig.name) {
                return res.status(400).json({
                    success: false,
                    error: 'Report type and name are required',
                    timestamp: new Date().toISOString()
                });
            }

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
     * Get all available report templates
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
     * Get saved reports
     */
    async getSavedReports(req, res) {
        try {
            const { userId, limit, offset } = req.query;
            
            const reports = await this.reportingService.getSavedReports({
                userId,
                limit: parseInt(limit) || 10,
                offset: parseInt(offset) || 0
            });

            res.json({
                success: true,
                data: reports,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting saved reports:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Save a report configuration
     */
    async saveReport(req, res) {
        try {
            const reportConfig = req.body;
            
            const savedReport = await this.reportingService.saveReport(reportConfig);

            res.json({
                success: true,
                data: savedReport,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving report:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Delete a saved report
     */
    async deleteReport(req, res) {
        try {
            const { reportId } = req.params;
            
            await this.reportingService.deleteReport(reportId);

            res.json({
                success: true,
                message: 'Report deleted successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error deleting report:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Schedule a report
     */
    async scheduleReport(req, res) {
        try {
            const scheduleConfig = req.body;
            
            const scheduledReport = await this.reportingService.scheduleReport(scheduleConfig);

            res.json({
                success: true,
                data: scheduledReport,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error scheduling report:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get scheduled reports
     */
    async getScheduledReports(req, res) {
        try {
            const { userId } = req.query;
            
            const scheduledReports = await this.reportingService.getScheduledReports(userId);

            res.json({
                success: true,
                data: scheduledReports,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting scheduled reports:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Cancel a scheduled report
     */
    async cancelScheduledReport(req, res) {
        try {
            const { scheduleId } = req.params;
            
            await this.reportingService.cancelScheduledReport(scheduleId);

            res.json({
                success: true,
                message: 'Scheduled report cancelled successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error cancelling scheduled report:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Export a report
     */
    async exportReport(req, res) {
        try {
            const { reportId, format } = req.params;
            
            const exportData = await this.reportingService.exportReport(reportId, format);

            // Set appropriate headers based on format
            const contentTypes = {
                'pdf': 'application/pdf',
                'csv': 'text/csv',
                'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'json': 'application/json'
            };

            const fileExtensions = {
                'pdf': 'pdf',
                'csv': 'csv',
                'excel': 'xlsx',
                'json': 'json'
            };

            res.setHeader('Content-Type', contentTypes[format] || 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=report.${fileExtensions[format] || 'json'}`);
            
            res.send(exportData);
        } catch (error) {
            console.error('Error exporting report:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Share a report
     */
    async shareReport(req, res) {
        try {
            const { reportId } = req.params;
            const { recipients, message } = req.body;
            
            const shareResult = await this.reportingService.shareReport(reportId, recipients, message);

            res.json({
                success: true,
                data: shareResult,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error sharing report:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get report sharing status
     */
    async getReportSharing(req, res) {
        try {
            const { reportId } = req.params;
            
            const sharingInfo = await this.reportingService.getReportSharing(reportId);

            res.json({
                success: true,
                data: sharingInfo,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting report sharing:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get report execution history
     */
    async getReportHistory(req, res) {
        try {
            const { reportId, limit, offset } = req.query;
            
            const history = await this.reportingService.getReportHistory({
                reportId,
                limit: parseInt(limit) || 10,
                offset: parseInt(offset) || 0
            });

            res.json({
                success: true,
                data: history,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting report history:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get report execution status
     */
    async getReportStatus(req, res) {
        try {
            const { executionId } = req.params;
            
            const status = await this.reportingService.getReportStatus(executionId);

            res.json({
                success: true,
                data: status,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error getting report status:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Create custom report template
     */
    async createReportTemplate(req, res) {
        try {
            const templateConfig = req.body;
            
            const template = await this.reportingService.createReportTemplate(templateConfig);

            res.json({
                success: true,
                data: template,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error creating report template:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Update report template
     */
    async updateReportTemplate(req, res) {
        try {
            const { templateId } = req.params;
            const templateConfig = req.body;
            
            const template = await this.reportingService.updateReportTemplate(templateId, templateConfig);

            res.json({
                success: true,
                data: template,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating report template:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Delete report template
     */
    async deleteReportTemplate(req, res) {
        try {
            const { templateId } = req.params;
            
            await this.reportingService.deleteReportTemplate(templateId);

            res.json({
                success: true,
                message: 'Report template deleted successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error deleting report template:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = ReportingController;
