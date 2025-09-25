#!/bin/bash

# Configure Claude Code for Bedrock with AWS Profile 245094849546
echo "🔧 Configuring Claude Code for Amazon Bedrock..."

# Set the AWS profile
export AWS_PROFILE=245094849546
echo "✅ AWS Profile set to: $AWS_PROFILE"

# Add profile to shell configuration for persistence
echo "📝 Adding AWS profile to shell configuration..."
echo 'export AWS_PROFILE=245094849546' >> ~/.bashrc
echo 'export AWS_PROFILE=245094849546' >> ~/.zshrc

# Create Claude Code configuration directory
echo "📁 Creating Claude Code configuration..."
mkdir -p ~/.claude

# Configure Claude Code for Bedrock
cat > ~/.claude/config.json << 'EOF'
{
  "apiProvider": "bedrock",
  "awsRegion": "us-west-2",
  "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "maxTokens": 8192,
  "temperature": 0.1,
  "awsProfile": "245094849546"
}
EOF

echo "✅ Claude Code configuration file created at ~/.claude/config.json"

# Set environment variables for this session
export ANTHROPIC_API_BASE="https://bedrock-runtime.us-west-2.amazonaws.com"
export ANTHROPIC_API_KEY="bedrock"
export AWS_REGION="us-west-2"

# Add to shell configuration for future sessions
echo 'export ANTHROPIC_API_BASE="https://bedrock-runtime.us-west-2.amazonaws.com"' >> ~/.bashrc
echo 'export ANTHROPIC_API_KEY="bedrock"' >> ~/.bashrc
echo 'export AWS_REGION="us-west-2"' >> ~/.bashrc

echo 'export ANTHROPIC_API_BASE="https://bedrock-runtime.us-west-2.amazonaws.com"' >> ~/.zshrc
echo 'export ANTHROPIC_API_KEY="bedrock"' >> ~/.zshrc
echo 'export AWS_REGION="us-west-2"' >> ~/.zshrc

echo ""
echo "🎉 Claude Code configured for Amazon Bedrock!"
echo ""
echo "Configuration:"
echo "  AWS Profile: 245094849546"
echo "  Region: us-west-2"  
echo "  Model: claude-3-5-sonnet-20241022"
echo "  API Base: bedrock-runtime.us-west-2.amazonaws.com"
echo ""
echo "Next steps:"
echo "1. Restart your terminal (or run: source ~/.bashrc)"
echo "2. Test with: aws sts get-caller-identity"
echo "3. Test Claude Code: claude chat --message 'Hello from Bedrock'"
echo ""
echo "Your Claude Code is now configured to use AWS Bedrock instead of Anthropic's direct API!"
