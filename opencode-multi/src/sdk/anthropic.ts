import fetch from 'node-fetch';
import crypto from 'node:crypto';
import { createCacheFromEnv, makeCacheKey } from './cache';

export interface AnthropicMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AnthropicOptions {
  messages: AnthropicMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  tools?: any;
}

export interface AnthropicResponse {
  text: string;
  model: string;
  raw?: any;
  cached?: boolean;
}

export interface AnthropicStreamChunk {
  text?: string;
  model?: string;
  error?: string;
}

class AnthropicClient {
  private apiKey: string;
  private baseUrl: string;
  private messagesPath: string;
  private version: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
    this.messagesPath = process.env.ANTHROPIC_MESSAGES_PATH || '/v1/messages';
    this.version = process.env.ANTHROPIC_VERSION || '2023-06-01';
  }

  private stripAssistantMessages(messages: AnthropicMessage[]): AnthropicMessage[] {
    return messages.filter(m => m.role !== 'assistant');
  }

  private getSystemMessage(messages: AnthropicMessage[]): string {
    const systemMsg = messages.find(m => m.role === 'system');
    return systemMsg
      ? typeof systemMsg.content === 'string'
        ? systemMsg.content
        : JSON.stringify(systemMsg.content)
      : '';
  }

  private async makeRequest(
    options: AnthropicOptions,
    model: string
  ): Promise<AnthropicResponse> {
    const requestBody: any = {
      model,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.2,
      messages: options.messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : [m.content],
      })),
      stream: false,
    };

    if (options.tools) {
      requestBody.tools = options.tools;
    }

    const response = await fetch(`${this.baseUrl}${this.messagesPath}`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': this.version,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Anthropic API error: ${response.status} ${response.statusText} - ${errorData}`
      );
    }

    const data = await response.json();
    const text = Array.isArray(data.content)
      ? data.content.map((c: any) => c.text || '').join('')
      : (data.content?.[0]?.text ?? '');

    return {
      text,
      model: data.model || model,
      raw: data,
    };
  }

  private async *makeStreamRequest(
    options: AnthropicOptions,
    model: string
  ): AsyncGenerator<AnthropicStreamChunk> {
    const requestBody: any = {
      model,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.2,
      messages: options.messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : [m.content],
      })),
      stream: true,
    };

    if (options.tools) {
      requestBody.tools = options.tools;
    }

    const response = await fetch(`${this.baseUrl}${this.messagesPath}`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': this.version,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      yield {
        error: `Anthropic API error: ${response.status} ${response.statusText} - ${errorData}`,
      };
      return;
    }

    const stream = response.body;
    if (!stream) {
      yield { error: 'No response stream available' };
      return;
    }

    let buffer = '';
    const decoder = new TextDecoder();

    try {
      for await (const chunk of stream) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');

        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.delta?.text) {
                yield {
                  text: parsed.delta.text,
                  model: parsed.model || model,
                };
              }
            } catch (e) {
              // Ignore parsing errors for non-JSON lines
            }
          }
        }
      }
    } catch (error) {
      yield {
        error: `Stream error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async chat(options: AnthropicOptions): Promise<AnthropicResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const model = options.model || 'claude-3-7-sonnet-2025-06-06';
    const cache = createCacheFromEnv();

    // Generate cache key
    const cacheKey = makeCacheKey({
      baseUrl: `${this.baseUrl}${this.messagesPath}`,
      model,
      system: this.getSystemMessage(options.messages),
      messages: this.stripAssistantMessages(options.messages),
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 2048,
      toolsSignature: options.tools
        ? crypto
            .createHash('sha256')
            .update(JSON.stringify(options.tools))
            .digest('hex')
            .slice(0, 16)
        : '',
      extraSalt: process.env.OC_CACHE_SALT || '',
    });

    // Check cache first (only for non-streaming requests)
    if (cache && !options.stream) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return {
          text: cached.value.text,
          model: cached.model,
          raw: cached.value.raw,
          cached: true,
        };
      }
    }

    try {
      const response = await this.makeRequest(options, model);

      // Cache the response (only for non-streaming requests)
      if (cache && !options.stream && response.text) {
        await cache.set({
          key: cacheKey,
          model,
          createdAt: Date.now(),
          ttlMs: parseInt(process.env.OC_CACHE_TTL_MS || '86400000', 10),
          value: {
            text: response.text,
            raw: response.raw,
          },
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async *chatStream(options: AnthropicOptions): AsyncGenerator<AnthropicStreamChunk> {
    if (!this.apiKey) {
      yield { error: 'Anthropic API key not configured' };
      return;
    }

    const model = options.model || 'claude-3-7-sonnet-2025-06-06';

    try {
      yield* this.makeStreamRequest(options, model);
    } catch (error) {
      yield { error: error instanceof Error ? error.message : String(error) };
    }
  }
}

// Singleton instance
export const anthropicClient = new AnthropicClient();

// Convenience functions
export async function claudeChat(
  options: AnthropicOptions
): Promise<AnthropicResponse> {
  return anthropicClient.chat(options);
}

export async function* claudeChatStream(
  options: AnthropicOptions
): AsyncGenerator<AnthropicStreamChunk> {
  yield* anthropicClient.chatStream(options);
}
