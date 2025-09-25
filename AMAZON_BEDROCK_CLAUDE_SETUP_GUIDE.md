# Amazon Bedrock + Claude Code (Cline) Setup Guide

## What is Amazon Bedrock with Claude?

Amazon Bedrock provides Claude models through AWS infrastructure, offering:

- **Enterprise Security** - AWS IAM controls and VPC integration
- **Cost Management** - AWS billing and cost controls
- **Compliance** - SOC2, GDPR, HIPAA compliant
- **Regional Control** - Deploy in specific AWS regions
- **Lower Latency** - AWS edge locations

## Setting Up Bedrock with Cline

### Step 1: AWS Account Setup

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (us-east-1 or us-west-2 recommended)
# Enter output format: json
```

### Step 2: Enable Bedrock Claude Models

```bash
# Request access to Claude models in AWS Bedrock console
# Go to: https://console.aws.amazon.com/bedrock/home
# Navigate to: Model Access > Manage Model Access
# Request access to:
#   - Claude 3.5 Sonnet
#   - Claude 3.5 Haiku (for faster responses)
#   - Claude 3 Opus (for complex tasks)
```

### Step 3: Configure Cline for Bedrock

Open VSCode settings and configure Cline:

```json
{
  "cline.apiProvider": "bedrock",
  "cline.awsRegion": "us-east-1",
  "cline.bedrockModelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "cline.maxTokens": 8192,
  "cline.temperature": 0.1
}
```

Or create a Cline custom configuration:

```json
// ~/.cline/config.json
{
  "apiConfigurations": {
    "bedrock-claude-sonnet": {
      "apiProvider": "bedrock",
      "region": "us-east-1",
      "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
      "maxTokens": 8192,
      "temperature": 0.1
    },
    "bedrock-claude-haiku": {
      "apiProvider": "bedrock",
      "region": "us-east-1",
      "modelId": "anthropic.claude-3-5-haiku-20241022-v1:0",
      "maxTokens": 4096,
      "temperature": 0.1
    }
  },
  "defaultConfiguration": "bedrock-claude-sonnet"
}
```

### Step 4: Set AWS Environment Variables

```bash
# Add to your ~/.bashrc or ~/.zshrc
export AWS_PROFILE=default
export AWS_REGION=us-east-1
export CLINE_API_PROVIDER=bedrock
export CLINE_BEDROCK_MODEL_ID="anthropic.claude-3-5-sonnet-20241022-v2:0"
```

### Step 5: Test Bedrock Connection

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test Bedrock model access
aws bedrock list-foundation-models --region us-east-1

# Restart VSCode and test Cline
```

## Bedrock Claude Models Available

### Production Models

- **Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20241022-v2:0`)
  - Best for coding tasks
  - 200K context window
  - Highest intelligence

- **Claude 3.5 Haiku** (`anthropic.claude-3-5-haiku-20241022-v1:0`)
  - Fastest responses
  - 200K context window
  - Cost-effective

- **Claude 3 Opus** (`anthropic.claude-3-opus-20240229-v1:0`)
  - Most capable model
  - Complex reasoning
  - Highest cost

## Cost Optimization Strategies

### Token Usage Management

```json
{
  "cline.maxTokens": 4096, // Reduce for cost savings
  "cline.temperature": 0.1, // Lower = more deterministic
  "cline.streamingEnabled": true,
  "cline.contextWindow": "smart" // Only include relevant context
}
```

### Model Selection by Task

```javascript
// Configure different models for different tasks
const bedrockConfig = {
  coding: 'anthropic.claude-3-5-sonnet-20241022-v2:0', // Best for code
  'simple-tasks': 'anthropic.claude-3-5-haiku-20241022-v1:0', // Fastest/cheapest
  'complex-analysis': 'anthropic.claude-3-opus-20240229-v1:0', // Most capable
};
```

## Enterprise Bedrock Configuration

### IAM Permissions Setup

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:ListFoundationModels"
      ],
      "Resource": ["arn:aws:bedrock:*::foundation-model/anthropic.claude-*"]
    }
  ]
}
```

### VPC Configuration (Optional)

```yaml
# bedrock-vpc.yml
Resources:
  BedrockVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.bedrock-runtime'
      VpcEndpointType: Interface
      SubnetIds: [!Ref PrivateSubnet]
      SecurityGroupIds: [!Ref BedrockSecurityGroup]
```

## Bedrock + MCP Servers Integration

### Enhanced MCP Configuration

```json
{
  "mcpServers": {
    "bedrock-claude": {
      "command": "npx",
      "args": ["@anthropic-ai/bedrock-mcp-server"],
      "env": {
        "AWS_REGION": "us-east-1",
        "AWS_PROFILE": "default",
        "BEDROCK_MODEL_ID": "anthropic.claude-3-5-sonnet-20241022-v2:0"
      }
    },
    "aws-integration": {
      "command": "npx",
      "args": ["@aws-sdk/bedrock-mcp-server"],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

## Automation with Bedrock Claude

### GitHub Actions with Bedrock

```yaml
# .github/workflows/bedrock-claude.yml
name: Bedrock Claude Automation
on: [push, pull_request]

jobs:
  bedrock-automation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Run Claude Automation via Bedrock
        env:
          CLINE_API_PROVIDER: bedrock
          CLINE_BEDROCK_MODEL_ID: anthropic.claude-3-5-sonnet-20241022-v2:0
        run: |
          cline automate --provider=bedrock --model=claude-3.5-sonnet
```

## Cost Monitoring & Optimization

### Bedrock Cost Tracking

```bash
# Monitor Bedrock usage
aws bedrock get-model-invocation-logging-configuration
aws logs describe-log-groups --log-group-name-prefix="/aws/bedrock"

# Set up cost alerts
aws budgets create-budget --account-id YOUR_ACCOUNT_ID --budget file://bedrock-budget.json
```

### Budget Configuration

```json
{
  "BudgetName": "Bedrock-Claude-Monthly",
  "BudgetLimit": {
    "Amount": "100",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {
    "Service": ["Amazon Bedrock"]
  }
}
```

## Troubleshooting Bedrock + Cline

### Common Issues

**1. Model Access Denied**

```bash
# Solution: Request model access in Bedrock console
aws bedrock list-foundation-models --region us-east-1
```

**2. Authentication Errors**

```bash
# Solution: Check AWS credentials
aws sts get-caller-identity
aws configure list
```

**3. Region Issues**

```bash
# Solution: Ensure Bedrock is available in your region
# Supported regions: us-east-1, us-west-2, eu-west-1, ap-southeast-1
```

**4. Rate Limiting**

```bash
# Solution: Implement retry logic and request rate increases
aws service-quotas get-service-quota \
  --service-code bedrock \
  --quota-code L-1234567890
```

## Production Bedrock Setup

### Multi-Environment Configuration

```bash
# Development
export AWS_PROFILE=dev
export CLINE_BEDROCK_MODEL_ID="anthropic.claude-3-5-haiku-20241022-v1:0"

# Production
export AWS_PROFILE=prod
export CLINE_BEDROCK_MODEL_ID="anthropic.claude-3-5-sonnet-20241022-v2:0"
```

### Security Best Practices

```json
{
  "bedrockSecurity": {
    "encryption": "AWS-KMS",
    "logging": "enabled",
    "monitoring": "CloudWatch",
    "accessControl": "IAM-roles",
    "networkIsolation": "VPC-endpoints"
  }
}
```

## Benefits of Bedrock + Cline for DFS Project

1. **Enterprise Ready** - Meets compliance requirements
2. **Cost Control** - AWS billing and budgets
3. **Performance** - Lower latency in AWS regions
4. **Scaling** - Handle high-volume automation
5. **Integration** - Works with existing AWS infrastructure
6. **Security** - Enterprise-grade data protection

## Quick Start Commands

```bash
# 1. Setup AWS credentials
aws configure

# 2. Enable Bedrock models (via console)

# 3. Configure Cline for Bedrock
export CLINE_API_PROVIDER=bedrock

# 4. Test automation
pnpm run claude:automate

# 5. Deploy with Bedrock Claude
pnpm run claude:deploy
```

This setup gives you the full power of Claude through AWS Bedrock infrastructure while maintaining all your existing Cline automation capabilities.
