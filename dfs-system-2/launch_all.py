#!/usr/bin/env python3
"""
DFS Ultimate Optimizer - One-Click Launcher
Automatically starts all services: DraftKings API, FastAPI Optimizer, and opens dashboard
"""

import asyncio
import subprocess
import sys
import time
import webbrowser
import signal
import os
from pathlib import Path

class DFSLauncher:
    """Launcher for all DFS Ultimate Optimizer services"""

    def __init__(self):
        self.processes = []
        self.project_root = Path(__file__).parent

    async def check_service_health(self, url: str, timeout: int = 30) -> bool:
        """Check if a service is healthy"""
        import aiohttp

        try:
            async with aiohttp.ClientSession() as session:
                for _ in range(timeout):
                    try:
                        async with session.get(url) as response:
                            if response.status == 200:
                                return True
                    except:
                        pass
                    await asyncio.sleep(1)
        except:
            pass
        return False

    def start_service(self, command: str, name: str, cwd: str = None) -> subprocess.Popen:
        """Start a background service"""
        print(f"🚀 Starting {name}...")
        print(f"   Command: {command}")
        print(f"   Working directory: {cwd or self.project_root}")

        # First check if the Python file exists and is importable
        if "python" in command and ".py" in command:
            script_name = command.split()[-1]
            script_path = (cwd or self.project_root) / script_name
            if not script_path.exists():
                print(f"   ❌ Error: {script_name} not found at {script_path}")
                return None

            # Try to import the module to check for basic issues
            try:
                import importlib.util
                spec = importlib.util.spec_from_file_location(script_name[:-3], script_path)
                if spec and spec.loader:
                    print(f"   ✅ {script_name} found and importable")
                else:
                    print(f"   ⚠️  {script_name} may have import issues")
            except Exception as e:
                print(f"   ⚠️  {script_name} import check failed: {e}")

        process = subprocess.Popen(
            command,
            shell=True,
            cwd=cwd or self.project_root,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid if os.name != 'nt' else None
        )
        self.processes.append((process, name))

        # Give it a moment to start and check if it's still running
        time.sleep(2)
        if process.poll() is None:
            print(f"   ✅ {name} process started (PID: {process.pid})")
        else:
            print(f"   ❌ {name} process failed to start")
            # Print any error output
            if process.stderr:
                error_output = process.stderr.read().decode('utf-8', errors='ignore')
                if error_output.strip():
                    print(f"   Error output: {error_output[:500]}...")

        return process

    async def wait_for_services(self):
        """Wait for all services to be healthy"""
        services = [
            ("http://localhost:8765/health", "DraftKings API Server"),
            ("http://localhost:8000/health", "FastAPI Optimizer")
        ]

        print("\n⏳ Waiting for services to start...")

        for url, name in services:
            print(f"   Checking {name}...")
            if await self.check_service_health(url, 60):
                print(f"   ✅ {name} is ready!")
            else:
                print(f"   ❌ {name} failed to start")
                return False

        return True

    def open_dashboard(self):
        """Open the dashboard in browser"""
        dashboard_path = self.project_root / "dfs_ultimate_optimizer_with_live_data.html"
        dashboard_url = f"file://{dashboard_path.absolute()}"

        print(f"\n🌐 Opening dashboard: {dashboard_url}")
        webbrowser.open(dashboard_url)

    def cleanup(self):
        """Clean up all running processes"""
        print("\n🧹 Cleaning up services...")
        for process, name in self.processes:
            try:
                if os.name == 'nt':
                    process.terminate()
                else:
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                print(f"   ✅ Stopped {name}")
            except:
                print(f"   ⚠️  Could not stop {name}")

    async def run(self):
        """Main launcher routine"""
        print("🎯 DFS Ultimate Optimizer - One-Click Launcher")
        print("=" * 50)

        try:
            # Start DraftKings API Server
            self.start_service(
                "python draftkings_api_server.py",
                "DraftKings API Server"
            )

            # Start FastAPI Optimizer
            self.start_service(
                "python live_optimizer_api.py",
                "FastAPI Optimizer"
            )

            # Wait for services to be ready
            if not await self.wait_for_services():
                print("❌ Some services failed to start. Check the logs above.")
                self.cleanup()
                return

            print("\n🎉 All services started successfully!")
            print("\n📊 Service Status:")
            print("   • DraftKings API: http://localhost:8765")
            print("   • FastAPI Optimizer: http://localhost:8000")
            print("   • Dashboard: Opening in browser...")

            # Open dashboard
            time.sleep(2)  # Brief pause before opening browser
            self.open_dashboard()

            print("\n✅ DFS Ultimate Optimizer is now running!")
            print("   Press Ctrl+C to stop all services")

            # Keep running until interrupted
            while True:
                await asyncio.sleep(1)

        except KeyboardInterrupt:
            print("\n⏹️  Shutdown requested by user")
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
        finally:
            self.cleanup()
            print("\n👋 All services stopped. Goodbye!")

if __name__ == "__main__":
    # Check if we're in the right directory
    if not Path("draftkings_api_server.py").exists():
        print("❌ Error: Please run this script from the dfs-system-2 directory")
        sys.exit(1)

    # Run the launcher
    launcher = DFSLauncher()
    try:
        asyncio.run(launcher.run())
    except KeyboardInterrupt:
        launcher.cleanup()
        print("\n👋 Shutdown complete!")
