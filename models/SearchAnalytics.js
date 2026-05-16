/**
 * Search Analytics Model
 * 
 * Tracks search performance, usage patterns, and user behavior
 * for search optimization and insights.
 */

const mongoose = require('mongoose');

const searchAnalyticsSchema = new mongoose.Schema({
  // Event type
  type: {
    type: String,
    required: true,
    enum: ['search', 'click', 'filter', 'save_search', 'export', 'suggestion_click'],
    index: true
  },
  
  // Search details
  query: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  processedQuery: {
    type: String,
    trim: true
  },
  
  // User and session information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  userAgent: {
    type: String,
    maxlength: 500
  },
  ipAddress: {
    type: String,
    maxlength: 45
  },
  
  // Search configuration
  searchConfig: {
    contentType: {
      type: String,
      enum: ['all', 'ticket', 'user', 'comment', 'document', 'report']
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    options: {
      limit: Number,
      offset: Number,
      sort: mongoose.Schema.Types.Mixed,
      highlight: Boolean,
      fuzzy: Boolean,
      facets: Boolean
    }
  },
  
  // Performance metrics
  resultCount: {
    type: Number,
    default: 0,
    min: 0
  },
  took: {
    type: Number,
    default: 0,
    min: 0
  },
  cacheHit: {
    type: Boolean,
    default: false
  },
  
  // User interaction metrics
  clickedResults: [{
    resultId: String,
    resultType: String,
    position: Number,
    clickTime: Date
  }],
  clickedFilters: [{
    filterType: String,
    filterValue: String,
    clickTime: Date
  }],
  
  // Results analysis
  resultTypes: [{
    type: String,
    count: Number
  }],
  facets: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Quality metrics
  bounceRate: {
    type: Boolean,
    default: false
  },
  sessionDuration: {
    type: Number,
    default: 0
  },
  satisfaction: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  date: {
    type: Date,
    default: function() {
      return new Date(this.timestamp);
    },
    index: true
  }
}, {
  timestamps: true,
  collection: 'search_analytics'
});

// Indexes for optimal query performance
searchAnalyticsSchema.index({ timestamp: -1 });
searchAnalyticsSchema.index({ type: 1, timestamp: -1 });
searchAnalyticsSchema.index({ userId: 1, timestamp: -1 });
searchAnalyticsSchema.index({ query: 1, timestamp: -1 });
searchAnalyticsSchema.index({ date: 1, type: 1 });
searchAnalyticsSchema.index({ 'searchConfig.contentType': 1, timestamp: -1 });
searchAnalyticsSchema.index({ resultCount: 1, timestamp: -1 });
searchAnalyticsSchema.index({ took: 1, timestamp: -1 });

// Compound indexes for common queries
searchAnalyticsSchema.index({ type: 1, date: 1 });
searchAnalyticsSchema.index({ userId: 1, type: 1, timestamp: -1 });
searchAnalyticsSchema.index({ query: 1, userId: 1, timestamp: -1 });

// Static methods
searchAnalyticsSchema.statics = {
  /**
   * Record search event
   */
  async recordSearch(searchData) {
    try {
      const analytics = new this({
        type: 'search',
        ...searchData,
        date: new Date(searchData.timestamp || Date.now())
      });
      
      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Record search error:', error);
      throw error;
    }
  },
  
  /**
   * Record click event
   */
  async recordClick(clickData) {
    try {
      const analytics = new this({
        type: 'click',
        ...clickData,
        date: new Date(clickData.timestamp || Date.now())
      });
      
      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Record click error:', error);
      throw error;
    }
  },
  
  /**
   * Record filter event
   */
  async recordFilter(filterData) {
    try {
      const analytics = new this({
        type: 'filter',
        ...filterData,
        date: new Date(filterData.timestamp || Date.now())
      });
      
      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Record filter error:', error);
      throw error;
    }
  },
  
  /**
   * Record saved search event
   */
  async recordSavedSearch(saveData) {
    try {
      const analytics = new this({
        type: 'save_search',
        ...saveData,
        date: new Date(saveData.timestamp || Date.now())
      });
      
      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Record saved search error:', error);
      throw error;
    }
  },
  
  /**
   * Record suggestion click
   */
  async recordSuggestionClick(suggestionData) {
    try {
      const analytics = new this({
        type: 'suggestion_click',
        ...suggestionData,
        date: new Date(suggestionData.timestamp || Date.now())
      });
      
      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Record suggestion click error:', error);
      throw error;
    }
  },
  
  /**
   * Get search analytics summary
   */
  async getSearchSummary(timeRange = '7d') {
    try {
      const startDate = this.getDateRange(timeRange);
      
      const summary = await this.aggregate([
        { $match: { 
          type: 'search',
          timestamp: { $gte: startDate }
        }},
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            uniqueQueries: { $addToSet: '$query' },
            uniqueUsers: { $addToSet: '$userId' },
            avgResultCount: { $avg: '$resultCount' },
            avgResponseTime: { $avg: '$took' },
            totalResults: { $sum: '$resultCount' },
            cacheHits: { $sum: { $cond: [{ $eq: ['$cacheHit', true] }, 1, 0] } },
            bounces: { $sum: { $cond: [{ $eq: ['$bounceRate', true] }, 1, 0] } }
          }
        },
        {
          $project: {
            totalSearches: 1,
            uniqueQueryCount: { $size: '$uniqueQueries' },
            uniqueUserCount: { $size: '$uniqueUsers' },
            avgResultCount: { $round: ['$avgResultCount', 2] },
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            totalResults: 1,
            cacheHitRate: { $round: [{ $divide: ['$cacheHits', '$totalSearches'] }, 4] },
            bounceRate: { $round: [{ $divide: ['$bounces', '$totalSearches'] }, 4] }
          }
        }
      ]);
      
      return summary[0] || {
        totalSearches: 0,
        uniqueQueryCount: 0,
        uniqueUserCount: 0,
        avgResultCount: 0,
        avgResponseTime: 0,
        totalResults: 0,
        cacheHitRate: 0,
        bounceRate: 0
      };
    } catch (error) {
      console.error('Get search summary error:', error);
      return {
        totalSearches: 0,
        uniqueQueryCount: 0,
        uniqueUserCount: 0,
        avgResultCount: 0,
        avgResponseTime: 0,
        totalResults: 0,
        cacheHitRate: 0,
        bounceRate: 0
      };
    }
  },
  
  /**
   * Get popular search queries
   */
  async getPopularQueries(timeRange = '7d', limit = 20) {
    try {
      const startDate = this.getDateRange(timeRange);
      
      const popular = await this.aggregate([
        { $match: { 
          type: 'search',
          timestamp: { $gte: startDate }
        }},
        {
          $group: {
            _id: '$query',
            count: { $sum: 1 },
            avgResults: { $avg: '$resultCount' },
            avgResponseTime: { $avg: '$took' },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            query: '$_id',
            count: 1,
            avgResults: { $round: ['$avgResults', 2] },
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            uniqueUserCount: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);
      
      return popular;
    } catch (error) {
      console.error('Get popular queries error:', error);
      return [];
    }
  },
  
  /**
   * Get search performance metrics
   */
  async getPerformanceMetrics(timeRange = '7d') {
    try {
      const startDate = this.getDateRange(timeRange);
      
      const metrics = await this.aggregate([
        { $match: { 
          type: 'search',
          timestamp: { $gte: startDate }
        }},
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$took' },
            minResponseTime: { $min: '$took' },
            maxResponseTime: { $max: '$took' },
            p50ResponseTime: { $percentile: { $array: ['$took'], $p: [0.5] } },
            p95ResponseTime: { $percentile: { $array: ['$took'], $p: [0.95] } },
            p99ResponseTime: { $percentile: { $array: ['$took'], $p: [0.99] } },
            cacheHitRate: { $avg: { $cond: [{ $eq: ['$cacheHit', true] }, 1, 0] } },
            avgResultCount: { $avg: '$resultCount' }
          }
        }
      ]);
      
      return metrics[0] || {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        cacheHitRate: 0,
        avgResultCount: 0
      };
    } catch (error) {
      console.error('Get performance metrics error:', error);
      return {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        cacheHitRate: 0,
        avgResultCount: 0
      };
    }
  },
  
  /**
   * Get search trends over time
   */
  async getSearchTrends(timeRange = '30d', granularity = 'day') {
    try {
      const startDate = this.getDateRange(timeRange);
      const groupBy = this.getGroupByGranularity(granularity);
      
      const trends = await this.aggregate([
        { $match: { 
          type: 'search',
          timestamp: { $gte: startDate }
        }},
        {
          $group: {
            _id: groupBy,
            searches: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
            avgResponseTime: { $avg: '$took' },
            avgResults: { $avg: '$resultCount' }
          }
        },
        {
          $project: {
            date: '$_id',
            searches: 1,
            uniqueUserCount: { $size: '$uniqueUsers' },
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            avgResults: { $round: ['$avgResults', 2] }
          }
        },
        { $sort: { date: 1 } }
      ]);
      
      return trends;
    } catch (error) {
      console.error('Get search trends error:', error);
      return [];
    }
  },
  
  /**
   * Get content type analytics
   */
  async getContentTypeAnalytics(timeRange = '7d') {
    try {
      const startDate = this.getDateRange(timeRange);
      
      const analytics = await this.aggregate([
        { $match: { 
          type: 'search',
          timestamp: { $gte: startDate }
        }},
        {
          $group: {
            _id: '$searchConfig.contentType',
            searches: { $sum: 1 },
            avgResults: { $avg: '$resultCount' },
            avgResponseTime: { $avg: '$took' },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            contentType: '$_id',
            searches: 1,
            avgResults: { $round: ['$avgResults', 2] },
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            uniqueUserCount: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { searches: -1 } }
      ]);
      
      return analytics;
    } catch (error) {
      console.error('Get content type analytics error:', error);
      return [];
    }
  },
  
  /**
   * Get user search behavior
   */
  async getUserSearchBehavior(userId, timeRange = '30d') {
    try {
      const startDate = this.getDateRange(timeRange);
      
      const behavior = await this.aggregate([
        { $match: { 
          userId,
          timestamp: { $gte: startDate }
        }},
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            uniqueQueries: { $addToSet: '$query' },
            avgResults: { $avg: '$resultCount' },
            avgResponseTime: { $avg: '$took' },
            savedSearches: { $sum: { $cond: [{ $eq: ['$type', 'save_search'] }, 1, 0] } },
            clicks: { $sum: { $cond: [{ $eq: ['$type', 'click'] }, 1, 0] } },
            lastSearch: { $max: '$timestamp' }
          }
        },
        {
          $project: {
            totalSearches: 1,
            uniqueQueryCount: { $size: '$uniqueQueries' },
            avgResults: { $round: ['$avgResults', 2] },
            avgResponseTime: { $round: ['$avgResponseTime', 2] },
            savedSearches: 1,
            clicks: 1,
            lastSearch: 1
          }
        }
      ]);
      
      return behavior[0] || {
        totalSearches: 0,
        uniqueQueryCount: 0,
        avgResults: 0,
        avgResponseTime: 0,
        savedSearches: 0,
        clicks: 0,
        lastSearch: null
      };
    } catch (error) {
      console.error('Get user search behavior error:', error);
      return {
        totalSearches: 0,
        uniqueQueryCount: 0,
        avgResults: 0,
        avgResponseTime: 0,
        savedSearches: 0,
        clicks: 0,
        lastSearch: null
      };
    }
  },
  
  /**
   * Get filter usage analytics
   */
  async getFilterUsageAnalytics(timeRange = '7d') {
    try {
      const startDate = this.getDateRange(timeRange);
      
      const analytics = await this.aggregate([
        { $match: { 
          type: 'filter',
          timestamp: { $gte: startDate }
        }},
        {
          $group: {
            _id: '$clickedFilters.filterType',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            filterType: '$_id',
            count: 1,
            uniqueUserCount: { $size: '$uniqueUsers' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      return analytics;
    } catch (error) {
      console.error('Get filter usage analytics error:', error);
      return [];
    }
  },
  
  /**
   * Helper method to get date range
   */
  getDateRange(timeRange) {
    const now = new Date();
    const range = timeRange.match(/(\d+)([hdwmy])/);
    
    if (!range) {
      return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // Default to 7 days
    }
    
    const value = parseInt(range[1]);
    const unit = range[2];
    
    let milliseconds;
    switch (unit) {
      case 'h': milliseconds = value * 60 * 60 * 1000; break;
      case 'd': milliseconds = value * 24 * 60 * 60 * 1000; break;
      case 'w': milliseconds = value * 7 * 24 * 60 * 60 * 1000; break;
      case 'm': milliseconds = value * 30 * 24 * 60 * 60 * 1000; break;
      case 'y': milliseconds = value * 365 * 24 * 60 * 60 * 1000; break;
      default: milliseconds = 7 * 24 * 60 * 60 * 1000;
    }
    
    return new Date(now.getTime() - milliseconds);
  },
  
  /**
   * Helper method to get group by granularity
   */
  getGroupByGranularity(granularity) {
    switch (granularity) {
      case 'hour':
        return {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
      case 'day':
        return {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
      case 'week':
        return {
          year: { $year: '$timestamp' },
          week: { $week: '$timestamp' }
        };
      case 'month':
        return {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' }
        };
      default:
        return {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
    }
  }
};

// Instance methods
searchAnalyticsSchema.methods = {
  /**
   * Add clicked result
   */
  addClickedResult(resultId, resultType, position) {
    this.clickedResults.push({
      resultId,
      resultType,
      position,
      clickTime: new Date()
    });
    return this;
  },
  
  /**
   * Add clicked filter
   */
  addClickedFilter(filterType, filterValue) {
    this.clickedFilters.push({
      filterType,
      filterValue,
      clickTime: new Date()
    });
    return this;
  },
  
  /**
   * Mark as bounce
   */
  markAsBounce() {
    this.bounceRate = true;
    return this;
  },
  
  /**
   * Set satisfaction score
   */
  setSatisfaction(score) {
    this.satisfaction = Math.max(1, Math.min(5, score));
    return this;
  }
};

// Middleware
searchAnalyticsSchema.pre('save', function(next) {
  // Ensure date field is set
  if (!this.date) {
    this.date = new Date(this.timestamp);
  }
  
  // Ensure processedQuery is set
  if (!this.processedQuery && this.query) {
    this.processedQuery = this.query.toLowerCase().trim();
  }
  
  next();
});

module.exports = mongoose.model('SearchAnalytics', searchAnalyticsSchema);
