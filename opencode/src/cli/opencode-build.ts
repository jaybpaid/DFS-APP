#!/usr/bin/env node

/**
 * OpenCode Build CLI
 * AI-powered code generation and project building
 */

import { planAndBuild, BuildOptions } from '../agent/buildAgent.js';
import { logger } from '../sdk/logging.js';
import { modelManager } from '../sdk/models.js';
import { fileOps } from '../agent/fileOps.js';

interface BuildConfig {
  goal: string;
  repoDir: string;
  maxIterations?: number;
  temperature?: number;
  maxTokens?: number;
  output?: string;
}

class BuildCLI {
  private config: BuildConfig;

  constructor() {
    this.config = {
      goal: '',
      repoDir: process.cwd(),
      maxIterations: parseInt(process.env.AGENT_MAX_ITER || '3'),
      temperature: parseFloat(process.env.OC_TEMPERATURE || '0.2'),
      maxTokens: parseInt(process.env.OC_MAX_TOKENS || '2048'),
      output: process.env.BUILD_OUTPUT || 'build.log',
    };
  }

  private showHelp(): void {
    console.log('\n🔨 OpenCode Build CLI');
    console.log('='.repeat(50));
    console.log('AI-powered code generation and project building');
    console.log('');
    console.log('Usage:');
    console.log('  opencode-build <goal> [options]');
    console.log('');
    console.log('Examples:');
    console.log('  opencode-build "Add user authentication to the web app"');
    console.log('  opencode-build "Create a REST API for user management"');
    console.log('  opencode-build "Implement dark mode toggle"');
    console.log('  opencode-build "Add unit tests for the calculator module"');
    console.log('');
    console.log('Options:');
    console.log('  --dir <path>      - Target directory (default: current directory)');
    console.log('  --iterations <n>  - Max AI iterations (default: 3)');
    console.log('  --temp <temp>     - AI temperature (default: 0.2)');
    console.log('  --tokens <num>    - Max tokens per request (default: 2048)');
    console.log('  --output <file>   - Log output file (default: build.log)');
    console.log('  --help            - Show this help');
    console.log('');
    console.log('Environment Variables:');
    console.log('  OPENROUTER_API_KEY - Required: Your OpenRouter API key');
    console.log('  OPENROUTER_MODEL_LIST - Comma-separated list of allowed models');
    console.log('  AGENT_MAX_ITER        - Max AI iterations (default: 3)');
    console.log('  OC_TEMPERATURE        - AI temperature (default: 0.2)');
    console.log('  OC_MAX_TOKENS         - Max tokens per request (default: 2048)');
    console.log('  BUILD_OUTPUT          - Log output file (default: build.log)');
    console.log('='.repeat(50));
  }

  private parseArgs(args: string[]): void {
    if (args.length === 0) {
      this.showHelp();
      process.exit(0);
    }

    // First argument is the goal
    this.config.goal = args[0];

    // Parse options
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case '--dir':
          if (nextArg) {
            this.config.repoDir = nextArg;
            i++;
          }
          break;
        case '--iterations':
          if (nextArg) {
            this.config.maxIterations = parseInt(nextArg);
            i++;
          }
          break;
        case '--temp':
          if (nextArg) {
            this.config.temperature = parseFloat(nextArg);
            i++;
          }
          break;
        case '--tokens':
          if (nextArg) {
            this.config.maxTokens = parseInt(nextArg);
            i++;
          }
          break;
        case '--output':
          if (nextArg) {
            this.config.output = nextArg;
            i++;
          }
          break;
        case '--help':
          this.showHelp();
          process.exit(0);
          break;
        default:
          console.log(`❌ Unknown option: ${arg}`);
          console.log('Use --help for usage information');
          process.exit(1);
      }
    }

    // Validate required arguments
    if (!this.config.goal) {
      console.log('❌ Goal is required');
      console.log('Use --help for usage information');
      process.exit(1);
    }
  }

  private validateEnvironment(): void {
    const requiredEnvVars = ['OPENROUTER_API_KEY', 'OPENROUTER_MODEL_LIST'];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missing.length > 0) {
      console.log('❌ Missing required environment variables:');
      missing.forEach(envVar => console.log(`   - ${envVar}`));
      console.log('');
      console.log('Please set these environment variables and try again.');
      process.exit(1);
    }
  }

  private validateDirectory(): void {
    if (!fileOps.fileExists(this.config.repoDir)) {
      console.log(`❌ Directory does not exist: ${this.config.repoDir}`);
      process.exit(1);
    }

    // Check if it's a git repository or has package.json
    const isGitRepo = fileOps.fileExists(`${this.config.repoDir}/.git`);
    const hasPackageJson = fileOps.fileExists(`${this.config.repoDir}/package.json`);

    if (!isGitRepo && !hasPackageJson) {
      console.log('⚠️  Warning: Directory does not appear to be a project');
      console.log('   (no .git directory or package.json found)');
    }
  }

  private showBuildInfo(): void {
    console.log('\n🔨 Build Configuration');
    console.log('='.repeat(30));
    console.log(`Goal: ${this.config.goal}`);
    console.log(`Target Directory: ${this.config.repoDir}`);
    console.log(`Max Iterations: ${this.config.maxIterations}`);
    console.log(`Temperature: ${this.config.temperature}`);
    console.log(`Max Tokens: ${this.config.maxTokens}`);
    console.log(`Output Log: ${this.config.output}`);
    console.log(
      `Available Models: ${modelManager
        .getModels()
        .map(m => m.id)
        .join(', ')}`
    );
    console.log('='.repeat(30));
    console.log('');
  }

  private async runBuild(): Promise<void> {
    console.log('🚀 Starting AI-powered build...');
    console.log(
      'This may take several minutes depending on the complexity of your request.\n'
    );

    const startTime = Date.now();

    try {
      const buildOptions: BuildOptions = {
        goal: this.config.goal,
        repoDir: this.config.repoDir,
        maxIterations: this.config.maxIterations,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      };

      const result = await planAndBuild(buildOptions);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (result.success) {
        console.log(`\n✅ Build completed successfully in ${duration}s!`);
        console.log('🎉 Your code has been generated and applied to your project.');
      } else {
        console.log(
          `\n❌ Build completed with ${result.errors.length} errors in ${duration}s:`
        );
        result.errors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });
        console.log(
          '\nSome changes may have been applied. Check the output log for details.'
        );
      }

      // Save log output
      if (this.config.output) {
        const logContent = [
          `Build Log - ${new Date().toISOString()}`,
          `Goal: ${this.config.goal}`,
          `Duration: ${duration}s`,
          `Success: ${result.success}`,
          `Errors: ${result.errors.length}`,
          '',
          'Errors:',
          ...result.errors.map((error, i) => `  ${i + 1}. ${error}`),
          '',
          'Configuration:',
          `  Directory: ${this.config.repoDir}`,
          `  Max Iterations: ${this.config.maxIterations}`,
          `  Temperature: ${this.config.temperature}`,
          `  Max Tokens: ${this.config.maxTokens}`,
        ].join('\n');

        fileOps.writeFile(this.config.output, logContent);
        console.log(`📝 Build log saved to: ${this.config.output}`);
      }
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n💥 Build failed after ${duration}s:`);
      console.log(`   ${error instanceof Error ? error.message : String(error)}`);

      // Save error log
      if (this.config.output) {
        const logContent = [
          `Build Error Log - ${new Date().toISOString()}`,
          `Goal: ${this.config.goal}`,
          `Duration: ${duration}s`,
          `Error: ${error instanceof Error ? error.message : String(error)}`,
          '',
          'Configuration:',
          `  Directory: ${this.config.repoDir}`,
          `  Max Iterations: ${this.config.maxIterations}`,
          `  Temperature: ${this.config.temperature}`,
          `  Max Tokens: ${this.config.maxTokens}`,
        ].join('\n');

        fileOps.writeFile(this.config.output, logContent);
        console.log(`📝 Error log saved to: ${this.config.output}`);
      }

      process.exit(1);
    }
  }

  public async execute(args: string[]): Promise<void> {
    this.parseArgs(args);
    this.validateEnvironment();
    this.validateDirectory();
    this.showBuildInfo();
    await this.runBuild();
  }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  try {
    const buildCLI = new BuildCLI();
    await buildCLI.execute(args);
  } catch (error) {
    logger.error('BuildCLI', 'Fatal error', error);
    console.error(
      'Fatal error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', error => {
  logger.error('BuildCLI', 'Uncaught exception', error);
  console.error('Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('BuildCLI', `Unhandled rejection at ${promise}: ${reason}`);
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}
