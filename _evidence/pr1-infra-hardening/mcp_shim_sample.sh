#!/bin/bash
# Sample MCP shim with flock locking
LOCKFILE="/tmp/mcp_filesystem.lock"
flock -n 200 || {
    log "Another instance running, waiting..."
    flock 200
}
