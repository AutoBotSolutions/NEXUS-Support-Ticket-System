#!/usr/bin/env node

/**
 * NEXUS Enhanced Testing Framework Setup
 * Comprehensive testing environment with proper mocking and configuration
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');

let mongoServer;

// Enhanced test setup with fallback
const setupTestEnvironment = async () => {
  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.PORT = '3001'; // Different port for testing
    
    // Disable external services for testing
    process.env.DISABLE_EXTERNAL_SERVICES = 'true';
    process.env.SMTP_HOST = 'localhost';
    process.env.SMTP_PORT = '1025'; // Use maildev port
    process.env.TWILIO_ACCOUNT_SID = 'test-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-token';
    process.env.FCM_SERVER_KEY = 'test-fcm-key';
    
    console.log('🧪 Test environment configured');
  } catch (error) {
    console.error('❌ Failed to configure test environment:', error);
  }
};

// Database setup with fallback
const setupDatabase = async () => {
  try {
    // Try to start MongoDB Memory Server first
    mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27018, // Use different port
        dbName: 'nexus_test'
      }
    });
    
    const mongoUri = mongoServer.getUri();
    console.log('🗄️ MongoDB Memory Server started');
    
    // Connect to test database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    
    console.log('🔗 Connected to test database');
    return true;
  } catch (error) {
    console.warn('⚠️ MongoDB Memory Server failed, using mock database');
    
    // Fallback to mock database
    process.env.USE_MOCK_DB = 'true';
    return false;
  }
};

// Global test setup
beforeAll(async () => {
  console.log('🚀 Starting test suite setup...');
  
  // Setup test environment
  await setupTestEnvironment();
  
  // Setup database
  const dbConnected = await setupDatabase();
  
  if (!dbConnected) {
    console.log('📦 Using mock database for testing');
  }
  
  // Wait for app to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✅ Test setup completed');
});

// Global test teardown
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Disconnect from database
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    // Stop MongoDB server if it was started
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
});

// Global test cleanup
afterEach(async () => {
  try {
    // Clean up database after each test
    if (mongoose.connection.readyState === 1 && !process.env.USE_MOCK_DB) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    console.warn('⚠️ Error cleaning up test data:', error.message);
  }
});

// Enhanced test utilities
global.createTestUser = async (userData = {}) => {
  const User = require('../models/User');
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    ...userData
  };
  
  if (process.env.USE_MOCK_DB) {
    // Return mock user
    return {
      _id: '507f1f77bcf86cd799439011',
      ...defaultUser,
      generateAuthToken: () => 'test-jwt-token',
      save: () => Promise.resolve()
    };
  }
  
  return await User.create(defaultUser);
};

global.createTestTicket = async (ticketData = {}) => {
  const Ticket = require('../models/Ticket');
  const defaultTicket = {
    title: 'Test Ticket',
    description: 'This is a test ticket',
    priority: 'medium',
    status: 'open',
    category: 'general',
    ...ticketData
  };
  
  if (process.env.USE_MOCK_DB) {
    // Return mock ticket
    return {
      _id: '507f1f77bcf86cd799439012',
      ...defaultTicket,
      save: () => Promise.resolve()
    };
  }
  
  return await Ticket.create(defaultTicket);
};

global.getAuthToken = async (userData) => {
  const user = await global.createTestUser(userData);
  return user.generateAuthToken();
};

global.createTestUserWithToken = async (userData = {}) => {
  const user = await global.createTestUser(userData);
  const token = user.generateAuthToken();
  return { user, token };
};

// Mock external services
global.mockExternalServices = () => {
  // Mock nodemailer
  jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    })
  }));
  
  // Mock Twilio
  jest.mock('twilio', () => ({
    Twilio: jest.fn().mockReturnValue({
      messages: {
        create: jest.fn().mockResolvedValue({ sid: 'test-sms-sid' })
      }
    })
  }));
  
  // Mock FCM
  jest.mock('firebase-admin', () => ({
    messaging: jest.fn().mockReturnValue({
      send: jest.fn().mockResolvedValue('test-message-id')
    })
  }));
  
  console.log('🔧 External services mocked');
};

// Test data generators
global.generateRandomEmail = () => {
  return `test-${Math.random().toString(36).substring(7)}@example.com`;
};

global.generateRandomUsername = () => {
  return `testuser-${Math.random().toString(36).substring(7)}`;
};

global.generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2);
};

// Test helpers
global.expectSuccess = (response, statusCode = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
};

global.expectError = (response, statusCode = 400) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toBeDefined();
};

// Performance test helpers
global.measureResponseTime = async (fn) => {
  const start = Date.now();
  await fn();
  return Date.now() - start;
};

// Console test helpers
global.consoleLog = (message) => {
  console.log(`🧪 [TEST] ${message}`);
};

global.consoleError = (message) => {
  console.error(`❌ [TEST] ${message}`);
};

global.consoleSuccess = (message) => {
  console.log(`✅ [TEST] ${message}`);
};

// Export for use in other test files
module.exports = {
  setupTestEnvironment,
  setupDatabase,
  mockExternalServices
};
