/**
 * Search Service
 * 
 * Comprehensive search service for the NEXUS platform
 * providing full-text search, advanced filtering, and search analytics.
 */

const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const SearchIndex = require('../models/SearchIndex');
const SearchAnalytics = require('../models/SearchAnalytics');
const SavedSearch = require('../models/SavedSearch');

class SearchService {
  constructor() {
    this.searchConfig = {
      minQueryLength: 2,
      maxResults: 50,
      defaultLimit: 20,
      highlightTags: ['<mark>', '</mark>'],
      fuzzyThreshold: 0.7,
      synonymMapping: new Map()
    };
    
    this.initializeSynonyms();
  }

  /**
   * Initialize synonym mappings for enhanced search
   */
  initializeSynonyms() {
    const synonyms = {
      'bug': ['issue', 'problem', 'defect', 'error'],
      'feature': ['enhancement', 'request', 'improvement'],
      'urgent': ['critical', 'high', 'important'],
      'help': ['support', 'assistance', 'guidance'],
      'fix': ['resolve', 'solve', 'repair', 'patch'],
      'update': ['modify', 'change', 'edit', 'revise'],
      'create': ['add', 'new', 'make', 'generate'],
      'delete': ['remove', 'erase', 'eliminate', 'destroy'],
      'test': ['verify', 'validate', 'check', 'examine'],
      'deploy': ['release', 'publish', 'launch', 'ship']
    };

    Object.keys(synonyms).forEach(term => {
      this.searchConfig.synonymMapping.set(term.toLowerCase(), synonyms[term]);
    });
  }

  /**
   * Perform comprehensive search across all content types
   */
  async search(query, options = {}) {
    const {
      type = 'all',
      limit = this.searchConfig.defaultLimit,
      offset = 0,
      filters = {},
      sort = { relevance: -1 },
      highlight = true,
      fuzzy = true
    } = options;

    try {
      // Validate query
      if (!query || query.length < this.searchConfig.minQueryLength) {
        return {
          results: [],
          total: 0,
          suggestions: [],
          took: 0,
          query
        };
      }

      const startTime = Date.now();

      // Process query and extract terms
      const processedQuery = this.processQuery(query, fuzzy);
      
      // Build search criteria
      const searchCriteria = this.buildSearchCriteria(processedQuery, type, filters);
      
      // Execute search
      const results = await this.executeSearch(searchCriteria, sort, limit, offset);
      
      // Apply highlighting if requested
      if (highlight) {
        results.forEach(result => {
          result.highlight = this.applyHighlighting(result, processedQuery.terms);
        });
      }

      // Calculate relevance scores
      const scoredResults = this.calculateRelevanceScores(results, processedQuery);
      
      // Sort by relevance
      scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Get suggestions
      const suggestions = await this.getSuggestions(query, type);

      const took = Date.now() - startTime;

      // Log search analytics
      await this.logSearchAnalytics(query, options, scoredResults.length, took);

      return {
        results: scoredResults.slice(offset, offset + limit),
        total: scoredResults.length,
        suggestions,
        took,
        query,
        filters,
        facets: await this.getFacets(searchCriteria, type)
      };

    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search operation failed');
    }
  }

  /**
   * Process search query with tokenization and expansion
   */
  processQuery(query, fuzzy = true) {
    const terms = query.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length >= this.searchConfig.minQueryLength);

    const expandedTerms = new Set(terms);

    // Add synonyms
    terms.forEach(term => {
      const synonyms = this.searchConfig.synonymMapping.get(term);
      if (synonyms) {
        synonyms.forEach(synonym => expandedTerms.add(synonym));
      }
    });

    // Add fuzzy variations if enabled
    if (fuzzy) {
      terms.forEach(term => {
        const fuzzyTerms = this.getFuzzyVariations(term);
        fuzzyTerms.forEach(fuzzyTerm => expandedTerms.add(fuzzyTerm));
      });
    }

    return {
      original: query,
      terms: Array.from(expandedTerms),
      originalTerms: terms
    };
  }

  /**
   * Get fuzzy variations of a term
   */
  getFuzzyVariations(term) {
    const variations = [];
    
    // Common misspellings and variations
    const commonVariations = {
      'ticket': ['ticke', 'tcket', 'tiket'],
      'user': ['usr', 'use', 'uesr'],
      'issue': ['issu', 'isue', 'issu'],
      'status': ['statu', 'staus', 'stats'],
      'priority': ['priorit', 'priorty', 'priorirty']
    };

    if (commonVariations[term]) {
      variations.push(...commonVariations[term]);
    }

    // Add character-level variations (simple approach)
    if (term.length > 3) {
      // Remove one character at each position
      for (let i = 0; i < term.length; i++) {
        variations.push(term.slice(0, i) + term.slice(i + 1));
      }
    }

    return variations.filter(v => v.length >= this.searchConfig.minQueryLength);
  }

  /**
   * Build search criteria based on query and filters
   */
  buildSearchCriteria(processedQuery, type, filters) {
    const criteria = {
      $and: []
    };

    // Text search
    const textSearch = {
      $or: [
        { title: { $regex: processedQuery.terms.join('|'), $options: 'i' } },
        { description: { $regex: processedQuery.terms.join('|'), $options: 'i' } },
        { content: { $regex: processedQuery.terms.join('|'), $options: 'i' } }
      ]
    };

    criteria.$and.push(textSearch);

    // Content type filtering
    if (type !== 'all') {
      criteria.$and.push({ contentType: type });
    }

    // Apply additional filters
    Object.keys(filters).forEach(filterKey => {
      if (filters[filterKey] && filters[filterKey].length > 0) {
        if (Array.isArray(filters[filterKey])) {
          criteria.$and.push({ [filterKey]: { $in: filters[filterKey] } });
        } else {
          criteria.$and.push({ [filterKey]: filters[filterKey] });
        }
      }
    });

    return criteria;
  }

  /**
   * Execute search against different content types
   */
  async executeSearch(criteria, sort, limit, offset) {
    const results = [];

    // Search tickets
    const ticketResults = await this.searchTickets(criteria, sort, limit, offset);
    results.push(...ticketResults.map(result => ({ ...result, type: 'ticket' })));

    // Search users
    const userResults = await this.searchUsers(criteria, sort, limit, offset);
    results.push(...userResults.map(result => ({ ...result, type: 'user' })));

    // Search comments
    const commentResults = await this.searchComments(criteria, sort, limit, offset);
    results.push(...commentResults.map(result => ({ ...result, type: 'comment' })));

    return results;
  }

  /**
   * Search tickets
   */
  async searchTickets(criteria, sort, limit, offset) {
    try {
      const tickets = await Ticket.find(criteria)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort(sort)
        .limit(limit)
        .skip(offset)
        .lean();

      return tickets.map(ticket => ({
        id: ticket._id,
        title: ticket.title,
        description: ticket.description,
        content: `${ticket.title} ${ticket.description}`,
        metadata: {
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          assignedTo: ticket.assignedTo,
          createdBy: ticket.createdBy,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt
        }
      }));
    } catch (error) {
      console.error('Ticket search error:', error);
      return [];
    }
  }

  /**
   * Search users
   */
  async searchUsers(criteria, sort, limit, offset) {
    try {
      const users = await User.find(criteria)
        .select('name email role department isActive')
        .sort(sort)
        .limit(limit)
        .skip(offset)
        .lean();

      return users.map(user => ({
        id: user._id,
        title: user.name,
        description: `${user.role} - ${user.department || 'No department'}`,
        content: `${user.name} ${user.email} ${user.role} ${user.department || ''}`,
        metadata: {
          email: user.email,
          role: user.role,
          department: user.department,
          isActive: user.isActive
        }
      }));
    } catch (error) {
      console.error('User search error:', error);
      return [];
    }
  }

  /**
   * Search comments
   */
  async searchComments(criteria, sort, limit, offset) {
    try {
      // This would require a Comment model - for now, simulate with ticket comments
      const tickets = await Ticket.find(criteria)
        .populate('comments.author', 'name email')
        .sort(sort)
        .limit(limit)
        .skip(offset)
        .lean();

      const comments = [];
      tickets.forEach(ticket => {
        if (ticket.comments && ticket.comments.length > 0) {
          ticket.comments.forEach(comment => {
            comments.push({
              id: comment._id,
              title: `Comment on ${ticket.title}`,
              description: comment.content,
              content: comment.content,
              metadata: {
                ticketId: ticket._id,
                ticketTitle: ticket.title,
                author: comment.author,
                createdAt: comment.createdAt
              }
            });
          });
        }
      });

      return comments;
    } catch (error) {
      console.error('Comment search error:', error);
      return [];
    }
  }

  /**
   * Apply highlighting to search results
   */
  applyHighlighting(result, terms) {
    const highlight = {};
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');

    ['title', 'description', 'content'].forEach(field => {
      if (result[field]) {
        const highlighted = result[field].replace(regex, 
          `${this.searchConfig.highlightTags[0]}$1${this.searchConfig.highlightTags[1]}`
        );
        highlight[field] = highlighted;
      }
    });

    return highlight;
  }

  /**
   * Calculate relevance scores for search results
   */
  calculateRelevanceScores(results, processedQuery) {
    return results.map(result => {
      let score = 0;
      const content = `${result.title} ${result.description} ${result.content}`.toLowerCase();
      
      // Score based on term matches
      processedQuery.terms.forEach(term => {
        const termCount = (content.match(new RegExp(term, 'g')) || []).length;
        score += termCount * 10;
      });

      // Bonus for title matches
      processedQuery.terms.forEach(term => {
        if (result.title.toLowerCase().includes(term)) {
          score += 50;
        }
      });

      // Bonus for exact phrase matches
      if (content.includes(processedQuery.original.toLowerCase())) {
        score += 100;
      }

      // Bonus for recent content
      if (result.metadata.createdAt) {
        const daysSinceCreation = (Date.now() - new Date(result.metadata.createdAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) {
          score += 20;
        } else if (daysSinceCreation < 30) {
          score += 10;
        }
      }

      // Bonus for active users
      if (result.type === 'user' && result.metadata.isActive) {
        score += 30;
      }

      // Bonus for high priority tickets
      if (result.type === 'ticket' && result.metadata.priority === 'high') {
        score += 25;
      }

      return {
        ...result,
        relevanceScore: score
      };
    });
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query, type = 'all') {
    try {
      const suggestions = [];
      
      // Get recent searches
      const recentSearches = await SearchAnalytics.find({ type: 'search' })
        .sort({ timestamp: -1 })
        .limit(5)
        .distinct('query');

      suggestions.push(...recentSearches.filter(search => 
        search.toLowerCase().includes(query.toLowerCase())
      ));

      // Get popular searches
      const popularSearches = await SearchAnalytics.aggregate([
        { $match: { type: 'search' } },
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      suggestions.push(...popularSearches.map(item => item._id).filter(search => 
        search.toLowerCase().includes(query.toLowerCase())
      ));

      // Remove duplicates and limit
      return [...new Set(suggestions)].slice(0, 5);
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  /**
   * Get search facets
   */
  async getFacets(criteria, type) {
    try {
      const facets = {};

      // Status facet
      if (type === 'all' || type === 'ticket') {
        const statusFacet = await Ticket.aggregate([
          { $match: criteria },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        facets.status = statusFacet;
      }

      // Priority facet
      if (type === 'all' || type === 'ticket') {
        const priorityFacet = await Ticket.aggregate([
          { $match: criteria },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        facets.priority = priorityFacet;
      }

      // Category facet
      if (type === 'all' || type === 'ticket') {
        const categoryFacet = await Ticket.aggregate([
          { $match: criteria },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        facets.category = categoryFacet;
      }

      // Role facet
      if (type === 'all' || type === 'user') {
        const roleFacet = await User.aggregate([
          { $match: criteria },
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        facets.role = roleFacet;
      }

      return facets;
    } catch (error) {
      console.error('Facets error:', error);
      return {};
    }
  }

  /**
   * Log search analytics
   */
  async logSearchAnalytics(query, options, resultCount, took) {
    try {
      await SearchAnalytics.create({
        type: 'search',
        query,
        options,
        resultCount,
        took,
        timestamp: new Date(),
        userAgent: options.userAgent,
        userId: options.userId
      });
    } catch (error) {
      console.error('Analytics logging error:', error);
    }
  }

  /**
   * Save search query for user
   */
  async saveSearch(userId, query, name, filters = {}) {
    try {
      const savedSearch = await SavedSearch.create({
        userId,
        query,
        name,
        filters,
        createdAt: new Date()
      });

      return savedSearch;
    } catch (error) {
      console.error('Save search error:', error);
      throw new Error('Failed to save search');
    }
  }

  /**
   * Get user's saved searches
   */
  async getSavedSearches(userId) {
    try {
      const savedSearches = await SavedSearch.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      return savedSearches;
    } catch (error) {
      console.error('Get saved searches error:', error);
      return [];
    }
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(userId, searchId) {
    try {
      const result = await SavedSearch.deleteOne({ 
        _id: searchId, 
        userId 
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Delete saved search error:', error);
      throw new Error('Failed to delete saved search');
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(timeRange = '7d') {
    try {
      const startDate = new Date();
      const days = parseInt(timeRange.replace('d', ''));
      startDate.setDate(startDate.getDate() - days);

      const analytics = await SearchAnalytics.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: {
          _id: null,
          totalSearches: { $sum: 1 },
          avgResultCount: { $avg: '$resultCount' },
          avgResponseTime: { $avg: '$took' },
          uniqueQueries: { $addToSet: '$query' }
        }},
        { $project: {
          totalSearches: 1,
          avgResultCount: { $round: ['$avgResultCount', 2] },
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          uniqueQueryCount: { $size: '$uniqueQueries' }
        }}
      ]);

      return analytics[0] || {
        totalSearches: 0,
        avgResultCount: 0,
        avgResponseTime: 0,
        uniqueQueryCount: 0
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      return {
        totalSearches: 0,
        avgResultCount: 0,
        avgResponseTime: 0,
        uniqueQueryCount: 0
      };
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(limit = 10) {
    try {
      const popular = await SearchAnalytics.aggregate([
        { $group: {
          _id: '$query',
          count: { $sum: 1 },
          avgResults: { $avg: '$resultCount' }
        }},
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      return popular;
    } catch (error) {
      console.error('Get popular searches error:', error);
      return [];
    }
  }

  /**
   * Get search performance metrics
   */
  async getSearchPerformance() {
    try {
      const performance = await SearchAnalytics.aggregate([
        { $group: {
          _id: null,
          avgResponseTime: { $avg: '$took' },
          maxResponseTime: { $max: '$took' },
          minResponseTime: { $min: '$took' },
          p95ResponseTime: { $percentile: { $array: ['$took'], $p: [0.95] } }
        }}
      ]);

      return performance[0] || {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        p95ResponseTime: 0
      };
    } catch (error) {
      console.error('Get performance error:', error);
      return {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        p95ResponseTime: 0
      };
    }
  }
}

module.exports = new SearchService();
