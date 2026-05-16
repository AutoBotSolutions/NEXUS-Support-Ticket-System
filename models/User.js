const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  
  // Profile Information
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  location: {
    type: String,
    maxlength: 100,
    default: null
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: ['admin', 'support_agent', 'user', 'guest'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'teams.create', 'teams.read', 'teams.update', 'teams.delete',
      'tickets.create', 'tickets.read', 'tickets.update', 'tickets.delete',
      'system.monitoring', 'system.analytics'
    ]
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // GitHub Integration
  githubUsername: {
    type: String,
    default: null
  },
  githubId: {
    type: String,
    default: null
  },
  
  // Team Membership
  teams: [{
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Preferences
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
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    },
    dashboard: {
      layout: {
        type: String,
        enum: ['grid', 'list'],
        default: 'grid'
      },
      widgets: [{
        type: String,
        enum: ['tickets', 'analytics', 'notifications', 'tasks']
      }]
    }
  },
  
  // Activity Tracking
  activity: {
    lastActivity: {
      type: Date,
      default: Date.now
    },
    totalLogins: {
      type: Number,
      default: 0
    },
    totalTicketsCreated: {
      type: Number,
      default: 0
    },
    totalTicketsResolved: {
      type: Number,
      default: 0
    }
  },
  
  // Security
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'activity.lastActivity': -1 });
userSchema.index({ 'teams.teamId': 1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

userSchema.virtual('displayName').get(function() {
  return this.fullName || this.username;
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.twoFactorSecret;
  return user;
};

userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.role === 'admin';
};

userSchema.methods.isInTeam = function(teamId) {
  return this.teams.some(team => team.teamId.toString() === teamId.toString());
};

userSchema.methods.getTeamRole = function(teamId) {
  const team = this.teams.find(team => team.teamId.toString() === teamId.toString());
  return team ? team.role : null;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username });
};

userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

userSchema.statics.findByRole = function(role) {
  return this.find({ role: role, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
