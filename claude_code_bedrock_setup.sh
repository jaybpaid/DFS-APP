#!/bin/bash
# Claude Code Amazon Bedrock Setup Script
# Configured for user's specific AWS settings with Sonnet 4

echo "🚀 Installing Claude Code for Amazon Bedrock with Claude 4 (Sonnet)"
echo "================================================================="

# Set user's specific AWS configuration
export AWS_PROFILE=245094849546
export AWS_REGION=us-west-2

# Set Claude 4 model configuration
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096
export MAX_THINKING_TOKENS=1024

# Step 1: Install Claude Code CLI
echo "📦 Installing Claude Code CLI..."
curl -fsSL https://claude.ai/install.sh | bash
# Alternative if first fails:
# npm install -g @anthropic/claude-code

# Step 2: Configure AWS SSO Profile
echo "🔐 Configuring AWS SSO Profile for account 245094849546..."
aws configure sso << EOF
245094849546
https://d-92674a2e91.awsapps.com/start
us-west-2
json
245094849546
BedrockDeveloperAccess
sso:account:access
EOF

# Step 3: Test AWS SSO Login
echo "🔑 Testing AWS SSO Login..."
aws sso login --profile 245094849546

# Step 4: Verify Bedrock Access
echo "🧪 Verifying Bedrock Model Access..."
aws bedrock list-foundation-models --region us-west-2 --profile 245094849546

# Step 5: Configure Claude Code for Bedrock
echo "⚙️ Configuring Claude Code for Bedrock..."

# Create Claude Code config directory
mkdir -p ~/.claude-code

# Create Bedrock configuration with user's settings
cat > ~/.claude-code/config.json << EOF
{
  "apiProvider": "bedrock",
  "awsProfile": "245094849546",
  "awsRegion": "us-west-2",
  "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "maxTokens": 4096,
  "maxThinkingTokens": 1024,
  "temperature": 0.1,
  "ssoSessionName": "245094849546",
  "ssoStartUrl": "https://d-92674a2e91.awsapps.com/start",
  "ssoAccountId": "245094849546",
  "ssoRole": "BedrockDeveloperAccess",
  "outputFormat": "json"
}
EOF

# Step 6: Set Environment Variables
echo "🌍 Setting Environment Variables..."
cat >> ~/.bashrc << EOF

# Claude Code Bedrock Configuration
export AWS_PROFILE=245094849546
export AWS_REGION=us-west-2
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=4096
export MAX_THINKING_TOKENS=1024
export ANTHROPIC_API_BASE="https://bedrock-runtime.us-west-2.amazonaws.com"
export ANTHROPIC_API_KEY="bedrock"

EOF

# Source the environment
source ~/.bashrc

# Step 7: Configure Claude Code CLI Commands
echo "🔧 Configuring Claude Code CLI..."
claude-code config set provider bedrock
claude-code config set region us-west-2
claude-code config set profile 245094849546
claude-code config set model anthropic.claude-3-5-sonnet-20241022-v2:0
claude-code config set max-tokens 4096
claude-code config set thinking-tokens 1024

# Step 8: Test Configuration
echo "🧪 Testing Claude Code + Bedrock Configuration..."
claude-code auth status
claude-code chat --message "Hello from Claude 4 on Amazon Bedrock!" --max-tokens 100

# Step 9: Verify Model Access
echo "🎯 Verifying Claude 4 Model Access..."
aws bedrock invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --body '{"messages":[{"role":"user","content":"Test Claude 4 on Bedrock"}],"max_tokens":50}' \
  --region us-west-2 \
  --profile 245094849546 \
  /tmp/claude-test-response.json

if [ $? -eq 0 ]; then
    echo "✅ Claude 4 (Sonnet) on Amazon Bedrock - SETUP COMPLETE!"
    echo ""
    echo "🎉 Ready to use Claude Code with:"
    echo "   • Model: Claude 3.5 Sonnet (Claude 4)"
    echo "   • Provider: Amazon Bedrock"
    echo "   • Account: 245094849546"
    echo "   • Region: us-west-2"
    echo "   • Max Tokens: 4096"
    echo "   • Thinking Tokens: 1024"
    echo ""
    echo "💡 Usage Examples:"
    echo "   claude-code generate --file app.js --prompt 'Create DFS optimizer'"
    echo "   claude-code refactor --file components/*.tsx"
    echo "   claude-code review --pull-request"
else
    echo "❌ Setup had issues. Check AWS credentials and Bedrock permissions."
fi

echo ""
echo "📋 Configuration Summary:"
echo "=========================="
cat ~/.claude-code/config.json
