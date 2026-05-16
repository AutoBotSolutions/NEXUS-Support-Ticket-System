const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  
  // Team Settings
  isPublic: {
    type: Boolean,
    default: false
  },
  allowJoinRequests: {
    type: Boolean,
    default: true
  },
  maxMembers: {
    type: Number,
    default: 50
  },
  
  // Team Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Owner and Members
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }],
  
  // Permissions
  permissions: {
    canCreateTickets: {
      type: Boolean,
      default: true
    },
    canViewAllTickets: {
      type: Boolean,
      default: false
    },
    canAssignTickets: {
      type: Boolean,
      default: true
    },
    canManageMembers: {
      type: Boolean,
      default: false
    }
  },
  
  // Statistics
  stats: {
    totalTickets: {
      type: Number,
      default: 0
    },
    openTickets: {
      type: Number,
      default: 0
    },
    closedTickets: {
      type: Number,
      default: 0
    },
    totalMembers: {
      type: Number,
      default: 1
    }
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
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Indexes for performance
teamSchema.index({ name: 1 });
teamSchema.index({ ownerId: 1 });
teamSchema.index({ isActive: 1 });
teamSchema.index({ createdAt: -1 });
teamSchema.index({ 'members.userId': 1 });

// Virtual fields
teamSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

teamSchema.virtual('activeMembers').get(function() {
  return this.members.filter(member => member.role !== 'owner').length;
});

// Pre-save middleware
teamSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.stats.totalMembers = this.members.length;
  next();
});

// Methods
teamSchema.methods.addMember = function(userId, role = 'member', invitedBy = null) {
  // Check if user is already a member
  const existingMember = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (existingMember) {
    return false; // User is already a member
  }
  
  // Check team size limit
  if (this.members.length >= this.maxMembers) {
    return false; // Team is full
  }
  
  // Add new member
  this.members.push({
    userId: userId,
    role: role,
    joinedAt: new Date(),
    invitedBy: invitedBy
  });
  
  return true;
};

teamSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    return false; // Member not found
  }
  
  this.members.splice(memberIndex, 1);
  return true;
};

teamSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (!member) {
    return false; // Member not found
  }
  
  member.role = newRole;
  return true;
};

teamSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.userId.toString() === userId.toString()
  );
};

teamSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  return member ? member.role : null;
};

teamSchema.methods.hasPermission = function(userId, permission) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (!member) {
    return false; // Not a member
  }
  
  // Owners have all permissions
  if (member.role === 'owner') {
    return true;
  }
  
  // Admins have most permissions
  if (member.role === 'admin') {
    return true;
  }
  
  // Check specific permission
  return this.permissions[permission] || false;
};

// Static methods
teamSchema.statics.findByOwner = function(ownerId) {
  return this.find({ ownerId: ownerId, isActive: true });
};

teamSchema.statics.findByMember = function(userId) {
  return this.find({ 
    'members.userId': userId, 
    isActive: true 
  });
};

teamSchema.statics.findPublic = function() {
  return this.find({ isPublic: true, isActive: true });
};

teamSchema.statics.searchTeams = function(query, options = {}) {
  const searchQuery = {
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
  };
  
  if (options.isPublic !== undefined) {
    searchQuery.isPublic = options.isPublic;
  }
  
  return this.find(searchQuery);
};

module.exports = mongoose.model('Team', teamSchema);
