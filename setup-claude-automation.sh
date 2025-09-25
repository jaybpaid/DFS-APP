#!/bin/bash

# Claude Automation Setup Script for DFS Project
# This script sets up complete build automation using Cline

echo "🚀 Setting up Claude Automation for DFS Project..."

# Install core automation tools
echo "📦 Installing automation dependencies..."
npm install -g prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pip install black pylint pytest httpx

# Install additional testing tools
echo "🧪 Installing testing tools..."
npm install -g cypress @playwright/test lighthouse-ci

# Setup pre-commit hooks (optional but recommended)
echo "🪝 Setting up pre-commit hooks..."
pip install pre-commit
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
  
  - repo: https://github.com/psf/black
    rev: 23.7.0
    hooks:
      - id: black
        files: ^apps/api-python/.*\.py$
        
  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.0.0
    hooks:
      - id: prettier
        files: ^apps/web/.*\.(ts|tsx|js|jsx|json|css)$
EOF

# Initialize pre-commit
pre-commit install

echo "✅ Claude Automation Setup Complete!"
echo ""
echo "🎯 Available Claude Automation Commands:"
echo "  pnpm run claude:quality   # Format & lint all code"
echo "  pnpm run claude:build     # Build all services"
echo "  pnpm run claude:test      # Run all tests"
echo "  pnpm run claude:deploy    # Deploy to production"
echo "  pnpm run claude:automate  # Run full automation pipeline"
echo "  pnpm run claude:health    # Check service health"
echo ""
echo "🤖 GitHub Actions automation will trigger on:"
echo "  - Push to main/develop branches"
echo "  - Pull requests to main"
echo ""
echo "💡 You can now ask Cline to:"
echo "  'Run the automation pipeline'"
echo "  'Fix all code quality issues'"
echo "  'Deploy to production'"
echo "  'Generate missing tests'"
