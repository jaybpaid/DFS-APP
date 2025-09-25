#!/bin/bash

echo "🚀 Setting up Claude Code with Amazon Bedrock (Official AWS Guide)"
echo "================================================================="

# Step 1: Install Claude Code (official method)
echo "📦 Installing Claude Code..."
npm install -g @anthropic-ai/claude-code

# Step 2: Configure for Bedrock
echo "⚙️ Configuring environment variables for Bedrock..."

# Enable Bedrock
export CLAUDE_CODE_USE_BEDROCK=1

# Set AWS credentials (using your existing SSO profile)
export AWS_PROFILE=245094849546
export AWS_REGION=us-west-2

# Choose Claude Sonnet 4 (recommended - great balance of speed and capability)
export ANTHROPIC_MODEL='us.anthropic.claude-sonnet-4-20250514-v1:0'

# Set token limits to prevent throttling (from AWS guide)
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096
export MAX_THINKING_TOKENS=1024

# Disable prompt caching for Claude 4 (as per AWS guide)
export DISABLE_PROMPT_CACHING=1

echo "✅ Environment variables configured:"
echo "   CLAUDE_CODE_USE_BEDROCK: $CLAUDE_CODE_USE_BEDROCK"
echo "   AWS_PROFILE: $AWS_PROFILE"
echo "   AWS_REGION: $AWS_REGION"
echo "   ANTHROPIC_MODEL: $ANTHROPIC_MODEL"
echo "   CLAUDE_CODE_MAX_OUTPUT_TOKENS: $CLAUDE_CODE_MAX_OUTPUT_TOKENS"
echo "   MAX_THINKING_TOKENS: $MAX_THINKING_TOKENS"
echo "   DISABLE_PROMPT_CACHING: $DISABLE_PROMPT_CACHING"

# Step 3: Add to shell profile for persistence
echo ""
echo "📝 Adding to shell profile for persistence..."

# Detect shell and add to appropriate profile
if [[ $SHELL == *"zsh"* ]]; then
    PROFILE_FILE="$HOME/.zshrc"
elif [[ $SHELL == *"bash"* ]]; then
    PROFILE_FILE="$HOME/.bashrc"
else
    PROFILE_FILE="$HOME/.profile"
fi

echo "" >> $PROFILE_FILE
echo "# Claude Code + Amazon Bedrock Configuration" >> $PROFILE_FILE
echo "export CLAUDE_CODE_USE_BEDROCK=1" >> $PROFILE_FILE
echo "export AWS_PROFILE=245094849546" >> $PROFILE_FILE
echo "export AWS_REGION=us-west-2" >> $PROFILE_FILE
echo "export ANTHROPIC_MODEL='us.anthropic.claude-sonnet-4-20250514-v1:0'" >> $PROFILE_FILE
echo "export CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096" >> $PROFILE_FILE
echo "export MAX_THINKING_TOKENS=1024" >> $PROFILE_FILE
echo "export DISABLE_PROMPT_CACHING=1" >> $PROFILE_FILE

echo "✅ Added configuration to $PROFILE_FILE"

# Step 4: Test the setup
echo ""
echo "🧪 Testing Claude Code with Bedrock..."
echo "Note: You may need to request Bedrock model access if you get permission errors."

# Test with a simple command
claude --version

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart your terminal or run: source $PROFILE_FILE"
echo "2. Test with: claude"
echo "3. If you get permission errors, contact your AWS admin to enable:"
echo "   - Claude Sonnet 4 model access"
echo "   - Claude 3.5 Haiku model access (required for background tasks)"
echo "   - bedrock:InvokeModel permissions"
echo ""
echo "For troubleshooting, see: BEDROCK_TROUBLESHOOTING_SOLUTION.md"
