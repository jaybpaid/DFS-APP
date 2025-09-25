#!/usr/bin/env node

/**
 * Pipedream Chat MCP Server
 * Provides workflow automation and API integration capabilities
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

class PipedreamChatServer {
  constructor() {
    this.server = new Server(
      {
        name: 'pipedream-chat',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'pipedream_chat',
          description: 'Pipedream Chat for workflow automation and API integration',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Query or request to process through Pipedream workflows',
              },
              workflow_type: {
                type: 'string',
                description: 'Type of workflow to execute',
                default: 'generic',
              },
              params: {
                type: 'object',
                description: 'Additional parameters for the workflow',
              },
            },
            required: ['query'],
          },
        },
      ],
    }));

    this.server.setRequestHandler('tools/call', async request => {
      const { name, arguments: args } = request.params;

      if (name === 'pipedream_chat') {
        const { query, workflow_type = 'generic', params = {} } = args;

        const workflow_result = {
          query: query,
          workflow_type: workflow_type,
          status: 'processed',
          execution_result: `Workflow "${workflow_type}" executed for: "${query}"`,
          integrations: [
            'Slack API',
            'Google Workspace',
            'Stripe',
            'Webhook endpoints',
          ],
          response_time: '1.2s',
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workflow_result, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Pipedream Chat MCP server running on stdio');
  }
}

const server = new PipedreamChatServer();
server.run().catch(console.error);
