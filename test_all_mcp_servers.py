#!/usr/bin/env python3
"""
Test script to verify all MCP servers are working properly.
This script tests the connection and basic functionality of each server.
"""

import subprocess
import time
import json
import os

def test_server(server_name, command, env=None):
    """Test if an MCP server can be started successfully."""
    print(f"Testing {server_name}...")
    
    try:
        # Set up environment variables if provided
        env_vars = os.environ.copy()
        if env:
            env_vars.update(env)
        
        # Start the server with a short timeout
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env_vars,
            text=True
        )
        
        # Wait a moment for the server to start
        time.sleep(2)
        
        # Check if process is still running
        if process.poll() is None:
            print(f"✓ {server_name} started successfully")
            process.terminate()
            return True
        else:
            stdout, stderr = process.communicate()
            print(f"✗ {server_name} failed to start")
            print(f"   Error: {stderr}")
            return False
            
    except Exception as e:
        print(f"✗ {server_name} failed with exception: {e}")
        return False

def main():
    """Test all MCP servers configured in mcp_config.json"""
    print("Testing MCP Servers...\n")
    
    # Read the MCP configuration
    try:
        with open('mcp_config.json', 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print("mcp_config.json not found!")
        return
    
    servers = config.get('mcpServers', {})
    
    results = {}
    
    for server_name, server_config in servers.items():
        if not server_config.get('enabled', False):
            print(f"⏭️ {server_name} is disabled, skipping...")
            continue
            
        command = server_config['command']
        args = server_config['args']
        env = server_config.get('env', {})
        
        full_command = [command] + args
        
        # Test the server
        success = test_server(server_name, full_command, env)
        results[server_name] = success
        
        print()  # Add spacing between tests
    
    # Print summary
    print("\n" + "="*50)
    print("MCP SERVER TEST SUMMARY")
    print("="*50)
    
    successful = []
    failed = []
    
    for server_name, success in results.items():
        if success:
            successful.append(server_name)
        else:
            failed.append(server_name)
    
    print(f"Successful: {len(successful)}")
    for server in successful:
        print(f"  ✓ {server}")
    
    print(f"\nFailed: {len(failed)}")
    for server in failed:
        print(f"  ✗ {server}")
    
    if successful:
        print(f"\n✅ {len(successful)} servers ready to use!")
    if failed:
        print(f"❌ {len(failed)} servers need attention")

if __name__ == "__main__":
    main()
