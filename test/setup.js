
// Test setup file
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../server');

let mongoServer;

// Global test setup
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to test database
  await mongoose.connect(mongoUri);
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.MONGODB_URI = mongoUri;
});

// Global test teardown
afterAll(async () => {
  // Disconnect from database
  await mongoose.disconnect();
  
  // Stop MongoDB server
  await mongoServer.stop();
});

// Global test cleanup
afterEach(async () => {
  // Clean up database after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test utilities
global.createTestUser = async (userData = {}) => {
  const User = require('../models/User');
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    ...userData
  };
  
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
  
  return await Ticket.create(defaultTicket);
};

global.getAuthToken = async (userData) => {
  const user = await global.createTestUser(userData);
  const token = user.generateAuthToken();
  return token;
};
