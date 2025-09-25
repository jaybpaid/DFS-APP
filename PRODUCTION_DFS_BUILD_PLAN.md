# Production DFS Optimizer Build Plan

## **EXECUTION PHASE 1: MCP Gateway Setup**

### **Step 1.1: Docker Compose Services**

```yaml
# Adding to existing docker-compose.yml
services:
  filesystem_mcp:
    image: node:18-alpine
    container_name: filesystem_mcp
    working_dir: /app
    command: node dist/server.js
    volumes:
      - ./:/workspace:ro
      - mcp_data:/srv/mcp
    networks:
      - mcp_internal

  process_mcp:
    image: node:18-alpine
    container_name: process_mcp
    working_dir: /app
    command: node dist/server.js
    volumes:
      - ./:/workspace:ro
    networks:
      - mcp_internal

  playwright_mcp:
    image: mcr.microsoft.com/playwright:focal
    container_name: playwright_mcp
    working_dir: /app
    command: node dist/server.js
    networks:
      - mcp_internal

  git_mcp:
    image: node:18-alpine
    container_name: git_mcp
    working_dir: /app
    command: node dist/server.js
    volumes:
      - ./:/workspace
    networks:
      - mcp_internal

  sqlite_mcp:
    image: node:18-alpine
    container_name: sqlite_mcp
    working_dir: /app
    command: node dist/server.js
    volumes:
      - mcp_data:/data
    networks:
      - mcp_internal

  memory_mcp:
    image: node:18-alpine
    container_name: memory_mcp
    working_dir: /app
    command: node dist/server.js
    volumes:
      - mcp_data:/data
    networks:
      - mcp_internal

networks:
  mcp_internal:
    driver: bridge

volumes:
  mcp_data:
```

### **Step 1.2: STDIO Shims**

```bash
# ./shims/filesystem.sh
#!/bin/bash
exec docker exec -i filesystem_mcp node /app/dist/server.js "$@"

# ./shims/process.sh
#!/bin/bash
exec docker exec -i process_mcp node /app/dist/server.js "$@"

# ./shims/playwright.sh
#!/bin/bash
exec docker exec -i playwright_mcp node /app/dist/server.js "$@"

# ./shims/git.sh
#!/bin/bash
exec docker exec -i git_mcp node /app/dist/server.js "$@"

# ./shims/sqlite.sh
#!/bin/bash
exec docker exec -i sqlite_mcp node /app/dist/server.js "$@"

# ./shims/memory.sh
#!/bin/bash
exec docker exec -i memory_mcp node /app/dist/server.js "$@"
```

### **Step 1.3: Claude Desktop Config**

```json
{
  "mcpServers": {
    "filesystem": { "command": "./shims/filesystem.sh", "args": [] },
    "process": { "command": "./shims/process.sh", "args": [] },
    "playwright": { "command": "./shims/playwright.sh", "args": [] },
    "git": { "command": "./shims/git.sh", "args": [] },
    "sqlite": { "command": "./shims/sqlite.sh", "args": [] },
    "memory": { "command": "./shims/memory.sh", "args": [] }
  }
}
```

## **EXECUTION PHASE 2: FastAPI Backend**

### **Step 2.1: Core FastAPI App**

```python
# api/app.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import asyncio
import redis.asyncio as redis
from prometheus_client import Counter, Histogram, generate_latest
import uvicorn

app = FastAPI(title="DFS Optimizer API", version="2.0.0")

# Prometheus metrics
REQUEST_COUNT = Counter('requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('request_duration_seconds', 'Request duration')

@app.get("/api/healthz")
async def healthz():
    return {"ok": True, "service": "dfs-optimizer-api"}

@app.get("/metrics")
async def metrics():
    return StreamingResponse(
        iter([generate_latest()]),
        media_type="text/plain"
    )
```

### **Step 2.2: Weekly Ingestion System**

```python
# api/lib/weekly.py
from datetime import datetime, timedelta
import asyncio
from pathlib import Path

def compute_week_window(target_date: datetime) -> tuple[datetime, datetime]:
    """Thu→Mon window computation"""
    # Find the Thursday before target_date
    days_since_thursday = (target_date.weekday() - 3) % 7
    week_start = target_date - timedelta(days=days_since_thursday)
    week_end = week_start + timedelta(days=4)  # Mon
    return week_start, week_end

async def ingest_week(sport: str, site: str, week_start: datetime):
    """Ingest all slates for Thu→Mon window"""
    week_path = Path(f"/app/data/{sport}/{site}/{week_start.strftime('%Y-%m-%d_week')}")
    week_path.mkdir(parents=True, exist_ok=True)

    # Save week metadata
    meta = {
        "weekStart": week_start.isoformat(),
        "sport": sport,
        "site": site,
        "slateIds": []  # populated during ingest
    }

    # Write week_meta.json
    with open(week_path / "week_meta.json", "w") as f:
        json.dump(meta, f, indent=2)
```

## **EXECUTION PHASE 3: Testing Framework**

### **Step 3.1: Core Tests**

```python
# tests/test_caps.py
import pytest
from api.lib.caps import get_salary_cap, validate_lineup_cap

def test_dk_classic_cap():
    assert get_salary_cap("DK", "classic") == 50000

def test_dk_showdown_cpt_multiplier():
    cpt_salary = 8000 * 1.5  # floor
    assert cpt_salary == 12000

@pytest.mark.hypothesis
def test_random_lineups_never_exceed_cap(lineup_generator):
    lineup = lineup_generator()
    assert sum(p.salary for p in lineup) <= 50000
```

## **STARTING EXECUTION NOW**

<task_progress>

- [ ] Phase 1: Setup MCP Gateway with 6 free MCP servers
- [ ] Phase 2: Implement FastAPI backend with weekly ingestion
- [ ] Phase 3: Add slate-scoped APIs with SSE refresh
- [ ] Phase 4: Implement advanced analytics and optimization
- [ ] Phase 5: Create comprehensive test suite
- [ ] Phase 6: Deploy and validate production system
- [ ] Phase 7: Generate evidence artifacts
      </task_progress>
      </write_to_file>
