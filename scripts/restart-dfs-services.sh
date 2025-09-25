#!/bin/bash

# 🚀 DFS Services Auto-Restart Script
# Uses MCP tools for intelligent service management

echo "🔧 === DFS SERVICES RESTART INITIATED ==="
echo "$(date): Starting DFS service recovery..."

# Function to check if port is in use
check_port() {
    local port=$1
    lsof -i :$port >/dev/null 2>&1
}

# Function to kill processes on port
kill_port() {
    local port=$1
    echo "🧹 Cleaning up port $port..."
    lsof -ti :$port | xargs kill -9 2>/dev/null || echo "Port $port already clean"
    sleep 2
}

# Function to start Python API server
start_python_api() {
    echo "🐍 Starting Python API server on port 8000..."
    cd apps/api-python
    
    # Kill any existing processes on port 8000
    kill_port 8000
    
    # Start API server in background
    python3 live_api_server.py &
    API_PID=$!
    echo "API Server PID: $API_PID"
    
    # Wait for server to start
    sleep 5
    
    # Check if it's responding
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ Python API server running successfully on port 8000"
        return 0
    else
        echo "❌ Python API server failed to start"
        return 1
    fi
}

# Function to start React dev server  
start_react_frontend() {
    echo "⚛️ Starting React dev server on port 5173..."
    cd ../web
    
    # Kill any existing processes on port 5173
    kill_port 5173
    
    # Start dev server in background
    npm run dev &
    REACT_PID=$!
    echo "React Server PID: $REACT_PID"
    
    # Wait for server to start
    sleep 8
    
    # Check if it's responding
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
        echo "✅ React dev server running successfully on port 5173"
        return 0
    else
        echo "❌ React dev server failed to start"
        return 1
    fi
}

# Function to validate all endpoints
validate_endpoints() {
    echo "🧪 Validating all endpoints..."
    
    local endpoints=(
        "http://localhost:8000/health|Health Check"
        "http://localhost:8000/slates|Live Slates"
        "http://localhost:8000/player_pool|Player Pool"
        "http://localhost:8000/data_sources|Data Sources"
        "http://localhost:5173|React Dashboard"
    )
    
    local success_count=0
    local total_count=${#endpoints[@]}
    
    for endpoint in "${endpoints[@]}"; do
        IFS='|' read -r url name <<< "$endpoint"
        
        if curl -s "$url" >/dev/null 2>&1; then
            echo "✅ $name: OPERATIONAL"
            ((success_count++))
        else
            echo "❌ $name: FAILED"
        fi
    done
    
    echo "📊 Validation Results: $success_count/$total_count endpoints operational"
    
    if [ $success_count -eq $total_count ]; then
        echo "🏆 ALL SERVICES OPERATIONAL - RESTART SUCCESSFUL"
        return 0
    else
        echo "⚠️ PARTIAL SUCCESS - Some services need attention"
        return 1
    fi
}

# Main execution
main() {
    echo "🚀 Starting DFS service restart sequence..."
    
    # Return to project root
    cd "$(dirname "$0")/.."
    
    # Start services
    if start_python_api && start_react_frontend; then
        echo "✅ Both services started successfully"
        
        # Validate endpoints
        sleep 3
        validate_endpoints
        
        echo ""
        echo "🎯 === DFS SERVICES STATUS ==="
        echo "🐍 Python API: http://localhost:8000"
        echo "⚛️ React Frontend: http://localhost:5173"
        echo "📊 Test endpoints: curl http://localhost:8000/health"
        echo ""
        echo "🔧 To monitor services: ps aux | grep -E '(python|node)' | grep -E '(8000|5173)'"
        echo "🛑 To stop services: pkill -f 'live_api_server.py' && pkill -f 'vite'"
        
    else
        echo "❌ Service startup failed - check logs above"
        exit 1
    fi
}

# Execute main function
main "$@"
