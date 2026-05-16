
/**
 * Mock Factory for Testing
 * Provides consistent mock objects for testing
 */

const { faker } = require('@faker-js/faker');

class MockFactory {
  static user(overrides = {}) {
    return {
      _id: faker.datatype.mongodbId(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: 'hashedpassword',
      role: 'user',
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }
  
  static ticket(overrides = {}) {
    return {
      _id: faker.datatype.mongodbId(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
      status: faker.helpers.arrayElement(['open', 'in_progress', 'closed']),
      category: faker.helpers.arrayElement(['general', 'bug', 'feature', 'support']),
      createdBy: faker.datatype.mongodbId(),
      assignedTo: faker.datatype.mongodbId(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }
  
  static notification(overrides = {}) {
    return {
      _id: faker.datatype.mongodbId(),
      userId: faker.datatype.mongodbId(),
      type: faker.helpers.arrayElement(['welcome', 'ticket_assigned', 'ticket_updated', 'system_alert']),
      channels: faker.helpers.arrayElements(['email', 'inapp', 'push', 'sms', 'webhook']),
      data: {
        title: faker.lorem.sentence(),
        message: faker.lorem.paragraph()
      },
      status: {
        email: faker.helpers.arrayElement(['pending', 'sent', 'delivered', 'failed']),
        inapp: faker.helpers.arrayElement(['unread', 'read']),
        push: faker.helpers.arrayElement(['pending', 'sent', 'delivered', 'failed']),
        sms: faker.helpers.arrayElement(['pending', 'sent', 'delivered', 'failed']),
        webhook: faker.helpers.arrayElement(['pending', 'sent', 'delivered', 'failed'])
      },
      createdAt: faker.date.past(),
      ...overrides
    };
  }
}

module.exports = MockFactory;
