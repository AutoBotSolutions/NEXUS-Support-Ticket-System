/**
 * Search Indexer Utility
 * 
 * Manages automated content indexing, optimization, and
 * synchronization for the search system.
 */

const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const SearchIndex = require('../models/SearchIndex');
const SearchAnalytics = require('../models/SearchAnalytics');

class SearchIndexer {
  constructor() {
    this.indexingConfig = {
      batchSize: 100,
      maxRetries: 3,
      retryDelay: 5000,
      indexingInterval: 60000, // 1 minute
      optimizationInterval: 3600000, // 1 hour
      cleanupInterval: 86400000 // 24 hours
    };
    
    this.isIndexing = false;
    this.indexingQueue = [];
    this.processingQueue = false;
  }

  /**
   * Initialize the indexer
   */
  async initialize() {
    try {
      console.log('🔍 Initializing Search Indexer...');
      
      // Start periodic indexing
      this.startPeriodicIndexing();
      
      // Start optimization
      this.startPeriodicOptimization();
      
      // Start cleanup
      this.startPeriodicCleanup();
      
      console.log('✅ Search Indexer initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Search Indexer:', error);
      throw error;
    }
  }

  /**
   * Index all content
   */
  async indexAllContent() {
    try {
      console.log('🔄 Starting full content indexing...');
      
      const indexingResults = {
        tickets: { indexed: 0, errors: 0 },
        users: { indexed: 0, errors: 0 },
        comments: { indexed: 0, errors: 0 }
      };

      // Index tickets
      indexingResults.tickets = await this.indexTickets();
      
      // Index users
      indexingResults.users = await this.indexUsers();
      
      // Index comments
      indexingResults.comments = await this.indexComments();
      
      console.log('✅ Full content indexing completed:', indexingResults);
      return indexingResults;
    } catch (error) {
      console.error('❌ Full content indexing failed:', error);
      throw error;
    }
  }

  /**
   * Index tickets
   */
  async indexTickets(options = {}) {
    const { batchSize = this.indexingConfig.batchSize } = options;
    let indexed = 0;
    let errors = 0;
    
    try {
      const totalTickets = await Ticket.countDocuments();
      console.log(`📄 Indexing ${totalTickets} tickets...`);
      
      for (let skip = 0; skip < totalTickets; skip += batchSize) {
        const tickets = await Ticket.find({})
          .populate('assignedTo', 'name email')
          .populate('createdBy', 'name email')
          .skip(skip)
          .limit(batchSize)
          .lean();
        
        for (const ticket of tickets) {
          try {
            await this.indexTicket(ticket);
            indexed++;
          } catch (error) {
            console.error(`❌ Failed to index ticket ${ticket._id}:`, error);
            errors++;
          }
        }
        
        // Progress update
        const progress = Math.min(((skip + batchSize) / totalTickets) * 100, 100);
        process.stdout.write(`\r📊 Progress: ${progress.toFixed(1)}%`);
      }
      
      console.log(`\n✅ Tickets indexed: ${indexed}, Errors: ${errors}`);
      return { indexed, errors };
    } catch (error) {
      console.error('❌ Ticket indexing failed:', error);
      throw error;
    }
  }

  /**
   * Index a single ticket
   */
  async indexTicket(ticket) {
    const contentData = {
      contentId: ticket._id,
      contentType: 'Ticket',
      title: ticket.title,
      description: ticket.description,
      content: `${ticket.title} ${ticket.description} ${ticket.comments?.map(c => c.content).join(' ') || ''}`,
      metadata: {
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        tags: ticket.tags || [],
        assignedTo: ticket.assignedTo?._id,
        createdBy: ticket.createdBy?._id
      },
      contentCreatedAt: ticket.createdAt,
      contentUpdatedAt: ticket.updatedAt
    };

    return await SearchIndex.indexContent(contentData);
  }

  /**
   * Index users
   */
  async indexUsers(options = {}) {
    const { batchSize = this.indexingConfig.batchSize } = options;
    let indexed = 0;
    let errors = 0;
    
    try {
      const totalUsers = await User.countDocuments();
      console.log(`👥 Indexing ${totalUsers} users...`);
      
      for (let skip = 0; skip < totalUsers; skip += batchSize) {
        const users = await User.find({})
          .select('name email role department isActive profile')
          .skip(skip)
          .limit(batchSize)
          .lean();
        
        for (const user of users) {
          try {
            await this.indexUser(user);
            indexed++;
          } catch (error) {
            console.error(`❌ Failed to index user ${user._id}:`, error);
            errors++;
          }
        }
        
        // Progress update
        const progress = Math.min(((skip + batchSize) / totalUsers) * 100, 100);
        process.stdout.write(`\r📊 Progress: ${progress.toFixed(1)}%`);
      }
      
      console.log(`\n✅ Users indexed: ${indexed}, Errors: ${errors}`);
      return { indexed, errors };
    } catch (error) {
      console.error('❌ User indexing failed:', error);
      throw error;
    }
  }

  /**
   * Index a single user
   */
  async indexUser(user) {
    const contentData = {
      contentId: user._id,
      contentType: 'User',
      title: user.name,
      description: `${user.role} - ${user.department || 'No department'}`,
      content: `${user.name} ${user.email} ${user.role} ${user.department || ''} ${user.profile?.bio || ''}`,
      metadata: {
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        tags: user.profile?.skills || []
      },
      contentCreatedAt: user.createdAt,
      contentUpdatedAt: user.updatedAt
    };

    return await SearchIndex.indexContent(contentData);
  }

  /**
   * Index comments
   */
  async indexComments(options = {}) {
    const { batchSize = this.indexingConfig.batchSize } = options;
    let indexed = 0;
    let errors = 0;
    
    try {
      // Get all tickets with comments
      const tickets = await Ticket.find({ 'comments.0': { $exists: true } })
        .populate('comments.author', 'name email')
        .lean();
      
      const totalComments = tickets.reduce((sum, ticket) => sum + (ticket.comments?.length || 0), 0);
      console.log(`💬 Indexing ${totalComments} comments...`);
      
      for (const ticket of tickets) {
        if (ticket.comments && ticket.comments.length > 0) {
          for (const comment of ticket.comments) {
            try {
              await this.indexComment(comment, ticket);
              indexed++;
            } catch (error) {
              console.error(`❌ Failed to index comment ${comment._id}:`, error);
              errors++;
            }
          }
        }
      }
      
      console.log(`✅ Comments indexed: ${indexed}, Errors: ${errors}`);
      return { indexed, errors };
    } catch (error) {
      console.error('❌ Comment indexing failed:', error);
      throw error;
    }
  }

  /**
   * Index a single comment
   */
  async indexComment(comment, ticket) {
    const contentData = {
      contentId: comment._id,
      contentType: 'Comment',
      title: `Comment on ${ticket.title}`,
      description: comment.content.substring(0, 200),
      content: comment.content,
      metadata: {
        ticketId: ticket._id,
        ticketTitle: ticket.title,
        author: comment.author?._id,
        tags: comment.tags || []
      },
      contentCreatedAt: comment.createdAt,
      contentUpdatedAt: comment.updatedAt || comment.createdAt
    };

    return await SearchIndex.indexContent(contentData);
  }

  /**
   * Update content index
   */
  async updateContentIndex(contentType, contentId) {
    try {
      let content;
      
      switch (contentType) {
        case 'Ticket':
          content = await Ticket.findById(contentId)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .lean();
          if (content) await this.indexTicket(content);
          break;
          
        case 'User':
          content = await User.findById(contentId)
            .select('name email role department isActive profile')
            .lean();
          if (content) await this.indexUser(content);
          break;
          
        default:
          console.warn(`⚠️ Unknown content type: ${contentType}`);
      }
      
      return content;
    } catch (error) {
      console.error(`❌ Failed to update index for ${contentType} ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Remove content from index
   */
  async removeFromIndex(contentId, contentType) {
    try {
      const result = await SearchIndex.removeFromIndex(contentId, contentType);
      console.log(`🗑️ Removed ${contentType} ${contentId} from index: ${result}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to remove ${contentType} ${contentId} from index:`, error);
      throw error;
    }
  }

  /**
   * Rebuild index for specific content type
   */
  async rebuildIndex(contentType) {
    try {
      console.log(`🔄 Rebuilding index for ${contentType}...`);
      
      // Remove existing entries
      await SearchIndex.deleteMany({ contentType });
      
      // Re-index all content
      switch (contentType) {
        case 'Ticket':
          return await this.indexTickets();
        case 'User':
          return await this.indexUsers();
        case 'Comment':
          return await this.indexComments();
        default:
          throw new Error(`Unknown content type: ${contentType}`);
      }
    } catch (error) {
      console.error(`❌ Failed to rebuild index for ${contentType}:`, error);
      throw error;
    }
  }

  /**
   * Optimize search index
   */
  async optimizeIndex() {
    try {
      console.log('⚡ Optimizing search index...');
      
      const result = await SearchIndex.optimizeIndex();
      
      console.log('✅ Search index optimization completed');
      return result;
    } catch (error) {
      console.error('❌ Index optimization failed:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats() {
    try {
      const stats = await SearchIndex.getIndexStats();
      
      // Add additional statistics
      const totalStats = stats.reduce((acc, stat) => {
        acc.totalIndexed += stat.count;
        acc.totalIndexed += stat.indexed;
        acc.totalPending += stat.pending;
        acc.totalErrors += stat.errors;
        return acc;
      }, {
        totalIndexed: 0,
        totalPending: 0,
        totalErrors: 0
      });
      
      return {
        byType: stats,
        total: totalStats,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to get index stats:', error);
      throw error;
    }
  }

  /**
   * Queue content for indexing
   */
  queueForIndexing(contentType, contentId, priority = 'normal') {
    const item = {
      contentType,
      contentId,
      priority,
      timestamp: new Date(),
      retries: 0
    };
    
    // Insert based on priority
    if (priority === 'high') {
      this.indexingQueue.unshift(item);
    } else {
      this.indexingQueue.push(item);
    }
    
    // Start processing if not already running
    if (!this.processingQueue) {
      this.processIndexingQueue();
    }
  }

  /**
   * Process indexing queue
   */
  async processIndexingQueue() {
    if (this.processingQueue || this.indexingQueue.length === 0) {
      return;
    }
    
    this.processingQueue = true;
    
    try {
      while (this.indexingQueue.length > 0) {
        const item = this.indexingQueue.shift();
        
        try {
          await this.updateContentIndex(item.contentType, item.contentId);
        } catch (error) {
          console.error(`❌ Failed to index queued item:`, error);
          
          // Retry logic
          if (item.retries < this.indexingConfig.maxRetries) {
            item.retries++;
            item.timestamp = new Date();
            this.indexingQueue.push(item);
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, this.indexingConfig.retryDelay));
          }
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Start periodic indexing
   */
  startPeriodicIndexing() {
    setInterval(async () => {
      if (!this.isIndexing) {
        try {
          this.isIndexing = true;
          await this.processIndexingQueue();
        } catch (error) {
          console.error('❌ Periodic indexing failed:', error);
        } finally {
          this.isIndexing = false;
        }
      }
    }, this.indexingConfig.indexingInterval);
  }

  /**
   * Start periodic optimization
   */
  startPeriodicOptimization() {
    setInterval(async () => {
      try {
        await this.optimizeIndex();
      } catch (error) {
        console.error('❌ Periodic optimization failed:', error);
      }
    }, this.indexingConfig.optimizationInterval);
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup() {
    setInterval(async () => {
      try {
        await this.cleanupOldAnalytics();
      } catch (error) {
        console.error('❌ Periodic cleanup failed:', error);
      }
    }, this.indexingConfig.cleanupInterval);
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldAnalytics() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      
      const result = await SearchAnalytics.deleteMany({
        timestamp: { $lt: thirtyDaysAgo }
      });
      
      console.log(`🧹 Cleaned up ${result.deletedCount} old analytics records`);
      return result;
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Validate index integrity
   */
  async validateIndex() {
    try {
      console.log('🔍 Validating index integrity...');
      
      const validationResults = {
        tickets: { valid: 0, invalid: 0, missing: 0 },
        users: { valid: 0, invalid: 0, missing: 0 },
        comments: { valid: 0, invalid: 0, missing: 0 }
      };

      // Validate tickets
      const ticketCount = await Ticket.countDocuments();
      const indexedTickets = await SearchIndex.countDocuments({ contentType: 'Ticket' });
      
      if (indexedTickets !== ticketCount) {
        validationResults.tickets.missing = Math.abs(ticketCount - indexedTickets);
      }
      validationResults.tickets.valid = indexedTickets;

      // Validate users
      const userCount = await User.countDocuments();
      const indexedUsers = await SearchIndex.countDocuments({ contentType: 'User' });
      
      if (indexedUsers !== userCount) {
        validationResults.users.missing = Math.abs(userCount - indexedUsers);
      }
      validationResults.users.valid = indexedUsers;

      console.log('✅ Index validation completed:', validationResults);
      return validationResults;
    } catch (error) {
      console.error('❌ Index validation failed:', error);
      throw error;
    }
  }

  /**
   * Get indexing performance metrics
   */
  async getIndexingMetrics() {
    try {
      const stats = await this.getIndexStats();
      
      return {
        totalIndexed: stats.total.totalIndexed,
        queueLength: this.indexingQueue.length,
        isProcessing: this.processingQueue,
        lastOptimization: new Date(),
        indexHealth: {
          tickets: stats.byType.find(s => s._id === 'Ticket')?.count || 0,
          users: stats.byType.find(s => s._id === 'User')?.count || 0,
          comments: stats.byType.find(s => s._id === 'Comment')?.count || 0
        }
      };
    } catch (error) {
      console.error('❌ Failed to get indexing metrics:', error);
      return {};
    }
  }
}

module.exports = new SearchIndexer();
