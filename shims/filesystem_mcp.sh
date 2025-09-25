#!/bin/bash
# STDIO bridge for filesystem MCP server
exec docker exec -i filesystem_mcp node /app/dist/server.js "$@"
