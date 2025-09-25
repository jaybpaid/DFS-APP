import { logger } from './logging';

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  cooldownMs?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  type: 'code' | 'chat' | 'general';
  contextLength: number;
  maxTokens: number;
  isFree: boolean;
  isAvailable: boolean;
}

export class ModelManager {
  private models: ModelInfo[] = [];
  private modelRotationIndex: Map<string, number> = new Map();
  private static instance: ModelManager;

  private constructor() {
    this.initializeModels();
  }

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  private initializeModels(): void {
    const modelList = process.env.OPENROUTER_MODEL_LIST;
    if (!modelList) {
      logger.warn('No OPENROUTER_MODEL_LIST found in environment variables');
      return;
    }

    const modelIds = modelList.split(',').map(id => id.trim());
    logger.info(`Initializing ${modelIds.length} models: ${modelIds.join(', ')}`);

    modelIds.forEach(modelId => {
      const modelInfo = this.parseModelId(modelId);
      if (modelInfo) {
        this.models.push(modelInfo);
      }
    });

    logger.info(`Successfully initialized ${this.models.length} models`);
  }

  private parseModelId(modelId: string): ModelInfo | null {
    const [provider, modelName] = modelId.split('/');

    if (!provider || !modelName) {
      logger.warn(`Invalid model ID format: ${modelId}`);
      return null;
    }

    // Determine model type based on provider and name
    let type: 'code' | 'chat' | 'general' = 'general';
    if (modelName.includes('coder') || modelName.includes('code')) {
      type = 'code';
    } else if (
      modelName.includes('chat') ||
      modelName.includes('gpt') ||
      modelName.includes('claude')
    ) {
      type = 'chat';
    }

    // Determine context length based on model
    let contextLength = 4096;
    let maxTokens = 2048;

    if (modelName.includes('claude')) {
      contextLength = 200000;
      maxTokens = 4096;
    } else if (modelName.includes('gpt-4')) {
      contextLength = 128000;
      maxTokens = 4096;
    } else if (modelName.includes('deepseek')) {
      contextLength = 128000;
      maxTokens = 4096;
    } else if (modelName.includes('qwen')) {
      contextLength = 32000;
      maxTokens = 2048;
    }

    return {
      id: modelId,
      name: modelName,
      provider,
      type,
      contextLength,
      maxTokens,
      isFree: modelId.includes(':free'),
      isAvailable: true,
    };
  }

  getAllModels(): ModelInfo[] {
    return [...this.models];
  }

  getModelsByType(type: 'code' | 'chat' | 'general'): ModelInfo[] {
    return this.models.filter(model => model.type === type && model.isAvailable);
  }

  getRecommendedModel(type: 'code' | 'chat' | 'general' = 'general'): ModelInfo | null {
    const availableModels = this.getModelsByType(type);

    if (availableModels.length === 0) {
      logger.warn(`No ${type} models available`);
      return null;
    }

    // Get rotation index for this type
    const rotationKey = `rotation_${type}`;
    const currentIndex = this.modelRotationIndex.get(rotationKey) || 0;

    const selectedModel = availableModels[currentIndex];

    // Update rotation index
    this.modelRotationIndex.set(
      rotationKey,
      (currentIndex + 1) % availableModels.length
    );

    logger.debug(`Selected ${type} model: ${selectedModel.id}`);
    return selectedModel;
  }

  validateModel(modelId: string): boolean {
    return this.models.some(model => model.id === modelId && model.isAvailable);
  }

  getModelById(modelId: string): ModelInfo | null {
    return this.models.find(model => model.id === modelId && model.isAvailable) || null;
  }

  markModelUnavailable(modelId: string): void {
    const model = this.models.find(m => m.id === modelId);
    if (model) {
      model.isAvailable = false;
      logger.warn(`Marked model as unavailable: ${modelId}`);
    }
  }

  markModelAvailable(modelId: string): void {
    const model = this.models.find(m => m.id === modelId);
    if (model) {
      model.isAvailable = true;
      logger.info(`Marked model as available: ${modelId}`);
    }
  }
}

// Export singleton instance
export const modelManager = ModelManager.getInstance();

// Convenience functions
export function getRecommendedModel(
  type: 'code' | 'chat' | 'general' = 'general'
): ModelInfo | null {
  return modelManager.getRecommendedModel(type);
}

export function getAllModels(): ModelInfo[] {
  return modelManager.getAllModels();
}

export function validateModel(modelId: string): boolean {
  return modelManager.validateModel(modelId);
}
