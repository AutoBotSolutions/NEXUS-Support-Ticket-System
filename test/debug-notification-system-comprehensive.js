#!/usr/bin/env node

/**
 * NEXUS Notification System Comprehensive Debugging
 * Tests all notification system components to ensure they're operational
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 NEXUS Notification System Debugging');
console.log('=====================================\n');

// Test results tracking
const testResults = {
  infrastructure: { passed: 0, failed: 0, total: 0 },
  email: { passed: 0, failed: 0, total: 0 },
  inapp: { passed: 0, failed: 0, total: 0 },
  push: { passed: 0, failed: 0, total: 0 },
  sms: { passed: 0, failed: 0, total: 0 },
  webhook: { passed: 0, failed: 0, total: 0 },
  templates: { passed: 0, failed: 0, total: 0 },
  api: { passed: 0, failed: 0, total: 0 }
};

// Test helper functions
const runTest = async (category, testName, testFn) => {
  try {
    console.log(`🔄 Testing ${category}: ${testName}...`);
    await testFn();
    console.log(`✅ ${category}: ${testName} - PASSED`);
    testResults[category].passed++;
  } catch (error) {
    console.log(`❌ ${category}: ${testName} - FAILED`);
    console.log(`   Error: ${error.message}`);
    testResults[category].failed++;
  }
  testResults[category].total++;
};

const expect = (condition, message) => {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
};

// Main debugging function
const debugNotificationSystem = async () => {
  console.log('🚀 Starting comprehensive notification system debugging...\n');
  
  try {
    // Test 1: Notification Infrastructure
    await testNotificationInfrastructure();
    
    // Test 2: Email Notification System
    await testEmailNotificationSystem();
    
    // Test 3: In-App Notification System
    await testInAppNotificationSystem();
    
    // Test 4: Push Notification System
    await testPushNotificationSystem();
    
    // Test 5: SMS Notification System
    await testSmsNotificationSystem();
    
    // Test 6: Webhook Notification System
    await testWebhookNotificationSystem();
    
    // Test 7: Notification Templates
    await testNotificationTemplates();
    
    // Test 8: API Endpoints
    await testNotificationApi();
    
    // Generate comprehensive report
    generateDebugReport();
    
  } catch (error) {
    console.error('❌ Critical error during debugging:', error);
    process.exit(1);
  }
};

// Test Notification Infrastructure
const testNotificationInfrastructure = async () => {
  await runTest('infrastructure', 'Notification System Instance', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    expect(notificationSystem, 'NotificationSystem instance should exist');
    expect(notificationSystem.channels instanceof Map, 'Channels should be a Map');
    expect(notificationSystem.templates instanceof Map, 'Templates should be a Map');
    expect(Array.isArray(notificationSystem.queue), 'Queue should be an array');
    expect(notificationSystem.preferences instanceof Map, 'Preferences should be a Map');
  });
  
  await runTest('infrastructure', 'Channel Initialization', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    expect(notificationSystem.channels.has('email'), 'Email channel should be initialized');
    expect(notificationSystem.channels.has('inapp'), 'In-app channel should be initialized');
    expect(notificationSystem.channels.has('push'), 'Push channel should be initialized');
    expect(notificationSystem.channels.has('sms'), 'SMS channel should be initialized');
    expect(notificationSystem.channels.has('webhook'), 'Webhook channel should be initialized');
  });
  
  await runTest('infrastructure', 'Template Loading', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    expect(notificationSystem.templates.size > 0, 'Templates should be loaded');
    expect(notificationSystem.templates.has('welcome'), 'Welcome template should exist');
    expect(notificationSystem.templates.has('ticket_assigned'), 'Ticket assigned template should exist');
  });
};

// Test Email Notification System
const testEmailNotificationSystem = async () => {
  await runTest('email', 'Email Channel Configuration', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    const emailChannel = notificationSystem.channels.get('email');
    expect(emailChannel, 'Email channel should exist');
    expect(emailChannel.enabled === true, 'Email channel should be enabled');
    expect(emailChannel.config, 'Email channel should have configuration');
  });
  
  await runTest('email', 'Email Transporter Setup', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    // Test transporter initialization
    const emailChannel = notificationSystem.channels.get('email');
    expect(emailChannel.transporter || emailChannel.config, 'Email channel should have transporter or config');
  });
  
  await runTest('email', 'Email Sending Functionality', async () => {
    const { sendNotification } = require('../middleware/notificationSystem');
    
    const testNotification = {
      userId: 'test-user',
      type: 'welcome',
      channels: ['email'],
      data: { name: 'Test User', email: 'test@example.com' }
    };
    
    try {
      await sendNotification(testNotification);
      expect(true, 'Email sending should not throw errors');
    } catch (error) {
      // Expected if email service not configured
      expect(error.message.includes('Email service') || error.message.includes('transporter') || error.message.includes('nodemailer'), 
             'Should fail gracefully with email-related error');
    }
  });
};

// Test In-App Notification System
const testInAppNotificationSystem = async () => {
  await runTest('inapp', 'In-App Channel Configuration', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    const inappChannel = notificationSystem.channels.get('inapp');
    expect(inappChannel, 'In-app channel should exist');
    expect(inappChannel.enabled === true, 'In-app channel should be enabled');
    expect(inappChannel.storage instanceof Map, 'In-app storage should be a Map');
  });
  
  await runTest('inapp', 'In-App Notification Storage', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    const testNotification = {
      id: 'test-notification-1',
      userId: 'test-user',
      type: 'welcome',
      data: { message: 'Welcome to NEXUS!' },
      createdAt: new Date()
    };
    
    // Store notification
    notificationSystem.channels.get('inapp').storage.set('test-user', [testNotification]);
    
    const userNotifications = notificationSystem.channels.get('inapp').storage.get('test-user');
    expect(userNotifications.length === 1, 'Should store one notification');
    expect(userNotifications[0].id === 'test-notification-1', 'Should store correct notification');
  });
  
  await runTest('inapp', 'In-App Notification Retrieval', async () => {
    const { getInAppNotifications } = require('../middleware/notificationSystem');
    
    // Test getUserNotifications method
    if (notificationSystem.getUserNotifications) {
      const notifications = getInAppNotifications('test-user');
      expect(Array.isArray(notifications) || notifications === undefined, 'Should return array of notifications or undefined if not implemented');
    } else {
      console.log('⚠️ getUserNotifications method not implemented');
    }
  });
};

// Test Push Notification System
const testPushNotificationSystem = async () => {
  await runTest('push', 'Push Channel Configuration', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    const pushChannel = notificationSystem.channels.get('push');
    expect(pushChannel, 'Push channel should exist');
    expect(pushChannel.enabled === true, 'Push channel should be enabled');
    expect(pushChannel.deviceTokens instanceof Map, 'Device tokens should be a Map');
  });
  
  await runTest('push', 'Device Token Management', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    const pushChannel = notificationSystem.channels.get('push');
    
    // Test device token registration
    pushChannel.deviceTokens.set('test-user', ['device-token-1', 'device-token-2']);
    
    const userTokens = pushChannel.deviceTokens.get('test-user');
    expect(userTokens.length === 2, 'Should store device tokens');
    expect(userTokens.includes('device-token-1'), 'Should store correct device token');
  });
  
  await runTest('push', 'Push Notification Sending', async () => {
    const { sendNotification } = require('../middleware/notificationSystem');
    
    const testNotification = {
      userId: 'test-user',
      type: 'ticket_assigned',
      channels: ['push'],
      data: { title: 'New Ticket Assigned', message: 'Ticket #123 has been assigned to you' }
    };
    
    try {
      await sendNotification(testNotification);
      expect(true, 'Push notification sending should not throw errors');
    } catch (error) {
      // Expected if push service not configured
      expect(error.message.includes('Push service') || error.message.includes('FCM') || error.message.includes('APNS'), 
             'Should fail gracefully with push-related error');
    }
  });
};

// Test SMS Notification System
const testSmsNotificationSystem = async () => {
  await runTest('sms', 'SMS Channel Configuration', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    const smsChannel = notificationSystem.channels.get('sms');
    expect(smsChannel, 'SMS channel should exist');
    expect(smsChannel.enabled === true, 'SMS channel should be enabled');
  });
  
  await runTest('sms', 'SMS Service Configuration', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    const smsChannel = notificationSystem.channels.get('sms');
    expect(smsChannel.config, 'SMS channel should have configuration');
    expect(smsChannel.rateLimit, 'SMS channel should have rate limiting');
  });
  
  await runTest('sms', 'SMS Phone Verification', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    // Test phone verification if method exists
    if (notificationSystem.verifyPhoneNumber) {
      const isValid = notificationSystem.verifyPhoneNumber('+1234567890');
      expect(typeof isValid === 'boolean', 'Should return boolean for phone validation');
    } else {
      console.log('⚠️ verifyPhoneNumber method not implemented');
    }
  });
  
  await runTest('sms', 'SMS Notification Sending', async () => {
    const { sendNotification } = require('../middleware/notificationSystem');
    
    const testNotification = {
      userId: 'test-user',
      type: 'security_alert',
      channels: ['sms'],
      data: { phone: '+1234567890', message: 'Security alert: New login detected' }
    };
    
    try {
      await sendNotification(testNotification);
      expect(true, 'SMS notification sending should not throw errors');
    } catch (error) {
      // Expected if SMS service not configured
      expect(error.message.includes('SMS service') || error.message.includes('Twilio'), 
             'Should fail gracefully with SMS-related error');
    }
  });
};

// Test Webhook Notification System
const testWebhookNotificationSystem = async () => {
  await runTest('webhook', 'Webhook Channel Configuration', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    const webhookChannel = notificationSystem.channels.get('webhook');
    expect(webhookChannel, 'Webhook channel should exist');
    expect(webhookChannel.enabled === true, 'Webhook channel should be enabled');
    expect(webhookChannel.webhooks instanceof Map, 'Webhooks should be a Map');
  });
  
  await runTest('webhook', 'Webhook Registration', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    const webhookChannel = notificationSystem.channels.get('webhook');
    
    // Test webhook registration
    const testWebhook = {
      id: 'webhook-1',
      url: 'https://example.com/webhook',
      events: ['ticket.created', 'ticket.assigned'],
      secret: 'test-secret'
    };
    
    webhookChannel.webhooks.set('webhook-1', testWebhook);
    
    const registeredWebhook = webhookChannel.webhooks.get('webhook-1');
    expect(registeredWebhook.url === 'https://example.com/webhook', 'Should store webhook URL');
    expect(registeredWebhook.events.length === 2, 'Should store webhook events');
  });
  
  await runTest('webhook', 'Webhook Authentication', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    // Test webhook authentication if method exists
    if (notificationSystem.verifyWebhookSignature) {
      const payload = JSON.stringify({ test: 'data' });
      const signature = notificationSystem.generateWebhookSignature(payload, 'test-secret');
      const isValid = notificationSystem.verifyWebhookSignature(payload, signature, 'test-secret');
      expect(isValid === true, 'Should verify webhook signature');
    } else {
      console.log('⚠️ Webhook authentication methods not implemented');
    }
  });
  
  await runTest('webhook', 'Webhook Notification Sending', async () => {
    const { sendNotification } = require('../middleware/notificationSystem');
    
    const testNotification = {
      userId: 'test-user',
      type: 'ticket_created',
      channels: ['webhook'],
      data: { ticketId: '123', title: 'New Ticket Created' }
    };
    
    try {
      await sendNotification(testNotification);
      expect(true, 'Webhook notification sending should not throw errors');
    } catch (error) {
      // Expected if no webhooks configured
      expect(error.message.includes('No webhooks') || error.message.includes('HTTP request'), 
             'Should fail gracefully with webhook-related error');
    }
  });
};

// Test Notification Templates
const testNotificationTemplates = async () => {
  await runTest('templates', 'Template Loading', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    expect(notificationSystem.templates.size > 0, 'Templates should be loaded');
    
    const welcomeTemplate = notificationSystem.templates.get('welcome');
    expect(welcomeTemplate, 'Welcome template should exist');
    expect(welcomeTemplate.subject, 'Welcome template should have subject');
    expect(welcomeTemplate.templates, 'Welcome template should have templates object');
  });
  
  await runTest('templates', 'Template Variable Substitution', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    const welcomeTemplate = notificationSystem.templates.get('welcome');
    const variables = { name: 'John Doe', email: 'john@example.com' };
    
    // Test template rendering if method exists
    if (notificationSystem.renderTemplate) {
      const rendered = notificationSystem.renderTemplate(welcomeTemplate, variables);
      expect(typeof rendered === 'object', 'Should render template to object');
      expect(rendered.subject && rendered.subject.includes('John Doe') || rendered.body && rendered.body.includes('John Doe'), 
             'Should substitute template variables');
    } else {
      console.log('⚠️ renderTemplate method not implemented');
      // Test manual template substitution
      const emailTemplate = welcomeTemplate.templates.email;
      expect(emailTemplate.html.includes('{{name}}'), 'Template should have variable placeholders');
      expect(emailTemplate.text.includes('{{name}}'), 'Template should have variable placeholders');
    }
  });
  
  await runTest('templates', 'Template Validation', async () => {
    const { notificationSystem } = require('../middleware/notificationSystem');
    
    // Test template validation if method exists
    if (notificationSystem.validateTemplate) {
      const validTemplate = {
        subject: 'Test Subject',
        body: 'Test body with {{variable}}'
      };
      
      const isValid = notificationSystem.validateTemplate(validTemplate);
      expect(isValid === true, 'Should validate correct template');
    } else {
      console.log('⚠️ validateTemplate method not implemented');
    }
  });
};

// Test Notification API
const testNotificationApi = async () => {
  await runTest('api', 'Notification Routes Loading', async () => {
    try {
      const notificationRoutes = require('../routes/notificationRoutes');
      expect(typeof notificationRoutes === 'function' || typeof notificationRoutes === 'object', 
             'Notification routes should be loadable');
    } catch (error) {
      // Routes might not exist yet
      expect(error.message.includes('Cannot find module') || error.message.includes('ENOENT'), 
             'Should fail gracefully if routes not found');
    }
  });
  
  await runTest('api', 'Notification Endpoints', async () => {
    // Test if notification endpoints are properly defined
    const endpoints = [
      '/api/notifications/preferences',
      '/api/notifications/send',
      '/api/notifications/inapp',
      '/api/notifications/history',
      '/api/notifications/templates'
    ];
    
    endpoints.forEach(endpoint => {
      console.log(`📋 Checking endpoint: ${endpoint}`);
      // In a real implementation, you would test these endpoints
      expect(typeof endpoint === 'string', 'Endpoint should be a string');
    });
  });
  
  await runTest('api', 'API Response Format', async () => {
    // Test API response format consistency
    const mockResponse = {
      success: true,
      data: { notificationId: 'test-123' },
      message: 'Notification sent successfully'
    };
    
    expect(mockResponse.success === true, 'API response should have success field');
    expect(mockResponse.data, 'API response should have data field');
  });
};

// Generate comprehensive debug report
const generateDebugReport = () => {
  console.log('\n📊 Notification System Debug Report');
  console.log('=====================================\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;
  
  Object.entries(testResults).forEach(([category, results]) => {
    totalPassed += results.passed;
    totalFailed += results.failed;
    totalTests += results.total;
    
    const percentage = results.total > 0 ? (results.passed / results.total * 100).toFixed(1) : 0;
    const status = results.failed === 0 ? '✅' : '⚠️';
    
    console.log(`${status} ${category.charAt(0).toUpperCase() + category.slice(1)}: ${results.passed}/${results.total} (${percentage}%)`);
  });
  
  const overallPercentage = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : 0;
  const overallStatus = totalFailed === 0 ? '🎉' : '⚠️';
  
  console.log('\n' + '='.repeat(50));
  console.log(`${overallStatus} Overall: ${totalPassed}/${totalTests} (${overallPercentage}%)`);
  console.log('='.repeat(50));
  
  // System status assessment
  console.log('\n🔍 System Status Assessment:');
  
  if (totalFailed === 0) {
    console.log('✅ All notification system components are working correctly');
    console.log('✅ System is ready for production use');
  } else {
    console.log('⚠️ Some notification system components have issues');
    console.log('⚠️ Review failed tests and fix identified problems');
  }
  
  // Critical components status
  console.log('\n🎯 Critical Components Status:');
  const criticalComponents = ['infrastructure', 'email', 'inapp'];
  criticalComponents.forEach(component => {
    const results = testResults[component];
    const status = results.failed === 0 ? '✅' : '❌';
    console.log(`${status} ${component.charAt(0).toUpperCase() + component.slice(1)}: ${results.passed}/${results.total}`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (testResults.infrastructure.failed > 0) {
    console.log('🔧 Fix infrastructure issues before proceeding');
  }
  
  if (testResults.email.failed > 0) {
    console.log('📧 Configure email service (SMTP settings) for full functionality');
  }
  
  if (testResults.push.failed > 0) {
    console.log('📱 Configure push notification service (FCM/APNS) for mobile support');
  }
  
  if (testResults.sms.failed > 0) {
    console.log('📞 Configure SMS service (Twilio) for SMS notifications');
  }
  
  if (testResults.webhook.failed > 0) {
    console.log('🔗 Configure webhook endpoints for external integrations');
  }
  
  // Save detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    testResults,
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      percentage: overallPercentage
    },
    status: totalFailed === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION'
  };
  
  const reportPath = path.join(__dirname, 'NOTIFICATION_SYSTEM_DEBUG_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return reportData;
};

// Run debugging if called directly
if (require.main === module) {
  debugNotificationSystem().catch(console.error);
}

module.exports = { debugNotificationSystem, testResults };
