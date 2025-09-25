# Claude Code Troubleshooting Guide

## FIXING YOUR CLAUDE CODE ISSUES

You're seeing these errors:

```
◯ Missing API key · Run /login
✗ Auto-update failed · Try claude doctor or npm i -g @anthropic-ai/claude-code
```

## SOLUTION STEPS

### Step 1: Fix Claude Code Installation

```bash
# Update/reinstall Claude Code CLI
npm i -g @anthropic-ai/claude-code

# Or if you prefer, uninstall and reinstall
npm uninstall -g @anthropic-ai/claude-code
npm i -g @anthropic-ai/claude-code
```

### Step 2: Fix API Key Issue

```bash
# Login to Claude Code
claude login

# This will open browser for authentication
# Or manually set API key
export ANTHROPIC_API_KEY="your-api-key-here"
```

### Step 3: Run Diagnostics

```bash
# Check Claude Code health
claude doctor

# Verify installation
claude --version
```

### Step 4: Alternative Setup (if issues persist)

```bash
# Clear cache and reinstall
rm -rf ~/.claude
npm cache clean --force
npm i -g @anthropic-ai/claude-code
claude login
```

## COMPLETE SETUP SCRIPT

I can create a script to fix all these issues:

```bash
#!/bin/bash
# fix-claude-code.sh

echo "🔧 Fixing Claude Code setup..."

# Update Node.js (if needed)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Clear old installation
echo "Cleaning up old installation..."
npm uninstall -g @anthropic-ai/claude-code 2>/dev/null
rm -rf ~/.claude 2>/dev/null

# Fresh install
echo "Installing Claude Code CLI..."
npm i -g @anthropic-ai/claude-code

# Verify installation
echo "Verifying installation..."
claude --version

# Setup authentication
echo "Setting up authentication..."
echo "Please run: claude login"
echo "This will open your browser for authentication"

echo "✅ Claude Code setup complete!"
echo "Next steps:"
echo "1. Run: claude login"
echo "2. Test: claude doctor"
echo "3. Load your agent factory setup"
```

## USING YOUR AGENT FACTORY SETUP

Once Claude Code is working:

### Step 1: Create Agent Factory Project

```bash
# Create new directory for agent factory
mkdir claude-agent-factory
cd claude-agent-factory

# Copy your agent setup
cp CLAUDE_CODE_AGENT_FACTORY_SETUP.md ./agent.md
```

### Step 2: Set up the Agent Factory Structure

```bash
# Create directory structure
mkdir -p config prompts src

# Create config/subagents.yaml (from your agent.md file)
# Create prompts/router.prompt.md (from your agent.md file)
# Create src/factory.ts or src/factory.py (from your agent.md file)
```

### Step 3: Install Dependencies

```bash
# TypeScript version
npm i anthropic yaml tsx

# Python version
pip install anthropic pyyaml
```

### Step 4: Test Agent Factory

```bash
# TypeScript
npx tsx src/factory.ts "/use automation-agent: Set up ESLint and Prettier"

# Python
python src/factory.py "/use dfs-optimizer: Create lineup optimizer"
```

## TROUBLESHOOTING COMMON ISSUES

### Issue: "command not found: claude"

**Solution:**

```bash
# Add npm global bin to PATH
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Issue: "Permission denied"

**Solution:**

```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

### Issue: "API key invalid"

**Solution:**

```bash
# Clear credentials and re-login
rm -rf ~/.claude
claude login
```

### Issue: "Network/proxy errors"

**Solution:**

```bash
# Configure proxy (if needed)
npm config set proxy http://your-proxy:port
npm config set https-proxy http://your-proxy:port
```

## VERIFICATION COMMANDS

After fixing, run these to verify everything works:

```bash
# Check Claude Code
claude --version
claude doctor

# Test API connection
claude chat --message "Hello, test message"

# Verify agent factory works
cd claude-agent-factory
npx tsx src/factory.ts "/use orchestrator: test message"
```

## NEXT STEPS

1. **Fix Claude Code**: Run the troubleshooting steps above
2. **Set up Agent Factory**: Use your `CLAUDE_CODE_AGENT_FACTORY_SETUP.md` file
3. **Test Agents**: Try the `/use` commands
4. **Load into Claude Code UI**: Copy the agent.md content into Claude Code interface

## READY-TO-RUN FIX SCRIPT

I'll create the complete fix script for you to run immediately.
