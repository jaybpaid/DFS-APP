#!/bin/bash
# PR1 RELIABLE MEMORY MCP SHIM
# STDIO-based MCP communication with fallback to local execution
# Security hardened - runs as non-root, limited privileges

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTAINER_NAME="memory-hardened"
HEALTH_TIMEOUT=10
STARTUP_TIMEOUT=30

# Security: Ensure we're running with limited privileges
if [[ $EUID -eq 0 ]]; then
    echo "❌ ERROR: Refusing to run as root for security reasons"
    exit 1
fi

# Function to check if container is healthy
is_container_healthy() {
    docker ps --filter "name=$CONTAINER_NAME" --filter "health=healthy" --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"
}

# Function to check if container exists
container_exists() {
    docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "^$CONTAINER_NAME$"
}

# Function to check if docker daemon is available
docker_available() {
    docker info >/dev/null 2>&1
}

# Function to start MCP container if not running
ensure_container_running() {
    if ! docker_available; then
        echo "❌ Docker daemon not available, cannot start hardened MCP"
        return 1
    fi

    local start_time=$(date +%s)

    # Check if container is already healthy
    if is_container_healthy; then
        return 0
    fi

    # Check if container exists but not healthy
    if container_exists; then
        echo "🔄 Container exists but unhealthy, removing..."
        docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
    fi

    # Start container with explicit health check timeout
    echo "🚀 Starting hardened memory MCP container..."
    cd "$PROJECT_ROOT"

    if ! docker-compose -f docker-compose.hardened-mcp.yml up -d memory-hardened; then
        echo "❌ Failed to start memory-hardened container"
        return 1
    fi

    # Wait for health check with timeout
    while ! is_container_healthy && (( $(date +%s) - start_time < STARTUP_TIMEOUT )); do
        echo "⏳ Waiting for container to become healthy..."
        sleep 2
    done

    if ! is_container_healthy; then
        echo "❌ Container failed to become healthy within $STARTUP_TIMEOUT seconds"
        return 1
    fi

    echo "✅ Container is healthy and ready"
    return 0
}

# Main execution logic
main() {
    echo "🔧 PR1 RELIABLE MEMORY MCP SHIM STARTING"

    # Attempt to use hardened containerized MCP first
    if ensure_container_running; then
        echo "🎯 Using hardened containerized Memory MCP"
        # Execute MCP server via docker exec with STDIO
        exec docker exec -i "$CONTAINER_NAME" node /app/mcp-server.js memory
    else
        echo "⚠️  Containerized MCP failed, falling back to local execution"

        # Fallback: Try to find and run local MCP server
        if command -v node >/dev/null 2>&1; then
            # Look for local MCP server files
            local local_mcp_paths=(
                "$PROJECT_ROOT/node_modules/@modelcontextprotocol/server-memory/dist/index.js"
                "$PROJECT_ROOT/mcp-servers/memory.js"
                "$PROJECT_ROOT/mcp/memory/index.js"
                "$PROJECT_ROOT/apps/api/mcp/memory.js"
            )

            for mcp_path in "${local_mcp_paths[@]}"; do
                if [[ -f "$mcp_path" ]]; then
                    echo "📂 Using local Memory MCP: $mcp_path"
                    export NODE_ENV=development
                    export MCP_SERVER=memory
                    exec node "$mcp_path"
                fi
            done
        fi

        # Ultimate fallback: Error message
        echo "❌ CRITICAL: No memory MCP server available - neither containerized nor local"
        echo "💡 Solutions:"
        echo "   1. Ensure docker-compose.hardened-mcp.yml is properly configured"
        echo "   2. Install Node.js and MCP memory server packages locally"
        echo "   3. Check docker daemon is running"
        exit 1
    fi
}

# Run main function
main "$@"
