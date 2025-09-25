#!/bin/bash
# STDIO bridge for playwright MCP server
exec docker exec -i playwright_mcp node /app/dist/server.js "$@"
