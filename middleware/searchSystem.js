/**
 * NEXUS Search System
 * Comprehensive search with full-text search, indexing, and analytics
 */

const Ticket = require('../models/Ticket');
const User = require('../models/User');

class SearchSystem {
  constructor() {
    this.index = new Map();
    this.searchHistory = new Map();
    this.searchAnalytics = new Map();
    this.fuzzyThreshold = 0.8;
    this.maxResults = 100;
    
    this.initializeSearchIndex();
  }

  initializeSearchIndex() {
    // Initialize search index with existing data
    this.rebuildIndex();
  }

  async rebuildIndex() {
    console.log('Rebuilding search index...');
    
    try {
      // Clear existing index
      this.index.clear();
      
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
      
      console.log(`Search index rebuilt with ${this.index.size} documents`);
    } catch (error) {
      console.error('Error rebuilding search index:', error);
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
      indexedAt: Date.now()
    };
    
    this.index.set(docId, indexedDoc);
  }

  extractSearchableText(document) {
    const textFields = [];
    
    // Extract text from common fields
    if (document.title) textFields.push(document.title);
    if (document.description) textFields.push(document.description);
    if (document.username) textFields.push(document.username);
    if (document.email) textFields.push(document.email);
    if (document.content) textFields.push(document.content);
    
    // Extract text from nested objects
    if (document.comments && Array.isArray(document.comments)) {
      document.comments.forEach(comment => {
        if (comment.text) textFields.push(comment.text);
      });
    }
    
    // Extract text from arrays
    if (document.tags && Array.isArray(document.tags)) {
      textFields.push(...document.tags);
    }
    
    return textFields.join(' ').toLowerCase();
  }

  extractKeywords(document) {
    const text = this.extractSearchableText(document);
    const keywords = new Set();
    
    // Split into words and remove common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why',
      'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
      'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
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

  async search(query, options = {}) {
    const {
      type = null,
      limit = this.maxResults,
      offset = 0,
      sortBy = 'relevance',
      filters = {},
      fuzzy = true
    } = options;

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
          highlights: this.generateHighlights(normalizedQuery, indexedDoc)
        });
      }
    }
    
    // Sort results
    results = this.sortResults(results, sortBy);
    
    // Apply pagination
    const paginatedResults = results.slice(offset, offset + limit);
    
    return {
      query,
      total: results.length,
      results: paginatedResults,
      hasMore: offset + limit < results.length,
      analytics: this.getSearchAnalytics(query)
    };
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
    
    return highlights;
  }

  highlightText(text, queryWords) {
    const highlighted = text;
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
        topQueries: new Map()
      });
    }
    
    const analytics = this.searchAnalytics.get(dateKey);
    analytics.totalSearches++;
    analytics.uniqueQueries.add(query);
    
    // Update top queries
    const currentCount = analytics.topQueries.get(query) || 0;
    analytics.topQueries.set(query, currentCount + 1);
    
    // Calculate average query length
    const totalLength = Array.from(analytics.uniqueQueries)
      .reduce((sum, q) => sum + q.length, 0);
    analytics.avgQueryLength = Math.round(totalLength / analytics.uniqueQueries.size);
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
    const userHistory = this.searchHistory.get(userId) || [];
    return userHistory.slice(0, limit);
  }

  async addDocument(type, id, document) {
    this.indexDocument(type, id, document);
  }

  async updateDocument(type, id, document) {
    const docId = `${type}:${id}`;
    
    if (this.index.has(docId)) {
      this.index.delete(docId);
    }
    
    this.indexDocument(type, id, document);
  }

  async removeDocument(type, id) {
    const docId = `${type}:${id}`;
    this.index.delete(docId);
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
      indexedAt: Date.now()
    };
  }
}

// Create singleton instance
const searchSystem = new SearchSystem();

// Export functions
const search = (query, options) => searchSystem.search(query, options);
const getSearchSuggestions = (query, type) => searchSystem.getSearchSuggestions(query, type);
const getPopularQueries = (type, limit) => searchSystem.getPopularQueries(type, limit);
const getUserSearchHistory = (userId, limit) => searchSystem.getUserSearchHistory(userId, limit);
const addDocument = (type, id, document) => searchSystem.addDocument(type, id, document);
const updateDocument = (type, id, document) => searchSystem.updateDocument(type, id, document);
const removeDocument = (type, id) => searchSystem.removeDocument(type, id);
const rebuildIndex = () => searchSystem.rebuildIndex();
const getSearchStats = () => searchSystem.getSearchStats();

module.exports = {
  searchSystem,
  search,
  getSearchSuggestions,
  getPopularQueries,
  getUserSearchHistory,
  addDocument,
  updateDocument,
  removeDocument,
  rebuildIndex,
  getSearchStats
};
