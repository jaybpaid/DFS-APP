#!/usr/bin/env python3
"""
MCP Bridge - Handles connections to working MCP servers only
"""
import json
import sys
import subprocess
from pathlib import Path

WORKING_SERVERS = {
    "memory": "@modelcontextprotocol/server-memory@latest",
    "fetch": "@modelcontextprotocol/server-fetch@latest", 
    "sqlite": "@modelcontextprotocol/server-sqlite@latest"
}

def start_server(server_name):
    """Start a working MCP server"""
    if server_name not in WORKING_SERVERS:
        print(f"❌ Server {server_name} not in working list")
        return False
        
    try:
        print(f"🚀 Starting {server_name}...")
        package = WORKING_SERVERS[server_name]
        subprocess.run(["npx", "-y", package], check=True)
        return True
    except Exception as e:
        print(f"❌ Failed to start {server_name}: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python mcp_bridge.py <server_name>")
        sys.exit(1)
        
    server_name = sys.argv[1]
    success = start_server(server_name)
    sys.exit(0 if success else 1)
