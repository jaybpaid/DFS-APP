#!/usr/bin/env python3
"""
Fix MCP Server Commands - Resolve npm command execution issues
"""

import yaml
import os
import subprocess
from pathlib import Path

def fix_gateway_config():
    """Fix the gateway configuration with proper command formats"""
    
    config_path = Path.home() / ".mcp/docker-gateway/gateway.config.yaml"
    
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    # Fix command formats for servers having issues
    for child in config['children']:
        if child['name'] == 'memory':
            # Fix memory server command
            child['docker']['command'] = [
                "npx", "--yes", "@modelcontextprotocol/server-memory@0.6.0", "--transport", "stdio"
            ]
            print(f"✅ Fixed {child['name']} command format")
        
        elif child['name'] == 'fetch':
            # Fix fetch server command
            child['docker']['command'] = [
                "npx", "--yes", "@modelcontextprotocol/server-fetch", "--transport", "stdio"
            ]
            print(f"✅ Fixed {child['name']} command format")
            
        elif child['name'] == 'git':
            # Fix git server command  
            child['docker']['command'] = [
                "npx", "--yes", "@modelcontextprotocol/server-git@0.6.0", "--transport", "stdio"
            ]
            print(f"✅ Fixed {child['name']} command format")
        
        elif child['name'] == 'calculator':
            # Fix calculator server command
            child['docker']['command'] = [
                "npx", "--yes", "calculator-mcp@1.0.0", "--transport", "stdio"
            ]
            print(f"✅ Fixed {child['name']} command format")
            
        elif child['name'] == 'time':
            # Fix time server command
            child['docker']['command'] = [
                "npx", "--yes", "time-mcp@1.0.0", "--transport", "stdio" 
            ]
            print(f"✅ Fixed {child['name']} command format")
            
        elif child['name'] == 'puppeteer':
            # Fix puppeteer server command
            child['docker']['command'] = [
                "npx", "--yes", "@modelcontextprotocol/server-puppeteer@0.6.0", "--transport", "stdio"
            ]
            print(f"✅ Fixed {child['name']} command format")
            
        elif child['name'] == 'sequential-thinking':
            # Fix sequential-thinking server command
            child['docker']['command'] = [
                "npx", "--yes", "@modelcontextprotocol/server-sequential-thinking@0.6.0", "--transport", "stdio"
            ]
            print(f"✅ Fixed {child['name']} command format")
    
    # Re-enable filesystem with corrected command
    for child in config['children']:
        if child['name'] == 'filesystem':
            child['enabled'] = True
            child['docker']['command'] = [
                "npx", "--yes", "@modelcontextprotocol/server-filesystem@0.6.0", "/tmp", "--transport", "stdio"
            ]
            print(f"✅ Re-enabled and fixed {child['name']}")
    
    # Write back the fixed configuration
    with open(config_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)
    
    print(f"\n✅ Updated gateway configuration: {config_path}")

def install_gateway_dependencies():
    """Install any missing dependencies for the gateway"""
    
    gateway_dir = Path.home() / ".mcp/docker-gateway"
    os.chdir(gateway_dir)
    
    print("📦 Installing gateway dependencies...")
    try:
        subprocess.run(["npm", "install", "--production"], check=True, capture_output=True)
        print("✅ Gateway dependencies installed")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Gateway dependencies install failed: {e}")
    except FileNotFoundError:
        print("⚠️ npm not found, dependencies may need manual installation")

def test_docker_connectivity():
    """Test Docker connectivity and availability"""
    
    docker_paths = [
        "/Applications/Docker.app/Contents/Resources/bin/docker",
        "/usr/local/bin/docker",
        "/opt/homebrew/bin/docker"
    ]
    
    docker_path = None
    for path in docker_paths:
        if os.path.exists(path):
            docker_path = path
            break
    
    if docker_path:
        try:
            result = subprocess.run([docker_path, "--version"], capture_output=True, text=True, check=True)
            print(f"✅ Docker available: {result.stdout.strip()}")
            
            # Test Docker daemon
            subprocess.run([docker_path, "info"], capture_output=True, check=True)
            print("✅ Docker daemon operational")
            return True
            
        except subprocess.CalledProcessError:
            print("❌ Docker daemon not running")
            return False
    else:
        print("❌ Docker not found in expected locations")
        return False

def main():
    """Main execution function"""
    
    print("🔧 Fixing MCP Server Commands...")
    print("=" * 50)
    
    # Test Docker first
    if not test_docker_connectivity():
        print("⚠️ Docker issues detected, but continuing with config fixes...")
    
    # Fix gateway configuration  
    fix_gateway_config()
    
    # Install dependencies
    install_gateway_dependencies()
    
    print("\n" + "=" * 50)
    print("✅ MCP Server Command Fixes Applied")
    print("\nNext steps:")
    print("1. Restart the gateway: ~/.mcp/docker-gateway/start-gateway.sh")  
    print("2. Monitor container status: docker ps --filter 'label=mcp.gateway=true'")
    print("3. Check logs for successful startup")

if __name__ == "__main__":
    main()
