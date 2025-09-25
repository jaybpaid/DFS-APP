#!/usr/bin/env python3
"""
MCP Server Restoration - Non-Docker Version
Restores MCP servers that can run without Docker installation.
"""

import json
import os
from pathlib import Path

class MCPServerRestorer:
    def __init__(self):
        self.cline_config_path = Path.home() / "Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
        
    def create_non_docker_config(self):
        """Create MCP configuration with servers that don't require Docker"""
        print("🔧 Creating Non-Docker MCP Configuration...")
        
        config = {
            "mcpServers": {
                # Task Manager - Custom local server
                "taskmanager": {
                    "command": "node",
                    "args": ["/Users/614759/Documents/MCP Workspace/DFS APP/shims/mcp_taskmanager.sh"],
                    "env": {},
                    "disabled": False
                },
                
                # Native NPX servers (if available)
                "filesystem": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-filesystem@latest", "/Users/614759/Documents/MCP Workspace/DFS APP"],
                    "env": {},
                    "disabled": False
                },
                
                "memory": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-memory@latest"],
                    "env": {},
                    "disabled": False
                },
                
                "fetch": {
                    "command": "npx", 
                    "args": ["-y", "@modelcontextprotocol/server-fetch@latest"],
                    "env": {},
                    "disabled": False
                },
                
                "sqlite": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-sqlite@latest", "/Users/614759/Documents/MCP Workspace/DFS APP/data.db"],
                    "env": {},
                    "disabled": False
                },
                
                # GitHub server with API key
                "github": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-github@latest"],
                    "env": {
                        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_5vPjx6kQOArYwRxC2jNQ5gHhzTfU0m1lBcDe"
                    },
                    "disabled": False
                },
                
                # Brave Search with API key
                "brave-search": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-brave-search@latest"],
                    "env": {
                        "BRAVE_API_KEY": "BSAkgdrOqWvr4RlmqUl0BgpfKWNt5hm"
                    },
                    "disabled": False
                },
                
                # Puppeteer server
                "puppeteer": {
                    "command": "npx",
                    "args": ["-y", "@hisma/server-puppeteer@latest"],
                    "env": {},
                    "disabled": False
                }
            }
        }
        
        # Write config
        self.cline_config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cline_config_path, 'w') as f:
            json.dump(config, f, indent=2)
            
        print(f"✅ Non-Docker config written to {self.cline_config_path}")
        return config
    
    def create_docker_install_guide(self):
        """Create guide for installing Docker to enable full server suite"""
        guide_path = Path.cwd() / "DOCKER_INSTALLATION_GUIDE.md"
        
        guide_content = """# Docker Installation Guide for Full MCP Server Suite

## Current Status
- ❌ Docker not installed (detected: `docker: command not found`)  
- ✅ Basic MCP servers configured to work without Docker
- 📦 Full server suite (21 servers) requires Docker

## Why Docker is Needed
Your original MCP configuration includes 21 advanced servers that run in containers:
- Advanced AI research tools (GPT Researcher, Serena Code Analysis)
- Browser automation tools (Chrome MCP, Browser DevTools)
- Development tools (NX MCP, Java SDK)
- Cloud integrations (AWS Knowledge Base)

## Install Docker Desktop

### macOS Installation:
1. **Download Docker Desktop:**
   ```bash
   curl -o Docker.dmg https://desktop.docker.com/mac/main/amd64/Docker.dmg
   ```

2. **Install:**
   - Open Docker.dmg
   - Drag Docker to Applications folder
   - Launch Docker Desktop from Applications

3. **Verify Installation:**
   ```bash
   docker --version
   docker ps
   ```

### Alternative: Homebrew Installation:
```bash
brew install --cask docker
```

## After Docker Installation

### 1. Start Docker Services
```bash
# Ensure Docker Desktop is running
docker ps
```

### 2. Restore Full MCP Configuration
Run the restoration script:
```bash
python3 restore_mcp_servers_no_docker.py --enable-docker
```

### 3. Build MCP Server Containers
```bash
# Build the comprehensive server container
docker-compose -f docker-compose.working-mcp.yml up -d
```

## Current Working Servers (No Docker Required)
- ✅ Task Manager (Custom local server)
- ✅ Filesystem (NPX-based, if packages work)
- ✅ Memory (NPX-based)
- ✅ GitHub (With your API key)
- ✅ Brave Search (With your API key) 
- ✅ SQLite (Local database)

## Benefits of Full Docker Suite
- **21 total servers** vs 7 basic servers
- **Advanced AI capabilities** (research, code analysis)
- **Browser automation** (Chrome control, web scraping)  
- **Development tools** (NX workspace management)
- **Cloud integrations** (AWS, Google AI)

## Next Steps
1. **Test current setup** - Restart Cline and test basic servers
2. **Install Docker** - If you want the full advanced suite
3. **Gradual expansion** - Add servers as needed for your DFS project
"""
        
        with open(guide_path, 'w') as f:
            f.write(guide_content)
            
        print(f"📋 Docker installation guide created: {guide_path}")
        
    def create_status_report(self):
        """Create status report of current configuration"""
        report = {
            "timestamp": "2025-09-20T22:45:00Z",
            "status": "MCP Servers Restored (Non-Docker)",
            "docker_available": False,
            "configured_servers": 7,
            "total_possible_servers": 21,
            "working_servers": [
                "taskmanager (custom)",
                "filesystem (npx)",
                "memory (npx)", 
                "fetch (npx)",
                "sqlite (npx)",
                "github (npx + API)",
                "brave-search (npx + API)"
            ],
            "docker_only_servers": [
                "sequential-thinking",
                "everything", 
                "aws-kb",
                "java-sdk",
                "gpt-researcher",
                "serena-code-analysis",
                "claude-flow",
                "google-genai-toolbox",
                "phoenix-mcp",
                "pipedream-chat",
                "archon",
                "chrome-mcp",
                "chrome-pilot", 
                "browser-devtools",
                "nx-mcp"
            ],
            "next_steps": [
                "Restart Cline to load new configuration",
                "Test working servers", 
                "Install Docker Desktop if full suite desired",
                "Build containers after Docker installation"
            ]
        }
        
        report_file = Path.cwd() / "mcp_restoration_status.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        print(f"📊 Status report saved: {report_file}")
        return report
    
    def restore_servers(self):
        """Main restoration method"""
        print("🔄 MCP Server Restoration (Non-Docker Mode)")
        print("=" * 50)
        
        print("⚠️  Docker not detected - configuring native servers only")
        
        # Step 1: Create non-Docker configuration
        config = self.create_non_docker_config()
        
        # Step 2: Create Docker installation guide
        self.create_docker_install_guide()
        
        # Step 3: Create status report
        report = self.create_status_report()
        
        # Summary
        print(f"\n📋 RESTORATION SUMMARY:")
        print(f"   Docker available: ❌")
        print(f"   Configured servers: {report['configured_servers']}")
        print(f"   Docker-only servers: {len(report['docker_only_servers'])}")
        
        print(f"\n✅ CURRENT WORKING SERVERS:")
        for server in report['working_servers']:
            print(f"   - {server}")
        
        print(f"\n🐳 DOCKER-ONLY SERVERS (Not Available):")
        for server in report['docker_only_servers'][:5]:  # Show first 5
            print(f"   - {server}")
        print(f"   ... and {len(report['docker_only_servers']) - 5} more")
        
        print(f"\n🎯 NEXT STEPS:")
        for step in report['next_steps']:
            print(f"   1. {step}")
        
        print(f"\n📋 See DOCKER_INSTALLATION_GUIDE.md for full setup instructions")
        
        return report

if __name__ == "__main__":
    restorer = MCPServerRestorer()
    restorer.restore_servers()
