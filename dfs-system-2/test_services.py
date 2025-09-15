#!/usr/bin/env python3
"""
Test script to check if all DFS services can start properly
"""

import sys
import subprocess
import time
import signal
import os
from pathlib import Path

def test_import(module_name: str) -> bool:
    """Test if a module can be imported"""
    try:
        __import__(module_name)
        print(f"✅ {module_name} - OK")
        return True
    except ImportError as e:
        print(f"❌ {module_name} - FAILED: {e}")
        return False

def test_file_exists(filename: str) -> bool:
    """Test if a file exists"""
    if Path(filename).exists():
        print(f"✅ {filename} - EXISTS")
        return True
    else:
        print(f"❌ {filename} - NOT FOUND")
        return False

def test_service_start(command: str, name: str, timeout: int = 10) -> bool:
    """Test if a service can start"""
    print(f"\n🧪 Testing {name} startup...")

    try:
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # Wait a bit for startup
        time.sleep(timeout)

        if process.poll() is None:
            print(f"✅ {name} - STARTED (PID: {process.pid})")
            # Kill the test process
            if os.name == 'nt':
                process.terminate()
            else:
                try:
                    os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                except:
                    process.terminate()
            return True
        else:
            print(f"❌ {name} - FAILED TO START")
            # Print error output
            if process.stderr:
                error_output = process.stderr.read().decode('utf-8', errors='ignore')
                if error_output.strip():
                    print(f"   Error: {error_output[:300]}...")
            return False

    except Exception as e:
        print(f"❌ {name} - ERROR: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 DFS Ultimate Optimizer - Service Test Suite")
    print("=" * 50)

    all_passed = True

    # Test file existence
    print("\n📁 Checking file existence...")
    files_to_check = [
        "draftkings_api_server.py",
        "live_optimizer_api.py",
        "dfs_ultimate_optimizer_with_live_data.html",
        "launch_all.py",
        "requirements.txt"
    ]

    for filename in files_to_check:
        if not test_file_exists(filename):
            all_passed = False

    # Test imports
    print("\n📦 Checking Python imports...")
    modules_to_test = [
        "aiohttp",
        "fastapi",
        "uvicorn",
        "pandas",
        "numpy",
        "scipy",
        "ortools",
        "pydantic"
    ]

    for module in modules_to_test:
        if not test_import(module):
            all_passed = False

    # Test service startup (quick test)
    print("\n🚀 Testing service startup...")

    # Test DraftKings API server (quick test - should fail fast if imports are wrong)
    if not test_service_start("timeout 5 python draftkings_api_server.py 2>&1 | head -20", "DraftKings API Server", 3):
        all_passed = False

    # Test FastAPI optimizer (quick test)
    if not test_service_start("timeout 5 python live_optimizer_api.py 2>&1 | head -20", "FastAPI Optimizer", 3):
        all_passed = False

    # Summary
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 ALL TESTS PASSED! Ready to launch with: python launch_all.py")
    else:
        print("❌ SOME TESTS FAILED. Please fix the issues above before running launch_all.py")
        print("\n💡 Common fixes:")
        print("   • Install dependencies: pip install -r requirements.txt")
        print("   • Check Python path: python --version")
        print("   • Verify files are in correct directory")

    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
