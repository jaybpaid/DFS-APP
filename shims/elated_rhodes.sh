#!/usr/bin/env bash
set -euo pipefail
# STDIN/STDOUT bridge into the running container
# MCP Server: elated_rhodes (likely claude-flow on port 3013)
exec docker exec -i elated_rhodes node /app/dist/server.js "$@"
