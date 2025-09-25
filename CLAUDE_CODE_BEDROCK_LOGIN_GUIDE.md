# How to Login to Claude Code with Amazon Bedrock

## Overview

Claude Code CLI typically uses Anthropic's direct API, but you can configure it to use **Amazon Bedrock** for enterprise security, cost control, and AWS integration.

## STEP-BY-STEP BEDROCK LOGIN SETUP

### Step 1: AWS Account & Bedrock Setup

```bash
# 1. Install AWS CLI (if not already installed)
brew install awscli  # macOS
# or
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# 2. Configure AWS credentials
aws configure
# Enter: AWS Access Key ID
# Enter: AWS Secret Access Key
# Enter: Region (us-east-1 or us-west-2 recommended)
# Enter: Output format (json)
```

### Step 2: Enable Bedrock Model Access

```bash
# Go to AWS Bedrock Console
open https://console.aws.amazon.com/bedrock/home

# Navigate to: Model Access > Manage Model Access
# Request access to Claude models:
# - Claude 3.5 Sonnet
# - Claude 3.5 Haiku
# - Claude 3 Opus
```

### Step 3: Verify Bedrock Access

```bash
# Test Bedrock connection
aws bedrock list-foundation-models --region us-east-1

# Should show Claude models if access is granted
aws bedrock invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --body '{"messages":[{"role":"user","content":"test"}],"max_tokens":10}' \
  --region us-east-1 \
  /tmp/response.json
```

### Step 4: Configure Claude Code for Bedrock

**Option A: Environment Variables**

```bash
# Set Bedrock configuration
export ANTHROPIC_API_BASE="https://bedrock-runtime.us-east-1.amazonaws.com"
export ANTHROPIC_API_KEY="bedrock"  # Special value for Bedrock
export AWS_REGION="us-east-1"
export CLAUDE_MODEL="anthropic.claude-3-5-sonnet-20241022-v2:0"

# Add to your shell profile
echo 'export ANTHROPIC_API_BASE="https://bedrock-runtime.us-east-1.amazonaws.com"' >> ~/.bashrc
echo 'export ANTHROPIC_API_KEY="bedrock"' >> ~/.bashrc
echo 'export AWS_REGION="us-east-1"' >> ~/.bashrc
```

**Option B: Claude Code Configuration File**

```bash
# Create Claude Code config directory
mkdir -p ~/.claude

# Create Bedrock configuration
cat > ~/.claude/config.json << 'EOF'
{
  "apiProvider": "bedrock",
  "awsRegion": "us-east-1",
  "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "maxTokens": 8192,
  "temperature": 0.1,
  "awsProfile": "default"
}
EOF
```

### Step 5: Test Bedrock Login

```bash
# Test Claude Code with Bedrock
claude auth status

# If not working, try manual configuration
claude config set provider bedrock
claude config set region us-east-1
claude config set model anthropic.claude-3-5-sonnet-20241022-v2:0

# Test with a simple chat
claude chat --message "Hello from Bedrock"
```

## BEDROCK-SPECIFIC CLAUDE CODE COMMANDS

### Authentication Commands

```bash
# Configure for Bedrock
claude config set provider bedrock
claude config set region us-east-1
claude config set aws-profile default

# Verify configuration
claude config show

# Test connection
claude auth test
```

### Model Selection

```bash
# Set specific Claude model on Bedrock
claude config set model anthropic.claude-3-5-sonnet-20241022-v2:0   # Best for coding
claude config set model anthropic.claude-3-5-haiku-20241022-v1:0    # Fastest/cheapest
claude config set model anthropic.claude-3-opus-20240229-v1:0       # Most capable
```

## COMPLETE BEDROCK LOGIN SCRIPT

```bash
#!/bin/bash
# claude-bedrock-login.sh

echo "🔐 Setting up Claude Code with Amazon Bedrock..."

# Check AWS CLI installation
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install: brew install awscli"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run: aws configure"
    exit 1
fi

echo "✅ AWS credentials verified"

# Check Bedrock model access
if aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `claude`)]' | grep -q "claude"; then
    echo "✅ Bedrock Claude models accessible"
else
    echo "⚠️  No Claude models found. Request access at:"
    echo "https://console.aws.amazon.com/bedrock/home#/modelaccess"
fi

# Configure Claude Code for Bedrock
echo "🔧 Configuring Claude Code for Bedrock..."

# Set environment variables
export ANTHROPIC_API_BASE="https://bedrock-runtime.us-east-1.amazonaws.com"
export ANTHROPIC_API_KEY="bedrock"
export AWS_REGION="us-east-1"

# Configure Claude Code
claude config set provider bedrock 2>/dev/null || true
claude config set region us-east-1 2>/dev/null || true
claude config set model anthropic.claude-3-5-sonnet-20241022-v2:0 2>/dev/null || true

# Create config file
mkdir -p ~/.claude
cat > ~/.claude/config.json << 'EOF'
{
  "apiProvider": "bedrock",
  "awsRegion": "us-east-1",
  "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "maxTokens": 8192,
  "temperature": 0.1,
  "awsProfile": "default"
}
EOF

# Test configuration
echo "🧪 Testing Bedrock connection..."
if claude auth test 2>/dev/null; then
    echo "✅ Claude Code + Bedrock setup successful!"
else
    echo "⚠️  Manual testing required. Try: claude chat --message 'test'"
fi

echo ""
echo "🎉 Setup complete! Claude Code is now using Amazon Bedrock"
echo ""
echo "Available commands:"
echo "  claude chat --message 'Hello from Bedrock'"
echo "  claude config show"
echo "  claude auth status"
echo ""
echo "Benefits:"
echo "✅ Enterprise security (AWS IAM)"
echo "✅ Cost control (AWS billing)"
echo "✅ Compliance (SOC2, HIPAA)"
echo "✅ Regional data control"
```

## BEDROCK VS ANTHROPIC API COMPARISON

| Feature                 | Anthropic Direct  | Amazon Bedrock       |
| ----------------------- | ----------------- | -------------------- |
| **Authentication**      | `claude login`    | AWS credentials      |
| **Security**            | Standard HTTPS    | AWS IAM + VPC        |
| **Billing**             | Anthropic billing | AWS billing          |
| **Compliance**          | Basic             | SOC2, HIPAA, GDPR    |
| **Regional Control**    | Global            | AWS regions          |
| **Enterprise Features** | Limited           | Full AWS integration |

## TROUBLESHOOTING BEDROCK LOGIN

### Issue: "Invalid credentials"

```bash
# Check AWS credentials
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

### Issue: "Model access denied"

```bash
# Request model access in AWS Console
open https://console.aws.amazon.com/bedrock/home#/modelaccess

# Or check current access
aws bedrock list-foundation-models --region us-east-1
```

### Issue: "Region not supported"

```bash
# Use supported Bedrock regions
export AWS_REGION="us-east-1"  # Primary
# or us-west-2, eu-west-1, ap-southeast-1
```

### Issue: "Claude Code not recognizing Bedrock"

```bash
# Force Bedrock configuration
claude config set provider bedrock --force
claude config set region us-east-1 --force

# Or use environment variables
export ANTHROPIC_API_BASE="https://bedrock-runtime.us-east-1.amazonaws.com"
export ANTHROPIC_API_KEY="bedrock"
```

## BEDROCK COST OPTIMIZATION

### Monitor Usage

```bash
# Check Bedrock costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Set up cost alerts
aws budgets create-budget --account-id YOUR_ACCOUNT_ID --budget file://bedrock-budget.json
```

### Budget Configuration

```json
{
  "BudgetName": "Claude-Bedrock-Monthly",
  "BudgetLimit": {
    "Amount": "50.00",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {
    "Service": ["Amazon Bedrock"]
  }
}
```

## USING YOUR AGENT FACTORY WITH BEDROCK

Once Bedrock is configured, your agent factory setup works the same:

```bash
# Your automation agents will now use Bedrock
/use automation-agent: Set up ESLint, Prettier, Jest for this DFS project

# DFS-specific agents with enterprise Bedrock backend
/use dfs-optimizer: Create salary cap optimizer using Bedrock Claude

# Professional dashboard with Bedrock
/use react-dashboard: Build DFS dashboard with enterprise security
```

## BENEFITS FOR YOUR DFS PROJECT

✅ **Enterprise Security** - AWS IAM controls  
✅ **Cost Monitoring** - AWS cost management  
✅ **Compliance** - SOC2, HIPAA ready  
✅ **Performance** - AWS edge locations  
✅ **Integration** - Works with your existing AWS infrastructure  
✅ **Same Agent Factory** - All your automation agents work unchanged

Run the script above to configure Claude Code for Bedrock!
