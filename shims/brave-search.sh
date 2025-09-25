#!/usr/bin/env bash
set -euo pipefail
# STDIN/STDOUT bridge for brave-search MCP
# Note: Using working individual container approach
exec docker exec -i sweet_galois npx @modelcontextprotocol/server-brave-search "$@"
