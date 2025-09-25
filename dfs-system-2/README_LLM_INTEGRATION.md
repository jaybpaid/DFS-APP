# LLM Integration Setup Guide

## Overview

This DFS system integrates with multiple AI providers for enhanced player analysis and optimization insights. The system supports OpenAI ChatGPT, Google Gemini, and DeepSeek APIs.

## Setup Instructions

### 1. Environment Configuration

Copy the `.env.example` file to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual API keys.

### 2. API Key Acquisition

#### OpenAI ChatGPT

1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Set `OPENAI_API_KEY` in your `.env` file

#### Google Gemini

1. Visit https://aistudio.google.com/app/apikey
2. Create a new API key
3. Set `GEMINI_API_KEY` in your `.env` file

#### DeepSeek

1. Visit https://platform.deepseek.com/api-keys
2. Create a new API key
3. Set `DEEPSEEK_API_KEY` in your `.env` file

### 3. Testing the Integration

Run the test script to verify your setup:

```bash
python3 test_llm_fixed.py
```

### 4. Usage in Application

The LLM integration automatically handles:

- Fallback analysis when no AI providers are available
- Multiple provider failover (tries OpenAI first, then Gemini, then DeepSeek)
- Comprehensive error handling for API failures

## Error Handling Improvements

The system now includes enhanced error handling to prevent "Unexpected API Response" issues:

1. **Network Timeouts**: 10-second timeout for API calls
2. **Response Validation**: Checks for proper JSON structure and message content
3. **Fallback Mechanisms**: Provides basic analysis when AI is unavailable
4. **Provider Status Monitoring**: Real-time status checking

## Common Issues and Solutions

### "No AI providers available"

- Ensure API keys are set in `.env` file
- Check internet connectivity
- Verify API key validity

### API Rate Limiting

- The system respects rate limits (60/min for OpenAI, 30/min for NBA API)
- Consider upgrading to higher rate limit tiers if needed

### Unexpected Response Format

- The enhanced error handling now validates API responses
- Fallback analysis ensures the system remains functional

## Support

For issues with AI integration, check:

1. API key validity and quotas
2. Network connectivity
3. Provider status pages:
   - OpenAI: https://status.openai.com
   - Google AI: https://status.cloud.google.com
   - DeepSeek: Contact their support
