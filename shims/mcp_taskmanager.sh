#!/bin/bash

# MCP TaskManager Shim
# Provides reliable startup and error handling for the MCP TaskManager server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MCP_TASKMANAGER_PATH="/Users/614759/Documents/Cline/MCP/mcp-taskmanager"
MCP_TASKMANAGER_DIST="$MCP_TASKMANAGER_PATH/dist/index.js"
LOGFILE="/tmp/mcp-taskmanager.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE" >&2
}

# Cleanup function
cleanup() {
    log "${YELLOW}MCP TaskManager shutting down...${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Validate environment
if [ ! -f "$MCP_TASKMANAGER_DIST" ]; then
    log "${RED}Error: MCP TaskManager dist file not found at $MCP_TASKMANAGER_DIST${NC}"
    log "${YELLOW}Attempting to build...${NC}"
    
    if [ -d "$MCP_TASKMANAGER_PATH" ]; then
        cd "$MCP_TASKMANAGER_PATH"
        if npm run build 2>&1 | tee -a "$LOGFILE"; then
            log "${GREEN}Build successful${NC}"
        else
            log "${RED}Build failed${NC}"
            exit 1
        fi
    else
        log "${RED}MCP TaskManager directory not found: $MCP_TASKMANAGER_PATH${NC}"
        exit 1
    fi
fi

# Check Node.js availability
if ! command -v node >/dev/null 2>&1; then
    log "${RED}Error: Node.js not found in PATH${NC}"
    exit 1
fi

# Start the MCP TaskManager
log "${GREEN}Starting MCP TaskManager...${NC}"
log "${YELLOW}Path: $MCP_TASKMANAGER_DIST${NC}"
log "${YELLOW}PID: $$${NC}"

# Change to the correct directory
cd "$MCP_TASKMANAGER_PATH"

# Execute with proper error handling
exec node "$MCP_TASKMANAGER_DIST" 2>&1 | tee -a "$LOGFILE"
