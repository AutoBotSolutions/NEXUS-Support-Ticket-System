/**
 * User Management Controller Unit Tests
 * Comprehensive testing for enhanced user management functionality
 */

// Mock dependencies before importing the controller
jest.mock('../../../models/User');
jest.mock('../../../models/Team');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../middleware/notificationSystem');

// Set environment variables
process.env.JWT_SECRET = 'test-jwt-secret';

const {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  searchUsers,
  getUserAnalytics,
  getSystemAnalytics,
  getUserActivityLog,
  createUser,
  updateUser,
  deleteUser,
  assignRole
} = require('../../../controllers/userManagementController');

const User = require('../../../models/User');
const Team = require('../../../models/Team');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('User Management Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { userId: 'test-user-id', role: 'user' },
      params: {},
      body: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    test('should get user profile successfully', async () => {
      const mockUser = {
        _id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        populate: jest.fn().mockResolvedValue({
          _id: 'test-user-id',
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user'
        }),
        toSafeObject: jest.fn().mockReturnValue({
          _id: 'test-user-id',
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user'
        })
      };

      User.findById.mockReturnValue(mockUser);

      await getUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith('test-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    test('should return error if user not found', async () => {
      const mockUser = {
        _id: 'test-user-id',
        populate: jest.fn().mockResolvedValue(null)
      };

      User.findById.mockReturnValue(mockUser);

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('updateUserProfile', () => {
    test('should update user profile successfully', async () => {
      const mockUser = {
        _id: 'test-user-id',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        save: jest.fn().mockResolvedValue(),
        toSafeObject: jest.fn().mockReturnValue({
          _id: 'test-user-id',
          username: 'testuser',
          firstName: 'Updated',
          lastName: 'User'
        })
      };

      req.body = {
        firstName: 'Updated',
        lastName: 'User',
        bio: 'Updated bio',
        phone: '+1234567890'
      };

      User.findById.mockResolvedValue(mockUser);

      await updateUserProfile(req, res);

      expect(mockUser.firstName).toBe('Updated');
      expect(mockUser.lastName).toBe('User');
      expect(mockUser.bio).toBe('Updated bio');
      expect(mockUser.phone).toBe('+1234567890');
      expect(mockUser.updatedBy).toBe('test-user-id');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return error if user not found', async () => {
      User.findById.mockResolvedValue(null);

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('getUserPreferences', () => {
    test('should get user preferences successfully', async () => {
      const mockUser = {
        _id: 'test-user-id',
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: {
            email: true,
            push: false
          }
        }
      };

      User.findById.mockResolvedValue(mockUser);

      await getUserPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser.preferences
      });
    });

    test('should return error if user not found', async () => {
      User.findById.mockResolvedValue(null);

      await getUserPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('updateUserPreferences', () => {
    test('should update user preferences successfully', async () => {
      const mockUser = {
        _id: 'test-user-id',
        preferences: {
          language: 'en',
          theme: 'dark'
        },
        save: jest.fn().mockResolvedValue()
      };

      req.body = {
        preferences: {
          language: 'es',
          theme: 'light',
          notifications: {
            email: false,
            push: true
          }
        }
      };

      User.findById.mockResolvedValue(mockUser);

      await updateUserPreferences(req, res);

      expect(mockUser.preferences.language).toBe('es');
      expect(mockUser.preferences.theme).toBe('light');
      expect(mockUser.preferences.notifications.email).toBe(false);
      expect(mockUser.preferences.notifications.push).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return error if user not found', async () => {
      User.findById.mockResolvedValue(null);

      await updateUserPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('searchUsers', () => {
    test('should search users successfully', async () => {
      const mockUsers = [
        { _id: '1', username: 'user1', email: 'user1@example.com', toSafeObject: jest.fn().mockReturnValue({ _id: '1', username: 'user1' }) },
        { _id: '2', username: 'user2', email: 'user2@example.com', toSafeObject: jest.fn().mockReturnValue({ _id: '2', username: 'user2' }) }
      ];

      req.query = {
        query: 'user',
        role: 'user',
        page: '1',
        limit: '10'
      };

      User.find.mockResolvedValue(mockUsers);
      User.countDocuments.mockResolvedValue(2);

      await searchUsers(req, res);

      expect(User.find).toHaveBeenCalledWith({
        $or: [
          { username: { $regex: 'user', $options: 'i' } },
          { email: { $regex: 'user', $options: 'i' } },
          { firstName: { $regex: 'user', $options: 'i' } },
          { lastName: { $regex: 'user', $options: 'i' } }
        ],
        role: 'user',
        isActive: true
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle search without filters', async () => {
      const mockUsers = [];

      req.query = {
        page: '1',
        limit: '20'
      };

      User.find.mockResolvedValue(mockUsers);
      User.countDocuments.mockResolvedValue(0);

      await searchUsers(req, res);

      expect(User.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getUserAnalytics', () => {
    test('should get user analytics successfully', async () => {
      const mockUser = {
        _id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date('2023-01-01'),
        lastLogin: new Date('2023-12-01'),
        loginCount: 100,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        activity: {
          lastActivity: new Date('2023-12-01'),
          totalTicketsCreated: 50,
          totalTicketsResolved: 25
        },
        teams: [
          { teamId: 'team1', role: 'member', joinedAt: new Date('2023-06-01') },
          { teamId: 'team2', role: 'admin', joinedAt: new Date('2023-08-01') }
        ]
      };

      req.params = { userId: 'test-user-id' };

      User.findById.mockResolvedValue(mockUser);

      await getUserAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          profile: {
            joinDate: mockUser.createdAt,
            lastLogin: mockUser.lastLogin,
            totalLogins: mockUser.loginCount,
            isActive: mockUser.isActive,
            isEmailVerified: mockUser.isEmailVerified,
            isPhoneVerified: mockUser.isPhoneVerified
          },
          activity: {
            lastActivity: mockUser.activity.lastActivity,
            totalTicketsCreated: mockUser.activity.totalTicketsCreated,
            totalTicketsResolved: mockUser.activity.totalTicketsResolved,
            teamsCount: mockUser.teams.length
          },
          teams: mockUser.teams
        }
      });
    });

    test('should return error if user not found', async () => {
      req.params = { userId: 'non-existent-user' };
      User.findById.mockResolvedValue(null);

      await getUserAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('getSystemAnalytics', () => {
    test('should get system analytics successfully', async () => {
      req.user.role = 'admin';

      const mockUsersByRole = [
        { _id: 'admin', count: 2 },
        { _id: 'user', count: 50 },
        { _id: 'support_agent', count: 5 }
      ];

      const mockRecentUsers = [
        { _id: '1', username: 'user1', email: 'user1@example.com', role: 'user', createdAt: new Date(), toSafeObject: jest.fn().mockReturnValue({ _id: '1', username: 'user1' }) },
        { _id: '2', username: 'user2', email: 'user2@example.com', role: 'user', createdAt: new Date(), toSafeObject: jest.fn().mockReturnValue({ _id: '2', username: 'user2' }) }
      ];

      User.countDocuments.mockResolvedValue(57);
      User.countDocuments.mockResolvedValue(55);
      User.countDocuments.mockResolvedValue(50);
      User.countDocuments.mockResolvedValue(30);
      User.aggregate.mockResolvedValue(mockUsersByRole);
      User.find.mockResolvedValue(mockRecentUsers);

      await getSystemAnalytics(req, res);

      expect(User.countDocuments).toHaveBeenCalledWith();
      expect(User.countDocuments).toHaveBeenCalledWith({ isActive: true });
      expect(User.countDocuments).toHaveBeenCalledWith({ isEmailVerified: true });
      expect(User.countDocuments).toHaveBeenCalledWith({ isPhoneVerified: true });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return error for non-admin users', async () => {
      req.user.role = 'user';

      await getSystemAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required'
      });
    });
  });

  describe('createUser', () => {
    test('should create user successfully', async () => {
      req.user.role = 'admin';

      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!',
        role: 'user',
        firstName: 'New',
        lastName: 'User'
      };

      req.body = userData;

      const mockUser = {
        _id: 'new-user-id',
        username: 'newuser',
        email: 'newuser@example.com',
        role: 'user',
        firstName: 'New',
        lastName: 'User',
        save: jest.fn().mockResolvedValue(),
        toSafeObject: jest.fn().mockReturnValue({
          _id: 'new-user-id',
          username: 'newuser',
          email: 'newuser@example.com',
          role: 'user'
        })
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedpassword');
      User.prototype.save = mockUser.save;

      // Mock User constructor
      const MockUser = jest.fn().mockImplementation(() => mockUser);
      User.mockImplementation(MockUser);

      await createUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should return error for non-admin users', async () => {
      req.user.role = 'user';

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required'
      });
    });

    test('should return error for invalid email', async () => {
      req.user.role = 'admin';
      req.body = {
        username: 'newuser',
        email: 'invalid-email',
        password: 'Password123!'
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid email format'
      });
    });

    test('should return error for weak password', async () => {
      req.user.role = 'admin';
      req.body = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'weak'
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters'
      });
    });

    test('should return error for existing user', async () => {
      req.user.role = 'admin';
      req.body = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'Password123!'
      };

      User.findOne.mockResolvedValue({ username: 'existinguser' });

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User with this email or username already exists'
      });
    });
  });

  describe('updateUser', () => {
    test('should update user successfully', async () => {
      req.user.role = 'admin';
      req.params = { userId: 'test-user-id' };
      req.body = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'support_agent'
      };

      const mockUser = {
        _id: 'test-user-id',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        save: jest.fn().mockResolvedValue(),
        toSafeObject: jest.fn().mockReturnValue({
          _id: 'test-user-id',
          username: 'testuser',
          firstName: 'Updated',
          lastName: 'Name',
          role: 'support_agent'
        })
      };

      User.findById.mockResolvedValue(mockUser);

      await updateUser(req, res);

      expect(mockUser.firstName).toBe('Updated');
      expect(mockUser.lastName).toBe('Name');
      expect(mockUser.role).toBe('support_agent');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return error for non-admin users', async () => {
      req.user.role = 'user';

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required'
      });
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      req.user.role = 'admin';
      req.params = { userId: 'test-user-id' };

      const mockUser = {
        _id: 'test-user-id',
        username: 'testuser',
        role: 'user'
      };

      User.findById.mockResolvedValue(mockUser);
      User.findByIdAndDelete.mockResolvedValue(mockUser);

      await deleteUser(req, res);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('test-user-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully'
      });
    });

    test('should return error for non-admin users', async () => {
      req.user.role = 'user';

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required'
      });
    });

    test('should return error when trying to delete last admin', async () => {
      req.user.role = 'admin';
      req.params = { userId: 'admin-user-id' };

      const mockAdminUser = {
        _id: 'admin-user-id',
        username: 'admin',
        role: 'admin'
      };

      User.findById.mockResolvedValue(mockAdminUser);
      User.countDocuments.mockResolvedValue(1);

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete the last admin user'
      });
    });
  });

  describe('assignRole', () => {
    test('should assign role successfully', async () => {
      req.user.role = 'admin';
      req.params = { userId: 'test-user-id' };
      req.body = {
        role: 'support_agent',
        permissions: ['tickets.create', 'tickets.read']
      };

      const mockUser = {
        _id: 'test-user-id',
        username: 'testuser',
        role: 'user',
        save: jest.fn().mockResolvedValue(),
        toSafeObject: jest.fn().mockReturnValue({
          _id: 'test-user-id',
          username: 'testuser',
          role: 'support_agent'
        })
      };

      User.findById.mockResolvedValue(mockUser);

      await assignRole(req, res);

      expect(mockUser.role).toBe('support_agent');
      expect(mockUser.permissions).toEqual(['tickets.create', 'tickets.read']);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return error for non-admin users', async () => {
      req.user.role = 'user';

      await assignRole(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required'
      });
    });

    test('should return error for invalid role', async () => {
      req.user.role = 'admin';
      req.params = { userId: 'test-user-id' };
      req.body = { role: 'invalid_role' };

      const mockUser = { _id: 'test-user-id', role: 'user' };
      User.findById.mockResolvedValue(mockUser);

      await assignRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid role'
      });
    });
  });

  describe('getUserActivityLog', () => {
    test('should get user activity log successfully', async () => {
      const mockUser = {
        _id: 'test-user-id',
        username: 'testuser',
        activity: {
          lastActivity: new Date('2023-12-01'),
          totalLogins: 100
        },
        loginCount: 100,
        lastLogin: new Date('2023-12-01'),
        createdAt: new Date('2023-01-01')
      };

      req.params = { userId: 'test-user-id' };

      User.findById.mockResolvedValue(mockUser);

      await getUserActivityLog(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          lastActivity: mockUser.activity.lastActivity,
          totalLogins: mockUser.loginCount,
          lastLogin: mockUser.lastLogin,
          createdAt: mockUser.createdAt
        }
      });
    });

    test('should return error if user not found', async () => {
      req.params = { userId: 'non-existent-user' };
      User.findById.mockResolvedValue(null);

      await getUserActivityLog(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });
});
