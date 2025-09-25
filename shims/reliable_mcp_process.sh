#!/usr/bin/env bash
set -euo pipefail

# Load Node.js via nvm if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

name="${1:?name arg required}"

case "$name" in
  process-mcp)        
    exec node ./mcp/process-mcp/dist/server.js 
    ;;
  python-runner-mcp)  
    exec node ./mcp/python-runner-mcp/dist/server.js 
    ;;
  sqlite-mcp-lite)    
    exec node ./mcp/sqlite-mcp-lite/dist/server.js 
    ;;
  fetch-mcp-lite)     
    exec node ./mcp/fetch-mcp-lite/dist/server.js 
    ;;
  html-parse-mcp)     
    exec node ./mcp/html-parse-mcp/dist/server.js 
    ;;
  git-mcp)            
    exec node ./mcp/git-mcp/dist/server.js 
    ;;
  filesystem)
    exec npx -y "@modelcontextprotocol/server-filesystem" "/Users/614759/Documents/MCP Workspace/DFS APP"
    ;;
  memory)
    exec npx -y "@modelcontextprotocol/server-memory"
    ;;
  sequential-thinking)
    exec npx -y "@modelcontextprotocol/server-sequential-thinking"
    ;;
  brave-search)
    BRAVE_API_KEY="BSAqIgIC5hQ8x5lShDteZWUgEQIARAQ" exec npx -y "@modelcontextprotocol/server-brave-search"
    ;;
  puppeteer)
    exec npx -y "@modelcontextprotocol/server-puppeteer"
    ;;
  *) 
    echo "unknown server: $name" >&2
    exit 2 
    ;;
esac
