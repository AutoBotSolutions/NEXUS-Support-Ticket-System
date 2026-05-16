/**
 * Enhanced Search Routes
 * API endpoints for comprehensive search functionality with advanced features
 */

const express = require('express');
const router = express.Router();
const {
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
const auth = require('../middleware/auth');

// Middleware to authenticate all search routes
router.use(auth);

/**
 * Search documents with basic features
 * GET /api/search
 */
router.get('/', async (req, res) => {
  try {
    const {
      q: query,
      type,
      limit = 20,
      offset = 0,
      sort = 'relevance',
      filters = {},
      fuzzy = true,
      facets = false,
      highlight = true
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Parse filters
    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid filters format'
        });
      }
    }

    const searchOptions = {
      type,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort,
      filters: parsedFilters,
      fuzzy: fuzzy === 'true',
      facets: facets === 'true',
      highlight: highlight === 'true',
      userId: req.user.userId
    };

    const results = await search(query, searchOptions);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Advanced search with aggregations and enhanced features
 * GET /api/search/advanced
 */
router.get('/advanced', async (req, res) => {
  try {
    const {
      q: query,
      type,
      limit = 20,
      offset = 0,
      sort = 'relevance',
      filters = {},
      fuzzy = true,
      facets = true,
      highlight = true,
      aggregations = {}
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Parse filters
    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid filters format'
        });
      }
    }

    // Parse aggregations
    let parsedAggregations = {};
    if (aggregations) {
      try {
        parsedAggregations = typeof aggregations === 'string' ? JSON.parse(aggregations) : aggregations;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid aggregations format'
        });
      }
    }

    const searchOptions = {
      type,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort,
      filters: parsedFilters,
      fuzzy: fuzzy === 'true',
      facets: facets === 'true',
      highlight: highlight === 'true',
      aggregations: parsedAggregations,
      userId: req.user.userId
    };

    const results = await advancedSearch(query, searchOptions);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get search suggestions
 * GET /api/search/suggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, type } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await getSearchSuggestions(query, type);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get popular queries
 * GET /api/search/popular
 */
router.get('/popular', async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;

    const popularQueries = await getPopularQueries(type, parseInt(limit));

    res.status(200).json({
      success: true,
      data: popularQueries
    });
  } catch (error) {
    console.error('Popular queries error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get user search history
 * GET /api/search/history
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const history = getUserSearchHistory(req.user.userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Search history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get search statistics
 * GET /api/search/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = getSearchStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Search stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get cache statistics
 * GET /api/search/cache/stats
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = getCacheStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Clear search cache
 * POST /api/search/cache/clear
 */
router.post('/cache/clear', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    clearCache();

    res.status(200).json({
      success: true,
      message: 'Search cache cleared successfully'
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Set cache timeouts
 * POST /api/search/cache/timeout
 */
router.post('/cache/timeout', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { searchTimeout, facetTimeout } = req.body;

    if (!searchTimeout || !facetTimeout) {
      return res.status(400).json({
        success: false,
        error: 'Both searchTimeout and facetTimeout are required'
      });
    }

    setCacheTimeouts(parseInt(searchTimeout), parseInt(facetTimeout));

    res.status(200).json({
      success: true,
      message: 'Cache timeouts updated successfully'
    });
  } catch (error) {
    console.error('Set cache timeout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Rebuild search index
 * POST /api/search/rebuild
 */
router.post('/rebuild', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    await rebuildIndex();

    res.status(200).json({
      success: true,
      message: 'Search index rebuilt successfully'
    });
  } catch (error) {
    console.error('Rebuild index error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Add document to search index
 * POST /api/search/documents
 */
router.post('/documents', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { type, id, document } = req.body;

    if (!type || !id || !document) {
      return res.status(400).json({
        success: false,
        error: 'Type, id, and document are required'
      });
    }

    await addDocument(type, id, document);

    res.status(200).json({
      success: true,
      message: 'Document added to search index successfully'
    });
  } catch (error) {
    console.error('Add document error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Update document in search index
 * PUT /api/search/documents/:type/:id
 */
router.put('/documents/:type/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { type, id } = req.params;
    const { document } = req.body;

    if (!document) {
      return res.status(400).json({
        success: false,
        error: 'Document is required'
      });
    }

    await updateDocument(type, id, document);

    res.status(200).json({
      success: true,
      message: 'Document updated in search index successfully'
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Remove document from search index
 * DELETE /api/search/documents/:type/:id
 */
router.delete('/documents/:type/:id', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { type, id } = req.params;

    await removeDocument(type, id);

    res.status(200).json({
      success: true,
      message: 'Document removed from search index successfully'
    });
  } catch (error) {
    console.error('Remove document error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Search with specific filters
 * GET /api/search/tickets
 */
router.get('/tickets', async (req, res) => {
  try {
    const {
      q: query,
      status,
      priority,
      category,
      assignedTo,
      createdBy,
      limit = 20,
      offset = 0,
      sort = 'relevance'
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (createdBy) filters.createdBy = createdBy;

    const searchOptions = {
      type: 'ticket',
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort,
      filters,
      facets: true,
      highlight: true,
      userId: req.user.userId
    };

    const results = await search(query, searchOptions);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Ticket search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Search users with specific filters
 * GET /api/search/users
 */
router.get('/users', async (req, res) => {
  try {
    const {
      q: query,
      role,
      isActive,
      isEmailVerified,
      isPhoneVerified,
      limit = 20,
      offset = 0,
      sort = 'relevance'
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const filters = {};
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isEmailVerified !== undefined) filters.isEmailVerified = isEmailVerified === 'true';
    if (isPhoneVerified !== undefined) filters.isPhoneVerified = isPhoneVerified === 'true';

    const searchOptions = {
      type: 'user',
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort,
      filters,
      facets: true,
      highlight: true,
      userId: req.user.userId
    };

    const results = await search(query, searchOptions);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Search teams with specific filters
 * GET /api/search/teams
 */
router.get('/teams', async (req, res) => {
  try {
    const {
      q: query,
      isActive,
      isPublic,
      ownerId,
      limit = 20,
      offset = 0,
      sort = 'relevance'
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
    if (ownerId) filters.ownerId = ownerId;

    const searchOptions = {
      type: 'team',
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort,
      filters,
      facets: true,
      highlight: true,
      userId: req.user.userId
    };

    const results = await search(query, searchOptions);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Team search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Global search across all document types
 * GET /api/search/global
 */
router.get('/global', async (req, res) => {
  try {
    const {
      q: query,
      limit = 20,
      offset = 0,
      sort = 'relevance',
      filters = {},
      fuzzy = true,
      facets = true,
      highlight = true
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Parse filters
    let parsedFilters = {};
    if (filters) {
      try {
        parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid filters format'
        });
      }
    }

    const searchOptions = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sort,
      filters: parsedFilters,
      fuzzy: fuzzy === 'true',
      facets: facets === 'true',
      highlight: highlight === 'true',
      userId: req.user.userId
    };

    const results = await search(query, searchOptions);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Search analytics endpoint
 * GET /api/search/analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { period = 'today' } = req.query;
    
    let analytics = {};
    
    switch (period) {
      case 'today':
        analytics = getSearchStats();
        break;
      case 'week':
        // Implement weekly analytics
        analytics = getSearchStats();
        break;
      case 'month':
        // Implement monthly analytics
        analytics = getSearchStats();
        break;
      default:
        analytics = getSearchStats();
    }

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
