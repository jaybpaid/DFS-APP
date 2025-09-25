#!/bin/bash
# STDIO bridge for sqlite MCP server
exec docker exec -i sqlite_mcp node /app/dist/server.js "$@"
