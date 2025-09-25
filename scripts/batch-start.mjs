#!/usr/bin/env node
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const CFG = 'mcp/mcpServers.fixed.json';
const BATCH_SIZE = parseInt(process.env.MCP_BATCH_SIZE || '6', 10);
const STAGGER_MS = parseInt(process.env.MCP_STAGGER_MS || '1500', 10);
const CRASH_WINDOW_MS = 10000;

const cfg = JSON.parse(fs.readFileSync(CFG, 'utf8'));
const servers = Object.entries(cfg.mcpServers);

function startOne([name, spec]) {
  return new Promise(resolve => {
    const args = spec.args || [];
    const env = { ...process.env, ...(spec.env || {}) };
    const child = spawn(spec.command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let crashed = false,
      timer = setTimeout(() => resolve({ name, ok: true }), CRASH_WINDOW_MS);

    child.on('error', () => {
      crashed = true;
      clearTimeout(timer);
      resolve({ name, ok: false, reason: 'spawn_error' });
    });
    child.stderr.on('data', d => {
      const s = String(d || '');
      if (/error|EADDRINUSE|missing|not found|denied/i.test(s)) {
        crashed = true;
      }
    });
    child.on('exit', code => {
      if (!crashed) crashed = code !== 0 && code !== null;
      clearTimeout(timer);
      resolve({ name, ok: !crashed, reason: crashed ? 'early_exit' : '' });
    });
  });
}

(async () => {
  const results = [];
  for (let i = 0; i < servers.length; i += BATCH_SIZE) {
    const batch = servers.slice(i, i + BATCH_SIZE);
    const promises = batch.map(
      (entry, idx) =>
        new Promise(res =>
          setTimeout(() => startOne(entry).then(res), idx * STAGGER_MS)
        )
    );
    const r = await Promise.all(promises);
    results.push(...r);
  }
  const ok = results
    .filter(r => r.ok)
    .map(r => `✅ ${r.name}`)
    .join('\n');
  const bad = results
    .filter(r => !r.ok)
    .map(r => `❌ ${r.name} — ${r.reason || 'crash'}`)
    .join('\n');
  console.log('=== MCP FLEET START RESULTS ===');
  console.log(ok || '(none)');
  console.log(bad ? '\n---\n' + bad : '');
})();
