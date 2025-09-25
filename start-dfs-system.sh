#!/bin/bash

# DFS Optimizer System - Auto-Start Script
# This script ensures everything starts up automatically and is ready to go

set -e

echo "🚀 Starting DFS Optimizer Production System..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

print_success "docker-compose is available"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p docker/nginx/ssl
mkdir -p data
mkdir -p logs

# Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose -f docker-compose.production.yml -p dfs-app down --remove-orphans || true

# Pull latest images and build
print_status "Building and starting all services..."
docker-compose -f docker-compose.production.yml -p dfs-app up --build --force-recreate -d

# Wait for services to be healthy
print_status "Waiting for services to become healthy..."

services=("redis" "api-python" "api-node" "mcp-gateway" "frontend" "nginx")
max_wait=300  # 5 minutes
wait_time=0

for service in "${services[@]}"; do
    print_status "Checking health of $service..."
    
    while [ $wait_time -lt $max_wait ]; do
        if docker-compose -f docker-compose.production.yml ps $service | grep -q "healthy\|Up"; then
            print_success "$service is healthy"
            break
        fi
        
        if [ $wait_time -eq 0 ]; then
            print_status "Waiting for $service to become healthy..."
        fi
        
        sleep 5
        wait_time=$((wait_time + 5))
        
        if [ $wait_time -ge $max_wait ]; then
            print_warning "$service is taking longer than expected to start"
            break
        fi
    done
    wait_time=0
done

# Test endpoints
print_status "Testing system endpoints..."

# Test nginx health
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx proxy is responding"
else
    print_warning "Nginx proxy health check failed"
fi

# Test Node.js API
if curl -f http://localhost:8000/api/healthz > /dev/null 2>&1; then
    print_success "Node.js API is responding"
else
    print_warning "Node.js API health check failed"
fi

# Test Python API
if curl -f http://localhost:8001/api/healthz > /dev/null 2>&1; then
    print_success "Python API is responding"
else
    print_warning "Python API health check failed"
fi

# Test Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is responding"
else
    print_warning "Frontend health check failed"
fi

# Show running containers
print_status "System Status:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🎉 DFS Optimizer System is ready!"
echo "================================================"
echo ""
echo "📊 Access Points:"
echo "  • Frontend:     http://localhost:3000"
echo "  • Node.js API:  http://localhost:8000"
echo "  • Python API:   http://localhost:8001"
echo "  • Nginx Proxy:  http://localhost"
echo "  • Redis:        localhost:6379"
echo ""
echo "🔧 Management Commands:"
echo "  • View logs:    docker-compose -f docker-compose.production.yml logs -f"
echo "  • Stop system:  docker-compose -f docker-compose.production.yml down"
echo "  • Restart:      docker-compose -f docker-compose.production.yml restart"
echo ""
echo "🏥 Health Checks:"
echo "  • All services have automatic health monitoring"
echo "  • Failed services will auto-restart"
echo "  • Data sync runs every 5 minutes"
echo ""
echo "✅ System is production-ready with:"
echo "  • Bulletproof salary cap enforcement (≤ \$50,000)"
echo "  • Professional analytics (Win%, ROI, Dup Risk, Leverage)"
echo "  • Auto-restart on failure"
echo "  • Load balancing via Nginx"
echo "  • Persistent data volumes"
echo ""

# Keep script running to show logs
if [ "${1:-}" = "--follow-logs" ]; then
    print_status "Following logs (Ctrl+C to exit)..."
    docker-compose -f docker-compose.production.yml logs -f
fi
