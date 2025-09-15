#!/usr/bin/env python3
"""
LAUNCH SCRIPT - THE SOLVER + YOUR BACKEND INTEGRATION
Quick setup and launch of the integrated DFS optimizer system
"""

import subprocess
import sys
import os
from pathlib import Path

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing required dependencies...")
    
    dependencies = [
        'flask',
        'flask-cors', 
        'pandas',
        'requests',
        'pydfs-lineup-optimizer'
    ]
    
    for dep in dependencies:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', dep])
            print(f"✅ Installed {dep}")
        except subprocess.CalledProcessError:
            print(f"⚠️ Failed to install {dep}")

def check_backend_engines():
    """Check if your backend engines are available"""
    print("🔍 Checking backend optimization engines...")
    
    required_files = [
        'dfs-system-2/pydfs_optimizer_implementation.py',
        'dfs-system-2/ai_enhanced_late_swap.py',
        'dfs-system-2/late_swap_analyzer.py',
        'dfs-system-2/draftkings_api_server.py'
    ]
    
    available = []
    missing = []
    
    for file in required_files:
        if Path(file).exists():
            available.append(file)
            print(f"✅ Found {file}")
        else:
            missing.append(file)
            print(f"⚠️ Missing {file}")
    
    return len(available), len(missing)

def launch_integration_server():
    """Launch the integrated server"""
    print("🚀 Launching The Solver + Your Backend Integration...")
    
    try:
        # Start the integration server
        subprocess.run([sys.executable, 'solver_backend_integration_server.py'])
    except KeyboardInterrupt:
        print("\n⏹️ Server stopped by user")
    except Exception as e:
        print(f"❌ Error launching server: {e}")

def main():
    """Main setup and launch function"""
    print("=" * 60)
    print("🎯 THE SOLVER + YOUR BACKEND INTEGRATION SETUP")
    print("=" * 60)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        return
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}")
    
    # Install dependencies
    install_dependencies()
    
    # Check backend availability
    available, missing = check_backend_engines()
    print(f"\n📊 Backend Status: {available} engines available, {missing} missing")
    
    if missing > 0:
        print("⚠️ Some backend engines missing - will run in demo mode")
    else:
        print("✅ All backend engines available - full integration mode")
    
    print("\n🌐 Integration Features:")
    print("   • The Solver's professional interface design")
    print("   • Your pydfs optimization engines")
    print("   • AI-enhanced lineup generation") 
    print("   • Late swap analysis and optimization")
    print("   • Live data integration")
    print("   • Advanced simulation capabilities")
    print("   • CSV export with DraftKings formatting")
    
    print("\n🚀 Starting server...")
    print("📱 Access at: http://localhost:8000")
    print("📄 Interface: THE_SOLVER_INTEGRATED_OPTIMIZER.html")
    print("🔧 Backend: solver_backend_integration_server.py")
    
    # Launch the server
    launch_integration_server()

if __name__ == '__main__':
    main()
