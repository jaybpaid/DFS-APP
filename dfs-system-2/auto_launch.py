#!/usr/bin/env python3
"""
Automated DFS Platform Launcher
Starts the proxy server and opens the web interface automatically
"""

import subprocess
import sys
import time
import webbrowser
import os
from pathlib import Path

def main():
    print("🚀 Starting Automated DFS Platform...")

    # Get the directory of this script
    script_dir = Path(__file__).parent.absolute()

    # Start the proxy server in background
    print("📡 Starting DraftKings API Proxy Server...")
    proxy_script = script_dir / "draftkings_api_server.py"

    try:
        # Start proxy server
        proxy_process = subprocess.Popen([
            sys.executable, str(proxy_script)
        ], cwd=script_dir)

        print("✅ Proxy server started (PID: {})".format(proxy_process.pid))

        # Wait a moment for server to start
        time.sleep(3)

        # Open the HTML file in browser
        html_file = script_dir / "DFS_PROFESSIONAL_ENFORCEMENT.html"
        html_url = f"file://{html_file}"

        print(f"🌐 Opening DFS Platform: {html_url}")
        webbrowser.open(html_url)

        print("\n🎯 DFS Platform is now running!")
        print("📊 The app will automatically load player data on startup")
        print("🔄 Data refreshes every 5 minutes in ONLINE mode")
        print("⚡ Switch between NFL/NBA and ONLINE/OFFLINE modes as needed")
        print("\nPress Ctrl+C to stop the proxy server...")

        # Keep the script running to maintain the proxy server
        try:
            proxy_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Stopping proxy server...")
            proxy_process.terminate()
            proxy_process.wait()
            print("✅ Proxy server stopped")

    except FileNotFoundError as e:
        print(f"❌ Error: Could not find required file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting platform: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
