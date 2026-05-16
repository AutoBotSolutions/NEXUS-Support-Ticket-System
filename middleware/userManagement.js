/**
 * NEXUS User Management System
 * Advanced user management with teams, permissions, and analytics
 */

const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { sendNotification } = require('./notificationSystem');

class UserManagementSystem {
  constructor() {
    this.teams = new Map();
    this.permissions = new Map();
    this.activities = new Map();
    this.analytics = new Map();
    
    this.initializeDefaultPermissions();
    this.initializeDefaultTeams();
  }

  initializeDefaultPermissions() {
    // Define permission levels
    this.permissions.set('admin', {
      name: 'Administrator',
      level: 100,
      permissions: [
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'users.assign_role',
        'teams.create',
        'teams.read',
        'teams.update',
        'teams.delete',
        'teams.manage_members',
        'tickets.create',
        'tickets.read',
        'tickets.update',
        'tickets.delete',
        'tickets.assign',
        'tickets.resolve',
        'system.monitoring',
        'system.analytics',
        'system.settings',
        'notifications.manage'
      ]
    });

    this.permissions.set('agent', {
      name: 'Support Agent',
      level: 50,
      permissions: [
        'users.read',
        'tickets.create',
        'tickets.read',
        'tickets.update',
        'tickets.assign',
        'tickets.resolve',
        'teams.read',
        'system.monitoring'
      ]
    });

    this.permissions.set('user', {
      name: 'Regular User',
      level: 10,
      permissions: [
        'users.read_own',
        'tickets.create',
        'tickets.read_own',
        'tickets.update_own'
      ]
    });

    this.permissions.set('guest', {
      name: 'Guest',
      level: 1,
      permissions: [
        'tickets.create_public',
        'tickets.read_public'
      ]
    });
  }

  initializeDefaultTeams() {
    // Create default teams
    this.teams.set('support', {
      id: 'support',
      name: 'Support Team',
      description: 'Main support team handling all tickets',
      members: [],
      permissions: ['tickets.read', 'tickets.assign', 'tickets.resolve'],
      createdAt: Date.now(),
      createdBy: 'system'
    });

    this.teams.set('development', {
      id: 'development',
      name: 'Development Team',
      description: 'Development team handling bug reports and feature requests',
      members: [],
      permissions: ['tickets.read', 'tickets.assign', 'tickets.resolve'],
      createdAt: Date.now(),
      createdBy: 'system'
    });

    this.teams.set('administrators', {
      id: 'administrators',
      name: 'Administrators',
      description: 'System administrators',
      members: [],
      permissions: ['system.monitoring', 'system.analytics', 'users.read'],
      createdAt: Date.now(),
      createdBy: 'system'
    });
  }

  async createUser(userData, createdBy = null) {
    try {
      const user = await User.create(userData);
      
      // Track user creation activity
      this.trackActivity({
        type: 'user_created',
        userId: user._id,
        targetId: user._id,
        details: {
          username: user.username,
          email: user.email,
          role: user.role,
          createdBy: createdBy || 'system'
        },
        timestamp: Date.now()
      });

      // Send welcome notification
      await sendNotification({
        userId: user._id,
        type: 'welcome',
        data: {
          name: user.username,
          email: user.email,
          userId: user._id
        }
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, updateData, updatedBy = null) {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Track user update activity
      this.trackActivity({
        type: 'user_updated',
        userId: updatedBy || 'system',
        targetId: userId,
        details: {
          updatedFields: Object.keys(updateData),
          updatedBy: updatedBy || 'system'
        },
        timestamp: Date.now()
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteUser(userId, deletedBy = null) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Check if user can be deleted (not last admin, etc.)
      const canDelete = await this.canDeleteUser(userId);
      
      if (!canDelete) {
        return { success: false, error: 'Cannot delete this user' };
      }

      // Remove user from all teams
      await this.removeUserFromAllTeams(userId);

      // Delete user
      await User.findByIdAndDelete(userId);

      // Track user deletion activity
      this.trackActivity({
        type: 'user_deleted',
        userId: deletedBy || 'system',
        targetId: userId,
        details: {
          username: user.username,
          email: user.email,
          deletedBy: deletedBy || 'system'
        },
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async canDeleteUser(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      return false;
    }

    // Don't allow deletion of the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return false;
      }
    }

    return true;
  }

  async assignRole(userId, newRole, assignedBy = null) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const oldRole = user.role;
      user.role = newRole;
      await user.save();

      // Track role assignment activity
      this.trackActivity({
        type: 'role_assigned',
        userId: assignedBy || 'system',
        targetId: userId,
        details: {
          oldRole,
          newRole,
          assignedBy: assignedBy || 'system'
        },
        timestamp: Date.now()
      });

      // Send notification to user
      await sendNotification({
        userId,
        type: 'role_assigned',
        data: {
          name: user.username,
          email: user.email,
          oldRole,
          newRole,
          assignedBy: assignedBy || 'system'
        }
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createTeam(teamData, createdBy = null) {
    try {
      const team = {
        id: this.generateTeamId(),
        name: teamData.name,
        description: teamData.description || '',
        members: teamData.members || [],
        permissions: teamData.permissions || [],
        createdAt: Date.now(),
        createdBy: createdBy || 'system'
      };

      this.teams.set(team.id, team);

      // Track team creation activity
      this.trackActivity({
        type: 'team_created',
        userId: createdBy || 'system',
        targetId: team.id,
        details: {
          teamName: team.name,
          createdBy: createdBy || 'system'
        },
        timestamp: Date.now()
      });

      return { success: true, team };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateTeam(teamId, updateData, updatedBy = null) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      Object.assign(team, updateData);
      this.teams.set(teamId, team);

      // Track team update activity
      this.trackActivity({
        type: 'team_updated',
        userId: updatedBy || 'system',
        targetId: teamId,
        details: {
          teamName: team.name,
          updatedFields: Object.keys(updateData),
          updatedBy: updatedBy || 'system'
        },
        timestamp: Date.now()
      });

      return { success: true, team };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteTeam(teamId, deletedBy = null) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      // Don't allow deletion of default teams
      if (['support', 'development', 'administrators'].includes(teamId)) {
        return { success: false, error: 'Cannot delete default team' };
      }

      this.teams.delete(teamId);

      // Track team deletion activity
      this.trackActivity({
        type: 'team_deleted',
        userId: deletedBy || 'system',
        targetId: teamId,
        details: {
          teamName: team.name,
          deletedBy: deletedBy || 'system'
        },
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addTeamMember(teamId, userId, addedBy = null) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (!team.members.includes(userId)) {
        team.members.push(userId);
        this.teams.set(teamId, team);

        // Track team member addition
        this.trackActivity({
          type: 'team_member_added',
          userId: addedBy || 'system',
          targetId: userId,
          details: {
            teamId,
            teamName: team.name,
            memberName: user.username,
            addedBy: addedBy || 'system'
          },
          timestamp: Date.now()
        });

        // Send notification to user
        await sendNotification({
          userId,
          type: 'team_assigned',
          data: {
            name: user.username,
            email: user.email,
            teamName: team.name,
            addedBy: addedBy || 'system'
          }
        });
      }

      return { success: true, team };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async removeTeamMember(teamId, userId, removedBy = null) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team) {
        return { success: false, error: 'Team not found' };
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      team.members = team.members.filter(memberId => memberId.toString() !== userId.toString());
      this.teams.set(teamId, team);

      // Track team member removal
      this.trackActivity({
        type: 'team_member_removed',
        userId: removedBy || 'system',
        targetId: userId,
        details: {
          teamId,
          teamName: team.name,
          memberName: user.username,
          removedBy: removedBy || 'system'
        },
        timestamp: Date.now()
      });

      return { success: true, team };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async removeUserFromAllTeams(userId) {
    for (const [teamId, team] of this.teams) {
      team.members = team.members.filter(memberId => memberId.toString() !== userId.toString());
      this.teams.set(teamId, team);
    }
  }

  async getUserTeams(userId) {
    const userTeams = [];
    
    for (const [teamId, team] of this.teams) {
      if (team.members.includes(userId)) {
        userTeams.push(team);
      }
    }
    
    return userTeams;
  }

  async getTeamMembers(teamId) {
    const team = this.teams.get(teamId);
    
    if (!team) {
      return [];
    }

    const members = await User.find({ '_id': { $in: team.members } });
    return members;
  }

  async getUserPermissions(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      return [];
    }

    const rolePermissions = this.permissions.get(user.role);
    const userTeams = await this.getUserTeams(userId);
    
    let allPermissions = [...(rolePermissions?.permissions || [])];
    
    // Add team permissions
    for (const team of userTeams) {
      allPermissions = [...allPermissions, ...team.permissions];
    }

    // Remove duplicates
    return [...new Set(allPermissions)];
  }

  async hasPermission(userId, permission) {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.includes(permission);
  }

  async getUserAnalytics(userId, timeRange = '30d') {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const timeRangeMs = this.parseTimeRange(timeRange);
      const startDate = new Date(Date.now() - timeRangeMs);

      // Get user tickets
      const tickets = await Ticket.find({
        $or: [
          { createdBy: userId },
          { assignedTo: userId }
        ],
        createdAt: { $gte: startDate }
      });

      // Calculate analytics
      const analytics = {
        userId,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        timeRange,
        tickets: {
          total: tickets.length,
          created: tickets.filter(t => t.createdBy.toString() === userId.toString()).length,
          assigned: tickets.filter(t => t.assignedTo && t.assignedTo.toString() === userId.toString()).length,
          resolved: tickets.filter(t => t.status === 'resolved').length,
          inProgress: tickets.filter(t => t.status === 'in_progress').length,
          open: tickets.filter(t => t.status === 'open').length
        },
        performance: {
          avgResolutionTime: this.calculateAvgResolutionTime(tickets),
          resolutionRate: this.calculateResolutionRate(tickets),
          responseRate: this.calculateResponseRate(tickets)
        },
        activity: this.getUserActivity(userId, timeRangeMs)
      };

      return { success: true, analytics };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getSystemAnalytics(timeRange = '30d') {
    try {
      const timeRangeMs = this.parseTimeRange(timeRange);
      const startDate = new Date(Date.now() - timeRangeMs);

      // Get system-wide analytics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ 
        lastLogin: { $gte: startDate }
      });
      const newUsers = await User.countDocuments({ 
        createdAt: { $gte: startDate }
      });

      const usersByRole = await User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      const tickets = await Ticket.find({
        createdAt: { $gte: startDate }
      });

      const analytics = {
        timeRange,
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        tickets: {
          total: tickets.length,
          byStatus: this.groupByStatus(tickets),
          byPriority: this.groupByPriority(tickets),
          byCategory: this.groupByCategory(tickets)
        },
        teams: this.getTeamAnalytics(),
        performance: {
          avgTicketResolutionTime: this.calculateAvgResolutionTime(tickets),
          systemUptime: this.calculateSystemUptime()
        }
      };

      return { success: true, analytics };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getTeamAnalytics() {
    const teamAnalytics = {};
    
    for (const [teamId, team] of this.teams) {
      teamAnalytics[teamId] = {
        name: team.name,
        memberCount: team.members.length,
        permissions: team.permissions.length,
        createdAt: team.createdAt
      };
    }
    
    return teamAnalytics;
  }

  trackActivity(activity) {
    if (!this.activities.has(activity.userId)) {
      this.activities.set(activity.userId, []);
    }
    
    const userActivities = this.activities.get(activity.userId);
    userActivities.unshift(activity);
    
    // Keep only last 100 activities per user
    if (userActivities.length > 100) {
      userActivities.splice(100);
    }
  }

  getUserActivity(userId, timeRangeMs) {
    const userActivities = this.activities.get(userId) || [];
    const cutoffTime = Date.now() - timeRangeMs;
    
    return userActivities.filter(activity => activity.timestamp >= cutoffTime);
  }

  parseTimeRange(timeRange) {
    const units = {
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000,
      'm': 30 * 24 * 60 * 60 * 1000,
      'y': 365 * 24 * 60 * 60 * 1000
    };
    
    const match = timeRange.match(/^(\d+)([dwmy])$/);
    if (!match) {
      return 30 * 24 * 60 * 60 * 1000; // Default to 30 days
    }
    
    const [, number, unit] = match;
    return parseInt(number) * units[unit];
  }

  calculateAvgResolutionTime(tickets) {
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' && t.resolvedAt);
    
    if (resolvedTickets.length === 0) {
      return 0;
    }
    
    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      return sum + (ticket.resolvedAt - ticket.createdAt);
    }, 0);
    
    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // Convert to hours
  }

  calculateResolutionRate(tickets) {
    if (tickets.length === 0) {
      return 0;
    }
    
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
    return Math.round((resolvedCount / tickets.length) * 100);
  }

  calculateResponseRate(tickets) {
    if (tickets.length === 0) {
      return 0;
    }
    
    const ticketsWithComments = tickets.filter(t => t.comments && t.comments.length > 0);
    return Math.round((ticketsWithComments.length / tickets.length) * 100);
  }

  groupByStatus(tickets) {
    return tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {});
  }

  groupByPriority(tickets) {
    return tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});
  }

  groupByCategory(tickets) {
    return tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {});
  }

  calculateSystemUptime() {
    // In a real implementation, this would track actual system uptime
    // For now, return a mock value
    return 99.9;
  }

  generateTeamId() {
    return `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Permission management methods
  async createCustomPermission(name, permissions, level) {
    const permission = {
      name,
      level,
      permissions: Array.isArray(permissions) ? permissions : [permissions]
    };
    
    const permissionId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.permissions.set(permissionId, permission);
    
    return { success: true, permissionId };
  }

  async assignCustomPermission(userId, permissionId) {
    const permission = this.permissions.get(permissionId);
    
    if (!permission) {
      return { success: false, error: 'Permission not found' };
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!user.customPermissions) {
      user.customPermissions = [];
    }
    
    if (!user.customPermissions.includes(permissionId)) {
      user.customPermissions.push(permissionId);
      await user.save();
    }
    
    return { success: true };
  }

  async revokeCustomPermission(userId, permissionId) {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (user.customPermissions) {
      user.customPermissions = user.customPermissions.filter(id => id !== permissionId);
      await user.save();
    }
    
    return { success: true };
  }

  // Get all teams
  getAllTeams() {
    return Array.from(this.teams.values());
  }

  // Get team by ID
  getTeam(teamId) {
    return this.teams.get(teamId);
  }

  // Get all permissions
  getAllPermissions() {
    return Array.from(this.permissions.entries()).map(([id, permission]) => ({
      id,
      ...permission
    }));
  }

  // Get user activity log
  getUserActivityLog(userId, limit = 50) {
    const activities = this.activities.get(userId) || [];
    return activities.slice(0, limit);
  }
}

// Create singleton instance
const userManagementSystem = new UserManagementSystem();

// Export functions
const createUser = (userData, createdBy) => userManagementSystem.createUser(userData, createdBy);
const updateUser = (userId, updateData, updatedBy) => userManagementSystem.updateUser(userId, updateData, updatedBy);
const deleteUser = (userId, deletedBy) => userManagementSystem.deleteUser(userId, deletedBy);
const assignRole = (userId, newRole, assignedBy) => userManagementSystem.assignRole(userId, newRole, assignedBy);
const createTeam = (teamData, createdBy) => userManagementSystem.createTeam(teamData, createdBy);
const updateTeam = (teamId, updateData, updatedBy) => userManagementSystem.updateTeam(teamId, updateData, updatedBy);
const deleteTeam = (teamId, deletedBy) => userManagementSystem.deleteTeam(teamId, deletedBy);
const addTeamMember = (teamId, userId, addedBy) => userManagementSystem.addTeamMember(teamId, userId, addedBy);
const removeTeamMember = (teamId, userId, removedBy) => userManagementSystem.removeTeamMember(teamId, userId, removedBy);
const getUserTeams = (userId) => userManagementSystem.getUserTeams(userId);
const getTeamMembers = (teamId) => userManagementSystem.getTeamMembers(teamId);
const getUserPermissions = (userId) => userManagementSystem.getUserPermissions(userId);
const hasPermission = (userId, permission) => userManagementSystem.hasPermission(userId, permission);
const getUserAnalytics = (userId, timeRange) => userManagementSystem.getUserAnalytics(userId, timeRange);
const getSystemAnalytics = (timeRange) => userManagementSystem.getSystemAnalytics(timeRange);
const getAllTeams = () => userManagementSystem.getAllTeams();
const getTeam = (teamId) => userManagementSystem.getTeam(teamId);
const getAllPermissions = () => userManagementSystem.getAllPermissions();
const getUserActivityLog = (userId, limit) => userManagementSystem.getUserActivityLog(userId, limit);

module.exports = {
  userManagementSystem,
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
};
