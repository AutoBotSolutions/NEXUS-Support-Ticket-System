const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    const options = {
      // SSL/TLS configuration
      ssl: process.env.MONGODB_SSL === 'true',
      tls: process.env.MONGODB_TLS === 'true',
      tlsAllowInvalidCertificates: process.env.MONGODB_TLS_ALLOW_INVALID_CERTS === 'true',
      tlsCAFile: process.env.MONGODB_TLS_CA_FILE,
      tlsCertificateKeyFile: process.env.MONGODB_TLS_CERT_KEY_FILE,
      tlsCertificateKeyFilePassword: process.env.MONGODB_TLS_CERT_KEY_PASSWORD,

      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,

      // Security settings
      authSource: 'admin',
    };

    // Remove undefined options
    Object.keys(options).forEach(key => {
      if (options[key] === undefined) {
        delete options[key];
      }
    });

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`MongoDB SSL: ${options.ssl ? 'Enabled' : 'Disabled'}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
