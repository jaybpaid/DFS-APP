#!/bin/bash
# STDIO bridge for memory MCP server
exec docker exec -i memory_mcp node /app/dist/server.js "$@"
