/**
 * Search Models Test Script
 * 
 * Tests the Search System models to ensure they work properly
 */

const mongoose = require('mongoose');

// Test database connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Test SearchIndex model
async function testSearchIndexModel() {
  try {
    console.log('\n🔍 Testing SearchIndex Model...');
    
    const SearchIndex = require('./models/SearchIndex');
    
    // Create a test index entry
    const testIndex = new SearchIndex({
      contentId: new mongoose.Types.ObjectId(),
      contentType: 'Ticket',
      title: 'Test Ticket',
      description: 'Test Description',
      content: 'Test content for search indexing',
      metadata: {
        status: 'open',
        priority: 'high',
        category: 'bug',
        tags: ['test', 'search']
      },
      contentCreatedAt: new Date(),
      contentUpdatedAt: new Date()
    });
    
    // Save the index
    const savedIndex = await testIndex.save();
    console.log('✅ SearchIndex model - Save successful');
    
    // Test static methods
    const stats = await SearchIndex.getIndexStats();
    console.log('✅ SearchIndex model - getIndexStats successful');
    
    // Test indexing content
    const contentData = {
      contentId: new mongoose.Types.ObjectId(),
      contentType: 'User',
      title: 'Test User',
      description: 'Test User Description',
      content: 'Test user content',
      metadata: {
        role: 'developer',
        department: 'engineering',
        isActive: true
      },
      contentCreatedAt: new Date(),
      contentUpdatedAt: new Date()
    };
    
    const indexedContent = await SearchIndex.indexContent(contentData);
    console.log('✅ SearchIndex model - indexContent successful');
    
    // Test keyword generation
    const keywords = SearchIndex.generateKeywords(contentData);
    console.log('✅ SearchIndex model - generateKeywords successful');
    
    // Test relevance score calculation
    const relevanceScore = SearchIndex.calculateRelevanceScore(contentData);
    console.log('✅ SearchIndex model - calculateRelevanceScore successful');
    
    // Clean up
    await SearchIndex.deleteMany({});
    console.log('✅ SearchIndex model tests completed');
    
  } catch (error) {
    console.error('❌ SearchIndex model test failed:', error);
    throw error;
  }
}

// Test SavedSearch model
async function testSavedSearchModel() {
  try {
    console.log('\n💾 Testing SavedSearch Model...');
    
    const SavedSearch = require('./models/SavedSearch');
    
    // Create a test saved search
    const testSearch = new SavedSearch({
      userId: new mongoose.Types.ObjectId(),
      name: 'Test Search',
      description: 'Test description',
      query: 'test query',
      filters: {
        contentType: 'ticket',
        status: ['open', 'in-progress']
      },
      options: {
        limit: 20,
        sort: { field: 'relevance', order: 'desc' }
      },
      tags: ['test', 'saved']
    });
    
    // Save the search
    const savedSearch = await testSearch.save();
    console.log('✅ SavedSearch model - Save successful');
    
    // Test static methods
    const userSearches = await SavedSearch.getUserSavedSearches(savedSearch.userId);
    console.log('✅ SavedSearch model - getUserSavedSearches successful');
    
    const publicSearches = await SavedSearch.getPublicSavedSearches();
    console.log('✅ SavedSearch model - getPublicSavedSearches successful');
    
    const categories = await SavedSearch.getUserCategories(savedSearch.userId);
    console.log('✅ SavedSearch model - getUserCategories successful');
    
    const statistics = await SavedSearch.getSearchStatistics(savedSearch.userId);
    console.log('✅ SavedSearch model - getSearchStatistics successful');
    
    // Test instance methods
    await savedSearch.toggleFavorite();
    console.log('✅ SavedSearch model - toggleFavorite successful');
    
    await savedSearch.addTag('new-tag');
    console.log('✅ SavedSearch model - addTag successful');
    
    await savedSearch.removeTag('new-tag');
    console.log('✅ SavedSearch model - removeTag successful');
    
    // Test URL generation
    const searchUrl = savedSearch.getSearchUrl();
    console.log('✅ SavedSearch model - getSearchUrl successful');
    
    // Clean up
    await SavedSearch.deleteMany({});
    console.log('✅ SavedSearch model tests completed');
    
  } catch (error) {
    console.error('❌ SavedSearch model test failed:', error);
    throw error;
  }
}

// Test SearchAnalytics model
async function testSearchAnalyticsModel() {
  try {
    console.log('\n📊 Testing SearchAnalytics Model...');
    
    const SearchAnalytics = require('./models/SearchAnalytics');
    
    // Create a test analytics entry
    const testAnalytics = new SearchAnalytics({
      type: 'search',
      query: 'test query',
      userId: new mongoose.Types.ObjectId(),
      sessionId: 'test-session',
      userAgent: 'test-agent',
      searchConfig: {
        contentType: 'all',
        filters: {},
        options: { limit: 20 }
      },
      resultCount: 10,
      took: 50
    });
    
    // Save the analytics
    const savedAnalytics = await testAnalytics.save();
    console.log('✅ SearchAnalytics model - Save successful');
    
    // Test static methods
    const summary = await SearchAnalytics.getSearchSummary('7d');
    console.log('✅ SearchAnalytics model - getSearchSummary successful');
    
    const popularQueries = await SearchAnalytics.getPopularQueries('7d', 10);
    console.log('✅ SearchAnalytics model - getPopularQueries successful');
    
    const performance = await SearchAnalytics.getPerformanceMetrics('7d');
    console.log('✅ SearchAnalytics model - getPerformanceMetrics successful');
    
    const trends = await SearchAnalytics.getSearchTrends('7d', 'day');
    console.log('✅ SearchAnalytics model - getSearchTrends successful');
    
    const contentTypeAnalytics = await SearchAnalytics.getContentTypeAnalytics('7d');
    console.log('✅ SearchAnalytics model - getContentTypeAnalytics successful');
    
    // Test instance methods
    savedAnalytics.addClickedResult('result1', 'ticket', 1);
    console.log('✅ SearchAnalytics model - addClickedResult successful');
    
    savedAnalytics.addClickedFilter('status', 'open');
    console.log('✅ SearchAnalytics model - addClickedFilter successful');
    
    savedAnalytics.markAsBounce();
    console.log('✅ SearchAnalytics model - markAsBounce successful');
    
    savedAnalytics.setSatisfaction(4);
    console.log('✅ SearchAnalytics model - setSatisfaction successful');
    
    // Clean up
    await SearchAnalytics.deleteMany({});
    console.log('✅ SearchAnalytics model tests completed');
    
  } catch (error) {
    console.error('❌ SearchAnalytics model test failed:', error);
    throw error;
  }
}

// Test Search Service
async function testSearchService() {
  try {
    console.log('\n🔍 Testing Search Service...');
    
    const searchService = require('./services/searchService');
    
    // Test basic search
    const searchResults = await searchService.search('test', {
      type: 'all',
      limit: 10,
      highlight: true,
      fuzzy: true
    });
    console.log('✅ SearchService - Basic search successful');
    
    // Test suggestions
    const suggestions = await searchService.getSuggestions('test', 'all');
    console.log('✅ SearchService - getSuggestions successful');
    
    // Test save search
    const savedSearch = await searchService.saveSearch(
      new mongoose.Types.ObjectId(),
      'test query',
      'Test Search'
    );
    console.log('✅ SearchService - saveSearch successful');
    
    // Test get saved searches
    const userSearches = await searchService.getSavedSearches(savedSearch.userId);
    console.log('✅ SearchService - getSavedSearches successful');
    
    // Test analytics
    const analytics = await searchService.getSearchAnalytics('7d');
    console.log('✅ SearchService - getSearchAnalytics successful');
    
    const popularSearches = await searchService.getPopularSearches(10);
    console.log('✅ SearchService - getPopularSearches successful');
    
    const performance = await searchService.getSearchPerformance();
    console.log('✅ SearchService - getSearchPerformance successful');
    
    console.log('✅ SearchService tests completed');
    
  } catch (error) {
    console.error('❌ SearchService test failed:', error);
    throw error;
  }
}

// Test Search Indexer
async function testSearchIndexer() {
  try {
    console.log('\n📚 Testing Search Indexer...');
    
    const searchIndexer = require('./utils/searchIndexer');
    
    // Test indexing metrics
    const metrics = await searchIndexer.getIndexingMetrics();
    console.log('✅ SearchIndexer - getIndexingMetrics successful');
    
    // Test index stats
    const stats = await searchIndexer.getIndexStats();
    console.log('✅ SearchIndexer - getIndexStats successful');
    
    // Test validation
    const validation = await searchIndexer.validateIndex();
    console.log('✅ SearchIndexer - validateIndex successful');
    
    console.log('✅ SearchIndexer tests completed');
    
  } catch (error) {
    console.error('❌ SearchIndexer test failed:', error);
    throw error;
  }
}

// Main test function
async function runTests() {
  try {
    console.log('🚀 Starting Search System Model Tests...\n');
    
    await connectDB();
    await testSearchIndexModel();
    await testSavedSearchModel();
    await testSearchAnalyticsModel();
    await testSearchService();
    await testSearchIndexer();
    
    console.log('\n🎉 All Search System tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Search System tests failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run tests
runTests();
