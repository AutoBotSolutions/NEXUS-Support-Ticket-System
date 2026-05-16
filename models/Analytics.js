/**
 * NEXUS Analytics Data Model
 * 
 * Mongoose schema for storing analytics data, cached results,
 * and performance metrics.
 */

const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    // Analytics identification
    key: {
        type: String,
        required: true,
        index: true
    },
    
    // Analytics data
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    
    // Analytics options/filters
    options: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Metadata
    type: {
        type: String,
        enum: ['ticket_analytics', 'user_analytics', 'system_performance', 'github_analytics', 'administrative_reports'],
        required: true
    },
    
    // Timestamps
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // Cache expiration
    expiresAt: {
        type: Date,
        index: true
    },
    
    // Performance metrics
    generationTime: {
        type: Number, // milliseconds
        default: 0
    },
    
    // Data size
    dataSize: {
        type: Number, // bytes
        default: 0
    },
    
    // Access tracking
    accessCount: {
        type: Number,
        default: 0
    },
    
    lastAccessed: {
        type: Date,
        default: Date.now
    },
    
    // User context
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    
    // Department context
    department: {
        type: String,
        index: true
    },
    
    // Time range context
    timeRange: {
        type: String,
        enum: ['1d', '7d', '30d', '90d', '1y', 'custom'],
        default: '30d'
    },
    
    // Refresh interval
    refreshInterval: {
        type: Number, // milliseconds
        default: 30 * 60 * 1000 // 30 minutes
    }
}, {
    timestamps: true,
    collection: 'analytics'
});

// Indexes for performance
analyticsSchema.index({ key: 1, type: 1, timestamp: -1 });
analyticsSchema.index({ type: 1, department: 1, timestamp: -1 });
analyticsSchema.index({ userId: 1, type: 1, timestamp: -1 });
analyticsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
analyticsSchema.methods.isExpired = function() {
    return this.expiresAt && new Date() > this.expiresAt;
};

analyticsSchema.methods.incrementAccess = function() {
    this.accessCount += 1;
    this.lastAccessed = new Date();
    return this.save();
};

analyticsSchema.methods.refresh = async function() {
    const AnalyticsService = require('../services/analyticsService');
    const analyticsService = new AnalyticsService();
    
    try {
        const newData = await analyticsService.getAnalyticsData(this.key, this.options);
        this.data = newData;
        this.timestamp = new Date();
        this.expiresAt = new Date(Date.now() + this.refreshInterval);
        this.generationTime = Date.now() - this.timestamp.getTime();
        this.dataSize = JSON.stringify(newData).length;
        
        return await this.save();
    } catch (error) {
        console.error('Error refreshing analytics:', error);
        throw error;
    }
};

// Static methods
analyticsSchema.statics.findByKey = function(key, options = {}) {
    const query = { key };
    
    if (options.userId) query.userId = options.userId;
    if (options.department) query.department = options.department;
    if (options.type) query.type = options.type;
    
    return this.findOne(query).sort({ timestamp: -1 });
};

analyticsSchema.statics.findValid = function(key, options = {}) {
    return this.findByKey(key, options).then(analytics => {
        if (analytics && !analytics.isExpired()) {
            return analytics.incrementAccess();
        }
        return null;
    });
};

analyticsSchema.statics.cacheAnalytics = function(key, data, options = {}) {
    const analytics = new this({
        key,
        data,
        options,
        type: options.type || 'custom',
        expiresAt: new Date(Date.now() + (options.ttl || 30 * 60 * 1000)),
        generationTime: options.generationTime || 0,
        dataSize: JSON.stringify(data).length,
        userId: options.userId,
        department: options.department,
        timeRange: options.timeRange || '30d',
        refreshInterval: options.refreshInterval || 30 * 60 * 1000
    });
    
    return analytics.save();
};

analyticsSchema.statics.cleanupExpired = function() {
    return this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};

// Pre-save middleware
analyticsSchema.pre('save', function(next) {
    if (this.data) {
        this.dataSize = JSON.stringify(this.data).length;
    }
    next();
});

// Post-save middleware
analyticsSchema.post('save', function() {
    // Log analytics creation/update for audit purposes
    console.log(`Analytics cached: ${this.key} (${this.type})`);
});

module.exports = mongoose.model('Analytics', analyticsSchema);
