import {
  OpenRouterConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './models';

export class OpenRouterClient {
  private config: OpenRouterConfig;
  private baseUrl: string;

  constructor(config: OpenRouterConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1';
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/jaybpaid/opencode-multi',
        'X-Title': 'OpenCode Multi-Agent',
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.max_tokens ?? this.config.maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  }

  async chatStream(request: ChatCompletionRequest): Promise<ReadableStream> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/jaybpaid/opencode-multi',
        'X-Title': 'OpenCode Multi-Agent',
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.max_tokens ?? this.config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}`
      );
    }

    return response.body!;
  }
}
