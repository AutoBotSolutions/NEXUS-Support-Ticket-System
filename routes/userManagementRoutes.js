/**
 * User Management Routes
 * Advanced user management with teams, permissions, and analytics
 */

const express = require('express');
const router = express.Router();
const {
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  getUserTeams,
  getTeamMembers,
  getUserPermissions,
  hasPermission,
  getUserAnalytics,
  getSystemAnalytics,
  getAllTeams,
  getTeam,
  getAllPermissions,
  getUserActivityLog
} = require('../middleware/userManagement');
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
    const hasPermissionResult = await hasPermission(req.user._id, permission);
    
    if (!hasPermissionResult) {
      return res.status(403).json({
        success: false,
        error: `Permission required: ${permission}`
      });
    }
    
    next();
  };
};

// USER MANAGEMENT ROUTES

/**
 * Create a new user (admin only)
 * POST /api/admin/users
 */
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }

    const result = await createUser({
      username,
      email,
      password,
      role: role || 'user'
    }, req.user._id);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.user._id,
            username: result.user.username,
            email: result.user.email,
            role: result.user.role,
            createdAt: result.user.createdAt
          }
        }
      });
    } else {
      res.status(400).json({
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
 * Update user (admin only or self)
 * PUT /api/admin/users/:userId
 */
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email } = req.body;
    
    // Check if user is admin or updating own profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Can only update own profile or admin access required'
      });
    }

    // Non-admin users can only update certain fields
    const allowedFields = req.user.role === 'admin' 
      ? { username, email }
      : { username };

    const result = await updateUser(userId, allowedFields, req.user._id);

    if (result.success) {
      res.json({
        success: true,
        data: {
          user: {
            id: result.user._id,
            username: result.user.username,
            email: result.user.email,
            role: result.user.role
          }
        }
      });
    } else {
      res.status(400).json({
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
 * Delete user (admin only)
 * DELETE /api/admin/users/:userId
 */
router.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent self-deletion
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    const result = await deleteUser(userId, req.user._id);

    if (result.success) {
      res.json({
        success: true,
        data: { message: 'User deleted successfully' }
      });
    } else {
      res.status(400).json({
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
 * Assign role to user (admin only)
 * PUT /api/admin/users/:userId/role
 */
router.put('/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      });
    }

    const validRoles = ['user', 'agent', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const result = await assignRole(userId, role, req.user._id);

    if (result.success) {
      res.json({
        success: true,
        data: {
          user: {
            id: result.user._id,
            username: result.user.username,
            email: result.user.email,
            role: result.user.role
          }
        }
      });
    } else {
      res.status(400).json({
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
 * Get user analytics (admin or self)
 * GET /api/admin/users/:userId/analytics
 */
router.get('/users/:userId/analytics', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeRange = '30d' } = req.query;
    
    // Check if user is admin or viewing own analytics
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Can only view own analytics or admin access required'
      });
    }

    const result = await getUserAnalytics(userId, timeRange);

    if (result.success) {
      res.json({
        success: true,
        data: result.analytics
      });
    } else {
      res.status(400).json({
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
 * Get user activity log (admin or self)
 * GET /api/admin/users/:userId/activity
 */
router.get('/users/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    // Check if user is admin or viewing own activity
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Can only view own activity or admin access required'
      });
    }

    const activities = getUserActivityLog(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        activities,
        count: activities.length
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
 * Get user permissions
 * GET /api/admin/users/:userId/permissions
 */
router.get('/users/:userId/permissions', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is admin or viewing own permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Can only view own permissions or admin access required'
      });
    }

    const permissions = await getUserPermissions(userId);

    res.json({
      success: true,
      data: {
        userId,
        permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// TEAM MANAGEMENT ROUTES

/**
 * Create a new team (admin only)
 * POST /api/admin/teams
 */
router.post('/teams', requireAdmin, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Team name is required'
      });
    }

    const result = await createTeam({
      name,
      description,
      permissions
    }, req.user._id);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.team
      });
    } else {
      res.status(400).json({
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
 * Get all teams
 * GET /api/admin/teams
 */
router.get('/teams', requirePermission('teams.read'), async (req, res) => {
  try {
    const teams = getAllTeams();

    res.json({
      success: true,
      data: {
        teams,
        count: teams.length
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
 * Get specific team
 * GET /api/admin/teams/:teamId
 */
router.get('/teams/:teamId', requirePermission('teams.read'), async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = getTeam(teamId);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Get team members details
    const members = await getTeamMembers(teamId);

    res.json({
      success: true,
      data: {
        team,
        members
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
 * Update team (admin only)
 * PUT /api/admin/teams/:teamId
 */
router.put('/teams/:teamId', requireAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description, permissions } = req.body;

    const result = await updateTeam(teamId, {
      name,
      description,
      permissions
    }, req.user._id);

    if (result.success) {
      res.json({
        success: true,
        data: result.team
      });
    } else {
      res.status(400).json({
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
 * Delete team (admin only)
 * DELETE /api/admin/teams/:teamId
 */
router.delete('/teams/:teamId', requireAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;

    const result = await deleteTeam(teamId, req.user._id);

    if (result.success) {
      res.json({
        success: true,
        data: { message: 'Team deleted successfully' }
      });
    } else {
      res.status(400).json({
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
 * Add member to team (admin only)
 * POST /api/admin/teams/:teamId/members
 */
router.post('/teams/:teamId/members', requireAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await addTeamMember(teamId, userId, req.user._id);

    if (result.success) {
      res.json({
        success: true,
        data: result.team
      });
    } else {
      res.status(400).json({
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
 * Remove member from team (admin only)
 * DELETE /api/admin/teams/:teamId/members/:userId
 */
router.delete('/teams/:teamId/members/:userId', requireAdmin, async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const result = await removeTeamMember(teamId, userId, req.user._id);

    if (result.success) {
      res.json({
        success: true,
        data: result.team
      });
    } else {
      res.status(400).json({
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
 * Get user's teams
 * GET /api/admin/users/:userId/teams
 */
router.get('/users/:userId/teams', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is admin or viewing own teams
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Can only view own teams or admin access required'
      });
    }

    const teams = await getUserTeams(userId);

    res.json({
      success: true,
      data: {
        teams,
        count: teams.length
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
 * Get team members
 * GET /api/admin/teams/:teamId/members
 */
router.get('/teams/:teamId/members', requirePermission('teams.read'), async (req, res) => {
  try {
    const { teamId } = req.params;
    const members = await getTeamMembers(teamId);

    res.json({
      success: true,
      data: {
        members,
        count: members.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// SYSTEM ANALYTICS ROUTES

/**
 * Get system analytics (admin only)
 * GET /api/admin/analytics
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    const result = await getSystemAnalytics(timeRange);

    if (result.success) {
      res.json({
        success: true,
        data: result.analytics
      });
    } else {
      res.status(400).json({
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
 * Get all permissions (admin only)
 * GET /api/admin/permissions
 */
router.get('/permissions', requireAdmin, async (req, res) => {
  try {
    const permissions = getAllPermissions();

    res.json({
      success: true,
      data: {
        permissions,
        count: permissions.length
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
 * Check if user has specific permission
 * GET /api/admin/users/:userId/has-permission/:permission
 */
router.get('/users/:userId/has-permission/:permission', async (req, res) => {
  try {
    const { userId, permission } = req.params;
    
    // Check if user is admin or checking own permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Can only check own permissions or admin access required'
      });
    }

    const hasPermissionResult = await hasPermission(userId, permission);

    res.json({
      success: true,
      data: {
        userId,
        permission,
        hasPermission: hasPermissionResult
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
