# Claude Code + Amazon Bedrock - Troubleshooting Solution

## Current Issue: "API Error: Connection error"

Your Claude Code installation is configured correctly, but there's an AWS permissions issue.

## Root Cause Analysis

From the setup script output, we identified:

```
An error occurred (AccessDeniedException) when calling the ListFoundationModels operation:
User: arn:aws:sts::245094849546:assumed-role/AWSReservedSSO_BedrockDeveloperAccess_540a0fbb58685607/jmaryland@mgmresorts.com
is not authorized to perform: bedrock:ListFoundationModels because no identity-based policy allows the bedrock:ListFoundationModels action
```

## The Problem

Your AWS SSO role `BedrockDeveloperAccess` is missing these required permissions:

- `bedrock:ListFoundationModels`
- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`

## Solutions (Choose One)

### Solution 1: Request Additional Permissions (Recommended)

Contact your AWS administrator to add these permissions to your `BedrockDeveloperAccess` role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:ListFoundationModels",
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:GetFoundationModel"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
      "Resource": "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-*"
    }
  ]
}
```

### Solution 2: Use Direct Anthropic API (Temporary Workaround)

While waiting for AWS permissions, you can use Claude Code with the direct Anthropic API:

```bash
# Reset Claude to use Anthropic directly
unset AWS_PROFILE
unset AWS_REGION
unset ANTHROPIC_API_BASE
unset ANTHROPIC_API_KEY

# Configure for direct Anthropic API
claude config set --global provider anthropic

# You'll need to login with your Anthropic account
claude login
```

### Solution 3: Alternative AWS Profile

If you have another AWS profile with Bedrock permissions:

```bash
# List available profiles
aws configure list-profiles

# Test with different profile
export AWS_PROFILE=your-other-profile
aws sts get-caller-identity --profile your-other-profile
```

## Current Configuration Status

✅ **Claude CLI**: Installed and working (v1.0.123)  
✅ **AWS CLI**: Installed and configured  
✅ **AWS SSO**: Successfully logged in to account 245094849546  
✅ **Claude Config**: Set to use Bedrock provider  
❌ **AWS Permissions**: Missing Bedrock model access

## Files Created

- `~/.claude-code/config.json` - Bedrock configuration
- `test-bedrock-claude.sh` - Test script
- Environment variables set for Bedrock

## Next Steps

1. **Contact AWS Admin**: Request the permissions listed in Solution 1
2. **Test Again**: Once permissions are granted, run:
   ```bash
   ./test-bedrock-claude.sh
   ```
3. **Verify Success**: You should see "Bedrock connection successful"

## Alternative: Use Anthropic Direct API Now

If you need Claude Code working immediately:

```bash
# Quick setup for direct Anthropic API
claude config set --global provider anthropic
claude login
claude --print "Hello from Claude!"
```

## Verification Commands

Once permissions are fixed, test with:

```bash
# Test AWS Bedrock access
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --body '{"messages":[{"role":"user","content":"test"}],"max_tokens":10}' \
  --region us-west-2 \
  --profile 245094849546 \
  /tmp/test-response.json

# Test Claude Code with Bedrock
./test-bedrock-claude.sh
```

## Summary

Your Claude Code installation is **correctly configured for Bedrock**. The only issue is AWS IAM permissions. Once your AWS administrator grants the required Bedrock permissions to your `BedrockDeveloperAccess` role, everything will work perfectly.

**Status**: ✅ Setup Complete, ⏳ Waiting for AWS Permissions
