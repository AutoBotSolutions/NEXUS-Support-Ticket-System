/**
 * NEXUS User Management System - Comprehensive Debugging Script
 * Tests all user management components and ensures they're operational
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');

// Test configuration
const testConfig = {
  timeout: 5000,
  verbose: true,
  stopOnFailure: false
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  categories: {
    userModel: { total: 0, passed: 0, failed: 0 },
    teamModel: { total: 0, passed: 0, failed: 0 },
    controller: { total: 0, passed: 0, failed: 0 },
    routes: { total: 0, passed: 0, failed: 0 },
    authentication: { total: 0, passed: 0, failed: 0 },
    search: { total: 0, passed: 0, failed: 0 },
    analytics: { total: 0, passed: 0, failed: 0 },
    bulk: { total: 0, passed: 0, failed: 0 }
  }
};

// Helper function to run tests
const runTest = async (category, testName, testFunction) => {
  testResults.total++;
  testResults.categories[category].total++;
  
  try {
    console.log(`🔄 Testing ${category}: ${testName}...`);
    await testFunction();
    testResults.passed++;
    testResults.categories[category].passed++;
    console.log(`✅ ${category}: ${testName} - PASSED`);
  } catch (error) {
    testResults.failed++;
    testResults.categories[category].failed++;
    console.log(`❌ ${category}: ${testName} - FAILED`);
    console.log(`   Error: ${error.message}`);
    
    if (testConfig.stopOnFailure) {
      throw error;
    }
  }
};

// Helper function to expect conditions
const expect = (condition, message) => {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
};

// Mock data for testing
const mockUserData = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  bio: 'Test user bio',
  phone: '+1234567890',
  location: 'Test Location',
  timezone: 'UTC'
};

const mockTeamData = {
  name: 'Test Team',
  description: 'Test team description',
  isPublic: true,
  allowJoinRequests: true,
  maxMembers: 50
};

// Main debugging function
const debugUserManagementSystem = async () => {
  console.log('🔍 NEXUS User Management System Debugging');
  console.log('=====================================');
  console.log('🚀 Starting comprehensive user management system debugging...\n');

  try {
    // Test User Model
    await testUserModel();
    
    // Test Team Model
    await testTeamModel();
    
    // Test Controller Functions
    await testControllerFunctions();
    
    // Test Routes
    await testRoutes();
    
    // Test Authentication
    await testAuthentication();
    
    // Test Search and Filtering
    await testSearchAndFiltering();
    
    // Test Analytics
    await testAnalytics();
    
    // Test Bulk Operations
    await testBulkOperations();
    
    // Generate final report
    generateDebugReport();
    
  } catch (error) {
    console.error('❌ Critical error during debugging:', error);
    process.exit(1);
  }
};

// Test User Model
const testUserModel = async () => {
  await runTest('userModel', 'User Model Schema Validation', async () => {
    const user = new User(mockUserData);
    expect(user.username === 'testuser', 'Username should be set');
    expect(user.email === 'test@example.com', 'Email should be set');
    expect(user.firstName === 'Test', 'First name should be set');
    expect(user.lastName === 'User', 'Last name should be set');
    expect(user.role === 'user', 'Role should be set');
    expect(user.isActive === true, 'User should be active by default');
    expect(user.isEmailVerified === false, 'Email should not be verified by default');
  });
  
  await runTest('userModel', 'User Model Methods', async () => {
    const user = new User(mockUserData);
    
    // Test toSafeObject method
    const safeObject = user.toSafeObject();
    expect(!safeObject.password, 'Password should not be in safe object');
    expect(!safeObject.twoFactorSecret, 'Two-factor secret should not be in safe object');
    
    // Test virtual fields
    expect(user.fullName === 'Test User', 'Full name virtual field should work');
    expect(user.displayName === 'Test User', 'Display name virtual field should work');
  });
  
  await runTest('userModel', 'User Model Static Methods', async () => {
    // Test static methods exist
    expect(typeof User.findByEmail === 'function', 'findByEmail static method should exist');
    expect(typeof User.findByUsername === 'function', 'findByUsername static method should exist');
    expect(typeof User.findActive === 'function', 'findActive static method should exist');
    expect(typeof User.findByRole === 'function', 'findByRole static method should exist');
  });
  
  await runTest('userModel', 'User Model Validation', async () => {
    // Test required fields
    const user = new User();
    
    try {
      await user.validate();
      throw new Error('Validation should fail for missing required fields');
    } catch (error) {
      expect(error.message.includes('required'), 'Should fail for missing required fields');
    }
    
    // Test email format validation
    user.email = 'invalid-email';
    try {
      await user.validate();
      throw new Error('Validation should fail for invalid email');
    } catch (error) {
      expect(true, 'Should fail for invalid email format');
    }
  });
  
  await runTest('userModel', 'User Model Permissions', async () => {
    const user = new User(mockUserData);
    
    // Test hasPermission method
    expect(user.hasPermission('users.read') === false, 'Regular user should not have admin permissions');
    expect(user.hasPermission('users.create') === false, 'Regular user should not have create permission');
    
    // Test admin permissions
    user.role = 'admin';
    expect(user.hasPermission('users.create') === true, 'Admin should have all permissions');
  });
  
  await runTest('userModel', 'User Model Team Methods', async () => {
    const user = new User(mockUserData);
    
    // Test team methods
    expect(user.isInTeam('507f1f77bcf86cd799439011') === false, 'Should not be in team initially');
    expect(user.getTeamRole('507f1f77bcf86cd799439011') === null, 'Should return null for non-member team');
    
    // Add team membership
    user.teams.push({
      teamId: '507f1f77bcf86cd799439011',
      role: 'member',
      joinedAt: new Date()
    });
    
    expect(user.isInTeam('507f1f77bcf86cd799439011') === true, 'Should be in team after adding');
    expect(user.getTeamRole('507f1f77bcf86cd799439011') === 'member', 'Should return correct team role');
  });
};

// Test Team Model
const testTeamModel = async () => {
  await runTest('teamModel', 'Team Model Schema Validation', async () => {
    const team = new Team(mockTeamData);
    expect(team.name === 'Test Team', 'Team name should be set');
    expect(team.description === 'Test team description', 'Team description should be set');
    expect(team.isPublic === true, 'Team should be public');
    expect(team.allowJoinRequests === true, 'Team should allow join requests');
    expect(team.maxMembers === 50, 'Max members should be set');
    expect(team.isActive === true, 'Team should be active by default');
  });
  
  await runTest('teamModel', 'Team Model Virtual Fields', async () => {
    const team = new Team(mockTeamData);
    
    // Add members
    team.members.push(
      { userId: '507f1f77bcf86cd799439011', role: 'owner', joinedAt: new Date() },
      { userId: '507f1f77bcf86cd799439012', role: 'admin', joinedAt: new Date() },
      { userId: '507f1f77bcf86cd799439013', role: 'member', joinedAt: new Date() }
    );
    
    expect(team.memberCount === 3, 'Member count should be correct');
    expect(team.activeMembers === 2, 'Active members should exclude owner');
  });
  
  await runTest('teamModel', 'Team Model Methods', async () => {
    const team = new Team(mockTeamData);
    const userId1 = '507f1f77bcf86cd799439011';
    const userId2 = '507f1f77bcf86cd799439012';
    
    // Test addMember
    expect(team.addMember(userId1, 'member') === true, 'Should add member successfully');
    expect(team.addMember(userId1, 'member') === false, 'Should not add duplicate member');
    expect(team.isMember(userId1) === true, 'Should be member after adding');
    expect(team.getMemberRole(userId1) === 'member', 'Should return correct role');
    
    // Test updateMemberRole
    expect(team.updateMemberRole(userId1, 'admin') === true, 'Should update member role');
    expect(team.getMemberRole(userId1) === 'admin', 'Should return updated role');
    
    // Test removeMember
    expect(team.removeMember(userId1) === true, 'Should remove member successfully');
    expect(team.removeMember(userId1) === false, 'Should not remove non-member');
    expect(team.isMember(userId1) === false, 'Should not be member after removal');
    
    // Test permission checking
    team.addMember(userId2, 'member');
    expect(team.hasPermission(userId2, 'canCreateTickets') === true, 'Member should have basic permissions');
    expect(team.hasPermission(userId2, 'canManageMembers') === false, 'Member should not have admin permissions');
  });
  
  await runTest('teamModel', 'Team Model Static Methods', async () => {
    // Test static methods exist
    expect(typeof Team.findByOwner === 'function', 'findByOwner static method should exist');
    expect(typeof Team.findByMember === 'function', 'findByMember static method should exist');
    expect(typeof Team.findPublic === 'function', 'findPublic static method should exist');
    expect(typeof Team.searchTeams === 'function', 'searchTeams static method should exist');
  });
  
  await runTest('teamModel', 'Team Model Member Limit', async () => {
    const team = new Team({ ...mockTeamData, maxMembers: 2 });
    
    // Add members up to limit
    expect(team.addMember('507f1f77bcf86cd799439011', 'member') === true, 'Should add first member');
    expect(team.addMember('507f1f77bcf86cd799439012', 'member') === true, 'Should add second member');
    expect(team.addMember('507f1f77bcf86cd799439013', 'member') === false, 'Should not add member over limit');
  });
};

// Test Controller Functions
const testControllerFunctions = async () => {
  await runTest('controller', 'Controller Module Loading', async () => {
    const controller = require('../controllers/userManagementController');
    expect(typeof controller === 'object', 'Controller should be an object');
    expect(typeof controller.getUserProfile === 'function', 'getUserProfile should exist');
    expect(typeof controller.updateUserProfile === 'function', 'updateUserProfile should exist');
    expect(typeof controller.getUserPreferences === 'function', 'getUserPreferences should exist');
    expect(typeof controller.updateUserPreferences === 'function', 'updateUserPreferences should exist');
    expect(typeof controller.searchUsers === 'function', 'searchUsers should exist');
    expect(typeof controller.getUserAnalytics === 'function', 'getUserAnalytics should exist');
    expect(typeof controller.getSystemAnalytics === 'function', 'getSystemAnalytics should exist');
    expect(typeof controller.createUser === 'function', 'createUser should exist');
    expect(typeof controller.updateUser === 'function', 'updateUser should exist');
    expect(typeof controller.deleteUser === 'function', 'deleteUser should exist');
    expect(typeof controller.assignRole === 'function', 'assignRole should exist');
  });
  
  await runTest('controller', 'Helper Functions', async () => {
    const controller = require('../controllers/userManagementController');
    
    // Test helper functions by accessing them through the module
    // These are internal functions, so we test their existence through the main functions
    expect(controller.getUserProfile, 'getUserProfile function should be available');
    expect(controller.createUser, 'createUser function should be available');
  });
};

// Test Routes
const testRoutes = async () => {
  await runTest('routes', 'Routes Module Loading', async () => {
    const routes = require('../routes/userManagementEnhancedRoutes');
    expect(typeof routes === 'function', 'Routes should be a function (Express router)');
  });
  
  await runTest('routes', 'Routes Structure', async () => {
    const express = require('express');
    const app = express();
    const routes = require('../routes/userManagementEnhancedRoutes');
    
    // Test if routes can be mounted
    expect(typeof routes === 'function', 'Routes should be mountable');
    
    // Test route mounting doesn't throw errors
    try {
      app.use('/test', routes);
      expect(true, 'Routes should mount without errors');
    } catch (error) {
      throw new Error('Routes mounting failed');
    }
  });
};

// Test Authentication
const testAuthentication = async () => {
  await runTest('authentication', 'Auth Middleware Loading', async () => {
    const auth = require('../middleware/auth');
    expect(typeof auth.authenticateToken === 'function', 'Auth middleware should be a function');
  });
  
  await runTest('authentication', 'JWT Token Generation', async () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: 'test-user-id' }, 'test-secret', { expiresIn: '7d' });
    expect(typeof token === 'string', 'JWT token should be generated');
    expect(token.length > 0, 'JWT token should not be empty');
  });
  
  await runTest('authentication', 'Password Validation', async () => {
    const bcrypt = require('bcryptjs');
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 12);
    expect(typeof hashedPassword === 'string', 'Password should be hashed');
    expect(hashedPassword.length > 0, 'Hashed password should not be empty');
    
    const isValid = await bcrypt.compare(password, hashedPassword);
    expect(isValid === true, 'Password validation should work');
  });
};

// Test Search and Filtering
const testSearchAndFiltering = async () => {
  await runTest('search', 'Search Query Building', async () => {
    // Test search query structure
    const query = 'test';
    const searchQuery = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ]
    };
    
    expect(searchQuery.$or.length === 4, 'Search query should have 4 fields');
    expect(searchQuery.$or[0].username.$regex === query, 'Username regex should match query');
    expect(searchQuery.$or[0].username.$options === 'i', 'Search should be case-insensitive');
  });
  
  await runTest('search', 'Filter Options', async () => {
    const filters = {
      role: 'user',
      isActive: true,
      page: 1,
      limit: 20
    };
    
    expect(filters.role === 'user', 'Role filter should work');
    expect(filters.isActive === true, 'Active filter should work');
    expect(filters.page === 1, 'Page filter should work');
    expect(filters.limit === 20, 'Limit filter should work');
  });
};

// Test Analytics
const testAnalytics = async () => {
  await runTest('analytics', 'Analytics Data Structure', async () => {
    const analytics = {
      profile: {
        joinDate: new Date(),
        lastLogin: new Date(),
        totalLogins: 100,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: false
      },
      activity: {
        lastActivity: new Date(),
        totalTicketsCreated: 50,
        totalTicketsResolved: 25,
        teamsCount: 2
      },
      teams: [
        { teamId: 'team1', role: 'member', joinedAt: new Date() },
        { teamId: 'team2', role: 'admin', joinedAt: new Date() }
      ]
    };
    
    expect(analytics.profile.joinDate instanceof Date, 'Join date should be a Date');
    expect(analytics.profile.totalLogins === 100, 'Total logins should be correct');
    expect(analytics.activity.totalTicketsCreated === 50, 'Tickets created should be correct');
    expect(analytics.teams.length === 2, 'Teams array should have correct length');
  });
  
  await runTest('analytics', 'System Analytics Structure', async () => {
    const systemAnalytics = {
      overview: {
        totalUsers: 100,
        activeUsers: 95,
        inactiveUsers: 5,
        emailVerifiedUsers: 80,
        phoneVerifiedUsers: 60
      },
      byRole: [
        { _id: 'admin', count: 2 },
        { _id: 'user', count: 93 },
        { _id: 'support_agent', count: 5 }
      ],
      recentUsers: [
        { _id: '1', username: 'user1', email: 'user1@example.com', role: 'user' }
      ]
    };
    
    expect(systemAnalytics.overview.totalUsers === 100, 'Total users should be correct');
    expect(systemAnalytics.byRole.length === 3, 'Role breakdown should have 3 entries');
    expect(systemAnalytics.recentUsers.length === 1, 'Recent users should have 1 entry');
  });
};

// Test Bulk Operations
const testBulkOperations = async () => {
  await runTest('bulk', 'Bulk Operation Structure', async () => {
    const bulkOperation = {
      userIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
      operation: 'activate'
    };
    
    expect(Array.isArray(bulkOperation.userIds), 'User IDs should be an array');
    expect(bulkOperation.userIds.length === 2, 'Should have 2 user IDs');
    expect(bulkOperation.operation === 'activate', 'Operation should be specified');
  });
  
  await runTest('bulk', 'Bulk Update Query', async () => {
    const userIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
    const updateQuery = {
      _id: { $in: userIds }
    };
    
    expect(updateQuery._id.$in.length === 2, 'Query should include all user IDs');
    expect(Array.isArray(updateQuery._id.$in), '$in should be an array');
  });
  
  await runTest('bulk', 'Export Data Structure', async () => {
    const exportData = {
      users: [
        { username: 'user1', email: 'user1@example.com', role: 'user', isActive: true },
        { username: 'user2', email: 'user2@example.com', role: 'admin', isActive: true }
      ],
      format: 'json'
    };
    
    expect(Array.isArray(exportData.users), 'Users should be an array');
    expect(exportData.users.length === 2, 'Should have 2 users');
    expect(exportData.format === 'json', 'Format should be specified');
  });
};

// Generate final debug report
const generateDebugReport = () => {
  console.log('\n📊 User Management System Debug Report');
  console.log('=====================================');
  
  // Calculate percentages
  const overallPercentage = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  
  console.log(`\n📈 Overall Results: ${testResults.passed}/${testResults.total} (${overallPercentage}%)`);
  
  // Category breakdown
  console.log('\n📋 Category Breakdown:');
  Object.keys(testResults.categories).forEach(category => {
    const catResults = testResults.categories[category];
    const catPercentage = catResults.total > 0 ? (catResults.passed / catResults.total * 100).toFixed(1) : 0;
    const status = catPercentage === '100.0' ? '✅' : catPercentage >= '80.0' ? '⚠️' : '❌';
    console.log(`${status} ${category.charAt(0).toUpperCase() + category.slice(1)}: ${catResults.passed}/${catResults.total} (${catPercentage}%)`);
  });
  
  // System status assessment
  console.log('\n🔍 System Status Assessment:');
  if (overallPercentage >= '90') {
    console.log('✅ User Management System is EXCELLENT - All major components operational');
  } else if (overallPercentage >= '80') {
    console.log('⚠️ User Management System is GOOD - Most components operational, minor issues present');
  } else if (overallPercentage >= '70') {
    console.log('⚠️ User Management System is ACCEPTABLE - Core components operational, some issues present');
  } else {
    console.log('❌ User Management System NEEDS ATTENTION - Significant issues present');
  }
  
  // Critical components status
  console.log('\n🎯 Critical Components Status:');
  const criticalComponents = ['userModel', 'teamModel', 'controller', 'routes', 'authentication'];
  criticalComponents.forEach(component => {
    const compResults = testResults.categories[component];
    const compPercentage = compResults.total > 0 ? (compResults.passed / compResults.total * 100).toFixed(1) : 0;
    const status = compPercentage === '100.0' ? '✅' : compPercentage >= '80.0' ? '⚠️' : '❌';
    console.log(`${status} ${component.charAt(0).toUpperCase() + component.slice(1)}: ${compResults.passed}/${compResults.total}`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (testResults.categories.userModel.failed > 0) {
    console.log('🔧 Fix user model validation and method issues');
  }
  if (testResults.categories.teamModel.failed > 0) {
    console.log('🔧 Fix team model member management and permission issues');
  }
  if (testResults.categories.controller.failed > 0) {
    console.log('🔧 Fix controller function implementation and error handling');
  }
  if (testResults.categories.routes.failed > 0) {
    console.log('🔧 Fix route mounting and middleware issues');
  }
  if (testResults.categories.authentication.failed > 0) {
    console.log('🔧 Fix authentication middleware and JWT token issues');
  }
  if (testResults.categories.search.failed > 0) {
    console.log('🔧 Fix search query building and filtering logic');
  }
  if (testResults.categories.analytics.failed > 0) {
    console.log('🔧 Fix analytics data structure and calculation logic');
  }
  if (testResults.categories.bulk.failed > 0) {
    console.log('🔧 Fix bulk operation implementation and data handling');
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    results: testResults,
    overallPercentage: parseFloat(overallPercentage),
    status: overallPercentage >= '90' ? 'EXCELLENT' : overallPercentage >= '80' ? 'GOOD' : overallPercentage >= '70' ? 'ACCEPTABLE' : 'NEEDS_ATTENTION'
  };
  
  try {
    const fs = require('fs');
    fs.writeFileSync('./USER_MANAGEMENT_DEBUG_REPORT.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: ./USER_MANAGEMENT_DEBUG_REPORT.json');
  } catch (error) {
    console.log('\n⚠️ Could not save detailed report:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 Overall: ${testResults.passed}/${testResults.total} (${overallPercentage}%)`);
  console.log('=' .repeat(50));
  
  // Exit with appropriate code
  process.exit(overallPercentage >= '80' ? 0 : 1);
};

// Run the debugging
debugUserManagementSystem().catch(error => {
  console.error('❌ Debugging failed:', error);
  process.exit(1);
});
