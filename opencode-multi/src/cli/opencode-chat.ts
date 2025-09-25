#!/usr/bin/env node

/**
 * OpenCode Chat CLI - Interactive chat interface for code generation
 */

import * as readline from 'readline';
import { chat, chatStream } from '../sdk/openrouter';
import { rateLimiter } from '../sdk/rateLimiter';
import { modelManager, getRecommendedModel } from '../sdk/models';
import { mainLogger } from '../sdk/logging';
import { executeBuild, createBuildTask, AgentConfig } from '../index';

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  interactive?: boolean;
}

class ChatCLI {
  private rl: readline.Interface;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
    [];
  private options: ChatOptions;

  constructor(options: ChatOptions = {}) {
    this.options = {
      model:
        options.model ||
        getRecommendedModel('chat')?.id ||
        'anthropic/claude-3.5-sonnet',
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 2048,
      systemPrompt: options.systemPrompt || 'You are a helpful coding assistant.',
      interactive: options.interactive ?? true,
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Start the chat interface
   */
  async start(): Promise<void> {
    console.log('🤖 OpenCode Chat CLI');
    console.log('Type "help" for commands, "quit" to exit\n');

    if (this.options.interactive) {
      await this.interactiveChat();
    } else {
      await this.singleQuery();
    }
  }

  /**
   * Interactive chat loop
   */
  private async interactiveChat(): Promise<void> {
    const askQuestion = (query: string): Promise<string> => {
      return new Promise(resolve => {
        this.rl.question(query, resolve);
      });
    };

    while (true) {
      try {
        const userInput = await askQuestion('> ');

        if (userInput.toLowerCase() === 'quit' || userInput.toLowerCase() === 'exit') {
          console.log('Goodbye! 👋');
          break;
        }

        if (userInput.toLowerCase() === 'help') {
          this.showHelp();
          continue;
        }

        if (userInput.toLowerCase() === 'clear') {
          this.conversationHistory = [];
          console.log('Conversation history cleared.');
          continue;
        }

        if (userInput.toLowerCase() === 'build') {
          await this.handleBuildCommand();
          continue;
        }

        await this.processMessage(userInput);
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
      }
    }

    this.rl.close();
  }

  /**
   * Process a single message
   */
  private async processMessage(message: string): Promise<void> {
    try {
      mainLogger.info('Processing chat message', { messageLength: message.length });

      const messages = [
        { role: 'system' as const, content: this.options.systemPrompt! },
        ...this.conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user' as const, content: message },
      ];

      console.log('🤔 Thinking...');

      const response = await chat({
        messages,
        model: this.options.model!,
        temperature: this.options.temperature!,
        maxTokens: this.options.maxTokens!,
      });

      console.log('\n🤖 Assistant:');
      console.log(response.text);
      console.log('');

      // Add to conversation history
      this.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response.text }
      );

      // Keep only last 10 exchanges to avoid token limits
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }
    } catch (error) {
      console.error(
        '❌ Error:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Handle build command
   */
  private async handleBuildCommand(): Promise<void> {
    console.log('\n🔨 Build Mode');
    console.log('Enter your build requirements:');

    const askQuestion = (query: string): Promise<string> => {
      return new Promise(resolve => {
        this.rl.question(query, resolve);
      });
    };

    const goal = await askQuestion('Goal: ');
    const context = await askQuestion('Context (optional): ');
    const requirementsInput = await askQuestion(
      'Requirements (comma-separated, optional): '
    );

    const requirements = requirementsInput
      .split(',')
      .map(req => req.trim())
      .filter(req => req.length > 0);

    const task = createBuildTask(goal, context, requirements);

    console.log('\n🚀 Starting build process...');

    try {
      const agentConfig: AgentConfig = {
        name: 'cli-builder',
        description: 'CLI build agent',
        capabilities: ['coding', 'planning', 'research'],
        maxIterations: 5,
        temperature: 0.2,
        maxTokens: 4096,
      };

      const result = await executeBuild(agentConfig, task);

      if (result.success) {
        console.log('\n✅ Build completed successfully!');
        console.log(`📦 Generated ${result.artifacts.length} artifacts`);
        console.log(`⏱️  Duration: ${result.metrics.duration}ms`);

        if (result.artifacts.length > 0) {
          console.log('\n📋 Artifacts:');
          result.artifacts.forEach((artifact: string, index: number) => {
            console.log(`  ${index + 1}. ${artifact.substring(0, 100)}...`);
          });
        }
      } else {
        console.log('\n❌ Build failed:');
        console.log(result.summary);
      }
    } catch (error) {
      console.error(
        '❌ Build error:',
        error instanceof Error ? error.message : String(error)
      );
    }

    console.log('');
  }

  /**
   * Single query mode (for non-interactive use)
   */
  private async singleQuery(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.error('Error: Please provide a message');
      process.exit(1);
    }

    const message = args.join(' ');
    await this.processMessage(message);
    this.rl.close();
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log('\n📚 Available Commands:');
    console.log('  help    - Show this help message');
    console.log('  clear   - Clear conversation history');
    console.log('  build   - Enter build mode');
    console.log('  quit    - Exit the chat');
    console.log('\n💡 Tips:');
    console.log('  - Ask me to write code, debug issues, or explain concepts');
    console.log('  - Use "build" command for structured code generation');
    console.log('  - Conversation history is maintained automatically');
    console.log('');
  }

  /**
   * Parse command line arguments
   */
  static parseArgs(): ChatOptions {
    const args = process.argv.slice(2);
    const options: ChatOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--model':
        case '-m':
          options.model = args[++i];
          break;
        case '--temperature':
        case '-t':
          options.temperature = parseFloat(args[++i]);
          break;
        case '--max-tokens':
          options.maxTokens = parseInt(args[++i]);
          break;
        case '--system':
        case '-s':
          options.systemPrompt = args[++i];
          break;
        case '--no-interactive':
        case '-n':
          options.interactive = false;
          break;
        default:
          // If no flag, treat as message for non-interactive mode
          if (!arg.startsWith('-')) {
            options.interactive = false;
          }
          break;
      }
    }

    return options;
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    const options = ChatCLI.parseArgs();
    const chatCLI = new ChatCLI(options);
    await chatCLI.start();
  } catch (error) {
    console.error(
      'Fatal error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { ChatCLI, ChatOptions };
