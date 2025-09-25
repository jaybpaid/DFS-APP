# Master Build Plan: Python-First DFS Stack

## **PHASE 1: MCP WORKFLOW ORCHESTRATION**

### **MCP Task Distribution**

- **filesystem-mcp**: Create all API files, models, schemas
- **process-mcp**: Run pytest, build containers, dependency management
- **git-mcp**: Version control for all changes and evidence tracking
- **sqlite-mcp**: Store build progress, test results, performance metrics
- **memory-mcp**: Cache intermediate results and build state
- **playwright-mcp**: UI screenshots, visual validation, dashboard testing

## **PHASE 2: CORE INFRASTRUCTURE**

### **A) Pydantic v2 Models + JSON Schemas**

- `api/models/slates.py` - WeekMeta, SlatesResponse, GamesResponse
- `api/models/players.py` - PlayerEnriched, PlayersBySlateResponse
- `api/models/optimizer.py` - OptimizerRequest/Response with strict cap validation
- `api/models/analytics.py` - CorePlaysResponse, BoomBustResponse, NewsItemsResponse
- `contracts/schemas/*.json` - JSON Schema validation for all endpoints

### **B) Backend Libraries**

- `api/lib/weekly.py` ✅ - Thu→Mon ingestion with validation
- `api/lib/join.py` - Strict slate joins, assert gameId ∈ slate games
- `api/lib/caps.py` - DK=50000, FD=60000, showdown CPT=1.5x floor
- `api/lib/optimizer/` - OR-Tools single lineup with dup-aware objective
- `api/lib/sim/` - Monte Carlo portfolio simulation with deterministic seeds
- `api/lib/analytics.py` - Core plays, boom/bust, leverage scoring
- `api/lib/news.py` - RSS feed parsing with impact scoring
- `api/lib/cache.py` - Redis helpers with pub/sub channels

## **PHASE 3: API ENDPOINTS (Async + Schema Validated)**

### **Core Endpoints**

- `GET /api/healthz` ✅ - Health check with Redis status
- `GET /api/metrics` ✅ - Prometheus observability
- `GET /api/last_refresh` ✅ - Refresh timing
- `GET /api/week` ✅ - Week window data
- `GET /api/slates/{slateId}/players` ✅ - SLATE-SCOPED ONLY
- `GET /api/slates/{slateId}/games` - Games for slate
- `POST /api/optimize/single` - One-click lineup generation
- `POST /api/simulate` - Monte Carlo portfolio analysis
- `GET /api/slates/{slateId}/coreplays` - Core plays identification
- `GET /api/slates/{slateId}/boombust` - Boom/bust analysis
- `GET /api/news` - Live player news feed
- `GET /api/stream/refresh` ✅ - SSE data updates
- `GET /api/stream/news` - SSE news updates

## **PHASE 4: SINGLE LINEUP GENERATOR**

- Hard cap enforcement (never exceed $50K DK, $60K FD)
- Locks, exposures, stack constraints
- Dup-aware objective: proj - λ*dupRisk + β*leverageScore
- Signature hash for duplicate detection
- CSV export with cap validation

## **PHASE 5: SIMULATION ENGINE**

- Deterministic Monte Carlo with seeds
- Projection variance by position/usage
- Contest EV using payout curves
- ROI distribution, min-cash%, top%, dup histogram
- Portfolio exposure analysis

## **PHASE 6: LIVE DASHBOARD**

- Core plays (Chalk Leverage, Value, Sleepers)
- Boom/bust list (sortable by probability)
- Live news feed with impact scoring
- Ownership drift tracking
- Late swap alerts

## **PHASE 7: ADVANCED FEATURES**

- Late-swap protector
- Exposure targets (secondary solver pass)
- Portfolio filters (max dup risk, min leverage, min ROI)
- Visual diff (Playwright screenshots)
- CSV round-trip validator

## **PHASE 8: TESTING & VALIDATION**

- pytest + Hypothesis property tests
- MCP smoke tests
- Container health validation
- Evidence artifact generation

## **STARTING EXECUTION WITH MCP ORCHESTRATION**
