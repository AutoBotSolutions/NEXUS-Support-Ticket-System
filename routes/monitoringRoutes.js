const express = require('express');
const router = express.Router();
const { 
  trackFrontendError, 
  trackFrontendPageLoad, 
  trackFrontendApiCall, 
  trackFrontendUserInteraction 
} = require('../middleware/apmMonitoringSimple');

// Store monitoring data (in production, use a proper database)
const monitoringData = {
    errors: [],
    metrics: [],
    sessions: []
};

// @desc    Receive frontend error data
// @route   POST /api/monitoring/error
// @access  Public
const receiveError = async (req, res) => {
    try {
        const error = {
            ...req.body,
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        monitoringData.errors.push(error);
        
        // Track in Prometheus metrics
        trackFrontendError(error.type || 'unknown', error.url || 'unknown');
        
        // Keep only last 1000 errors
        if (monitoringData.errors.length > 1000) {
            monitoringData.errors = monitoringData.errors.slice(-1000);
        }
        
        // Log error for immediate visibility
        console.error('Frontend Error:', error);
        
        res.json({ success: true, message: 'Error logged' });
    } catch (error) {
        console.error('Error logging frontend error:', error);
        res.status(500).json({ success: false, error: 'Failed to log error' });
    }
};

// @desc    Receive frontend metrics
// @route   POST /api/monitoring/metrics
// @access  Public
const receiveMetrics = async (req, res) => {
    try {
        const metrics = {
            ...req.body,
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        // Track key metrics in Prometheus
        if (metrics.pageLoadTime) {
            trackFrontendPageLoad(metrics.url || 'unknown', metrics.pageLoadTime / 1000);
        }
        
        if (metrics.userInteractions) {
            trackFrontendUserInteraction('click');
        }
        
        // Track API call metrics
        if (metrics.apiCallStats) {
            // This would be enhanced to track individual API calls from frontend data
            trackFrontendUserInteraction('api_call');
        }
        
        monitoringData.metrics.push(metrics);
        
        // Keep only last 1000 metrics entries
        if (monitoringData.metrics.length > 1000) {
            monitoringData.metrics = monitoringData.metrics.slice(-1000);
        }
        
        res.json({ success: true, message: 'Metrics received' });
    } catch (error) {
        console.error('Error receiving metrics:', error);
        res.status(500).json({ success: false, error: 'Failed to receive metrics' });
    }
};

// @desc    Receive individual metric
// @route   POST /api/monitoring/metric
// @access  Public
const receiveMetric = async (req, res) => {
    try {
        const metric = {
            ...req.body,
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        monitoringData.metrics.push(metric);
        
        // Keep only last 1000 metrics entries
        if (monitoringData.metrics.length > 1000) {
            monitoringData.metrics = monitoringData.metrics.slice(-1000);
        }
        
        res.json({ success: true, message: 'Metric received' });
    } catch (error) {
        console.error('Error receiving metric:', error);
        res.status(500).json({ success: false, error: 'Failed to receive metric' });
    }
};

// @desc    Get frontend monitoring dashboard data
// @route   GET /api/monitoring/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
    try {
        const recentErrors = monitoringData.errors.slice(-50);
        const recentMetrics = monitoringData.metrics.slice(-100);
        
        // Calculate aggregates
        const errorCount = recentErrors.length;
        const averagePageLoadTime = recentMetrics
            .filter(m => m.pageLoadTime)
            .reduce((acc, m) => acc + m.pageLoadTime, 0) / recentMetrics.filter(m => m.pageLoadTime).length || 0;
        
        const averageSessionDuration = recentMetrics
            .filter(m => m.sessionDuration)
            .reduce((acc, m) => acc + m.sessionDuration, 0) / recentMetrics.filter(m => m.sessionDuration).length || 0;
        
        const totalUserInteractions = recentMetrics
            .reduce((acc, m) => acc + (m.userInteractions || 0), 0);
        
        const apiErrorRate = recentMetrics
            .filter(m => m.apiCallStats && m.apiCallStats.errorRate)
            .reduce((acc, m) => acc + m.apiCallStats.errorRate, 0) / recentMetrics.filter(m => m.apiCallStats).length || 0;
        
        res.json({
            success: true,
            data: {
                summary: {
                    errorCount,
                    averagePageLoadTime: Math.round(averagePageLoadTime),
                    averageSessionDuration: Math.round(averageSessionDuration),
                    totalUserInteractions,
                    apiErrorRate: Math.round(apiErrorRate * 100) / 100
                },
                recentErrors,
                recentMetrics: recentMetrics.slice(-20)
            }
        });
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ success: false, error: 'Failed to get dashboard data' });
    }
};

// @desc    Get performance metrics
// @route   GET /api/monitoring/performance
// @access  Private
const getPerformanceMetrics = async (req, res) => {
    try {
        const metrics = monitoringData.metrics
            .filter(m => m.pageLoadTime || m.firstContentfulPaint || m.largestContentfulPaint)
            .slice(-100);
        
        const performanceData = {
            pageLoadTimes: metrics.map(m => m.pageLoadTime).filter(Boolean),
            firstContentfulPaints: metrics.map(m => m.firstContentfulPaint).filter(Boolean),
            largestContentfulPaints: metrics.map(m => m.largestContentfulPaint).filter(Boolean),
            cumulativeLayoutShifts: metrics.map(m => m.cumulativeLayoutShift).filter(Boolean),
            firstInputDelays: metrics.map(m => m.firstInputDelay).filter(Boolean)
        };
        
        // Calculate percentiles
        const calculatePercentile = (arr, percentile) => {
            const sorted = arr.sort((a, b) => a - b);
            const index = Math.ceil((percentile / 100) * sorted.length) - 1;
            return sorted[Math.max(0, index)] || 0;
        };
        
        const percentiles = {
            pageLoadTime: {
                p50: calculatePercentile(performanceData.pageLoadTimes, 50),
                p75: calculatePercentile(performanceData.pageLoadTimes, 75),
                p90: calculatePercentile(performanceData.pageLoadTimes, 90),
                p95: calculatePercentile(performanceData.pageLoadTimes, 95)
            },
            firstContentfulPaint: {
                p50: calculatePercentile(performanceData.firstContentfulPaints, 50),
                p75: calculatePercentile(performanceData.firstContentfulPaints, 75),
                p90: calculatePercentile(performanceData.firstContentfulPaints, 90),
                p95: calculatePercentile(performanceData.firstContentfulPaints, 95)
            },
            largestContentfulPaint: {
                p50: calculatePercentile(performanceData.largestContentfulPaints, 50),
                p75: calculatePercentile(performanceData.largestContentfulPaints, 75),
                p90: calculatePercentile(performanceData.largestContentfulPaints, 90),
                p95: calculatePercentile(performanceData.largestContentfulPaints, 95)
            }
        };
        
        res.json({
            success: true,
            data: {
                performanceData,
                percentiles
            }
        });
    } catch (error) {
        console.error('Error getting performance metrics:', error);
        res.status(500).json({ success: false, error: 'Failed to get performance metrics' });
    }
};

// @desc    Clear monitoring data (for testing)
// @route   DELETE /api/monitoring/clear
// @access  Private
const clearMonitoringData = async (req, res) => {
    try {
        monitoringData.errors = [];
        monitoringData.metrics = [];
        monitoringData.sessions = [];
        
        res.json({ success: true, message: 'Monitoring data cleared' });
    } catch (error) {
        console.error('Error clearing monitoring data:', error);
        res.status(500).json({ success: false, error: 'Failed to clear monitoring data' });
    }
};

router.post('/error', receiveError);
router.post('/metrics', receiveMetrics);
router.post('/metric', receiveMetric);
router.get('/dashboard', getDashboardData);
router.get('/performance', getPerformanceMetrics);
router.delete('/clear', clearMonitoringData);

module.exports = router;
