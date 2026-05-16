/**
 * NEXUS Analytics Routes
 * 
 * API endpoints for analytics data, metrics, and dashboard functionality.
 */

const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');

// Initialize analytics controller
const analyticsController = new AnalyticsController();

/**
 * @route   GET /api/analytics/tickets
 * @desc    Get ticket analytics data
 * @access  Private
 */
router.get('/tickets', analyticsController.getTicketAnalytics.bind(analyticsController));

/**
 * @route   GET /api/analytics/users
 * @desc    Get user analytics data
 * @access  Private
 */
router.get('/users', analyticsController.getUserAnalytics.bind(analyticsController));

/**
 * @route   GET /api/analytics/performance
 * @desc    Get system performance reports
 * @access  Private
 */
router.get('/performance', analyticsController.getSystemPerformance.bind(analyticsController));

/**
 * @route   GET /api/analytics/github
 * @desc    Get GitHub integration analytics
 * @access  Private
 */
router.get('/github', analyticsController.getGitHubAnalytics.bind(analyticsController));

/**
 * @route   GET /api/analytics/administrative
 * @desc    Get administrative reports
 * @access  Private
 */
router.get('/administrative', analyticsController.getAdministrativeReports.bind(analyticsController));

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get real-time dashboard data
 * @access  Private
 */
router.get('/dashboard', analyticsController.getDashboardData.bind(analyticsController));

/**
 * @route   GET /api/analytics/kpi
 * @desc    Get KPI dashboard data
 * @access  Private
 */
router.get('/kpi', analyticsController.getKPIDashboard.bind(analyticsController));

/**
 * @route   GET /api/analytics/visualization
 * @desc    Get data for visualization
 * @access  Private
 */
router.get('/visualization', analyticsController.getVisualizationData.bind(analyticsController));

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data
 * @access  Private
 */
router.get('/export', analyticsController.exportData.bind(analyticsController));

/**
 * @route   GET /api/analytics/health
 * @desc    Analytics service health check
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'analytics',
        timestamp: new Date().toISOString()
    });
});

/**
 * @route   GET /api/analytics/metrics
 * @desc    Get analytics service metrics
 * @access  Private
 */
router.get('/metrics', async (req, res) => {
    try {
        const Analytics = require('../models/Analytics');
        
        const totalAnalytics = await Analytics.countDocuments();
        const activeAnalytics = await Analytics.countDocuments({ 
            expiresAt: { $gt: new Date() } 
        });
        
        res.json({
            success: true,
            data: {
                totalAnalytics,
                activeAnalytics,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting analytics metrics:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route   DELETE /api/analytics/cache
 * @desc    Clear analytics cache
 * @access  Private
 */
router.delete('/cache', async (req, res) => {
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
        console.error('Error clearing analytics cache:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route   POST /api/analytics/refresh
 * @desc    Refresh specific analytics data
 * @access  Private
 */
router.post('/refresh', async (req, res) => {
    try {
        const { key, options } = req.body;
        
        if (!key) {
            return res.status(400).json({
                success: false,
                error: 'Analytics key is required',
                timestamp: new Date().toISOString()
            });
        }

        const Analytics = require('../models/Analytics');
        const analytics = await Analytics.findByKey(key, options);
        
        if (!analytics) {
            return res.status(404).json({
                success: false,
                error: 'Analytics not found',
                timestamp: new Date().toISOString()
            });
        }

        await analytics.refresh();
        
        res.json({
            success: true,
            message: 'Analytics refreshed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error refreshing analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
