#!/bin/bash
# STDIO bridge for git MCP server
exec docker exec -i git_mcp node /app/dist/server.js "$@"
