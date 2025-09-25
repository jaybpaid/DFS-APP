#!/bin/bash
# STDIO bridge for process MCP server
exec docker exec -i process_mcp node /app/dist/server.js "$@"
