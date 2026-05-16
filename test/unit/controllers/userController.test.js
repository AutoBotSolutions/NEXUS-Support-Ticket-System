/**
 * User Controller Unit Tests
 */

const request = require('supertest');
const app = require('../../../server');
const User = require('../../../models/User');
const { createTestUserWithToken, generateRandomEmail } = require('../../utils/testUtils');

describe('User Controller', () => {
  describe('POST /api/users/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: generateRandomEmail(),
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    test('should return error for duplicate email', async () => {
      const { user } = await createTestUserWithToken();

      const userData = {
        username: 'differentuser',
        email: user.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Email already exists');
    });

    test('should return error for duplicate username', async () => {
      const { user } = await createTestUserWithToken();

      const userData = {
        username: user.username,
        email: generateRandomEmail(),
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Username already exists');
    });

    test('should return error for invalid email', async () => {
      const userData = {
        username: 'newuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return error for missing required fields', async () => {
      const userData = {
        username: 'newuser'
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return error for weak password', async () => {
      const userData = {
        username: 'newuser',
        email: generateRandomEmail(),
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/login', () => {
    test('should login user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      await createTestUserWithToken(userData);

      const response = await request(app)
        .post('/api/users/login')
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    test('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    test('should return error for missing credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should update last login on successful login', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const user = await createTestUserWithToken(userData);
      const beforeLogin = user.lastLogin;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      await request(app)
        .post('/api/users/login')
        .send(userData)
        .expect(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastLogin.getTime()).toBeGreaterThan(beforeLogin.getTime());
    });
  });

  describe('GET /api/users/profile', () => {
    test('should get user profile successfully', async () => {
      const { token, user } = await createTestUserWithToken();

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(user.username);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.password).toBeUndefined();
    });

    test('should return error for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/profile', () => {
    test('should update user profile successfully', async () => {
      const { token, user } = await createTestUserWithToken();

      const updateData = {
        username: 'updateduser'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(updateData.username);
      expect(response.body.data.email).toBe(user.email); // Should remain unchanged
    });

    test('should not allow updating email', async () => {
      const { token } = await createTestUserWithToken();

      const updateData = {
        email: 'newemail@example.com'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should not allow updating role', async () => {
      const { token } = await createTestUserWithToken();

      const updateData = {
        role: 'admin'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return error for duplicate username', async () => {
      const { token } = await createTestUserWithToken();
      const { user: existingUser } = await createTestUserWithToken({ username: 'existinguser' });

      const updateData = {
        username: existingUser.username
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/logout', () => {
    test('should logout user successfully', async () => {
      const { token } = await createTestUserWithToken();

      const response = await request(app)
        .post('/api/users/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Logged out successfully');
    });

    test('should return error for unauthenticated logout', async () => {
      const response = await request(app)
        .post('/api/users/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users', () => {
    test('should get all users for admin', async () => {
      const { token } = await createTestUserWithToken({ role: 'admin' });
      
      await createTestUserWithToken({ username: 'user1' });
      await createTestUserWithToken({ username: 'user2' });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(3); // admin + 2 users
      expect(response.body.data.users[0].password).toBeUndefined();
    });

    test('should return error for non-admin users', async () => {
      const { token } = await createTestUserWithToken({ role: 'user' });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should support pagination', async () => {
      const { token } = await createTestUserWithToken({ role: 'admin' });
      
      // Create multiple users
      for (let i = 0; i < 15; i++) {
        await createTestUserWithToken({ username: `user${i}` });
      }

      const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(10);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.total).toBeGreaterThan(10);
    });
  });

  describe('PUT /api/users/:id/role', () => {
    test('should update user role for admin', async () => {
      const { token } = await createTestUserWithToken({ role: 'admin' });
      const { user: targetUser } = await createTestUserWithToken({ role: 'user' });

      const response = await request(app)
        .put(`/api/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'agent' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('agent');
    });

    test('should return error for non-admin users', async () => {
      const { token } = await createTestUserWithToken({ role: 'user' });
      const { user: targetUser } = await createTestUserWithToken({ role: 'user' });

      const response = await request(app)
        .put(`/api/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'agent' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should return error for invalid role', async () => {
      const { token } = await createTestUserWithToken({ role: 'admin' });
      const { user: targetUser } = await createTestUserWithToken({ role: 'user' });

      const response = await request(app)
        .put(`/api/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'invalid-role' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user for admin', async () => {
      const { token } = await createTestUserWithToken({ role: 'admin' });
      const { user: targetUser } = await createTestUserWithToken({ role: 'user' });

      const response = await request(app)
        .delete(`/api/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(targetUser._id);
      expect(deletedUser).toBeNull();
    });

    test('should prevent admin from deleting themselves', async () => {
      const { token, user } = await createTestUserWithToken({ role: 'admin' });

      const response = await request(app)
        .delete(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Cannot delete yourself');
    });

    test('should return error for non-admin users', async () => {
      const { token } = await createTestUserWithToken({ role: 'user' });
      const { user: targetUser } = await createTestUserWithToken({ role: 'user' });

      const response = await request(app)
        .delete(`/api/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
