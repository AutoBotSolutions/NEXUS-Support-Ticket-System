const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Activity Details
  type: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'profile_update', 'password_change',
      'email_verification', 'phone_verification', 'two_factor_enabled',
      'two_factor_disabled', 'permission_granted', 'permission_revoked',
      'role_change', 'team_joined', 'team_left', 'ticket_created',
      'ticket_updated', 'ticket_resolved', 'ticket_closed',
      'comment_added', 'attachment_uploaded', 'settings_updated',
      'api_key_created', 'api_key_revoked', 'session_expired',
      'account_locked', 'account_unlocked', 'password_reset',
      'export_requested', 'import_completed', 'search_performed',
      'report_generated', 'notification_sent', 'webhook_triggered'
    ]
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Activity Context
  context: {
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    sessionId: {
      type: String,
      default: null
    },
    requestId: {
      type: String,
      default: null
    },
    source: {
      type: String,
      enum: ['web', 'api', 'mobile', 'cli', 'webhook', 'system'],
      default: 'web'
    }
  },
  
  // Related Objects
  relatedObjects: [{
    objectType: {
      type: String,
      enum: ['ticket', 'user', 'team', 'comment', 'attachment', 'report', 'notification']
    },
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    objectName: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'viewed', 'downloaded', 'shared']
    }
  }],
  
  // Changes Made (for update activities)
  changes: {
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    fields: [{
      fieldName: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }]
  },
  
  // Metadata
  metadata: {
    duration: {
      type: Number, // in milliseconds for activities like login sessions
      default: null
    },
    success: {
      type: Boolean,
      default: true
    },
    errorCode: {
      type: String,
      default: null
    },
    errorMessage: {
      type: String,
      default: null
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    tags: [String],
    location: {
      type: String,
      default: null
    }
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Session Information
  sessionInfo: {
    loginTime: {
      type: Date,
      default: null
    },
    logoutTime: {
      type: Date,
      default: null
    },
    sessionDuration: {
      type: Number, // in seconds
      default: null
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: {
      type: String,
      default: null
    },
    os: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ userId: 1, type: 1, timestamp: -1 });
userActivitySchema.index({ type: 1, timestamp: -1 });
userActivitySchema.index({ timestamp: -1 });
userActivitySchema.index({ 'context.ipAddress': 1 });
userActivitySchema.index({ 'context.sessionId': 1 });
userActivitySchema.index({ 'relatedObjects.objectId': 1 });
userActivitySchema.index({ 'metadata.success': 1 });
userActivitySchema.index({ 'metadata.severity': 1 });

// Static methods
userActivitySchema.statics.logActivity = function(activityData) {
  return this.create(activityData);
};

userActivitySchema.statics.getUserActivity = function(userId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    type,
    startDate,
    endDate,
    success,
    severity
  } = options;
  
  const query = { userId };
  
  if (type) query.type = type;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  if (success !== undefined) query['metadata.success'] = success;
  if (severity) query['metadata.severity'] = severity;
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(offset)
    .populate('userId', 'username email fullName avatar');
};

userActivitySchema.statics.getActivitySummary = function(userId, timeRange = '7d') {
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case '1d':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' },
        successRate: {
          $avg: { $cond: ['$metadata.success', 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

userActivitySchema.statics.getLoginHistory = function(userId, limit = 30) {
  return this.find({
    userId,
    type: 'login',
    'metadata.success': true
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .select('timestamp context.ipAddress context.userAgent sessionInfo');
};

userActivitySchema.statics.getFailedLogins = function(userId, limit = 10) {
  return this.find({
    userId,
    type: 'login',
    'metadata.success': false
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .select('timestamp context.ipAddress metadata.errorMessage');
};

userActivitySchema.statics.getSecurityEvents = function(userId, limit = 20) {
  return this.find({
    userId,
    type: { $in: ['password_change', 'two_factor_enabled', 'two_factor_disabled', 'account_locked', 'account_unlocked'] }
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .select('timestamp type description metadata');
};

userActivitySchema.statics.cleanupOldActivities = function(daysToKeep = 90) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
    type: { $nin: ['login', 'logout', 'account_locked', 'password_change'] } // Keep security-related events longer
  });
};

// Instance methods
userActivitySchema.methods.addRelatedObject = function(objectType, objectId, objectName, action) {
  this.relatedObjects.push({
    objectType,
    objectId,
    objectName,
    action
  });
  return this.save();
};

userActivitySchema.methods.addChange = function(fieldName, oldValue, newValue) {
  if (!this.changes.fields) {
    this.changes.fields = [];
  }
  
  this.changes.fields.push({
    fieldName,
    oldValue,
    newValue
  });
  return this.save();
};

// Pre-save middleware
userActivitySchema.pre('save', function(next) {
  // Auto-populate session duration if login and logout times are available
  if (this.type === 'logout' && this.sessionInfo.loginTime) {
    this.sessionInfo.logoutTime = this.timestamp;
    this.sessionInfo.sessionDuration = Math.floor(
      (this.timestamp - this.sessionInfo.loginTime) / 1000
    );
  }
  
  next();
});

module.exports = mongoose.model('UserActivity', userActivitySchema);
