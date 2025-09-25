/**
 * OpenCode - Main entry point
 * Exports all SDK components and utilities
 */

// SDK exports
export * from './sdk/logging.js';
export * from './sdk/models.js';
export * from './sdk/rateLimiter.js';
export * from './sdk/openrouter.js';

// Agent exports
export * from './agent/buildAgent.js';
export * from './agent/fileOps.js';
export * from './agent/prompts.js';

// CLI exports
export * from './cli/opencode-chat.js';
export * from './cli/opencode-build.js';

// Re-export commonly used functions for convenience
export {
  chat,
  chatStream,
  getAvailableModels,
  testConnection,
} from './sdk/openrouter.js';
export { withRetries } from './sdk/rateLimiter.js';
export { getModels, getPrimary } from './sdk/models.js';
export { logger } from './sdk/logging.js';
export { planAndBuild } from './agent/buildAgent.js';
