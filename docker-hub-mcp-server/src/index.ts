#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

class DockerHubMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'docker-hub-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();

    this.server.onerror = error => {
      console.error('[MCP Error]', error);
    };

    process.stdin.on('close', () => {
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'docker_search',
            description: 'Search for Docker images on Docker Hub',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for Docker images',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 10)',
                  default: 10,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'docker_pull',
            description: 'Pull a Docker image from Docker Hub',
            inputSchema: {
              type: 'object',
              properties: {
                image: {
                  type: 'string',
                  description: 'Docker image name (e.g., nginx:latest)',
                },
                tag: {
                  type: 'string',
                  description: 'Image tag (optional, defaults to latest)',
                  default: 'latest',
                },
              },
              required: ['image'],
            },
          },
          {
            name: 'docker_images',
            description: 'List Docker images on the local system',
            inputSchema: {
              type: 'object',
              properties: {
                all: {
                  type: 'boolean',
                  description: 'Show all images (including intermediate)',
                  default: false,
                },
              },
            },
          },
          {
            name: 'docker_ps',
            description: 'List Docker containers',
            inputSchema: {
              type: 'object',
              properties: {
                all: {
                  type: 'boolean',
                  description: 'Show all containers (including stopped)',
                  default: false,
                },
              },
            },
          },
          {
            name: 'docker_run',
            description: 'Run a Docker container',
            inputSchema: {
              type: 'object',
              properties: {
                image: {
                  type: 'string',
                  description: 'Docker image to run',
                },
                name: {
                  type: 'string',
                  description: 'Container name',
                },
                ports: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Port mappings (e.g., ["8080:80"])',
                },
                env: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Environment variables (e.g., ["NODE_ENV=production"])',
                },
                detach: {
                  type: 'boolean',
                  description: 'Run container in background',
                  default: true,
                },
              },
              required: ['image'],
            },
          },
          {
            name: 'docker_stop',
            description: 'Stop a running Docker container',
            inputSchema: {
              type: 'object',
              properties: {
                container: {
                  type: 'string',
                  description: 'Container name or ID to stop',
                },
              },
              required: ['container'],
            },
          },
          {
            name: 'docker_logs',
            description: 'Get logs from a Docker container',
            inputSchema: {
              type: 'object',
              properties: {
                container: {
                  type: 'string',
                  description: 'Container name or ID',
                },
                follow: {
                  type: 'boolean',
                  description: 'Follow log output',
                  default: false,
                },
                tail: {
                  type: 'number',
                  description: 'Number of lines to show from the end',
                  default: 100,
                },
              },
              required: ['container'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'docker_search':
            return await this.handleDockerSearch(args as any);
          case 'docker_pull':
            return await this.handleDockerPull(args as any);
          case 'docker_images':
            return await this.handleDockerImages(args as any);
          case 'docker_ps':
            return await this.handleDockerPs(args as any);
          case 'docker_run':
            return await this.handleDockerRun(args as any);
          case 'docker_stop':
            return await this.handleDockerStop(args as any);
          case 'docker_logs':
            return await this.handleDockerLogs(args as any);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Error calling tool: ${error}`);
      }
    });
  }

  private async handleDockerSearch(args: { query: string; limit?: number }) {
    const { query, limit = 10 } = args;

    try {
      const response = await fetch(
        `https://index.docker.io/v1/search?q=${encodeURIComponent(query)}&n=${limit}`
      );
      const data = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search Docker Hub: ${error}`
      );
    }
  }

  private async handleDockerPull(args: { image: string; tag?: string }) {
    const { image, tag = 'latest' } = args;
    const fullImage = `${image}:${tag}`;

    try {
      const { stdout, stderr } = await execAsync(`docker pull ${fullImage}`);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully pulled ${fullImage}\n\n${stdout}${stderr}`,
          },
        ],
      };
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to pull Docker image: ${error.message}`
      );
    }
  }

  private async handleDockerImages(args: { all?: boolean }) {
    const { all = false } = args;

    try {
      const { stdout } = await execAsync(`docker images${all ? ' -a' : ''}`);
      return {
        content: [
          {
            type: 'text',
            text: stdout,
          },
        ],
      };
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list Docker images: ${error.message}`
      );
    }
  }

  private async handleDockerPs(args: { all?: boolean }) {
    const { all = false } = args;

    try {
      const { stdout } = await execAsync(`docker ps${all ? ' -a' : ''}`);
      return {
        content: [
          {
            type: 'text',
            text: stdout,
          },
        ],
      };
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list Docker containers: ${error.message}`
      );
    }
  }

  private async handleDockerRun(args: {
    image: string;
    name?: string;
    ports?: string[];
    env?: string[];
    detach?: boolean;
  }) {
    const { image, name, ports = [], env = [], detach = true } = args;

    let command = 'docker run';
    if (detach) command += ' -d';
    if (name) command += ` --name ${name}`;
    ports.forEach(port => {
      command += ` -p ${port}`;
    });
    env.forEach(envVar => {
      command += ` -e ${envVar}`;
    });
    command += ` ${image}`;

    try {
      const { stdout, stderr } = await execAsync(command);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully started container\n\n${stdout}${stderr}`,
          },
        ],
      };
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to run Docker container: ${error.message}`
      );
    }
  }

  private async handleDockerStop(args: { container: string }) {
    const { container } = args;

    try {
      const { stdout, stderr } = await execAsync(`docker stop ${container}`);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully stopped container ${container}\n\n${stdout}${stderr}`,
          },
        ],
      };
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to stop Docker container: ${error.message}`
      );
    }
  }

  private async handleDockerLogs(args: {
    container: string;
    follow?: boolean;
    tail?: number;
  }) {
    const { container, follow = false, tail = 100 } = args;

    let command = `docker logs --tail ${tail}`;
    if (follow) command += ' -f';
    command += ` ${container}`;

    try {
      const { stdout, stderr } = await execAsync(command);
      return {
        content: [
          {
            type: 'text',
            text: `Container logs for ${container}:\n\n${stdout}${stderr}`,
          },
        ],
      };
    } catch (error: any) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to get Docker logs: ${error.message}`
      );
    }
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'docker://images',
            name: 'Docker Images',
            description: 'List of Docker images on the system',
            mimeType: 'text/plain',
          },
          {
            uri: 'docker://containers',
            name: 'Docker Containers',
            description: 'List of Docker containers',
            mimeType: 'text/plain',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const { uri } = request.params;

      switch (uri) {
        case 'docker://images':
          try {
            const { stdout } = await execAsync('docker images');
            return {
              contents: [
                {
                  uri,
                  mimeType: 'text/plain',
                  text: stdout,
                },
              ],
            };
          } catch (error: any) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to read Docker images: ${error.message}`
            );
          }
        case 'docker://containers':
          try {
            const { stdout } = await execAsync('docker ps -a');
            return {
              contents: [
                {
                  uri,
                  mimeType: 'text/plain',
                  text: stdout,
                },
              ],
            };
          } catch (error: any) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to read Docker containers: ${error.message}`
            );
          }
        default:
          throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
      }
    });
  }

  private setupPromptHandlers() {
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'dockerfile_template',
            description: 'Template for creating a Dockerfile',
            arguments: [
              {
                name: 'base_image',
                description: 'Base Docker image to use',
                required: true,
              },
              {
                name: 'app_name',
                description: 'Name of the application',
                required: true,
              },
            ],
          },
          {
            name: 'docker_compose_template',
            description: 'Template for creating a docker-compose.yml file',
            arguments: [
              {
                name: 'service_name',
                description: 'Name of the service',
                required: true,
              },
              {
                name: 'image_name',
                description: 'Docker image to use',
                required: true,
              },
            ],
          },
        ],
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'dockerfile_template':
          const baseImage = args?.base_image as string;
          const appName = args?.app_name as string;

          return {
            description: 'Dockerfile template',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Create a Dockerfile for ${appName} using ${baseImage} as the base image. Include best practices for the chosen base image.`,
                },
              },
            ],
          };

        case 'docker_compose_template':
          const serviceName = args?.service_name as string;
          const imageName = args?.image_name as string;

          return {
            description: 'docker-compose.yml template',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Create a docker-compose.yml file for ${serviceName} using the ${imageName} image. Include common service configurations.`,
                },
              },
            ],
          };

        default:
          throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Docker Hub MCP Server running on stdio');
  }
}

const server = new DockerHubMCPServer();
server.run().catch(error => {
  console.error('Server error:', error);
  process.exit(1);
});
