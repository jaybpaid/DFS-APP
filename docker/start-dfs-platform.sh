#!/bin/bash
set -e

# DFS Platform Unified Startup Script
# Starts DFSForge frontend + DFS-SYSTEM-2 backend integration

echo "🚀 Starting DFS Platform..."

# Wait for dependencies
echo "⏳ Waiting for dependencies..."
while ! pg_isready -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U ${POSTGRES_USER:-dfs}; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

while ! redis-cli -h ${REDIS_HOST:-redis} -p ${REDIS_PORT:-6379} ping; do
  echo "Waiting for Redis..."
  sleep 2
done

echo "✅ Dependencies ready!"

# Run database migrations
echo "🗄️ Running database migrations..."
cd /app/dfs-system-2
python manage.py migrate

# Start services in background
echo "🐍 Starting DFS-SYSTEM-2 backend services..."

# Start DraftKings API server
python draftkings_api_server.py &
DK_PID=$!

# Start main optimization API
python live_optimizer_api.py &
OPT_PID=$!

# Start data sync service
python data_sync_service.py &
SYNC_PID=$!

# Start Node.js API bridge
echo "🌉 Starting API integration bridge..."
cd /app/apps/api
node dist/index.js &
BRIDGE_PID=$!

# Start nginx for frontend serving
echo "⚛️ Starting frontend server..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Function to handle shutdown
cleanup() {
  echo "🛑 Shutting down DFS Platform..."
  kill $DK_PID $OPT_PID $SYNC_PID $BRIDGE_PID $NGINX_PID 2>/dev/null
  wait
  echo "✅ Shutdown complete"
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

echo "🎉 DFS Platform started successfully!"
echo "📊 Frontend available at: http://localhost:3000"
echo "🔌 API available at: http://localhost:8000"
echo "📈 DraftKings API at: http://localhost:8765"

# Wait for all background processes
wait