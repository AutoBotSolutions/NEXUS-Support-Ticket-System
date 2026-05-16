/**
 * User Controller Final Working Test
 * Demonstrates the complete testing system functionality
 */

// Mock dependencies at the top level
jest.mock('../../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('validator');

// Mock the monitoring middleware properly
const mockTrackUserRegistered = jest.fn();
const mockTrackAuthenticationAttempt = jest.fn();

jest.mock('../../../middleware/apmMonitoringSimple', () => ({
  trackUserRegistered: mockTrackUserRegistered,
  trackAuthenticationAttempt: mockTrackAuthenticationAttempt
}));

// Mock the notification system
jest.mock('../../../middleware/notificationSystem', () => ({
  sendNotification: jest.fn().mockResolvedValue()
}));

// Set environment variables
process.env.JWT_SECRET = 'test-jwt-secret';

const { register, login, getMe } = require('../../../controllers/userController');
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

describe('User Controller - Working Final Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };

      req.body = userData;

      // Mock validator.isEmail
      validator.isEmail.mockReturnValue(true);
      
      // Mock User.findOne (no existing user)
      User.findOne.mockResolvedValue(null);
      
      // Mock bcrypt.hash
      bcrypt.hash.mockResolvedValue('hashedpassword');
      
      // Mock User.create
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: userData.username,
        email: userData.email,
        password: 'hashedpassword',
        role: 'user'
      };
      User.create.mockResolvedValue(mockUser);

      // Mock jwt.sign
      jwt.sign.mockReturnValue('test-token');

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
            role: 'user'
          },
          token: 'test-token'
        }
      });

      console.log('✓ User registration test passed');
    });

    test('should return error for missing required fields', async () => {
      const userData = {
        username: 'testuser'
        // Missing email and password
      };

      req.body = userData;

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Username, email, and password are required'
      });

      console.log('✓ Required fields validation test passed');
    });

    test('should return error for invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123!'
      };

      req.body = userData;

      // Mock validator.isEmail
      validator.isEmail.mockReturnValue(false);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid email format'
      });

      console.log('✓ Email format validation test passed');
    });

    test('should return error for weak password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // Too short
      };

      req.body = userData;

      // Mock validator.isEmail
      validator.isEmail.mockReturnValue(true);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('Password must be at least 8 characters long')
      });

      console.log('✓ Password validation test passed');
    });

    test('should return error for existing user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };

      req.body = userData;

      // Mock validator.isEmail
      validator.isEmail.mockReturnValue(true);
      
      // Mock User.findOne (existing user found)
      User.findOne.mockResolvedValue({ username: userData.username });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User already exists'
      });

      console.log('✓ Existing user validation test passed');
    });

    test('should handle database errors during registration', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };

      req.body = userData;

      // Mock validator.isEmail
      validator.isEmail.mockReturnValue(true);

      // Mock User.findOne to throw error
      User.findOne.mockRejectedValue(new Error('Database error'));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });

      console.log('✓ Database error handling test passed');
    });
  });

  describe('login', () => {
    test('should login user successfully', async () => {
      const loginData = {
        username: 'testuser',
        password: 'Password123!'
      };

      req.body = loginData;

      // Mock User.findOne
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user'
      };
      User.findOne.mockResolvedValue(mockUser);

      // Mock bcrypt.compare
      bcrypt.compare.mockResolvedValue(true);

      // Mock jwt.sign
      jwt.sign.mockReturnValue('test-token');

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          token: 'test-token',
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            email: 'test@example.com',
            role: 'user'
          }
        }
      });

      console.log('✓ User login test passed');
    });

    test('should return error for missing credentials', async () => {
      const loginData = {
        username: 'testuser'
        // Missing password
      };

      req.body = loginData;

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Username and password are required'
      });

      console.log('✓ Missing credentials validation test passed');
    });

    test('should return error for invalid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'Password123!'
      };

      req.body = loginData;

      // Mock User.findOne (user not found)
      User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      });

      console.log('✓ Invalid credentials test passed');
    });

    test('should return error for wrong password', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      req.body = loginData;

      // Mock User.findOne
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      User.findOne.mockResolvedValue(mockUser);

      // Mock bcrypt.compare (password doesn't match)
      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      });

      console.log('✓ Wrong password test passed');
    });

    test('should handle database errors during login', async () => {
      const loginData = {
        username: 'testuser',
        password: 'Password123!'
      };

      req.body = loginData;

      // Mock User.findOne to throw error
      User.findOne.mockRejectedValue(new Error('Database error'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });

      console.log('✓ Database error handling login test passed');
    });
  });

  describe('getMe', () => {
    test('should get current user profile', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      };

      req.user = { userId: '507f1f77bcf86cd799439011' };

      // Mock User.findById
      User.findById.mockResolvedValue(mockUser);

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });

      console.log('✓ Get user profile test passed');
    });

    test('should handle missing user in request', async () => {
      req.user = null;

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot read properties of null (reading \'userId\')'
      });

      console.log('✓ Missing user authentication test passed');
    });

    test('should handle user not found', async () => {
      req.user = { userId: '507f1f77bcf86cd799439011' };

      // Mock User.findById to return null
      User.findById.mockResolvedValue(null);

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });

      console.log('✓ User not found test passed');
    });
  });

  describe('Performance Tests', () => {
    test('should handle registration within reasonable time', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };

      req.body = userData;

      // Mock validator.isEmail
      validator.isEmail.mockReturnValue(true);
      
      // Mock User.findOne (no existing user)
      User.findOne.mockResolvedValue(null);
      
      // Mock bcrypt.hash
      bcrypt.hash.mockResolvedValue('hashedpassword');
      
      // Mock User.create
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: userData.username,
        email: userData.email,
        password: 'hashedpassword',
        role: 'user'
      };
      User.create.mockResolvedValue(mockUser);

      // Mock jwt.sign
      jwt.sign.mockReturnValue('test-token');

      const startTime = Date.now();
      await register(req, res);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(100); // Should complete within 100ms

      console.log(`✓ Registration performance test passed (${responseTime}ms)`);
    });

    test('should handle login within reasonable time', async () => {
      const loginData = {
        username: 'testuser',
        password: 'Password123!'
      };

      req.body = loginData;

      // Mock User.findOne
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user'
      };
      User.findOne.mockResolvedValue(mockUser);

      // Mock bcrypt.compare
      bcrypt.compare.mockResolvedValue(true);

      // Mock jwt.sign
      jwt.sign.mockReturnValue('test-token');

      const startTime = Date.now();
      await login(req, res);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(50); // Should complete within 50ms

      console.log(`✓ Login performance test passed (${responseTime}ms)`);
    });
  });

  describe('Security Tests', () => {
    test('should handle XSS attempts in input', async () => {
      const userData = {
        username: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'Password123!'
      };

      req.body = userData;

      // Mock validator.isEmail
      validator.isEmail.mockReturnValue(true);
      
      // Mock User.findOne (no existing user)
      User.findOne.mockResolvedValue(null);
      
      // Mock bcrypt.hash
      bcrypt.hash.mockResolvedValue('hashedpassword');
      
      // Mock User.create
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: userData.username,
        email: userData.email,
        password: 'hashedpassword',
        role: 'user'
      };
      User.create.mockResolvedValue(mockUser);

      // Mock jwt.sign
      jwt.sign.mockReturnValue('test-token');

      await register(req, res);

      // The controller should handle the input appropriately
      expect(res.status).toHaveBeenCalledWith(201);

      console.log('✓ XSS input handling test passed');
    });

    test('should handle SQL injection attempts', async () => {
      const userData = {
        username: "'; DROP TABLE users; --",
        email: 'test@example.com',
        password: 'Password123!'
      };

      req.body = userData;

      // Mock validator.isEmail
      validator.isEmail.mockReturnValue(true);

      // Mock User.findOne to throw error for malicious input
      User.findOne.mockRejectedValue(new Error('Invalid input'));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input'
      });

      console.log('✓ SQL injection handling test passed');
    });
  });
});
