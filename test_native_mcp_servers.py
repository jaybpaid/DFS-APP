#!/usr/bin/env python3

import os
import subprocess
import json
import time
from pathlib import Path

def test_mcp_servers():
    """Test native MCP servers to see which ones are functional"""
    
    print("🧪 Testing Native MCP Servers")
    print("=" * 50)
    
    mcp_servers_dir = Path.home() / ".mcp" / "servers"
    
    if not mcp_servers_dir.exists():
        print("❌ MCP servers directory not found")
        return
    
    # Get list of available servers
    servers = [d.name for d in mcp_servers_dir.iterdir() if d.is_dir()]
    print(f"📋 Found {len(servers)} MCP servers: {', '.join(servers)}")
    print()
    
    results = {}
    
    # Test each server
    for server in servers:
        server_dir = mcp_servers_dir / server
        start_script = server_dir / "start.sh"
        package_json = server_dir / "package.json"
        
        print(f"🔍 Testing {server}...")
        
        # Check if files exist
        has_start_script = start_script.exists()
        has_package_json = package_json.exists()
        
        server_info = {
            "has_start_script": has_start_script,
            "has_package_json": has_package_json,
            "executable": False,
            "status": "unknown"
        }
        
        if has_start_script:
            # Check if start script is executable
            server_info["executable"] = os.access(start_script, os.X_OK)
            
            if server_info["executable"]:
                # Try to run with --help to see if it responds
                try:
                    result = subprocess.run([str(start_script), "--help"], 
                                          capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        server_info["status"] = "working"
                        print(f"   ✅ {server}: Working")
                    else:
                        server_info["status"] = "error"
                        server_info["error"] = result.stderr
                        print(f"   ❌ {server}: Error - {result.stderr[:100]}")
                except subprocess.TimeoutExpired:
                    server_info["status"] = "timeout"
                    print(f"   ⏰ {server}: Timeout")
                except Exception as e:
                    server_info["status"] = "exception"
                    server_info["error"] = str(e)
                    print(f"   ❌ {server}: Exception - {str(e)[:100]}")
            else:
                server_info["status"] = "not_executable"
                print(f"   ⚠️  {server}: Start script not executable")
        else:
            server_info["status"] = "no_start_script"
            print(f"   ❌ {server}: No start script found")
        
        results[server] = server_info
    
    print()
    print("📊 SUMMARY")
    print("=" * 30)
    
    working_servers = [s for s, info in results.items() if info["status"] == "working"]
    timeout_servers = [s for s, info in results.items() if info["status"] == "timeout"]
    error_servers = [s for s, info in results.items() if info["status"] in ["error", "exception"]]
    missing_servers = [s for s, info in results.items() if info["status"] in ["no_start_script", "not_executable"]]
    
    print(f"✅ Working servers ({len(working_servers)}): {', '.join(working_servers)}")
    print(f"⏰ Timeout servers ({len(timeout_servers)}): {', '.join(timeout_servers)}")
    print(f"❌ Error servers ({len(error_servers)}): {', '.join(error_servers)}")
    print(f"⚠️  Missing/Not executable ({len(missing_servers)}): {', '.join(missing_servers)}")
    
    # Save detailed results
    with open("native_mcp_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: native_mcp_test_results.json")
    
    # Recommendations
    if working_servers:
        print(f"\n🎉 GOOD NEWS: {len(working_servers)} MCP servers are working!")
        print("💡 You can use these immediately by updating your Claude Desktop config")
        print("📍 Next step: Update ~/.claude_desktop_config.json with working servers")
    else:
        print(f"\n⚠️  No MCP servers are responding correctly.")
        print("💡 This might be due to missing dependencies or configuration issues")
    
    return results

if __name__ == "__main__":
    test_mcp_servers()
