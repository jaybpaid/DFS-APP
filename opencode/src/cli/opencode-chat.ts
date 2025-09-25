#!/usr/bin/env node

/**
 * OpenCode Chat CLI
 * Interactive chat interface with AI models
 */

import {
  chat,
  ChatMessage,
  ChatOptions,
  chatStream,
  getAvailableModels,
} from '../sdk/openrouter.js';
import { logger } from '../sdk/logging.js';
import { modelManager } from '../sdk/models.js';
import * as readline from 'readline';

interface ChatConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
}

class ChatCLI {
  private rl: readline.Interface;
  private config: ChatConfig;
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.config = {
      model: process.env.OC_DEFAULT_MODEL || modelManager.getPrimary().id,
      temperature: parseFloat(process.env.OC_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OC_MAX_TOKENS || '2048'),
      systemMessage: process.env.OC_SYSTEM_MESSAGE || 'You are a helpful AI assistant.',
    };

    this.setupEventHandlers();
    this.showWelcome();
  }

  private setupEventHandlers(): void {
    this.rl.on('SIGINT', () => {
      logger.info('ChatCLI', 'Received SIGINT, exiting...');
      this.rl.close();
      process.exit(0);
    });
  }

  private showWelcome(): void {
    console.log('\n🤖 OpenCode Chat CLI');
    console.log('='.repeat(50));
    console.log(
      `Available models: ${getAvailableModels()
        .map(m => m.id)
        .join(', ')}`
    );
    console.log(`Current model: ${this.config.model}`);
    console.log(`Temperature: ${this.config.temperature}`);
    console.log(`Max tokens: ${this.config.maxTokens}`);
    console.log('\nCommands:');
    console.log('  /model <model>    - Switch model');
    console.log('  /temp <temp>      - Set temperature (0.0-1.0)');
    console.log('  /tokens <num>     - Set max tokens');
    console.log('  /system <msg>     - Set system message');
    console.log('  /history          - Show conversation history');
    console.log('  /clear            - Clear conversation history');
    console.log('  /help             - Show this help');
    console.log('  /quit             - Exit');
    console.log('  /stream           - Toggle streaming mode');
    console.log('='.repeat(50));
    console.log('');
  }

  private async handleCommand(input: string): Promise<boolean> {
    const parts = input.slice(1).split(' ');
    const command = parts[0];
    const args = parts.slice(1).join(' ');

    switch (command) {
      case 'model':
        if (args) {
          if (modelManager.hasModel(args)) {
            this.config.model = args;
            console.log(`✅ Switched to model: ${args}`);
          } else {
            console.log(`❌ Model not available: ${args}`);
            console.log(
              `Available models: ${getAvailableModels()
                .map(m => m.id)
                .join(', ')}`
            );
          }
        } else {
          console.log(`Current model: ${this.config.model}`);
        }
        return true;

      case 'temp':
        if (args) {
          const temp = parseFloat(args);
          if (temp >= 0 && temp <= 1) {
            this.config.temperature = temp;
            console.log(`✅ Set temperature to: ${temp}`);
          } else {
            console.log('❌ Temperature must be between 0.0 and 1.0');
          }
        } else {
          console.log(`Current temperature: ${this.config.temperature}`);
        }
        return true;

      case 'tokens':
        if (args) {
          const tokens = parseInt(args);
          if (tokens > 0) {
            this.config.maxTokens = tokens;
            console.log(`✅ Set max tokens to: ${tokens}`);
          } else {
            console.log('❌ Max tokens must be greater than 0');
          }
        } else {
          console.log(`Current max tokens: ${this.config.maxTokens}`);
        }
        return true;

      case 'system':
        if (args) {
          this.config.systemMessage = args;
          console.log('✅ System message updated');
        } else {
          console.log(`Current system message: ${this.config.systemMessage}`);
        }
        return true;

      case 'history':
        console.log('\n📜 Conversation History:');
        console.log('='.repeat(30));
        this.conversationHistory.forEach((msg, i) => {
          console.log(
            `${i + 1}. [${msg.role.toUpperCase()}] ${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}`
          );
        });
        console.log('='.repeat(30));
        return true;

      case 'clear':
        this.conversationHistory = [];
        console.log('✅ Conversation history cleared');
        return true;

      case 'help':
        this.showWelcome();
        return true;

      case 'quit':
        console.log('👋 Goodbye!');
        this.rl.close();
        process.exit(0);
        return true;

      default:
        console.log(`❌ Unknown command: /${command}`);
        console.log('Type /help for available commands');
        return true;
    }
  }

  private buildMessages(userInput: string): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Add system message if set
    if (this.config.systemMessage) {
      messages.push({
        role: 'system',
        content: this.config.systemMessage,
      });
    }

    // Add conversation history (excluding system messages for context)
    const historyForContext = this.conversationHistory.filter(
      msg => msg.role !== 'system'
    );
    messages.push(...historyForContext);

    // Add current user input
    messages.push({
      role: 'user',
      content: userInput,
    });

    return messages;
  }

  private async sendMessage(userInput: string): Promise<void> {
    try {
      const messages = this.buildMessages(userInput);

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userInput,
      });

      console.log(`🤖 Thinking... (using ${this.config.model})`);

      const options: ChatOptions = {
        messages,
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      };

      const response = await chat(options);

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.text,
      });

      console.log(`\n🤖 ${response.text}\n`);
    } catch (error) {
      logger.error('ChatCLI', 'Failed to send message', error);
      console.log(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async sendMessageStream(userInput: string): Promise<void> {
    try {
      const messages = this.buildMessages(userInput);

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userInput,
      });

      console.log(`🤖 Thinking... (using ${this.config.model})`);

      const options: ChatOptions = {
        messages,
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        stream: true,
      };

      let fullResponse = '';

      for await (const chunk of chatStream(options)) {
        if (chunk.text) {
          process.stdout.write(chunk.text);
          fullResponse += chunk.text;
        }
      }

      console.log('\n'); // New line after streaming

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse,
      });
    } catch (error) {
      logger.error('ChatCLI', 'Failed to send streaming message', error);
      console.log(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async start(): Promise<void> {
    console.log('💬 Chat started. Type your message or /help for commands:');

    for await (const line of this.rl) {
      const input = line.trim();

      if (!input) {
        console.log('💬 Type your message or /help for commands:');
        continue;
      }

      if (input.startsWith('/')) {
        await this.handleCommand(input);
        console.log('\n💬 Type your message or /help for commands:');
      } else {
        await this.sendMessage(input);
        console.log('💬 Type your message or /help for commands:');
      }
    }
  }
}

// CLI entry point
async function main() {
  try {
    const chatCLI = new ChatCLI();
    await chatCLI.start();
  } catch (error) {
    logger.error('ChatCLI', 'Fatal error', error);
    console.error(
      'Fatal error:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', error => {
  logger.error('ChatCLI', 'Uncaught exception', error);
  console.error('Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('ChatCLI', `Unhandled rejection at ${promise}: ${reason}`);
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}
