#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  McpError,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  CallToolResponse,
} from '@modelcontextprotocol/sdk/types.js';

// Import the core functionality
import { OpenCodeOrchestrator } from './core/orchestrator.js';
import { Planner } from './agents/planner.js';
import { Researcher } from './agents/researcher.js';
import { Coder } from './agents/coder.js';
import { Tester } from './agents/tester.js';
import { Refactorer } from './agents/refactorer.js';
import { Docs } from './agents/docs.js';
import { N8n } from './agents/n8n.js';

// Function to get available models from environment
function getAvailableModels(): string[] {
  const modelList = process.env.OPENROUTER_MODEL_LIST;
  if (!modelList) {
    console.error('Warning: OPENROUTER_MODEL_LIST not found in environment');
    return [];
  }
  return modelList.split(',').map(model => model.trim());
}

class OpenCodeMCPServer {
  private server: Server;
  private orchestrator: OpenCodeOrchestrator;
  private agents: {
    planner: Planner;
    researcher: Researcher;
    coder: Coder;
    tester: Tester;
    refactorer: Refactorer;
    docs: Docs;
    n8n: N8n;
  };
  private models: string[];

  constructor() {
    this.models = getAvailableModels();
    this.server = new Server(
      {
        name: 'opencode-multi',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.orchestrator = new OpenCodeOrchestrator();
    this.agents = {
      planner: new Planner(this.orchestrator),
      researcher: new Researcher(this.orchestrator),
      coder: new Coder(this.orchestrator),
      tester: new Tester(this.orchestrator),
      refactorer: new Refactorer(this.orchestrator),
      docs: new Docs(this.orchestrator),
      n8n: new N8n(this.orchestrator),
    };

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'opencode_run',
            description: 'Execute a complete multi-agent build cycle for a goal',
            inputSchema: {
              type: 'object',
              properties: {
                goal: {
                  type: 'string',
                  description:
                    'The goal to accomplish (e.g., "Add a health check endpoint")',
                },
                repo: {
                  type: 'string',
                  description: 'Path to the repository',
                },
                model: {
                  type: 'string',
                  description: 'OpenRouter model to use (auto for rotation)',
                  enum: ['auto', ...this.models],
                },
              },
              required: ['goal', 'repo'],
            },
          },
          {
            name: 'opencode_chat',
            description: 'Interactive chat with OpenCode multi-agent system',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The chat prompt',
                },
                model: {
                  type: 'string',
                  description: 'OpenRouter model to use (auto for rotation)',
                  enum: ['auto', ...this.models],
                },
                stream: {
                  type: 'boolean',
                  description: 'Whether to stream the response',
                  default: false,
                },
              },
              required: ['prompt'],
            },
          },
          {
            name: 'opencode_planner',
            description: 'Generate a step-by-step plan for a development task',
            inputSchema: {
              type: 'object',
              properties: {
                goal: {
                  type: 'string',
                  description: 'The goal to plan for',
                },
                context: {
                  type: 'string',
                  description: 'Additional context about the project',
                },
              },
              required: ['goal'],
            },
          },
          {
            name: 'opencode_researcher',
            description: 'Research and gather information about code and APIs',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'What to research',
                },
                repoPath: {
                  type: 'string',
                  description: 'Repository path to analyze',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'opencode_coder',
            description: 'Generate or modify code based on requirements',
            inputSchema: {
              type: 'object',
              properties: {
                task: {
                  type: 'string',
                  description: 'Coding task description',
                },
                files: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Files to work with',
                },
                model: {
                  type: 'string',
                  description: 'Model to use',
                  enum: ['auto', ...this.models],
                },
              },
              required: ['task'],
            },
          },
          {
            name: 'opencode_tester',
            description: 'Test code and run validation checks',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Code to test',
                },
                language: {
                  type: 'string',
                  description: 'Programming language',
                },
              },
              required: ['code'],
            },
          },
          {
            name: 'opencode_refactorer',
            description: 'Refactor and improve existing code',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Code to refactor',
                },
                type: {
                  type: 'string',
                  description: 'Type of refactoring needed',
                },
                language: {
                  type: 'string',
                  description: 'Programming language',
                },
              },
              required: ['code'],
            },
          },
          {
            name: 'opencode_docs',
            description: 'Generate documentation and usage examples',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'Content to document',
                },
                type: {
                  type: 'string',
                  description: 'Type of documentation (README, API, inline)',
                },
              },
              required: ['content'],
            },
          },
          {
            name: 'opencode_n8n_workflow',
            description: 'Generate N8N workflow for API integrations',
            inputSchema: {
              type: 'object',
              properties: {
                api: {
                  type: 'string',
                  description: 'API to integrate',
                },
                endpoints: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'API endpoints to cover',
                },
              },
              required: ['api'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'opencode_chat':
          return await this.handleChat(args as any);
        case 'opencode_run':
          return await this.handleRun(args as any);
        case 'opencode_planner':
          return await this.handlePlanner(args as any);
        case 'opencode_researcher':
          return await this.handleResearcher(args as any);
        case 'opencode_coder':
          return await this.handleCoder(args as any);
        case 'opencode_tester':
          return await this.handleTester(args as any);
        case 'opencode_refactorer':
          return await this.handleRefactorer(args as any);
        case 'opencode_docs':
          return await this.handleDocs(args as any);
        case 'opencode_n8n_workflow':
          return await this.handleN8nWorkflow(args as any);
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    });
  }

  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'opencode://models',
            name: 'Available OpenRouter Models',
            description: 'List of configured models for OpenCode',
            mimeType: 'application/json',
          },
          {
            uri: 'opencode://status',
            name: 'OpenCode System Status',
            description: 'Current status and configuration of the system',
            mimeType: 'application/json',
          },
          {
            uri: 'opencode://prompts',
            name: 'Agent Prompts',
            description: 'Built-in prompts for each agent type',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;

      switch (uri) {
        case 'opencode://models':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    models: this.models,
                    default: 'auto',
                    description: 'OpenRouter models configured for rotation',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        case 'opencode://status':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    status: 'active',
                    version: '1.0.0',
                    agents: Object.keys(this.agents),
                    models: this.models.length,
                    endpoint: process.env.N8N_BASE_URL || 'not configured',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        case 'opencode://prompts':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    planner: 'Generate a detailed step-by-step plan',
                    coder: 'Write clean, efficient, and well-documented code',
                    tester: 'Ensure code quality and reliability',
                    refactorer: 'Improve code structure and maintainability',
                    docs: 'Create comprehensive documentation',
                    researcher: 'Gather and analyze information effectively',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        default:
          throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
      }
    });
  }

  private async handleChat(args: {
    prompt: string;
    model?: string;
    stream?: boolean;
  }): Promise<CallToolResponse['result']> {
    const { prompt, model = 'auto', stream = false } = args;
    // Implementation would orchestrate chat through agents
    return {
      content: [
        {
          type: 'text',
          text: `Chat response for: "${prompt}" using model: ${model} (stream: ${stream})`,
        },
      ],
    };
  }

  private async handleRun(args: {
    goal: string;
    repo: string;
    model?: string;
  }): Promise<CallToolResponse['result']> {
    const { goal, repo, model = 'auto' } = args;
    // Implementation would execute full orchestration
    return {
      content: [
        {
          type: 'text',
          text: `Executing goal: "${goal}" in repo: ${repo} with model: ${model}`,
        },
      ],
    };
  }

  private async handlePlanner(args: {
    goal: string;
    context?: string;
  }): Promise<CallToolResponse['result']> {
    const { goal, context } = args;
    // Would use planner agent
    return {
      content: [
        {
          type: 'text',
          text: `Planning goal: "${goal}"\nContext: ${context || 'none'}`,
        },
      ],
    };
  }

  private async handleResearcher(args: {
    query: string;
    repoPath?: string;
  }): Promise<CallToolResponse['result']> {
    const { query, repoPath } = args;
    // Would use researcher agent
    return {
      content: [
        {
          type: 'text',
          text: `Researching: "${query}"${repoPath ? ` in ${repoPath}` : ''}`,
        },
      ],
    };
  }

  private async handleCoder(args: {
    task: string;
    files?: string[];
    model?: string;
  }): Promise<CallToolResponse['result']> {
    const { task, files = [], model = 'auto' } = args;
    // Would use coder agent
    return {
      content: [
        {
          type: 'text',
          text: `Coding task: "${task}"\nFiles: ${files.join(', ') || 'none'}\nModel: ${model}`,
        },
      ],
    };
  }

  private async handleTester(args: {
    code: string;
    language: string;
  }): Promise<CallToolResponse['result']> {
    const { code, language } = args;
    // Would use tester agent
    return {
      content: [
        {
          type: 'text',
          text: `Testing code in ${language}\nCode length: ${code.length} characters`,
        },
      ],
    };
  }

  private async handleRefactorer(args: {
    code: string;
    type: string;
    language: string;
  }): Promise<CallToolResponse['result']> {
    const { code, type, language } = args;
    // Would use refactorer agent
    return {
      content: [
        {
          type: 'text',
          text: `Refactoring type: ${type} in ${language}\nCode length: ${code.length} characters`,
        },
      ],
    };
  }

  private async handleDocs(args: {
    content: string;
    type: string;
  }): Promise<CallToolResponse['result']> {
    const { content, type } = args;
    // Would use docs agent
    return {
      content: [
        {
          type: 'text',
          text: `Generating ${type} documentation for ${content.length} characters`,
        },
      ],
    };
  }

  private async handleN8nWorkflow(args: {
    api: string;
    endpoints?: string[];
  }): Promise<CallToolResponse['result']> {
    const { api, endpoints = [] } = args;
    // Would use n8n agent
    return {
      content: [
        {
          type: 'text',
          text: `Generating N8N workflow for ${api}\nEndpoints: ${endpoints.join(', ') || 'auto-detect'}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('OpenCode MCP Server running...');
  }
}

// Start the server
const server = new OpenCodeMCPServer();
server.run().catch(console.error);
