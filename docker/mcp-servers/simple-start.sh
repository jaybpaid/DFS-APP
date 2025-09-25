#!/bin/bash
# Simple MCP Servers Startup Script

echo "🚀 Starting Essential MCP Servers..."

# Start only the core MCP servers that are definitely available
echo "📡 Starting Sequential Thinking MCP Server..."
npx @modelcontextprotocol/server-sequential-thinking --stdio &

echo "📁 Starting Filesystem MCP Server..."
npx @modelcontextprotocol/server-filesystem /app/data --stdio &

echo "🧠 Starting Memory MCP Server..."
npx @modelcontextprotocol/server-memory --stdio &

echo "✅ Core MCP Servers Started"

# Keep container running
tail -f /dev/null
