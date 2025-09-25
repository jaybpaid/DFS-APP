# DFS Optimizer - Battle-Ready Sim-First Platform

## Professional DFS lineup optimization with contest simulation and CSV round-trip

---

## 🎯 Overview

A comprehensive DFS optimization platform that replicates the workflows of industry leaders like Stokastic and SaberSim. Features sim-first optimization, contest-aware ROI ranking, and complete CSV round-trip functionality.

### Key Features

- **Sim-First Workflow**: Contest Generator → Simulate → Rank by ROI → Export
- **40K+ Monte Carlo Simulations**: Full correlation modeling and payout awareness
- **CSV Round-Trip**: Import DK/FD contest CSV → Optimize → Export upload-ready CSV
- **Late Swap Engine**: Lock played positions → Generate variants → Simulate → Export swaps
- **Advanced Metrics**: Boom/Bust/ROI/Win%/Leverage with weighted Overall Score
- **Multi-Source Data**: Projections, ownership, Vegas lines, weather integration

---

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Install dependencies
make install

# Check MCP server health
make mcp-health
```

### 2. Start Development

```bash
# Start all services
make dev

# Or run individual components
python ../live_optimizer_api.py  # API server
open ../dfs_ultimate_optimizer_with_live_data.html  # Dashboard
```

### 3. Run Demo

```bash
# Test all systems
make demo
```

---

## 📋 Architecture

### Monorepo Structure

```
dfs-optimizer/
├── apps/web/              # Next.js frontend (future)
├── services/
│   ├── sim/               # Simulation & optimization engine
│   │   ├── model.py       # Monte Carlo simulation
│   │   └── optimizer.py   # Lineup optimization
│   └── ingest/            # Data ingestion & CSV management
│       └── csv_manager.py # CSV import/export
├── packages/shared/       # Shared types & utilities
│   └── types.ts          # TypeScript type definitions
├── docs/                 # Documentation
│   ├── ux-spec.md        # UX specification
│   └── data-feeds.md     # Data architecture
└── Makefile              # Development commands
```

---

## 🔧 Core Components

### 1. Simulation Engine (`services/sim/model.py`)

- **PlayerOutcomeSampler**: Samples player performance with correlation
- **ContestSimulator**: Runs 40K+ Monte Carlo simulations
- **MetricsAggregator**: Calculates Boom/Bust/ROI/Win%/Leverage scores
- **FieldModel**: Models contest field for realistic simulation

### 2. Optimization Engine (`services/sim/optimizer.py`)

- **ConstraintOptimizer**: ILP/MIP-based optimization with PuLP
- **SimGuidedSampler**: SaberSim-style sampling with correlation
- **StackBuilder**: QB+WR, QB+2WR, Game stacks, Bring-back stacks
- **LineupBuilder**: Orchestrates optimization strategies

### 3. CSV Manager (`services/ingest/csv_manager.py`)

- **CSVImporter**: Parses DraftKings/FanDuel contest CSV files
- **CSVExporter**: Generates site-compatible upload CSV files
- **EntryManager**: Assigns lineups to contest entries
- **LateSwapManager**: Complete late swap workflow

---

## 📊 Metrics & Scoring

### Core Metrics (Stokastic/SaberSim Style)

- **Boom%**: P(lineup_score ≥ 80th percentile)
- **Bust%**: P(lineup_score ≤ 20th percentile)
- **ROI**: Expected return from contest-aware simulations
- **Win%**: P(finish in target percentile for contest type)
- **Leverage**: (Optimal% - Ownership%) for contrarian edge

### Overall Score Formula

```
Overall Score = w1*Z(ROI) + w2*Z(Win%) + w3*Z(Boom% - Bust%) + w4*Z(Leverage)
```

**Weight Presets**:

- **Balanced**: ROI(40%) + Win%(25%) + Boom/Bust(20%) + Leverage(15%)
- **ROI Focused**: ROI(60%) + Win%(20%) + Boom/Bust(10%) + Leverage(10%)
- **Win Focused**: ROI(20%) + Win%(50%) + Boom/Bust(20%) + Leverage(10%)
- **Leverage Focused**: ROI(30%) + Win%(20%) + Boom/Bust(20%) + Leverage(30%)

---

## 🔄 Workflows

### A. Contest Generator → Sims Workflow (Stokastic Style)

1. **Choose site & slate** (DK/FD, Main/Showdown)
2. **Generate lineup pool** (or upload existing)
3. **Simulate contests** (40K+ iterations with payout curves)
4. **Rank by ROI/EV** (not just raw projection)
5. **Export via Entry Manager** (upload-ready CSV)

### B. Late Swap Workflow

1. **Import contest CSV** (your existing entries)
2. **Lock played positions** (games already started)
3. **Generate swappable variants** (updated projections)
4. **Simulate variants** (40K+ iterations each)
5. **Export optimized swaps** (DK/FD compatible CSV)

### C. CSV Round-Trip

1. **Upload DK/FD contest CSV** → Parse entries and lineups
2. **Assign optimized lineups** → Map lineups to entries
3. **Export upload-ready CSV** → Proper format and file limits
4. **Upload to DFS site** → Direct upload to DraftKings/FanDuel

---

## 🎮 API Endpoints

### Core Optimization

```
POST /api/generate-lineups     # Generate optimized lineups
POST /api/run-simulation       # Run Monte Carlo simulation
POST /api/calculate-swaps      # Calculate late swap opportunities
```

### CSV Management

```
POST /api/upload-csv           # Upload and parse contest CSV
POST /api/generate-swap-variants  # Generate lineup variants
POST /api/simulate-field       # Simulate vs projected field
POST /api/export-optimized     # Export optimized CSV
```

### Data Feeds

```
GET /api/slates/:sport/:date   # Get available slates
GET /api/players/:slate_id     # Get player pool
GET /api/contests/:slate_id    # Get contest information
```

---

## 🏗️ Data Model

### Player Schema

```json
{
  "id": "string",
  "name": "string",
  "position": "string",
  "team": "string",
  "salary": "number",
  "projection": {
    "mean": "number",
    "std_dev": "number",
    "consensus": "number"
  },
  "ownership": {
    "projected": "number",
    "confidence": "number"
  },
  "advanced_metrics": {
    "boom_pct": "number",
    "bust_pct": "number",
    "leverage_score": "number"
  }
}
```

### Simulation Results Schema

```json
{
  "lineup_id": "string",
  "iterations": "number",
  "boom_pct": "number",
  "bust_pct": "number",
  "roi": "number",
  "win_pct": "number",
  "optimal_pct": "number",
  "sharpe_ratio": "number",
  "overall_score": "number"
}
```

---

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Data Providers (user-owned keys)
SPORTSDATAIO_API_KEY=your_key_here
FANTASYNERDS_API_KEY=your_key_here
ODDS_API_KEY=your_key_here
WEATHER_API_KEY=your_key_here

# Database & Cache
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgres://dfs:dfs@localhost:5432/dfs

# Application
API_PORT=8000
WEB_PORT=3000
LOG_LEVEL=info

# Feature Flags
ENABLE_LIVE_DATA=true
ENABLE_AI_ANALYSIS=true
ENABLE_MONTE_CARLO=true
ENABLE_LATE_SWAP=true
```

### MCP Server Configuration

MCP servers provide additional tools and data sources:

- **filesystem**: File operations
- **brave-search**: Web research and data gathering
- **browser-use**: Automated browser testing
- **memory**: Knowledge graph for player insights

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
make test

# Test individual components
cd services/sim && python model.py
cd services/sim && python optimizer.py
cd services/ingest && python csv_manager.py
```

### E2E Testing

```bash
# Full workflow test
make demo

# Manual testing
python ../live_optimizer_api.py  # Start API
# Upload CSV via dashboard
# Generate lineups
# Run simulation
# Export optimized CSV
```

---

## 📈 Performance Benchmarks

### Target Performance

- **Player pool loading**: <2 seconds
- **Lineup generation**: <10 seconds for 20 lineups
- **40K simulation**: <30 seconds
- **CSV processing**: <5 seconds for 500 lineups
- **CSV round-trip**: <15 seconds end-to-end

### Optimization Strategies

- **Constraint-based**: ILP/MIP for exact solutions
- **Sim-guided**: Sampling with correlation awareness
- **Hybrid**: Combine both for best results

---

## 🎯 Competitive Feature Parity

### vs. Stokastic

✅ Contest Generator with field size matching  
✅ Sim-first workflow with ROI ranking  
✅ Entry Manager with CSV round-trip  
✅ Late swap with 4-step process  
✅ Upload-ready CSV export

### vs. SaberSim

✅ Sim-aware optimizer with correlation  
✅ Contest Sims for ROI optimization  
✅ Min Uniques & Portfolio Diversifier  
✅ Ownership fade/boost controls  
✅ Entry Editor functionality

### vs. RotoWire/DailyFantasyFuel

✅ Multi-site support (DK/FD/Yahoo)  
✅ Advanced filtering and constraints  
✅ Stacking rules and templates  
✅ Exposure controls and limits  
✅ Custom projection upload

---

## 🚀 Deployment

### Local Development

```bash
make dev
```

### Docker Deployment

```bash
cd ..
docker-compose up -d
```

### Production Deployment

```bash
make build
# Deploy to your preferred platform
```

---

## 📚 Documentation

- **[UX Specification](docs/ux-spec.md)**: Competitive analysis and UI patterns
- **[Data Feeds](docs/data-feeds.md)**: Multi-source data integration
- **[API Documentation](../README.md)**: Complete API reference
- **[Docker Guide](../README_DOCKER.md)**: Containerization setup

---

## 🎮 Usage Examples

### 1. Basic Lineup Generation

```python
import asyncio
from services.sim.optimizer import generate_optimized_lineups

async def generate_lineups():
    result = await generate_optimized_lineups({
        'players': player_pool,
        'settings': {
            'sport': 'nfl',
            'site': 'draftkings',
            'num_lineups': 20,
            'objective': 'ev',
            'enable_stacking': True,
            'stack_types': ['qb_wr', 'qb_2wr']
        }
    })
    return result['lineups']
```

### 2. Contest Simulation

```python
from services.sim.model import run_simulation

async def simulate_contest():
    result = await run_simulation({
        'lineups': generated_lineups,
        'contest': contest_info,
        'players': player_pool,
        'num_simulations': 40000
    })
    return result['ranked_lineups']
```

### 3. CSV Round-Trip

```python
from services.ingest.csv_manager import import_csv, export_csv

# Import existing contest CSV
import_result = await import_csv(csv_content, 'draftkings')

# Export optimized lineups
export_result = await export_csv(
    optimized_lineups,
    import_result['entries'],
    'draftkings',
    include_projections=True
)
```

---

## 🏆 Success Metrics

### User Engagement Targets

- Time to first lineup: <60 seconds
- Lineup generation success: >95%
- CSV round-trip success: >98%
- User retention (week 1): >40%

### Feature Adoption Targets

- Stacking usage: >60% of users
- Simulation usage: >80% of pro users
- CSV import/export: >90% of active users
- Late swap usage: >50% during live slates

---

## 🔮 Roadmap

### Phase 1: Core Platform ✅

- [x] Simulation engine with Boom/Bust/ROI/Win%
- [x] Constraint-based optimizer
- [x] CSV import/export with DK/FD formats
- [x] Late swap workflow

### Phase 2: Advanced Features

- [ ] Next.js web application
- [ ] Real-time data feeds
- [ ] Multi-source projection blending
- [ ] Advanced portfolio management

### Phase 3: Premium Features

- [ ] Live ownership tracking
- [ ] AI-enhanced projections
- [ ] Social features and sharing
- [ ] Mobile application

---

## 🤝 Contributing

### Development Setup

1. Clone repository
2. Copy `.env.example` to `.env` and configure
3. Run `make setup`
4. Start development with `make dev`

### Testing

- Run `make test` for unit tests
- Run `make demo` for E2E testing
- Manual testing via dashboard

---

## 📄 License

This project is for educational and personal use. Respect DFS site terms of service and rate limits.

---

## 🆘 Support

### Common Issues

1. **MCP servers failing**: Run `make mcp-health` and check environment variables
2. **API server not starting**: Check port 8000 availability
3. **CSV import errors**: Validate CSV format matches DK/FD specification
4. **Simulation timeouts**: Reduce iteration count for testing

### Getting Help

- Check documentation in `docs/` folder
- Review API logs for error details
- Test individual components with `make demo`

---

**Built with competitive analysis of RotoWire, DailyFantasyFuel, Stokastic, and SaberSim**
