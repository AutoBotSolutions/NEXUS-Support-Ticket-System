const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Session Identification
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Session Details
  deviceInfo: {
    deviceId: {
      type: String,
      required: true
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
    browserVersion: {
      type: String,
      default: null
    },
    os: {
      type: String,
      default: null
    },
    osVersion: {
      type: String,
      default: null
    },
    platform: {
      type: String,
      default: null
    }
  },
  
  // Network Information
  networkInfo: {
    ipAddress: {
      type: String,
      required: true,
      index: true
    },
    userAgent: {
      type: String,
      required: true
    },
    location: {
      country: String,
      region: String,
      city: String,
      timezone: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    isp: String,
    connectionType: {
      type: String,
      enum: ['wifi', 'cellular', 'ethernet', 'unknown'],
      default: 'unknown'
    }
  },
  
  // Session Timing
  loginTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    required: true,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  },
  expiryTime: {
    type: Date,
    required: true
  },
  
  // Session Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'terminated', 'suspended'],
    default: 'active'
  },
  
  // Session Security
  security: {
    twoFactorVerified: {
      type: Boolean,
      default: false
    },
    twoFactorMethod: {
      type: String,
      enum: ['totp', 'sms', 'email', 'none'],
      default: 'none'
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    suspiciousActivity: [{
      type: {
        type: String,
        enum: ['ip_change', 'device_change', 'unusual_location', 'multiple_sessions', 'failed_attempts']
      },
      detectedAt: {
        type: Date,
        default: Date.now
      },
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
      }
    }],
    isTrustedDevice: {
      type: Boolean,
      default: false
    },
    trustedUntil: {
      type: Date,
      default: null
    }
  },
  
  // Session Activity
  activity: {
    pageViews: {
      type: Number,
      default: 0
    },
    apiCalls: {
      type: Number,
      default: 0
    },
    errors: {
      type: Number,
      default: 0
    },
    warnings: {
      type: Number,
      default: 0
    },
    lastPageVisited: {
      type: String,
      default: null
    },
    navigationHistory: [{
      page: String,
      timestamp: Date,
      duration: Number // time spent on page in seconds
    }]
  },
  
  // Session Preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'api', 'mobile', 'cli', 'webhook'],
      default: 'web'
    },
    version: {
      type: String,
      default: '1.0'
    },
    environment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production'
    },
    tags: [String],
    notes: String
  }
}, {
  timestamps: true
});

// Indexes for performance
userSessionSchema.index({ userId: 1, status: 1 });
userSessionSchema.index({ userId: 1, lastActivity: -1 });
userSessionSchema.index({ sessionId: 1 });
userSessionSchema.index({ 'networkInfo.ipAddress': 1 });
userSessionSchema.index({ loginTime: -1 });
userSessionSchema.index({ expiryTime: 1 });
userSessionSchema.index({ status: 1, expiryTime: 1 });
userSessionSchema.index({ 'security.riskScore': 1 });
userSessionSchema.index({ 'deviceInfo.deviceId': 1 });

// Virtual fields
userSessionSchema.virtual('duration').get(function() {
  const endTime = this.logoutTime || new Date();
  return Math.floor((endTime - this.loginTime) / 1000); // in seconds
});

userSessionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.expiryTime > new Date();
});

userSessionSchema.virtual('timeUntilExpiry').get(function() {
  return Math.floor((this.expiryTime - new Date()) / 1000); // in seconds
});

// Pre-save middleware
userSessionSchema.pre('save', function(next) {
  // Update lastActivity on save
  if (this.isModified && !this.isModified('lastActivity')) {
    this.lastActivity = new Date();
  }
  
  // Auto-expire sessions that have passed their expiry time
  if (this.expiryTime < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// Static methods
userSessionSchema.statics.createSession = function(sessionData) {
  const session = new this(sessionData);
  
  // Set expiry time if not provided (default 24 hours)
  if (!session.expiryTime) {
    session.expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  return session.save();
};

userSessionSchema.statics.getActiveSessions = function(userId) {
  return this.find({
    userId,
    status: 'active',
    expiryTime: { $gt: new Date() }
  }).sort({ lastActivity: -1 });
};

userSessionSchema.statics.getSessionById = function(sessionId) {
  return this.findOne({ sessionId })
    .populate('userId', 'username email fullName avatar');
};

userSessionSchema.statics.terminateSession = function(sessionId, reason = 'logout') {
  return this.updateOne(
    { sessionId },
    { 
      status: 'terminated',
      logoutTime: new Date(),
      'metadata.notes': reason
    }
  );
};

userSessionSchema.statics.terminateAllUserSessions = function(userId, reason = 'security') {
  return this.updateMany(
    { userId, status: 'active' },
    { 
      status: 'terminated',
      logoutTime: new Date(),
      'metadata.notes': reason
    }
  );
};

userSessionSchema.statics.extendSession = function(sessionId, hours = 24) {
  const newExpiryTime = new Date(Date.now() + hours * 60 * 60 * 1000);
  
  return this.updateOne(
    { sessionId, status: 'active' },
    { 
      expiryTime: newExpiryTime,
      lastActivity: new Date()
    }
  );
};

userSessionSchema.statics.updateActivity = function(sessionId, activityData) {
  const updateData = {
    lastActivity: new Date(),
    $inc: {
      'activity.pageViews': activityData.pageViews || 0,
      'activity.apiCalls': activityData.apiCalls || 0,
      'activity.errors': activityData.errors || 0,
      'activity.warnings': activityData.warnings || 0
    }
  };
  
  if (activityData.lastPageVisited) {
    updateData['activity.lastPageVisited'] = activityData.lastPageVisited;
  }
  
  if (activityData.navigation) {
    updateData.$push = { 'activity.navigationHistory': activityData.navigation };
  }
  
  return this.updateOne({ sessionId }, updateData);
};

userSessionSchema.statics.getSessionsByIP = function(ipAddress, limit = 50) {
  return this.find({ 'networkInfo.ipAddress': ipAddress })
    .sort({ loginTime: -1 })
    .limit(limit)
    .populate('userId', 'username email');
};

userSessionSchema.statics.getSuspiciousSessions = function(limit = 20) {
  return this.find({
    'security.riskScore': { $gt: 50 },
    status: { $in: ['active', 'inactive'] }
  })
  .sort({ 'security.riskScore': -1 })
  .limit(limit)
  .populate('userId', 'username email');
};

userSessionSchema.statics.getSessionStatistics = function(userId, timeRange = '7d') {
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
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        loginTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        averageDuration: { $avg: { $subtract: ['$logoutTime', '$loginTime'] } },
        totalPageViews: { $sum: '$activity.pageViews' },
        totalApiCalls: { $sum: '$activity.apiCalls' },
        uniqueDevices: { $addToSet: '$deviceInfo.deviceId' },
        uniqueIPs: { $addToSet: '$networkInfo.ipAddress' }
      }
    },
    {
      $project: {
        totalSessions: 1,
        averageDuration: 1,
        totalPageViews: 1,
        totalApiCalls: 1,
        uniqueDeviceCount: { $size: '$uniqueDevices' },
        uniqueIPCount: { $size: '$uniqueIPs' }
      }
    }
  ]);
};

userSessionSchema.statics.cleanupExpiredSessions = function() {
  return this.deleteMany({
    $or: [
      { expiryTime: { $lt: new Date() } },
      { status: 'expired' },
      { status: 'terminated', logoutTime: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    ]
  });
};

// Instance methods
userSessionSchema.methods.terminate = function(reason = 'logout') {
  this.status = 'terminated';
  this.logoutTime = new Date();
  this.metadata.notes = reason;
  return this.save();
};

userSessionSchema.methods.extend = function(hours = 24) {
  this.expiryTime = new Date(Date.now() + hours * 60 * 60 * 1000);
  this.lastActivity = new Date();
  return this.save();
};

userSessionSchema.methods.addSuspiciousActivity = function(type, description, severity = 'medium') {
  this.security.suspiciousActivity.push({
    type,
    detectedAt: new Date(),
    description,
    severity
  });
  
  // Update risk score based on severity
  const severityScores = { low: 10, medium: 25, high: 50 };
  this.security.riskScore = Math.min(100, this.security.riskScore + severityScores[severity]);
  
  return this.save();
};

userSessionSchema.methods.trustDevice = function(days = 30) {
  this.security.isTrustedDevice = true;
  this.security.trustedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

module.exports = mongoose.model('UserSession', userSessionSchema);
