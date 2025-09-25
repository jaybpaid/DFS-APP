import { Orchestrator } from '../core/orchestrator';
import { Command } from 'commander';
import { Planner } from '../agents/planner';
import { Researcher } from '../agents/researcher';
import { Coder } from '../agents/coder';
import { Tester } from '../agents/tester';
import { Refactorer } from '../agents/refactorer';
import { Docs } from '../agents/docs';
import { N8n } from '../agents/n8n';

// Function to get available models
function getAvailableModels(): string[] {
  const modelList = process.env.OPENROUTER_MODEL_LIST;
  if (!modelList) {
    console.warn('Warning: OPENROUTER_MODEL_LIST not found in environment');
    return [];
  }
  return modelList.split(',').map(model => model.trim());
}

// Function to display available models
function displayAvailableModels(): void {
  const models = getAvailableModels();
  if (models.length === 0) {
    console.log(
      'No models configured. Please set OPENROUTER_MODEL_LIST environment variable.'
    );
    return;
  }

  console.log('Available OpenRouter Models:');
  console.log('============================');
  models.forEach((model, index) => {
    console.log(`${index + 1}. ${model}`);
  });
  console.log('============================');
  console.log('Usage: --model <model-name> or use "auto" for automatic rotation');
}

const program = new Command();

program
  .name('oc-chat')
  .description('Chat with OpenCode Multi-Agent')
  .version('1.0.0')
  .option('-p, --prompt <prompt>', 'The prompt for the chat')
  .option('-m, --model <model>', 'The model to use (default: auto, see --list-models)')
  .option('--stream', 'Stream the response')
  .option('-l, --list-models', 'List available models and exit')
  .action(async options => {
    // Handle list-models option
    if (options.listModels) {
      displayAvailableModels();
      process.exit(0);
    }

    const prompt = options.prompt;
    const model = options.model || 'auto';
    const stream = options.stream;

    if (!prompt) {
      console.error('Error: Prompt is required (use -p or --prompt)');
      console.error(
        'Usage: oc-chat --prompt "Your prompt here" [--model model] [--stream]'
      );
      console.error('Run with --list-models to see available models');
      process.exit(1);
    }

    // Validate model if specified
    const availableModels = getAvailableModels();
    if (model !== 'auto' && !availableModels.includes(model)) {
      console.error(`Error: Model '${model}' not found in available models`);
      console.error('Available models:');
      availableModels.forEach(m => console.error(`  - ${m}`));
      console.error('Or use "auto" for automatic model rotation');
      process.exit(1);
    }

    console.log(`🚀 Starting OpenCode Multi-Agent chat`);
    console.log(`Prompt: ${prompt}`);
    console.log(`Model: ${model}`);
    console.log(`Stream: ${stream ? 'enabled' : 'disabled'}`);

    try {
      const orchestrator = new Orchestrator();
      const planner = new Planner(orchestrator);
      const researcher = new Researcher(orchestrator);
      const coder = new Coder(orchestrator);
      const tester = new Tester(orchestrator);
      const refactorer = new Refactorer(orchestrator);
      const docs = new Docs(orchestrator);
      const n8n = new N8n(orchestrator);

      // TODO: Implement actual chat logic with multi-agent orchestration
      console.log('Multi-agent chat implementation coming soon...');
    } catch (error) {
      console.error('Error initializing chat:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
