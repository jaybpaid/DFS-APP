import { createCacheFromEnv, makeCacheKey } from '../sdk/cache';

export interface ClaudeMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ClaudeOptions {
  messages: ClaudeMessage[];
  model: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  cacheBypass?: boolean;
}

export interface ClaudeResponse {
  text: string;
  modelUsed: string;
  raw?: any;
  cached?: boolean;
}

const cache = createCacheFromEnv();

function stripAssistantMessages(msgs: ClaudeMessage[]): ClaudeMessage[] {
  return msgs.filter(m => m.role !== 'assistant');
}

function getSystemMessage(msgs: ClaudeMessage[]): string {
  const systemMsg = msgs.find(m => m.role === 'system');
  return systemMsg
    ? typeof systemMsg.content === 'string'
      ? systemMsg.content
      : JSON.stringify(systemMsg.content)
    : '';
}

// This function should be implemented to call the actual Anthropic API
// For now, it's a placeholder that would be replaced with your actual implementation
async function callAnthropic(opts: ClaudeOptions): Promise<ClaudeResponse> {
  // This is where you would implement the actual HTTP call to Anthropic
  // For demonstration purposes, we'll return a mock response
  throw new Error(
    'callAnthropic function needs to be implemented with actual Anthropic API call'
  );
}

export async function llmCall(opts: ClaudeOptions): Promise<ClaudeResponse> {
  const base = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
  const path = process.env.ANTHROPIC_MESSAGES_PATH || '/v1/messages';

  const cacheKey = makeCacheKey({
    baseUrl: base + path,
    model: opts.model,
    system: getSystemMessage(opts.messages),
    messages: stripAssistantMessages(opts.messages),
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 2048,
    extraSalt: process.env.OC_CACHE_SALT || '',
  });

  // Check cache first (only for non-streaming requests)
  if (cache && !opts.stream && !opts.cacheBypass) {
    const hit = await cache.get(cacheKey);
    if (hit) {
      return {
        text: hit.value.text,
        modelUsed: hit.model,
        raw: hit.value.raw,
        cached: true,
      };
    }
  }

  // Call the actual Anthropic API
  const resp = await callAnthropic(opts);

  // Cache the response (only for non-streaming requests)
  if (cache && !opts.stream && !opts.cacheBypass) {
    await cache.set({
      key: cacheKey,
      model: opts.model,
      createdAt: Date.now(),
      ttlMs: parseInt(process.env.OC_CACHE_TTL_MS || '86400000', 10),
      value: {
        text: resp.text,
        raw: resp.raw,
      },
    });
  }

  return { ...resp, cached: false };
}
