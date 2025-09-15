#!/usr/bin/env python3
"""
Start the complete DFS Live System
This script starts both the DraftKings API server and the Live Optimizer API
"""

import asyncio
import subprocess
import sys
import time
import requests
from pathlib import Path

def check_port(port):
    """Check if a port is available"""
    try:
        response = requests.get(f"http://localhost:{port}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def start_server(script_name, port, description):
    """Start a server script"""
    print(f"🚀 Starting {description}...")
    
    # Check if already running
    if check_port(port):
        print(f"✅ {description} already running on port {port}")
        return None
    
    # Start the server
    process = subprocess.Popen([
        sys.executable, script_name
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    # Wait a moment for startup
    time.sleep(3)
    
    # Check if it started successfully
    if check_port(port):
        print(f"✅ {description} started successfully on port {port}")
        return process
    else:
        print(f"❌ Failed to start {description}")
        if process.poll() is None:
            process.terminate()
        return None

def main():
    """Start the complete DFS system"""
    print("🏈 DFS Ultimate Optimizer - Live System Startup")
    print("=" * 50)
    
    # Change to the correct directory
    script_dir = Path(__file__).parent
    print(f"📁 Working directory: {script_dir}")
    
    processes = []
    
    # Start DraftKings API Server (port 8765)
    dk_process = start_server(
        "draftkings_api_server.py", 
        8765, 
        "DraftKings API Server"
    )
    if dk_process:
        processes.append(dk_process)
    
    # Start Live Optimizer API (port 8000)
    opt_process = start_server(
        "live_optimizer_api.py", 
        8000, 
        "Live Optimizer API"
    )
    if opt_process:
        processes.append(opt_process)
    
    if len(processes) == 2:
        print("\n🎉 DFS Live System Started Successfully!")
        print("=" * 50)
        print("📊 Dashboard: Open dfs_ultimate_optimizer_with_live_data.html")
        print("🔗 DraftKings API: http://localhost:8765")
        print("🔗 Optimizer API: http://localhost:8000")
        print("\n💡 The system will now automatically:")
        print("   • Pull live salary data from DraftKings")
        print("   • Generate optimized lineups")
        print("   • Show complete player database (200+ players)")
        print("   • Enable slate selection and contest optimization")
        print("\n⚠️  Press Ctrl+C to stop all servers")
        
        try:
            # Keep running until interrupted
            while True:
                time.sleep(1)
                # Check if processes are still running
                for i, process in enumerate(processes):
                    if process.poll() is not None:
                        print(f"❌ Server {i+1} stopped unexpectedly")
                        return
        except KeyboardInterrupt:
            print("\n🛑 Shutting down servers...")
            for process in processes:
                process.terminate()
            print("👋 All servers stopped")
    else:
        print("\n❌ Failed to start complete system")
        print("💡 Try running servers individually:")
        print("   python draftkings_api_server.py")
        print("   python live_optimizer_api.py")
        
        # Clean up any started processes
        for process in processes:
            process.terminate()

if __name__ == "__main__":
    main()
