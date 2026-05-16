/**
 * User Controller Enhanced Unit Tests
 * Comprehensive testing for user controller functionality
 */

const request = require('supertest');
const app = require('../../../server');

describe('User Controller - Enhanced Tests', () => {
  describe('POST /api/users/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: global.generateRandomEmail(),
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      global.expectSuccess(response, 201);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
      
      global.consoleSuccess('✓ User registration test passed');
    });

    test('should return error for duplicate email', async () => {
      const { user } = await global.createTestUserWithToken();

      const userData = {
        username: 'differentuser',
        email: user.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      global.expectError(response, 400);
      expect(response.body.error.message).toContain('Email already exists');
      
      global.consoleSuccess('✓ Duplicate email validation test passed');
    });

    test('should return error for duplicate username', async () => {
      const { user } = await global.createTestUserWithToken();

      const userData = {
        username: user.username,
        email: global.generateRandomEmail(),
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      global.expectError(response, 400);
      expect(response.body.error.message).toContain('Username already exists');
      
      global.consoleSuccess('✓ Duplicate username validation test passed');
    });

    test('should return error for invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      global.expectError(response, 400);
      expect(response.body.error.message).toContain('valid email');
      
      global.consoleSuccess('✓ Email format validation test passed');
    });

    test('should return error for weak password', async () => {
      const userData = {
        username: 'testuser',
        email: global.generateRandomEmail(),
        password: '123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      global.expectError(response, 400);
      expect(response.body.error.message).toContain('password');
      
      global.consoleSuccess('✓ Password validation test passed');
    });

    test('should return error for missing required fields', async () => {
      const userData = {
        username: 'testuser'
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      global.expectError(response, 400);
      expect(response.body.error.message).toContain('required');
      
      global.consoleSuccess('✓ Required fields validation test passed');
    });
  });

  describe('POST /api/users/login', () => {
    test('should login user successfully', async () => {
      const { user } = await global.createTestUserWithToken({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'password123'
      });

      const loginData = {
        email: user.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      global.expectSuccess(response, 200);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user.password).toBeUndefined();
      
      global.consoleSuccess('✓ User login test passed');
    });

    test('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      global.expectError(response, 401);
      expect(response.body.error.message).toContain('Invalid credentials');
      
      global.consoleSuccess('✓ Invalid credentials test passed');
    });

    test('should return error for missing email', async () => {
      const loginData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(400);

      global.expectError(response, 400);
      expect(response.body.error.message).toContain('Email is required');
      
      global.consoleSuccess('✓ Missing email validation test passed');
    });

    test('should return error for missing password', async () => {
      const loginData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(400);

      global.expectError(response, 400);
      expect(response.body.error.message).toContain('Password is required');
      
      global.consoleSuccess('✓ Missing password validation test passed');
    });
  });

  describe('GET /api/users/me', () => {
    test('should get current user profile', async () => {
      const { user, token } = await global.createTestUserWithToken();

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      global.expectSuccess(response, 200);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user.username).toBe(user.username);
      expect(response.body.data.user.password).toBeUndefined();
      
      global.consoleSuccess('✓ Get user profile test passed');
    });

    test('should return error without authentication token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      global.expectError(response, 401);
      expect(response.body.error.message).toContain('No token provided');
      
      global.consoleSuccess('✓ Authentication required test passed');
    });

    test('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      global.expectError(response, 401);
      expect(response.body.error.message).toContain('Invalid token');
      
      global.consoleSuccess('✓ Invalid token validation test passed');
    });
  });

  describe('Performance Tests', () => {
    test('registration should complete within acceptable time', async () => {
      const userData = {
        username: 'perftest',
        email: global.generateRandomEmail(),
        password: 'password123'
      };

      const responseTime = await global.measureResponseTime(async () => {
        await request(app)
          .post('/api/users/register')
          .send(userData);
      });

      expect(responseTime).toBeLessThan(1000); // Should complete within 1 second
      global.consoleSuccess(`✓ Registration performance test passed (${responseTime}ms)`);
    });

    test('login should complete within acceptable time', async () => {
      const { user } = await global.createTestUserWithToken({
        username: 'perftestlogin',
        email: 'perftest@example.com',
        password: 'password123'
      });

      const loginData = {
        email: user.email,
        password: 'password123'
      };

      const responseTime = await global.measureResponseTime(async () => {
        await request(app)
          .post('/api/users/login')
          .send(loginData);
      });

      expect(responseTime).toBeLessThan(500); // Should complete within 500ms
      global.consoleSuccess(`✓ Login performance test passed (${responseTime}ms)`);
    });
  });

  describe('Security Tests', () => {
    test('should sanitize user input', async () => {
      const userData = {
        username: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      // Should either reject or sanitize the input
      if (response.status === 400) {
        global.expectError(response, 400);
        global.consoleSuccess('✓ XSS input rejection test passed');
      } else {
        global.expectSuccess(response, 201);
        expect(response.body.data.user.username).not.toContain('<script>');
        global.consoleSuccess('✓ XSS input sanitization test passed');
      }
    });

    test('should handle SQL injection attempts', async () => {
      const userData = {
        username: "'; DROP TABLE users; --",
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      // Should either reject or safely handle the input
      if (response.status === 400) {
        global.expectError(response, 400);
        global.consoleSuccess('✓ SQL injection rejection test passed');
      } else {
        global.expectSuccess(response, 201);
        global.consoleSuccess('✓ SQL injection safe handling test passed');
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long usernames', async () => {
      const userData = {
        username: 'a'.repeat(100), // Very long username
        email: global.generateRandomEmail(),
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      // Should handle gracefully
      if (response.status === 400) {
        global.expectError(response, 400);
        global.consoleSuccess('✓ Long username validation test passed');
      } else {
        global.expectSuccess(response, 201);
        global.consoleSuccess('✓ Long username handling test passed');
      }
    });

    test('should handle special characters in email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test+tag@example.com', // Email with special characters
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      if (response.status === 201) {
        global.expectSuccess(response, 201);
        global.consoleSuccess('✓ Special characters in email test passed');
      } else {
        global.expectError(response, 400);
        global.consoleSuccess('✓ Special characters validation test passed');
      }
    });
  });
});
