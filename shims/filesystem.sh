#!/usr/bin/env bash
set -euo pipefail
# STDIN/STDOUT bridge for filesystem MCP
# Using working container with filesystem access
exec docker exec -i gallant_leavitt npx @modelcontextprotocol/server-filesystem /app/data /app/dfs-system-2 "$@"
