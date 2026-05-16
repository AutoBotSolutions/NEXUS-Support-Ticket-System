#!/bin/bash

# NEXUS Monitoring Stack Setup Script
# This script sets up the complete monitoring infrastructure for NEXUS

set -e

echo "🚀 Setting up NEXUS Monitoring Stack..."
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if we're in the correct directory
if [[ ! -f "package.json" ]]; then
    print_error "Please run this script from the NEXUS project root directory"
    exit 1
fi

print_header "Step 1: Checking Prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
print_status "Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

# Check Docker (optional)
if command -v docker &> /dev/null; then
    print_status "Docker is installed"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker is not installed. Some features will be limited."
    DOCKER_AVAILABLE=false
fi

# Check Docker Compose (optional)
if command -v docker-compose &> /dev/null; then
    print_status "Docker Compose is installed"
    DOCKER_COMPOSE_AVAILABLE=true
else
    print_warning "Docker Compose is not installed. Some features will be limited."
    DOCKER_COMPOSE_AVAILABLE=false
fi

print_header "Step 2: Installing Dependencies..."

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

print_header "Step 3: Setting up Environment Configuration..."

# Create .env file if it doesn't exist
if [[ ! -f ".env" ]]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration"
fi

# Create .env.alerting file if it doesn't exist
if [[ ! -f ".env.alerting" ]]; then
    print_status "Creating .env.alerting file from template..."
    cp .env.alerting.example .env.alerting
    print_warning "Please edit .env.alerting file with your alerting configuration"
fi

print_header "Step 4: Creating Required Directories..."

# Create necessary directories
mkdir -p logs
mkdir -p monitoring
mkdir -p dashboards
mkdir -p scripts
mkdir -p docs/monitoring

print_status "Created required directories"

print_header "Step 5: Setting up Monitoring Configuration..."

# Create Prometheus configuration if it doesn't exist
if [[ ! -f "monitoring/prometheus.yml" ]]; then
    print_status "Creating Prometheus configuration..."
    cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'nexus-app'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'mongodb-exporter'
    static_configs:
      - targets: ['mongodb-exporter:9216']
EOF
fi

# Create AlertManager configuration if it doesn't exist
if [[ ! -f "monitoring/alertmanager.yml" ]]; then
    print_status "Creating AlertManager configuration..."
    cat > monitoring/alertmanager.yml << 'EOF'
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@nexus-support.com'
  smtp_auth_username: 'alerts@nexus-support.com'
  smtp_auth_password: 'your_password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://localhost:3000/api/alerts/webhook'

  - name: 'critical-alerts'
    email_configs:
      - to: 'admin@nexus-support.com'
        subject: 'CRITICAL: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}

  - name: 'warning-alerts'
    email_configs:
      - to: 'team@nexus-support.com'
        subject: 'WARNING: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
EOF
fi

# Create alert rules if they don't exist
if [[ ! -f "monitoring/alert_rules.yml" ]]; then
    print_status "Creating alert rules..."
    cat > monitoring/alert_rules.yml << 'EOF'
groups:
  - name: nexus_alerts
    rules:
      - alert: HighErrorRate
        expr: application_errors_total / application_requests_total > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"

      - alert: HighResponseTime
        expr: application_response_time_seconds > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "Response time is {{ $value }}s for the last 5 minutes"

      - alert: HighMemoryUsage
        expr: system_memory_usage > 85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is {{ $value }}% for the last 5 minutes"

      - alert: HighCPUUsage
        expr: system_cpu_usage > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is {{ $value }}% for the last 5 minutes"

      - alert: DiskSpaceLow
        expr: system_disk_usage > 85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space detected"
          description: "Disk usage is {{ $value }}% for the last 5 minutes"

      - alert: ApplicationDown
        expr: up{job="nexus-app"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "NEXUS application is down"
          description: "The NEXUS application has been down for more than 1 minute"
EOF
fi

print_header "Step 6: Setting up Docker Stack (if available)..."

if [[ "$DOCKER_AVAILABLE" == "true" && "$DOCKER_COMPOSE_AVAILABLE" == "true" ]]; then
    print_status "Setting up Docker monitoring stack..."
    
    # Update docker-compose.yml with monitoring services
    if [[ ! -f "docker-compose.yml" ]]; then
        print_status "Creating docker-compose.yml..."
        cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}
    depends_on:
      - mongodb
      - prometheus
    networks:
      - nexus-network

  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
    networks:
      - nexus-network

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/alert_rules.yml:/etc/prometheus/alert_rules.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - nexus-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./dashboards:/etc/grafana/provisioning/dashboards
    networks:
      - nexus-network

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager-data:/alertmanager
    networks:
      - nexus-network

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - nexus-network

  mongodb-exporter:
    image: percona/mongodb_exporter:latest
    ports:
      - "9216:9216"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017
      - MONGODB_EXPORTER_WEB_LISTEN_ADDRESS=:9216
      - MONGODB_EXPORTER_LOG_LEVEL=info
      - MONGODB_EXPORTER_DISCOVERING_MODE=true
      - MONGODB_EXPORTER_COMPATIBLE_MODE=true
      - MONGODB_EXPORTER_COLLECT_DATABASE=true
      - MONGODB_EXPORTER_COLLECT_COLLECTION=true
      - MONGODB_EXPORTER_COLLECT_INDEXUSAGE=true
      - MONGODB_EXPORTER_COLLECT_TOPMETRICS=true
      - MONGODB_EXPORTER_COLLECT_QUERYSTATS=true
    depends_on:
      - mongodb
    networks:
      - nexus-network

volumes:
  mongodb-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  alertmanager-data:
    driver: local

networks:
  nexus-network:
    driver: bridge
EOF
    fi
    
    print_status "Docker stack configuration created"
else
    print_warning "Docker not available, skipping Docker stack setup"
fi

print_header "Step 7: Creating Grafana Dashboard..."

# Create Grafana dashboard if it doesn't exist
if [[ ! -f "dashboards/nexus-dashboard.json" ]]; then
    print_status "Creating Grafana dashboard..."
    mkdir -p dashboards
    cat > dashboards/nexus-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "NEXUS Support System Dashboard",
    "tags": ["nexus", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System CPU Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "system_cpu_usage",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100
          }
        },
        "gridPos": {
          "h": 8,
          "w": 6,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "System Memory Usage",
        "type": "stat",
        "targets": [
          {
            "expr": "system_memory_usage",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100
          }
        },
        "gridPos": {
          "h": 8,
          "w": 6,
          "x": 6,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Application Requests",
        "type": "stat",
        "targets": [
          {
            "expr": "application_requests_total",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short"
          }
        },
        "gridPos": {
          "h": 8,
          "w": 6,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 4,
        "title": "Application Errors",
        "type": "stat",
        "targets": [
          {
            "expr": "application_errors_total",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "short"
          }
        },
        "gridPos": {
          "h": 8,
          "w": 6,
          "x": 18,
          "y": 0
        }
      },
      {
        "id": 5,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "application_response_time_seconds",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s"
          }
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 8
        }
      },
      {
        "id": 6,
        "title": "Disk Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "system_disk_usage",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "min": 0,
            "max": 100
          }
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 12,
          "y": 8
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF
    print_status "Grafana dashboard created"
fi

print_header "Step 8: Creating Startup Scripts..."

# Create startup script
cat > scripts/start-monitoring.sh << 'EOF'
#!/bin/bash

# NEXUS Monitoring Stack Startup Script

echo "🚀 Starting NEXUS Monitoring Stack..."

# Start the application
echo "Starting NEXUS application..."
node server-standalone.js &
APP_PID=$!

# Wait for application to start
sleep 5

# Start Docker services if available
if command -v docker-compose &> /dev/null; then
    echo "Starting Docker monitoring services..."
    docker-compose up -d
fi

echo "✅ NEXUS Monitoring Stack started!"
echo ""
echo "📱 Application: http://localhost:3000"
echo "📊 Metrics: http://localhost:3000/metrics"
echo "🔒 Security: http://localhost:3000/api/security/dashboard"
echo "📈 Analytics: http://localhost:3000/api/bi/analytics"
echo "📋 KPI: http://localhost:3000/api/bi/kpi"
echo "🚨 Alerts: http://localhost:3000/api/alerts/status"
echo ""
if command -v docker-compose &> /dev/null; then
    echo "🔍 Prometheus: http://localhost:9090"
    echo "📊 Grafana: http://localhost:3001 (admin/admin123)"
    echo "🚨 AlertManager: http://localhost:9093"
fi

# Wait for background processes
wait $APP_PID
EOF

chmod +x scripts/start-monitoring.sh

# Create stop script
cat > scripts/stop-monitoring.sh << 'EOF'
#!/bin/bash

# NEXUS Monitoring Stack Stop Script

echo "🛑 Stopping NEXUS Monitoring Stack..."

# Stop Docker services
if command -v docker-compose &> /dev/null; then
    echo "Stopping Docker monitoring services..."
    docker-compose down
fi

# Stop application
echo "Stopping NEXUS application..."
pkill -f "node server-standalone.js"

echo "✅ NEXUS Monitoring Stack stopped!"
EOF

chmod +x scripts/stop-monitoring.sh

print_header "Step 9: Testing the Setup..."

# Test the application
print_status "Testing application startup..."
if node -e "require('./server-standalone.js')" 2>/dev/null; then
    print_status "✅ Application syntax is valid"
else
    print_error "❌ Application has syntax errors"
    exit 1
fi

print_header "Step 10: Setup Complete!"

echo ""
echo "🎉 NEXUS Monitoring Stack setup is complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env and .env.alerting files with your configuration"
echo "2. Run: ./scripts/start-monitoring.sh"
echo "3. Access the monitoring dashboards"
echo ""
echo "🌐 Access Points:"
echo "• Application: http://localhost:3000"
echo "• Metrics: http://localhost:3000/metrics"
echo "• Security Dashboard: http://localhost:3000/api/security/dashboard"
echo "• Business Analytics: http://localhost:3000/api/bi/analytics"
echo "• KPI Dashboard: http://localhost:3000/api/bi/kpi"
echo "• Alert Management: http://localhost:3000/api/alerts/status"
echo ""
if [[ "$DOCKER_AVAILABLE" == "true" && "$DOCKER_COMPOSE_AVAILABLE" == "true" ]]; then
    echo "🔍 Infrastructure Monitoring (Docker):"
    echo "• Prometheus: http://localhost:9090"
    echo "• Grafana: http://localhost:3001 (admin/admin123)"
    echo "• AlertManager: http://localhost:9093"
    echo ""
fi
echo "📚 Documentation:"
echo "• docs/MONITORING_IMPLEMENTATION_COMPLETE.md"
echo "• docs/DEPLOYMENT_GUIDE.md"
echo "• docs/API_DOCUMENTATION.md"
echo "• docs/TROUBLESHOOTING.md"
echo ""
echo "🚀 To start the monitoring stack, run:"
echo "   ./scripts/start-monitoring.sh"
echo ""
echo "🛑 To stop the monitoring stack, run:"
echo "   ./scripts/stop-monitoring.sh"
echo ""

print_status "Setup completed successfully! 🎉"
