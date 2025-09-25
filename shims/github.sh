#!/usr/bin/env bash
set -euo pipefail
# STDIN/STDOUT bridge for github MCP
# Using working container with github capabilities
exec docker exec -i interesting_mccarthy npx @modelcontextprotocol/server-github "$@"
