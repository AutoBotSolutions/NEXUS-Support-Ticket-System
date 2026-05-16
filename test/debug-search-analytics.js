/**
 * Search Analytics Debugging Script
 * Focused debugging for search analytics issues
 */

const {
  enhancedSearchSystem,
  search,
  getUserSearchHistory
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
          { text: 'Investigating the login issue', userId: 'user2', createdAt: new Date('2023-12-01T11:00:00Z') }
        ]
      }
    ]
  }
};

async function debugSearchAnalytics() {
  console.log('🔍 Debugging Search Analytics...\n');
  
  // Setup test data
  console.log('📋 Setting up test data...');
  for (const ticket of TEST_CONFIG.testDocuments.tickets) {
    await enhancedSearchSystem.addDocument('ticket', ticket._id, ticket);
  }
  console.log('✅ Test data setup complete\n');
  
  // Clear search history
  enhancedSearchSystem.searchHistory.clear();
  console.log('🧹 Cleared search history');
  
  // Test search analytics
  console.log('🧪 Testing search analytics...');
  
  try {
    // Record some searches
    console.log('📝 Recording search 1...');
    await search('login', { userId: 'testuser' });
    console.log('✅ Search 1 recorded');
    
    console.log('📝 Recording search 2...');
    await search('authentication', { userId: 'testuser' });
    console.log('✅ Search 2 recorded');
    
    // Check search history
    console.log('📊 Checking search history...');
    const history = getUserSearchHistory('testuser');
    
    console.log(`📋 Search history for 'testuser':`);
    console.log(`   - History exists: ${history !== undefined}`);
    console.log(`   - Is array: ${Array.isArray(history)}`);
    console.log(`   - Length: ${history ? history.length : 'N/A'}`);
    
    if (history && history.length > 0) {
      console.log(`   - First entry: ${JSON.stringify(history[0], null, 2)}`);
    } else {
      console.log(`   - History content: ${JSON.stringify(history, null, 2)}`);
    }
    
    // Check search history map directly
    console.log(`\n🔍 Checking search history map directly...`);
    const historyMap = enhancedSearchSystem.searchHistory;
    console.log(`   - Map size: ${historyMap.size}`);
    console.log(`   - Map keys: ${Array.from(historyMap.keys())}`);
    
    if (historyMap.has('testuser')) {
      const directHistory = historyMap.get('testuser');
      console.log(`   - Direct history: ${JSON.stringify(directHistory, null, 2)}`);
    }
    
    // Test with different user ID
    console.log(`\n🧪 Testing with different user ID...`);
    await search('another query', { userId: 'anotheruser' });
    const anotherHistory = getUserSearchHistory('anotheruser');
    console.log(`   - Another user history length: ${anotherHistory ? anotherHistory.length : 0}`);
    
    // Test with anonymous user
    console.log(`\n🧪 Testing with anonymous user...`);
    await search('anonymous query');
    const anonymousHistory = getUserSearchHistory('anonymous');
    console.log(`   - Anonymous history length: ${anonymousHistory ? anonymousHistory.length : 0}`);
    
  } catch (error) {
    console.error('❌ Error during search analytics test:', error);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n🎯 Search Analytics Debugging Complete');
}

// Run the debugging
if (require.main === module) {
  debugSearchAnalytics().catch(error => {
    console.error('❌ Debugging failed:', error);
    process.exit(1);
  });
}

module.exports = debugSearchAnalytics;
