/**
 * User Model Unit Tests
 */

const User = require('../../../models/User');
const { createTestUser, generateRandomEmail } = require('../utils/testUtils');

describe('User Model', () => {
  describe('User Creation', () => {
    test('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: generateRandomEmail(),
        password: 'password123',
        role: 'user'
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    test('should require username', async () => {
      const userData = {
        email: generateRandomEmail(),
        password: 'password123',
        role: 'user'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should require email', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        role: 'user'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should require password', async () => {
      const userData = {
        username: 'testuser',
        email: generateRandomEmail(),
        role: 'user'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
        role: 'user'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should validate role', async () => {
      const userData = {
        username: 'testuser',
        email: generateRandomEmail(),
        password: 'password123',
        role: 'invalid-role'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const userData = {
        username: 'testuser',
        email: generateRandomEmail(),
        password: 'password123',
        role: 'user'
      };

      const user = await User.create(userData);

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50); // Bcrypt hash length
    });

    test('should compare passwords correctly', async () => {
      const userData = {
        username: 'testuser',
        email: generateRandomEmail(),
        password: 'password123',
        role: 'user'
      };

      const user = await User.create(userData);

      const isValid = await user.comparePassword('password123');
      expect(isValid).toBe(true);

      const isInvalid = await user.comparePassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });
  });

  describe('Authentication', () => {
    test('should generate auth token', async () => {
      const user = await createTestUser();

      const token = user.generateAuthToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });

    test('should find user by token', async () => {
      const user = await createTestUser();
      const token = user.generateAuthToken();

      const foundUser = await User.findByToken(token);

      expect(foundUser).toBeDefined();
      expect(foundUser._id.toString()).toBe(user._id.toString());
    });

    test('should return null for invalid token', async () => {
      const foundUser = await User.findByToken('invalid-token');

      expect(foundUser).toBeNull();
    });

    test('should find user by credentials', async () => {
      const userData = {
        username: 'testuser',
        email: generateRandomEmail(),
        password: 'password123',
        role: 'user'
      };

      const user = await User.create(userData);

      const foundUser = await User.findByCredentials(userData.email, userData.password);

      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(userData.email);
    });

    test('should return null for invalid credentials', async () => {
      const foundUser = await User.findByCredentials('nonexistent@example.com', 'password');

      expect(foundUser).toBeNull();
    });
  });

  describe('User Methods', () => {
    test('should return user profile without sensitive data', async () => {
      const user = await createTestUser();

      const profile = user.getPublicProfile();

      expect(profile).toBeDefined();
      expect(profile.username).toBe(user.username);
      expect(profile.email).toBe(user.email);
      expect(profile.role).toBe(user.role);
      expect(profile.password).toBeUndefined(); // Should not include password
      expect(profile.tokens).toBeUndefined(); // Should not include tokens
    });

    test('should update last login timestamp', async () => {
      const user = await createTestUser();

      const beforeLogin = user.lastLogin;
      
      await user.updateLastLogin();
      await user.save();

      expect(user.lastLogin).toBeDefined();
      expect(user.lastLogin.getTime()).toBeGreaterThan(beforeLogin?.getTime() || 0);
    });
  });

  describe('User Validation', () => {
    test('should prevent duplicate emails', async () => {
      const email = generateRandomEmail();
      
      await User.create({
        username: 'user1',
        email: email,
        password: 'password123',
        role: 'user'
      });

      await expect(User.create({
        username: 'user2',
        email: email,
        password: 'password123',
        role: 'user'
      })).rejects.toThrow();
    });

    test('should prevent duplicate usernames', async () => {
      await User.create({
        username: 'testuser',
        email: generateRandomEmail(),
        password: 'password123',
        role: 'user'
      });

      await expect(User.create({
        username: 'testuser',
        email: generateRandomEmail(),
        password: 'password123',
        role: 'user'
      })).rejects.toThrow();
    });
  });

  describe('User Queries', () => {
    test('should find users by role', async () => {
      await createTestUser({ role: 'user' });
      await createTestUser({ role: 'agent' });
      await createTestUser({ role: 'admin' });

      const agents = await User.find({ role: 'agent' });
      const admins = await User.find({ role: 'admin' });
      const users = await User.find({ role: 'user' });

      expect(agents).toHaveLength(1);
      expect(admins).toHaveLength(1);
      expect(users).toHaveLength(1);
    });

    test('should sort users by creation date', async () => {
      const user1 = await createTestUser({ username: 'user1' });
      const user2 = await createTestUser({ username: 'user2' });

      const users = await User.find().sort({ createdAt: -1 });

      expect(users[0].createdAt.getTime()).toBeGreaterThan(users[1].createdAt.getTime());
    });
  });
});
