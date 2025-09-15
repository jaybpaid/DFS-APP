#!/usr/bin/env python3
"""
Test script to verify all MCP servers are working correctly with the fixed configuration.
This script tests each server by running its help command to ensure it can be installed and executed.
"""

import subprocess
import json
import os
import time
from pathlib import Path

def run_command(command, args, env=None, timeout=60):
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
    print("MCP SERVER TESTING - FIXED CONFIGURATION")
    print("=" * 60)
    
    for server_name, server_config in servers.items():
        if not server_config.get('enabled', False):
            print(f"\n{server_name}: DISABLED (skipping)")
            results[server_name] = {'status': 'disabled', 'enabled': False}
            continue
            
        print(f"\n{server_name}: TESTING...")
        
        command = server_config['command']
        args = server_config['args'] + ['--help']  # Add --help to test the command
        
        env_vars = server_config.get('env', {})
        
        result = run_command(command, args, env_vars)
        
        if result['success']:
            print(f"✓ {server_name}: SUCCESS")
            results[server_name] = {
                'status': 'success',
                'enabled': True,
                'details': f"Command executed successfully"
            }
        else:
            print(f"✗ {server_name}: FAILED")
            print(f"   Error: {result['stderr']}")
            results[server_name] = {
                'status': 'failed',
                'enabled': True,
                'error': result['stderr'],
                'returncode': result['returncode']
            }
        
        # Add a small delay between tests
        time.sleep(1)
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    success_count = 0
    failed_count = 0
    disabled_count = 0
    
    for server_name, result in results.items():
        status = result['status']
        if status == 'success':
            success_count += 1
            print(f"✓ {server_name}: SUCCESS")
        elif status == 'failed':
            failed_count += 1
            print(f"✗ {server_name}: FAILED - {result.get('error', 'Unknown error')}")
        else:
            disabled_count += 1
            print(f"- {server_name}: DISABLED")
    
    print("\n" + "=" * 60)
    print(f"TOTAL SERVERS: {len(servers)}")
    print(f"SUCCESS: {success_count}")
    print(f"FAILED: {failed_count}")
    print(f"DISABLED: {disabled_count}")
    print("=" * 60)
    
    # Save results to file
    with open('mcp_test_results_fixed.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nResults saved to mcp_test_results_fixed.json")
    
    return results

if __name__ == "__main__":
    test_mcp_servers()
