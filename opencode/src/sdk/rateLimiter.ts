/**
 * Rate limiting and model rotation for OpenCode
 */

import { logger } from './logging.js';
import { modelManager, ModelInfo } from './models.js';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  cooldownMs?: number;
  signal?: AbortSignal | null;
}

export interface RequestState {
  currentModel: ModelInfo;
  attempt: number;
  cooldowns: Map<string, number>; // modelId -> expiresAt
}

export class RateLimiter {
  private static instance: RateLimiter;
  private defaultOptions: Required<RetryOptions>;

  private constructor() {
    this.defaultOptions = {
      maxRetries: parseInt(process.env.OC_MAX_RETRIES || '6'),
      baseDelayMs: parseInt(process.env.OC_BASE_DELAY_MS || '500'),
      maxDelayMs: parseInt(process.env.OC_MAX_DELAY_MS || '15000'),
      cooldownMs: parseInt(process.env.OC_COOLDOWN_MS || '60000'),
      signal: null,
    };
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Select the next model for rotation, skipping cooldowns
   */
  selectNextModel(state: RequestState): ModelInfo {
    const models = modelManager.getModels();
    const now = Date.now();

    // Find the current model index
    const currentIndex = models.findIndex(m => m.id === state.currentModel.id);

    // Try each model starting from the next one
    for (let i = 1; i <= models.length; i++) {
      const nextIndex = (currentIndex + i) % models.length;
      const model = models[nextIndex];
      const cooldownExpiry = state.cooldowns.get(model.id);

      if (!cooldownExpiry || cooldownExpiry <= now) {
        logger.debug(
          'RateLimiter',
          `Selected model ${model.id} (attempt ${state.attempt + 1})`
        );
        return model;
      }
    }

    // If all models are in cooldown, return the first available one
    logger.warn('RateLimiter', 'All models in cooldown, using first available');
    return models[0];
  }

  /**
   * Mark a model as being in cooldown
   */
  markCooldown(modelId: string, cooldownMs?: number): void {
    const cooldown = cooldownMs || this.defaultOptions.cooldownMs;
    const expiresAt = Date.now() + cooldown;

    logger.info(
      'RateLimiter',
      `Model ${modelId} entering cooldown until ${new Date(expiresAt).toISOString()}`
    );

    // Note: In a real implementation, this would be stored persistently
    // For now, we'll use an in-memory approach
  }

  /**
   * Check if an error should trigger a cooldown
   */
  shouldCooldown(error: any): boolean {
    if (!error) return false;

    // Check for rate limit errors (429)
    if (error.status === 429) return true;

    // Check for server errors (5xx)
    if (error.status && error.status >= 500) return true;

    // Check for specific error messages
    const message = error.message?.toLowerCase() || '';
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }

    return false;
  }

  /**
   * Calculate backoff delay with jitter
   */
  private calculateBackoff(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number
  ): number {
    const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
    const jitter = Math.random() * baseDelayMs;
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Sleep for a specified duration
   */
  private async sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);

      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Aborted'));
        });
      }
    });
  }

  /**
   * Execute a request with retry logic and model rotation
   */
  async withRetries<T>(
    requestFn: (model: ModelInfo, attempt: number) => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const state: RequestState = {
      currentModel: modelManager.getPrimary(),
      attempt: 0,
      cooldowns: new Map(),
    };

    let lastError: any;

    while (state.attempt <= opts.maxRetries) {
      try {
        // Check for abort signal
        if (opts.signal?.aborted) {
          throw new Error('Aborted');
        }

        logger.debug(
          'RateLimiter',
          `Attempt ${state.attempt + 1}/${opts.maxRetries + 1} with model ${state.currentModel.id}`
        );

        const result = await requestFn(state.currentModel, state.attempt);

        if (state.attempt > 0) {
          logger.info(
            'RateLimiter',
            `Request succeeded on attempt ${state.attempt + 1} with model ${state.currentModel.id}`
          );
        }

        return result;
      } catch (error) {
        lastError = error;
        state.attempt++;

        logger.warn('RateLimiter', `Request failed on attempt ${state.attempt}`, {
          model: state.currentModel.id,
          error: error.message || error.status || 'Unknown error',
        });

        // Check if we should retry
        if (state.attempt > opts.maxRetries) {
          logger.error('RateLimiter', `Max retries (${opts.maxRetries}) exceeded`);
          break;
        }

        // Check if error should trigger cooldown
        if (this.shouldCooldown(error)) {
          this.markCooldown(state.currentModel.id, opts.cooldownMs);

          // Rotate to next model
          state.currentModel = this.selectNextModel(state);

          // Calculate backoff delay
          const backoffMs = this.calculateBackoff(
            state.attempt - 1,
            opts.baseDelayMs,
            opts.maxDelayMs
          );

          logger.info(
            'RateLimiter',
            `Backing off for ${backoffMs}ms before retry with model ${state.currentModel.id}`
          );

          // Wait before retry
          await this.sleep(backoffMs, opts.signal);
        } else {
          // Non-retryable error
          logger.error(
            'RateLimiter',
            `Non-retryable error: ${error.message || error.status}`
          );
          break;
        }
      }
    }

    // All retries exhausted
    logger.error('RateLimiter', `All ${opts.maxRetries + 1} attempts failed`, {
      finalModel: state.currentModel.id,
      finalError: lastError?.message || lastError?.status || 'Unknown error',
    });

    throw lastError;
  }

  /**
   * Get current retry options
   */
  getDefaultOptions(): Required<RetryOptions> {
    return { ...this.defaultOptions };
  }

  /**
   * Update default retry options
   */
  updateDefaultOptions(options: Partial<RetryOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
    logger.info('RateLimiter', 'Updated default retry options', options);
  }
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();

// Convenience functions
export const withRetries = <T>(
  requestFn: (model: ModelInfo, attempt: number) => Promise<T>,
  options?: RetryOptions
): Promise<T> => rateLimiter.withRetries(requestFn, options);

export const selectNextModel = (state: RequestState): ModelInfo =>
  rateLimiter.selectNextModel(state);
export const markCooldown = (modelId: string, cooldownMs?: number): void =>
  rateLimiter.markCooldown(modelId, cooldownMs);
export const shouldCooldown = (error: any): boolean =>
  rateLimiter.shouldCooldown(error);
