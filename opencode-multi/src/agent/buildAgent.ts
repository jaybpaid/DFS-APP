/**
 * Build Agent - Main orchestration agent for code generation
 */

import {
  chat,
  chatStream,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
} from '../sdk/openrouter';
import { rateLimiter, withRetries } from '../sdk/rateLimiter';
import { modelManager, getRecommendedModel } from '../sdk/models';
import { logger, LogLevel } from '../sdk/logging';
import { getAgentPrompt, formatPrompt, AgentPrompt } from './prompts';
import { AgentConfig, BuildTask, BuildResult, AgentMessage } from '../index';

export interface AgentContext {
  task: BuildTask;
  messages: AgentMessage[];
  artifacts: string[];
  currentPhase: string;
  completedPhases: string[];
  errors: string[];
  metadata: Record<string, any>;
}

export class BuildAgent {
  private config: AgentConfig;
  private context: AgentContext;
  private agents: Map<string, AgentConfig> = new Map();

  constructor(config: AgentConfig, task: BuildTask) {
    this.config = config;
    this.context = {
      task,
      messages: [],
      artifacts: [],
      currentPhase: 'planning',
      completedPhases: [],
      errors: [],
      metadata: {},
    };

    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Define specialized agents
    const agents: AgentConfig[] = [
      {
        name: 'planner',
        description: 'Project planning and architecture specialist',
        capabilities: ['planning', 'architecture', 'requirements-analysis'],
        maxIterations: 3,
        temperature: 0.2,
        maxTokens: 2048,
      },
      {
        name: 'researcher',
        description: 'Technical research and analysis specialist',
        capabilities: ['research', 'analysis', 'technology-evaluation'],
        maxIterations: 2,
        temperature: 0.1,
        maxTokens: 2048,
      },
      {
        name: 'coder',
        description: 'Code implementation specialist',
        capabilities: ['coding', 'implementation', 'debugging'],
        maxIterations: 5,
        temperature: 0.2,
        maxTokens: 4096,
      },
      {
        name: 'tester',
        description: 'Testing and quality assurance specialist',
        capabilities: ['testing', 'quality-assurance', 'validation'],
        maxIterations: 3,
        temperature: 0.1,
        maxTokens: 2048,
      },
      {
        name: 'refactorer',
        description: 'Code refactoring and optimization specialist',
        capabilities: ['refactoring', 'optimization', 'code-quality'],
        maxIterations: 3,
        temperature: 0.2,
        maxTokens: 2048,
      },
      {
        name: 'docs',
        description: 'Documentation specialist',
        capabilities: ['documentation', 'technical-writing', 'user-guides'],
        maxIterations: 2,
        temperature: 0.3,
        maxTokens: 2048,
      },
      {
        name: 'n8n',
        description: 'n8n workflow automation specialist',
        capabilities: ['automation', 'workflows', 'integration'],
        maxIterations: 2,
        temperature: 0.2,
        maxTokens: 2048,
      },
    ];

    agents.forEach(agent => {
      this.agents.set(agent.name, agent);
    });
  }

  /**
   * Execute the build process
   */
  async execute(): Promise<BuildResult> {
    const startTime = Date.now();
    const modelsUsed: string[] = [];
    const errors: string[] = [];

    logger.info(`Starting build process for task: ${this.context.task.goal}`, {
      taskId: this.context.task.id,
      priority: this.context.task.priority,
    });

    try {
      // Phase 1: Planning
      await this.executePhase('planner', 'planning');

      // Phase 2: Research
      await this.executePhase('researcher', 'research');

      // Phase 3: Implementation (may involve multiple agents)
      await this.executeImplementationPhase();

      // Phase 4: Testing
      await this.executePhase('tester', 'testing');

      // Phase 5: Refactoring (if needed)
      if (this.context.errors.length > 0) {
        await this.executePhase('refactorer', 'refactoring');
      }

      // Phase 6: Documentation
      await this.executePhase('docs', 'documentation');

      // Phase 7: Automation (if applicable)
      if (
        this.context.task.requirements.some(req =>
          req.toLowerCase().includes('automation')
        )
      ) {
        await this.executePhase('n8n', 'automation');
      }

      const duration = Date.now() - startTime;
      const success = this.context.errors.length === 0;

      logger.info(`Build process completed`, {
        success,
        duration,
        artifacts: this.context.artifacts.length,
        errors: this.context.errors.length,
      });

      return {
        success,
        artifacts: this.context.artifacts,
        summary: this.generateSummary(),
        metrics: {
          duration,
          tokensUsed: 0, // TODO: Track token usage
          modelsUsed,
          errors: this.context.errors,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error(`Build process failed`, error, {
        duration,
        taskId: this.context.task.id,
      });

      return {
        success: false,
        artifacts: this.context.artifacts,
        summary: `Build failed: ${errorMessage}`,
        metrics: {
          duration,
          tokensUsed: 0,
          modelsUsed,
          errors: [...this.context.errors, errorMessage],
        },
      };
    }
  }

  /**
   * Execute a specific phase with an agent
   */
  private async executePhase(agentName: string, phaseName: string): Promise<void> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    mainLogger.info(`Executing phase: ${phaseName}`, { agent: agentName });

    this.context.currentPhase = phaseName;

    const prompt = getAgentPrompt(agentName);
    const formattedPrompt = formatPrompt(prompt, {
      goal: this.context.task.goal,
      context: this.context.task.context,
      requirements: this.context.task.requirements.join(', '),
      constraints: this.context.task.constraints.join(', '),
    });

    const messages = [
      { role: 'system' as const, content: formattedPrompt.system },
      { role: 'user' as const, content: formattedPrompt.task },
    ];

    let attempts = 0;
    const maxAttempts = agent.maxIterations;

    while (attempts < maxAttempts) {
      try {
        const model = getRecommendedModel('code')?.id || 'qwen/qwen3-coder:free';

        const response = await performanceLogger.withDuration(
          LogLevel.INFO,
          `Agent ${agentName} execution`,
          async () => {
            return await chat({
              messages,
              model,
              temperature: agent.temperature,
              maxTokens: agent.maxTokens,
            });
          },
          model
        );

        // Process the response
        const result = await this.processAgentResponse(agentName, response.text);

        if (result.success) {
          this.context.completedPhases.push(phaseName);
          mainLogger.info(`Phase ${phaseName} completed successfully`);
          return;
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error(`Agent ${agentName} failed after ${maxAttempts} attempts`);
          }

          mainLogger.warn(`Phase ${phaseName} attempt ${attempts} failed, retrying...`);
        }
      } catch (error) {
        attempts++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        mainLogger.error(
          `Phase ${phaseName} attempt ${attempts} error`,
          error instanceof Error ? error : undefined
        );

        if (attempts >= maxAttempts) {
          this.context.errors.push(`${phaseName}: ${errorMessage}`);
          throw error;
        }
      }
    }
  }

  /**
   * Execute implementation phase (may involve multiple coding iterations)
   */
  private async executeImplementationPhase(): Promise<void> {
    const coder = this.agents.get('coder');
    if (!coder) {
      throw new Error('Coder agent not found');
    }

    mainLogger.info('Starting implementation phase');

    // This is a simplified implementation
    // In a real system, this would involve multiple iterations
    // of coding, testing, and refinement

    const prompt = getAgentPrompt('coder');
    const formattedPrompt = formatPrompt(prompt, {
      goal: this.context.task.goal,
      context: this.context.task.context,
      requirements: this.context.task.requirements.join(', '),
      specifications: 'Implement according to the plan and research findings',
    });

    const messages = [
      { role: 'system' as const, content: formattedPrompt.system },
      { role: 'user' as const, content: formattedPrompt.task },
    ];

    const model = getRecommendedModel('code')?.id || 'qwen/qwen3-coder:free';

    const response = await performanceLogger.withDuration(
      LogLevel.INFO,
      'Implementation execution',
      async () => {
        return await chat({
          messages,
          model,
          temperature: coder.temperature,
          maxTokens: coder.maxTokens,
        });
      },
      model
    );

    const result = await this.processAgentResponse('coder', response.text);

    if (result.success) {
      this.context.completedPhases.push('implementation');
      mainLogger.info('Implementation phase completed successfully');
    } else {
      throw new Error('Implementation phase failed');
    }
  }

  /**
   * Process agent response and extract artifacts
   */
  private async processAgentResponse(
    agentName: string,
    response: string
  ): Promise<{ success: boolean; artifacts: string[] }> {
    mainLogger.debug(`Processing response from ${agentName}`, {
      responseLength: response.length,
    });

    // Extract code blocks, files, and other artifacts from the response
    const artifacts = this.extractArtifacts(response);

    // Store artifacts in context
    this.context.artifacts.push(...artifacts);

    // Add message to conversation history
    this.context.messages.push({
      role: 'agent',
      content: response,
      agent: agentName,
      timestamp: new Date(),
      metadata: { artifacts: artifacts.length },
    });

    // For now, assume success if we got a response
    // In a real system, this would validate the response quality
    return {
      success: true,
      artifacts,
    };
  }

  /**
   * Extract artifacts (code blocks, files, etc.) from agent response
   */
  private extractArtifacts(response: string): string[] {
    const artifacts: string[] = [];

    // Extract code blocks (```language ... ```)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      const language = match[1] || 'text';
      const code = match[2];
      artifacts.push(`Code block (${language}):\n${code}`);
    }

    // Extract file references
    const fileRegex = /(?:file|File):\s*([^\n\r]+)/g;
    while ((match = fileRegex.exec(response)) !== null) {
      artifacts.push(`File: ${match[1]}`);
    }

    // Extract JSON objects
    const jsonRegex = /(\{[\s\S]*?\})/g;
    while ((match = jsonRegex.exec(response)) !== null) {
      try {
        JSON.parse(match[1]);
        artifacts.push(`JSON: ${match[1]}`);
      } catch {
        // Not valid JSON, skip
      }
    }

    return artifacts;
  }

  /**
   * Generate summary of the build process
   */
  private generateSummary(): string {
    const phases = this.context.completedPhases.length;
    const artifacts = this.context.artifacts.length;
    const errors = this.context.errors.length;

    let summary = `Build completed with ${phases} phases, ${artifacts} artifacts`;

    if (errors > 0) {
      summary += `, and ${errors} errors`;
    }

    summary += '.';

    if (this.context.artifacts.length > 0) {
      summary += `\n\nArtifacts generated:\n${this.context.artifacts.map((art, i) => `${i + 1}. ${art.substring(0, 100)}...`).join('\n')}`;
    }

    return summary;
  }

  /**
   * Get current context
   */
  getContext(): AgentContext {
    return { ...this.context };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): AgentMessage[] {
    return [...this.context.messages];
  }

  /**
   * Add a message to the conversation
   */
  addMessage(message: AgentMessage): void {
    this.context.messages.push(message);
  }

  /**
   * Update task metadata
   */
  updateMetadata(key: string, value: any): void {
    this.context.metadata[key] = value;
  }
}

/**
 * Create and execute a build agent
 */
export async function executeBuild(
  config: AgentConfig,
  task: BuildTask
): Promise<BuildResult> {
  const agent = new BuildAgent(config, task);
  return await agent.execute();
}

/**
 * Create a build agent without executing
 */
export function createBuildAgent(config: AgentConfig, task: BuildTask): BuildAgent {
  return new BuildAgent(config, task);
}
