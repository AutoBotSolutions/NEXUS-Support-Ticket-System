/**
 * Enhanced Search System Unit Tests
 * Comprehensive testing for advanced search functionality
 */

// Mock dependencies before importing the search system
jest.mock('../../models/Ticket');
jest.mock('../../models/User');
jest.mock('../../models/Team');

const { enhancedSearchSystem } = require('../../middleware/searchSystemEnhanced');
const Ticket = require('../../models/Ticket');
const User = require('../../models/User');
const Team = require('../../models/Team');

describe('Enhanced Search System', () => {
  let searchSystem;
  let mockTicket, mockUser, mockTeam;

  beforeEach(() => {
    searchSystem = enhancedSearchSystem;
    
    // Mock data
    mockTicket = {
      _id: 'ticket123',
      title: 'Login Issue',
      description: 'User cannot login to the system',
      status: 'open',
      priority: 'high',
      category: 'authentication',
      tags: ['login', 'auth', 'problem'],
      createdAt: new Date('2023-12-01'),
      comments: [{ text: 'Investigating the issue' }]
    };

    mockUser = {
      _id: 'user123',
      username: 'johndoe',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      bio: 'Software Developer',
      location: 'New York',
      teams: [{ teamId: 'team1', role: 'member' }],
      createdAt: new Date('2023-01-01')
    };

    mockTeam = {
      _id: 'team123',
      name: 'Development Team',
      description: 'Core development team',
      ownerId: 'user123',
      members: [{ userId: 'user123', role: 'owner' }],
      isActive: true,
      isPublic: true,
      createdAt: new Date('2023-06-01')
    };
  });

  describe('Document Indexing', () => {
    test('should index ticket document correctly', () => {
      searchSystem.indexDocument('ticket', mockTicket._id, mockTicket);
      
      const docId = 'ticket:ticket123';
      const indexedDoc = searchSystem.index.get(docId);
      
      expect(indexedDoc).toBeDefined();
      expect(indexedDoc.type).toBe('ticket');
      expect(indexedDoc.id).toBe(mockTicket._id);
      expect(indexedDoc.searchableText).toContain('login');
      expect(indexedDoc.searchableText).toContain('issue');
      expect(indexedDoc.keywords).toContain('login');
      expect(indexedDoc.facets.status).toBe('open');
      expect(indexedDoc.facets.priority).toBe('high');
    });

    test('should index user document correctly', () => {
      searchSystem.indexDocument('user', mockUser._id, mockUser);
      
      const docId = 'user:user123';
      const indexedDoc = searchSystem.index.get(docId);
      
      expect(indexedDoc).toBeDefined();
      expect(indexedDoc.type).toBe('user');
      expect(indexedDoc.id).toBe(mockUser._id);
      expect(indexedDoc.searchableText).toContain('johndoe');
      expect(indexedDoc.searchableText).toContain('john');
      expect(indexedDoc.keywords).toContain('johndoe');
      expect(indexedDoc.facets.role).toBe('user');
      expect(indexedDoc.facets.isActive).toBe(true);
    });

    test('should index team document correctly', () => {
      searchSystem.indexDocument('team', mockTeam._id, mockTeam);
      
      const docId = 'team:team123';
      const indexedDoc = searchSystem.index.get(docId);
      
      expect(indexedDoc).toBeDefined();
      expect(indexedDoc.type).toBe('team');
      expect(indexedDoc.id).toBe(mockTeam._id);
      expect(indexedDoc.searchableText).toContain('development');
      expect(indexedDoc.searchableText).toContain('team');
      expect(indexedDoc.keywords).toContain('development');
      expect(indexedDoc.facets.isActive).toBe(true);
      expect(indexedDoc.facets.isPublic).toBe(true);
    });
  });

  describe('Text Extraction', () => {
    test('should extract searchable text from ticket', () => {
      const text = searchSystem.extractSearchableText(mockTicket);
      
      expect(text).toContain('login');
      expect(text).toContain('issue');
      expect(text).toContain('cannot');
      expect(text).toContain('system');
      expect(text).toContain('investigating');
    });

    test('should extract searchable text from user', () => {
      const text = searchSystem.extractSearchableText(mockUser);
      
      expect(text).toContain('johndoe');
      expect(text).toContain('john');
      expect(text).toContain('doe');
      expect(text).toContain('software');
      expect(text).toContain('developer');
      expect(text).toContain('york');
    });

    test('should extract searchable text from team', () => {
      const text = searchSystem.extractSearchableText(mockTeam);
      
      expect(text).toContain('development');
      expect(text).toContain('team');
      expect(text).toContain('core');
      expect(text).toContain('owner');
    });
  });

  describe('Keyword Extraction', () => {
    test('should extract keywords from text', () => {
      const keywords = searchSystem.extractKeywords(mockTicket);
      
      expect(keywords).toContain('login');
      expect(keywords).toContain('issue');
      expect(keywords).toContain('system');
      expect(keywords).toContain('problem');
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('and');
    });

    test('should remove stop words', () => {
      const text = 'the user cannot login to the system and this is a problem';
      const keywords = searchSystem.extractKeywords({ text });
      
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('and');
      expect(keywords).not.toContain('this');
      expect(keywords).toContain('user');
      expect(keywords).toContain('cannot');
      expect(keywords).toContain('login');
    });
  });

  describe('Facet Extraction', () => {
    test('should extract facets from ticket', () => {
      const facets = searchSystem.extractFacets(mockTicket);
      
      expect(facets.status).toBe('open');
      expect(facets.priority).toBe('high');
      expect(facets.category).toBe('authentication');
      expect(facets.tags).toEqual(['login', 'auth', 'problem']);
      expect(facets.createdYear).toBe(2023);
      expect(facets.createdMonth).toBe(12);
    });

    test('should extract facets from user', () => {
      const facets = searchSystem.extractFacets(mockUser);
      
      expect(facets.role).toBe('user');
      expect(facets.isActive).toBe(true);
      expect(facets.isEmailVerified).toBe(true);
      expect(facets.isPhoneVerified).toBe(false);
      expect(facets.teamCount).toBe(1);
      expect(facets.teamRoles).toEqual(['member']);
    });

    test('should extract facets from team', () => {
      const facets = searchSystem.extractFacets(mockTeam);
      
      expect(facets.isActive).toBe(true);
      expect(facets.isPublic).toBe(true);
      expect(facets.teamCount).toBe(1);
      expect(facets.teamRoles).toEqual(['owner']);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      searchSystem.indexDocument('ticket', mockTicket._id, mockTicket);
      searchSystem.indexDocument('user', mockUser._id, mockUser);
      searchSystem.indexDocument('team', mockTeam._id, mockTeam);
    });

    test('should search for exact match', async () => {
      const results = await searchSystem.search('login');
      
      expect(results.results).toHaveLength(1);
      expect(results.results[0].type).toBe('ticket');
      expect(results.results[0].score).toBeGreaterThan(0);
      expect(results.total).toBe(1);
    });

    test('should search with type filter', async () => {
      const results = await searchSystem.search('john', { type: 'user' });
      
      expect(results.results).toHaveLength(1);
      expect(results.results[0].type).toBe('user');
      expect(results.total).toBe(1);
    });

    test('should search with custom filters', async () => {
      const results = await searchSystem.search('login', {
        filters: { status: 'open' }
      });
      
      expect(results.results).toHaveLength(1);
      expect(results.results[0].type).toBe('ticket');
      expect(results.total).toBe(1);
    });

    test('should search with fuzzy matching', async () => {
      const results = await searchSystem.search('logn', { fuzzy: true });
      
      expect(results.results).toHaveLength(1);
      expect(results.results[0].type).toBe('ticket');
      expect(results.total).toBe(1);
    });

    test('should respect pagination', async () => {
      const results = await searchSystem.search('login', { limit: 5, offset: 0 });
      
      expect(results.results.length).toBeLessThanOrEqual(5);
      expect(results.hasMore).toBe(false);
    });

    test('should generate facets', async () => {
      const results = await searchSystem.search('login', { facets: true });
      
      expect(results.facets).toBeDefined();
      expect(results.facets.types).toBeDefined();
      expect(results.facets.status).toBeDefined();
    });

    test('should generate highlights', async () => {
      const results = await searchSystem.search('login', { highlight: true });
      
      expect(results.results[0].highlights).toBeDefined();
      expect(results.results[0].highlights.length).toBeGreaterThan(0);
    });
  });

  describe('Advanced Search', () => {
    beforeEach(() => {
      searchSystem.indexDocument('ticket', mockTicket._id, mockTicket);
      searchSystem.indexDocument('user', mockUser._id, mockUser);
      searchSystem.indexDocument('team', mockTeam._id, mockTeam);
    });

    test('should perform advanced search with aggregations', async () => {
      const aggregations = {
        status: { type: 'terms', field: 'status' },
        priority: { type: 'terms', field: 'priority' },
        role: { type: 'terms', field: 'role' }
      };

      const results = await searchSystem.advancedSearch('login', {
        aggregations
      });
      
      expect(results.aggregations).toBeDefined();
      expect(results.aggregations.status).toBeDefined();
      expect(results.aggregations.priority).toBeDefined();
      expect(results.aggregations.role).toBeDefined();
    });

    test('should generate terms aggregation', async () => {
      const results = await searchSystem.advancedSearch('login', {
        aggregations: {
          status: { type: 'terms', field: 'status' }
        }
      });
      
      expect(results.aggregations.status).toBeDefined();
      expect(Array.isArray(results.aggregations.status)).toBe(true);
    });

    test('should generate date histogram aggregation', async () => {
      const results = await searchSystem.advancedSearch('login', {
        aggregations: {
          created: { type: 'date_histogram', field: 'createdAt', interval: 'month' }
        }
      });
      
      expect(results.aggregations.created).toBeDefined();
      expect(Array.isArray(results.aggregations.created)).toBe(true);
    });

    test('should generate stats aggregation', async () => {
      const results = await searchSystem.advancedSearch('login', {
        aggregations: {
          loginCount: { type: 'stats', field: 'loginCount' }
        }
      });
      
      expect(results.aggregations.loginCount).toBeDefined();
      expect(results.aggregations.loginCount.count).toBeDefined();
    });

    test('should generate cardinality aggregation', async () => {
      const results = await searchSystem.advancedSearch('login', {
        aggregations: {
          uniqueUsers: { type: 'cardinality', field: 'userId' }
        }
      });
      
      expect(results.aggregations.uniqueUsers).toBeDefined();
      expect(results.aggregations.uniqueUsers.value).toBeDefined();
    });
  });

  describe('Relevance Scoring', () => {
    test('should calculate relevance score for exact match', () => {
      const indexedDoc = {
        searchableText: 'login issue with system',
        keywords: ['login', 'issue', 'system'],
        document: { title: 'Login Issue', createdAt: new Date() }
      };

      const score = searchSystem.calculateRelevanceScore('login', indexedDoc, false);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeGreaterThanOrEqual(100); // Exact match bonus
    });

    test('should calculate relevance score for partial match', () => {
      const indexedDoc = {
        searchableText: 'login issue with system',
        keywords: ['login', 'issue', 'system'],
        document: { title: 'Login Issue', createdAt: new Date() }
      };

      const score = searchSystem.calculateRelevanceScore('issue', indexedDoc, false);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeGreaterThanOrEqual(50); // Keyword match bonus
    });

    test('should apply field boosts', () => {
      const indexedDoc = {
        searchableText: 'some text',
        keywords: ['some', 'text'],
        document: { title: 'Login Issue', createdAt: new Date() }
      };

      const score = searchSystem.calculateRelevanceScore('login', indexedDoc, false);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeGreaterThanOrEqual(20); // Title boost
    });

    test('should apply recency boost', () => {
      const indexedDoc = {
        searchableText: 'some text',
        keywords: ['some', 'text'],
        document: { title: 'Some Title', createdAt: new Date() }
      };

      const score = searchSystem.calculateRelevanceScore('some', indexedDoc, false);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeGreaterThanOrEqual(10); // Recency boost for recent document
    });
  });

  describe('Fuzzy Matching', () => {
    test('should calculate fuzzy score', () => {
      const keywords = ['login', 'issue', 'system'];
      const score = searchSystem.calculateFuzzyScore('logn', keywords);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('should handle exact match in fuzzy scoring', () => {
      const keywords = ['login', 'issue', 'system'];
      const score = searchSystem.calculateFuzzyScore('login', keywords);
      
      expect(score).toBe(1); // Exact match should return 1
    });

    test('should calculate Levenshtein distance', () => {
      const distance = searchSystem.levenshteinDistance('login', 'logn');
      
      expect(distance).toBe(1); // One character difference
    });
  });

  describe('Search Analytics', () => {
    test('should record search query', () => {
      const query = 'login issue';
      const options = { userId: 'user123' };
      
      searchSystem.recordSearch(query, options);
      
      const history = searchSystem.getUserSearchHistory('user123');
      expect(history).toHaveLength(1);
      expect(history[0].query).toBe(query);
    });

    test('should update search analytics', () => {
      const query = 'login issue';
      
      searchSystem.updateSearchAnalytics(query, Date.now());
      
      const today = new Date().toDateString();
      const analytics = searchSystem.searchAnalytics.get(today);
      
      expect(analytics).toBeDefined();
      expect(analytics.totalSearches).toBe(1);
      expect(analytics.uniqueQueries.has(query)).toBe(true);
    });

    test('should get search analytics', () => {
      const query = 'login issue';
      
      searchSystem.updateSearchAnalytics(query, Date.now());
      const analytics = searchSystem.getSearchAnalytics(query);
      
      expect(analytics).toBeDefined();
      expect(analytics.totalSearchesToday).toBe(1);
      expect(analytics.queryCountToday).toBe(1);
    });
  });

  describe('Search Suggestions', () => {
    beforeEach(() => {
      searchSystem.indexDocument('ticket', mockTicket._id, mockTicket);
      searchSystem.indexDocument('user', mockUser._id, mockUser);
    });

    test('should get search suggestions', async () => {
      const suggestions = await searchSystem.getSearchSuggestions('log');
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toContain('log');
    });

    test('should filter suggestions by type', async () => {
      const suggestions = await searchSystem.getSearchSuggestions('log', 'ticket');
      
      expect(Array.isArray(suggestions)).toBe(true);
      // Should only return suggestions from tickets
    });

    test('should return empty array for short query', async () => {
      const suggestions = await searchSystem.getSearchSuggestions('l');
      
      expect(suggestions).toEqual([]);
    });
  });

  describe('Popular Queries', () => {
    test('should get popular queries', async () => {
      // Record some searches
      searchSystem.updateSearchAnalytics('login', Date.now());
      searchSystem.updateSearchAnalytics('login', Date.now());
      searchSystem.updateSearchAnalytics('issue', Date.now());
      
      const popularQueries = await searchSystem.getPopularQueries();
      
      expect(Array.isArray(popularQueries)).toBe(true);
      expect(popularQueries.length).toBeGreaterThan(0);
      expect(popularQueries[0]).toHaveProperty('query');
      expect(popularQueries[0]).toHaveProperty('count');
    });

    test('should limit popular queries', async () => {
      // Record some searches
      for (let i = 0; i < 15; i++) {
        searchSystem.updateSearchAnalytics(`query${i}`, Date.now());
      }
      
      const popularQueries = await searchSystem.getPopularQueries(null, 5);
      
      expect(popularQueries.length).toBe(5);
    });
  });

  describe('Caching', () => {
    test('should cache search results', async () => {
      searchSystem.indexDocument('ticket', mockTicket._id, mockTicket);
      
      const query = 'login';
      const options = { useCache: true };
      
      // First search
      const results1 = await searchSystem.search(query, options);
      expect(results1.total).toBe(1);
      
      // Second search (should use cache)
      const results2 = await searchSystem.search(query, options);
      expect(results2.total).toBe(1);
      
      // Check cache size
      const stats = searchSystem.getCacheStats();
      expect(stats.searchCacheSize).toBeGreaterThan(0);
    });

    test('should clear cache', () => {
      searchSystem.clearCache();
      
      const stats = searchSystem.getCacheStats();
      expect(stats.searchCacheSize).toBe(0);
      expect(stats.facetCacheSize).toBe(0);
    });

    test('should set cache timeouts', () => {
      searchSystem.setCacheTimeouts(300000, 600000); // 5 min, 10 min
      
      const stats = searchSystem.getCacheStats();
      expect(stats.searchCacheTimeout).toBe(300000);
      expect(stats.facetCacheTimeout).toBe(600000);
    });
  });

  describe('Document Management', () => {
    test('should add document', async () => {
      const newTicket = {
        _id: 'ticket456',
        title: 'New Issue',
        description: 'New issue description',
        status: 'open'
      };

      await searchSystem.addDocument('ticket', newTicket._id, newTicket);
      
      const docId = 'ticket:ticket456';
      const indexedDoc = searchSystem.index.get(docId);
      
      expect(indexedDoc).toBeDefined();
      expect(indexedDoc.document.title).toBe('New Issue');
    });

    test('should update document', async () => {
      const updatedTicket = {
        _id: 'ticket123',
        title: 'Updated Issue',
        description: 'Updated description',
        status: 'closed'
      };

      await searchSystem.updateDocument('ticket', updatedTicket._id, updatedTicket);
      
      const docId = 'ticket:ticket123';
      const indexedDoc = searchSystem.index.get(docId);
      
      expect(indexedDoc).toBeDefined();
      expect(indexedDoc.document.title).toBe('Updated Issue');
      expect(indexedDoc.document.status).toBe('closed');
    });

    test('should remove document', async () => {
      await searchSystem.removeDocument('ticket', mockTicket._id);
      
      const docId = 'ticket:ticket123';
      const indexedDoc = searchSystem.index.get(docId);
      
      expect(indexedDoc).toBeUndefined();
    });
  });

  describe('Search Statistics', () => {
    beforeEach(() => {
      searchSystem.indexDocument('ticket', mockTicket._id, mockTicket);
      searchSystem.indexDocument('user', mockUser._id, mockUser);
      searchSystem.indexDocument('team', mockTeam._id, mockTeam);
    });

    test('should get search statistics', () => {
      const stats = searchSystem.getSearchStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalDocuments).toBe(3);
      expect(stats.documentsByType).toBeDefined();
      expect(stats.documentsByType.ticket).toBe(1);
      expect(stats.documentsByType.user).toBe(1);
      expect(stats.documentsByType.team).toBe(1);
    });

    test('should include cache stats', () => {
      const stats = searchSystem.getSearchStats();
      
      expect(stats.cacheSize).toBeDefined();
      expect(stats.facetCacheSize).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle empty query', async () => {
      const results = await searchSystem.search('');
      
      expect(results.results).toEqual([]);
      expect(results.total).toBe(0);
    });

    test('should handle null query', async () => {
      const results = await searchSystem.search(null);
      
      expect(results.results).toEqual([]);
      expect(results.total).toBe(0);
    });

    test('should handle invalid filters', async () => {
      const results = await searchSystem.search('login', {
        filters: { invalidField: 'value' }
      });
      
      expect(results.results).toEqual([]);
      expect(results.total).toBe(0);
    });
  });

  describe('Performance', () => {
    test('should handle large number of documents', async () => {
      // Index many documents
      for (let i = 0; i < 100; i++) {
        const ticket = {
          _id: `ticket${i}`,
          title: `Issue ${i}`,
          description: `Description for issue ${i}`,
          status: 'open'
        };
        searchSystem.indexDocument('ticket', ticket._id, ticket);
      }

      const startTime = Date.now();
      const results = await searchSystem.search('issue');
      const endTime = Date.now();
      
      expect(results.results.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    test('should handle concurrent searches', async () => {
      searchSystem.indexDocument('ticket', mockTicket._id, mockTicket);
      searchSystem.indexDocument('user', mockUser._id, mockUser);
      
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(searchSystem.search('login'));
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.total).toBe(1);
      });
    });
  });
});
