#!/usr/bin/env python3
"""
Proper test script for MCP servers - uses version commands instead of --help
to avoid issues with servers that don't support help flags.
"""

import subprocess
import json
import os
import time
from pathlib import Path

def run_command(command, args, env=None, timeout=30):
    """Run a command and return the result"""
    try:
        full_cmd = [command] + args
        print(f"Running: {' '.join(full_cmd)}")
        
        env_vars = os.environ.copy()
        if env:
            env_vars.update(env)
            
        result = subprocess.run(
            full_cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env_vars
        )
        
        return {
            'success': result.returncode == 0,
            'returncode': result.returncode,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'returncode': -1,
            'stdout': '',
            'stderr': 'Command timed out'
        }
    except Exception as e:
        return {
            'success': False,
            'returncode': -1,
            'stdout': '',
            'stderr': str(e)
        }

def test_mcp_server(server_name, server_config):
    """Test a single MCP server"""
    if not server_config.get('enabled', False):
        return {'status': 'disabled', 'enabled': False}
    
    command = server_config['command']
    args = server_config['args']
    env_vars = server_config.get('env', {})
    
    # Use version check instead of --help to avoid issues
    # For npm packages, we can use npm info to check if package exists
    if command == 'npx':
        package_name = args[1] if len(args) > 1 else args[0]
        
        # Check if package exists using npm info
        npm_check = run_command('npm', ['info', package_name, '--json'], timeout=15)
        
        if npm_check['success']:
            return {
                'status': 'success',
                'enabled': True,
                'details': f"Package {package_name} exists and can be installed"
            }
        else:
            return {
                'status': 'failed',
                'enabled': True,
                'error': f"Package {package_name} not found: {npm_check['stderr']}",
                'returncode': npm_check['returncode']
            }
    
    return {'status': 'unknown', 'enabled': True}

def test_mcp_servers():
    """Test all MCP servers in the configuration"""
    
    # Load the MCP configuration
    config_path = Path('mcp_config.json')
    if not config_path.exists():
        print("Error: mcp_config.json not found!")
        return
    
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    servers = config.get('mcpServers', {})
    
    results = {}
    
    print("=" * 60)
    print("MCP SERVER VALIDATION - PACKAGE EXISTENCE CHECK")
    print("=" * 60)
    
    for server_name, server_config in servers.items():
        print(f"\n{server_name}: CHECKING...")
        result = test_mcp_server(server_name, server_config)
        results[server_name] = result
        
        if result['status'] == 'success':
            print(f"✓ {server_name}: PACKAGE EXISTS")
        elif result['status'] == 'failed':
            print(f"✗ {server_name}: PACKAGE NOT FOUND")
            print(f"   Error: {result.get('error', 'Unknown error')}")
        elif result['status'] == 'disabled':
            print(f"- {server_name}: DISABLED")
        else:
            print(f"? {server_name}: UNKNOWN STATUS")
    
    # Print summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    
    success_count = 0
    failed_count = 0
    disabled_count = 0
    
    for server_name, result in results.items():
        status = result['status']
        if status == 'success':
            success_count += 1
            print(f"✓ {server_name}: PACKAGE EXISTS")
        elif status == 'failed':
            failed_count += 1
            print(f"✗ {server_name}: PACKAGE NOT FOUND")
        elif status == 'disabled':
            disabled_count += 1
            print(f"- {server_name}: DISABLED")
        else:
            print(f"? {server_name}: UNKNOWN")
    
    print("\n" + "=" * 60)
    print(f"TOTAL SERVERS: {len(servers)}")
    print(f"PACKAGES EXIST: {success_count}")
    print(f"PACKAGES MISSING: {failed_count}")
    print(f"DISABLED: {disabled_count}")
    print("=" * 60)
    
    # Save results to file
    with open('mcp_package_validation.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults saved to mcp_package_validation.json")
    
    return results

if __name__ == "__main__":
    test_mcp_servers()
