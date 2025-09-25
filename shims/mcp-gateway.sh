#!/bin/bash

# DFS Gateway Shim Script
# This script provides a stdio interface to the DFS MCP Gateway

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GATEWAY_DIR="$PROJECT_DIR/services/gateway"
INDEX_FILE="$GATEWAY_DIR/index.ts"

# Environment variables
export LOG_LEVEL="${LOG_LEVEL:-INFO}"
export GATEWAY_PORT="${GATEWAY_PORT:-3000}"
export ENABLE_HEALTH="${ENABLE_HEALTH:-true}"
export HEALTH_PORT="${HEALTH_PORT:-8080}"
export ENABLE_METRICS="${ENABLE_METRICS:-true}"
export METRICS_PORT="${METRICS_PORT:-9090}"

# Add external server paths
export EXTERNAL_SERVERS="${EXTERNAL_SERVERS:-./shims/brave-search.sh,./shims/puppeteer.sh,./shims/filesystem.sh,./shims/memory.sh,./shims/github.sh}"

# Add app server paths
export APP_SERVERS="${APP_SERVERS:-./mcp-servers/dfs-mcp/dist/index.js,./apps/api-python/main.py}"

# Redis configuration (if enabled)
export REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

# Log startup
echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')] Starting DFS Gateway..." >&2

# Change to project directory
cd "$PROJECT_DIR"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not available in PATH" >&2
    exit 1
fi

# Check if gateway exists
if [[ ! -f "$INDEX_FILE" ]]; then
    echo "Error: Gateway index file not found: $INDEX_FILE" >&2
    exit 1
fi

# Check if tsx (or ts-node) is available for running TypeScript
if command -v tsx &> /dev/null; then
    TS_RUNNER="tsx"
elif command -v ts-node &> /dev/null; then
    TS_RUNNER="ts-node"
else
    echo "Error: tsx or ts-node not found. Install with: npm install -g tsx" >&2
    exit 1
fi

# Start the gateway
exec $TS_RUNNER "$INDEX_FILE" "$@"
