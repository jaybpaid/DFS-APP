# DFS Optimizer Development Commands
# Battle-ready DFS optimizer with sim-first workflow

.PHONY: help mcp-health dev demo test clean install

# Default target
help:
	@echo "DFS Optimizer - Available Commands:"
	@echo ""
	@echo "  make mcp-health    - Check MCP server health"
	@echo "  make install       - Install dependencies"
	@echo "  make dev          - Start development servers"
	@echo "  make demo         - Run end-to-end demo"
	@echo "  make test         - Run all tests"
	@echo "  make clean        - Clean build artifacts"
	@echo ""

# MCP Health Check
mcp-health:
	@echo "🔍 Checking MCP server health..."
	@cd .. && ./scripts/healthcheck_mcp.sh

# Install Dependencies
install:
	@echo "📦 Installing dependencies..."
	@pip install -r ../requirements.txt
	@pip install numpy pandas scipy pulp asyncio
	@echo "✅ Dependencies installed"

# Development Environment
dev:
	@echo "🚀 Starting development environment..."
	@echo "Starting API server..."
	@cd .. && python live_optimizer_api.py &
	@echo "API server started on http://localhost:8000"
	@echo "Opening dashboard..."
	@open ../dfs_ultimate_optimizer_with_live_data.html
	@echo "✅ Development environment ready"

# Demo Workflow
demo:
	@echo "🎯 Running end-to-end demo..."
	@echo "Testing simulation engine..."
	@cd services/sim && python model.py
	@echo "Testing optimizer..."
	@cd services/sim && python optimizer.py
	@echo "Testing CSV manager..."
	@cd services/ingest && python csv_manager.py
	@echo "✅ Demo complete - all systems operational"
	@echo "__CLINE_DONE__ DEMO"

# Test Suite
test:
	@echo "🧪 Running test suite..."
	@python -m pytest tests/ -v
	@echo "✅ Tests complete"

# Clean Build Artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name "__pycache__" -delete
	@find . -type d -name "*.egg-info" -exec rm -rf {} +
	@echo "✅ Clean complete"

# Quick Setup
setup: install mcp-health
	@echo "✅ Setup complete - ready for development"

# Production Build
build:
	@echo "🏗️  Building for production..."
	@echo "Building web app..."
	@cd apps/web && npm run build
	@echo "Building services..."
	@cd services && python -m compileall .
	@echo "✅ Build complete"

# Health Check All Services
health:
	@echo "🏥 Checking all service health..."
	@make mcp-health
	@curl -f http://localhost:8000/health || echo "❌ API server not running"
	@echo "✅ Health check complete"
