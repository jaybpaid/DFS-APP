#!/bin/bash

echo "🧪 Testing Claude Code with Amazon Bedrock..."

# Set environment variables for Bedrock
export AWS_PROFILE=245094849546
export AWS_REGION=us-west-2
export ANTHROPIC_API_BASE="https://bedrock-runtime.us-west-2.amazonaws.com"
export ANTHROPIC_API_KEY="bedrock"

echo "✅ Environment variables set:"
echo "   AWS_PROFILE: $AWS_PROFILE"
echo "   AWS_REGION: $AWS_REGION"
echo "   ANTHROPIC_API_BASE: $ANTHROPIC_API_BASE"
echo "   ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY"

echo ""
echo "🔧 Testing Claude CLI with Bedrock..."

# Test Claude with a simple prompt
claude --print "Hello from Claude on Amazon Bedrock! Please respond with 'Bedrock connection successful' if you can read this."

echo ""
echo "✅ Test completed!"
