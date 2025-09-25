#!/bin/bash

# Claude Code CLI Fix Script
echo "🔧 Fixing Claude Code CLI installation and authentication..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing Node.js..."
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install node
        else
            echo "Please install Node.js manually: https://nodejs.org/"
            exit 1
        fi
    # Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "Please install Node.js manually for your OS"
        exit 1
    fi
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Clear old Claude Code installation
echo "🧹 Cleaning up old Claude Code installation..."
npm uninstall -g @anthropic-ai/claude-code 2>/dev/null
rm -rf ~/.claude 2>/dev/null
npm cache clean --force

# Fresh install of Claude Code CLI
echo "📦 Installing Claude Code CLI..."
npm i -g @anthropic-ai/claude-code

# Fix npm permissions if needed (macOS/Linux)
if [[ "$OSTYPE" != "msys" ]]; then
    echo "🔒 Fixing npm permissions..."
    sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share} 2>/dev/null || true
fi

# Add npm global bin to PATH if not already there
NPM_BIN=$(npm config get prefix)/bin
if [[ ":$PATH:" != *":$NPM_BIN:"* ]]; then
    echo "🛤️  Adding npm bin to PATH..."
    echo "export PATH=\"$NPM_BIN:\$PATH\"" >> ~/.bashrc
    echo "export PATH=\"$NPM_BIN:\$PATH\"" >> ~/.zshrc
    export PATH="$NPM_BIN:$PATH"
fi

# Verify installation
echo "🔍 Verifying Claude Code installation..."
if command -v claude &> /dev/null; then
    echo "✅ Claude Code CLI installed successfully!"
    echo "Version: $(claude --version 2>/dev/null || echo 'Version check failed, but CLI is available')"
else
    echo "❌ Claude Code CLI not found in PATH"
    echo "Try running: source ~/.bashrc or source ~/.zshrc"
    echo "Or add this to your shell profile:"
    echo "export PATH=\"$NPM_BIN:\$PATH\""
    exit 1
fi

# Check API key status
echo "🔑 Checking API key status..."
if claude auth status 2>/dev/null | grep -q "authenticated"; then
    echo "✅ Already authenticated"
else
    echo "⚠️  Not authenticated. Please run: claude login"
    echo "This will open your browser for authentication."
fi

# Run diagnostics
echo "🏥 Running diagnostics..."
claude doctor 2>/dev/null || echo "⚠️  Run 'claude doctor' after authentication"

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. If not authenticated, run: claude login"
echo "2. Test with: claude doctor"
echo "3. Try: claude chat --message 'Hello world'"
echo "4. Load your agent factory setup from CLAUDE_CODE_AGENT_FACTORY_SETUP.md"
echo ""
echo "Your agent factory files are ready:"
echo "- CLAUDE_CODE_AGENT_FACTORY_SETUP.md (complete setup)"
echo "- agents.md (automation agents for your DFS project)"
echo "- AMAZON_BEDROCK_CLAUDE_SETUP_GUIDE.md (enterprise setup)"

# Make script executable
chmod +x fix-claude-code.sh
