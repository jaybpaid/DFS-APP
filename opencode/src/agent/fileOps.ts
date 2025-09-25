/**
 * File operations for the OpenCode build agent
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { logger } from '../sdk/logging.js';

export interface UnifiedDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

export interface UnifiedDiff {
  filePath: string;
  hunks: UnifiedDiffHunk[];
}

export class FileOps {
  private backupSuffix = '.bak';

  /**
   * Read file content
   */
  readFile(filePath: string): string {
    try {
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = readFileSync(filePath, 'utf-8');
      logger.debug('FileOps', `Read file: ${filePath} (${content.length} chars)`);
      return content;
    } catch (error) {
      logger.error('FileOps', `Failed to read file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Write file content
   */
  writeFile(filePath: string, content: string): void {
    try {
      // Ensure directory exists
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        logger.debug('FileOps', `Created directory: ${dir}`);
      }

      // Create backup if file exists and doesn't already have our backup
      if (existsSync(filePath)) {
        const backupPath = filePath + this.backupSuffix;
        if (!existsSync(backupPath)) {
          writeFileSync(backupPath, readFileSync(filePath, 'utf-8'));
          logger.debug('FileOps', `Created backup: ${backupPath}`);
        }
      }

      writeFileSync(filePath, content, 'utf-8');
      logger.debug('FileOps', `Wrote file: ${filePath} (${content.length} chars)`);
    } catch (error) {
      logger.error('FileOps', `Failed to write file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  fileExists(filePath: string): boolean {
    return existsSync(filePath);
  }

  /**
   * Get file stats
   */
  getFileStats(filePath: string): { size: number; modified: Date } | null {
    try {
      if (!existsSync(filePath)) {
        return null;
      }

      const stats = statSync(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
      };
    } catch (error) {
      logger.error('FileOps', `Failed to get file stats: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Parse unified diff format
   */
  parseUnifiedDiff(diffContent: string): UnifiedDiff[] {
    const diffs: UnifiedDiff[] = [];
    const lines = diffContent.split('\n');
    let currentDiff: Partial<UnifiedDiff> | null = null;
    let currentHunk: Partial<UnifiedDiffHunk> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('diff --git')) {
        // Start of a new diff
        if (currentDiff) {
          diffs.push(currentDiff as UnifiedDiff);
        }

        const fileMatch = line.match(/diff --git a\/(.+) b\/(.+)/);
        if (fileMatch) {
          currentDiff = {
            filePath: fileMatch[1],
            hunks: [],
          };
        }
        currentHunk = null;
      } else if (line.startsWith('@@')) {
        // Start of a new hunk
        const hunkMatch = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
        if (hunkMatch && currentDiff && currentDiff.hunks) {
          currentHunk = {
            oldStart: parseInt(hunkMatch[1]),
            oldLines: parseInt(hunkMatch[2]) || 1,
            newStart: parseInt(hunkMatch[3]),
            newLines: parseInt(hunkMatch[4]) || 1,
            content: '',
          };
          currentDiff.hunks.push(currentHunk as UnifiedDiffHunk);
        }
      } else if (
        currentHunk &&
        (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))
      ) {
        // Add line to current hunk
        currentHunk.content += line + '\n';
      }
    }

    // Add the last diff if exists
    if (currentDiff) {
      diffs.push(currentDiff as UnifiedDiff);
    }

    logger.debug('FileOps', `Parsed ${diffs.length} diffs from unified diff`);
    return diffs;
  }

  /**
   * Apply unified diff to files
   */
  applyUnifiedDiff(diffContent: string): { success: boolean; errors: string[] } {
    const diffs = this.parseUnifiedDiff(diffContent);
    const errors: string[] = [];

    for (const diff of diffs) {
      try {
        const currentContent = this.readFile(diff.filePath);
        const newContent = this.applyDiffToContent(currentContent, diff);
        this.writeFile(diff.filePath, newContent);
        logger.info('FileOps', `Applied diff to: ${diff.filePath}`);
      } catch (error) {
        const errorMsg = `Failed to apply diff to ${diff.filePath}: ${error.message}`;
        errors.push(errorMsg);
        logger.error('FileOps', errorMsg, error);
      }
    }

    const success = errors.length === 0;
    if (!success) {
      logger.warn('FileOps', `Applied diffs with ${errors.length} errors`);
    }

    return { success, errors };
  }

  /**
   * Apply a single diff to file content
   */
  private applyDiffToContent(content: string, diff: UnifiedDiff): string {
    const lines = content.split('\n');
    let result: string[] = [];

    // Process each hunk
    for (const hunk of diff.hunks) {
      const hunkLines = hunk.content.trim().split('\n');
      let sourceLine = hunk.oldStart - 1; // Convert to 0-based
      let resultLine = 0;

      // Find the start position in the result
      while (resultLine < result.length && sourceLine > 0) {
        if (
          !result[resultLine].startsWith('+') &&
          !result[resultLine].startsWith('-')
        ) {
          sourceLine--;
        }
        resultLine++;
      }

      // Apply the hunk
      for (const hunkLine of hunkLines) {
        if (hunkLine.startsWith('+')) {
          // Addition
          result.splice(resultLine, 0, hunkLine.substring(1));
          resultLine++;
        } else if (hunkLine.startsWith('-')) {
          // Deletion - remove the line
          if (
            resultLine < result.length &&
            result[resultLine] === hunkLine.substring(1)
          ) {
            result.splice(resultLine, 1);
          } else {
            throw new Error(`Context mismatch at line ${resultLine + 1}`);
          }
        } else {
          // Context line
          if (
            resultLine >= result.length ||
            result[resultLine] !== hunkLine.substring(1)
          ) {
            throw new Error(`Context mismatch at line ${resultLine + 1}`);
          }
          resultLine++;
        }
      }
    }

    return result.join('\n');
  }

  /**
   * List files in directory (excluding common ignore patterns)
   */
  listFiles(dirPath: string, recursive: boolean = false): string[] {
    // This is a simplified implementation
    // In a real implementation, you would use fs.readdirSync with options
    logger.debug('FileOps', `Listing files in: ${dirPath} (recursive: ${recursive})`);
    return [];
  }

  /**
   * Get relative path from base directory
   */
  getRelativePath(from: string, to: string): string {
    return relative(from, to);
  }

  /**
   * Join paths safely
   */
  joinPaths(...paths: string[]): string {
    return join(...paths);
  }
}

// Export singleton instance
export const fileOps = new FileOps();

// Convenience functions
export const readFile = (filePath: string): string => fileOps.readFile(filePath);
export const writeFile = (filePath: string, content: string): void =>
  fileOps.writeFile(filePath, content);
export const fileExists = (filePath: string): boolean => fileOps.fileExists(filePath);
export const getFileStats = (
  filePath: string
): { size: number; modified: Date } | null => fileOps.getFileStats(filePath);
export const parseUnifiedDiff = (diffContent: string): UnifiedDiff[] =>
  fileOps.parseUnifiedDiff(diffContent);
export const applyUnifiedDiff = (
  diffContent: string
): { success: boolean; errors: string[] } => fileOps.applyUnifiedDiff(diffContent);
export const listFiles = (dirPath: string, recursive?: boolean): string[] =>
  fileOps.listFiles(dirPath, recursive);
export const getRelativePath = (from: string, to: string): string =>
  fileOps.getRelativePath(from, to);
export const joinPaths = (...paths: string[]): string => fileOps.joinPaths(...paths);
