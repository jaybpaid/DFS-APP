/**
 * OpenCode Response Caching System
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { dirname } from 'path';
import { logger } from './logging.js';

export interface CacheEntry {
  key: string;
  response: any;
  createdAt: number;
  expiresAt: number;
}

export interface CacheOptions {
  ttlMs?: number;
  salt?: string;
}

export interface ICache {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, value: any, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(
  model: string,
  messages: any[],
  temperature: number,
  maxTokens: number,
  tools?: any[],
  salt?: string
): string {
  // Strip assistant messages before hashing to avoid cache pollution
  const filteredMessages = messages.filter(msg => msg.role !== 'assistant');

  const cacheData = {
    model,
    messages: filteredMessages,
    temperature,
    maxTokens,
    tools: tools || null,
    salt: salt || '',
  };

  const hash = createHash('sha256').update(JSON.stringify(cacheData)).digest('hex');

  return `oc_${hash.substring(0, 16)}`;
}

/**
 * File-based cache implementation using JSONL format
 */
export class FileCache implements ICache {
  private cacheFile: string;
  private defaultTtlMs: number;
  private cache: Map<string, CacheEntry> = new Map();
  private initialized = false;

  constructor(
    cacheFile: string = '.cache/opencode.jsonl',
    defaultTtlMs: number = 86400000
  ) {
    this.cacheFile = cacheFile;
    this.defaultTtlMs = defaultTtlMs;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure cache directory exists
      await fs.mkdir(dirname(this.cacheFile), { recursive: true });

      // Load existing cache
      try {
        const content = await fs.readFile(this.cacheFile, 'utf-8');
        const lines = content
          .trim()
          .split('\n')
          .filter(line => line.length > 0);

        for (const line of lines) {
          try {
            const entry: CacheEntry = JSON.parse(line);
            if (entry.expiresAt > Date.now()) {
              this.cache.set(entry.key, entry);
            }
          } catch (e) {
            logger.warn('FileCache', 'Skipping invalid cache line', { line });
          }
        }

        logger.debug('FileCache', 'Loaded cache entries', {
          count: this.cache.size,
          file: this.cacheFile,
        });
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          logger.warn('FileCache', 'Failed to load cache file', { error: err.message });
        }
      }

      this.initialized = true;
    } catch (error) {
      logger.error('FileCache', 'Failed to initialize cache', error);
      throw error;
    }
  }

  async get(key: string): Promise<CacheEntry | null> {
    await this.initialize();

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    logger.debug('FileCache', 'Cache hit', { key });
    return entry;
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    await this.initialize();

    const ttlMs = options?.ttlMs || this.defaultTtlMs;
    const entry: CacheEntry = {
      key,
      response: value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    this.cache.set(key, entry);

    // Append to file
    try {
      await fs.appendFile(this.cacheFile, JSON.stringify(entry) + '\n');
      logger.debug('FileCache', 'Cache entry saved', { key, ttlMs });
    } catch (error) {
      logger.error('FileCache', 'Failed to write cache entry', error);
    }
  }

  async delete(key: string): Promise<void> {
    await this.initialize();
    this.cache.delete(key);
    // Note: File cleanup happens during cleanup() to avoid frequent rewrites
  }

  async clear(): Promise<void> {
    await this.initialize();
    this.cache.clear();

    try {
      await fs.unlink(this.cacheFile);
      logger.info('FileCache', 'Cache cleared', { file: this.cacheFile });
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        logger.warn('FileCache', 'Failed to delete cache file', { error: err.message });
      }
    }
  }

  async cleanup(): Promise<void> {
    await this.initialize();

    const now = Date.now();
    let removedCount = 0;

    // Remove expired entries from memory
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    // Rewrite file with only valid entries
    try {
      const validEntries = Array.from(this.cache.values());
      const content =
        validEntries.map(entry => JSON.stringify(entry)).join('\n') + '\n';

      await fs.writeFile(this.cacheFile, content);

      logger.debug('FileCache', 'Cache cleanup completed', {
        removedCount,
        remainingCount: validEntries.length,
      });
    } catch (error) {
      logger.error('FileCache', 'Failed to cleanup cache file', error);
    }
  }
}

/**
 * SQLite-based cache implementation (for better performance with large caches)
 */
export class SqliteCache implements ICache {
  private dbPath: string;
  private defaultTtlMs: number;
  private db: any = null;
  private initialized = false;

  constructor(dbPath: string = '.cache/opencode.db', defaultTtlMs: number = 86400000) {
    this.dbPath = dbPath;
    this.defaultTtlMs = defaultTtlMs;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamically import better-sqlite3 if available
      const Database = (await import('better-sqlite3')).default;

      // Ensure cache directory exists
      await fs.mkdir(dirname(this.dbPath), { recursive: true });

      this.db = new Database(this.dbPath);

      // Create cache table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS cache_entries (
          key TEXT PRIMARY KEY,
          response TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_expires_at ON cache_entries(expires_at);
      `);

      this.initialized = true;
      logger.debug('SqliteCache', 'Initialized SQLite cache', { dbPath: this.dbPath });
    } catch (error) {
      logger.warn(
        'SqliteCache',
        'SQLite not available, falling back to FileCache',
        error
      );
      throw new Error('SQLite cache unavailable');
    }
  }

  async get(key: string): Promise<CacheEntry | null> {
    await this.initialize();

    const stmt = this.db.prepare(
      'SELECT * FROM cache_entries WHERE key = ? AND expires_at > ?'
    );
    const row = stmt.get(key, Date.now());

    if (!row) return null;

    const entry: CacheEntry = {
      key: row.key,
      response: JSON.parse(row.response),
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };

    logger.debug('SqliteCache', 'Cache hit', { key });
    return entry;
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    await this.initialize();

    const ttlMs = options?.ttlMs || this.defaultTtlMs;
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cache_entries (key, response, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(key, JSON.stringify(value), now, now + ttlMs);
    logger.debug('SqliteCache', 'Cache entry saved', { key, ttlMs });
  }

  async delete(key: string): Promise<void> {
    await this.initialize();

    const stmt = this.db.prepare('DELETE FROM cache_entries WHERE key = ?');
    stmt.run(key);
  }

  async clear(): Promise<void> {
    await this.initialize();

    this.db.exec('DELETE FROM cache_entries');
    logger.info('SqliteCache', 'Cache cleared');
  }

  async cleanup(): Promise<void> {
    await this.initialize();

    const stmt = this.db.prepare('DELETE FROM cache_entries WHERE expires_at <= ?');
    const result = stmt.run(Date.now());

    logger.debug('SqliteCache', 'Cache cleanup completed', {
      removedCount: result.changes,
    });
  }
}

/**
 * Cache factory and manager
 */
export class CacheManager {
  private static instance: CacheManager;
  private cache: ICache | null = null;
  private cacheMode: string;

  private constructor() {
    this.cacheMode = process.env.OC_CACHE_MODE || 'file';
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async getCache(): Promise<ICache | null> {
    if (this.cacheMode === 'off') {
      return null;
    }

    if (this.cache) {
      return this.cache;
    }

    const ttlMs = parseInt(process.env.OC_CACHE_TTL_MS || '86400000');

    try {
      if (this.cacheMode === 'sqlite') {
        const dbPath = process.env.OC_CACHE_SQLITE || '.cache/opencode.db';
        this.cache = new SqliteCache(dbPath, ttlMs);
        await this.cache.cleanup(); // Test initialization
        logger.info('CacheManager', 'Using SQLite cache', { dbPath });
      } else if (this.cacheMode === 'file') {
        const filePath = process.env.OC_CACHE_FILE || '.cache/opencode.jsonl';
        this.cache = new FileCache(filePath, ttlMs);
        await this.cache.cleanup(); // Test initialization
        logger.info('CacheManager', 'Using file cache', { filePath });
      } else {
        logger.warn(
          'CacheManager',
          `Unknown cache mode: ${this.cacheMode}, disabling cache`
        );
        return null;
      }

      return this.cache;
    } catch (error) {
      logger.error('CacheManager', 'Failed to initialize cache, disabling', error);

      // Fallback to file cache if SQLite fails
      if (this.cacheMode === 'sqlite') {
        try {
          const filePath = process.env.OC_CACHE_FILE || '.cache/opencode.jsonl';
          this.cache = new FileCache(filePath, ttlMs);
          await this.cache.cleanup();
          logger.info('CacheManager', 'Fallback to file cache', { filePath });
          return this.cache;
        } catch (fallbackError) {
          logger.error('CacheManager', 'Fallback cache also failed', fallbackError);
        }
      }

      return null;
    }
  }

  /**
   * Schedule periodic cleanup
   */
  startCleanupScheduler(intervalMs: number = 3600000): void {
    // 1 hour default
    setInterval(async () => {
      try {
        const cache = await this.getCache();
        if (cache) {
          await cache.cleanup();
        }
      } catch (error) {
        logger.error('CacheManager', 'Scheduled cleanup failed', error);
      }
    }, intervalMs);
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();
