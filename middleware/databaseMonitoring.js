const mongoose = require('mongoose');
// Simple database monitoring without prom-client dependency

// Database monitoring middleware
const databaseMonitoring = (req, res, next) => {
  const start = Date.now();
  
  // Track database connection state
  const connectionState = mongoose.connection.readyState;
  const connectionStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  // Database connection tracking
  const { updateDatabaseConnections } = require('./apmMonitoringSimple');
  updateDatabaseConnections(mongoose.connection.readyState === 1 ? 1 : 0);
  
  // Override res.json to track database operations
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    // Log slow database operations (>500ms)
    if (duration > 500) {
      console.warn(`Slow database operation detected: ${duration}ms for ${req.method} ${req.path}`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Database performance monitoring
const monitorDatabasePerformance = () => {
  const { updateDatabaseConnections } = require('./apmMonitoringSimple');
  
  // Monitor connection events
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected successfully');
    updateDatabaseConnections(1);
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    updateDatabaseConnections(0);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    updateDatabaseConnections(0);
  });
  
  // Monitor query performance
  mongoose.set('debug', (collectionName, method, query, doc) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] DB Query: ${collectionName}.${method}`, JSON.stringify(query));
  });
};

// Database health check
const databaseHealthCheck = async () => {
  try {
    const state = mongoose.connection.readyState;
    const host = mongoose.connection.host;
    const port = mongoose.connection.port;
    const name = mongoose.connection.name;
    
    // Test database connectivity
    await mongoose.connection.db.admin().ping();
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    
    return {
      status: 'healthy',
      connectionState: state,
      host: host,
      port: port,
      database: name,
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      avgObjSize: stats.avgObjSize
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      connectionState: mongoose.connection.readyState
    };
  }
};

// Slow query monitoring
const slowQueryMiddleware = () => {
  return (req, res, next) => {
    const start = Date.now();
    
    // Override mongoose query exec to track slow queries
    const originalExec = mongoose.Query.prototype.exec;
    mongoose.Query.prototype.exec = function() {
      const queryStart = Date.now();
      return originalExec.call(this).then(result => {
        const queryDuration = Date.now() - queryStart;
        
        if (queryDuration > 1000) {
          console.warn(`Slow query detected (${queryDuration}ms):`, {
            collection: this.model.collection.name,
            operation: this.op,
            filter: this.getFilter(),
            sort: this.getOptions().sort,
            limit: this.getOptions().limit
          });
        }
        
        return result;
      }).catch(error => {
        const queryDuration = Date.now() - queryStart;
        console.error(`Query error (${queryDuration}ms):`, {
          collection: this.model.collection.name,
          operation: this.op,
          error: error.message
        });
        throw error;
      });
    };
    
    next();
  };
};

module.exports = {
  databaseMonitoring,
  monitorDatabasePerformance,
  databaseHealthCheck,
  slowQueryMiddleware
};
