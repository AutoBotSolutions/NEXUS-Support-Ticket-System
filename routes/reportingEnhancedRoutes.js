/**
 * Enhanced Reporting Routes
 * API endpoints for comprehensive reporting and analytics
 */

const express = require('express');
const router = express.Router();
const {
  generateReport,
  getAvailableTemplates,
  getTemplate,
  getReportHistory,
  scheduleReport,
  getScheduledReports,
  createCustomTemplate,
  deleteTemplate,
  deleteScheduledReport,
  clearCache,
  getAdvancedAnalytics
} = require('../middleware/reportingSystemEnhanced');
const auth = require('../middleware/auth');

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
router.get('/templates', async (req, res) => {
  try {
    const templates = getAvailableTemplates();

    res.status(200).json({
      success: true,
      data: {
        templates,
        count: templates.length
      }
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get specific template
 * GET /api/reports/templates/:templateId
 */
router.get('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Generate a report
 * POST /api/reports/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { templateId, timeRange, filters, format } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required'
      });
    }

    const options = {
      timeRange: timeRange || '30d',
      filters: filters || {},
      format: format || 'json',
      userId: req.user.userId
    };

    const report = await generateReport(templateId, options);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * Get report history
 * GET /api/reports/history/:templateId
 */
router.get('/history/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { limit = 50 } = req.query;

    const history = getReportHistory(templateId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('Error getting report history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Schedule a report
 * POST /api/reports/schedule
 */
router.post('/schedule', requireAdmin, async (req, res) => {
  try {
    const { templateId, schedule, recipients, options } = req.body;

    if (!templateId || !schedule || !recipients) {
      return res.status(400).json({
        success: false,
        error: 'Template ID, schedule, and recipients are required'
      });
    }

    const scheduledReport = await scheduleReport(templateId, schedule, recipients, options);

    res.status(201).json({
      success: true,
      data: scheduledReport
    });
  } catch (error) {
    console.error('Error scheduling report:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get scheduled reports
 * GET /api/reports/scheduled
 */
router.get('/scheduled', requireAdmin, async (req, res) => {
  try {
    const scheduledReports = getScheduledReports();

    res.status(200).json({
      success: true,
      data: {
        scheduledReports,
        count: scheduledReports.length
      }
    });
  } catch (error) {
    console.error('Error getting scheduled reports:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Create custom template
 * POST /api/reports/templates
 */
router.post('/templates', requireAdmin, async (req, res) => {
  try {
    const templateData = req.body;

    if (!templateData.name || !templateData.type || !templateData.category) {
      return res.status(400).json({
        success: false,
        error: 'Name, type, and category are required'
      });
    }

    const template = await createCustomTemplate(templateData);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Delete template
 * DELETE /api/reports/templates/:templateId
 */
router.delete('/templates/:templateId', requireAdmin, async (req, res) => {
  try {
    const { templateId } = req.params;

    const deleted = await deleteTemplate(templateId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Delete scheduled report
 * DELETE /api/reports/scheduled/:reportId
 */
router.delete('/scheduled/:reportId', requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;

    const deleted = await deleteScheduledReport(reportId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Scheduled report not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Scheduled report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Clear report cache
 * POST /api/reports/cache/clear
 */
router.post('/cache/clear', requireAdmin, async (req, res) => {
  try {
    clearCache();

    res.status(200).json({
      success: true,
      message: 'Report cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get advanced analytics
 * GET /api/reports/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const analytics = await getAdvancedAnalytics(timeRange);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get ticket analytics
 * GET /api/reports/analytics/tickets
 */
router.get('/analytics/tickets', async (req, res) => {
  try {
    const { timeRange = '30d', filters } = req.query;

    const report = await generateReport('ticket_summary', {
      timeRange,
      filters: filters ? JSON.parse(filters) : {},
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting ticket analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get user analytics
 * GET /api/reports/analytics/users
 */
router.get('/analytics/users', async (req, res) => {
  try {
    const { timeRange = '30d', filters } = req.query;

    const report = await generateReport('user_analytics', {
      timeRange,
      filters: filters ? JSON.parse(filters) : {},
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get system performance analytics
 * GET /api/reports/analytics/system
 */
router.get('/analytics/system', async (req, res) => {
  try {
    const { timeRange = '30d', filters } = req.query;

    const report = await generateReport('system_performance', {
      timeRange,
      filters: filters ? JSON.parse(filters) : {},
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting system analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get business intelligence analytics
 * GET /api/reports/analytics/business
 */
router.get('/analytics/business', async (req, res) => {
  try {
    const { timeRange = '30d', filters } = req.query;

    const report = await generateReport('business_kpis', {
      timeRange,
      filters: filters ? JSON.parse(filters) : {},
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting business analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get team performance analytics
 * GET /api/reports/analytics/teams
 */
router.get('/analytics/teams', async (req, res) => {
  try {
    const { timeRange = '30d', filters } = req.query;

    const report = await generateReport('team_performance', {
      timeRange,
      filters: filters ? JSON.parse(filters) : {},
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting team analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get dashboard overview
 * GET /api/reports/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;

    const analytics = await getAdvancedAnalytics(timeRange);

    res.status(200).json({
      success: true,
      data: {
        overview: analytics.overview,
        trends: analytics.trends,
        insights: analytics.insights.slice(0, 3) // Top 3 insights
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Export report in different formats
 * GET /api/reports/export/:templateId
 */
router.get('/export/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { format = 'json', timeRange = '30d', filters } = req.query;

    const report = await generateReport(templateId, {
      timeRange,
      filters: filters ? JSON.parse(filters) : {},
      format,
      userId: req.user.userId
    });

    // Set appropriate headers for different formats
    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="report_${templateId}.csv"`);
        break;
      case 'html':
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="report_${templateId}.html"`);
        break;
      case 'pdf':
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report_${templateId}.pdf"`);
        break;
      default:
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="report_${templateId}.json"`);
    }

    res.status(200).send(report);
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get real-time metrics
 * GET /api/reports/metrics/realtime
 */
router.get('/metrics/realtime', async (req, res) => {
  try {
    // Get real-time metrics (last hour)
    const metrics = await getAdvancedAnalytics('1h');

    res.status(200).json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        metrics: metrics.overview,
        alerts: metrics.insights.filter(insight => insight.severity === 'high')
      }
    });
  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get metrics comparison
 * GET /api/reports/metrics/compare
 */
router.get('/metrics/compare', async (req, res) => {
  try {
    const { period1 = '7d', period2 = '30d' } = req.query;

    const [analytics1, analytics2] = await Promise.all([
      getAdvancedAnalytics(period1),
      getAdvancedAnalytics(period2)
    ]);

    res.status(200).json({
      success: true,
      data: {
        period1: {
          timeRange: period1,
          overview: analytics1.overview
        },
        period2: {
          timeRange: period2,
          overview: analytics2.overview
        },
        comparison: this.calculateComparison(analytics1.overview, analytics2.overview)
      }
    });
  } catch (error) {
    console.error('Error comparing metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Calculate comparison between two periods
 */
function calculateComparison(overview1, overview2) {
  const comparison = {};

  // Compare tickets
  if (overview1.tickets && overview2.tickets) {
    comparison.tickets = {
      total: {
        current: overview1.tickets.total,
        previous: overview2.tickets.total,
        change: overview1.tickets.total - overview2.tickets.total,
        percentChange: overview2.tickets.total > 0 ? 
          ((overview1.tickets.total - overview2.tickets.total) / overview2.tickets.total) * 100 : 0
      }
    };
  }

  // Compare users
  if (overview1.users && overview2.users) {
    comparison.users = {
      total: {
        current: overview1.users.total,
        previous: overview2.users.total,
        change: overview1.users.total - overview2.users.total,
        percentChange: overview2.users.total > 0 ? 
          ((overview1.users.total - overview2.users.total) / overview2.users.total) * 100 : 0
      }
    };
  }

  return comparison;
}

/**
 * Get metrics predictions
 * GET /api/reports/metrics/predictions
 */
router.get('/metrics/predictions', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const analytics = await getAdvancedAnalytics(timeRange);

    res.status(200).json({
      success: true,
      data: {
        predictions: analytics.predictions,
        confidence: analytics.predictions.confidence,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get top performers
 * GET /api/reports/performers
 */
router.get('/performers', async (req, res) => {
  try {
    const { timeRange = '30d', metric = 'tickets' } = req.query;

    const analytics = await getAdvancedAnalytics(timeRange);

    const performers = analytics.insights.topPerformers || [];

    // Sort by specified metric
    const sortedPerformers = performers.sort((a, b) => {
      switch (metric) {
        case 'tickets':
          return b.tickets - a.tickets;
        case 'satisfaction':
          return b.satisfaction - a.satisfaction;
        default:
          return b.tickets - a.tickets;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        performers: sortedPerformers,
        metric,
        timeRange
      }
    });
  } catch (error) {
    console.error('Error getting performers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get system bottlenecks
 * GET /api/reports/bottlenecks
 */
router.get('/bottlenecks', async (req, res) => {
  try {
    const { timeRange = '30d', severity = 'all' } = req.query;

    const analytics = await getAdvancedAnalytics(timeRange);

    let bottlenecks = analytics.insights.bottlenecks || [];

    // Filter by severity if specified
    if (severity !== 'all') {
      bottlenecks = bottlenecks.filter(bottleneck => bottleneck.severity === severity);
    }

    // Sort by severity (high first)
    bottlenecks.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    res.status(200).json({
      success: true,
      data: {
        bottlenecks,
        count: bottlenecks.length,
        timeRange
      }
    });
  } catch (error) {
    console.error('Error getting bottlenecks:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get improvement opportunities
 * GET /api/reports/opportunities
 */
router.get('/opportunities', async (req, res) => {
  try {
    const { timeRange = '30d', impact = 'all' } = req.query;

    const analytics = await getAdvancedAnalytics(timeRange);

    let opportunities = analytics.insights.opportunities || [];

    // Filter by impact if specified
    if (impact !== 'all') {
      opportunities = opportunities.filter(opportunity => opportunity.impact === impact);
    }

    // Sort by impact (high first)
    opportunities.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });

    res.status(200).json({
      success: true,
      data: {
        opportunities,
        count: opportunities.length,
        timeRange
      }
    });
  } catch (error) {
    console.error('Error getting opportunities:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
