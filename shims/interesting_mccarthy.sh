#!/usr/bin/env bash
set -euo pipefail
# STDIN/STDOUT bridge into the running container
# MCP Server: interesting_mccarthy (likely gpt-researcher on port 3011)
exec docker exec -i interesting_mccarthy node /app/dist/server.js "$@"
