/**
 * Search Routes
 * API endpoints for comprehensive search functionality
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const auth = require('../middleware/auth');

/**
 * Search documents
 * GET /api/search
 */
router.get('/', auth, searchController.search);

/**
 * Get search suggestions
 * GET /api/search/suggestions
 */
router.get('/suggestions', auth, searchController.getSuggestions);

/**
 * Save search query
 * POST /api/search/save
 */
router.post('/save', auth, searchController.saveSearch);

/**
 * Get user's saved searches
 * GET /api/search/saved
 */
router.get('/saved', auth, searchController.getSavedSearches);

/**
 * Update saved search
 * PUT /api/search/saved/:searchId
 */
router.put('/saved/:searchId', auth, searchController.updateSavedSearch);

/**
 * Delete saved search
 * DELETE /api/search/saved/:searchId
 */
router.delete('/saved/:searchId', auth, searchController.deleteSavedSearch);

/**
 * Get search history
 * GET /api/search/history
 */
router.get('/history', auth, searchController.getSearchHistory);

/**
 * Get search analytics
 * GET /api/search/analytics
 */
router.get('/analytics', auth, searchController.getSearchAnalytics);

/**
 * Get user search behavior
 * GET /api/search/behavior
 */
router.get('/behavior', auth, searchController.getUserSearchBehavior);

/**
 * Get search index statistics (admin only)
 * GET /api/search/index/stats
 */
router.get('/index/stats', auth, searchController.getIndexStats);

/**
 * Rebuild search index (admin only)
 * POST /api/search/index/rebuild
 */
router.post('/index/rebuild', auth, searchController.rebuildIndex);

/**
 * Validate search index (admin only)
 * GET /api/search/index/validate
 */
router.get('/index/validate', auth, searchController.validateIndex);

/**
 * Get public saved searches
 * GET /api/search/public
 */
router.get('/public', searchController.getPublicSavedSearches);

/**
 * Search within saved searches
 * GET /api/search/saved-search
 */
router.get('/saved-search', auth, searchController.searchSavedSearches);

/**
 * Advanced search with filters
 * POST /api/search/advanced
 */
router.post('/advanced', auth, searchController.search);

/**
 * Search tickets specifically
 * GET /api/search/tickets
 */
router.get('/tickets', auth, (req, res) => {
  req.query.type = 'ticket';
  searchController.search(req, res);
});

/**
 * Search users specifically
 * GET /api/search/users
 */
router.get('/users', auth, (req, res) => {
  req.query.type = 'user';
  searchController.search(req, res);
});

/**
 * Search comments specifically
 * GET /api/search/comments
 */
router.get('/comments', auth, (req, res) => {
  req.query.type = 'comment';
  searchController.search(req, res);
});

module.exports = router;
