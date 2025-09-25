# OpenCode Multi-Agent (ONLY OpenRouter FREE Models, Token-Efficient)

**ROLE:** Build **OpenCode MA**, a multi-agent builder for frontends, backends, websites, infra, and **n8n**. Use **only** these OpenRouter FREE models (priority order; rotate on throttles):
`qwen/qwen3-coder:free, deepseek/deepseek-v3.1:free, deepseek/deepseek-r1:free, x-ai/grok-4-fast:free, moonshotai/kimi-k2:free`
**Caps notes (document in README):** `:free` ~20 req/min, daily quotas; add ≥$10 credits to raise to ~1000/day (still $0 on `:free`). If marathon builds hit caps, optional SDK toggle to direct DeepSeek (off by default).

## 1) Repo & Structure

Create `opencode-multi/` (Node 20+, TS strict, pnpm preferred).

```
.env.example, README.md, package.json, tsconfig.json
src/
  sdk/{openrouter.ts,rateLimiter.ts,models.ts,logging.ts}
  core/{bus.ts,memory.ts,artifacts.ts,orchestrator.ts,prompts.ts}
  agents/{planner.ts,researcher.ts,coder.ts,tester.ts,refactorer.ts,docs.ts,n8n.ts}
  cli/{oc-run.ts,oc-chat.ts}
test/{rateLimiter.test.ts,openrouter.test.ts,orchestrator.test.ts}
docker/{Dockerfile,entrypoint.sh}
python/client.py
```

## 2) Environment (.env.example) — OpenRouter-only

```
OPENROUTER_API_KEY=sk-or-REPLACE_ME
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL_LIST=qwen/qwen3-coder:free,deepseek/deepseek-v3.1:free,deepseek/deepseek-r1:free,x-ai/grok-4-fast:free,moonshotai/kimi-k2:free
OC_TEMPERATURE=0.2
OC_MAX_TOKENS=2048
OC_MAX_RETRIES=6
OC_BASE_DELAY_MS=500
OC_MAX_DELAY_MS=15000
OC_COOLDOWN_MS=60000
OC_AGENT_MAX_PASSES=3
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=REPLACE_ME
```

Fail clearly if key or model list missing; never log secrets. If `grok-4-fast:free` vanishes, warn once and continue.

## 3) SDK & Rotation

- `openrouter.ts`: OpenAI-compatible `/chat/completions` via `OPENROUTER_BASE_URL`; `chat` + `chatStream`, honor explicit `model`; otherwise rotate.
- `rateLimiter.ts`: exponential backoff + jitter; **cooldown model on 429/5xx**; rotate through the 5 IDs; support AbortSignal; concise logs.
- `models.ts`: parse/validate model list; warn once on 401/404 and continue.
- `logging.ts`: structured logs, no secrets.

## 4) Multi-Agent Orchestration (token-efficient)

- **Agents:** Planner → Researcher → (for each step) Coder → Tester → (if fail) Refactorer → Tester (≤ `OC_AGENT_MAX_PASSES`) → Docs; plus `n8n` agent to emit workflow JSON + verify script.
- **Coordinator:** light router; dedupe context; cap iterations.
- **Prompts:** small & deterministic; request **unified diffs** or full files (new files only).
- **Researcher:** repo map (≤150 files, ≤80 chars/line) + 3–5 API snippets only.
- **Tester:** run `tsc --noEmit`, tests; return **≤60-line** failure slices.
- **Refactorer:** minimal edits to green tests.
- **Docs:** README/USAGE with runnable examples (≤200 lines).
- **Stop on pass**, stream long gens; per-role `max_tokens`: Planner 600, Coder 1500, others 600–900.

## 5) MCP Servers (stdio only; add to Cline)

- `fs-mcp` (file I/O), `shell-mcp` (commands), `git-mcp`, `http-mcp` (REST), `openapi-mcp` (client gen), `docker-mcp`, `sqlite-mcp`
- Optional: `playwright-mcp`/`browser-mcp` (e2e), `kubernetes-mcp`
- `n8n-mcp` if available; else `http-mcp` → `N8N_BASE_URL` with `X-API-Key`.

## 6) CLIs

- `oc-run`: `npx oc-run --goal "Add /healthz route" --repo .` (prints stage, **model used**, retries, compact outputs)
- `oc-chat`: `npx oc-chat -p "Short prompt" -m auto --stream`

## 7) Tests (Vitest)

- `rateLimiter.test.ts`: rotation order, 429 cooldown, backoff growth + jitter bounds
- `openrouter.test.ts`: success; 429→rotate→success; 500→retry→success; 400→no retry
- `orchestrator.test.ts`: happy path; fail→fix; max-pass abort

## 8) Docker

- Node 20-alpine; install pnpm; copy repo; `pnpm i`
- `entrypoint.sh` dispatches to `oc-run`/`oc-chat`; doc `docker run --env-file .env …`

## 9) Acceptance (must pass before finish)

- `pnpm typecheck` OK
- `pnpm test` OK
- `npx oc-run --goal "Add /hello route" --repo .` completes once end-to-end
- Atomic git commits per step; no secrets in logs
- **Only** the five `:free` models; rotate on throttles

**Deliver everything above exactly.**
