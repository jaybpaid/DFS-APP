#!/bin/bash
set -euo pipefail

# Reliable Filesystem MCP Shim - Production Grade
# Uses flock for locking, prefers container, falls back to local

LOCKFILE="/tmp/mcp_filesystem.lock"
MCP_CONTAINER="mcp-filesystem-hardened"
LOCAL_FALLBACK_CMD="npx -y @modelcontextprotocol/server-filesystem"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [FILESYSTEM-MCP] $1" >&2
}

# Check if container is running and healthy
check_container() {
    if docker ps --filter "name=${MCP_CONTAINER}" --filter "status=running" | grep -q "${MCP_CONTAINER}"; then
        # Check health status
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "${MCP_CONTAINER}" 2>/dev/null || echo "unknown")
        if [[ "$health_status" == "healthy" || "$health_status" == "unknown" ]]; then
            return 0
        fi
    fi
    return 1
}

# Execute MCP command via container
exec_container() {
    log "Using containerized MCP filesystem server"
    exec docker exec -i "${MCP_CONTAINER}" node /usr/local/lib/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js /app/data /app/contracts /app/fixtures
}

# Execute MCP command locally as fallback
exec_local() {
    log "Container unavailable, falling back to local MCP server"
    # Set local paths for fallback
    local DATA_DIR="$(pwd)/data"
    local CONTRACTS_DIR="$(pwd)/contracts"
    local FIXTURES_DIR="$(pwd)/fixtures"
    
    # Ensure directories exist
    mkdir -p "$DATA_DIR" "$CONTRACTS_DIR" "$FIXTURES_DIR"
    
    exec $LOCAL_FALLBACK_CMD "$DATA_DIR" "$CONTRACTS_DIR" "$FIXTURES_DIR"
}

# Main execution with file locking
main() {
    # Use flock for exclusive access
    (
        flock -n 200 || {
            log "Another filesystem MCP instance is running, waiting..."
            flock 200
        }
        
        log "Starting reliable filesystem MCP service"
        
        # Try container first
        if check_container; then
            exec_container
        else
            log "Container check failed, attempting local fallback"
            exec_local
        fi
        
    ) 200>"$LOCKFILE"
}

# Handle script arguments
case "${1:-}" in
    "list")
        if check_container; then
            docker exec "${MCP_CONTAINER}" ls -la /app/
        else
            ls -la "$(pwd)/"
        fi
        ;;
    "tools")
        if check_container; then
            docker exec "${MCP_CONTAINER}" node -e "
                const fs = require('fs');
                console.log('Available tools: read_file, write_file, list_directory, search_files');
                console.log('Available directories:', fs.readdirSync('/app/').filter(f => fs.statSync('/app/' + f).isDirectory()));
            "
        else
            echo "Available tools: read_file, write_file, list_directory, search_files"
            echo "Available directories:" 
            find "$(pwd)" -maxdepth 1 -type d -exec basename {} \;
        fi
        ;;
    "health")
        if check_container; then
            echo "✅ Container MCP filesystem server is healthy"
            exit 0
        else
            echo "❌ Container unavailable, local fallback would be used"
            exit 1
        fi
        ;;
    *)
        main
        ;;
esac
