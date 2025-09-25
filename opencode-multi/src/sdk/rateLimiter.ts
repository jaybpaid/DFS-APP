export interface RateLimitConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  cooldownMs: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private cooldownModels: Set<string> = new Set();
  private lastRequestTime: Map<string, number> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    model: string = 'default'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Check if model is in cooldown
        if (this.cooldownModels.has(model)) {
          const timeSinceLastRequest =
            Date.now() - (this.lastRequestTime.get(model) || 0);
          if (timeSinceLastRequest < this.config.cooldownMs) {
            const waitTime = this.config.cooldownMs - timeSinceLastRequest;
            await this.delay(waitTime);
          } else {
            this.cooldownModels.delete(model);
          }
        }

        const result = await operation();
        this.lastRequestTime.set(model, Date.now());
        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if it's a rate limit error (429) or server error (5xx)
        if (this.isRateLimitError(error) || this.isServerError(error)) {
          if (attempt < this.config.maxRetries) {
            const delay = this.calculateDelay(attempt);
            console.log(
              `Rate limit hit for model ${model}, retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries + 1})`
            );
            await this.delay(delay);

            // Put model in cooldown on rate limit errors
            if (this.isRateLimitError(error)) {
              this.cooldownModels.add(model);
            }
          }
        } else {
          // Non-retryable error, throw immediately
          throw error;
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  private isRateLimitError(error: any): boolean {
    return error?.status === 429 || error?.message?.includes('rate limit');
  }

  private isServerError(error: any): boolean {
    const status = error?.status || error?.response?.status;
    return status >= 500 && status < 600;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    const delay = exponentialDelay + jitter;

    return Math.min(delay, this.config.maxDelayMs);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual cooldown for a model
  setCooldown(model: string, durationMs: number = this.config.cooldownMs): void {
    this.cooldownModels.add(model);
    this.lastRequestTime.set(model, Date.now());
    setTimeout(() => {
      this.cooldownModels.delete(model);
    }, durationMs);
  }
}
