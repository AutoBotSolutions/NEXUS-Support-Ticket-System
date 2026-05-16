/**
 * Enhanced User Management Routes
 * Complete user management with profile, teams, and analytics
 */

const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  searchUsers,
  getUserAnalytics,
  getSystemAnalytics,
  getUserActivityHistory,
  getUserActivitySummary,
  getUserSessions,
  terminateUserSession,
  terminateAllUserSessions,
  getUserSessionStatistics,
  uploadAvatar,
  getUserActivityLog,
  createUser,
  updateUser,
  deleteUser,
  assignRole
} = require('../controllers/userManagementController');
const auth = require('../middleware/auth');

// Middleware to authenticate all user management routes
router.use(auth);

/**
 * Middleware to check admin permissions
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
 * Middleware to check specific permissions
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (req.user.hasPermission && req.user.hasPermission(permission)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      error: `Permission required: ${permission}`
    });
  };
};

// === PROFILE MANAGEMENT ===

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', getUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', updateUserProfile);

/**
 * @route   GET /api/users/preferences
 * @desc    Get current user preferences
 * @access  Private
 */
router.get('/preferences', getUserPreferences);

/**
 * @route   PUT /api/users/preferences
 * @desc    Update current user preferences
 * @access  Private
 */
router.put('/preferences', updateUserPreferences);

// === USER SEARCH AND FILTERING ===

/**
 * @route   GET /api/users/search
 * @desc    Search and filter users
 * @access  Private
 */
router.get('/search', requirePermission('users.read'), searchUsers);

/**
 * @route   GET /api/users
 * @desc    Get all users (with pagination)
 * @access  Admin
 */
router.get('/', requireAdmin, searchUsers);

// === USER ANALYTICS ===

/**
 * @route   GET /api/users/analytics
 * @desc    Get current user analytics
 * @access  Private
 */
router.get('/analytics', getUserAnalytics);

/**
 * @route   GET /api/users/analytics/system
 * @desc    Get system-wide user analytics
 * @access  Admin
 */
router.get('/analytics/system', requireAdmin, getSystemAnalytics);

/**
 * @route   GET /api/users/analytics/:userId
 * @desc    Get specific user analytics
 * @access  Admin or self
 */
router.get('/analytics/:userId', async (req, res, next) => {
  // Allow access if user is admin or requesting their own analytics
  if (req.user.role === 'admin' || req.params.userId === req.user.userId.toString()) {
    return getUserAnalytics(req, res, next);
  }
  
  return res.status(403).json({
    success: false,
    error: 'Access denied'
  });
});

// === USER ACTIVITY TRACKING ===

/**
 * @route   GET /api/users/activity
 * @desc    Get current user activity log
 * @access  Private
 */
router.get('/activity', getUserActivityLog);

/**
 * @route   GET /api/users/activity/:userId
 * @desc    Get specific user activity log
 * @access  Admin or self
 */
router.get('/activity/:userId', async (req, res, next) => {
  // Allow access if user is admin or requesting their own activity
  if (req.user.role === 'admin' || req.params.userId === req.user.userId.toString()) {
    return getUserActivityLog(req, res, next);
  }
  
  return res.status(403).json({
    success: false,
    error: 'Access denied'
  });
});

// === USER MANAGEMENT (ADMIN ONLY) ===

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Admin
 */
router.post('/', requireAdmin, createUser);

/**
 * @route   PUT /api/users/:userId
 * @desc    Update a user
 * @access  Admin
 */
router.put('/:userId', requireAdmin, updateUser);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete a user
 * @access  Admin
 */
router.delete('/:userId', requireAdmin, deleteUser);

/**
 * @route   PUT /api/users/:userId/role
 * @desc    Assign role to a user
 * @access  Admin
 */
router.put('/:userId/role', requireAdmin, assignRole);

// === USER STATUS MANAGEMENT ===

/**
 * @route   PUT /api/users/:userId/activate
 * @desc    Activate a user
 * @access  Admin
 */
router.put('/:userId/activate', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    user.isActive = true;
    user.updatedBy = req.user.userId;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/:userId/deactivate
 * @desc    Deactivate a user
 * @access  Admin
 */
router.put('/:userId/deactivate', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Don't allow deactivation of the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot deactivate the last admin user'
        });
      }
    }
    
    user.isActive = false;
    user.updatedBy = req.user.userId;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === USER VERIFICATION MANAGEMENT ===

/**
 * @route   PUT /api/users/:userId/verify-email
 * @desc    Verify user email
 * @access  Admin
 */
router.put('/:userId/verify-email', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    user.isEmailVerified = true;
    user.updatedBy = req.user.userId;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/:userId/verify-phone
 * @desc    Verify user phone
 * @access  Admin
 */
router.put('/:userId/verify-phone', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    user.isPhoneVerified = true;
    user.updatedBy = req.user.userId;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === USER STATISTICS ===

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Admin
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const emailVerifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const phoneVerifiedUsers = await User.countDocuments({ isPhoneVerified: true });
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const usersByStatus = await User.aggregate([
      { $group: { _id: '$isActive', count: { $sum: 1 } } }
    ]);
    
    const recentUsers = await User.find()
      .select('username email role createdAt isActive')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        emailVerified: emailVerifiedUsers,
        phoneVerified: phoneVerifiedUsers,
        byRole: usersByRole,
        byStatus: usersByStatus,
        recent: recentUsers.map(user => user.toSafeObject())
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === USER BULK OPERATIONS ===

/**
 * @route   POST /api/users/bulk-activate
 * @desc    Bulk activate users
 * @access  Admin
 */
router.post('/bulk-activate', requireAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      });
    }
    
    const User = require('../models/User');
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { 
        isActive: true,
        updatedBy: req.user.userId,
        updatedAt: new Date()
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} users activated`
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
 * @route   POST /api/users/bulk-deactivate
 * @desc    Bulk deactivate users
 * @access  Admin
 */
router.post('/bulk-deactivate', requireAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      });
    }
    
    const User = require('../models/User');
    
    // Check if any users being deactivated are admins
    const adminsToDeactivate = await User.find({
      _id: { $in: userIds },
      role: 'admin',
      isActive: true
    });
    
    if (adminsToDeactivate.length > 0) {
      const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });
      if (totalAdmins <= adminsToDeactivate.length) {
        return res.status(400).json({
          success: false,
          error: 'Cannot deactivate all admin users'
        });
      }
    }
    
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { 
        isActive: false,
        updatedBy: req.user.userId,
        updatedAt: new Date()
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} users deactivated`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === USER EXPORT ===

/**
 * @route   GET /api/users/export
 * @desc    Export users data
 * @access  Admin
 */
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const { format = 'json' } = req.query;
    
    const users = await User.find()
      .select('-password -twoFactorSecret -passwordResetToken -emailVerificationToken')
      .sort({ createdAt: -1 });
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = [
        'Username,Email,Role,Status,Created At,Last Login'
      ];
      
      users.forEach(user => {
        csv.push(`${user.username},${user.email},${user.role},${user.isActive ? 'Active' : 'Inactive'},${user.createdAt},${user.lastLogin || 'Never'}`);
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(csv.join('\n'));
    } else {
      // Return JSON format
      res.status(200).json({
        success: true,
        data: users.map(user => user.toSafeObject())
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === USER ACTIVITY HISTORY ===

/**
 * @route   GET /api/users/:userId/activity
 * @desc    Get user activity history
 * @access  Admin or User (for own profile)
 */
router.get('/:userId/activity', getUserActivityHistory);

/**
 * @route   GET /api/users/:userId/activity/summary
 * @desc    Get user activity summary
 * @access  Admin or User (for own profile)
 */
router.get('/:userId/activity/summary', getUserActivitySummary);

// === USER SESSION MANAGEMENT ===

/**
 * @route   GET /api/users/:userId/sessions
 * @desc    Get user active sessions
 * @access  Admin or User (for own profile)
 */
router.get('/:userId/sessions', getUserSessions);

/**
 * @route   DELETE /api/users/sessions/:sessionId
 * @desc    Terminate a specific user session
 * @access  Admin or User (for own session)
 */
router.delete('/sessions/:sessionId', terminateUserSession);

/**
 * @route   DELETE /api/users/:userId/sessions
 * @desc    Terminate all user sessions
 * @access  Admin or User (for own profile)
 */
router.delete('/:userId/sessions', terminateAllUserSessions);

/**
 * @route   GET /api/users/:userId/sessions/statistics
 * @desc    Get user session statistics
 * @access  Admin or User (for own profile)
 */
router.get('/:userId/sessions/statistics', getUserSessionStatistics);

// === USER AVATAR MANAGEMENT ===

/**
 * @route   POST /api/users/:userId/avatar
 * @desc    Upload user avatar
 * @access  Admin or User (for own profile)
 */
router.post('/:userId/avatar', uploadAvatar);

module.exports = router;
