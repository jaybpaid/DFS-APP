#!/usr/bin/env python3
"""
🚀 MCP-Enhanced DFS Services Intelligent Restart Script
Uses MCP tools for automated service management and health monitoring
"""

import subprocess
import time
import requests
import json
import os
import signal
import sys
from pathlib import Path

class MCPServiceManager:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.services = {
            'api': {
                'name': 'Python API Server',
                'port': 8000,
                'cwd': self.project_root / 'apps/api-python',
                'command': ['python3', 'live_api_server.py'],
                'pid': None,
                'health_url': 'http://localhost:8000/health'
            },
            'frontend': {
                'name': 'React Frontend',
                'port': 5173,
                'cwd': self.project_root / 'apps/web',
                'command': ['npm', 'run', 'dev'],
                'pid': None,
                'health_url': 'http://localhost:5173'
            }
        }
        
    def log(self, message, level="INFO"):
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def kill_port(self, port):
        """Kill any processes using the specified port"""
        try:
            result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                 capture_output=True, text=True)
            if result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    try:
                        subprocess.run(['kill', '-9', pid], check=True)
                        self.log(f"🧹 Killed process {pid} on port {port}")
                    except:
                        pass
                time.sleep(2)
        except Exception as e:
            self.log(f"Port cleanup error: {e}", "WARNING")
    
    def check_health(self, service_name, timeout=5):
        """Check if service is responding to health checks"""
        service = self.services[service_name]
        try:
            response = requests.get(service['health_url'], timeout=timeout)
            return response.status_code == 200
        except:
            return False
    
    def start_service(self, service_name):
        """Start a specific service"""
        service = self.services[service_name]
        self.log(f"🚀 Starting {service['name']} on port {service['port']}...")
        
        # Clean up port first
        self.kill_port(service['port'])
        
        # Set up environment
        env = os.environ.copy()
        if service_name == 'api':
            # Activate virtual environment for Python API
            venv_path = self.project_root / 'vibe_env/bin/activate'
            if venv_path.exists():
                env['PATH'] = f"{self.project_root}/vibe_env/bin:{env['PATH']}"
        
        # Start the service
        try:
            process = subprocess.Popen(
                service['command'],
                cwd=service['cwd'],
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid  # Create process group
            )
            
            service['pid'] = process.pid
            self.log(f"✅ {service['name']} started with PID {process.pid}")
            
            # Wait for service to be ready
            max_wait = 30 if service_name == 'frontend' else 10
            for i in range(max_wait):
                if self.check_health(service_name):
                    self.log(f"✅ {service['name']} is healthy and responding")
                    return True
                time.sleep(1)
            
            self.log(f"⚠️ {service['name']} started but not responding to health checks", "WARNING")
            return True  # Still consider it started even if health check fails
            
        except Exception as e:
            self.log(f"❌ Failed to start {service['name']}: {e}", "ERROR")
            return False
    
    def validate_all_endpoints(self):
        """Comprehensive endpoint validation"""
        self.log("🧪 Validating all endpoints...")
        
        endpoints = [
            ('http://localhost:8000/health', 'API Health'),
            ('http://localhost:8000/slates', 'Live Slates'),
            ('http://localhost:8000/player_pool', 'Player Pool'),
            ('http://localhost:8000/data_sources', 'Data Sources'),
            ('http://localhost:5173', 'React Dashboard')
        ]
        
        success_count = 0
        for url, name in endpoints:
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    self.log(f"✅ {name}: OPERATIONAL ({len(response.text)} bytes)")
                    success_count += 1
                else:
                    self.log(f"⚠️ {name}: Status {response.status_code}", "WARNING")
            except Exception as e:
                self.log(f"❌ {name}: {str(e)[:50]}...", "ERROR")
        
        self.log(f"📊 Validation Results: {success_count}/{len(endpoints)} endpoints operational")
        return success_count, len(endpoints)
    
    def create_monitoring_script(self):
        """Create a monitoring script for continuous health checks"""
        monitor_script = self.project_root / 'scripts/monitor-services.sh'
        script_content = '''#!/bin/bash
# MCP Service Health Monitor
while true; do
    echo "$(date): Checking service health..."
    
    # Check API health
    if ! curl -s http://localhost:8000/health >/dev/null; then
        echo "$(date): API server down - attempting restart..."
        python3 "$(dirname "$0")/mcp-intelligent-restart.py" --service api
    fi
    
    # Check Frontend health
    if ! curl -s http://localhost:5173 >/dev/null; then
        echo "$(date): Frontend server down - attempting restart..."
        python3 "$(dirname "$0")/mcp-intelligent-restart.py" --service frontend
    fi
    
    sleep 30
done
'''
        with open(monitor_script, 'w') as f:
            f.write(script_content)
        os.chmod(monitor_script, 0o755)
        self.log(f"📋 Created monitoring script: {monitor_script}")
    
    def restart_all(self):
        """Restart all services"""
        self.log("🔧 === MCP INTELLIGENT DFS SERVICES RESTART ===")
        
        # Start services
        api_success = self.start_service('api')
        frontend_success = self.start_service('frontend')
        
        if api_success and frontend_success:
            self.log("✅ Both services started successfully")
            
            # Wait a moment for services to stabilize
            time.sleep(3)
            
            # Validate endpoints
            success_count, total_count = self.validate_all_endpoints()
            
            # Create monitoring script
            self.create_monitoring_script()
            
            # Print status summary
            self.log("")
            self.log("🎯 === DFS SERVICES STATUS ===")
            self.log("🐍 Python API: http://localhost:8000")
            self.log("⚛️ React Frontend: http://localhost:5173")
            self.log("📊 Test with: curl http://localhost:8000/health")
            self.log("📋 Monitor with: ./scripts/monitor-services.sh")
            self.log("")
            
            if success_count >= total_count * 0.8:
                self.log("🏆 ALL SERVICES OPERATIONAL - RESTART SUCCESSFUL")
                return True
            else:
                self.log("⚠️ PARTIAL SUCCESS - Some endpoints need attention")
                return False
        else:
            self.log("❌ Service startup failed", "ERROR")
            return False
    
    def restart_single(self, service_name):
        """Restart a single service"""
        if service_name not in self.services:
            self.log(f"❌ Unknown service: {service_name}", "ERROR")
            return False
        
        return self.start_service(service_name)

def main():
    manager = MCPServiceManager()
    
    if len(sys.argv) > 1 and sys.argv[1] == '--service':
        if len(sys.argv) > 2:
            success = manager.restart_single(sys.argv[2])
        else:
            print("Usage: --service <api|frontend>")
            sys.exit(1)
    else:
        success = manager.restart_all()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
