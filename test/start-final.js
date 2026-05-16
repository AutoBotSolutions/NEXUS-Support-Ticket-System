#!/usr/bin/env node

// Final working startup script for NEXUS with monitoring
const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting NEXUS Support System (Final Working Version)...\n');

// Start the monitoring server first
const monitoring = spawn('node', ['simple-monitoring-setup.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Wait a moment for monitoring to start
setTimeout(() => {
  console.log('📊 Monitoring server started on http://localhost:3001');
  console.log('📈 Dashboard: http://localhost:3001/dashboard\n');
  
  // Start the main NEXUS application (minimal working version)
  const nexus = spawn('node', ['server-minimal.js'], {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: '3000'
    }
  });
  
  console.log('🎯 NEXUS Application starting on http://localhost:3000');
  
  // Check if main app is responding
  setTimeout(() => {
    const checkApp = () => {
      const req = http.get('http://localhost:3000/api/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('✅ NEXUS Application is running and healthy!');
          console.log('\n🎉 SUCCESS! Both services are running:\n');
          console.log('📱 Main Application: http://localhost:3000');
          console.log('📊 Monitoring Dashboard: http://localhost:3001/dashboard');
          console.log('📈 Monitoring Metrics: http://localhost:3001/metrics');
          console.log('🔍 App Metrics: http://localhost:3000/metrics');
          console.log('💚 App Health: http://localhost:3000/api/health');
          console.log('📊 App Status: http://localhost:3000/api/monitoring/status');
          console.log('\n💡 Press Ctrl+C to stop both services');
          console.log('\n📝 Features Available:');
          console.log('   ✅ Ticket Management (in-memory storage)');
          console.log('   ✅ Real-time Monitoring Dashboard');
          console.log('   ✅ Metrics Collection');
          console.log('   ✅ Health Checks');
          console.log('   ✅ Response Time Tracking');
          console.log('\n🔧 For Full Features (MongoDB + Advanced Monitoring):');
          console.log('   1. Install Docker: curl -fsSL https://get.docker.com -o get-docker.sh');
          console.log('   2. Install Docker Compose: sudo apt install docker-compose');
          console.log('   3. Start MongoDB: docker run -d -p 27017:27017 mongo');
          console.log('   4. Run full stack: docker-compose up -d');
        });
      });
      
      req.on('error', () => {
        console.log('⏳ Waiting for NEXUS Application to start...');
        setTimeout(checkApp, 2000);
      });
    };
    
    checkApp();
  }, 3000);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down services...');
    nexus.kill('SIGTERM');
    monitoring.kill('SIGTERM');
    process.exit(0);
  });
  
  nexus.on('close', (code) => {
    console.log(`NEXUS Application exited with code ${code}`);
    monitoring.kill('SIGTERM');
    process.exit(code);
  });
  
}, 2000);

monitoring.on('close', (code) => {
  console.log(`Monitoring server exited with code ${code}`);
  process.exit(code);
});
