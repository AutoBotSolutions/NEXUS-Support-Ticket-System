
/**
 * Test Utilities
 * Common helper functions for testing
 */

const request = require('supertest');
const app = require('../../server');

/**
 * Create a test request with authentication
 */
const createAuthenticatedRequest = (token) => {
  return request(app).set('Authorization', `Bearer ${token}`);
};

/**
 * Create test user and get auth token
 */
const createTestUserWithToken = async (userData = {}) => {
  const User = require('../../models/User');
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    ...userData
  };
  
  const user = await User.create(defaultUser);
  const token = user.generateAuthToken();
  
  return { user, token };
};

/**
 * Generate random test data
 */
const generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2);
};

const generateRandomEmail = () => {
  return `${generateRandomString()}@example.com`;
};

const generateRandomTicketData = () => {
  return {
    title: `Test Ticket ${generateRandomString()}`,
    description: `Test description ${generateRandomString()}`,
    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    status: 'open',
    category: 'general'
  };
};

/**
 * Mock external services
 */
const mockGitHubAPI = () => {
  const nock = require('nock');
  
  // Mock GitHub user endpoint
  nock('https://api.github.com')
    .get('/user')
    .reply(200, {
      id: 123456,
      login: 'testuser',
      email: 'test@example.com'
    });
  
  // Mock GitHub repositories endpoint
  nock('https://api.github.com')
    .get('/user/repos')
    .reply(200, [
      {
        id: 789,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        private: false
      }
    ]);
};

const mockEmailService = () => {
  const nodemailer = require('nodemailer');
  
  // Mock nodemailer createTransport
  jest.mock('nodemailer');
  nodemailer.createTransport = jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  });
};

module.exports = {
  createAuthenticatedRequest,
  createTestUserWithToken,
  generateRandomString,
  generateRandomEmail,
  generateRandomTicketData,
  mockGitHubAPI,
  mockEmailService
};
