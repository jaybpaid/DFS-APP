#!/usr/bin/env bash
set -euo pipefail
# STDIN/STDOUT bridge into the running container
# MCP Server: gallant_leavitt (likely serena-code-analysis on port 3012)
exec docker exec -i gallant_leavitt node /app/dist/server.js "$@"
