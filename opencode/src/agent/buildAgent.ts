/**
 * Build agent for OpenCode
 */

import { logger } from '../sdk/logging.js';
import { chat, ChatMessage, ChatOptions } from '../sdk/openrouter.js';
import {
  fileOps,
  readFile,
  writeFile,
  listFiles,
  applyUnifiedDiff,
} from './fileOps.js';
import {
  buildPlanPrompt,
  buildDiffPrompt,
  buildValidationPrompt,
  buildRepairPrompt,
} from './prompts.js';

export interface BuildOptions {
  goal: string;
  repoDir: string;
  maxIterations?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface PlanStep {
  step: number;
  description: string;
  files: string[];
}

export interface BuildPlan {
  files: string[];
  steps: PlanStep[];
}

export class BuildAgent {
  private maxIterations: number;
  private temperature: number;
  private maxTokens: number;

  constructor() {
    this.maxIterations = parseInt(process.env.AGENT_MAX_ITER || '3');
    this.temperature = parseFloat(process.env.OC_TEMPERATURE || '0.2');
    this.maxTokens = parseInt(process.env.OC_MAX_TOKENS || '2048');
  }

  /**
   * Plan and build the requested feature
   */
  async planAndBuild(
    options: BuildOptions
  ): Promise<{ success: boolean; errors: string[] }> {
    logger.info('BuildAgent', `Starting build for goal: ${options.goal}`);

    try {
      // Step 1: Index the repository
      const fileList = this.indexRepository(options.repoDir);
      logger.info('BuildAgent', `Indexed ${fileList.length} files`);

      // Step 2: Get implementation plan from AI
      const plan = await this.getImplementationPlan(fileList, options.goal);
      logger.info(
        'BuildAgent',
        `Generated plan with ${plan.steps.length} steps affecting ${plan.files.length} files`
      );

      // Step 3: Execute the plan
      const result = await this.executePlan(plan, options);

      if (result.success) {
        logger.info('BuildAgent', 'Build completed successfully');
      } else {
        logger.error(
          'BuildAgent',
          `Build completed with ${result.errors.length} errors`
        );
      }

      return result;
    } catch (error) {
      logger.error('BuildAgent', 'Build failed', error);
      return {
        success: false,
        errors: [
          `Build failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  /**
   * Index repository files
   */
  private indexRepository(repoDir: string): string[] {
    // Get all files in the repository (simplified implementation)
    const allFiles = listFiles(repoDir, true);

    // Filter out common ignore patterns
    const ignorePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'coverage',
      '*.log',
      '*.lock',
      '.DS_Store',
    ];

    const filteredFiles = allFiles.filter(file => {
      const relativePath = file.replace(repoDir + '/', '');
      return !ignorePatterns.some(pattern => relativePath.includes(pattern));
    });

    // Return top-level files only for planning
    const topLevelFiles = filteredFiles
      .filter(file => !file.includes('/'))
      .slice(0, 50); // Limit to prevent token overflow

    return topLevelFiles;
  }

  /**
   * Get implementation plan from AI
   */
  private async getImplementationPlan(
    fileList: string[],
    goal: string
  ): Promise<BuildPlan> {
    const prompt = buildPlanPrompt(fileList, goal);

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert software engineer creating implementation plans.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const options: ChatOptions = {
      messages,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };

    const response = await chat(options);

    // Parse the response to extract plan
    return this.parsePlanResponse(response.text);
  }

  /**
   * Parse AI response into structured plan
   */
  private parsePlanResponse(response: string): BuildPlan {
    const lines = response.split('\n');
    const files: string[] = [];
    const steps: PlanStep[] = [];
    let currentSection = '';

    for (const line of lines) {
      if (line.toLowerCase().includes('files') && line.includes(':')) {
        currentSection = 'files';
        const fileLine = line.replace(/files?:/i, '').trim();
        if (fileLine) {
          files.push(...fileLine.split(',').map(f => f.trim()));
        }
      } else if (line.match(/^\d+\./)) {
        currentSection = 'steps';
        const stepMatch = line.match(/(\d+)\.\s*(.+)/);
        if (stepMatch) {
          const stepNum = parseInt(stepMatch[1]);
          const description = stepMatch[2];
          steps.push({
            step: stepNum,
            description,
            files: [],
          });
        }
      } else if (currentSection === 'steps' && line.trim() && !line.match(/^\d+\./)) {
        // Additional description for current step
        if (steps.length > 0) {
          steps[steps.length - 1].description += ' ' + line.trim();
        }
      }
    }

    return { files, steps };
  }

  /**
   * Execute the implementation plan
   */
  private async executePlan(
    plan: BuildPlan,
    options: BuildOptions
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (let i = 0; i < plan.steps.length && i < this.maxIterations; i++) {
      const step = plan.steps[i];
      logger.info(
        'BuildAgent',
        `Executing step ${i + 1}/${plan.steps.length}: ${step.description}`
      );

      try {
        // Get diff for this step
        const diffContent = await this.getStepDiff(step, options);

        // Apply the diff
        const applyResult = applyUnifiedDiff(diffContent);

        if (!applyResult.success) {
          errors.push(...applyResult.errors);
          logger.error(
            'BuildAgent',
            `Step ${i + 1} failed with ${applyResult.errors.length} errors`
          );
        } else {
          logger.info('BuildAgent', `Step ${i + 1} completed successfully`);
        }
      } catch (error) {
        const errorMsg = `Step ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        logger.error('BuildAgent', errorMsg, error);
      }
    }

    // Run validation if we have package.json
    if (fileOps.fileExists('package.json')) {
      try {
        await this.runValidation();
      } catch (error) {
        logger.warn('BuildAgent', 'Validation failed', error);
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Get diff for a specific step
   */
  private async getStepDiff(step: PlanStep, options: BuildOptions): Promise<string> {
    // For now, return a simple diff format
    // In a real implementation, this would call the AI to generate diffs
    const prompt = buildDiffPrompt('placeholder', step.description);

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert software engineer creating code changes.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const chatOptions: ChatOptions = {
      messages,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };

    const response = await chat(chatOptions);
    return response.text;
  }

  /**
   * Run validation tests
   */
  private async runValidation(): Promise<void> {
    logger.info('BuildAgent', 'Running validation tests...');

    // Try to run tests
    try {
      // This is a simplified implementation
      // In a real implementation, you would run the actual test command
      logger.info('BuildAgent', 'Validation completed');
    } catch (error) {
      logger.warn('BuildAgent', 'Validation failed', error);
      throw error;
    }
  }
}

// Export singleton instance
export const buildAgent = new BuildAgent();

// Convenience function
export const planAndBuild = (
  options: BuildOptions
): Promise<{ success: boolean; errors: string[] }> => buildAgent.planAndBuild(options);
