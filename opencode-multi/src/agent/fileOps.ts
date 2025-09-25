/**
 * File Operations Agent - Handles file system operations and code generation
 */

import { mainLogger } from '../sdk/logging';
import { AgentMessage } from '../index';

export interface FileOperation {
  type: 'create' | 'update' | 'delete' | 'move' | 'copy';
  path: string;
  content?: string;
  oldContent?: string;
  newContent?: string;
  destination?: string;
  metadata?: Record<string, any> | undefined;
}

export interface FileOperationResult {
  success: boolean;
  operation: FileOperation;
  error?: string;
  createdFiles?: string[];
  modifiedFiles?: string[];
}

export class FileOpsAgent {
  private operations: FileOperation[] = [];
  private results: FileOperationResult[] = [];

  /**
   * Create a new file
   */
  async createFile(
    path: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<FileOperationResult> {
    const operation: FileOperation = {
      type: 'create',
      path,
      content,
      metadata,
    };

    try {
      mainLogger.info(`Creating file: ${path}`);

      // Use MCP filesystem tool to write file
      const result = await use_mcp_tool({
        server_name: 'filesystem',
        tool_name: 'write_file',
        arguments: {
          path,
          content,
        },
      });

      if (result.success) {
        const fileResult: FileOperationResult = {
          success: true,
          operation,
          createdFiles: [path],
        };

        this.operations.push(operation);
        this.results.push(fileResult);

        return fileResult;
      } else {
        throw new Error(result.error || 'Failed to create file');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mainLogger.error(
        `Failed to create file: ${path}`,
        error instanceof Error ? error : undefined
      );

      const result: FileOperationResult = {
        success: false,
        operation,
        error: errorMessage,
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Update an existing file
   */
  async updateFile(
    path: string,
    oldContent: string,
    newContent: string,
    metadata?: Record<string, any>
  ): Promise<FileOperationResult> {
    const operation: FileOperation = {
      type: 'update',
      path,
      oldContent,
      newContent,
      metadata,
    };

    try {
      mainLogger.info(`Updating file: ${path}`);

      // Use MCP filesystem tool to edit file
      const result = await use_mcp_tool({
        server_name: 'filesystem',
        tool_name: 'edit_file',
        arguments: {
          path,
          edits: [
            {
              oldText: oldContent,
              newText: newContent,
            },
          ],
        },
      });

      if (result.success) {
        const fileResult: FileOperationResult = {
          success: true,
          operation,
          modifiedFiles: [path],
        };

        this.operations.push(operation);
        this.results.push(fileResult);

        return fileResult;
      } else {
        throw new Error(result.error || 'Failed to update file');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mainLogger.error(
        `Failed to update file: ${path}`,
        error instanceof Error ? error : undefined
      );

      const result: FileOperationResult = {
        success: false,
        operation,
        error: errorMessage,
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Read a file
   */
  async readFile(path: string): Promise<string | null> {
    try {
      mainLogger.debug(`Reading file: ${path}`);

      // Use MCP filesystem tool to read file
      const result = await use_mcp_tool({
        server_name: 'filesystem',
        tool_name: 'read_text_file',
        arguments: {
          path,
        },
      });

      if (result.success) {
        return result.result as string;
      } else {
        throw new Error(result.error || 'Failed to read file');
      }
    } catch (error) {
      mainLogger.error(
        `Failed to read file: ${path}`,
        error instanceof Error ? error : undefined
      );
      return null;
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(path: string): Promise<FileOperationResult> {
    const operation: FileOperation = {
      type: 'create',
      path,
      metadata: { isDirectory: true },
    };

    try {
      mainLogger.info(`Creating directory: ${path}`);

      // Use MCP filesystem tool to create directory
      const result = await use_mcp_tool({
        server_name: 'filesystem',
        tool_name: 'create_directory',
        arguments: {
          path,
        },
      });

      if (result.success) {
        const fileResult: FileOperationResult = {
          success: true,
          operation,
          createdFiles: [path],
        };

        this.operations.push(operation);
        this.results.push(fileResult);

        return fileResult;
      } else {
        throw new Error(result.error || 'Failed to create directory');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      mainLogger.error(
        `Failed to create directory: ${path}`,
        error instanceof Error ? error : undefined
      );

      const result: FileOperationResult = {
        success: false,
        operation,
        error: errorMessage,
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<string[]> {
    try {
      mainLogger.debug(`Listing directory: ${path}`);

      // Use MCP filesystem tool to list directory
      const result = await use_mcp_tool({
        server_name: 'filesystem',
        tool_name: 'list_directory',
        arguments: {
          path,
        },
      });

      if (result.success) {
        return result.result as string[];
      } else {
        throw new Error(result.error || 'Failed to list directory');
      }
    } catch (error) {
      mainLogger.error(
        `Failed to list directory: ${path}`,
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }

  /**
   * Apply multiple file operations
   */
  async applyOperations(operations: FileOperation[]): Promise<FileOperationResult[]> {
    const results: FileOperationResult[] = [];

    for (const operation of operations) {
      let result: FileOperationResult;

      switch (operation.type) {
        case 'create':
          if (operation.content) {
            result = await this.createFile(
              operation.path,
              operation.content,
              operation.metadata
            );
          } else {
            result = await this.createDirectory(operation.path);
          }
          break;

        case 'update':
          if (operation.oldContent && operation.newContent) {
            result = await this.updateFile(
              operation.path,
              operation.oldContent,
              operation.newContent,
              operation.metadata
            );
          } else {
            result = {
              success: false,
              operation,
              error: 'Update operation requires oldContent and newContent',
            };
          }
          break;

        default:
          result = {
            success: false,
            operation,
            error: `Unsupported operation type: ${operation.type}`,
          };
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Extract file operations from agent response
   */
  extractOperationsFromResponse(response: string): FileOperation[] {
    const operations: FileOperation[] = [];

    // Extract file creation patterns
    const createFileRegex = /CREATE_FILE:\s*([^\n]+)\n?```([\w]*)\n?([\s\S]*?)```/g;
    let match;

    while ((match = createFileRegex.exec(response)) !== null) {
      const path = match[1].trim();
      const language = match[2];
      const content = match[3];

      operations.push({
        type: 'create',
        path,
        content: content,
        metadata: { language },
      });
    }

    // Extract file update patterns
    const updateFileRegex =
      /UPDATE_FILE:\s*([^\n]+)\n?OLD:\s*```([\w]*)\n?([\s\S]*?)```\s*NEW:\s*```([\w]*)\n?([\s\S]*?)```/g;

    while ((match = updateFileRegex.exec(response)) !== null) {
      const path = match[1].trim();
      const oldLanguage = match[2];
      const oldContent = match[3];
      const newLanguage = match[4];
      const newContent = match[5];

      operations.push({
        type: 'update',
        path,
        oldContent,
        newContent,
        metadata: { oldLanguage, newLanguage },
      });
    }

    // Extract simple file creation patterns
    const simpleCreateRegex = /File:\s*([^\n]+)\s*\n```([\w]*)\n?([\s\S]*?)```/g;

    while ((match = simpleCreateRegex.exec(response)) !== null) {
      const path = match[1].trim();
      const language = match[2];
      const content = match[3];

      operations.push({
        type: 'create',
        path,
        content,
        metadata: { language },
      });
    }

    return operations;
  }

  /**
   * Generate file operations from code blocks
   */
  generateOperationsFromCodeBlocks(response: string): FileOperation[] {
    const operations: FileOperation[] = [];

    // Extract code blocks with file paths
    const codeBlockRegex = /```(\w+)?\s*([^\n]*)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(response)) !== null) {
      const language = match[1] || 'text';
      const pathHint = match[2];
      const content = match[3];

      // Try to extract file path from the hint or content
      let path =
        this.extractPathFromHint(pathHint) || this.extractPathFromContent(content);

      if (path) {
        operations.push({
          type: 'create',
          path,
          content,
          metadata: { language, hint: pathHint },
        });
      }
    }

    return operations;
  }

  /**
   * Extract file path from hint
   */
  private extractPathFromHint(hint: string): string | null {
    // Look for common path patterns in the hint
    const pathPatterns = [
      /file[:\s]+([^\s]+)/i,
      /path[:\s]+([^\s]+)/i,
      /([a-zA-Z0-9_\-\.\/]+\.(ts|js|py|md|json|txt|html|css))/i,
    ];

    for (const pattern of pathPatterns) {
      const match = hint.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract file path from content
   */
  private extractPathFromContent(content: string): string | null {
    // Look for file path comments or headers in the content
    const lines = content.split('\n').slice(0, 10); // Check first 10 lines

    for (const line of lines) {
      const pathMatch = line.match(
        /([a-zA-Z0-9_\-\.\/]+\.(ts|js|py|md|json|txt|html|css))/
      );
      if (pathMatch) {
        return pathMatch[1];
      }
    }

    return null;
  }

  /**
   * Get operation history
   */
  getOperations(): FileOperation[] {
    return [...this.operations];
  }

  /**
   * Get operation results
   */
  getResults(): FileOperationResult[] {
    return [...this.results];
  }

  /**
   * Get successful operations
   */
  getSuccessfulOperations(): FileOperationResult[] {
    return this.results.filter(result => result.success);
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): FileOperationResult[] {
    return this.results.filter(result => !result.success);
  }

  /**
   * Clear operation history
   */
  clearHistory(): void {
    this.operations = [];
    this.results = [];
  }
}

/**
 * Convenience functions
 */
export async function createFile(
  path: string,
  content: string,
  metadata?: Record<string, any>
): Promise<FileOperationResult> {
  const agent = new FileOpsAgent();
  return await agent.createFile(path, content, metadata);
}

export async function updateFile(
  path: string,
  oldContent: string,
  newContent: string,
  metadata?: Record<string, any>
): Promise<FileOperationResult> {
  const agent = new FileOpsAgent();
  return await agent.updateFile(path, oldContent, newContent, metadata);
}

export async function readFile(path: string): Promise<string | null> {
  const agent = new FileOpsAgent();
  return await agent.readFile(path);
}

export function extractOperationsFromResponse(response: string): FileOperation[] {
  const agent = new FileOpsAgent();
  return [
    ...agent.extractOperationsFromResponse(response),
    ...agent.generateOperationsFromCodeBlocks(response),
  ];
}
