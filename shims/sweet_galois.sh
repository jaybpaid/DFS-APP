#!/usr/bin/env bash
set -euo pipefail
# STDIN/STDOUT bridge into the running container
# MCP Server: sweet_galois (likely google-genai-toolbox on port 3014)
exec docker exec -i sweet_galois node /app/dist/server.js "$@"
