#!/bin/bash

# NEXUS Monitoring Setup Script
echo "Setting up NEXUS Monitoring System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed."
    exit 1
fi

# Create necessary directories
echo "Creating monitoring directories..."
mkdir -p monitoring
mkdir -p dashboards
mkdir -p scripts

# Set permissions for scripts
chmod +x scripts/*.sh

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Creating example .env file..."
    cp .env.example .env
    echo "Please edit .env file with your configuration before starting the services."
fi

# Build and start services
echo "Building and starting services with monitoring..."
docker-compose up -d --build

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Check if services are running
echo "Checking service status..."
docker-compose ps

# Test metrics endpoint
echo "Testing metrics endpoint..."
if curl -s http://localhost:3000/metrics > /dev/null; then
    echo "✓ Metrics endpoint is accessible"
else
    echo "✗ Metrics endpoint is not accessible"
fi

# Test Prometheus
echo "Testing Prometheus..."
if curl -s http://localhost:9090/-/healthy > /dev/null; then
    echo "✓ Prometheus is healthy"
else
    echo "✗ Prometheus is not responding"
fi

# Test Grafana
echo "Testing Grafana..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✓ Grafana is healthy"
else
    echo "✗ Grafana is not responding"
fi

echo ""
echo "Setup complete! Access points:"
echo "  NEXUS Application: http://localhost:3000"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana: http://localhost:3001 (admin/admin123)"
echo "  AlertManager: http://localhost:9093"
echo ""
echo "Next steps:"
echo "1. Configure New Relic license key in .env file"
echo "2. Set up email notifications in AlertManager"
echo "3. Import dashboards in Grafana"
echo "4. Configure alert thresholds as needed"
