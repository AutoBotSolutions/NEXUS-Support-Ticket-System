/**
 * NEXUS User Management Controller
 * Enhanced user management with profile, teams, and analytics
 */

const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const UserSession = require('../models/UserSession');
const Team = require('../models/Team');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendNotification } = require('../middleware/notificationSystem');

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};

// User Profile Management
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('teams.teamId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
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
};

const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, phone, location, timezone, avatar } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update profile fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (timezone !== undefined) user.timezone = timezone;
    if (avatar !== undefined) user.avatar = avatar;
    
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
};

// User Preferences Management
const getUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateUserPreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update preferences
    user.preferences = { ...user.preferences, ...preferences };
    user.updatedBy = req.user.userId;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// User Search and Filtering
const searchUsers = async (req, res) => {
  try {
    const { query, role, isActive, page = 1, limit = 20 } = req.query;
    
    // Build search query
    const searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (role) {
      searchQuery.role = role;
    }
    
    if (isActive !== undefined) {
      searchQuery.isActive = isActive === 'true';
    }
    
    const skip = (page - 1) * limit;
    
    const users = await User.find(searchQuery)
      .select('-password -twoFactorSecret')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(searchQuery);
    
    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => user.toSafeObject()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// User Analytics
const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;
    
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Calculate analytics
    const analytics = {
      profile: {
        joinDate: user.createdAt,
        lastLogin: user.lastLogin,
        totalLogins: user.loginCount,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      },
      activity: {
        lastActivity: user.activity.lastActivity,
        totalTicketsCreated: user.activity.totalTicketsCreated,
        totalTicketsResolved: user.activity.totalTicketsResolved,
        teamsCount: user.teams.length
      },
      teams: user.teams.map(team => ({
        teamId: team.teamId,
        role: team.role,
        joinedAt: team.joinedAt
      }))
    };
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getSystemAnalytics = async (req, res) => {
  try {
    // Only admins can access system analytics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const emailVerifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const phoneVerifiedUsers = await User.countDocuments({ isPhoneVerified: true });
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const recentUsers = await User.find()
      .select('username email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const analytics = {
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        emailVerifiedUsers,
        phoneVerifiedUsers
      },
      byRole: usersByRole,
      recentUsers: recentUsers.map(user => user.toSafeObject())
    };
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// User Activity History
const getUserActivityHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;
    const { 
      limit = 50, 
      offset = 0, 
      type, 
      startDate, 
      endDate, 
      success, 
      severity 
    } = req.query;
    
    // Check if user has permission to view this user's activity
    if (targetUserId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      success: success !== undefined ? success === 'true' : undefined,
      severity
    };
    
    const activities = await UserActivity.getUserActivity(targetUserId, options);
    
    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: activities.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getUserActivitySummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;
    const { timeRange = '7d' } = req.query;
    
    // Check if user has permission to view this user's activity
    if (targetUserId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const summary = await UserActivity.getActivitySummary(targetUserId, timeRange);
    
    res.status(200).json({
      success: true,
      data: {
        summary,
        user: {
          username: user.username,
          fullName: user.fullName,
          lastActivity: user.activity.lastActivity
        },
        timeRange
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// User Session Management
const getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;
    
    // Check if user has permission to view this user's sessions
    if (targetUserId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const sessions = await UserSession.getActiveSessions(targetUserId);
    
    res.status(200).json({
      success: true,
      data: {
        sessions,
        activeCount: sessions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const terminateUserSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get the session to verify ownership
    const session = await UserSession.getSessionById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Check if user has permission to terminate this session
    if (session.userId._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    await UserSession.terminateSession(sessionId, 'user_request');
    
    // Log activity
    await UserActivity.logActivity({
      userId: session.userId._id,
      type: 'session_expired',
      description: 'Session terminated by user or admin',
      context: {
        sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'api'
      },
      relatedObjects: [{
        objectType: 'user',
        objectId: session.userId._id,
        objectName: session.userId.username,
        action: 'terminated'
      }]
    });
    
    res.status(200).json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const terminateAllUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;
    
    // Check if user has permission to terminate all sessions
    if (targetUserId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    await UserSession.terminateAllUserSessions(targetUserId, 'admin_request');
    
    // Log activity
    await UserActivity.logActivity({
      userId: targetUserId,
      type: 'session_expired',
      description: 'All sessions terminated by user or admin',
      context: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'api'
      },
      relatedObjects: [{
        objectType: 'user',
        objectId: targetUserId,
        objectName: user.username,
        action: 'terminated_all_sessions'
      }]
    });
    
    res.status(200).json({
      success: true,
      message: 'All sessions terminated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getUserSessionStatistics = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;
    const { timeRange = '7d' } = req.query;
    
    // Check if user has permission to view this user's session statistics
    if (targetUserId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const statistics = await UserSession.getSessionStatistics(targetUserId, timeRange);
    
    res.status(200).json({
      success: true,
      data: {
        statistics: statistics[0] || {},
        user: {
          username: user.username,
          fullName: user.fullName
        },
        timeRange
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Avatar Upload Management
const uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;
    
    // Check if user has permission to update this user's avatar
    if (targetUserId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // In a real implementation, you would upload to a cloud storage service
    // For now, we'll just store the file path
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    user.avatar = avatarUrl;
    user.updatedBy = req.user.userId;
    await user.save();
    
    // Log activity
    await UserActivity.logActivity({
      userId: targetUserId,
      type: 'profile_update',
      description: 'Avatar updated',
      context: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'api'
      },
      relatedObjects: [{
        objectType: 'user',
        objectId: targetUserId,
        objectName: user.username,
        action: 'updated'
      }]
    });
    
    res.status(200).json({
      success: true,
      data: {
        avatarUrl,
        message: 'Avatar uploaded successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Legacy User Activity Tracking (for backward compatibility)
const getUserActivityLog = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;
    
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get recent activities
    const activities = await UserActivity.getUserActivity(targetUserId, { limit: 20 });
    
    res.status(200).json({
      success: true,
      data: {
        activities,
        summary: {
          lastActivity: user.activity.lastActivity,
          totalLogins: user.loginCount,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// User Creation (Admin only)
const createUser = async (req, res) => {
  try {
    // Only admins can create users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { username, email, password, role = 'user', firstName, lastName } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or username already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
      firstName,
      lastName,
      createdBy: req.user.userId
    });
    
    await user.save();
    
    // Send welcome notification
    try {
      await sendNotification({
        userId: user._id,
        type: 'welcome',
        channels: ['email', 'inapp'],
        data: {
          name: user.displayName,
          email: user.email
        }
      });
    } catch (notificationError) {
      console.log('Failed to send welcome notification:', notificationError);
    }
    
    res.status(201).json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// User Update (Admin only)
const updateUser = async (req, res) => {
  try {
    // Only admins can update users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userId } = req.params;
    const updates = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Don't allow password updates through this endpoint
    delete updates.password;
    
    // Update user
    Object.assign(user, updates);
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
};

// User Deletion (Admin only)
const deleteUser = async (req, res) => {
  try {
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Don't allow deletion of the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last admin user'
        });
      }
    }
    
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Role Assignment (Admin only)
const assignRole = async (req, res) => {
  try {
    // Only admins can assign roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userId } = req.params;
    const { role, permissions } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Validate role
    if (!['admin', 'support_agent', 'user', 'guest'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }
    
    // Don't allow removal of the last admin role
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot remove admin role from the last admin user'
        });
      }
    }
    
    // Update role and permissions
    user.role = role;
    if (permissions) {
      user.permissions = permissions;
    }
    
    user.updatedBy = req.user.userId;
    await user.save();
    
    // Send notification to user about role change
    try {
      await sendNotification({
        userId: user._id,
        type: 'role_change',
        channels: ['email', 'inapp'],
        data: {
          newRole: role,
          changedBy: req.user.username
        }
      });
    } catch (notificationError) {
      console.log('Failed to send role change notification:', notificationError);
    }
    
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
};

module.exports = {
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
};
