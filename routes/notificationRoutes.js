/**
 * Notification Routes
 * API endpoints for managing notifications
 */

const express = require('express');
const router = express.Router();
const {
  sendNotification,
  getUserPreferences,
  setUserPreferences,
  getNotificationHistory,
  getInAppNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationStats,
  createNotificationTemplate,
  getNotificationTemplate,
  listNotificationTemplates,
  deleteNotificationTemplate
} = require('../middleware/notificationSystem');
const auth = require('../middleware/auth');

// Middleware to authenticate all notification routes
router.use(auth);

/**
 * Get user notification preferences
 * GET /api/notifications/preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const preferences = await getUserPreferences(req.user._id);
    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update user notification preferences
 * PUT /api/notifications/preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const { preferences } = req.body;
    
    // Validate preferences
    const validChannels = ['email', 'inapp', 'push', 'sms', 'webhook'];
    const invalidChannels = Object.keys(preferences).filter(key => !validChannels.includes(key));
    
    if (invalidChannels.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid channels: ${invalidChannels.join(', ')}`
      });
    }

    const result = await setUserPreferences(req.user._id, preferences);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get in-app notifications
 * GET /api/notifications/inapp
 */
router.get('/inapp', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await getInAppNotifications(req.user._id, limit);
    
    res.json({
      success: true,
      data: {
        notifications,
        count: notifications.length
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
 * Get notification history
 * GET /api/notifications/history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await getNotificationHistory(req.user._id, limit);
    
    res.json({
      success: true,
      data: {
        history,
        count: history.length
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
 * Mark notification as read
 * POST /api/notifications/:notificationId/read
 */
router.post('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await markNotificationRead(req.user._id, notificationId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Mark all notifications as read
 * POST /api/notifications/read-all
 */
router.post('/read-all', async (req, res) => {
  try {
    const result = await markAllNotificationsRead(req.user._id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getNotificationStats(req.user._id);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Send notification (admin only)
 * POST /api/notifications/send
 */
router.post('/send', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { userId, type, data, channels, priority } = req.body;
    
    // Validate required fields
    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        error: 'userId and type are required'
      });
    }

    const result = await sendNotification({
      userId,
      type,
      data: {
        ...data,
        email: data.email || req.user.email // Use admin's email if not provided
      },
      channels,
      priority
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Broadcast notification to multiple users (admin only)
 * POST /api/notifications/broadcast
 */
router.post('/broadcast', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { userIds, type, data, channels, priority } = req.body;
    
    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || !type) {
      return res.status(400).json({
        success: false,
        error: 'userIds (array) and type are required'
      });
    }

    const results = [];
    
    for (const userId of userIds) {
      const result = await sendNotification({
        userId,
        type,
        data,
        channels,
        priority
      });
      
      results.push({
        userId,
        result
      });
    }

    res.json({
      success: true,
      data: {
        results,
        sent: results.filter(r => r.result.success).length,
        failed: results.filter(r => !r.result.success).length
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
 * Get notification templates (admin only)
 * GET /api/notifications/templates
 */
router.get('/templates', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const templates = listNotificationTemplates();
    const templateDetails = {};
    
    for (const templateName of templates) {
      const template = getNotificationTemplate(templateName);
      templateDetails[templateName] = template;
    }

    res.json({
      success: true,
      data: templateDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get specific notification template (admin only)
 * GET /api/notifications/templates/:templateName
 */
router.get('/templates/:templateName', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { templateName } = req.params;
    const template = getNotificationTemplate(templateName);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create notification template (admin only)
 * POST /api/notifications/templates
 */
router.post('/templates', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { name, template } = req.body;
    
    // Validate required fields
    if (!name || !template) {
      return res.status(400).json({
        success: false,
        error: 'name and template are required'
      });
    }

    // Validate template structure
    const requiredFields = ['subject', 'channels', 'templates'];
    const missingFields = requiredFields.filter(field => !template[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const result = await createNotificationTemplate(name, template);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete notification template (admin only)
 * DELETE /api/notifications/templates/:templateName
 */
router.delete('/templates/:templateName', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { templateName } = req.params;
    const result = await deleteNotificationTemplate(templateName);
    
    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test notification (admin only)
 * POST /api/notifications/test
 */
router.post('/test', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { type, channels, data } = req.body;
    
    // Send test notification to admin
    const result = await sendNotification({
      userId: req.user._id,
      type: type || 'test',
      data: {
        ...data,
        name: req.user.username,
        email: req.user.email
      },
      channels: channels || ['inapp'],
      priority: 'low'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
