/**
 * Saved Search Model
 * 
 * Manages user-saved search queries with filters and preferences
 * for quick access to frequently used searches.
 */

const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema({
  // User identification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  
  // Search details
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  
  // Search configuration
  filters: {
    contentType: {
      type: String,
      enum: ['all', 'ticket', 'user', 'comment', 'document', 'report'],
      default: 'all'
    },
    status: [String],
    priority: [String],
    category: [String],
    department: [String],
    role: [String],
    tags: [String],
    dateRange: {
      from: Date,
      to: Date
    },
    assignedTo: [mongoose.Schema.Types.ObjectId],
    createdBy: [mongoose.Schema.Types.ObjectId]
  },
  
  // Search options
  options: {
    limit: {
      type: Number,
      default: 20,
      min: 1,
      max: 100
    },
    sort: {
      field: {
        type: String,
        default: 'relevance'
      },
      order: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc'
      }
    },
    highlight: {
      type: Boolean,
      default: true
    },
    fuzzy: {
      type: Boolean,
      default: true
    },
    facets: {
      type: Boolean,
      default: true
    }
  },
  
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date
  },
  
  // Search performance metrics
  avgResultCount: {
    type: Number,
    default: 0,
    min: 0
  },
  avgResponseTime: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Visibility and sharing
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  
  // Organization and categorization
  category: {
    type: String,
    trim: true,
    maxlength: 50
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  
  // Status and lifecycle
  isActive: {
    type: Boolean,
    default: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'saved_searches'
});

// Indexes for optimal performance
savedSearchSchema.index({ userId: 1, isActive: 1 });
savedSearchSchema.index({ userId: 1, isFavorite: 1 });
savedSearchSchema.index({ userId: 1, lastUsed: -1 });
savedSearchSchema.index({ userId: 1, usageCount: -1 });
savedSearchSchema.index({ isPublic: 1, isActive: 1 });
savedSearchSchema.index({ query: 'text', name: 'text', description: 'text' });
savedSearchSchema.index({ category: 1, isActive: 1 });
savedSearchSchema.index({ tags: 1, isActive: 1 });

// Static methods
savedSearchSchema.statics = {
  /**
   * Create new saved search
   */
  async createSavedSearch(userId, searchData) {
    try {
      const savedSearch = new this({
        userId,
        ...searchData
      });
      
      await savedSearch.save();
      return savedSearch;
    } catch (error) {
      console.error('Create saved search error:', error);
      throw new Error('Failed to create saved search');
    }
  },
  
  /**
   * Get user's saved searches
   */
  async getUserSavedSearches(userId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        category,
        tags,
        isFavorite,
        isActive = true
      } = options;
      
      const query = { userId, isActive };
      
      if (category) query.category = category;
      if (tags && tags.length > 0) query.tags = { $in: tags };
      if (typeof isFavorite === 'boolean') query.isFavorite = isFavorite;
      
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const savedSearches = await this.find(query)
        .sort(sort)
        .limit(limit)
        .skip(offset)
        .lean();
      
      return savedSearches;
    } catch (error) {
      console.error('Get user saved searches error:', error);
      return [];
    }
  },
  
  /**
   * Get public saved searches
   */
  async getPublicSavedSearches(options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        sortBy = 'usageCount',
        sortOrder = 'desc',
        category,
        tags
      } = options;
      
      const query = { isPublic: true, isActive: true };
      
      if (category) query.category = category;
      if (tags && tags.length > 0) query.tags = { $in: tags };
      
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const savedSearches = await this.find(query)
        .populate('userId', 'name email')
        .sort(sort)
        .limit(limit)
        .skip(offset)
        .lean();
      
      return savedSearches;
    } catch (error) {
      console.error('Get public saved searches error:', error);
      return [];
    }
  },
  
  /**
   * Update saved search
   */
  async updateSavedSearch(searchId, userId, updateData) {
    try {
      const savedSearch = await this.findOneAndUpdate(
        { _id: searchId, userId },
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      return savedSearch;
    } catch (error) {
      console.error('Update saved search error:', error);
      throw new Error('Failed to update saved search');
    }
  },
  
  /**
   * Delete saved search
   */
  async deleteSavedSearch(searchId, userId) {
    try {
      const result = await this.deleteOne({ _id: searchId, userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Delete saved search error:', error);
      throw new Error('Failed to delete saved search');
    }
  },
  
  /**
   * Increment usage count
   */
  async incrementUsage(searchId, userId, resultCount = 0, responseTime = 0) {
    try {
      const updateData = {
        $inc: { usageCount: 1 },
        lastUsed: new Date()
      };
      
      // Update performance metrics
      if (resultCount > 0) {
        updateData.avgResultCount = {
          $avg: [{ $multiply: ['$avgResultCount', '$usageCount'] }, resultCount]
        };
      }
      
      if (responseTime > 0) {
        updateData.avgResponseTime = {
          $avg: [{ $multiply: ['$avgResponseTime', '$usageCount'] }, responseTime]
        };
      }
      
      const result = await this.updateOne(
        { _id: searchId, userId },
        updateData
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Increment usage error:', error);
      return false;
    }
  },
  
  /**
   * Get search categories for user
   */
  async getUserCategories(userId) {
    try {
      const categories = await this.distinct('category', {
        userId,
        isActive: true,
        category: { $ne: null, $ne: '' }
      });
      
      return categories.sort();
    } catch (error) {
      console.error('Get user categories error:', error);
      return [];
    }
  },
  
  /**
   * Get popular saved searches
   */
  async getPopularSavedSearches(limit = 10) {
    try {
      const popular = await this.find({ isPublic: true, isActive: true })
        .populate('userId', 'name email')
        .sort({ usageCount: -1 })
        .limit(limit)
        .lean();
      
      return popular;
    } catch (error) {
      console.error('Get popular saved searches error:', error);
      return [];
    }
  },
  
  /**
   * Search saved searches
   */
  async searchSavedSearches(userId, query, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        includePublic = false
      } = options;
      
      const searchQuery = {
        $and: [
          { isActive: true },
          {
            $or: [
              { userId },
              ...(includePublic ? [{ isPublic: true }] : [])
            ]
          },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { query: { $regex: query, $options: 'i' } },
              { tags: { $in: [new RegExp(query, 'i')] } }
            ]
          }
        ]
      };
      
      const results = await this.find(searchQuery)
        .populate('userId', 'name email')
        .sort({ usageCount: -1, lastUsed: -1 })
        .limit(limit)
        .skip(offset)
        .lean();
      
      return results;
    } catch (error) {
      console.error('Search saved searches error:', error);
      return [];
    }
  },
  
  /**
   * Get search statistics
   */
  async getSearchStatistics(userId) {
    try {
      const stats = await this.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalSearches: { $sum: 1 },
            activeSearches: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            favoriteSearches: { $sum: { $cond: [{ $eq: ['$isFavorite', true] }, 1, 0] } },
            publicSearches: { $sum: { $cond: [{ $eq: ['$isPublic', true] }, 1, 0] } },
            totalUsage: { $sum: '$usageCount' },
            avgResults: { $avg: '$avgResultCount' },
            avgResponseTime: { $avg: '$avgResponseTime' },
            lastUsed: { $max: '$lastUsed' }
          }
        }
      ]);
      
      return stats[0] || {
        totalSearches: 0,
        activeSearches: 0,
        favoriteSearches: 0,
        publicSearches: 0,
        totalUsage: 0,
        avgResults: 0,
        avgResponseTime: 0,
        lastUsed: null
      };
    } catch (error) {
      console.error('Get search statistics error:', error);
      return {
        totalSearches: 0,
        activeSearches: 0,
        favoriteSearches: 0,
        publicSearches: 0,
        totalUsage: 0,
        avgResults: 0,
        avgResponseTime: 0,
        lastUsed: null
      };
    }
  }
};

// Instance methods
savedSearchSchema.methods = {
  /**
   * Toggle favorite status
   */
  async toggleFavorite() {
    this.isFavorite = !this.isFavorite;
    this.updatedAt = new Date();
    return await this.save();
  },
  
  /**
   * Add tag
   */
  async addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
      return await this.save();
    }
    return this;
  },
  
  /**
   * Remove tag
   */
  async removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
      return await this.save();
    }
    return this;
  },
  
  /**
   * Share with user
   */
  async shareWith(userId, permission = 'view') {
    const existingShare = this.sharedWith.find(s => s.userId.toString() === userId.toString());
    
    if (!existingShare) {
      this.sharedWith.push({ userId, permission });
      this.updatedAt = new Date();
      return await this.save();
    }
    
    return this;
  },
  
  /**
   * Unshare from user
   */
  async unshareFrom(userId) {
    this.sharedWith = this.sharedWhere.filter(s => s.userId.toString() !== userId.toString());
    this.updatedAt = new Date();
    return await this.save();
  },
  
  /**
   * Check if user has access
   */
  hasAccess(userId, permission = 'view') {
    // Owner has full access
    if (this.userId.toString() === userId.toString()) {
      return true;
    }
    
    // Check if public
    if (this.isPublic && permission === 'view') {
      return true;
    }
    
    // Check shared access
    const share = this.sharedWith.find(s => s.userId.toString() === userId.toString());
    if (share) {
      return permission === 'view' || share.permission === 'edit';
    }
    
    return false;
  },
  
  /**
   * Get search URL
   */
  getSearchUrl() {
    const params = new URLSearchParams();
    params.set('q', this.query);
    
    if (this.filters.contentType !== 'all') {
      params.set('type', this.filters.contentType);
    }
    
    Object.keys(this.filters).forEach(key => {
      const value = this.filters[key];
      if (value && (Array.isArray(value) ? value.length > 0 : value !== null)) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
    });
    
    return `/search?${params.toString()}`;
  }
};

// Middleware
savedSearchSchema.pre('save', function(next) {
  // Ensure query is trimmed
  if (this.query) {
    this.query = this.query.trim();
  }
  
  // Ensure name is unique per user
  if (this.isNew && this.name) {
    this.constructor.findOne({ 
      userId: this.userId, 
      name: this.name, 
      isActive: true 
    }).then(existing => {
      if (existing) {
        next(new Error('A saved search with this name already exists'));
      } else {
        next();
      }
    }).catch(next);
  } else {
    next();
  }
});

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
