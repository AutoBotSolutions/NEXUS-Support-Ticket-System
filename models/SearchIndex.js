/**
 * Search Index Model
 * 
 * Manages search indexing for tickets, users, and other content
 * with automatic indexing and optimization.
 */

const mongoose = require('mongoose');

const searchIndexSchema = new mongoose.Schema({
  // Content identification
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  contentType: {
    type: String,
    required: true,
    enum: ['Ticket', 'User', 'Comment', 'Document', 'Report'],
    index: true
  },
  
  // Searchable content
  title: {
    type: String,
    required: true,
    text: true
  },
  description: {
    type: String,
    text: true
  },
  content: {
    type: String,
    required: true,
    text: true
  },
  
  // Metadata for filtering and faceting
  metadata: {
    status: { type: String, index: true },
    priority: { type: String, index: true },
    category: { type: String, index: true },
    tags: [{ type: String, index: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: String, index: true },
    role: { type: String, index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  
  // Search optimization
  keywords: [{
    term: { type: String, required: true },
    weight: { type: Number, default: 1.0, min: 0, max: 10 },
    type: { type: String, enum: ['title', 'description', 'content', 'tag', 'custom'] }
  }],
  
  // Relevance scoring
  relevanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Timestamps
  indexedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  contentCreatedAt: {
    type: Date,
    required: true,
    index: true
  },
  contentUpdatedAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Index status
  status: {
    type: String,
    enum: ['pending', 'indexed', 'updating', 'error'],
    default: 'pending',
    index: true
  },
  
  // Indexing errors
  errors: [{
    message: String,
    timestamp: { type: Date, default: Date.now },
    stack: String
  }],
  
  // Search analytics
  searchCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastSearched: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'search_index'
});

// Indexes for optimal search performance
searchIndexSchema.index({ contentType: 1, status: 1 });
searchIndexSchema.index({ keywords: 'text', title: 'text', description: 'text', content: 'text' });
searchIndexSchema.index({ relevanceScore: -1 });
searchIndexSchema.index({ contentCreatedAt: -1 });
searchIndexSchema.index({ lastUpdated: -1 });
searchIndexSchema.index({ searchCount: -1 });

// Compound indexes for common queries
searchIndexSchema.index({ contentType: 1, 'metadata.status': 1 });
searchIndexSchema.index({ contentType: 1, 'metadata.priority': 1 });
searchIndexSchema.index({ contentType: 1, 'metadata.category': 1 });

// Static methods for index management
searchIndexSchema.statics = {
  /**
   * Create or update search index entry
   */
  async indexContent(contentData) {
    try {
      const { contentId, contentType, title, description, content, metadata } = contentData;
      
      // Check if already indexed
      const existing = await this.findOne({ contentId, contentType });
      
      if (existing) {
        // Update existing index
        return await this.updateIndex(existing._id, contentData);
      } else {
        // Create new index entry
        return await this.createIndex(contentData);
      }
    } catch (error) {
      console.error('Index content error:', error);
      throw error;
    }
  },
  
  /**
   * Create new search index entry
   */
  async createIndex(contentData) {
    try {
      const processedData = this.processContentData(contentData);
      const indexEntry = new this(processedData);
      
      // Generate keywords and calculate relevance
      indexEntry.keywords = this.generateKeywords(contentData);
      indexEntry.relevanceScore = this.calculateRelevanceScore(contentData);
      
      await indexEntry.save();
      return indexEntry;
    } catch (error) {
      console.error('Create index error:', error);
      throw error;
    }
  },
  
  /**
   * Update existing search index entry
   */
  async updateIndex(indexId, contentData) {
    try {
      const processedData = this.processContentData(contentData);
      const updateData = {
        ...processedData,
        keywords: this.generateKeywords(contentData),
        relevanceScore: this.calculateRelevanceScore(contentData),
        lastUpdated: new Date(),
        status: 'indexed',
        $unset: { errors: 1 }
      };
      
      const result = await this.findByIdAndUpdate(
        indexId,
        updateData,
        { new: true, runValidators: true }
      );
      
      return result;
    } catch (error) {
      console.error('Update index error:', error);
      throw error;
    }
  },
  
  /**
   * Process and validate content data
   */
  processContentData(contentData) {
    const { title, description, content, metadata = {} } = contentData;
    
    return {
      contentId: contentData.contentId,
      contentType: contentData.contentType,
      title: this.sanitizeText(title),
      description: this.sanitizeText(description),
      content: this.sanitizeText(content),
      metadata: {
        ...metadata,
        tags: metadata.tags || []
      },
      contentCreatedAt: contentData.contentCreatedAt || new Date(),
      contentUpdatedAt: contentData.contentUpdatedAt || new Date()
    };
  },
  
  /**
   * Generate keywords for search optimization
   */
  generateKeywords(contentData) {
    const keywords = [];
    const { title, description, content, metadata = {} } = contentData;
    
    // Title keywords (highest weight)
    if (title) {
      const titleWords = this.extractWords(title);
      titleWords.forEach(word => {
        keywords.push({
          term: word,
          weight: 10,
          type: 'title'
        });
      });
    }
    
    // Description keywords (high weight)
    if (description) {
      const descWords = this.extractWords(description);
      descWords.forEach(word => {
        keywords.push({
          term: word,
          weight: 7,
          type: 'description'
        });
      });
    }
    
    // Content keywords (medium weight)
    if (content) {
      const contentWords = this.extractWords(content);
      contentWords.forEach(word => {
        keywords.push({
          term: word,
          weight: 5,
          type: 'content'
        });
      });
    }
    
    // Tag keywords (high weight)
    if (metadata.tags && metadata.tags.length > 0) {
      metadata.tags.forEach(tag => {
        keywords.push({
          term: tag.toLowerCase(),
          weight: 8,
          type: 'tag'
        });
      });
    }
    
    // Remove duplicates and sort by weight
    const uniqueKeywords = {};
    keywords.forEach(kw => {
      if (!uniqueKeywords[kw.term] || uniqueKeywords[kw.term].weight < kw.weight) {
        uniqueKeywords[kw.term] = kw;
      }
    });
    
    return Object.values(uniqueKeywords).sort((a, b) => b.weight - a.weight);
  },
  
  /**
   * Calculate relevance score for content
   */
  calculateRelevanceScore(contentData) {
    let score = 0;
    const { title, description, content, metadata = {} } = contentData;
    
    // Base score
    score += 20;
    
    // Title quality
    if (title && title.length > 10) {
      score += 15;
    }
    
    // Description quality
    if (description && description.length > 50) {
      score += 10;
    }
    
    // Content quality
    if (content && content.length > 100) {
      score += 10;
    }
    
    // Metadata completeness
    if (metadata.status) score += 5;
    if (metadata.priority) score += 5;
    if (metadata.category) score += 5;
    if (metadata.tags && metadata.tags.length > 0) score += 5;
    
    // Recency bonus
    const now = new Date();
    const contentAge = (now - (contentData.contentCreatedAt || now)) / (1000 * 60 * 60 * 24);
    if (contentAge < 7) score += 10;
    else if (contentAge < 30) score += 5;
    
    return Math.min(score, 100);
  },
  
  /**
   * Extract words from text
   */
  extractWords(text) {
    if (!text) return [];
    
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2)
      .filter(word => !this.isStopWord(word));
  },
  
  /**
   * Check if word is a stop word
   */
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
      'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
      'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
      'one', 'all', 'would', 'there', 'their', 'what', 'so',
      'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
      'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
      'him', 'know', 'take', 'people', 'into', 'year', 'your',
      'good', 'some', 'could', 'them', 'see', 'other', 'than',
      'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
      'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
      'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
      'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been',
      'has', 'had', 'were', 'said', 'did', 'having', 'may', 'am'
    ]);
    
    return stopWords.has(word);
  },
  
  /**
   * Sanitize text for indexing
   */
  sanitizeText(text) {
    if (!text) return '';
    
    return text
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  },
  
  /**
   * Remove content from index
   */
  async removeFromIndex(contentId, contentType) {
    try {
      const result = await this.deleteOne({ contentId, contentType });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Remove from index error:', error);
      throw error;
    }
  },
  
  /**
   * Get index statistics
   */
  async getIndexStats() {
    try {
      const stats = await this.aggregate([
        {
          $group: {
            _id: '$contentType',
            count: { $sum: 1 },
            indexed: { $sum: { $cond: [{ $eq: ['$status', 'indexed'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            errors: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } }
          }
        }
      ]);
      
      return stats;
    } catch (error) {
      console.error('Get index stats error:', error);
      return [];
    }
  },
  
  /**
   * Optimize index performance
   */
  async optimizeIndex() {
    try {
      // Remove old error entries
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      await this.deleteMany({
        status: 'error',
        lastUpdated: { $lt: thirtyDaysAgo }
      });
      
      // Update search counts for relevance
      await this.updateMany(
        { searchCount: { $gt: 0 } },
        { $inc: { relevanceScore: 1 } }
      );
      
      return true;
    } catch (error) {
      console.error('Optimize index error:', error);
      throw error;
    }
  }
};

// Instance methods
searchIndexSchema.methods = {
  /**
   * Increment search count
   */
  async incrementSearchCount() {
    this.searchCount += 1;
    this.lastSearched = new Date();
    return await this.save();
  },
  
  /**
   * Mark as error
   */
  async markError(errorMessage, stack) {
    this.status = 'error';
    this.errors.push({
      message: errorMessage,
      stack,
      timestamp: new Date()
    });
    return await this.save();
  },
  
  /**
   * Get keyword weights
   */
  getKeywordWeights() {
    return this.keywords.reduce((acc, kw) => {
      acc[kw.term] = kw.weight;
      return acc;
    }, {});
  }
};

// Middleware
searchIndexSchema.pre('save', function(next) {
  this.indexedAt = new Date();
  next();
});

searchIndexSchema.pre('update', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('SearchIndex', searchIndexSchema);
