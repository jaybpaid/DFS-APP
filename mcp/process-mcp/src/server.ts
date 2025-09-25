#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { z } from 'zod';

// Schema definitions
const RunCommandSchema = z.object({
  command: z.string().describe('Shell command to execute'),
  cwd: z.string().optional().describe('Working directory'),
  timeout: z.number().default(30000).describe('Timeout in milliseconds'),
});

const ReadFileSchema = z.object({
  path: z.string().describe('File path to read'),
});

const WriteFileSchema = z.object({
  path: z.string().describe('File path to write'),
  content: z.string().describe('File content'),
});

const ListDirSchema = z.object({
  path: z.string().describe('Directory path to list'),
});

class ProcessMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'process-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = error => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'run_command',
          description: 'Execute a safe shell command',
          inputSchema: RunCommandSchema,
        },
        {
          name: 'read_file',
          description: 'Read contents of a file',
          inputSchema: ReadFileSchema,
        },
        {
          name: 'write_file',
          description: 'Write content to a file',
          inputSchema: WriteFileSchema,
        },
        {
          name: 'list_directory',
          description: 'List directory contents',
          inputSchema: ListDirSchema,
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'run_command': {
            const { command, cwd, timeout } = RunCommandSchema.parse(args);

            // Basic safety checks
            if (
              command.includes('rm -rf') ||
              command.includes('sudo') ||
              command.includes('chmod 777')
            ) {
              throw new Error('Unsafe command rejected');
            }

            const options = {
              cwd: cwd ? resolve(cwd) : process.cwd(),
              timeout,
              encoding: 'utf8' as const,
            };

            const result = execSync(command, options);
            return {
              content: [
                {
                  type: 'text',
                  text: `Command executed successfully:\n${result}`,
                },
              ],
            };
          }

          case 'read_file': {
            const { path } = ReadFileSchema.parse(args);
            const resolvedPath = resolve(path);
            const content = readFileSync(resolvedPath, 'utf8');
            return {
              content: [
                {
                  type: 'text',
                  text: content,
                },
              ],
            };
          }

          case 'write_file': {
            const { path, content } = WriteFileSchema.parse(args);
            const resolvedPath = resolve(path);
            writeFileSync(resolvedPath, content, 'utf8');
            return {
              content: [
                {
                  type: 'text',
                  text: `File written successfully: ${resolvedPath}`,
                },
              ],
            };
          }

          case 'list_directory': {
            const { path } = ListDirSchema.parse(args);
            const resolvedPath = resolve(path);
            const items = readdirSync(resolvedPath).map(item => {
              const itemPath = join(resolvedPath, item);
              const stats = statSync(itemPath);
              return {
                name: item,
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                modified: stats.mtime.toISOString(),
              };
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(items, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Process MCP server running on stdio');
  }
}

const server = new ProcessMCPServer();
server.run().catch(console.error);
