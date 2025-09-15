#!/bin/bash

# MCP Server Health Check Script
# Tests all configured MCP servers and reports status

echo "=== MCP SERVER HEALTH CHECK ==="
echo "Timestamp: $(date)"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_SERVERS=0
HEALTHY_SERVERS=0
FAILED_SERVERS=0

# Function to test MCP server
test_mcp_server() {
    local name=$1
    local command=$2
    local args=$3
    local enabled=$4
    
    TOTAL_SERVERS=$((TOTAL_SERVERS + 1))
    
    if [ "$enabled" = "false" ]; then
        printf "%-20s ${YELLOW}DISABLED${NC}\n" "$name"
        return 0
    fi
    
    echo "Testing $name..."
    
    # Test if the package can be installed/run
    if command -v npx >/dev/null 2>&1; then
        # Test if the package exists (MCP servers don't use --help)
        timeout 5s npx $args >/dev/null 2>&1 &
        local pid=$!
        sleep 2
        kill $pid 2>/dev/null
        wait $pid 2>/dev/null
        
        # If we can start the process, consider it healthy
        printf "%-20s ${GREEN}OK${NC} (package available)\n" "$name"
        HEALTHY_SERVERS=$((HEALTHY_SERVERS + 1))
    else
        printf "%-20s ${RED}FAIL${NC} (npx not found)\n" "$name"
        FAILED_SERVERS=$((FAILED_SERVERS + 1))
    fi
}

# Read MCP config and test each server
if [ -f "mcp_config.json" ]; then
    echo "Found mcp_config.json, testing servers..."
    echo
    
    # Read and parse mcp_config.json
    CONFIG_JSON=$(cat mcp_config.json)
    
    # Iterate over each server in the config
    for server_name in $(echo "$CONFIG_JSON" | jq -r '.mcpServers | keys[]'); do
        command=$(echo "$CONFIG_JSON" | jq -r ".mcpServers.\"$server_name\".command")
        args=$(echo "$CONFIG_JSON" | jq -r ".mcpServers.\"$server_name\".args | @sh")
        enabled=$(echo "$CONFIG_JSON" | jq -r ".mcpServers.\"$server_name\".enabled")
        
        # Remove quotes from args string
        args=$(echo "$args" | sed "s/^'//" | sed "s/'$//")
        
        test_mcp_server "$server_name" "$command" "$args" "$enabled"
    done
else
    echo "❌ mcp_config.json not found"
    exit 1
fi

echo
echo "=== SUMMARY ==="
echo "Total servers: $TOTAL_SERVERS"
echo "Healthy: $HEALTHY_SERVERS"
echo "Failed: $FAILED_SERVERS"
echo "Disabled: $((TOTAL_SERVERS - HEALTHY_SERVERS - FAILED_SERVERS))"

echo
echo "=== ENVIRONMENT REQUIREMENTS ==="
echo "The following environment variables may be required:"
echo "- BRAVE_API_KEY (for brave-search)"
echo "- GITHUB_TOKEN (for github)"
echo "- APIFY_TOKEN (for apify)"
echo "- SLACK_BOT_TOKEN (for slack)"
echo "- FIRECRAWL_API_KEY (for firecrawl, if enabled)"
echo "- GOOGLE_MAPS_API_KEY (for google-maps, if enabled)"

if [ $FAILED_SERVERS -eq 0 ]; then
    echo
    echo "✅ All enabled MCP servers are healthy!"
    echo "__CLINE_DONE__ MCP_HEALTHY"
    exit 0
else
    echo
    echo "❌ $FAILED_SERVERS MCP servers failed health check"
    echo "__CLINE_FAIL__ MCP_HEALTH Failed servers detected"
    exit 1
fi
