/**
 * Search Controller
 * 
 * Handles all search-related API endpoints including
 * search queries, suggestions, saved searches, and analytics.
 */

const searchService = require('../services/searchService');
const SavedSearch = require('../models/SavedSearch');
const SearchAnalytics = require('../models/SearchAnalytics');
const searchIndexer = require('../utils/searchIndexer');

class SearchController {
  constructor() {
    this.searchConfig = {
      defaultLimit: 20,
      maxLimit: 100,
      maxQueryLength: 500,
      cacheTimeout: 300000 // 5 minutes
    };
  }

  /**
   * Perform search
   */
  async search(req, res) {
    try {
      const startTime = Date.now();
      
      // Validate query
      const { q: query, type, limit, offset, filters, sort, highlight, fuzzy } = req.query;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
          timestamp: new Date().toISOString()
        });
      }
      
      if (query.length > this.searchConfig.maxQueryLength) {
        return res.status(400).json({
          success: false,
          error: 'Query too long',
          timestamp: new Date().toISOString()
        });
      }
      
      // Parse and validate parameters
      const searchOptions = {
        type: type || 'all',
        limit: Math.min(parseInt(limit) || this.searchConfig.defaultLimit, this.searchConfig.maxLimit),
        offset: parseInt(offset) || 0,
        filters: this.parseFilters(filters),
        sort: this.parseSort(sort),
        highlight: highlight !== 'false',
        fuzzy: fuzzy !== 'false',
        userId: req.user?.id,
        userAgent: req.get('User-Agent')
      };
      
      // Perform search
      const results = await searchService.search(query, searchOptions);
      
      // Record search analytics
      await SearchAnalytics.recordSearch({
        query,
        processedQuery: results.query,
        userId: req.user?.id,
        sessionId: req.sessionID,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        searchConfig: {
          contentType: searchOptions.type,
          filters: searchOptions.filters,
          options: {
            limit: searchOptions.limit,
            offset: searchOptions.offset,
            sort: searchOptions.sort,
            highlight: searchOptions.highlight,
            fuzzy: searchOptions.fuzzy
          }
        },
        resultCount: results.total,
        took: results.took,
        resultTypes: this.getResultTypes(results.results),
        facets: results.facets
      });
      
      // Add pagination info
      const pagination = {
        limit: searchOptions.limit,
        offset: searchOptions.offset,
        total: results.total,
        hasMore: results.total > searchOptions.offset + searchOptions.limit,
        currentPage: Math.floor(searchOptions.offset / searchOptions.limit) + 1,
        totalPages: Math.ceil(results.total / searchOptions.limit)
      };
      
      res.json({
        success: true,
        data: {
          query: results.query,
          results: results.results,
          suggestions: results.suggestions,
          facets: results.facets,
          pagination,
          performance: {
            took: results.took,
            cached: results.cached || false
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        error: 'Search operation failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(req, res) {
    try {
      const { q: query, type = 'all', limit = 5 } = req.query;
      
      if (!query || query.length < 2) {
        return res.json({
          success: true,
          data: { suggestions: [] },
          timestamp: new Date().toISOString()
        });
      }
      
      const suggestions = await searchService.getSuggestions(query, type);
      
      // Record suggestion analytics
      await SearchAnalytics.recordSuggestionClick({
        query,
        userId: req.user?.id,
        sessionId: req.sessionID,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });
      
      res.json({
        success: true,
        data: {
          suggestions: suggestions.slice(0, parseInt(limit))
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get suggestions',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Save search query
   */
  async saveSearch(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }
      
      const { name, query, description, filters, options, category, tags, isPublic } = req.body;
      
      // Validate required fields
      if (!name || !query) {
        return res.status(400).json({
          success: false,
          error: 'Name and query are required',
          timestamp: new Date().toISOString()
        });
      }
      
      const savedSearch = await searchService.saveSearch(userId, query, name, {
        description,
        filters: filters || {},
        options: options || {},
        category,
        tags: tags || [],
        isPublic: isPublic || false
      });
      
      // Record saved search analytics
      await SearchAnalytics.recordSavedSearch({
        query,
        userId,
        sessionId: req.sessionID,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      });
      
      res.status(201).json({
        success: true,
        data: savedSearch,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Save search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save search',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get user's saved searches
   */
  async getSavedSearches(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }
      
      const { limit, offset, sortBy, sortOrder, category, tags, isFavorite } = req.query;
      
      const savedSearches = await SavedSearch.getUserSavedSearches(userId, {
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        sortBy: sortBy || 'updatedAt',
        sortOrder: sortOrder || 'desc',
        category,
        tags: tags ? tags.split(',') : undefined,
        isFavorite: isFavorite === 'true'
      });
      
      res.json({
        success: true,
        data: savedSearches,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get saved searches error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get saved searches',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update saved search
   */
  async updateSavedSearch(req, res) {
    try {
      const userId = req.user?.id;
      const { searchId } = req.params;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }
      
      const { name, description, filters, options, category, tags, isPublic, isFavorite } = req.body;
      
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (filters !== undefined) updateData.filters = filters;
      if (options !== undefined) updateData.options = options;
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = tags;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
      
      const savedSearch = await SavedSearch.updateSavedSearch(searchId, userId, updateData);
      
      if (!savedSearch) {
        return res.status(404).json({
          success: false,
          error: 'Saved search not found',
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        data: savedSearch,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Update saved search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update saved search',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(req, res) {
    try {
      const userId = req.user?.id;
      const { searchId } = req.params;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }
      
      const deleted = await SavedSearch.deleteSavedSearch(searchId, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Saved search not found',
          timestamp: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        message: 'Saved search deleted successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Delete saved search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete saved search',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get search history
   */
  async getSearchHistory(req, res) {
    try {
      const userId = req.user?.id;
      const { limit = 20, offset = 0 } = req.query;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }
      
      const history = await SearchAnalytics.find({
        type: 'search',
        userId,
        timestamp: { $gte: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)) } // Last 30 days
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('query timestamp resultCount took')
      .lean();
      
      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get search history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get search history',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(req, res) {
    try {
      const { timeRange = '7d', type = 'summary' } = req.query;
      
      let analytics;
      
      switch (type) {
        case 'summary':
          analytics = await searchService.getSearchAnalytics(timeRange);
          break;
        case 'popular':
          analytics = await searchService.getPopularSearches(20);
          break;
        case 'performance':
          analytics = await searchService.getSearchPerformance();
          break;
        case 'trends':
          analytics = await SearchAnalytics.getSearchTrends(timeRange);
          break;
        case 'contentTypes':
          analytics = await SearchAnalytics.getContentTypeAnalytics(timeRange);
          break;
        case 'filters':
          analytics = await SearchAnalytics.getFilterUsageAnalytics(timeRange);
          break;
        default:
          analytics = await searchService.getSearchAnalytics(timeRange);
      }
      
      res.json({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get search analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get search analytics',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get user search behavior
   */
  async getUserSearchBehavior(req, res) {
    try {
      const userId = req.user?.id;
      const { timeRange = '30d' } = req.query;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }
      
      const behavior = await SearchAnalytics.getUserSearchBehavior(userId, timeRange);
      
      res.json({
        success: true,
        data: behavior,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get user search behavior error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user search behavior',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get search index statistics
   */
  async getIndexStats(req, res) {
    try {
      const stats = await searchIndexer.getIndexStats();
      
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get index stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get index statistics',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Rebuild search index
   */
  async rebuildIndex(req, res) {
    try {
      const { contentType } = req.body;
      
      if (!contentType) {
        return res.status(400).json({
          success: false,
          error: 'Content type is required',
          timestamp: new Date().toISOString()
        });
      }
      
      // Check if user has admin permissions
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin permissions required',
          timestamp: new Date().toISOString()
        });
      }
      
      const result = await searchIndexer.rebuildIndex(contentType);
      
      res.json({
        success: true,
        data: result,
        message: `Index rebuild for ${contentType} completed`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Rebuild index error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to rebuild index',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate search index
   */
  async validateIndex(req, res) {
    try {
      // Check if user has admin permissions
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin permissions required',
          timestamp: new Date().toISOString()
        });
      }
      
      const validation = await searchIndexer.validateIndex();
      
      res.json({
        success: true,
        data: validation,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Validate index error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate index',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get public saved searches
   */
  async getPublicSavedSearches(req, res) {
    try {
      const { limit = 20, offset = 0, category, tags } = req.query;
      
      const publicSearches = await SavedSearch.getPublicSavedSearches({
        limit: parseInt(limit),
        offset: parseInt(offset),
        category,
        tags: tags ? tags.split(',') : undefined
      });
      
      res.json({
        success: true,
        data: publicSearches,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get public saved searches error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get public saved searches',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Search within saved searches
   */
  async searchSavedSearches(req, res) {
    try {
      const userId = req.user?.id;
      const { q: query, includePublic = false } = req.query;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
      }
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
          timestamp: new Date().toISOString()
        });
      }
      
      const results = await SavedSearch.searchSavedSearches(userId, query, {
        includePublic: includePublic === 'true'
      });
      
      res.json({
        success: true,
        data: results,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Search saved searches error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search saved searches',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Helper method to parse filters
   */
  parseFilters(filters) {
    if (!filters) return {};
    
    try {
      if (typeof filters === 'string') {
        return JSON.parse(filters);
      }
      return filters;
    } catch (error) {
      console.error('Filter parsing error:', error);
      return {};
    }
  }

  /**
   * Helper method to parse sort
   */
  parseSort(sort) {
    if (!sort) return { relevance: -1 };
    
    try {
      if (typeof sort === 'string') {
        const [field, order] = sort.split(':');
        return { [field]: order === 'asc' ? 1 : -1 };
      }
      return sort;
    } catch (error) {
      console.error('Sort parsing error:', error);
      return { relevance: -1 };
    }
  }

  /**
   * Helper method to get result types
   */
  getResultTypes(results) {
    const types = {};
    
    results.forEach(result => {
      const type = result.type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });
    
    return Object.keys(types).map(type => ({
      type,
      count: types[type]
    }));
  }
}

module.exports = new SearchController();
