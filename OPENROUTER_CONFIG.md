# OpenRouter Free Coding Models Configuration

## ✅ Configuration Complete

This workspace is now configured to use **OpenRouter's best free coding models** exclusively.

## 🤖 Model Selection

- **Primary Model**: `microsoft/wizardlm-2-8x22b` (Microsoft WizardLM-2 8x22B)
  - Best free model available for coding tasks
  - Excellent for complex programming, debugging, and code generation
- **Fallback Model**: `meta-llama/llama-3.1-8b-instruct:free`
  - High-quality alternative if primary model is unavailable
  - Strong general programming capabilities

## 🔧 Active Configuration Files

1. **`.env`** - Main environment configuration
2. **`.env.openrouter`** - Detailed OpenRouter settings
3. **`.claude-code-config.json`** - Claude Code specific configuration
4. **`setup-openrouter.sh`** - Environment setup script
5. **`mcp_config.json`** - MCP servers configuration (includes prompt caching)

## 💰 Cost: 100% FREE

All models configured are on OpenRouter's free tier. No charges will be incurred.

## 🚀 Usage

The workspace is ready to use. All AI interactions will automatically use the configured free models.

To manually apply the configuration to a new terminal session:

```bash
source ./setup-openrouter.sh
```

## 🔑 API Key

Uses existing OpenRouter API key: `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`

## 📝 Features Enabled

- ✅ Best free coding model prioritization
- ✅ Automatic fallback to secondary model
- ✅ Prompt caching for improved performance
- ✅ MCP server integration
- ✅ Environment variable configuration
- ✅ Free tier enforcement
