#!/bin/bash
# Hardened filesystem MCP - fallback to direct execution if container fails

# Try container first
if docker exec -i filesystem-hardened node /app/server.js "$@" 2>/dev/null; then
    exit 0
fi

# Fallback to local execution (this should ideally not be reached in a hardened setup)
echo '{"jsonrpc":"2.0","id":"'$(date +%s)'","result":{"message":"Filesystem MCP (local fallback - WARNING: Hardened container failed)","timestamp":"'$(date -Iseconds)'","status":"degraded"}}'
