/**
 * NEXUS WebSocket Routes
 * API endpoints for WebSocket management and real-time features
 */

const express = require('express');
const { websocketServer } = require('../middleware/websocketServer');
const { realtimeNotifications } = require('../middleware/realtimeNotifications');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/websocket/status
 * Get WebSocket server status and metrics
 */
router.get('/status', auth, async (req, res) => {
  try {
    const metrics = websocketServer.getMetrics();
    const realtimeMetrics = realtimeNotifications.getMetrics();
    
    res.json({
      success: true,
      data: {
        websocket: metrics,
        realtime: realtimeMetrics,
        connected: metrics.activeConnections > 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error getting WebSocket status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WebSocket status'
    });
  }
});

/**
 * GET /api/websocket/connected-users
 * Get list of connected users (admin only)
 */
router.get('/connected-users', auth, async (req, res) => {
  try {
    const connectedUsers = websocketServer.getConnectedUsers();
    
    res.json({
      success: true,
      data: {
        users: connectedUsers,
        count: connectedUsers.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error getting connected users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connected users'
    });
  }
});

/**
 * GET /api/websocket/rooms/:roomName
 * Get information about a specific room
 */
router.get('/rooms/:roomName', auth, async (req, res) => {
  try {
    const { roomName } = req.params;
    const roomInfo = websocketServer.getRoomInfo(roomName);
    
    if (!roomInfo) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    res.json({
      success: true,
      data: roomInfo
    });
  } catch (error) {
    console.error('❌ Error getting room info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room information'
    });
  }
});

/**
 * POST /api/websocket/send-notification
 * Send real-time notification to specific users or groups
 */
router.post('/send-notification', auth, async (req, res) => {
  try {
    const { title, message, type, priority, target, data } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required'
      });
    }
    
    const notification = {
      _id: `manual_${Date.now()}`,
      title,
      message,
      type: type || 'manual',
      priority: priority || 'normal',
      data: data || {}
    };
    
    let options = {};
    
    // Determine target
    if (target) {
      if (target.type === 'user' && target.id) {
        notification.userId = target.id;
        options.targetUsers = [target.id];
      } else if (target.type === 'role' && target.role) {
        options.targetRole = target.role;
      } else if (target.type === 'team' && target.teamId) {
        options.targetTeam = target.teamId;
      } else if (target.type === 'broadcast') {
        options.broadcast = true;
      }
    } else {
      // Default: broadcast to all
      options.broadcast = true;
    }
    
    const delivered = await realtimeNotifications.sendRealtimeNotification(notification, options);
    
    res.json({
      success: true,
      data: {
        delivered,
        notification,
        options,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

/**
 * POST /api/websocket/send-custom-event
 * Send custom event to specific targets
 */
router.post('/send-custom-event', auth, async (req, res) => {
  try {
    const { eventName, data, target } = req.body;
    
    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'Event name is required'
      });
    }
    
    let options = {};
    
    if (target) {
      if (target.type === 'user' && target.id) {
        options.targetUsers = [target.id];
      } else if (target.type === 'role' && target.role) {
        options.targetRole = target.role;
      } else if (target.type === 'room' && target.room) {
        options.targetRoom = target.room;
      } else if (target.type === 'broadcast') {
        options.broadcast = true;
      }
    } else {
      // Default: broadcast to all
      options.broadcast = true;
    }
    
    const delivered = await realtimeNotifications.sendCustomEvent(eventName, data, options);
    
    res.json({
      success: true,
      data: {
        delivered,
        eventName,
        data,
        options,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error sending custom event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send custom event'
    });
  }
});

/**
 * POST /api/websocket/disconnect-user
 * Disconnect a specific user (admin only)
 */
router.post('/disconnect-user', auth, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const disconnected = websocketServer.disconnectUser(userId, reason || 'Admin disconnect');
    
    res.json({
      success: true,
      data: {
        disconnected,
        userId,
        reason: reason || 'Admin disconnect',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error disconnecting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect user'
    });
  }
});

/**
 * POST /api/websocket/trigger-event
 * Trigger a system event
 */
router.post('/trigger-event', auth, async (req, res) => {
  try {
    const { eventName, data } = req.body;
    
    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'Event name is required'
      });
    }
    
    realtimeNotifications.triggerEvent(eventName, data);
    
    res.json({
      success: true,
      data: {
        eventName,
        data,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error triggering event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger event'
    });
  }
});

/**
 * PUT /api/websocket/enable
 * Enable/disable real-time notifications (admin only)
 */
router.put('/enable', auth, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Enabled must be a boolean'
      });
    }
    
    realtimeNotifications.setEnabled(enabled);
    
    res.json({
      success: true,
      data: {
        enabled,
        message: `Real-time notifications ${enabled ? 'enabled' : 'disabled'}`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error toggling real-time notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle real-time notifications'
    });
  }
});

/**
 * POST /api/websocket/reset-metrics
 * Reset WebSocket and real-time metrics (admin only)
 */
router.post('/reset-metrics', auth, async (req, res) => {
  try {
    realtimeNotifications.resetMetrics();
    
    res.json({
      success: true,
      data: {
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error resetting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics'
    });
  }
});

/**
 * GET /api/websocket/health
 * Health check for WebSocket system
 */
router.get('/health', async (req, res) => {
  try {
    const health = await realtimeNotifications.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    console.error('❌ Error in health check:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

/**
 * GET /api/websocket/config
 * Get WebSocket configuration for client
 */
router.get('/config', auth, async (req, res) => {
  try {
    const config = {
      websocketUrl: process.env.WEBSOCKET_URL || `ws://${req.get('host')}`,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('❌ Error getting WebSocket config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WebSocket configuration'
    });
  }
});

/**
 * POST /api/websocket/broadcast
 * Broadcast message to all connected users
 */
router.post('/broadcast', auth, async (req, res) => {
  try {
    const { message, type, data } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    const broadcastData = {
      message,
      type: type || 'broadcast',
      data: data || {},
      timestamp: new Date().toISOString()
    };
    
    const delivered = websocketServer.broadcast('broadcast', broadcastData);
    
    res.json({
      success: true,
      data: {
        delivered,
        broadcastData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error broadcasting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast message'
    });
  }
});

/**
 * GET /api/websocket/user-status/:userId
 * Get connection status of a specific user
 */
router.get('/user-status/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is connected
    const metrics = websocketServer.getMetrics();
    const connectedUsers = websocketServer.getConnectedUsers();
    const userConnection = connectedUsers.find(user => user.userId === userId);
    
    res.json({
      success: true,
      data: {
        userId,
        connected: !!userConnection,
        connectionInfo: userConnection || null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error getting user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user status'
    });
  }
});

module.exports = router;
