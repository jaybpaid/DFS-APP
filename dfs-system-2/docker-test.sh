#!/bin/bash
# Docker Test Script for DFS Ultimate Optimizer

echo "🐳 DFS Ultimate Optimizer - Docker Test Script"
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Build the Docker image
echo ""
echo "🔨 Building Docker image..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Docker image built successfully"

# Start the container
echo ""
echo "🚀 Starting DFS Ultimate Optimizer container..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container"
    exit 1
fi

echo "✅ Container started successfully"

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Test health endpoints
echo ""
echo "🏥 Testing health endpoints..."

# Test Live Optimizer API
echo "Testing Live Optimizer API (port 8000)..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Live Optimizer API is healthy"
else
    echo "❌ Live Optimizer API health check failed"
fi

# Test DraftKings API Server
echo "Testing DraftKings API Server (port 8765)..."
if curl -f http://localhost:8765/health > /dev/null 2>&1; then
    echo "✅ DraftKings API Server is healthy"
else
    echo "❌ DraftKings API Server health check failed"
fi

# Show container status
echo ""
echo "📊 Container Status:"
docker-compose ps

# Show logs (last 20 lines)
echo ""
echo "📝 Recent Logs:"
docker-compose logs --tail=20

echo ""
echo "🎯 Test Complete!"
echo ""
echo "📱 Access your DFS Ultimate Optimizer at:"
echo "   • Main Dashboard: http://localhost:8000"
echo "   • API Documentation: http://localhost:8000/docs"
echo "   • DraftKings API: http://localhost:8765"
echo ""
echo "🛠️  Useful Commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop container: docker-compose down"
echo "   • Restart: docker-compose restart"
echo "   • Shell access: docker-compose exec dfs-optimizer bash"
echo ""
echo "✨ Your DFS Ultimate Optimizer is now running in Docker!"
