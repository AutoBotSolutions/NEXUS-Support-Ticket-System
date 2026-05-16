/**
 * NEXUS Notification Database Pool API Routes
 * RESTful API endpoints for database pool management and optimized analytics
 */

const express = require('express');
const router = express.Router();
const { 
  getPoolMetrics, 
  restartPool, 
  optimizePools 
} = require('../middleware/notificationDatabasePool');
const {
  getNotificationAnalytics,
  getChannelAnalytics,
  getPerformanceMetrics
} = require('../middleware/notificationSystem');

// Middleware for authentication and authorization
const auth = require('../middleware/auth');

/**
 * GET /api/notifications/database/pools/metrics
 * Get database pool metrics
 */
router.get('/pools/metrics', auth, async (req, res) => {
  try {
    const metrics = getPoolMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting database pool metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database pool metrics',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/database/pools/:poolName/restart
 * Restart a specific database pool
 */
router.post('/pools/:poolName/restart', auth, async (req, res) => {
  try {
    const { poolName } = req.params;
    
    await restartPool(poolName);
    
    res.json({
      success: true,
      message: `Database pool '${poolName}' restarted successfully`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error restarting database pool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart database pool',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/database/pools/optimize
 * Optimize all database pool configurations
 */
router.post('/pools/optimize', auth, async (req, res) => {
  try {
    optimizePools();
    
    res.json({
      success: true,
      message: 'Database pool optimization completed',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error optimizing database pools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize database pools',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/analytics
 * Get comprehensive notification analytics using optimized database connections
 */
router.get('/analytics', auth,  async (req, res) => {
  try {
    const { dateRange = '7d' } = req.query;
    
    const analytics = await getNotificationAnalytics(dateRange);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting notification analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/analytics/channels/:channel
 * Get channel-specific analytics using optimized database connections
 */
router.get('/analytics/channels/:channel', auth,  async (req, res) => {
  try {
    const { channel } = req.params;
    
    const analytics = await getChannelAnalytics(channel);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting channel analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get channel analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/analytics/performance
 * Get notification performance metrics using optimized database connections
 */
router.get('/analytics/performance', auth,  async (req, res) => {
  try {
    const metrics = await getPerformanceMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/database/health
 * Check database pool health
 */
router.get('/database/health', auth, async (req, res) => {
  try {
    const metrics = getPoolMetrics();
    
    // Determine health status
    let healthStatus = 'healthy';
    let issues = [];
    
    // Check connection counts
    if (metrics.activeConnections > metrics.maxConnections * 0.8) {
      healthStatus = 'warning';
      issues.push('High connection usage');
    }
    
    // Check error rates
    for (const [poolName, poolMetrics] of Object.entries(metrics.pools)) {
      if (poolMetrics.errorCount > poolMetrics.queryCount * 0.1) {
        healthStatus = 'unhealthy';
        issues.push(`High error rate in ${poolName} pool`);
      }
    }
    
    // Check connection states
    let disconnectedPools = 0;
    for (const [poolName, poolMetrics] of Object.entries(metrics.pools)) {
      if (poolMetrics.state !== 1) {
        disconnectedPools++;
      }
    }
    
    if (disconnectedPools > 0) {
      healthStatus = 'unhealthy';
      issues.push(`${disconnectedPools} pools disconnected`);
    }
    
    const health = {
      status: healthStatus,
      issues,
      metrics,
      timestamp: new Date(),
      uptime: process.uptime()
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking database health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check database health',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/database/stats
 * Get database statistics
 */
router.get('/database/stats', auth,  async (req, res) => {
  try {
    const metrics = getPoolMetrics();
    
    const stats = {
      totalConnections: metrics.totalConnections,
      activeConnections: metrics.activeConnections,
      idleConnections: metrics.idleConnections,
      maxConnections: metrics.maxConnections,
      minConnections: metrics.minConnections,
      connectionTimeout: metrics.connectionTimeout,
      idleTimeout: metrics.idleTimeout,
      retryAttempts: metrics.retryAttempts,
      retryDelay: metrics.retryDelay,
      pools: Object.keys(metrics.pools).length,
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting database stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database stats',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/database/pools
 * List all database pools
 */
router.get('/database/pools', auth, async (req, res) => {
  try {
    const metrics = getPoolMetrics();
    
    const pools = Object.entries(metrics.pools).map(([name, poolMetrics]) => ({
      name,
      state: poolMetrics.state,
      stateName: getStateName(poolMetrics.state),
      queryCount: poolMetrics.queryCount,
      errorCount: poolMetrics.errorCount,
      errorRate: poolMetrics.queryCount > 0 ? (poolMetrics.errorCount / poolMetrics.queryCount * 100).toFixed(2) : 0,
      lastUsed: poolMetrics.lastUsed,
      created: poolMetrics.created,
      uptime: poolMetrics.uptime
    }));
    
    res.json({
      success: true,
      data: pools,
      count: pools.length
    });
  } catch (error) {
    console.error('Error listing database pools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list database pools',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/database/pools/:poolName
 * Get specific database pool information
 */
router.get('/database/pools/:poolName', auth, async (req, res) => {
  try {
    const { poolName } = req.params;
    const metrics = getPoolMetrics();
    
    const pool = metrics.pools[poolName];
    
    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Database pool not found',
        message: `Pool '${poolName}' does not exist`
      });
    }
    
    const poolInfo = {
      name: poolName,
      state: pool.state,
      stateName: getStateName(pool.state),
      queryCount: pool.queryCount,
      errorCount: pool.errorCount,
      errorRate: pool.queryCount > 0 ? (pool.errorCount / pool.queryCount * 100).toFixed(2) : 0,
      lastUsed: pool.lastUsed,
      created: pool.created,
      uptime: pool.uptime,
      timeSinceLastUse: Date.now() - pool.lastUsed.getTime()
    };
    
    res.json({
      success: true,
      data: poolInfo
    });
  } catch (error) {
    console.error('Error getting database pool info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database pool info',
      message: error.message
    });
  }
});

/**
 * Helper function to get state name
 */
function getStateName(state) {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
}

module.exports = router;
