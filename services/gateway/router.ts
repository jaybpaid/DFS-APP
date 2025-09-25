import { toolRegistry, ToolRegistration } from './registry.js';
import { spawn } from 'child_process';
import { Logger } from './logger.js';
import { ChildProcess } from 'child_process';

export interface CallToolRequest {
  method: string;
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
  id?: string | number;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface CallResult {
  success: boolean;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  executionTime: number;
  serverId: string | null;
  fallbackUsed: boolean;
}

export class ToolRouter {
  private runningProcesses = new Map<string, any>();
  private requestQueue = new Map<string, CallToolRequest[]>();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async routeAndExecute(request: CallToolRequest): Promise<CallResult> {
    const startTime = Date.now();

    try {
      // Parse the request to extract the actual tool name
      const toolName = this.extractToolName(request);
      if (!toolName) {
        return this.createErrorResult('Invalid tool request format', startTime);
      }

      this.logger.info(`Routing tool request: ${toolName}`, { requestId: request.id });

      // Get the namespace and tool name
      const { namespace, name } = this.parseToolName(toolName);

      // Find the appropriate tool registration
      const resolution = toolRegistry.resolveTool({
        method: request.method,
        params: { name: name },
      });

      if (!resolution.registration && resolution.fallbackOptions.length === 0) {
        this.logger.warn(`No tool found for ${toolName}`, {
          namespace,
          name,
          action: resolution.action,
        });
        return this.createErrorResult(`Tool not found: ${toolName}`, startTime);
      }

      const toolToUse = resolution.registration || resolution.fallbackOptions[0];
      const fallbackUsed = !resolution.registration;

      if (fallbackUsed) {
        this.logger.info(`Using fallback tool for ${toolName}`, {
          originalTool: resolution.registration,
          fallbackTool: toolToUse.name,
        });
      }

      // Execute the tool
      const result = await this.executeTool(toolToUse, request);

      const executionTime = Date.now() - startTime;
      this.logger.info(`Tool execution completed`, {
        tool: toolName,
        serverId: toolToUse.serverId,
        executionTime,
        success: result.success,
        fallbackUsed,
      });

      return {
        ...result,
        executionTime,
        serverId: toolToUse.serverId,
        fallbackUsed,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Tool execution failed`, {
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: {
          code: -32000,
          message: error.message || 'Internal server error',
          data: { stack: error.stack },
        },
        executionTime,
        serverId: null,
        fallbackUsed: false,
      };
    }
  }

  private async executeTool(
    registration: ToolRegistration,
    request: CallToolRequest
  ): Promise<Omit<CallResult, 'executionTime' | 'serverId' | 'fallbackUsed'>> {
    try {
      const server = this.getOrStartServer(registration);

      if (!server) {
        throw new Error(`Failed to start server for ${registration.serverId}`);
      }

      // Send the request to the server process
      const response = await this.sendRequestToProcess(server, request);

      return {
        success: !response.error,
        result: response.result,
        error: response.error,
      };
    } catch (error) {
      this.logger.error(`Tool execution error`, {
        tool: registration.name,
        serverId: registration.serverId,
        error: error.message,
      });

      return {
        success: false,
        error: {
          code: -32000,
          message: `Tool execution failed: ${error.message}`,
          data: { originalError: error.message, serverId: registration.serverId },
        },
      };
    }
  }

  private getOrStartServer(registration: ToolRegistration): any {
    const server = toolRegistry
      .getServersByNamespace(registration.namespace === 'app' ? 'app' : 'ext')
      .find(s => s.id === registration.serverId);

    if (!server) {
      this.logger.error(`Server not found`, { serverId: registration.serverId });
      return null;
    }

    // Check if process is already running
    if (this.runningProcesses.has(registration.serverId)) {
      return this.runningProcesses.get(registration.serverId);
    }

    try {
      this.logger.info(`Starting server process`, {
        serverId: registration.serverId,
        command: server.command,
      });

      const process = spawn(server.command, server.args, {
        env: { ...process.env, ...server.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Store the process
      this.runningProcesses.set(registration.serverId, process);

      // Handle process events
      process.on('exit', code => {
        this.logger.warn(`Server process exited`, {
          serverId: registration.serverId,
          exitCode: code,
        });
        this.runningProcesses.delete(registration.serverId);
      });

      process.on('error', error => {
        this.logger.error(`Server process error`, {
          serverId: registration.serverId,
          error: error.message,
        });
        this.runningProcesses.delete(registration.serverId);
      });

      return process;
    } catch (error) {
      this.logger.error(`Failed to start server process`, {
        serverId: registration.serverId,
        error: error.message,
      });
      return null;
    }
  }

  private async sendRequestToProcess(
    process: any,
    request: CallToolRequest
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const message = JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        method: request.method,
        params: request.params,
      });

      const chunks: Buffer[] = [];

      // Set up listeners
      const onData = (data: Buffer) => chunks.push(data);
      const onEnd = () => {
        try {
          const responseStr = Buffer.concat(chunks).toString();
          const response = JSON.parse(responseStr);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      };

      process.stdout.on('data', onData);
      process.stdout.on('end', onEnd);
      process.stderr.on('data', data => {
        this.logger.warn(`Server stderr`, { output: data.toString() });
      });

      // Send the request
      process.stdin.write(message + '\n');

      // Set timeout
      setTimeout(() => {
        process.stdout.removeListener('data', onData);
        process.stdout.removeListener('end', onEnd);
        reject(new Error('Tool execution timeout'));
      }, 5000); // 5 second timeout
    });
  }

  private extractToolName(request: CallToolRequest): string | null {
    if (request.method !== 'tools/call') return null;
    return request.params.name || null;
  }

  private parseToolName(toolName: string): { namespace: 'app' | 'ext'; name: string } {
    const parts = toolName.split('.');
    if (parts.length < 2) {
      return { namespace: 'ext', name: toolName }; // Default to ext namespace
    }

    const namespace = parts[0] as 'app' | 'ext';
    const name = parts.slice(1).join('.');

    return { namespace: namespace === 'app' ? 'app' : 'ext', name };
  }

  private createErrorResult(message: string, startTime: number): CallResult {
    return {
      success: false,
      error: {
        code: -32602,
        message,
      },
      executionTime: Date.now() - startTime,
      serverId: null,
      fallbackUsed: false,
    };
  }

  // Health check for server processes
  async checkServerHealth(serverId: string): Promise<boolean> {
    try {
      const process = this.runningProcesses.get(serverId);
      if (!process) {
        return false;
      }

      // Send a simple ping/health check
      await this.sendRequestToProcess(process, {
        method: 'tools/list',
        params: {},
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // Gracefully shutdown all running processes
  async shutdown(): Promise<void> {
    this.logger.info(`Shutting down ${this.runningProcesses.size} server processes`);

    const shutdownPromises = Array.from(this.runningProcesses.entries()).map(
      ([serverId, process]) => {
        return new Promise<void>(resolve => {
          process.on('exit', () => {
            this.logger.info(`Server process shut down`, { serverId });
            resolve();
          });

          process.kill('SIGTERM');

          // Force kill after timeout
          setTimeout(() => {
            if (!process.killed) {
              process.kill('SIGKILL');
            }
            resolve();
          }, 5000);
        });
      }
    );

    this.runningProcesses.clear();
    await Promise.all(shutdownPromises);
  }
}

export const toolRouter = new ToolRouter(new Logger());
