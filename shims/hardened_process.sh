#!/usr/bin/env bash
# Race-safe, hardened process MCP shim
set -euo pipefail

# File locking to prevent race conditions
exec 9>/tmp/mcp.process.lock
if ! flock -n 9; then
    echo "process MCP busy" >&2
    exit 1
fi

# Prefer container path if healthy
if docker exec process-working true >/dev/null 2>&1; then
    exec docker exec -i process-working node /app/server.js "$@"
fi

# Fallback to local server if available
if [ -x "./local_mcp/process/server.js" ]; then
    exec node ./local_mcp/process/server.js "$@"
fi

# Final fallback - basic process capabilities
echo '{"jsonrpc":"2.0","id":"'$(date +%s)'","result":{"message":"Process MCP (fallback)","timestamp":"'$(date -Iseconds)'","capabilities":["execute","python3","node"],"status":"fallback"}}'
exit 2
