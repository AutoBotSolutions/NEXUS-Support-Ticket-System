/**
 * NEXUS Enhanced Search System
 * Comprehensive search with advanced features: faceting, caching, analytics, and performance optimization
 */

const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Team = require('../models/Team');

class EnhancedSearchSystem {
  constructor() {
    this.index = new Map();
    this.searchHistory = new Map();
    this.searchAnalytics = new Map();
    this.searchCache = new Map();
    this.facetCache = new Map();
    this.fuzzyThreshold = 0.8;
    this.maxResults = 100;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.facetTimeout = 10 * 60 * 1000; // 10 minutes
    
    this.initializeSearchIndex();
  }

  initializeSearchIndex() {
    this.rebuildIndex();
  }

  async rebuildIndex() {
    console.log('Rebuilding enhanced search index...');
    
    try {
      this.index.clear();
      this.searchCache.clear();
      this.facetCache.clear();
      
      // Index tickets
      const tickets = await Ticket.find({});
      for (const ticket of tickets) {
        this.indexDocument('ticket', ticket._id, ticket);
      }
      
      // Index users
      const users = await User.find({});
      for (const user of users) {
        this.indexDocument('user', user._id, user);
      }
      
      // Index teams
      const teams = await Team.find({});
      for (const team of teams) {
        this.indexDocument('team', team._id, team);
      }
      
      console.log(`Enhanced search index rebuilt with ${this.index.size} documents`);
    } catch (error) {
      console.error('Error rebuilding enhanced search index:', error);
    }
  }

  indexDocument(type, id, document) {
    const docId = `${type}:${id}`;
    const indexedDoc = {
      type,
      id,
      document,
      searchableText: this.extractSearchableText(document),
      keywords: this.extractKeywords(document),
      facets: this.extractFacets(document),
      indexedAt: Date.now()
    };
    
    this.index.set(docId, indexedDoc);
    // Clear relevant caches
    this.searchCache.clear();
    this.facetCache.clear();
  }

  extractSearchableText(document) {
    const textFields = [];
    
    // Extract text from common fields
    if (document.title) textFields.push(document.title);
    if (document.description) textFields.push(document.description);
    if (document.username) textFields.push(document.username);
    if (document.email) textFields.push(document.email);
    if (document.content) textFields.push(document.content);
    if (document.name) textFields.push(document.name);
    if (document.firstName) textFields.push(document.firstName);
    if (document.lastName) textFields.push(document.lastName);
    if (document.bio) textFields.push(document.bio);
    if (document.location) textFields.push(document.location);
    
    // Extract text from nested objects
    if (document.comments && Array.isArray(document.comments)) {
      document.comments.forEach(comment => {
        if (comment.text) textFields.push(comment.text);
        if (comment.content) textFields.push(comment.content);
      });
    }
    
    // Extract text from arrays
    if (document.tags && Array.isArray(document.tags)) {
      textFields.push(...document.tags);
    }
    
    // Extract text from team members
    if (document.members && Array.isArray(document.members)) {
      document.members.forEach(member => {
        if (member.userId) textFields.push(member.userId.toString());
        if (member.role) textFields.push(member.role);
      });
    }
    
    return textFields.join(' ').toLowerCase();
  }

  extractKeywords(document) {
    const text = this.extractSearchableText(document);
    const keywords = new Set();
    
    // Enhanced stop words list
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why',
      'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
      'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'get', 'got', 'use', 'used', 'make', 'made', 'take', 'took', 'come', 'came',
      'see', 'saw', 'know', 'knew', 'think', 'thought', 'say', 'said', 'tell', 'told'
    ]);
    
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(word => {
      // Remove punctuation and normalize
      const cleanWord = word.replace(/[^\w]/g, '');
      
      if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
        keywords.add(cleanWord);
      }
    });
    
    return Array.from(keywords);
  }

  extractFacets(document) {
    const facets = {};
    
    // Extract common facets
    if (document.type) facets.type = document.type;
    if (document.status) facets.status = document.status;
    if (document.priority) facets.priority = document.priority;
    if (document.category) facets.category = document.category;
    if (document.role) facets.role = document.role;
    if (document.isActive !== undefined) facets.isActive = document.isActive;
    if (document.isEmailVerified !== undefined) facets.isEmailVerified = document.isEmailVerified;
    if (document.isPhoneVerified !== undefined) facets.isPhoneVerified = document.isPhoneVerified;
    
    // Extract date-based facets
    if (document.createdAt) {
      const date = new Date(document.createdAt);
      facets.createdYear = date.getFullYear();
      facets.createdMonth = date.getMonth() + 1;
      facets.createdDay = date.getDate();
    }
    
    // Extract array facets
    if (document.tags && Array.isArray(document.tags)) {
      facets.tags = document.tags;
    }
    
    // Extract team facets
    if (document.teams && Array.isArray(document.teams)) {
      facets.teamCount = document.teams.length;
      facets.teamRoles = document.teams.map(team => team.role);
    }
    
    return facets;
  }

  async search(query, options = {}) {
    const {
      type = null,
      limit = this.maxResults,
      offset = 0,
      sortBy = 'relevance',
      filters = {},
      fuzzy = true,
      facets = false,
      highlight = true,
      useCache = true
    } = options;

    // Check cache first
    if (useCache) {
      const cacheKey = this.generateCacheKey(query, options);
      const cached = this.searchCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.result;
      }
    }

    // Record search query
    this.recordSearch(query, options);

    // Parse and normalize query
    const normalizedQuery = this.normalizeQuery(query);
    
    // Search the index
    let results = [];
    
    for (const [docId, indexedDoc] of this.index) {
      // Apply type filter
      if (type && indexedDoc.type !== type) {
        continue;
      }
      
      // Apply custom filters
      if (!this.matchesFilters(indexedDoc.document, filters)) {
        continue;
      }
      
      // Calculate relevance score
      const score = this.calculateRelevanceScore(normalizedQuery, indexedDoc, fuzzy);
      
      if (score > 0) {
        results.push({
          type: indexedDoc.type,
          id: indexedDoc.id,
          document: indexedDoc.document,
          score,
          highlights: highlight ? this.generateHighlights(normalizedQuery, indexedDoc) : null
        });
      }
    }
    
    // Sort results
    results = this.sortResults(results, sortBy);
    
    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);
    
    // Generate facets if requested
    let facetResults = null;
    if (facets) {
      facetResults = await this.generateFacets(query, options);
    }
    
    const searchResult = {
      query,
      total: results.length,
      results: paginatedResults,
      hasMore: offset + limit < results.length,
      facets: facetResults,
      analytics: this.getSearchAnalytics(query)
    };

    // Cache the result
    if (useCache) {
      const cacheKey = this.generateCacheKey(query, options);
      this.searchCache.set(cacheKey, {
        result: searchResult,
        timestamp: Date.now()
      });
    }

    return searchResult;
  }

  async generateFacets(query, options = {}) {
    const { type = null, filters = {} } = options;
    
    // Check cache
    const cacheKey = `facets:${query}:${JSON.stringify({ type, filters })}`;
    const cached = this.facetCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.facetTimeout) {
      return cached.result;
    }

    const facets = {
      types: {},
      status: {},
      priority: {},
      category: {},
      role: {},
      isActive: {},
      tags: {},
      createdYear: {},
      createdMonth: {},
      teamCount: {},
      teamRoles: {}
    };

    // Collect facet data
    for (const [docId, indexedDoc] of this.index) {
      // Apply type filter
      if (type && indexedDoc.type !== type) {
        continue;
      }
      
      // Apply custom filters
      if (!this.matchesFilters(indexedDoc.document, filters)) {
        continue;
      }

      // Count facet values
      const docFacets = indexedDoc.facets;
      
      for (const [facetName, facetValue] of Object.entries(docFacets)) {
        if (Array.isArray(facetValue)) {
          facetValue.forEach(value => {
            if (!facets[facetName]) facets[facetName] = {};
            facets[facetName][value] = (facets[facetName][value] || 0) + 1;
          });
        } else {
          if (!facets[facetName]) facets[facetName] = {};
          facets[facetName][facetValue] = (facets[facetName][facetValue] || 0) + 1;
        }
      }
    }

    // Sort facet values by count
    for (const [facetName, facetValues] of Object.entries(facets)) {
      const sorted = Object.entries(facetValues)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Top 10 values per facet
        .map(([value, count]) => ({ value, count }));
      
      facets[facetName] = sorted;
    }

    // Cache the result
    this.facetCache.set(cacheKey, {
      result: facets,
      timestamp: Date.now()
    });

    return facets;
  }

  generateCacheKey(query, options) {
    const { type, limit, offset, sortBy, filters, fuzzy, facets, highlight } = options;
    return `${query}:${type}:${limit}:${offset}:${sortBy}:${JSON.stringify(filters)}:${fuzzy}:${facets}:${highlight}`;
  }

  normalizeQuery(query) {
    if (!query || typeof query !== 'string') {
      return '';
    }
    
    return query.toLowerCase().trim();
  }

  calculateRelevanceScore(query, indexedDoc, fuzzy) {
    const { searchableText, keywords } = indexedDoc;
    const queryWords = query.split(/\s+/).filter(word => word.length > 0);
    
    if (queryWords.length === 0) {
      return 0;
    }
    
    let score = 0;
    let matchedWords = 0;
    
    // Exact phrase match (highest score)
    if (searchableText.includes(query)) {
      score += 100;
      matchedWords = queryWords.length;
    } else {
      // Word-by-word matching
      queryWords.forEach(queryWord => {
        // Exact word match
        if (keywords.includes(queryWord)) {
          score += 50;
          matchedWords++;
        } else if (searchableText.includes(queryWord)) {
          score += 30;
          matchedWords++;
        } else if (fuzzy) {
          // Fuzzy matching
          const fuzzyScore = this.calculateFuzzyScore(queryWord, keywords);
          if (fuzzyScore >= this.fuzzyThreshold) {
            score += Math.round(fuzzyScore * 20);
            matchedWords++;
          }
        }
      });
    }
    
    // Boost score based on word match ratio
    const matchRatio = matchedWords / queryWords.length;
    score *= matchRatio;
    
    // Apply field-specific boosts
    score += this.calculateFieldBoosts(query, indexedDoc.document);
    
    // Apply recency boost (newer documents get slight boost)
    const recencyBoost = this.calculateRecencyBoost(indexedDoc.document);
    score += recencyBoost;
    
    return Math.round(score);
  }

  calculateFuzzyScore(queryWord, keywords) {
    let maxScore = 0;
    
    for (const keyword of keywords) {
      const score = this.levenshteinDistance(queryWord, keyword) / Math.max(queryWord.length, keyword.length);
      const similarity = 1 - score;
      
      if (similarity > maxScore) {
        maxScore = similarity;
      }
    }
    
    return maxScore;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  calculateFieldBoosts(query, document) {
    let boost = 0;
    
    // Title matches get higher boost
    if (document.title && document.title.toLowerCase().includes(query)) {
      boost += 20;
    }
    
    // Username/email matches get medium boost
    if (document.username && document.username.toLowerCase().includes(query)) {
      boost += 15;
    }
    
    if (document.email && document.email.toLowerCase().includes(query)) {
      boost += 10;
    }
    
    // Name matches get boost
    if (document.firstName && document.firstName.toLowerCase().includes(query)) {
      boost += 12;
    }
    
    if (document.lastName && document.lastName.toLowerCase().includes(query)) {
      boost += 12;
    }
    
    // Team name matches get boost
    if (document.name && document.name.toLowerCase().includes(query)) {
      boost += 15;
    }
    
    return boost;
  }

  calculateRecencyBoost(document) {
    if (!document.createdAt) {
      return 0;
    }
    
    const ageInDays = (Date.now() - document.createdAt) / (1000 * 60 * 60 * 24);
    
    // Documents newer than 7 days get boost
    if (ageInDays < 7) {
      return Math.round(10 * (1 - ageInDays / 7));
    }
    
    return 0;
  }

  generateHighlights(query, indexedDoc) {
    const highlights = [];
    const { document } = indexedDoc;
    const queryWords = query.split(/\s+/).filter(word => word.length > 0);
    
    // Highlight title
    if (document.title) {
      const titleHighlight = this.highlightText(document.title, queryWords);
      if (titleHighlight) {
        highlights.push({ field: 'title', text: titleHighlight });
      }
    }
    
    // Highlight description
    if (document.description) {
      const descHighlight = this.highlightText(document.description, queryWords);
      if (descHighlight) {
        highlights.push({ field: 'description', text: descHighlight });
      }
    }
    
    // Highlight content
    if (document.content) {
      const contentHighlight = this.highlightText(document.content, queryWords);
      if (contentHighlight) {
        highlights.push({ field: 'content', text: contentHighlight });
      }
    }
    
    // Highlight bio
    if (document.bio) {
      const bioHighlight = this.highlightText(document.bio, queryWords);
      if (bioHighlight) {
        highlights.push({ field: 'bio', text: bioHighlight });
      }
    }
    
    return highlights;
  }

  highlightText(text, queryWords) {
    const maxHighlightLength = 200;
    
    // Find best matching fragment
    let bestFragment = '';
    let bestScore = 0;
    
    for (const queryWord of queryWords) {
      const index = text.toLowerCase().indexOf(queryWord.toLowerCase());
      
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + queryWord.length + 50);
        const fragment = text.substring(start, end);
        
        // Count matching words in fragment
        const matches = queryWords.filter(word => 
          fragment.toLowerCase().includes(word.toLowerCase())
        ).length;
        
        if (matches > bestScore) {
          bestScore = matches;
          bestFragment = fragment;
        }
      }
    }
    
    if (bestFragment) {
      // Truncate if too long
      if (bestFragment.length > maxHighlightLength) {
        bestFragment = bestFragment.substring(0, maxHighlightLength) + '...';
      }
      
      // Highlight matching words
      let highlighted = bestFragment;
      queryWords.forEach(word => {
        const regex = new RegExp(`(${word})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
      });
      
      return highlighted;
    }
    
    return null;
  }

  matchesFilters(document, filters) {
    for (const [field, value] of Object.entries(filters)) {
      if (!this.matchesFilter(document, field, value)) {
        return false;
      }
    }
    
    return true;
  }

  matchesFilter(document, field, value) {
    const fieldValue = document[field];
    
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }
    
    if (Array.isArray(value)) {
      return value.includes(fieldValue);
    }
    
    if (typeof value === 'object' && value !== null) {
      // Handle range filters
      if (value.min !== undefined && fieldValue < value.min) {
        return false;
      }
      if (value.max !== undefined && fieldValue > value.max) {
        return false;
      }
      if (value.neq !== undefined && fieldValue === value.neq) {
        return false;
      }
      if (value.in !== undefined && !value.in.includes(fieldValue)) {
        return false;
      }
      if (value.nin !== undefined && value.nin.includes(fieldValue)) {
        return false;
      }
      
      return true;
    }
    
    return fieldValue === value;
  }

  sortResults(results, sortBy) {
    switch (sortBy) {
      case 'relevance':
        return results.sort((a, b) => b.score - a.score);
      case 'newest':
        return results.sort((a, b) => 
          new Date(b.document.createdAt || 0) - new Date(a.document.createdAt || 0)
        );
      case 'oldest':
        return results.sort((a, b) => 
          new Date(a.document.createdAt || 0) - new Date(b.document.createdAt || 0)
        );
      case 'title':
        return results.sort((a, b) => 
          (a.document.title || '').localeCompare(b.document.title || '')
        );
      case 'name':
        return results.sort((a, b) => 
          (a.document.name || '').localeCompare(b.document.name || '')
        );
      case 'username':
        return results.sort((a, b) => 
          (a.document.username || '').localeCompare(b.document.username || '')
        );
      default:
        return results.sort((a, b) => b.score - a.score);
    }
  }

  recordSearch(query, options) {
    const timestamp = Date.now();
    const userId = options.userId || 'anonymous';
    
    if (!this.searchHistory.has(userId)) {
      this.searchHistory.set(userId, []);
    }
    
    const userHistory = this.searchHistory.get(userId);
    userHistory.unshift({
      query,
      options,
      timestamp,
      results: 0 // Will be updated after search
    });
    
    // Keep only last 100 searches per user
    if (userHistory.length > 100) {
      userHistory.splice(100);
    }
    
    // Update analytics
    this.updateSearchAnalytics(query, timestamp);
  }

  updateSearchAnalytics(query, timestamp) {
    const dateKey = new Date(timestamp).toDateString();
    
    if (!this.searchAnalytics.has(dateKey)) {
      this.searchAnalytics.set(dateKey, {
        totalSearches: 0,
        uniqueQueries: new Set(),
        avgQueryLength: 0,
        topQueries: new Map(),
        searchTypes: new Map(),
        avgResultsCount: 0
      });
    }
    
    const analytics = this.searchAnalytics.get(dateKey);
    analytics.totalSearches++;
    
    // Only add valid queries to analytics
    if (query && typeof query === 'string' && query.trim().length > 0) {
      analytics.uniqueQueries.add(query);
      
      // Update top queries
      const currentCount = analytics.topQueries.get(query) || 0;
      analytics.topQueries.set(query, currentCount + 1);
      
      // Calculate average query length
      const totalLength = Array.from(analytics.uniqueQueries)
        .reduce((sum, q) => sum + q.length, 0);
      analytics.avgQueryLength = Math.round(totalLength / analytics.uniqueQueries.size);
    }
  }

  getSearchAnalytics(query) {
    const today = new Date().toDateString();
    const todayAnalytics = this.searchAnalytics.get(today);
    
    if (!todayAnalytics) {
      return {
        totalSearchesToday: 0,
        avgQueryLengthToday: 0,
        isPopularQuery: false
      };
    }
    
    const queryCount = todayAnalytics.topQueries.get(query) || 0;
    const isPopular = queryCount > 5; // Query searched more than 5 times today
    
    return {
      totalSearchesToday: todayAnalytics.totalSearches,
      avgQueryLengthToday: todayAnalytics.avgQueryLength,
      isPopularQuery: isPopular,
      queryCountToday: queryCount
    };
  }

  async getSearchSuggestions(query, type = null) {
    if (!query || query.length < 2) {
      return [];
    }
    
    const suggestions = new Set();
    const normalizedQuery = query.toLowerCase();
    
    // Get suggestions from indexed keywords
    for (const [docId, indexedDoc] of this.index) {
      if (type && indexedDoc.type !== type) {
        continue;
      }
      
      // Find keywords that start with query
      indexedDoc.keywords.forEach(keyword => {
        if (keyword.startsWith(normalizedQuery)) {
          suggestions.add(keyword);
        }
      });
    }
    
    // Convert to array and sort by relevance
    const suggestionArray = Array.from(suggestions).sort((a, b) => {
      // Exact match first
      if (a === normalizedQuery) return -1;
      if (b === normalizedQuery) return 1;
      
      // Then by length (shorter first)
      return a.length - b.length;
    });
    
    return suggestionArray.slice(0, 10);
  }

  async getPopularQueries(type = null, limit = 10) {
    const today = new Date().toDateString();
    const todayAnalytics = this.searchAnalytics.get(today);
    
    if (!todayAnalytics) {
      return [];
    }
    
    // Get top queries from today
    const topQueries = Array.from(todayAnalytics.topQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
    
    return topQueries;
  }

  getUserSearchHistory(userId, limit = 20) {
    const userHistory = this.searchHistory.get(userId);
    if (!userHistory || userHistory.length === 0) {
      return [];
    }
    return userHistory.slice(0, limit);
  }

  async addDocument(type, id, document) {
    this.indexDocument(type, id, document);
    // Clear caches
    this.searchCache.clear();
    this.facetCache.clear();
  }

  async updateDocument(type, id, document) {
    const docId = `${type}:${id}`;
    
    if (this.index.has(docId)) {
      this.index.delete(docId);
    }
    
    this.indexDocument(type, id, document);
    // Clear caches
    this.searchCache.clear();
    this.facetCache.clear();
  }

  async removeDocument(type, id) {
    const docId = `${type}:${id}`;
    this.index.delete(docId);
    // Clear caches
    this.searchCache.clear();
    this.facetCache.clear();
  }

  getSearchStats() {
    const totalDocuments = this.index.size;
    const documentsByType = {};
    
    for (const [docId, indexedDoc] of this.index) {
      if (!documentsByType[indexedDoc.type]) {
        documentsByType[indexedDoc.type] = 0;
      }
      documentsByType[indexedDoc.type]++;
    }
    
    const today = new Date().toDateString();
    const todayAnalytics = this.searchAnalytics.get(today);
    
    return {
      totalDocuments,
      documentsByType,
      totalSearchesToday: todayAnalytics?.totalSearches || 0,
      uniqueQueriesToday: todayAnalytics?.uniqueQueries.size || 0,
      avgQueryLengthToday: todayAnalytics?.avgQueryLength || 0,
      cacheSize: this.searchCache.size,
      facetCacheSize: this.facetCache.size,
      indexedAt: Date.now()
    };
  }

  // Advanced search features
  async advancedSearch(query, options = {}) {
    const {
      type = null,
      limit = this.maxResults,
      offset = 0,
      sortBy = 'relevance',
      filters = {},
      fuzzy = true,
      facets = true,
      highlight = true,
      aggregations = {},
      useCache = true
    } = options;

    const searchResult = await this.search(query, {
      type,
      limit,
      offset,
      sortBy,
      filters,
      fuzzy,
      facets,
      highlight,
      useCache
    });

    // Add aggregations if requested
    if (Object.keys(aggregations).length > 0) {
      searchResult.aggregations = await this.generateAggregations(query, options);
    }

    return searchResult;
  }

  async generateAggregations(query, options = {}) {
    const { type = null, filters = {}, aggregations = {} } = options;
    
    const results = {};
    
    for (const [aggName, aggConfig] of Object.entries(aggregations)) {
      switch (aggConfig.type) {
        case 'terms':
          results[aggName] = await this.generateTermsAggregation(aggConfig.field, type, filters);
          break;
        case 'date_histogram':
          results[aggName] = await this.generateDateHistogramAggregation(aggConfig.field, aggConfig.interval, type, filters);
          break;
        case 'stats':
          results[aggName] = await this.generateStatsAggregation(aggConfig.field, type, filters);
          break;
        case 'cardinality':
          results[aggName] = await this.generateCardinalityAggregation(aggConfig.field, type, filters);
          break;
      }
    }
    
    return results;
  }

  async generateTermsAggregation(field, type, filters) {
    const counts = {};
    
    for (const [docId, indexedDoc] of this.index) {
      if (type && indexedDoc.type !== type) continue;
      if (!this.matchesFilters(indexedDoc.document, filters)) continue;
      
      const value = indexedDoc.document[field];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => {
            counts[v] = (counts[v] || 0) + 1;
          });
        } else {
          counts[value] = (counts[value] || 0) + 1;
        }
      }
    }
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));
  }

  async generateDateHistogramAggregation(field, interval, type, filters) {
    const histogram = {};
    
    for (const [docId, indexedDoc] of this.index) {
      if (type && indexedDoc.type !== type) continue;
      if (!this.matchesFilters(indexedDoc.document, filters)) continue;
      
      const date = indexedDoc.document[field];
      if (date) {
        const dateObj = new Date(date);
        let key;
        
        switch (interval) {
          case 'day':
            key = dateObj.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(dateObj);
            weekStart.setDate(dateObj.getDate() - dateObj.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
          case 'year':
            key = dateObj.getFullYear().toString();
            break;
        }
        
        histogram[key] = (histogram[key] || 0) + 1;
      }
    }
    
    return Object.entries(histogram)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => ({ key, count }));
  }

  async generateStatsAggregation(field, type, filters) {
    const values = [];
    
    for (const [docId, indexedDoc] of this.index) {
      if (type && indexedDoc.type !== type) continue;
      if (!this.matchesFilters(indexedDoc.document, filters)) continue;
      
      const value = indexedDoc.document[field];
      if (typeof value === 'number') {
        values.push(value);
      }
    }
    
    if (values.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, sum: 0 };
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { count: values.length, min, max, avg, sum };
  }

  async generateCardinalityAggregation(field, type, filters) {
    const uniqueValues = new Set();
    
    for (const [docId, indexedDoc] of this.index) {
      if (type && indexedDoc.type !== type) continue;
      if (!this.matchesFilters(indexedDoc.document, filters)) continue;
      
      const value = indexedDoc.document[field];
      if (value !== undefined && value !== null) {
        uniqueValues.add(value);
      }
    }
    
    return { value: uniqueValues.size };
  }

  // Performance optimization methods
  clearCache() {
    this.searchCache.clear();
    this.facetCache.clear();
  }

  getCacheStats() {
    return {
      searchCacheSize: this.searchCache.size,
      facetCacheSize: this.facetCache.size,
      searchCacheTimeout: this.cacheTimeout,
      facetCacheTimeout: this.facetTimeout
    };
  }

  setCacheTimeouts(searchTimeout, facetTimeout) {
    this.cacheTimeout = searchTimeout;
    this.facetCacheTimeout = facetTimeout;
  }
}

// Create singleton instance
const enhancedSearchSystem = new EnhancedSearchSystem();

// Export functions
const search = (query, options) => enhancedSearchSystem.search(query, options);
const advancedSearch = (query, options) => enhancedSearchSystem.advancedSearch(query, options);
const getSearchSuggestions = (query, type) => enhancedSearchSystem.getSearchSuggestions(query, type);
const getPopularQueries = (type, limit) => enhancedSearchSystem.getPopularQueries(type, limit);
const getUserSearchHistory = (userId, limit) => enhancedSearchSystem.getUserSearchHistory(userId, limit);
const addDocument = (type, id, document) => enhancedSearchSystem.addDocument(type, id, document);
const updateDocument = (type, id, document) => enhancedSearchSystem.updateDocument(type, id, document);
const removeDocument = (type, id) => enhancedSearchSystem.removeDocument(type, id);
const rebuildIndex = () => enhancedSearchSystem.rebuildIndex();
const getSearchStats = () => enhancedSearchSystem.getSearchStats();
const clearCache = () => enhancedSearchSystem.clearCache();
const getCacheStats = () => enhancedSearchSystem.getCacheStats();
const setCacheTimeouts = (searchTimeout, facetTimeout) => enhancedSearchSystem.setCacheTimeouts(searchTimeout, facetTimeout);

module.exports = {
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
};
