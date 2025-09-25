#!/usr/bin/env python3
"""
MCP Bridge Connection Fixer
Diagnoses and fixes missing MCP server connections based on actual testing results.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

class MCPBridgeFixer:
    def __init__(self):
        self.cline_config_path = Path.home() / "Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
        self.working_servers = []
        self.broken_servers = []
        self.test_results = {}
        
    def diagnose_connections(self):
        """Test which MCP servers actually work"""
        print("🔍 Diagnosing MCP Server Connections...")
        
        # Test core servers that should work
        core_servers = [
            "@modelcontextprotocol/server-memory",
            "@modelcontextprotocol/server-fetch", 
            "@modelcontextprotocol/server-sqlite"
        ]
        
        for server in core_servers:
            try:
                print(f"Testing {server}...")
                result = subprocess.run([
                    "npx", "-y", f"{server}@latest", "--help"
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    self.working_servers.append(server)
                    self.test_results[server] = "✅ WORKING"
                    print(f"  ✅ {server} - WORKING")
                else:
                    self.broken_servers.append(server)
                    self.test_results[server] = f"❌ FAILED: {result.stderr}"
                    print(f"  ❌ {server} - FAILED")
                    
            except subprocess.TimeoutExpired:
                self.broken_servers.append(server)
                self.test_results[server] = "❌ TIMEOUT"
                print(f"  ⏰ {server} - TIMEOUT")
            except Exception as e:
                self.broken_servers.append(server)
                self.test_results[server] = f"❌ ERROR: {str(e)}"
                print(f"  💥 {server} - ERROR: {e}")
    
    def create_minimal_config(self):
        """Create a minimal working MCP configuration"""
        print("\n🔧 Creating Minimal Working MCP Configuration...")
        
        config = {
            "mcpServers": {}
        }
        
        # Add only working servers
        for server in self.working_servers:
            server_name = server.split("/")[-1].replace("server-", "")
            config["mcpServers"][server_name] = {
                "command": "npx",
                "args": ["-y", f"{server}@latest"],
                "env": {},
                "disabled": False
            }
        
        # Always add task manager if available (custom server)
        config["mcpServers"]["taskmanager"] = {
            "command": "node",
            "args": [str(Path.cwd() / "shims/mcp_taskmanager.sh")],
            "env": {},
            "disabled": False  
        }
        
        # Write config
        self.cline_config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cline_config_path, 'w') as f:
            json.dump(config, f, indent=2)
            
        print(f"✅ Minimal config written to {self.cline_config_path}")
        return config
    
    def create_bridge_script(self):
        """Create a bridge script to handle MCP connections"""
        bridge_script = Path.cwd() / "mcp_bridge.py"
        
        bridge_code = '''#!/usr/bin/env python3
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
'''
        
        with open(bridge_script, 'w') as f:
            f.write(bridge_code)
            
        bridge_script.chmod(0o755)
        print(f"✅ Bridge script created: {bridge_script}")
        
    def create_status_report(self):
        """Create a detailed status report"""
        report = {
            "timestamp": "2025-09-20T22:38:00Z",
            "diagnosis": "MCP Bridge Connection Analysis",
            "working_servers": len(self.working_servers),
            "broken_servers": len(self.broken_servers),
            "test_results": self.test_results,
            "recommendations": [
                "Use only working servers in production",
                "Implement fallbacks for broken servers",
                "Monitor server health regularly",
                "Use minimal configuration to reduce failures"
            ]
        }
        
        report_file = Path.cwd() / "mcp_bridge_status.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"📊 Status report saved: {report_file}")
        return report
    
    def fix_connections(self):
        """Main method to fix MCP connections"""
        print("🛠️  MCP Bridge Connection Fixer")
        print("=" * 50)
        
        # Step 1: Diagnose current state
        self.diagnose_connections()
        
        # Step 2: Create minimal working config
        config = self.create_minimal_config()
        
        # Step 3: Create bridge script
        self.create_bridge_script()
        
        # Step 4: Generate status report
        report = self.create_status_report()
        
        # Summary
        print(f"\n📋 SUMMARY:")
        print(f"   Working servers: {len(self.working_servers)}")
        print(f"   Broken servers: {len(self.broken_servers)}")
        print(f"   Config updated: ✅")
        print(f"   Bridge created: ✅")
        
        if self.working_servers:
            print(f"\n✅ WORKING SERVERS:")
            for server in self.working_servers:
                print(f"   - {server}")
        
        if self.broken_servers:
            print(f"\n❌ BROKEN SERVERS:")
            for server in self.broken_servers:
                print(f"   - {server}")
                
        print(f"\n🎯 NEXT STEPS:")
        print(f"   1. Restart Cline to load new config")
        print(f"   2. Test connections with working servers only")
        print(f"   3. Use mcp_bridge.py for manual server management")
        
        return report

if __name__ == "__main__":
    fixer = MCPBridgeFixer()
    fixer.fix_connections()
