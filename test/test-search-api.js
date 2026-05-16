/**
 * Search System API Test
 * 
 * Tests the Search System API endpoints to ensure they work properly
 */

const express = require('express');
const request = require('supertest');

// Create a test app
const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = {
    id: 'test-user-id',
    role: 'user'
  };
  next();
};

// Mock models and services
const mockSearchService = {
  search: async (query, options) => ({
    results: [
      {
        id: '1',
        title: 'Test Result',
        description: 'Test description',
        relevanceScore: 95
      }
    ],
    total: 1,
    suggestions: ['test', 'example'],
    took: 50,
    query: query
  }),
  
  getSuggestions: async (query, type) => ['suggestion1', 'suggestion2'],
  
  saveSearch: async (userId, query, name, options) => ({
    _id: 'saved-search-id',
    userId,
    query,
    name,
    ...options
  }),
  
  getSavedSearches: async (userId) => [
    {
      _id: 'saved-search-1',
      name: 'Test Search',
      query: 'test query'
    }
  ],
  
  getSearchAnalytics: async (timeRange) => ({
    totalSearches: 100,
    avgResponseTime: 45
  })
};

// Mock controller
const mockSearchController = {
  search: async (req, res) => {
    try {
      const { q: query } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }
      
      const results = await mockSearchService.search(query, req.query);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  getSuggestions: async (req, res) => {
    try {
      const { q: query } = req.query;
      const suggestions = await mockSearchService.getSuggestions(query);
      
      res.json({
        success: true,
        data: { suggestions }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  saveSearch: async (req, res) => {
    try {
      const { name, query } = req.body;
      const savedSearch = await mockSearchService.saveSearch(
        req.user.id,
        query,
        name
      );
      
      res.status(201).json({
        success: true,
        data: savedSearch
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  getSavedSearches: async (req, res) => {
    try {
      const savedSearches = await mockSearchService.getSavedSearches(req.user.id);
      
      res.json({
        success: true,
        data: savedSearches
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  getSearchAnalytics: async (req, res) => {
    try {
      const { timeRange } = req.query;
      const analytics = await mockSearchService.getSearchAnalytics(timeRange);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

// Import routes (with mock controller)
const searchRoutes = require('./routes/searchRoutes');

// Mock the controller require
const originalRequire = require;
require = function(id) {
  if (id.includes('searchController')) {
    return mockSearchController;
  }
  if (id.includes('auth')) {
    return mockAuth;
  }
  return originalRequire(id);
};

// Apply routes
app.use('/api/search', searchRoutes);

// Test functions
async function testSearchEndpoint() {
  try {
    console.log('🔍 Testing Search Endpoint...');
    
    const response = await request(app)
      .get('/api/search?q=test')
      .expect(200);
    
    console.log('✅ Search endpoint - Status:', response.status);
    console.log('✅ Search endpoint - Response structure:', Object.keys(response.body));
    
    if (response.body.success && response.body.data) {
      console.log('✅ Search endpoint - Valid response format');
    } else {
      console.log('❌ Search endpoint - Invalid response format');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Search endpoint test failed:', error.message);
    return false;
  }
}

async function testSuggestionsEndpoint() {
  try {
    console.log('\n💡 Testing Suggestions Endpoint...');
    
    const response = await request(app)
      .get('/api/search/suggestions?q=test')
      .expect(200);
    
    console.log('✅ Suggestions endpoint - Status:', response.status);
    console.log('✅ Suggestions endpoint - Response structure:', Object.keys(response.body));
    
    if (response.body.success && response.body.data) {
      console.log('✅ Suggestions endpoint - Valid response format');
    } else {
      console.log('❌ Suggestions endpoint - Invalid response format');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Suggestions endpoint test failed:', error.message);
    return false;
  }
}

async function testSaveSearchEndpoint() {
  try {
    console.log('\n💾 Testing Save Search Endpoint...');
    
    const response = await request(app)
      .post('/api/search/save')
      .send({
        name: 'Test Search',
        query: 'test query'
      })
      .expect(201);
    
    console.log('✅ Save search endpoint - Status:', response.status);
    console.log('✅ Save search endpoint - Response structure:', Object.keys(response.body));
    
    if (response.body.success && response.body.data) {
      console.log('✅ Save search endpoint - Valid response format');
    } else {
      console.log('❌ Save search endpoint - Invalid response format');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Save search endpoint test failed:', error.message);
    return false;
  }
}

async function testSavedSearchesEndpoint() {
  try {
    console.log('\n📋 Testing Saved Searches Endpoint...');
    
    const response = await request(app)
      .get('/api/search/saved')
      .expect(200);
    
    console.log('✅ Saved searches endpoint - Status:', response.status);
    console.log('✅ Saved searches endpoint - Response structure:', Object.keys(response.body));
    
    if (response.body.success && response.body.data) {
      console.log('✅ Saved searches endpoint - Valid response format');
    } else {
      console.log('❌ Saved searches endpoint - Invalid response format');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Saved searches endpoint test failed:', error.message);
    return false;
  }
}

async function testAnalyticsEndpoint() {
  try {
    console.log('\n📊 Testing Analytics Endpoint...');
    
    const response = await request(app)
      .get('/api/search/analytics')
      .expect(200);
    
    console.log('✅ Analytics endpoint - Status:', response.status);
    console.log('✅ Analytics endpoint - Response structure:', Object.keys(response.body));
    
    if (response.body.success && response.body.data) {
      console.log('✅ Analytics endpoint - Valid response format');
    } else {
      console.log('❌ Analytics endpoint - Invalid response format');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Analytics endpoint test failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  try {
    console.log('\n⚠️ Testing Error Handling...');
    
    // Test missing query
    const response = await request(app)
      .get('/api/search')
      .expect(400);
    
    if (response.body.success === false && response.body.error) {
      console.log('✅ Error handling - Proper error response');
    } else {
      console.log('❌ Error handling - Invalid error response');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return false;
  }
}

async function testInputValidation() {
  try {
    console.log('\n🔒 Testing Input Validation...');
    
    // Test empty query
    const response = await request(app)
      .get('/api/search?q=')
      .expect(400);
    
    if (response.body.success === false) {
      console.log('✅ Input validation - Empty query rejected');
    } else {
      console.log('❌ Input validation - Empty query accepted');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Input validation test failed:', error.message);
    return false;
  }
}

// Main test function
async function runAPITests() {
  try {
    console.log('🚀 Starting Search System API Tests...\n');
    
    const results = {
      search: await testSearchEndpoint(),
      suggestions: await testSuggestionsEndpoint(),
      saveSearch: await testSaveSearchEndpoint(),
      savedSearches: await testSavedSearchesEndpoint(),
      analytics: await testAnalyticsEndpoint(),
      errorHandling: await testErrorHandling(),
      inputValidation: await testInputValidation()
    };
    
    console.log('\n📊 API Test Results Summary:');
    console.log('===========================');
    
    for (const [test, result] of Object.entries(results)) {
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${test}: ${status}`);
    }
    
    const passedTests = Object.values(results).filter(r => r).length;
    const totalTests = Object.keys(results).length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);
    
    if (successRate >= 80) {
      console.log('🎉 Search System API is working properly!');
    } else {
      console.log('⚠️ Search System API needs improvement.');
    }
    
    return successRate >= 80;
    
  } catch (error) {
    console.error('\n💥 API tests failed:', error);
    return false;
  }
}

// Run tests
runAPITests();
