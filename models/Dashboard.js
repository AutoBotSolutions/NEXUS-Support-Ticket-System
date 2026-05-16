/**
 * NEXUS Dashboard Data Model
 * 
 * Mongoose schema for storing dashboard configurations,
 * layouts, and widget configurations.
 */

const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
    // Basic dashboard information
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
    
    // Dashboard type
    type: {
        type: String,
        required: true,
        enum: ['executive', 'operations', 'support', 'technical', 'custom'],
        default: 'custom'
    },
    
    // Dashboard layout
    layout: {
        type: String,
        enum: ['grid', 'flex', 'masonry'],
        default: 'grid'
    },
    
    // Dashboard configuration
    configuration: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        refreshInterval: {
            type: Number,
            default: 30000 // 30 seconds
        },
        autoRefresh: {
            type: Boolean,
            default: true
        },
        showHeader: {
            type: Boolean,
            default: true
        },
        showSidebar: {
            type: Boolean,
            default: true
        }
    },
    
    // Widgets configuration
    widgets: [{
        id: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: [
                'kpi_card',
                'chart',
                'table',
                'list',
                'metric',
                'gauge',
                'progress',
                'alert',
                'feed',
                'calendar',
                'map'
            ]
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500
        },
        
        // Position and size
        position: {
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
            width: { type: Number, default: 4 },
            height: { type: Number, default: 3 }
        },
        
        // Data configuration
        dataSource: {
            type: {
                type: String,
                required: true,
                enum: [
                    'ticket_analytics',
                    'user_performance',
                    'system_performance',
                    'github_integration',
                    'administrative',
                    'custom_api',
                    'static'
                ]
            },
            endpoint: {
                type: String,
                trim: true
            },
            query: {
                type: mongoose.Schema.Types.Mixed,
                default: {}
            },
            refreshInterval: {
                type: Number,
                default: 30000
            },
            cacheKey: {
                type: String,
                trim: true
            }
        },
        
        // Widget-specific configuration
        config: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        
        // Visualization configuration
        visualization: {
            chartType: {
                type: String,
                enum: [
                    'line',
                    'bar',
                    'pie',
                    'doughnut',
                    'radar',
                    'polar',
                    'scatter',
                    'bubble',
                    'area',
                    'gauge',
                    'progress',
                    'table',
                    'card',
                    'list',
                    'feed'
                ]
            },
            colors: [{
                type: String,
                trim: true
            }],
            showLegend: {
                type: Boolean,
                default: true
            },
            showGrid: {
                type: Boolean,
                default: true
            },
            showAxes: {
                type: Boolean,
                default: true
            },
            animation: {
                type: Boolean,
                default: true
            },
            responsive: {
                type: Boolean,
                default: true
            }
        },
        
        // Widget status
        status: {
            type: String,
            enum: ['active', 'inactive', 'loading', 'error'],
            default: 'active'
        },
        
        // Error information
        error: {
            type: String,
            default: null
        },
        
        // Last updated timestamp
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Dashboard filters
    filters: [{
        id: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: ['date_range', 'select', 'multiselect', 'text', 'number', 'boolean']
        },
        label: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255
        },
        field: {
            type: String,
            required: true,
            trim: true
        },
        options: [{
            value: { type: String, required: true },
            label: { type: String, required: true }
        }],
        defaultValue: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },
        required: {
            type: Boolean,
            default: false
        }
    }],
    
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
        enum: ['executive', 'operations', 'support', 'technical', 'custom'],
        default: 'custom'
    },
    
    // Tags
    tags: [{
        type: String,
        trim: true,
        maxlength: 50
    }],
    
    // Metrics
    viewCount: {
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
    collection: 'dashboards'
});

// Indexes for performance
dashboardSchema.index({ createdBy: 1, createdAt: -1 });
dashboardSchema.index({ type: 1, visibility: 1, createdAt: -1 });
dashboardSchema.index({ department: 1, visibility: 1, createdAt: -1 });
dashboardSchema.index({ isTemplate: 1, templateCategory: 1 });
dashboardSchema.index({ tags: 1 });
dashboardSchema.index({ cacheKey: 1 }, { sparse: true });

// Virtual fields
dashboardSchema.virtual('widgetCount').get(function() {
    return this.widgets.length;
});

dashboardSchema.virtual('activeWidgetCount').get(function() {
    return this.widgets.filter(w => w.status === 'active').length;
});

dashboardSchema.virtual('isShared').get(function() {
    return this.shared && this.shared.sharedWith && this.shared.sharedWith.length > 0;
});

// Instance methods
dashboardSchema.methods.canBeViewedBy = function(userId, userRole) {
    // Private dashboards can only be viewed by creator
    if (this.visibility === 'private') {
        return this.createdBy.toString() === userId.toString();
    }
    
    // Department dashboards can be viewed by same department or admin
    if (this.visibility === 'department') {
        return this.department === userRole || this.createdBy.toString() === userId.toString();
    }
    
    // Public dashboards can be viewed by anyone
    return true;
};

dashboardSchema.methods.incrementView = function() {
    this.viewCount += 1;
    return this.save();
};

dashboardSchema.methods.incrementShare = function() {
    this.shareCount += 1;
    return this.save();
};

dashboardSchema.methods.addWidget = function(widgetConfig) {
    const widget = {
        ...widgetConfig,
        id: widgetConfig.id || `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastUpdated: new Date()
    };
    
    this.widgets.push(widget);
    return this.save();
};

dashboardSchema.methods.removeWidget = function(widgetId) {
    this.widgets = this.widgets.filter(w => w.id !== widgetId);
    return this.save();
};

dashboardSchema.methods.updateWidget = function(widgetId, updates) {
    const widgetIndex = this.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex !== -1) {
        this.widgets[widgetIndex] = {
            ...this.widgets[widgetIndex],
            ...updates,
            lastUpdated: new Date()
        };
        return this.save();
    }
    throw new Error('Widget not found');
};

dashboardSchema.methods.getWidget = function(widgetId) {
    return this.widgets.find(w => w.id === widgetId);
};

dashboardSchema.methods.addFilter = function(filterConfig) {
    const filter = {
        ...filterConfig,
        id: filterConfig.id || `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.filters.push(filter);
    return this.save();
};

dashboardSchema.methods.removeFilter = function(filterId) {
    this.filters = this.filters.filter(f => f.id !== filterId);
    return this.save();
};

dashboardSchema.methods.updateFilter = function(filterId, updates) {
    const filterIndex = this.filters.findIndex(f => f.id === filterId);
    if (filterIndex !== -1) {
        this.filters[filterIndex] = {
            ...this.filters[filterIndex],
            ...updates
        };
        return this.save();
    }
    throw new Error('Filter not found');
};

dashboardSchema.methods.getFilter = function(filterId) {
    return this.filters.find(f => f.id === filterId);
};

dashboardSchema.methods.isExpired = function() {
    return this.cacheExpiresAt && new Date() > this.cacheExpiresAt;
};

dashboardSchema.methods.refreshWidget = function(widgetId) {
    const widget = this.getWidget(widgetId);
    if (widget) {
        widget.lastUpdated = new Date();
        widget.status = 'loading';
        return this.save();
    }
    throw new Error('Widget not found');
};

dashboardSchema.methods.setWidgetError = function(widgetId, error) {
    const widget = this.getWidget(widgetId);
    if (widget) {
        widget.status = 'error';
        widget.error = error;
        widget.lastUpdated = new Date();
        return this.save();
    }
    throw new Error('Widget not found');
};

// Static methods
dashboardSchema.statics.findByUser = function(userId, options = {}) {
    const query = { createdBy: userId };
    
    if (options.type) query.type = options.type;
    if (options.department) query.department = options.department;
    if (options.visibility) query.visibility = options.visibility;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 10)
        .skip(options.offset || 0);
};

dashboardSchema.statics.findTemplates = function(options = {}) {
    const query = { isTemplate: true };
    
    if (options.category) query.templateCategory = options.category;
    if (options.type) query.type = options.type;
    
    return this.find(query)
        .sort({ name: 1 })
        .populate('createdBy', 'name email');
};

dashboardSchema.statics.findPublic = function(options = {}) {
    const query = { visibility: 'public' };
    
    if (options.type) query.type = options.type;
    if (options.department) query.department = options.department;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 10)
        .skip(options.offset || 0)
        .populate('createdBy', 'name email');
};

dashboardSchema.statics.findByTag = function(tag, options = {}) {
    const query = { tags: tag };
    
    if (options.visibility) query.visibility = options.visibility;
    if (options.department) query.department = options.department;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 10)
        .skip(options.offset || 0);
};

dashboardSchema.statics.cleanupExpired = function() {
    return this.deleteMany({
        cacheExpiresAt: { $lt: new Date() }
    });
};

// Pre-save middleware
dashboardSchema.pre('save', function(next) {
    // Validate widget positions don't overlap
    if (this.widgets && this.widgets.length > 0) {
        // Basic validation - more complex collision detection could be added
        this.widgets.forEach(widget => {
            if (widget.position.x < 0 || widget.position.y < 0) {
                throw new Error('Widget position must be positive');
            }
            if (widget.position.width <= 0 || widget.position.height <= 0) {
                throw new Error('Widget size must be positive');
            }
        });
    }
    
    next();
});

// Post-save middleware
dashboardSchema.post('save', function() {
    // Log dashboard creation/update for audit purposes
    console.log(`Dashboard ${this.isNew ? 'created' : 'updated'}: ${this.name} (${this.type})`);
});

// Post-remove middleware
dashboardSchema.post('remove', function() {
    // Log dashboard deletion for audit purposes
    console.log(`Dashboard deleted: ${this.name} (${this.type})`);
});

module.exports = mongoose.model('Dashboard', dashboardSchema);
