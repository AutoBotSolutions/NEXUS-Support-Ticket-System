#!/bin/bash

###############################################################################
# NEXUS Support System - Automated Installer
# Supports: Linux, macOS
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="$(pwd)"
MONGODB_VERSION="6.0"
NODE_VERSION="18"

# Functions
print_header() {
    echo -e "${BLUE}###############################################################################${NC}"
    echo -e "${BLUE}# GitHub Support Ticket System - Automated Installer${NC}"
    echo -e "${BLUE}###############################################################################${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}[STEP] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

detect_os() {
    print_step "Detecting Operating System"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if [ -f /etc/debian_version ]; then
            DISTRO="debian"
        elif [ -f /etc/redhat-release ]; then
            DISTRO="redhat"
        elif [ -f /etc/arch-release ]; then
            DISTRO="arch"
        else
            DISTRO="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        DISTRO="macos"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    print_success "Detected OS: $OS ($DISTRO)"
}

check_dependencies() {
    print_step "Checking for required dependencies"
    
    # Check for curl
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    # Check for git
    if ! command -v git &> /dev/null; then
        print_warning "Git not found. Installing git..."
        if [ "$OS" == "linux" ]; then
            if [ "$DISTRO" == "debian" ]; then
                sudo apt-get update && sudo apt-get install -y git
            elif [ "$DISTRO" == "redhat" ]; then
                sudo yum install -y git
            elif [ "$DISTRO" == "arch" ]; then
                sudo pacman -S git
            fi
        elif [ "$OS" == "macos" ]; then
            brew install git
        fi
    fi
    
    print_success "All dependencies checked"
}

install_nodejs() {
    print_step "Installing Node.js $NODE_VERSION"
    
    if command -v node &> /dev/null; then
        INSTALLED_NODE_VERSION=$(node -v)
        print_success "Node.js already installed: $INSTALLED_NODE_VERSION"
        read -p "Reinstall Node.js? (y/N): " reinstall_node
        if [[ ! $reinstall_node =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    if [ "$OS" == "linux" ]; then
        if [ "$DISTRO" == "debian" ]; then
            curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [ "$DISTRO" == "redhat" ]; then
            curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
            sudo yum install -y nodejs
        elif [ "$DISTRO" == "arch" ]; then
            sudo pacman -S nodejs npm
        fi
    elif [ "$OS" == "macos" ]; then
        if command -v brew &> /dev/null; then
            brew install node
        else
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            source ~/.bashrc
            nvm install $NODE_VERSION
            nvm use $NODE_VERSION
        fi
    fi
    
    print_success "Node.js installed: $(node -v)"
    print_success "npm installed: $(npm -v)"
}

install_mongodb() {
    print_step "Installing MongoDB $MONGODB_VERSION"
    
    if command -v mongod &> /dev/null; then
        print_success "MongoDB already installed"
        read -p "Reinstall MongoDB? (y/N): " reinstall_mongo
        if [[ ! $reinstall_mongo =~ ^[Yy]$ ]]; then
            return
        fi
    fi
    
    if [ "$OS" == "linux" ]; then
        if [ "$DISTRO" == "debian" ]; then
            wget -qO - https://www.mongodb.org/static/pgp/server-${MONGODB_VERSION}.asc | sudo apt-key add -
            echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/${MONGODB_VERSION} multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-${MONGODB_VERSION}.list
            sudo apt-get update
            sudo apt-get install -y mongodb-org
        elif [ "$DISTRO" == "redhat" ]; then
            sudo tee /etc/yum.repos.d/mongodb-org-${MONGODB_VERSION}.repo <<EOF
[mongodb-org-${MONGODB_VERSION}]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/${MONGODB_VERSION}/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-${MONGODB_VERSION}.asc
EOF
            sudo yum install -y mongodb-org
        elif [ "$DISTRO" == "arch" ]; then
            sudo pacman -S mongodb
        fi
        
        sudo systemctl start mongod
        sudo systemctl enable mongod
        
    elif [ "$OS" == "macos" ]; then
        if command -v brew &> /dev/null; then
            brew tap mongodb/brew
            brew install mongodb-community
            brew services start mongodb-community
            brew services enable mongodb-community
        else
            print_error "Homebrew not found. Please install MongoDB manually."
            return
        fi
    fi
    
    print_success "MongoDB installed and started"
}

install_npm_dependencies() {
    print_step "Installing npm dependencies"
    
    npm install
    
    print_success "npm dependencies installed"
}

generate_secrets() {
    print_step "Generating secure secrets"
    
    JWT_SECRET=$(openssl rand -hex 64)
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    
    print_success "Secrets generated"
}

create_env_file() {
    print_step "Creating .env file"
    
    if [ -f .env ]; then
        print_warning ".env file already exists. Backing up to .env.backup"
        mv .env .env.backup
    fi
    
    cat > .env <<EOF
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nexus-support

# GitHub Configuration
GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET
GITHUB_TOKEN=
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=

# JWT Secret
JWT_SECRET=$JWT_SECRET
EOF
    
    print_success ".env file created"
    print_warning "Please configure GitHub settings in .env file if needed"
}

configure_mongodb() {
    print_step "Configuring MongoDB"
    
    # Wait for MongoDB to be ready
    sleep 3
    
    # Create database and indexes
    mongo --eval "use nexus-support; db.createCollection('tickets'); db.createCollection('users');" > /dev/null 2>&1
    
    print_success "MongoDB configured"
}

start_services() {
    print_step "Starting services"
    
    # Check if MongoDB is running
    if [ "$OS" == "linux" ]; then
        if ! sudo systemctl is-active --quiet mongod; then
            print_warning "MongoDB not running, starting..."
            sudo systemctl start mongod
        fi
    elif [ "$OS" == "macos" ]; then
        if ! brew services list | grep -q "mongodb-community.*started"; then
            print_warning "MongoDB not running, starting..."
            brew services start mongodb-community
        fi
    fi
    
    print_success "Services started"
}

run_health_check() {
    print_step "Running health check"
    
    # Start the application in background
    npm start > /tmp/nexus.log 2>&1 &
    APP_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Check if server is responding
    if curl -s http://localhost:3000/api/health > /dev/null; then
        print_success "Health check passed - Server is running"
    else
        print_error "Health check failed - Server may not be running"
        print_error "Check logs: tail -f /tmp/nexus.log"
    fi
    
    # Stop the server
    kill $APP_PID 2>/dev/null || true
}

print_post_install() {
    echo ""
    echo -e "${GREEN}###############################################################################${NC}"
    echo -e "${GREEN}# Installation Complete!${NC}"
    echo -e "${GREEN}###############################################################################${NC}"
    echo ""
    echo "To start the application:"
    echo "  npm start"
    echo ""
    echo "To start in development mode:"
    echo "  npm run dev"
    echo ""
    echo "Access the application at:"
    echo "  http://localhost:3000"
    echo ""
    echo "For GitHub integration, configure the following in .env:"
    echo "  GITHUB_TOKEN=your_github_token"
    echo "  GITHUB_REPO_OWNER=your_username"
    echo "  GITHUB_REPO_NAME=your_repository"
    echo ""
    echo "Documentation available in docs/ directory"
    echo ""
}

# Main installation flow
main() {
    print_header
    
    detect_os
    check_dependencies
    
    echo ""
    read -p "Install Node.js? (Y/n): " install_node
    if [[ ! $install_node =~ ^[Nn]$ ]]; then
        install_nodejs
    fi
    
    echo ""
    read -p "Install MongoDB? (Y/n): " install_mongo
    if [[ ! $install_mongo =~ ^[Nn]$ ]]; then
        install_mongodb
    fi
    
    install_npm_dependencies
    generate_secrets
    create_env_file
    configure_mongodb
    start_services
    run_health_check
    print_post_install
}

# Run main function
main
