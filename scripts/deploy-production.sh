#!/bin/bash

# NEXUS Production Deployment Script
# Production deployment automation for NEXUS monitoring system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/config/production.env"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if production environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Production environment file not found: $ENV_FILE"
        log_error "Please create the environment file with production configuration."
        exit 1
    fi
    
    # Check if production compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Production compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

validate_environment() {
    log_info "Validating production environment..."
    
    # Load environment variables
    source "$ENV_FILE"
    
    # Check required environment variables
    local required_vars=(
        "NODE_ENV"
        "NEW_RELIC_LICENSE_KEY"
        "MONGODB_URI"
        "SMTP_HOST"
        "SMTP_USERNAME"
        "SMTP_PASSWORD"
        "SLACK_WEBHOOK_URL"
        "PAGERDUTY_INTEGRATION_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    log_success "Environment validation passed"
}

backup_current_deployment() {
    log_info "Backing up current deployment..."
    
    # Create backup directory
    local backup_dir="$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup current configuration
    if [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
        cp "$PROJECT_DIR/docker-compose.yml" "$backup_dir/"
    fi
    
    # Backup current logs
    if [ -d "$PROJECT_DIR/logs" ]; then
        cp -r "$PROJECT_DIR/logs" "$backup_dir/"
    fi
    
    # Backup current data volumes
    if docker volume ls | grep -q "nexus"; then
        docker run --rm -v "$backup_dir":/backup alpine tar czf /backup/volumes-backup.tar.gz /var/lib/docker/volumes
    fi
    
    log_success "Backup completed: $backup_dir"
}

create_directories() {
    log_info "Creating necessary directories..."
    
    # Create log directories
    mkdir -p "$PROJECT_DIR/logs/nginx"
    mkdir -p "$PROJECT_DIR/logs/app"
    mkdir -p "$PROJECT_DIR/logs/monitoring"
    
    # Create data directories
    mkdir -p "$PROJECT_DIR/data/mongodb"
    mkdir -p "$PROJECT_DIR/data/redis"
    mkdir -p "$PROJECT_DIR/data/prometheus"
    mkdir -p "$PROJECT_DIR/data/grafana"
    mkdir -p "$PROJECT_DIR/data/elasticsearch"
    
    # Create uploads directory
    mkdir -p "$PROJECT_DIR/uploads"
    
    # Create SSL directory
    mkdir -p "$PROJECT_DIR/ssl"
    
    # Create reports directory
    mkdir -p "$PROJECT_DIR/reports"
    
    # Set permissions
    chmod 755 "$PROJECT_DIR/logs"
    chmod 755 "$PROJECT_DIR/data"
    chmod 755 "$PROJECT_DIR/uploads"
    chmod 700 "$PROJECT_DIR/ssl"
    
    log_success "Directories created"
}

generate_ssl_certificates() {
    log_info "Generating SSL certificates..."
    
    local ssl_dir="$PROJECT_DIR/ssl"
    
    # Generate self-signed certificates for development/testing
    if [ ! -f "$ssl_dir/nexus.crt" ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$ssl_dir/nexus.key" \
            -out "$ssl_dir/nexus.crt" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=nexus-support.com"
        
        log_success "SSL certificates generated"
    else
        log_warning "SSL certificates already exist"
    fi
}

setup_monitoring_config() {
    log_info "Setting up monitoring configuration..."
    
    # Create Prometheus rules directory
    mkdir -p "$PROJECT_DIR/monitoring/prometheus/rules"
    
    # Create AlertManager templates directory
    mkdir -p "$PROJECT_DIR/monitoring/alertmanager/templates"
    
    # Create Grafana provisioning directories
    mkdir -p "$PROJECT_DIR/monitoring/grafana/provisioning/datasources"
    mkdir -p "$PROJECT_DIR/monitoring/grafana/provisioning/dashboards"
    
    # Create Logstash configuration
    mkdir -p "$PROJECT_DIR/monitoring/logstash/pipeline"
    mkdir -p "$PROJECT_DIR/monitoring/logstash/config"
    
    # Create Nginx configuration
    mkdir -p "$PROJECT_DIR/nginx/conf.d"
    
    log_success "Monitoring configuration setup completed"
}

build_images() {
    log_info "Building Docker images..."
    
    cd "$PROJECT_DIR"
    
    # Build production image
    docker build -f Dockerfile.production -t nexus-app:production .
    
    # Build security scan image
    docker build -f Dockerfile.production --target security-scan -t nexus-app:security-scan .
    
    log_success "Docker images built"
}

deploy_services() {
    log_info "Deploying production services..."
    
    cd "$PROJECT_DIR"
    
    # Stop existing services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    local unhealthy_services=()
    
    # Check NEXUS app
    if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        unhealthy_services+=("nexus-app")
    fi
    
    # Check Prometheus
    if ! curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        unhealthy_services+=("prometheus")
    fi
    
    # Check Grafana
    if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        unhealthy_services+=("grafana")
    fi
    
    if [ ${#unhealthy_services[@]} -gt 0 ]; then
        log_error "Some services are unhealthy:"
        for service in "${unhealthy_services[@]}"; do
            echo "  - $service"
        done
        log_info "Checking logs..."
        docker-compose -f "$COMPOSE_FILE" logs --tail=50
        exit 1
    fi
    
    log_success "All services are healthy"
}

run_security_scan() {
    log_info "Running security scan..."
    
    cd "$PROJECT_DIR"
    
    # Run security scan
    docker run --rm nexus-app:security-scan
    
    log_success "Security scan completed"
}

setup_grafana() {
    log_info "Setting up Grafana dashboards..."
    
    # Wait for Grafana to be ready
    local grafana_ready=false
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            grafana_ready=true
            break
        fi
        sleep 2
        ((attempts++))
    done
    
    if [ "$grafana_ready" = true ]; then
        log_success "Grafana is ready"
        
        # Import dashboards (if dashboard files exist)
        if [ -d "$PROJECT_DIR/monitoring/grafana/dashboards" ]; then
            for dashboard in "$PROJECT_DIR/monitoring/grafana/dashboards"/*.json; do
                if [ -f "$dashboard" ]; then
                    log_info "Importing dashboard: $(basename "$dashboard")"
                    # Import dashboard using Grafana API
                    curl -X POST http://localhost:3001/api/dashboards/db \
                        -H "Content-Type: application/json" \
                        -H "Authorization: Basic $(echo -n "admin:${GRAFANA_ADMIN_PASSWORD}" | base64)" \
                        -d @"$dashboard" > /dev/null 2>&1 || true
                fi
            done
        fi
    else
        log_warning "Grafana is not ready"
    fi
}

run_health_checks() {
    log_info "Running comprehensive health checks..."
    
    local failed_checks=()
    
    # Check NEXUS app
    if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        failed_checks+=("NEXUS App Health Check")
    fi
    
    # Check monitoring endpoints
    if ! curl -f http://localhost:3000/api/monitoring/status > /dev/null 2>&1; then
        failed_checks+=("Monitoring Status Check")
    fi
    
    # Check metrics endpoint
    if ! curl -f http://localhost:3000/metrics > /dev/null 2>&1; then
        failed_checks+=("Metrics Endpoint Check")
    fi
    
    # Check Prometheus
    if ! curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        failed_checks+=("Prometheus Health Check")
    fi
    
    # Check Grafana
    if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        failed_checks+=("Grafana Health Check")
    fi
    
    # Check AlertManager
    if ! curl -f http://localhost:9093/-/healthy > /dev/null 2>&1; then
        failed_checks+=("AlertManager Health Check")
    fi
    
    if [ ${#failed_checks[@]} -gt 0 ]; then
        log_error "Health checks failed:"
        for check in "${failed_checks[@]}"; do
            echo "  - $check"
        done
        exit 1
    fi
    
    log_success "All health checks passed"
}

generate_deployment_report() {
    log_info "Generating deployment report..."
    
    local report_file="$PROJECT_DIR/deployment-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
NEXUS Production Deployment Report
=====================================

Deployment Date: $(date)
Deployment ID: $(date +%Y%m%d_%H%M%S)

Services Status:
- NEXUS App: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- AlertManager: http://localhost:9093
- Kibana: http://localhost:5601

Environment:
- Node Environment: $NODE_ENV
- MongoDB: $MONGODB_URI
- New Relic: ${NEW_RELIC_LICENSE_KEY:+Configured}
- Slack: ${SLACK_WEBHOOK_URL:+Configured}
- PagerDuty: ${PAGERDUTY_INTEGRATION_KEY:+Configured}

Docker Containers:
$(docker-compose -f "$COMPOSE_FILE" ps)

Resource Usage:
$(docker stats --no-stream)

Next Steps:
1. Configure Grafana dashboards
2. Set up alert rules in Prometheus
3. Configure notification channels
4. Review security scan results
5. Update DNS and load balancer configuration

Deployment completed successfully!
EOF
    
    log_success "Deployment report generated: $report_file"
}

cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove unused Docker images
    docker image prune -f > /dev/null 2>&1 || true
    
    # Remove unused Docker volumes
    docker volume prune -f > /dev/null 2>&1 || true
    
    log_success "Cleanup completed"
}

main() {
    log_info "Starting NEXUS production deployment..."
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    backup_current_deployment
    create_directories
    generate_ssl_certificates
    setup_monitoring_config
    build_images
    deploy_services
    run_security_scan
    setup_grafana
    run_health_checks
    generate_deployment_report
    cleanup
    
    log_success "Production deployment completed successfully!"
    
    echo
    echo "🎉 NEXUS Production Deployment Complete!"
    echo
    echo "Access URLs:"
    echo "  NEXUS App:     http://localhost:3000"
    echo "  Prometheus:    http://localhost:9090"
    echo "  Grafana:       http://localhost:3001 (admin/admin123)"
    echo "  AlertManager: http://localhost:9093"
    echo "  Kibana:        http://localhost:5601"
    echo
    echo "Next Steps:"
    echo "  1. Configure Grafana dashboards"
    echo "  2. Set up alert rules in Prometheus"
    echo "  3. Configure notification channels"
    echo "  4. Review deployment report"
    echo
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"
