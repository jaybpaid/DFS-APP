/**
 * OpenRouter client for OpenCode
 */

import { logger } from './logging.js';
import { modelManager, ModelInfo } from './models.js';
import { rateLimiter, withRetries, RetryOptions } from './rateLimiter.js';
import { cacheManager, generateCacheKey } from './cache.js';
import https from 'https';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
  stream?: boolean;
  signal?: AbortSignal;
}

export interface ChatResponse {
  text: string;
  modelUsed: string;
  finishReason: string;
  raw: any;
}

export interface StreamChunk {
  text: string;
  modelUsed?: string;
  finishReason?: string;
  done: boolean;
}

export class OpenRouterClient {
  private static instance: OpenRouterClient;
  private apiKey: string;
  private baseUrl: string;

  private constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    if (!this.apiKey) {
      logger.error(
        'OpenRouterClient',
        'OPENROUTER_API_KEY environment variable is required'
      );
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    logger.info('OpenRouterClient', 'Initialized OpenRouter client', {
      baseUrl: this.baseUrl,
    });

    // Start cache cleanup scheduler
    try {
      cacheManager.startCleanupScheduler();
      logger.debug('OpenRouterClient', 'Cache cleanup scheduler started');
    } catch (error) {
      logger.warn('OpenRouterClient', 'Failed to start cache cleanup scheduler', error);
    }
  }

  static getInstance(): OpenRouterClient {
    if (!OpenRouterClient.instance) {
      OpenRouterClient.instance = new OpenRouterClient();
    }
    return OpenRouterClient.instance;
  }

  /**
   * Make a chat completion request
   */
  async chat(options: ChatOptions): Promise<ChatResponse> {
    const model = options.model
      ? this.validateModel(options.model)
      : modelManager.getPrimary();

    const requestBody = {
      model: model.id,
      messages: options.messages,
      temperature:
        options.temperature ?? parseFloat(process.env.OC_TEMPERATURE || '0.2'),
      max_tokens: options.maxTokens ?? parseInt(process.env.OC_MAX_TOKENS || '2048'),
      stream: options.stream ?? false,
      ...(options.tools && { tools: options.tools }),
    };

    // Check cache for non-streaming requests
    if (!requestBody.stream) {
      try {
        const cache = await cacheManager.getCache();
        if (cache) {
          const cacheKey = generateCacheKey(
            model.id,
            options.messages,
            requestBody.temperature,
            requestBody.max_tokens,
            options.tools,
            process.env.OC_CACHE_SALT
          );

          const cachedEntry = await cache.get(cacheKey);
          if (cachedEntry) {
            logger.debug('OpenRouterClient', 'Returning cached response', {
              key: cacheKey,
              age: Date.now() - cachedEntry.createdAt,
            });
            return cachedEntry.response;
          }

          logger.debug('OpenRouterClient', 'Cache miss, making API request', {
            key: cacheKey,
            model: model.id,
          });
        }
      } catch (error) {
        logger.warn(
          'OpenRouterClient',
          'Cache check failed, proceeding with API request',
          error
        );
      }
    }

    logger.debug('OpenRouterClient', 'Making chat request', {
      model: model.id,
      messageCount: options.messages.length,
      temperature: requestBody.temperature,
      maxTokens: requestBody.max_tokens,
      cached: false,
    });

    const requestFn = async (
      currentModel: ModelInfo,
      attempt: number
    ): Promise<ChatResponse> => {
      // Configure fetch options with SSL handling
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/jaybpaid/DFS-APP',
          'X-Title': 'OpenCode',
        },
        body: JSON.stringify(requestBody),
        ...(options.signal && { signal: options.signal }),
      };

      // Handle SSL certificate issues
      const rejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0';
      if (!rejectUnauthorized) {
        logger.warn(
          'OpenRouterClient',
          'SSL certificate verification disabled - NOT RECOMMENDED FOR PRODUCTION'
        );
        // Use global agent with SSL config instead of custom agent
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

      const apiResponse = await fetch(`${this.baseUrl}/chat/completions`, fetchOptions);

      if (!apiResponse.ok) {
        const error = {
          status: apiResponse.status,
          message: `HTTP ${apiResponse.status}: ${apiResponse.statusText}`,
        };

        // Add response body if available
        try {
          const errorBody = await apiResponse.text();
          if (errorBody) {
            error.message += ` - ${errorBody}`;
          }
        } catch (e) {
          // Ignore error parsing errors
        }

        throw error;
      }

      const data = await apiResponse.json();

      if (!data.choices || !data.choices[0]) {
        throw new Error('Invalid response format from OpenRouter');
      }

      const choice = data.choices[0];
      const text = choice.message?.content || '';
      const finishReason = choice.finish_reason || 'unknown';

      logger.debug('OpenRouterClient', 'Received chat response', {
        model: data.model,
        finishReason,
        tokenUsage: data.usage,
        textLength: text.length,
      });

      const chatResponse: ChatResponse = {
        text,
        modelUsed: data.model,
        finishReason,
        raw: data,
      };

      // Cache successful non-streaming responses
      if (!requestBody.stream) {
        try {
          const cache = await cacheManager.getCache();
          if (cache) {
            const cacheKey = generateCacheKey(
              model.id,
              options.messages,
              requestBody.temperature,
              requestBody.max_tokens,
              options.tools,
              process.env.OC_CACHE_SALT
            );

            await cache.set(cacheKey, chatResponse);
            logger.debug('OpenRouterClient', 'Response cached', { key: cacheKey });
          }
        } catch (error) {
          logger.warn('OpenRouterClient', 'Failed to cache response', error);
        }
      }

      return chatResponse;
    };

    const retryOptions: RetryOptions = {
      ...(options.signal && { signal: options.signal }),
    };

    return withRetries(requestFn, retryOptions);
  }

  /**
   * Stream a chat completion response
   */
  async *chatStream(
    options: ChatOptions,
    onToken?: (chunk: StreamChunk) => void
  ): AsyncGenerator<StreamChunk> {
    const model = options.model
      ? this.validateModel(options.model)
      : modelManager.getPrimary();

    const requestBody = {
      model: model.id,
      messages: options.messages,
      temperature:
        options.temperature ?? parseFloat(process.env.OC_TEMPERATURE || '0.2'),
      max_tokens: options.maxTokens ?? parseInt(process.env.OC_MAX_TOKENS || '2048'),
      stream: true,
      ...(options.tools && { tools: options.tools }),
    };

    logger.debug('OpenRouterClient', 'Starting stream request', {
      model: model.id,
      messageCount: options.messages.length,
    });

    const requestFn = async (
      currentModel: ModelInfo,
      attempt: number
    ): Promise<ReadableStream<Uint8Array>> => {
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/jaybpaid/DFS-APP',
          'X-Title': 'OpenCode',
        },
        body: JSON.stringify(requestBody),
        ...(options.signal && { signal: options.signal }),
      };

      // Handle SSL certificate issues
      const rejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0';
      if (!rejectUnauthorized) {
        logger.warn(
          'OpenRouterClient',
          'SSL certificate verification disabled - NOT RECOMMENDED FOR PRODUCTION'
        );
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, fetchOptions);

      if (!response.ok) {
        const error = {
          status: response.status,
          message: `HTTP ${response.status}: ${response.statusText}`,
        };

        try {
          const errorBody = await response.text();
          if (errorBody) {
            error.message += ` - ${errorBody}`;
          }
        } catch (e) {
          // Ignore error parsing errors
        }

        throw error;
      }

      if (!response.body) {
        throw new Error('No response body available for streaming');
      }

      return response.body;
    };

    const retryOptions: RetryOptions = {
      ...(options.signal && { signal: options.signal }),
    };

    const stream = await withRetries(requestFn, retryOptions);

    let buffer = '';
    let modelUsed = '';
    let finishReason = '';

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            yield {
              text: buffer,
              modelUsed,
              finishReason,
              done: true,
            };
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.choices && parsed.choices[0]) {
                const choice = parsed.choices[0];

                if (choice.delta?.content) {
                  const chunk: StreamChunk = {
                    text: choice.delta.content,
                    modelUsed: parsed.model,
                    done: false,
                  };

                  if (onToken) {
                    onToken(chunk);
                  }

                  yield chunk;
                }

                if (choice.finish_reason) {
                  finishReason = choice.finish_reason;
                }

                if (parsed.model && !modelUsed) {
                  modelUsed = parsed.model;
                }
              }
            } catch (e) {
              // Skip malformed JSON lines
              logger.debug('OpenRouterClient', 'Skipping malformed JSON line', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Validate that a model is available
   */
  private validateModel(modelId: string): ModelInfo {
    const model = modelManager.getModel(modelId);

    if (!model) {
      logger.error('OpenRouterClient', `Model ${modelId} not found in allowed list`);
      throw new Error(`Model ${modelId} not found in allowed list`);
    }

    return model;
  }

  /**
   * Get available models
   */
  getAvailableModels(): ModelInfo[] {
    return modelManager.getModels();
  }

  /**
   * Test connectivity to OpenRouter
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error('OpenRouterClient', 'Connection test failed', error);
      return false;
    }
  }
}

// Export singleton instance
export const openRouterClient = OpenRouterClient.getInstance();

// Convenience functions
export const chat = (options: ChatOptions): Promise<ChatResponse> =>
  openRouterClient.chat(options);
export const chatStream = (
  options: ChatOptions,
  onToken?: (chunk: StreamChunk) => void
): AsyncGenerator<StreamChunk> => openRouterClient.chatStream(options, onToken);
export const getAvailableModels = (): ModelInfo[] =>
  openRouterClient.getAvailableModels();
export const testConnection = (): Promise<boolean> => openRouterClient.testConnection();
