import * as crypto from 'crypto';

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  entries: number;
  hitRate: number;
}

export class Cache {
  private entries = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    sets: 0,
  };

  constructor(
    private maxSize = 1000,
    private defaultTTL = 300000
  ) {
    // 5 minutes default
    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  get(key: string): any | null {
    const entry = this.entries.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.entries.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  set(
    key: string,
    value: any,
    options: {
      ttl?: number;
      tags?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const ttl = options.ttl || this.defaultTTL;
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      tags: options.tags,
      metadata: options.metadata,
    };

    // Check if we need to evict old entries
    if (this.entries.size >= this.maxSize && !this.entries.has(key)) {
      this.evictOldest();
    }

    this.entries.set(key, entry);
    this.stats.sets++;
  }

  delete(key: string): boolean {
    const deleted = this.entries.delete(key);
    if (deleted) {
      this.stats.evictions++;
    }
    return deleted;
  }

  clear(): void {
    const count = this.entries.size;
    this.entries.clear();
    this.stats.evictions += count;
  }

  has(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.entries.delete(key);
      this.stats.evictions++;
      return false;
    }

    return true;
  }

  // Invalidate entries by tags
  invalidateByTag(tag: string): number {
    let invalidated = 0;
    for (const [key, entry] of this.entries) {
      if (entry.tags?.includes(tag)) {
        this.entries.delete(key);
        invalidated++;
      }
    }
    this.stats.evictions += invalidated;
    return invalidated;
  }

  // Get entries by pattern
  getByPattern(pattern: string): Map<string, any> {
    const results = new Map<string, any>();
    const regex = new RegExp(pattern);

    for (const [key, entry] of this.entries) {
      if (this.isExpired(entry)) {
        this.entries.delete(key);
        this.stats.evictions++;
        continue;
      }

      if (regex.test(key)) {
        results.set(key, entry.value);
      }
    }

    return results;
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      entries: this.entries.size,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
    };
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.entries) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.entries.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.entries.delete(key);
        this.stats.evictions++;
      }
    }
  }

  // Generate keys for request caching
  static generateRequestKey(request: any): string {
    const content = JSON.stringify({
      method: request.method,
      params: request.params,
    });
    return crypto.createHash('md5').update(content).digest('hex');
  }
}

export const requestCache = new Cache(500, 60000); // 1 minute TTL
export const resultCache = new Cache(1000, 300000); // 5 minutes TTL
