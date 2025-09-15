#!/usr/bin/env python3
"""
Quick test script to validate MCP connections and system readiness
"""

import json
import subprocess
import sys
from pathlib import Path

def test_mcp_server(server_name, description):
    """Test if an MCP server responds correctly"""
    print(f"Testing {description}...")
    
    try:
        # This would be the actual MCP server test
        # For now, just check if the server process might be running
        result = subprocess.run(['pgrep', '-f', server_name], 
                               capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ {description} process found")
            return True
        else:
            print(f"❌ {description} process not found")
            return False
            
    except Exception as e:
        print(f"❌ Error testing {description}: {str(e)}")
        return False

def test_api_endpoints():
    """Test if API endpoints are responding"""
    import urllib.request
    import urllib.error
    
    endpoints = [
        ("http://localhost:8000/health", "Live Optimizer API"),
        ("http://localhost:8765/health", "DraftKings API"),
        ("http://localhost:8001/api/players", "Alternative API"),
    ]
    
    working_endpoints = []
    
    for url, name in endpoints:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status == 200:
                    print(f"✅ {name} is responding at {url}")
                    working_endpoints.append((url, name))
                else:
                    print(f"❌ {name} returned status {response.status}")
        except Exception as e:
            print(f"❌ {name} not reachable: {str(e)}")
    
    return working_endpoints

def main():
    print("🔍 DFS System Health Check")
    print("=" * 50)
    
    # Test Python environment
    print(f"Python version: {sys.version}")
    print(f"Working directory: {Path.cwd()}")
    
    # Test if we're in the right directory
    required_files = [
        "requirements.txt",
        "draftkings_api_server.py", 
        "live_optimizer_api.py",
        "DFS_PROFESSIONAL_COMPLETE_DASHBOARD.html"
    ]
    
    missing_files = []
    for file in required_files:
        if Path(file).exists():
            print(f"✅ Found {file}")
        else:
            print(f"❌ Missing {file}")
            missing_files.append(file)
    
    if missing_files:
        print(f"\n❌ Missing critical files: {missing_files}")
        return False
    
    # Test API endpoints
    print(f"\n🌐 Testing API Endpoints:")
    working_endpoints = test_api_endpoints()
    
    # Test MCP servers (placeholder)
    print(f"\n🔧 Testing MCP Servers:")
    mcp_servers = [
        ("sequential-thinking", "Sequential Thinking MCP"),
        ("fetch-mcp", "Fetch MCP"),
        ("memory-mcp", "Memory MCP"),
        ("puppeteer-mcp", "Puppeteer MCP")
    ]
    
    working_mcp = 0
    for server, desc in mcp_servers:
        if test_mcp_server(server, desc):
            working_mcp += 1
    
    # Summary
    print(f"\n📊 System Status Summary:")
    print(f"   • API Endpoints Working: {len(working_endpoints)}/3")
    print(f"   • MCP Servers Working: {working_mcp}/{len(mcp_servers)}")
    print(f"   • Required Files: {len(required_files) - len(missing_files)}/{len(required_files)}")
    
    if working_endpoints and not missing_files:
        print(f"\n✅ System appears to be functional!")
        print(f"   • Dashboard: Open DFS_PROFESSIONAL_COMPLETE_DASHBOARD.html")
        for url, name in working_endpoints:
            print(f"   • {name}: {url}")
        return True
    else:
        print(f"\n❌ System has issues that need to be resolved")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
