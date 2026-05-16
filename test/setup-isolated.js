#!/usr/bin/env node

/**
 * NEXUS Isolated Test Setup
 * Completely isolated testing environment without application startup
 */

// Set test environment before anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '3001';

// Disable external services
process.env.DISABLE_EXTERNAL_SERVICES = 'true';
process.env.USE_MOCK_DB = 'true';

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Global test setup
beforeAll(async () => {
  // Mock external dependencies - only mock modules that exist
  try {
    jest.mock('nodemailer', () => ({
      createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
      })
    }));
  } catch (e) {
    // nodemailer not installed, skip mocking
  }
  
  try {
    jest.mock('twilio', () => ({
      Twilio: jest.fn().mockReturnValue({
        messages: {
          create: jest.fn().mockResolvedValue({ sid: 'test-sms-sid' })
        }
      })
    }));
  } catch (e) {
    // twilio not installed, skip mocking
  }
  
  try {
    jest.mock('firebase-admin', () => ({
      messaging: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue('test-message-id')
      })
    }));
  } catch (e) {
    // firebase-admin not installed, skip mocking
  }
  
  jest.mock('mongoose', () => ({
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    connection: {
      readyState: 1,
      collections: {}
    },
    Schema: jest.fn(),
    model: jest.fn()
  }));
});

// Global test teardown
afterAll(async () => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks();
});

// Test utilities
global.createMockUser = (userData = {}) => {
  return {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'user',
    generateAuthToken: jest.fn().mockReturnValue('test-jwt-token'),
    save: jest.fn().mockResolvedValue(),
    ...userData
  };
};

global.createMockTicket = (ticketData = {}) => {
  return {
    _id: '507f1f77bcf86cd799439012',
    title: 'Test Ticket',
    description: 'This is a test ticket',
    priority: 'medium',
    status: 'open',
    category: 'general',
    save: jest.fn().mockResolvedValue(),
    ...ticketData
  };
};

global.createMockRequest = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    user: null,
    headers: {},
    ...overrides
  };
};

global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  };
  return res;
};

global.createMockNext = () => jest.fn();

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
  expect(response.status).toHaveBeenCalledWith(statusCode);
  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      data: expect.any(Object)
    })
  );
};

global.expectError = (response, statusCode = 400) => {
  expect(response.status).toHaveBeenCalledWith(statusCode);
  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      error: expect.any(Object)
    })
  );
};

global.expectValidationError = (response, field) => {
  global.expectError(response, 400);
  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({
      error: expect.objectContaining({
        message: expect.stringContaining(field)
      })
    })
  );
};

// Performance test helpers
global.measureResponseTime = async (fn) => {
  const start = Date.now();
  await fn();
  return Date.now() - start;
};

// Test logging helpers
global.testLog = (message) => {
  originalConsole.log(`🧪 [TEST] ${message}`);
};

global.testSuccess = (message) => {
  originalConsole.log(`✅ [TEST] ${message}`);
};

global.testError = (message) => {
  originalConsole.error(`❌ [TEST] ${message}`);
};

global.testWarn = (message) => {
  originalConsole.warn(`⚠️ [TEST] ${message}`);
};

// Mock JWT functions
global.generateTestToken = (payload = {}) => {
  return 'test-jwt-token-' + JSON.stringify(payload);
};

global.verifyTestToken = (token) => {
  if (token.startsWith('test-jwt-token-')) {
    return JSON.parse(token.replace('test-jwt-token-', ''));
  }
  throw new Error('Invalid token');
};

// Mock bcrypt functions
global.hashPassword = (password) => {
  return 'hashed-' + password;
};

global.comparePassword = (password, hash) => {
  return hash === 'hashed-' + password;
};

// Export for use in other test files
module.exports = {
  createMockUser,
  createMockTicket,
  createMockRequest,
  createMockResponse,
  createMockNext
};
