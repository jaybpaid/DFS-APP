#!/usr/bin/env python3
"""
Add Remaining MCP Servers to Gateway Configuration
Adds the 23+ servers that were discovered but not yet in gateway config
"""

import yaml
import json
from pathlib import Path

def load_discovered_servers():
    """Load the list of discovered servers"""
    discovered_path = Path.home() / ".mcp/docker-gateway/discovered.json"
    with open(discovered_path, 'r') as f:
        return json.load(f)

def load_gateway_config():
    """Load current gateway configuration"""
    config_path = Path.home() / ".mcp/docker-gateway/gateway.config.yaml" 
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def save_gateway_config(config):
    """Save updated gateway configuration"""
    config_path = Path.home() / ".mcp/docker-gateway/gateway.config.yaml"
    with open(config_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)

def get_existing_server_names(config):
    """Get names of servers already in gateway config"""
    return {child['name'] for child in config['children']}

def create_server_config(server):
    """Create gateway config entry for a discovered server"""
    
    # Determine if server needs API keys
    needs_api_key = len(server.get('needs_env', [])) > 0
    
    # Set priority based on server type
    if server['name'] in ['shell', 'playwright', 'postgres', 'everything']:
        priority = 2  # Core utilities
    elif server['name'] in ['aws-kb-retrieval', 'sentry', 'gitlab', 'apify', 'graphlit']:
        priority = 4  # External services
    elif server['type'] == 'local':
        priority = 3  # Local servers
    else:
        priority = 3  # Default
    
    # Create server configuration
    if server['type'] == 'local':
        # Local server configuration
        return {
            'name': server['name'],
            'mode': 'docker',
            'enabled': False,  # Disabled by default for local servers
            'priority': priority,
            'docker': {
                'image': 'node:20-alpine',
                'command': ['sh', '-lc', 'cd /srv && npm ci && node src/server.js --transport stdio'],
                'envFile': '',
                'workdir': '/srv',
                'mounts': [f"/Users/614759/Documents/MCP Workspace/DFS APP/{server['name']}:/srv:ro"],
                'network': 'bridge',
                'cpus': 1.0,
                'memory': '512m'
            },
            'restart': {
                'maxRestarts': 2,
                'backoffMs': 800
            },
            'namespace': server['name']
        }
    else:
        # NPM package server configuration
        return {
            'name': server['name'],
            'mode': 'docker',
            'enabled': not needs_api_key,  # Disable if needs API key
            'priority': priority,
            'docker': {
                'image': 'node:20-alpine',
                'command': ['npx', '--yes', f"{server['pkg']}@{server['version']}", '--transport', 'stdio'],
                'envFile': f"/Users/614759/.mcp/docker-gateway/.env/{server['name']}.env" if needs_api_key else '',
                'workdir': '/srv',
                'mounts': [],
                'network': 'bridge',
                'cpus': 1.0,
                'memory': '1024m' if 'browser' in server['name'] or 'playwright' in server['name'] else '512m'
            },
            'restart': {
                'maxRestarts': 2,
                'backoffMs': 800
            },
            'namespace': server['name']
        }

def main():
    """Add remaining discovered servers to gateway configuration"""
    
    print("🔧 Adding Remaining MCP Servers to Gateway Configuration...")
    print("=" * 60)
    
    # Load data
    discovered_servers = load_discovered_servers()
    config = load_gateway_config()
    existing_names = get_existing_server_names(config)
    
    print(f"📊 Current Status:")
    print(f"   Discovered servers: {len(discovered_servers)}")
    print(f"   Already configured: {len(existing_names)}")
    print(f"   Remaining to add: {len(discovered_servers) - len(existing_names)}")
    print()
    
    # Add missing servers
    added_count = 0
    for server in discovered_servers:
        if server['name'] not in existing_names:
            server_config = create_server_config(server)
            config['children'].append(server_config)
            
            status = "✅ Enabled" if server_config['enabled'] else "⚪ Disabled (needs API key)" if server.get('needs_env') else "⚪ Disabled (local)"
            print(f"   + {server['name']:<20} {status}")
            added_count += 1
    
    if added_count > 0:
        # Save updated configuration
        save_gateway_config(config)
        print()
        print(f"✅ Added {added_count} servers to gateway configuration")
        print(f"📁 Updated: ~/.mcp/docker-gateway/gateway.config.yaml")
    else:
        print("ℹ️  No new servers to add")
    
    # Summary of current state
    total_servers = len(config['children'])
    enabled_servers = len([c for c in config['children'] if c['enabled']])
    
    print()
    print("=" * 60)
    print(f"📊 Gateway Configuration Summary:")
    print(f"   Total servers configured: {total_servers}")
    print(f"   Currently enabled: {enabled_servers}")
    print(f"   Available for activation: {total_servers - enabled_servers}")
    print()
    print("🚀 Next Steps:")
    print("   1. Start Docker Desktop")
    print("   2. Run: ~/.mcp/docker-gateway/start-gateway.sh")
    print("   3. Configure API keys for external services as needed")

if __name__ == "__main__":
    main()
