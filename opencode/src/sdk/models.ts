/**
 * Model list helper for OpenCode
 */

import { logger } from './logging.js';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
}

export class ModelManager {
  private static instance: ModelManager;
  private models: ModelInfo[] = [];
  private modelList: string = '';

  private constructor() {
    this.loadModels();
  }

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  private loadModels(): void {
    this.modelList = process.env.OPENROUTER_MODEL_LIST || '';

    if (!this.modelList) {
      logger.error(
        'ModelManager',
        'OPENROUTER_MODEL_LIST environment variable is required'
      );
      throw new Error('OPENROUTER_MODEL_LIST environment variable is required');
    }

    const modelIds = this.modelList
      .split(',')
      .map(id => id.trim())
      .filter(id => id);

    if (modelIds.length === 0) {
      logger.error('ModelManager', 'OPENROUTER_MODEL_LIST is empty');
      throw new Error('OPENROUTER_MODEL_LIST cannot be empty');
    }

    this.models = modelIds.map(id => {
      const [provider, model] = id.split('/');
      return {
        id,
        name: model || id,
        provider: provider || 'unknown',
        isFree: id.includes(':free'),
      };
    });

    logger.info(
      'ModelManager',
      `Loaded ${this.models.length} models: ${this.models.map(m => m.id).join(', ')}`
    );
  }

  /**
   * Get all available models
   */
  getModels(): ModelInfo[] {
    return [...this.models];
  }

  /**
   * Get the primary (first) model
   */
  getPrimary(): ModelInfo {
    if (this.models.length === 0) {
      throw new Error('No models available');
    }
    return this.models[0];
  }

  /**
   * Get a specific model by ID
   */
  getModel(modelId: string): ModelInfo | undefined {
    return this.models.find(m => m.id === modelId);
  }

  /**
   * Check if a model is available
   */
  hasModel(modelId: string): boolean {
    return this.models.some(m => m.id === modelId);
  }

  /**
   * Get the next model in rotation, skipping cooldowns
   */
  getNextModel(currentModelId?: string): ModelInfo {
    if (this.models.length === 0) {
      throw new Error('No models available');
    }

    if (this.models.length === 1) {
      return this.models[0];
    }

    const currentIndex = currentModelId
      ? this.models.findIndex(m => m.id === currentModelId)
      : -1;

    // Start from the next model after current, or from beginning
    const startIndex = currentIndex >= 0 ? (currentIndex + 1) % this.models.length : 0;
    return this.models[startIndex];
  }

  /**
   * Validate that a model is in our allowed list
   */
  validateModel(modelId: string): boolean {
    const isAllowed = this.hasModel(modelId);

    if (!isAllowed) {
      logger.warn(
        'ModelManager',
        `Model ${modelId} not in allowed list: ${this.modelList}`
      );
    }

    return isAllowed;
  }

  /**
   * Get only free models
   */
  getFreeModels(): ModelInfo[] {
    return this.models.filter(m => m.isFree);
  }

  /**
   * Reload models from environment (for testing)
   */
  reloadModels(): void {
    this.loadModels();
  }
}

// Export singleton instance
export const modelManager = ModelManager.getInstance();

// Convenience functions
export const getModels = (): ModelInfo[] => modelManager.getModels();
export const getPrimary = (): ModelInfo => modelManager.getPrimary();
export const getModel = (modelId: string): ModelInfo | undefined =>
  modelManager.getModel(modelId);
export const hasModel = (modelId: string): boolean => modelManager.hasModel(modelId);
export const getNextModel = (currentModelId?: string): ModelInfo =>
  modelManager.getNextModel(currentModelId);
export const validateModel = (modelId: string): boolean =>
  modelManager.validateModel(modelId);
export const getFreeModels = (): ModelInfo[] => modelManager.getFreeModels();
