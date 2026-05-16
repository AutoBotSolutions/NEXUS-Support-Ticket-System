
/**
 * Test Helpers
 * Common utility functions for testing
 */

const request = require('supertest');
const app = require('../../server');

class TestHelpers {
  static createMockRequest(overrides = {}) {
    return {
      body: {},
      params: {},
      query: {},
      user: null,
      headers: {},
      ...overrides
    };
  }
  
  static createMockResponse() {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    return res;
  }
  
  static createMockNext() {
    return jest.fn();
  }
  
  static async makeRequest(method, url, data = {}, headers = {}) {
    let req = request(app);
    
    switch (method.toLowerCase()) {
      case 'get':
        req = req.get(url);
        break;
      case 'post':
        req = req.post(url);
        break;
      case 'put':
        req = req.put(url);
        break;
      case 'delete':
        req = req.delete(url);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    if (Object.keys(data).length > 0) {
      req = req.send(data);
    }
    
    if (Object.keys(headers).length > 0) {
      req = req.set(headers);
    }
    
    return req;
  }
  
  static expectSuccess(response, statusCode = 200) {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  }
  
  static expectError(response, statusCode = 400) {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  }
  
  static measureResponseTime(fn) {
    const start = Date.now();
    return fn().then(() => Date.now() - start);
  }
  
  static generateRandomEmail() {
    return `test-${Math.random().toString(36).substring(7)}@example.com`;
  }
  
  static generateRandomUsername() {
    return `testuser-${Math.random().toString(36).substring(7)}`;
  }
  
  static generateRandomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  }
}

module.exports = TestHelpers;
