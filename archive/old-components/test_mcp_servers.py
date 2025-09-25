#!/usr/bin/env python3
"""
Test script for MCP Servers
"""
import asyncio
import json
import subprocess
import sys
from typing import Dict, Any

async def test_mcp_server(package_name: str, server_name: str) -> Dict[str, Any]:
    """Test if an MCP server package can be executed"""
    try:
        # Try to run the MCP server with help/version flag
        result = subprocess.run(
            ["npx", "-y", package_name, "--help"],
            capture_output=True,
            text=True,
            timeout=10
        )
        return {
            "server": server_name,
            "package": package_name,
            "status": "success" if result.returncode == 0 else "error",
            "returncode": result.returncode,
            "stdout": result.stdout[:500],  # Limit output
            "stderr": result.stderr[:500]
        }
    except subprocess.TimeoutExpired:
        return {
            "server": server_name,
            "package": package_name,
            "status": "timeout",
            "error": "Command timed out"
        }
    except Exception as e:
        return {
            "server": server_name,
            "package": package_name,
            "status": "error",
            "error": str(e)
        }

async def test_all_mcp_servers():
    """Test all configured MCP servers"""
    # Read MCP config
    try:
        with open('mcp_config.json', 'r') as f:
            config = json.load(f)
    except Exception as e:
        print(f"Error reading mcp_config.json: {e}")
        return

    servers = config.get('mcpServers', {})
    results = []

    print("Testing MCP Servers...")
    print("=" * 50)

    for server_name, server_config in servers.items():
        if not server_config.get('enabled', False):
            print(f"Skipping disabled server: {server_name}")
            continue

        package_name = server_config['args'][1]  # Extract package name from args
        print(f"\nTesting {server_name} ({package_name})...")

        result = await test_mcp_server(package_name, server_name)
        results.append(result)

        print(f"  Status: {result['status']}")
        if result['status'] == 'success':
            print("  ✓ Server responded successfully")
        elif result['status'] == 'timeout':
            print("  ! Server timed out")
        elif result['status'] == 'error':
            print(f"  ✗ Error: {result.get('error', 'Unknown error')}")

    # Summary
    print("\n" + "=" * 50)
    print("SUMMARY:")
    success_count = sum(1 for r in results if r['status'] == 'success')
    print(f"Total servers tested: {len(results)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {len(results) - success_count}")

    if success_count > 0:
        print("\n✓ MCP servers are properly installed and accessible!")
        print("You can now use these tools in your AI assistant.")
    else:
        print("\n✗ No MCP servers working. Check installation and configuration.")

if __name__ == "__main__":
    asyncio.run(test_all_mcp_servers())
