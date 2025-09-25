# agent.md — Integrating Claude Code Multi‑Agent Setup into Agent Factory with Subagents

## Overview

- **Purpose**: Use Claude Code personas as subagents inside coleam00/context-engineering-intro/use-cases/agent-factory-with-subagents.
- **What you'll add**:
  - `config/subagents.yaml` — your Claude Code agent catalog as subagents
  - `prompts/router.prompt.md` — router system prompt
  - Option A (TypeScript): `src/factory.ts` — minimal router + runner (Anthropic SDK)
  - Option B (Python): `src/factory.py` — same idea, Python version
- **Works in Claude Code** (UI) and as a programmatic CLI.
- **Strictly Claude Code**, MCP-agnostic. You can add tools later if your client supports them.

## 1) Quick start (repo integration)

- Fork/clone the repo: `context-engineering-intro/use-cases/agent-factory-with-subagents`
- Create files:
  - `agent.md` (this file)
  - `config/subagents.yaml` (below)
  - `prompts/router.prompt.md` (below)
  - EITHER `src/factory.ts` OR `src/factory.py` (below)
- Set `ANTHROPIC_API_KEY` in your env
- Run one of:
  - TypeScript: `npm i anthropic yaml tsx; npx tsx src/factory.ts "/use frontend-react: scaffold a vite+ts app"`
  - Python: `pip install anthropic pyyaml; python src/factory.py "/use frontend-react: scaffold a vite+ts app"`

## 2) Subagents catalog (drop into config/subagents.yaml)

```yaml
# config/subagents.yaml
agents:
  - id: orchestrator
    title: Orchestrator
    system: |
      You coordinate multi-agent work. Clarify goals, decompose tasks, and sequence steps.
      Keep changes small and testable. Confirm assumptions. Ensure interfaces and docs are updated.
      Output: brief plan, steps, diffs (if editing code), tests, and next steps.

  - id: project-manager
    title: Project Manager
    system: |
      Create scope, milestones, and acceptance criteria. Maintain a short backlog and priorities.
      Balance speed vs. quality. Define measurable outcomes and a rollout plan.

  - id: frontend-react
    title: Frontend (React/Vite/Tailwind)
    system: |
      Build accessible React (TypeScript) UI with Vite and Tailwind. Prefer hooks and React Query for remote data.
      Provide RTL tests, type-safe API hooks, and ARIA-compliant components.

  - id: frontend-webui
    title: Frontend (Vanilla Web UI)
    system: |
      Build vanilla TS/JS + HTML + CSS components with progressive enhancement and accessibility.
      Structure for testability; minimal DOM mutation; include small web component patterns when helpful.

  - id: node-api
    title: Backend (Node/Express)
    system: |
      Implement Express with TypeScript, Zod validation, and typed responses. Provide OpenAPI via swagger.
      Add integration tests with supertest and unit tests. Use Prisma for Postgres with safe migrations.

  - id: python-api
    title: Backend (Python/FastAPI)
    system: |
      Implement FastAPI endpoints with Pydantic v2 and async IO where appropriate.
      Add pytest + httpx tests, strong typing, docstrings, and OpenAPI.

  - id: java-api
    title: Backend (Java/Spring Boot)
    system: |
      Implement REST controllers, DTO validation, and service-layer patterns.
      Use JPA, Flyway, and tests (JUnit + MockMvc). Provide OpenAPI if applicable.

  - id: db-architect
    title: Database Architect
    system: |
      Design normalized schemas, migrations (Prisma/Flyway), seed scripts, and indexing strategy.
      Document data contracts and versioning; ensure idempotent migrations.

  - id: search-agent
    title: Web Search + Synthesis
    system: |
      Perform web research. Summarize with citations. Capture APIs, rate limits, and best practices.
      Output concise findings + an action plan.

  - id: scraper
    title: Web Scraper
    system: |
      Build robust scrapers (Playwright or requests+bs4) respecting robots.txt and terms.
      Implement retries, backoff, proxy support, structure guards, and deterministic fixtures.

  - id: downloader
    title: Downloader/ETL
    system: |
      Implement resumable concurrent downloads with integrity checks and metadata.
      Normalize and validate data; make ingestion idempotent.

  - id: security
    title: Security (SAST/SCA/Secrets)
    system: |
      Run dependency audits, secret scanning, basic SAST. Recommend minimal fixes and patch versions.
      Enforce validation and least-privilege configs. Provide a short threat checklist.

  - id: observability
    title: Observability (OTel/Logs/Metrics)
    system: |
      Add OpenTelemetry tracing, structured logs, Prometheus metrics, and health/readiness endpoints.
      Provide example dashboards and guidance on correlation IDs.

  - id: devops
    title: DevOps (Docker/CI/CD)
    system: |
      Create multi-stage Dockerfiles, docker-compose, and GitHub Actions with cache, test, build, and deploy steps.
      Add security scans, artifact uploads, and rollback safety. Keep images reproducible.

  - id: docs
    title: Docs/Runbooks
    system: |
      Write concise READMEs, API docs, and operational runbooks with commands and troubleshooting.
      Prefer task-oriented examples and Mermaid diagrams when helpful.

  - id: code-review
    title: Code Review
    system: |
      Provide prioritized, actionable feedback. Flag correctness, performance, security, maintainability issues.
      Verify tests/docs exist; suggest quick wins and deeper refactors with expected impact.

  # DFS-Specific Agents
  - id: dfs-optimizer
    title: DFS Optimizer Agent
    system: |
      Expert in fantasy sports optimization algorithms. Understands salary cap constraints, lineup generation,
      player projections, and contest strategies. Optimize for expected value and variance management.

  - id: dfs-data
    title: DFS Data Agent
    system: |
      Handles DraftKings/FanDuel API integration, injury reports, weather data, and player statistics.
      Implements data pipelines, validation, and caching for fantasy sports data.

  - id: react-dashboard
    title: React Dashboard Agent
    system: |
      Specialized in building professional DFS dashboards with React, TypeScript, and Tailwind.
      Creates data visualization, lineup builders, and interactive analytics components.

  - id: automation-agent
    title: Automation Agent
    system: |
      Sets up ESLint, Prettier, Jest, Pytest, GitHub Actions, Docker automation, and CI/CD pipelines.
      Implements pre-commit hooks, quality gates, and deployment automation for monorepo projects.
```

## 3) Router prompt (drop into prompts/router.prompt.md)

```md
You are the Router. Your job:

- If the message starts with "/use <agent-id>:", select that agent exactly.
- Otherwise, choose the best agent from the catalog for the user's task.
- Ask 1–2 clarifying questions only if necessary to route correctly.
- Return a strict JSON object: {"agentId": "<id>", "reason": "<short reason>"} and nothing else.
- Available agents are loaded from config/subagents.yaml (id + title + summary).
```

## 4) Option A — TypeScript factory (src/factory.ts)

```ts
// src/factory.ts
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import Anthropic from '@anthropic-ai/sdk';

type AgentDef = { id: string; title: string; system: string };
type Catalog = { agents: AgentDef[] };

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function loadCatalog(): Catalog {
  const p = path.resolve('config/subagents.yaml');
  const raw = fs.readFileSync(p, 'utf8');
  return YAML.parse(raw) as Catalog;
}

function extractSlashCommand(input: string): string | null {
  const m = input.match(/^\/use\s+([a-z0-9\-]+):/i);
  return m ? m[1] : null;
}

async function llmRoute(input: string, catalog: Catalog): Promise<string> {
  const routerPrompt = fs.readFileSync('prompts/router.prompt.md', 'utf8');
  const agentSummaries = catalog.agents.map(a => `- ${a.id}: ${a.title}`).join('\n');

  const res = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 200,
    system: routerPrompt + '\n\nAgents:\n' + agentSummaries,
    messages: [{ role: 'user', content: input }],
  });

  const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
  try {
    const json = JSON.parse(text.trim());
    return json.agentId || 'orchestrator';
  } catch {
    return 'orchestrator';
  }
}

async function runAgent(agent: AgentDef, input: string) {
  const globalRules = `
Return format:
- Brief plan (bullets)
- Steps and minimal code/diff where applicable
- Tests and docs to add
- Next steps
Keep answers concise and actionable.`;

  const res = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 1600,
    system: `${globalRules}\n\n[Agent: ${agent.id} - ${agent.title}]\n${agent.system}`,
    messages: [{ role: 'user', content: input }],
  });

  const out = res.content[0]?.type === 'text' ? res.content[0].text : '';
  console.log(out);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Set ANTHROPIC_API_KEY');
    process.exit(1);
  }
  const input = process.argv.slice(2).join(' ').trim();
  if (!input) {
    console.error('Usage: tsx src/factory.ts "/use frontend-react: build a navbar"');
    process.exit(1);
  }
  const catalog = loadCatalog();
  const explicit = extractSlashCommand(input);
  const agentId = explicit || (await llmRoute(input, catalog));
  const agent =
    catalog.agents.find(a => a.id === agentId) ||
    catalog.agents.find(a => a.id === 'orchestrator')!;
  await runAgent(agent, input);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
```

## 5) Option B — Python factory (src/factory.py)

```python
# src/factory.py
import os, sys, json, yaml
from anthropic import Anthropic

def load_catalog():
    with open("config/subagents.yaml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def extract_slash_command(text: str):
    import re
    m = re.match(r"^/use\s+([a-z0-9\-]+):", text, re.I)
    return m.group(1) if m else None

def llm_route(client, text, agents):
    with open("prompts/router.prompt.md", "r", encoding="utf-8") as f:
        router_prompt = f.read()
    summaries = "\n".join([f"- {a['id']}: {a['title']}" for a in agents])
    msg = client.messages.create(
        model="claude-3-5-sonnet-latest",
        max_tokens=200,
        system=router_prompt + "\n\nAgents:\n" + summaries,
        messages=[{"role": "user", "content": text}],
    )
    content = msg.content[0].text if msg.content and msg.content[0].type == "text" else ""
    try:
        j = json.loads(content.strip())
        return j.get("agentId", "orchestrator")
    except Exception:
        return "orchestrator"

def run_agent(client, agent, text):
    global_rules = """
Return format:
- Brief plan (bullets)
- Steps and minimal code/diff where applicable
- Tests and docs to add
- Next steps
Keep answers concise and actionable."""
    system = f"{global_rules}\n\n[Agent: {agent['id']} - {agent['title']}]\n{agent['system']}"
    msg = client.messages.create(
        model="claude-3-5-sonnet-latest",
        max_tokens=1600,
        system=system,
        messages=[{"role": "user", "content": text}],
    )
    print(msg.content[0].text if msg.content else "")

def main():
    if "ANTHROPIC_API_KEY" not in os.environ:
        print("Set ANTHROPIC_API_KEY", file=sys.stderr)
        sys.exit(1)
    text = " ".join(sys.argv[1:]).strip()
    if not text:
        print('Usage: python src/factory.py "/use frontend-react: build a navbar"', file=sys.stderr)
        sys.exit(1)

    client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    catalog = load_catalog()
    agents = catalog["agents"]
    explicit = extract_slash_command(text)
    agent_id = explicit or llm_route(client, text, agents)
    agent = next((a for a in agents if a["id"] == agent_id), next(a for a in agents if a["id"] == "orchestrator"))
    run_agent(client, agent, text)

if __name__ == "__main__":
    main()
```

## 6) Using it in Claude Code (no scripts required)

- Put `agent.md` and `config/subagents.yaml` at the repo root (or within that use-case directory).
- Open the folder in Claude Code and start a chat.
- **Paste this pinned instruction once per project**:

  > You will act as a multi-agent system. I will route with "/use <agent-id>: …" or ask you to route automatically. Use the subagent instructions in config/subagents.yaml. Keep outputs concise, include plans, diffs, tests, and next steps.

- Then invoke agents directly in chat:
  - `/use orchestrator: Plan a monorepo skeleton across React (Vite+TS), FastAPI, and Postgres. constraints: 2-week MVP, 85% coverage. outputs: milestones.md, acceptance-criteria.md`
  - `/use frontend-react: Scaffold a dashboard layout (sidebar + topbar) with Tailwind and dark mode. outputs: src/, tests/`
  - `/use node-api: Add /api/items CRUD with Zod validation + OpenAPI; include supertest tests. outputs: src/routes/, src/schemas/, tests/`
  - `/use automation-agent: Set up ESLint, Prettier, Jest, and GitHub Actions for this monorepo project`
  - `/use dfs-optimizer: Create a salary cap optimizer for DraftKings with constraint handling`
  - `/use react-dashboard: Build a professional DFS lineup builder component with player selection`

## 7) Quality baselines (bake into your pinned instruction if you like)

- **Type safety and validation**: Zod (Node), Pydantic (Python), Bean Validation (Java)
- **Lint/format/typecheck in CI**: ESLint/Prettier/tsc; Ruff/Black/mypy; Checkstyle/Spotless
- **Tests**: Jest/Vitest + RTL (frontend), Pytest + httpx (FastAPI), JUnit + MockMvc (Spring), Playwright for E2E
- **Security**: dep audit, secret scan, basic SAST, no hardcoded secrets
- **Observability**: OTel traces, structured logs, Prometheus metrics, health/readiness endpoints
- **Docs**: update README and runbooks; provide commands to run dev/test/build

## 8) Examples

### Programmatic (TS):

```bash
npx tsx src/factory.ts "/use db-architect: propose schema for users, projects, tasks (prisma). outputs: migrations, ERD.md"
```

### Programmatic (Python):

```bash
python src/factory.py "/use scraper: scrape example.com/products with Playwright, respect robots.txt, save JSON+fixtures"
```

### In Claude Code chat:

```
/use observability: Add OTel to Node and FastAPI; structured logs; Prom metrics; health endpoints. outputs: code + docs

/use security: Run secret scan + SCA; suggest minimal fixes + CI steps

/use automation-agent: Configure ESLint, Prettier, Jest, Pytest, and GitHub Actions for complete build automation

/use dfs-optimizer: Implement lineup optimization with salary cap constraints and player projections

/use react-dashboard: Create a professional DFS dashboard with lineup management and analytics
```

## DFS-Specific Agent Examples

### DFS Optimizer Agent Usage:

```
/use dfs-optimizer: Create a lineup optimizer that handles DraftKings salary cap ($50K), position requirements (QB, RB, RB, WR, WR, WR, TE, FLEX, DST), and maximizes projected points while managing ownership percentages.
```

### React Dashboard Agent Usage:

```
/use react-dashboard: Build a professional DFS dashboard with player pool table, lineup builder, contest selection, and results visualization. Use TypeScript, Tailwind, and React Query.
```

### Automation Agent Usage:

```
/use automation-agent: Set up complete build automation for a pnpm monorepo with React frontend, Python FastAPI backend, and Docker deployment. Include ESLint, Prettier, Jest, Pytest, and GitHub Actions.
```

## Notes

- This setup is **strictly Claude Code–compatible** and does not rely on Cline.
- If the agent-factory example expects a different config format, you can still keep `config/subagents.yaml` as the single source of truth and transform it inside the factory.
- Want me to generate a PR-ready branch for that repo (TS or Python flavor)? I can output exact file paths and open a patch set you can apply.

## Installation Commands

### TypeScript Setup:

```bash
npm i anthropic yaml tsx
npx tsx src/factory.ts "/use frontend-react: scaffold a vite+ts app"
```

### Python Setup:

```bash
pip install anthropic pyyaml
python src/factory.py "/use frontend-react: scaffold a vite+ts app"
```

## File Structure

```
agent-factory-with-subagents/
├── agent.md (this file)
├── config/
│   └── subagents.yaml
├── prompts/
│   └── router.prompt.md
└── src/
    ├── factory.ts (Option A)
    └── factory.py (Option B)
```
