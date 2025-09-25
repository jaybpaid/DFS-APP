import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type CacheEntry = {
  key: string;
  model: string;
  createdAt: number; // epoch ms
  ttlMs: number; // time to live
  value: { text: string; finishReason?: string; raw?: any };
};

export interface CacheStore {
  get(key: string): Promise<CacheEntry | null>;
  set(entry: CacheEntry): Promise<void>;
  purgeExpired(now?: number): Promise<number>;
}

function normalizeMessages(messages: Array<{ role: string; content: any }>) {
  return messages.map(m => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content.trim() : m.content,
  }));
}

export function makeCacheKey(opts: {
  baseUrl: string;
  model: string;
  system?: string;
  messages: Array<{ role: string; content: any }>;
  temperature?: number;
  max_tokens?: number;
  toolsSignature?: string;
  extraSalt?: string;
}) {
  const h = crypto.createHash('sha256');
  const payload = {
    b: opts.baseUrl,
    m: opts.model,
    s: opts.system || '',
    msgs: normalizeMessages(opts.messages),
    t: opts.temperature ?? 0.2,
    k: opts.max_tokens ?? 2048,
    tools: opts.toolsSignature ?? '',
    salt: opts.extraSalt ?? '',
  };
  h.update(JSON.stringify(payload));
  return h.digest('hex');
}

/* ---------- File (JSONL) cache ---------- */
export class FileCache implements CacheStore {
  constructor(
    private filePath: string,
    private defaultTtlMs: number
  ) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '');
  }
  async get(key: string): Promise<CacheEntry | null> {
    const content = fs.readFileSync(this.filePath, 'utf8');
    if (!content.trim()) return null;
    const lines = content.trim().split('\n');
    const now = Date.now();
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const row = JSON.parse(lines[i]) as CacheEntry;
        if (row.key === key && now - row.createdAt < row.ttlMs) return row;
      } catch {}
    }
    return null;
  }
  async set(entry: CacheEntry): Promise<void> {
    fs.appendFileSync(this.filePath, JSON.stringify(entry) + '\n');
  }
  async purgeExpired(now = Date.now()): Promise<number> {
    const content = fs.readFileSync(this.filePath, 'utf8');
    const lines = content.trim() ? content.trim().split('\n') : [];
    const kept: string[] = [];
    let removed = 0;
    for (const line of lines) {
      try {
        const row = JSON.parse(line) as CacheEntry;
        if (now - row.createdAt < row.ttlMs) kept.push(line);
        else removed++;
      } catch {
        kept.push(line);
      }
    }
    fs.writeFileSync(this.filePath, kept.join('\n') + (kept.length ? '\n' : ''));
    return removed;
  }
}

/* ---------- SQLite cache (optional) ---------- */
export class SqliteCache implements CacheStore {
  private ready = false;
  private db: any;
  constructor(
    private filename: string,
    private defaultTtlMs: number
  ) {}
  private async init() {
    if (this.ready) return;
    try {
      const sqlite3 = await import('sqlite3');
      const { open } = await import('sqlite');
      this.db = await open({ filename: this.filename, driver: sqlite3.Database });
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          model TEXT,
          createdAt INTEGER,
          ttlMs INTEGER,
          value TEXT
        );
      `);
      this.ready = true;
    } catch (error) {
      throw new Error(
        'SQLite cache requires sqlite3 and sqlite packages. Install with: npm install sqlite3 sqlite'
      );
    }
  }
  async get(key: string): Promise<CacheEntry | null> {
    await this.init();
    const row = await this.db.get(`SELECT * FROM cache WHERE key=?`, key);
    if (!row) return null;
    const now = Date.now();
    if (now - row.createdAt >= row.ttlMs) return null;
    return {
      key: row.key,
      model: row.model,
      createdAt: row.createdAt,
      ttlMs: row.ttlMs,
      value: JSON.parse(row.value),
    };
  }
  async set(entry: CacheEntry): Promise<void> {
    await this.init();
    await this.db.run(
      `INSERT OR REPLACE INTO cache (key, model, createdAt, ttlMs, value) VALUES (?,?,?,?,?)`,
      entry.key,
      entry.model,
      entry.createdAt,
      entry.ttlMs,
      JSON.stringify(entry.value)
    );
  }
  async purgeExpired(now = Date.now()): Promise<number> {
    await this.init();
    const { changes } = await this.db.run(
      `DELETE FROM cache WHERE (? - createdAt) >= ttlMs`,
      now
    );
    return changes ?? 0;
  }
}

/* ---------- Factory ---------- */
export function createCacheFromEnv(): CacheStore | null {
  const ttlMs = parseInt(process.env.OC_CACHE_TTL_MS || '86400000', 10); // 24h
  const mode = (process.env.OC_CACHE_MODE || 'file').toLowerCase(); // file|sqlite|off
  if (mode === 'off') return null;
  if (mode === 'sqlite')
    return new SqliteCache(process.env.OC_CACHE_SQLITE || '.cache/opencode.db', ttlMs);
  return new FileCache(process.env.OC_CACHE_FILE || '.cache/opencode.jsonl', ttlMs);
}
