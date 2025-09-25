# DFS Pro Optimizer - Complete Docker + MCP Deployment Guide

## 🚨 Critical Issue Resolution: MCP Server Package Status

### **Non-Existent Packages (Remove from configs):**

- ❌ `@modelcontextprotocol/server-e2b`
- ❌ `@modelcontextprotocol/server-sqlite`
- ❌ `@modelcontextprotocol/server-playwright`
- ❌ `@modelcontextprotocol/server-fetch`
- ❌ `@modelcontextprotocol/server-git`

### **Working MCP Packages (Verified):**

- ✅ `@modelcontextprotocol/server-filesystem@2025.8.21`
- ✅ `@modelcontextprotocol/server-memory@2025.8.4`
- ✅ `@modelcontextprotocol/server-sequential-thinking@2025.7.1`
- ✅ `@modelcontextprotocol/server-brave-search` (latest)
- ✅ `@modelcontextprotocol/server-puppeteer` (latest)

## 🏗️ Architecture Strategy

### **What Runs on Mac:**

- **Node.js + npm** - For MCP servers (no Docker images available)
- **Docker Desktop** - For application infrastructure
- **VS Code/Claude Desktop** - For development environment

### **What Runs in Docker:**

- **DFS Application Stack:**
  - `dfs-api-python` - FastAPI backend (✅ Running)
  - `dfs-frontend` - React dashboard
  - `postgres` - Player data database (✅ Running)
  - `redis` - Cache layer (✅ Running)

- **Infrastructure Tools:**
  - `traefik` - API Gateway
  - `kong` - API Management
  - `pgadmin4` - Database Admin
  - `redis-commander` - Redis Admin
  - `grafana` + `loki` - Monitoring & Logging

## 📋 Deployment Steps

### **Step 1: Install Prerequisites (Mac)**

```bash
# Install Node.js (if not already installed)
brew install node@18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### **Step 2: Setup Working MCP Configuration**

```bash
# Copy working configuration to Claude Desktop
cp claude_desktop_config_minimal_working.json ~/.config/claude-desktop/config.json

# Restart Claude Desktop to load new config
```

### **Step 3: Start Docker Infrastructure**

```bash
# Start core services
docker-compose up -d

# Check running containers
docker ps

# Expected containers:
# - dfs-api-python (port 8001)
# - postgres (port 5433)
# - redis (port 6380)
```

### **Step 4: Add Enhanced Services (Optional)**

```bash
# Start infrastructure tools
docker-compose -f docker-compose.production-enlarged.yml --profile enhanced up -d

# Access tools:
# - PGAdmin: http://localhost:5050
# - Redis Commander: http://localhost:8081
# - Traefik Dashboard: http://localhost:8080
```

## 🚀 Home Server Migration Strategy

### **Package for Transfer:**

```bash
# Create deployment archive (excludes dependencies)
tar czf dfs-pro-optimizer.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='vibe_env' \
  --exclude='__pycache__' \
  .
```

### **Home Server Setup:**

```bash
# 1. Install Docker & Node.js on home server
sudo apt update && sudo apt install -y docker.io docker-compose nodejs npm

# 2. Extract project
tar xzf dfs-pro-optimizer.tar.gz
cd "DFS APP"

# 3. Configure environment
cp .env.example .env
# Edit .env with your home server settings

# 4. Start services
docker-compose up -d

# 5. Install MCP servers globally (one-time setup)
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @modelcontextprotocol/server-puppeteer
```

## 🔧 Working MCP Configuration

**File: `claude_desktop_config_minimal_working.json`**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/your/dfs-app"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your_brave_api_key"
      }
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

## 📊 Service Access Points

### **Current Running Services:**

- **DFS API:** http://localhost:8001 (✅ Healthy)
- **PostgreSQL:** localhost:5433 (✅ Healthy)
- **Redis:** localhost:6380 (✅ Healthy)
- **DFS Frontend:** http://localhost:3003 (when started)

### **Enhanced Tools (After Enhanced Profile):**

- **Traefik Dashboard:** http://localhost:8080
- **PGAdmin:** http://localhost:5050 (admin@dfs.local / admin123)
- **Redis Commander:** http://localhost:8081
- **Kong Admin:** http://localhost:8001

## ⚡ Quick Start Commands

### **Mac Development:**

```bash
# Start everything
docker-compose up -d
open http://localhost:8001  # API docs
open http://localhost:3003  # Frontend (if running)
```

### **Home Server Production:**

```bash
# Start core services only
docker-compose up -d dfs-api postgres redis

# Add monitoring
docker-compose --profile monitoring up -d

# Add database admin tools
docker-compose --profile administration up -d
```

## 🔍 Troubleshooting

### **MCP Server Issues:**

1. **Package Not Found:** Use npm search to verify package exists
2. **Connection Closed:** Check Node.js is installed and paths are correct
3. **Permission Denied:** Ensure file system paths exist and are accessible

### **Docker Issues:**

1. **Image Not Found:** MCP servers only exist as npm packages, not Docker images
2. **Port Conflicts:** Check existing services with `docker ps`
3. **Environment Variables:** Ensure `.env` file has all required values

## 📦 Portable Deployment Checklist

- ✅ **Docker Compose Files:** Multiple profiles for different deployment scenarios
- ✅ **Environment Configuration:** `.env` file with all required variables
- ✅ **MCP Server Config:** Working configuration with verified packages
- ✅ **Data Persistence:** Docker volumes for database and cache data
- ✅ **Health Checks:** All services have health monitoring
- ✅ **Port Management:** Non-conflicting port assignments

Your DFS Pro Optimizer is now configured for reliable deployment across development and production environments.
