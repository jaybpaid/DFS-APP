#!/usr/bin/env bash
set -euo pipefail
# STDIN/STDOUT bridge for memory MCP
# Using working container with memory capabilities
exec docker exec -i elated_rhodes npx @modelcontextprotocol/server-memory "$@"
