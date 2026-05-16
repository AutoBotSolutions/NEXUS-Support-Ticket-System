const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const securityLogger = (req, res, next) => {
  // Log security events
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    success: res.statusCode < 400,
    statusCode: res.statusCode
  };

  // Log failed authentication attempts
  if (req.url.includes('/login') && res.statusCode === 401) {
    logData.event = 'FAILED_LOGIN_ATTEMPT';
    logData.username = req.body?.username;
    writeSecurityLog(logData);
  }

  // Log successful authentication
  if (req.url.includes('/login') && res.statusCode === 200) {
    logData.event = 'SUCCESSFUL_LOGIN';
    logData.username = req.body?.username;
    writeSecurityLog(logData);
  }

  // Log user registration
  if (req.url.includes('/register') && res.statusCode === 201) {
    logData.event = 'USER_REGISTRATION';
    logData.username = req.body?.username;
    logData.email = req.body?.email;
    writeSecurityLog(logData);
  }

  // Log rate limit hits
  if (res.statusCode === 429) {
    logData.event = 'RATE_LIMIT_EXCEEDED';
    writeSecurityLog(logData);
  }

  // Log suspicious activities
  if (req.body && typeof req.body === 'object') {
    const suspiciousPatterns = [
      /\$where/i,
      /\$ne/i,
      /\$gt/i,
      /\$lt/i,
      /script/i,
      /javascript:/i,
      /<script/i,
      /onerror/i,
      /onload/i
    ];
    
    const bodyString = JSON.stringify(req.body);
    if (suspiciousPatterns.some(pattern => pattern.test(bodyString))) {
      logData.event = 'SUSPICIOUS_INPUT_DETECTED';
      logData.body = req.body;
      writeSecurityLog(logData);
    }
  }

  next();
};

function writeSecurityLog(logData) {
  const logFile = path.join(logsDir, 'security.log');
  const logLine = JSON.stringify(logData) + '\n';
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error('Error writing to security log:', err);
    }
  });
}

module.exports = securityLogger;
