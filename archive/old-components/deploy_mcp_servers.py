#!/usr/bin/env python3
"""
Deploy and validate MCP servers for DFS system
Checks status, builds containers, starts services, validates health
"""

import subprocess
import time
import json
import sys

def run_command(cmd, capture=True):
    """Run shell command and return output"""
    print(f"🔄 Running: {cmd}")
    try:
        if capture:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=300)
            if result.returncode != 0:
                print(f"❌ Command failed: {result.stderr}")
                return None
            return result.stdout.strip()
        else:
            result = subprocess.run(cmd, shell=True, timeout=300)
            return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"⏰ Command timed out: {cmd}")
        return None
    except Exception as e:
        print(f"💥 Command error: {e}")
        return None

def check_docker():
    """Check if Docker is running"""
    print("📋 Checking Docker status...")
    output = run_command("docker version --format '{{.Server.Version}}'")
    if output:
        print(f"✅ Docker Server: {output}")
        return True
    else:
        print("❌ Docker is not running or accessible")
        return False

def check_compose_file():
    """Validate docker-compose.yml exists"""
    import os
    if os.path.exists("docker-compose.yml"):
        print("✅ docker-compose.yml found")
        return True
    else:
        print("❌ docker-compose.yml not found")
        return False

def get_container_status():
    """Check current container status"""
    print("📋 Checking container status...")
    output = run_command("docker compose ps --format json")
    if output:
        try:
            containers = json.loads(output) if output.startswith('[') else []
            print(f"📊 Found {len(containers)} containers")
            for container in containers:
                name = container.get('Name', 'unknown')
                status = container.get('State', 'unknown')
                print(f"  - {name}: {status}")
            return containers
        except:
            print("📊 No containers currently running")
            return []
    return []

def deploy_infrastructure():
    """Deploy Redis and PostgreSQL infrastructure"""
    print("🏗️ Deploying infrastructure (Redis + PostgreSQL)...")
    
    # Start infrastructure first
    success = run_command("docker compose up -d redis postgres", capture=False)
    if success:
        print("✅ Infrastructure deployment initiated")
        time.sleep(5)  # Give containers time to start
        return True
    else:
        print("❌ Infrastructure deployment failed")
        return False

def deploy_mcp_servers():
    """Deploy MCP server containers"""
    print("🛠️ Building MCP server containers...")
    
    # Try to build MCP containers  
    mcp_services = ["filesystem_mcp", "process_mcp", "sqlite_mcp", "memory_mcp"]
    
    for service in mcp_services:
        print(f"🔨 Building {service}...")
        success = run_command(f"docker compose build {service}", capture=False)
        if not success:
            print(f"❌ Failed to build {service}")
            return False
    
    print("🚀 Starting MCP servers...")
    success = run_command(f"docker compose up -d {' '.join(mcp_services)}", capture=False)
    if success:
        print("✅ MCP servers deployment initiated")
        time.sleep(10)  # Give containers time to start
        return True
    else:
        print("❌ MCP servers deployment failed")
        return False

def validate_deployment():
    """Validate all services are running"""
    print("✅ Validating deployment...")
    
    containers = get_container_status()
    expected_services = ["redis", "postgres", "filesystem_mcp", "process_mcp", "sqlite_mcp", "memory_mcp"]
    
    running_services = []
    for container in containers:
        service = container.get('Service', '')
        if service in expected_services and container.get('State') == 'running':
            running_services.append(service)
    
    print(f"📊 Running services: {len(running_services)}/{len(expected_services)}")
    for service in expected_services:
        status = "🟢 RUNNING" if service in running_services else "🔴 NOT RUNNING"
        print(f"  {service}: {status}")
    
    return len(running_services) == len(expected_services)

def main():
    """Main deployment orchestration"""
    print("🎯 DFS MCP Server Deployment Starting...")
    print("=" * 50)
    
    # Pre-flight checks
    if not check_docker():
        sys.exit(1)
    
    if not check_compose_file():
        sys.exit(1)
    
    # Current status
    get_container_status()
    
    # Deploy infrastructure
    if not deploy_infrastructure():
        print("💥 Infrastructure deployment failed")
        sys.exit(1)
    
    # Deploy MCP servers
    if not deploy_mcp_servers():
        print("💥 MCP server deployment failed")
        sys.exit(1)
    
    # Validate deployment
    if validate_deployment():
        print("🎉 All MCP servers deployed successfully!")
        print("\n📋 Final Status:")
        run_command("docker compose ps")
        
        print("\n🔗 STDIO Shims Available:")
        print("  ./shims/filesystem_mcp.sh")
        print("  ./shims/process_mcp.sh") 
        print("  ./shims/sqlite_mcp.sh")
        print("  ./shims/memory_mcp.sh")
        
        print("\n⚙️ Claude Desktop Config:")
        print("  claude_desktop_config_production.json")
        
    else:
        print("❌ Deployment validation failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
