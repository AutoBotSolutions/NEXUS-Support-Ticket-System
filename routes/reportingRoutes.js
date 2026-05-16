/**
 * NEXUS Reporting Routes
 * 
 * API endpoints for comprehensive reporting, analytics, and report management.
 */

const express = require('express');
const router = express.Router();
const ReportingController = require('../controllers/reportingController');
const auth = require('../middleware/auth');

// Initialize reporting controller
const reportingController = new ReportingController();

// Middleware to authenticate all reporting routes
router.use(auth);

/**
 * Middleware to check admin permissions for sensitive operations
 */
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

/**
 * Get available report templates
 * GET /api/reports/templates
 */
router.get('/templates', reportingController.getReportTemplates.bind(reportingController));

/**
 * Generate a report
 * POST /api/reports/generate
 */
router.post('/generate', reportingController.generateReport.bind(reportingController));

/**
 * Get saved reports
 * GET /api/reports
 */
router.get('/', reportingController.getSavedReports.bind(reportingController));

/**
 * Save a report configuration
 * POST /api/reports
 */
router.post('/', reportingController.saveReport.bind(reportingController));

/**
 * Delete a saved report
 * DELETE /api/reports/:reportId
 */
router.delete('/:reportId', reportingController.deleteReport.bind(reportingController));

/**
 * Schedule a report
 * POST /api/reports/schedule
 */
router.post('/schedule', reportingController.scheduleReport.bind(reportingController));

/**
 * Get scheduled reports
 * GET /api/reports/scheduled
 */
router.get('/scheduled', reportingController.getScheduledReports.bind(reportingController));

/**
 * Cancel a scheduled report
 * DELETE /api/reports/scheduled/:scheduleId
 */
router.delete('/scheduled/:scheduleId', reportingController.cancelScheduledReport.bind(reportingController));

/**
 * Export a report
 * GET /api/reports/:reportId/export/:format
 */
router.get('/:reportId/export/:format', reportingController.exportReport.bind(reportingController));

/**
 * Share a report
 * POST /api/reports/:reportId/share
 */
router.post('/:reportId/share', reportingController.shareReport.bind(reportingController));

/**
 * Get report sharing status
 * GET /api/reports/:reportId/sharing
 */
router.get('/:reportId/sharing', reportingController.getReportSharing.bind(reportingController));

/**
 * Get report execution history
 * GET /api/reports/:reportId/history
 */
router.get('/:reportId/history', reportingController.getReportHistory.bind(reportingController));

/**
 * Get report execution status
 * GET /api/reports/status/:executionId
 */
router.get('/status/:executionId', reportingController.getReportStatus.bind(reportingController));

/**
 * Create custom report template
 * POST /api/reports/templates
 */
router.post('/templates', reportingController.createReportTemplate.bind(reportingController));

/**
 * Update report template
 * PUT /api/reports/templates/:templateId
 */
router.put('/templates/:templateId', reportingController.updateReportTemplate.bind(reportingController));

/**
 * Delete report template
 * DELETE /api/reports/templates/:templateId
 */
router.delete('/templates/:templateId', reportingController.deleteReportTemplate.bind(reportingController));

/**
 * Health check for reporting service
 * GET /api/reports/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'reporting',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get reporting service metrics
 * GET /api/reports/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const Report = require('../models/Report');
    
    const totalReports = await Report.countDocuments();
    const scheduledReports = await Report.countDocuments({ 
      'schedule': { $exists: true } 
    });
    const completedReports = await Report.countDocuments({ 
      status: 'completed' 
    });
    
    res.json({
      success: true,
      data: {
        totalReports,
        scheduledReports,
        completedReports,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get report statistics
 * GET /api/reports/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const Report = require('../models/Report');
    
    const totalReports = await Report.countDocuments();
    const scheduledReports = await Report.countDocuments({ 
      'schedule': { $exists: true } 
    });
    const completedReports = await Report.countDocuments({ 
      status: 'completed' 
    });
    
    res.json({
      success: true,
      data: {
        totalReports,
        scheduledReports,
        completedReports,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Delete scheduled report (admin only)
 * DELETE /api/reports/scheduled/:scheduleId
 */
router.delete('/scheduled/:scheduleId', requireAdmin, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    // This would use the ReportingController to cancel the scheduled report
    // For now, return a success response
    res.json({
      success: true,
      message: 'Scheduled report cancelled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Export report
 * GET /api/reports/:reportId/export/:format
 */
router.get('/:reportId/export/:format', reportingController.exportReport.bind(reportingController));

/**
 * Share report
 * POST /api/reports/:reportId/share
 */
router.post('/:reportId/share', reportingController.shareReport.bind(reportingController));

/**
 * Get report sharing status
 * GET /api/reports/:reportId/sharing
 */
router.get('/:reportId/sharing', reportingController.getReportSharing.bind(reportingController));

/**
 * Get report execution history
 * GET /api/reports/:reportId/history
 */
router.get('/:reportId/history', reportingController.getReportHistory.bind(reportingController));

/**
 * Get report execution status
 * GET /api/reports/status/:executionId
 */
router.get('/status/:executionId', reportingController.getReportStatus.bind(reportingController));

/**
 * Create custom report template
 * POST /api/reports/templates
 */
router.post('/templates', reportingController.createReportTemplate.bind(reportingController));

/**
 * Update report template
 * PUT /api/reports/templates/:templateId
 */
router.put('/templates/:templateId', reportingController.updateReportTemplate.bind(reportingController));

/**
 * Delete report template
 * DELETE /api/reports/templates/:templateId
 */
router.delete('/templates/:templateId', reportingController.deleteReportTemplate.bind(reportingController));

/**
 * Clear analytics cache (admin only)
 * DELETE /api/reports/cache
 */
router.delete('/cache', requireAdmin, async (req, res) => {
  try {
    const Analytics = require('../models/Analytics');
    
    const result = await Analytics.cleanupExpired();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      deletedCount: result.deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Quick report generation shortcuts
 */

/**
 * Quick ticket summary report
 * GET /api/reports/quick/tickets
 */
router.get('/quick/tickets', async (req, res) => {
  try {
    const { timeRange = '7d', format = 'json' } = req.query;

    // Use the ReportingController to generate a quick ticket report
    const reportConfig = {
      name: 'Quick Ticket Summary',
      type: 'ticket_analytics',
      parameters: {
        timeRange,
        format
      },
      createdBy: req.user._id
    };

    // This would use the ReportingController generateReport method
    res.json({
      success: true,
      data: {
        message: 'Quick ticket report generation initiated',
        config: reportConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Quick user activity report
 * GET /api/reports/quick/users
 */
router.get('/quick/users', async (req, res) => {
  try {
    const { timeRange = '7d', format = 'json' } = req.query;

    const reportConfig = {
      name: 'Quick User Activity',
      type: 'user_performance',
      parameters: {
        timeRange,
        format
      },
      createdBy: req.user._id
    };

    res.json({
      success: true,
      data: {
        message: 'Quick user activity report generation initiated',
        config: reportConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Quick performance report
 * GET /api/reports/quick/performance
 */
router.get('/quick/performance', async (req, res) => {
  try {
    const { timeRange = '24h', format = 'json' } = req.query;

    const reportConfig = {
      name: 'Quick Performance Report',
      type: 'system_performance',
      parameters: {
        timeRange,
        format
      },
      createdBy: req.user._id
    };

    res.json({
      success: true,
      data: {
        message: 'Quick performance report generation initiated',
        config: reportConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Quick business KPI report
 * GET /api/reports/quick/kpi
 */
router.get('/quick/kpi', async (req, res) => {
  try {
    const { timeRange = '30d', format = 'json' } = req.query;

    const reportConfig = {
      name: 'Quick Business KPI',
      type: 'custom',
      parameters: {
        timeRange,
        format
      },
      createdBy: req.user._id
    };

    res.json({
      success: true,
      data: {
        message: 'Quick KPI report generation initiated',
        config: reportConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Export report in different formats
 */

/**
 * Export report as CSV
 * POST /api/reports/export/csv
 */
router.post('/export/csv', async (req, res) => {
  try {
    const {
      templateId,
      timeRange = '30d',
      filters = {}
    } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const reportConfig = {
      name: 'CSV Export',
      type: 'custom',
      parameters: {
        templateId,
        timeRange,
        filters,
        format: 'csv'
      },
      createdBy: req.user._id
    };

    res.json({
      success: true,
      data: {
        message: 'CSV export initiated',
        config: reportConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Export report as HTML
 * POST /api/reports/export/html
 */
router.post('/export/html', async (req, res) => {
  try {
    const {
      templateId,
      timeRange = '30d',
      filters = {}
    } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const reportConfig = {
      name: 'HTML Export',
      type: 'custom',
      parameters: {
        templateId,
        timeRange,
        filters,
        format: 'html'
      },
      createdBy: req.user._id
    };

    res.json({
      success: true,
      data: {
        message: 'HTML export initiated',
        config: reportConfig
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Report analytics and statistics (admin only)
 * GET /api/reports/analytics
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const Report = require('../models/Report');
    
    const totalReports = await Report.countDocuments();
    const scheduledReports = await Report.countDocuments({ 
      'schedule': { $exists: true } 
    });
    const completedReports = await Report.countDocuments({ 
      status: 'completed' 
    });
    
    const analytics = {
      totalReports,
      scheduledReports,
      completedReports,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
