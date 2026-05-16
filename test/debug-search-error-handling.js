/**
 * Search System Error Handling Debugging Script
 * Focused debugging for error handling issues
 */

const {
  enhancedSearchSystem,
  search,
  advancedSearch,
  getSearchSuggestions,
  getPopularQueries,
  getUserSearchHistory,
  addDocument,
  updateDocument,
  removeDocument,
  rebuildIndex,
  getSearchStats,
  clearCache,
  getCacheStats,
  setCacheTimeouts
} = require('../middleware/searchSystemEnhanced');

// Test configuration
const TEST_CONFIG = {
  testDocuments: {
    tickets: [
      {
        _id: 'ticket1',
        title: 'Login Authentication Issue',
        description: 'User cannot login to the system due to authentication failure',
        status: 'open',
        priority: 'high',
        category: 'authentication',
        tags: ['login', 'auth', 'problem'],
        createdBy: 'user1',
        assignedTo: 'user2',
        createdAt: new Date('2023-12-01T10:00:00Z'),
        comments: [
          { text: 'Investigating the login issue', userId: 'user2', createdAt: new Date('2023-12-01T11:00:00Z') },
          { text: 'Found the root cause', userId: 'user1', createdAt: new Date('2023-12-01T12:00:00Z') }
        ]
      }
    ],
    users: [
      {
        _id: 'user1',
        username: 'johndoe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        bio: 'Senior Software Developer with 10 years of experience',
        location: 'New York, USA',
        timezone: 'America/New_York',
        phone: '+1234567890',
        teams: [
          { teamId: 'team1', role: 'owner', joinedAt: new Date('2023-01-01') }
        ],
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: { email: true, push: true }
        },
        activity: {
          lastActivity: new Date('2023-12-03T16:00:00Z'),
          totalLogins: 150,
          totalTicketsCreated: 25,
          totalTicketsResolved: 30
        },
        createdAt: new Date('2023-01-01T00:00:00Z')
      }
    ]
  }
};

// Test runner
class SearchErrorHandlingDebugger {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.startTime = Date.now();
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    try {
      console.log(`\n🧪 Running: ${testName}`);
      await testFunction();
      this.testResults.passed++;
      console.log(`✅ PASSED: ${testName}`);
      this.testResults.details.push({ test: testName, status: 'PASSED', error: null });
    } catch (error) {
      this.testResults.failed++;
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
      this.testResults.details.push({ test: testName, status: 'FAILED', error: error.message });
    }
  }

  async setupTestData() {
    console.log('📋 Setting up test data...');
    
    // Add test documents to search index
    for (const ticket of TEST_CONFIG.testDocuments.tickets) {
      await addDocument('ticket', ticket._id, ticket);
    }
    
    for (const user of TEST_CONFIG.testDocuments.users) {
      await addDocument('user', user._id, user);
    }
    
    console.log('✅ Test data setup complete');
  }

  // Detailed error handling tests
  async testEmptyQueryHandling() {
    console.log('   Testing empty query...');
    const emptyResults = await search('');
    
    console.log(`   Empty query results: ${JSON.stringify(emptyResults)}`);
    expect(emptyResults.results !== null, 'Results should not be null');
    expect(emptyResults.results.length === 0, 'Empty query should return no results');
    expect(emptyResults.total === 0, 'Total should be 0');
  }

  async testNullQueryHandling() {
    console.log('   Testing null query...');
    const nullResults = await search(null);
    
    console.log(`   Null query results: ${JSON.stringify(nullResults)}`);
    expect(nullResults.results !== null, 'Results should not be null');
    expect(nullResults.results.length === 0, 'Null query should return no results');
    expect(nullResults.total === 0, 'Total should be 0');
  }

  async testUndefinedQueryHandling() {
    console.log('   Testing undefined query...');
    const undefinedResults = await search(undefined);
    
    console.log(`   Undefined query results: ${JSON.stringify(undefinedResults)}`);
    expect(undefinedResults.results !== null, 'Results should not be null');
    expect(undefinedResults.results.length === 0, 'Undefined query should return no results');
    expect(undefinedResults.total === 0, 'Total should be 0');
  }

  async testInvalidTypeFilter() {
    console.log('   Testing invalid type filter...');
    const invalidTypeResults = await search('login', { type: 'invalid_type' });
    
    console.log(`   Invalid type results: ${JSON.stringify(invalidTypeResults)}`);
    expect(invalidTypeResults.results !== null, 'Results should not be null');
    expect(invalidTypeResults.results.length === 0, 'Invalid type should return no results');
    expect(invalidTypeResults.total === 0, 'Total should be 0');
  }

  async testInvalidFilters() {
    console.log('   Testing invalid filters...');
    const invalidFilterResults = await search('login', { filters: { invalidField: 'value' } });
    
    console.log(`   Invalid filter results: ${JSON.stringify(invalidFilterResults)}`);
    expect(invalidFilterResults.results !== null, 'Results should not be null');
    expect(invalidFilterResults.results.length === 0, 'Invalid filter should return no results');
    expect(invalidFilterResults.total === 0, 'Total should be 0');
  }

  async testNonExistentQuery() {
    console.log('   Testing non-existent query...');
    const nonExistentResults = await search('nonexistentquery12345');
    
    console.log(`   Non-existent query results: ${JSON.stringify(nonExistentResults)}`);
    expect(nonExistentResults.results !== null, 'Results should not be null');
    expect(nonExistentResults.results.length === 0, 'Non-existent query should return no results');
    expect(nonExistentResults.total === 0, 'Total should be 0');
  }

  async testSpecialCharacterQuery() {
    console.log('   Testing special character query...');
    const specialCharResults = await search('!@#$%^&*()');
    
    console.log(`   Special character results: ${JSON.stringify(specialCharResults)}`);
    expect(specialCharResults.results !== null, 'Results should not be null');
    expect(specialCharResults.results.length === 0, 'Special character query should return no results');
    expect(specialCharResults.total === 0, 'Total should be 0');
  }

  async testLongQuery() {
    console.log('   Testing very long query...');
    const longQuery = 'a'.repeat(1000);
    const longQueryResults = await search(longQuery);
    
    console.log(`   Long query results: ${JSON.stringify(longQueryResults)}`);
    expect(longQueryResults.results !== null, 'Results should not be null');
    expect(longQueryResults.results.length === 0, 'Long query should return no results');
    expect(longQueryResults.total === 0, 'Total should be 0');
  }

  async testMalformedOptions() {
    console.log('   Testing malformed options...');
    const malformedOptionsResults = await search('login', { 
      limit: 'not_a_number',
      offset: 'not_a_number',
      sortBy: 12345
    });
    
    console.log(`   Malformed options results: ${JSON.stringify(malformedOptionsResults)}`);
    expect(malformedOptionsResults.results !== null, 'Results should not be null');
  }

  async testCacheWithInvalidData() {
    console.log('   Testing cache with invalid data...');
    
    // Try to access cache with invalid key
    const invalidCacheKey = 'invalid:cache:key';
    const cacheResult = enhancedSearchSystem.searchCache.get(invalidCacheKey);
    
    console.log(`   Invalid cache result: ${cacheResult}`);
    expect(cacheResult === undefined, 'Invalid cache key should return undefined');
    
    // Test cache stats
    const stats = getCacheStats();
    console.log(`   Cache stats: ${JSON.stringify(stats)}`);
    expect(stats !== null, 'Cache stats should not be null');
    expect(stats.searchCacheSize !== undefined, 'Search cache size should be defined');
    expect(stats.facetCacheSize !== undefined, 'Facet cache size should be defined');
  }

  async testSearchHistoryWithInvalidUser() {
    console.log('   Testing search history with invalid user...');
    
    const invalidUserHistory = getUserSearchHistory('nonexistent_user');
    console.log(`   Invalid user history: ${JSON.stringify(invalidUserHistory)}`);
    expect(invalidUserHistory !== null, 'History should not be null');
    expect(Array.isArray(invalidUserHistory), 'History should be an array');
    expect(invalidUserHistory.length === 0, 'Invalid user history should be empty');
  }

  async testSuggestionsWithInvalidQuery() {
    console.log('   Testing suggestions with invalid query...');
    
    const invalidSuggestions = await getSearchSuggestions('');
    console.log(`   Invalid suggestions: ${JSON.stringify(invalidSuggestions)}`);
    expect(invalidSuggestions !== null, 'Suggestions should not be null');
    expect(Array.isArray(invalidSuggestions), 'Suggestions should be an array');
    expect(invalidSuggestions.length === 0, 'Invalid suggestions should be empty');
  }

  async testPopularQueriesWithNoData() {
    console.log('   Testing popular queries with no data...');
    
    // Clear analytics to simulate no data
    enhancedSearchSystem.searchAnalytics.clear();
    
    const noDataQueries = await getPopularQueries();
    console.log(`   No data queries: ${JSON.stringify(noDataQueries)}`);
    expect(noDataQueries !== null, 'Popular queries should not be null');
    expect(Array.isArray(noDataQueries), 'Popular queries should be an array');
    expect(noDataQueries.length === 0, 'No data queries should be empty');
  }

  async testDocumentManagementWithInvalidData() {
    console.log('   Testing document management with invalid data...');
    
    try {
      // Try to add document with invalid type
      await addDocument(null, 'invalid_id', null);
      console.log('   ⚠️  Invalid document addition did not throw error');
    } catch (error) {
      console.log(`   ✅ Invalid document addition threw error: ${error.message}`);
    }
    
    try {
      // Try to update non-existent document
      await updateDocument('invalid_type', 'invalid_id', {});
      console.log('   ⚠️  Invalid document update did not throw error');
    } catch (error) {
      console.log(`   ✅ Invalid document update threw error: ${error.message}`);
    }
    
    try {
      // Try to remove non-existent document
      await removeDocument('invalid_type', 'invalid_id');
      console.log('   ⚠️  Invalid document removal did not throw error');
    } catch (error) {
      console.log(`   ✅ Invalid document removal threw error: ${error.message}`);
    }
  }

  async testSearchStatsWithEmptyIndex() {
    console.log('   Testing search stats with empty index...');
    
    // Clear index
    enhancedSearchSystem.index.clear();
    
    const emptyStats = getSearchStats();
    console.log(`   Empty index stats: ${JSON.stringify(emptyStats)}`);
    expect(emptyStats !== null, 'Stats should not be null');
    expect(emptyStats.totalDocuments === 0, 'Total documents should be 0');
    expect(emptyStats.documentsByType !== undefined, 'Documents by type should be defined');
  }

  async runAllTests() {
    console.log('🚀 Starting Search System Error Handling Debugging...\n');
    
    try {
      // Setup test data
      await this.setupTestData();
      
      // Run error handling tests
      await this.runTest('Empty Query Handling', () => this.testEmptyQueryHandling());
      await this.runTest('Null Query Handling', () => this.testNullQueryHandling());
      await this.runTest('Undefined Query Handling', () => this.testUndefinedQueryHandling());
      await this.runTest('Invalid Type Filter', () => this.testInvalidTypeFilter());
      await this.runTest('Invalid Filters', () => this.testInvalidFilters());
      await this.runTest('Non-existent Query', () => this.testNonExistentQuery());
      await this.runTest('Special Character Query', () => this.testSpecialCharacterQuery());
      await this.runTest('Long Query', () => this.testLongQuery());
      await this.runTest('Malformed Options', () => this.testMalformedOptions());
      await this.runTest('Cache with Invalid Data', () => this.testCacheWithInvalidData());
      await this.runTest('Search History with Invalid User', () => this.testSearchHistoryWithInvalidUser());
      await this.runTest('Suggestions with Invalid Query', () => this.testSuggestionsWithInvalidQuery());
      await this.runTest('Popular Queries with No Data', () => this.testPopularQueriesWithNoData());
      await this.runTest('Document Management with Invalid Data', () => this.testDocumentManagementWithInvalidData());
      await this.runTest('Search Stats with Empty Index', () => this.testSearchStatsWithEmptyIndex());
      
    } catch (error) {
      console.error('❌ Test setup failed:', error);
    }
    
    // Print results
    this.printResults();
  }

  printResults() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEARCH SYSTEM ERROR HANDLING DEBUGGING RESULTS');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Duration: ${duration}ms`);
    console.log(`📋 Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.details
        .filter(detail => detail.status === 'FAILED')
        .forEach(detail => {
          console.log(`   - ${detail.test}: ${detail.error}`);
        });
    }
    
    console.log('\n🎯 Final Status:');
    if (this.testResults.failed === 0) {
      console.log('🎉 ALL ERROR HANDLING TESTS PASSED!');
    } else {
      console.log('⚠️  Some error handling tests failed - Please review the failed tests above.');
    }
    
    console.log('='.repeat(60));
  }
}

// Helper function for assertions
function expect(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Run the debugging
if (require.main === module) {
  const errorDebugger = new SearchErrorHandlingDebugger();
  errorDebugger.runAllTests().catch(error => {
    console.error('❌ Debugging failed:', error);
    process.exit(1);
  });
}

module.exports = SearchErrorHandlingDebugger;
