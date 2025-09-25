/**
 * OpenCode Multi-Agent - Main entry point
 * Exports all SDK components and utilities
 */

// SDK Components
export * from './sdk/openrouter';
export * from './sdk/rateLimiter';
export * from './sdk/models';
export * from './sdk/logging';
export * from './sdk/mcp-tools';

// Agent System (will be created)
export * from './agent/buildAgent';
export * from './agent/fileOps';
export * from './agent/prompts';

// CLI Tools (will be created)
export * from './cli/opencode-chat';
export * from './cli/opencode-build';

// Core Types
export interface AgentConfig {
  name: string;
  description: string;
  capabilities: string[];
  maxIterations: number;
  temperature: number;
  maxTokens: number;
}

export interface BuildTask {
  id: string;
  goal: string;
  context: string;
  requirements: string[];
  constraints: string[];
  deadline?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface BuildResult {
  success: boolean;
  artifacts: string[];
  summary: string;
  metrics: {
    duration: number;
    tokensUsed: number;
    modelsUsed: string[];
    errors: string[];
  };
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'agent';
  content: string;
  agent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Utility functions
export function createAgentConfig(
  name: string,
  description: string,
  capabilities: string[]
): AgentConfig {
  return {
    name,
    description,
    capabilities,
    maxIterations: 3,
    temperature: 0.2,
    maxTokens: 2048,
  };
}

export function createBuildTask(
  goal: string,
  context: string,
  requirements: string[] = [],
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): BuildTask {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    goal,
    context,
    requirements,
    constraints: [],
    priority,
  };
}

// Version info
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

// Health check
export function healthCheck(): { status: string; version: string; timestamp: string } {
  return {
    status: 'healthy',
    version: VERSION,
    timestamp: new Date().toISOString(),
  };
}
