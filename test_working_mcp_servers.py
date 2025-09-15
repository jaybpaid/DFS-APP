#!/usr/bin/env python3
"""
Test script to verify working MCP servers
"""
import subprocess
import time
import json
import os

def test_mcp_server(server_name, command, args, env_vars=None):
    """Test if an MCP server starts successfully"""
    print(f"Testing {server_name}...")
    
    try:
        # Set up environment
        env = os.environ.copy()
        if env_vars:
            for key, value in env_vars.items():
                env[key] = value
        
        # Start the server with a timeout
        process = subprocess.Popen(
            [command] + args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            text=True
        )
        
        # Give it a moment to start
        time.sleep(2)
        
        # Check if it's still running
        if process.poll() is None:
            print(f"  ✓ {server_name} is running")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            return True
        else:
            # Get output to see what went wrong
            stdout, stderr = process.communicate()
            print(f"  ✗ {server_name} failed to start")
            if stdout:
                print(f"    STDOUT: {stdout[:200]}...")
            if stderr:
                print(f"    STDERR: {stderr[:200]}...")
            return False
            
    except Exception as e:
        print(f"  ✗ {server_name} error: {e}")
        return False

def test_working_servers():
    """Test servers that should work without API keys"""
    servers = [
        {
            "name": "filesystem",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem"],
            "env": {}
        },
        {
            "name": "browser-use",
            "command": "npx",
            "args": ["-y", "@agent-infra/mcp-server-browser"],
            "env": {}
        },
        {
            "name": "calculator",
            "command": "npx",
            "args": ["-y", "calculator-mcp"],
            "env": {}
        },
        {
            "name": "read-website-fast",
            "command": "npx",
            "args": ["-y", "@just-every/mcp-read-website-fast"],
            "env": {}
        },
    ]
    
    results = {}
    for server in servers:
        success = test_mcp_server(server["name"], server["command"], server["args"], server["env"])
        results[server["name"]] = success
        time.sleep(1)  # Brief pause between tests
    
    return results

def main():
    print("=" * 60)
    print("TESTING WORKING MCP SERVERS")
    print("=" * 60)
    
    print("\nTesting MCP Servers (should all work):")
    print("-" * 40)
    results = test_working_servers()
    
    print("\nSummary:")
    print("-" * 20)
    
    working = sum(1 for result in results.values() if result)
    total = len(results)
    print(f"Working servers: {working}/{total}")
    
    if working == total:
        print("\n✅ All working MCP servers are functioning correctly!")
        print("You can now use these servers in your applications.")
    else:
        print("\n⚠️  Some servers are not working properly.")
        print("Check the output above for details.")
    
    print("\nWorking servers:")
    for server, is_working in results.items():
        if is_working:
            print(f"  ✓ {server}")
    
    print("\nConfiguration file: mcp_config.json")
    print("Health check: bash dfs-system-2/scripts/healthcheck_mcp.sh")

if __name__ == "__main__":
    main()
