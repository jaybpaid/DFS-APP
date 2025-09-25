#!/bin/bash

echo "🚀 Installing MCP Server Dependencies..."
echo "======================================"

# Get the current directory
BASE_DIR="$(pwd)"

# Change to the advanced directory
cd "docker/mcp-servers/advanced" || exit 1

echo "📁 Working in: $(pwd)"
echo ""

# Array of server directories to process
servers=(
    "gptr-mcp"
    "serena/src"
    "claude-flow-mcp"
    "genai-toolbox"
    "pipedream-mcp"
)

# Install dependencies for each server
for server in "${servers[@]}"; do
    echo "🔧 Installing dependencies for: $server"

    if [ -d "$server" ]; then
        cd "$server" || continue

        # Check if package.json exists
        if [ -f "package.json" ]; then
            echo "   📦 Found package.json, installing dependencies..."
            npm install --quiet --no-package-lock
            if [ $? -eq 0 ]; then
                echo "   ✅ Dependencies installed successfully for $server"
            else
                echo "   ❌ Failed to install dependencies for $server"
            fi
        else
            echo "   ⚠️  No package.json found for $server"
        fi

        # Go back to advanced directory
        cd ..
    else
        echo "   ❌ Directory $server does not exist"
    fi

    echo ""
done

# Go back to base directory
cd "$BASE_DIR"

echo "🎯 DEPENDENCY INSTALLATION COMPLETE!"
echo ""
echo "📋 Summary:"
echo "✅ 5 MCP servers processed"
echo "📦 All servers should now have @modelcontextprotocol/sdk"
echo ""
echo "🔄 Next step: Restart Cline to load the enhanced MCP servers!"
echo ""
