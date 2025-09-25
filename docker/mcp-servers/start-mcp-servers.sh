#!/bin/bash
# Start all MCP servers in Docker container

echo "🚀 Starting All MCP Servers in Docker Container..."

# Start standard MCP servers on different ports
echo "📡 Starting Sequential Thinking MCP Server..."
npx @modelcontextprotocol/server-sequential-thinking --port 3001 &

echo "🌐 Starting Puppeteer MCP Server..."
npx @hisma/server-puppeteer --port 3002 &

echo "📁 Starting Filesystem MCP Server..."
npx @modelcontextprotocol/server-filesystem /app/data /app/dfs-system-2 --port 3003 &

echo "🧠 Starting Memory MCP Server..."
npx @modelcontextprotocol/server-memory --port 3004 &

echo "🔧 Starting Everything MCP Server..."
npx @modelcontextprotocol/server-everything --port 3005 &

echo "🔍 Starting Brave Search MCP Server..."
npx @modelcontextprotocol/server-brave-search --port 3006 &

echo "🐙 Starting GitHub MCP Server..."
npx @modelcontextprotocol/server-github --port 3007 &

echo "☁️ Starting AWS KB Retrieval MCP Server..."
npx @modelcontextprotocol/server-aws-kb-retrieval --port 3008 &

echo "🌐 Starting Fetch MCP Server..."
node /app/fetch-mcp/dist/index.js --port 3009 &

echo "✅ All Standard MCP Servers Started in Docker Container"
echo "📊 Health check endpoint: http://localhost:3001/health"
echo "🔗 Standard servers: ports 3001-3009"

# Keep container running
wait
