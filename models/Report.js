/**
 * NEXUS Report Data Model
 * 
 * Mongoose schema for storing report configurations, generated reports,
 * and scheduling information.
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    // Basic report information
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255
    },
    
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    
    // Report type and configuration
    type: {
        type: String,
        required: true,
        enum: [
            'ticket_analytics',
            'user_performance',
            'system_performance',
            'github_integration',
            'administrative',
            'custom'
        ]
    },
    
    // Report parameters/filters
    parameters: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Report data
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // Report format
    format: {
        type: String,
        enum: ['json', 'csv', 'excel', 'pdf'],
        default: 'json'
    },
    
    // Report status
    status: {
        type: String,
        enum: ['pending', 'generating', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    
    // Error information
    error: {
        type: String,
        default: null
    },
    
    // File information
    fileSize: {
        type: Number,
        default: 0
    },
    
    filePath: {
        type: String,
        default: null
    },
    
    // Scheduling information
    schedule: {
        frequency: {
            type: String,
            enum: ['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly']
        },
        nextRun: {
            type: Date
        },
        lastRun: {
            type: Date
        },
        recipients: [{
            type: String,
            trim: true
        }],
        format: {
            type: String,
            enum: ['json', 'csv', 'excel', 'pdf']
        },
        enabled: {
            type: Boolean,
            default: true
        }
    },
    
    // Sharing information
    shared: {
        sharedWith: [{
            type: String,
            trim: true
        }],
        sharedAt: {
            type: Date
        },
        sharedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    
    // Template information
    isTemplate: {
        type: Boolean,
        default: false
    },
    
    templateCategory: {
        type: String,
        enum: ['analytics', 'performance', 'administrative', 'custom'],
        default: 'custom'
    },
    
    // User information
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Department context
    department: {
        type: String,
        trim: true,
        index: true
    },
    
    // Visibility
    visibility: {
        type: String,
        enum: ['private', 'department', 'public'],
        default: 'private'
    },
    
    // Tags
    tags: [{
        type: String,
        trim: true,
        maxlength: 50
    }],
    
    // Execution history
    executions: [{
        status: {
            type: String,
            enum: ['pending', 'generating', 'completed', 'failed', 'cancelled']
        },
        startedAt: {
            type: Date
        },
        completedAt: {
            type: Date
        },
        fileSize: {
            type: Number,
            default: 0
        },
        error: {
            type: String,
            default: null
        },
        executionId: {
            type: String,
            required: true
        }
    }],
    
    // Metrics
    viewCount: {
        type: Number,
        default: 0
    },
    
    downloadCount: {
        type: Number,
        default: 0
    },
    
    shareCount: {
        type: Number,
        default: 0
    },
    
    // Cache information
    cacheKey: {
        type: String,
        default: null
    },
    
    cacheExpiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'reports'
});

// Indexes for performance
reportSchema.index({ createdBy: 1, createdAt: -1 });
reportSchema.index({ type: 1, status: 1, createdAt: -1 });
reportSchema.index({ department: 1, visibility: 1, createdAt: -1 });
reportSchema.index({ 'schedule.nextRun': 1, 'schedule.enabled': 1 });
reportSchema.index({ isTemplate: 1, templateCategory: 1 });
reportSchema.index({ tags: 1 });
reportSchema.index({ cacheKey: 1 }, { sparse: true });

// Virtual fields
reportSchema.virtual('isScheduled').get(function() {
    return this.schedule && this.schedule.frequency && this.schedule.enabled;
});

reportSchema.virtual('isReady').get(function() {
    return this.status === 'completed' && this.data;
});

reportSchema.virtual('executionHistory').get(function() {
    return this.executions.slice(-10); // Last 10 executions
});

// Instance methods
reportSchema.methods.canBeViewedBy = function(userId, userRole) {
    // Private reports can only be viewed by creator
    if (this.visibility === 'private') {
        return this.createdBy.toString() === userId.toString();
    }
    
    // Department reports can be viewed by same department or admin
    if (this.visibility === 'department') {
        return this.department === userRole || this.createdBy.toString() === userId.toString();
    }
    
    // Public reports can be viewed by anyone
    return true;
};

reportSchema.methods.incrementView = function() {
    this.viewCount += 1;
    return this.save();
};

reportSchema.methods.incrementDownload = function() {
    this.downloadCount += 1;
    return this.save();
};

reportSchema.methods.incrementShare = function() {
    this.shareCount += 1;
    return this.save();
};

reportSchema.methods.addExecution = function(executionData) {
    this.executions.push(executionData);
    
    // Keep only last 50 executions
    if (this.executions.length > 50) {
        this.executions = this.executions.slice(-50);
    }
    
    return this.save();
};

reportSchema.methods.getNextRunDate = function() {
    if (!this.isScheduled) {
        return null;
    }
    
    const now = new Date();
    const lastRun = this.schedule.lastRun || now;
    
    switch (this.schedule.frequency) {
        case 'daily':
            return new Date(lastRun.getTime() + 24 * 60 * 60 * 1000);
        case 'weekly':
            return new Date(lastRun.getTime() + 7 * 24 * 60 * 60 * 1000);
        case 'monthly':
            return new Date(lastRun.getFullYear(), lastRun.getMonth() + 1, lastRun.getDate());
        case 'quarterly':
            return new Date(lastRun.getFullYear(), lastRun.getMonth() + 3, lastRun.getDate());
        case 'yearly':
            return new Date(lastRun.getFullYear() + 1, lastRun.getMonth(), lastRun.getDate());
        default:
            return null;
    }
};

reportSchema.methods.isExpired = function() {
    return this.cacheExpiresAt && new Date() > this.cacheExpiresAt;
};

// Static methods
reportSchema.statics.findByUser = function(userId, options = {}) {
    const query = { createdBy: userId };
    
    if (options.type) query.type = options.type;
    if (options.status) query.status = options.status;
    if (options.department) query.department = options.department;
    if (options.visibility) query.visibility = options.visibility;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 10)
        .skip(options.offset || 0);
};

reportSchema.statics.findScheduled = function(options = {}) {
    const query = { 
        'schedule.enabled': true,
        'schedule.nextRun': { $lte: new Date() }
    };
    
    if (options.frequency) query['schedule.frequency'] = options.frequency;
    if (options.department) query.department = options.department;
    
    return this.find(query)
        .sort({ 'schedule.nextRun': 1 })
        .populate('createdBy', 'name email');
};

reportSchema.statics.findTemplates = function(options = {}) {
    const query = { isTemplate: true };
    
    if (options.category) query.templateCategory = options.category;
    if (options.type) query.type = options.type;
    
    return this.find(query)
        .sort({ name: 1 })
        .populate('createdBy', 'name email');
};

reportSchema.statics.findPublic = function(options = {}) {
    const query = { visibility: 'public' };
    
    if (options.type) query.type = options.type;
    if (options.department) query.department = options.department;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 10)
        .skip(options.offset || 0)
        .populate('createdBy', 'name email');
};

reportSchema.statics.findByTag = function(tag, options = {}) {
    const query = { tags: tag };
    
    if (options.visibility) query.visibility = options.visibility;
    if (options.department) query.department = options.department;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 10)
        .skip(options.offset || 0);
};

reportSchema.statics.cleanupExpired = function() {
    return this.deleteMany({
        cacheExpiresAt: { $lt: new Date() }
    });
};

// Pre-save middleware
reportSchema.pre('save', function(next) {
    // Set next run date for scheduled reports
    if (this.isModified('schedule') && this.isScheduled) {
        this.schedule.nextRun = this.getNextRunDate();
    }
    
    // Calculate file size if data is present
    if (this.data && !this.fileSize) {
        this.fileSize = JSON.stringify(this.data).length;
    }
    
    next();
});

// Post-save middleware
reportSchema.post('save', function() {
    // Log report creation/update for audit purposes
    console.log(`Report ${this.isNew ? 'created' : 'updated'}: ${this.name} (${this.type})`);
});

// Post-remove middleware
reportSchema.post('remove', function() {
    // Log report deletion for audit purposes
    console.log(`Report deleted: ${this.name} (${this.type})`);
});

module.exports = mongoose.model('Report', reportSchema);
