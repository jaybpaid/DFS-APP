#!/usr/bin/env python3
"""
Verify DFS System Status
Simple script to check if both servers are running and responding
"""

import requests
import json
from datetime import datetime

def check_server(url, name):
    """Check if a server is responding"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f"✅ {name}: Running (Status: {response.status_code})")
            return True
        else:
            print(f"⚠️  {name}: Responding but status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: Not running (Connection refused)")
        return False
    except requests.exceptions.Timeout:
        print(f"⏰ {name}: Timeout (Server may be slow)")
        return False
    except Exception as e:
        print(f"❌ {name}: Error - {str(e)}")
        return False

def test_api_endpoints():
    """Test key API endpoints"""
    print("\n🔍 Testing API Endpoints:")
    
    # Test DraftKings API Server
    try:
        response = requests.get("http://localhost:8765/api/players?sport=NFL", timeout=10)
        if response.status_code == 200:
            data = response.json()
            player_count = len(data.get('players', []))
            print(f"✅ DraftKings API: {player_count} players loaded")
        else:
            print(f"⚠️  DraftKings API: Status {response.status_code}")
    except Exception as e:
        print(f"❌ DraftKings API: {str(e)}")
    
    # Test Live Optimizer API
    try:
        test_request = {
            "sport": "NFL",
            "site": "DraftKings",
            "num_lineups": 1,
            "objective": "ev",
            "contest_type": "gpp"
        }
        response = requests.post(
            "http://localhost:8000/api/generate-lineups", 
            json=test_request, 
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                lineup_count = data.get('total_lineups', 0)
                player_pool_count = len(data.get('player_pool', []))
                print(f"✅ Optimizer API: {lineup_count} lineups, {player_pool_count} players in pool")
            else:
                print(f"⚠️  Optimizer API: Success=False, Error: {data.get('error')}")
        else:
            print(f"⚠️  Optimizer API: Status {response.status_code}")
    except Exception as e:
        print(f"❌ Optimizer API: {str(e)}")

def main():
    """Main verification function"""
    print("🏈 DFS System Verification")
    print("=" * 40)
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check basic server health
    print("🔍 Checking Server Health:")
    dk_running = check_server("http://localhost:8765/health", "DraftKings API Server (8765)")
    opt_running = check_server("http://localhost:8000/health", "Live Optimizer API (8000)")
    
    if dk_running and opt_running:
        print("\n🎉 Both servers are running!")
        test_api_endpoints()
        
        print("\n📊 System Status: READY")
        print("💡 You can now:")
        print("   • Open dfs_ultimate_optimizer_with_live_data.html")
        print("   • Select a contest slate")
        print("   • Generate optimized lineups with live data")
        
    elif dk_running and not opt_running:
        print("\n⚠️  DraftKings API is running but Optimizer API is not")
        print("💡 Try: python live_optimizer_api.py")
        
    elif not dk_running and opt_running:
        print("\n⚠️  Optimizer API is running but DraftKings API is not")
        print("💡 Try: python draftkings_api_server.py")
        
    else:
        print("\n❌ Neither server is running")
        print("💡 Try: python start_live_system.py")
        print("   Or start individually:")
        print("   • python draftkings_api_server.py")
        print("   • python live_optimizer_api.py")

if __name__ == "__main__":
    main()
