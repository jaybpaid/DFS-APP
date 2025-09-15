# Data Feeds Architecture
## Multi-Source Data Integration for DFS Optimizer

---

## Overview

The DFS Optimizer integrates multiple data sources to provide comprehensive player analysis, ownership projections, and contest simulation. This document outlines the data feed architecture, schemas, and integration patterns.

---

## 1. Data Source Categories

### A. Primary Data Sources (Required)
- **DraftKings API**: Unofficial endpoints for draftgroups/draftables (brittle, may change)
- **FanDuel API**: No stable public endpoints; prefer paid feeds or user-owned logged-in access
- **Vegas Odds**: The Odds API, SportsDataIO, Sportradar (enterprise)
- **Weather API**: OpenWeatherMap, WeatherAPI, Weather.gov (free tiers available)

### B. Projection Sources (Configurable)
- **Internal Projections**: Algorithm-based projections using Vegas lines, historical data
- **Custom CSV Upload**: User-provided projections and ownership estimates
- **Third-Party APIs**: 
  - **FantasyNerds**: DFS slates → player salaries/projections for DK/FD/Yahoo
  - **SportsDataIO**: Salaries, projections, ownership (sports dependent)
  - **RotoWire**: Depth charts & injury data (API requires license)
- **Consensus Projections**: Weighted average of multiple sources with reliability scoring

### C. Ownership Sources (Premium)
- **Historical Ownership**: Platform-specific ownership patterns from past contests
- **Projected Ownership**: Algorithm-based ownership predictions using Vegas lines, player popularity
- **Real-Time Ownership**: Live ownership tracking (where available through paid services)
- **Custom Ownership**: User-provided ownership estimates via CSV upload

### D. Injury & News Sources
- **RotoWire**: Depth charts and injury reports (web scraping with respect to ToS)
- **Sleeper API**: Public endpoints for news/alerts (community references)
- **Team Websites**: Official injury reports and depth charts

### E. Open Source References & Community Tools
- **jaebradley/draftkings_client**: Python client for DraftKings API
- **pydfs-lineup-optimizer**: Multi-site ILP optimizer with constraint support
- **draftfast**: Lineup automation/optimizer for DK/FD
- **GitHub daily-fantasy-sports topic**: Active community projects and tools

---

## 2. Data Feed Pipeline

### A. Ingestion Layer
```typescript
interface DataIngestionPipeline {
  sources: DataFeed[];
  schedulers: IngestionScheduler[];
  processors: DataProcessor[];
  validators: DataValidator[];
  cache: CacheManager;
}
```

### B. Processing Flow
```
Raw Data → Validation → Normalization → Enrichment → Caching → API Serving
```

### C. Update Frequencies
- **Salary Data**: Every 15 minutes
- **Injury Reports**: Every 5 minutes
- **Weather Data**: Every 30 minutes
- **Vegas Lines**: Every 10 minutes
- **Projections**: Every 30 minutes or on news events

---

## 3. API Endpoints

### A. Slate Management
```typescript
GET /api/slates/:sport/:date
GET /api/slates/:id/players
GET /api/slates/:id/contests
POST /api/slates/refresh
```

### B. Player Data
```typescript
GET /api/players/:slate_id
GET /api/players/:id/projections
GET /api/players/:id/ownership
POST /api/players/bulk-update
```

### C. Contest Data
```typescript
GET /api/contests/:slate_id
GET /api/contests/:id/payouts
GET /api/contests/:id/field-analysis
```

### D. Optimization
```typescript
POST /api/optimize/lineups
POST /api/optimize/simulate
POST /api/optimize/late-swap
```

### E. CSV Management
```typescript
POST /api/csv/import
POST /api/csv/export
GET /api/csv/validate
```

---

## 4. Data Schemas

### A. Player Data Schema
```json
{
  "id": "string",
  "name": "string", 
  "position": "string",
  "team": "string",
  "salary": "number",
  "game_id": "string",
  "projection": {
    "mean": "number",
    "std_dev": "number",
    "sources": [
      {
        "name": "string",
        "value": "number",
        "weight": "number",
        "reliability": "number"
      }
    ],
    "consensus": "number",
    "confidence": "number",
    "last_updated": "string"
  },
  "ownership": {
    "projected": "number",
    "sources": [
      {
        "name": "string",
        "value": "number",
        "sample_size": "number"
      }
    ],
    "confidence": "number",
    "trend": "string"
  },
  "advanced_metrics": {
    "boom_pct": "number",
    "bust_pct": "number", 
    "floor": "number",
    "ceiling": "number",
    "leverage_score": "number",
    "correlation_score": "number",
    "volatility": "number"
  },
  "meta": {
    "injury_status": "string",
    "news_impact": "number",
    "depth_chart_position": "number"
  }
}
```

### B. Contest Schema
```json
{
  "id": "string",
  "name": "string",
  "site": "string",
  "entry_fee": "number",
  "max_entries": "number", 
  "total_entries": "number",
  "prize_pool": "number",
  "payout_structure": {
    "places_paid": "number",
    "payouts": [
      {
        "place_start": "number",
        "place_end": "number", 
        "amount": "number"
      }
    ],
    "top_heavy_factor": "number"
  },
  "contest_type": "string",
  "field_size": "number"
}
```

### C. Simulation Results Schema
```json
{
  "lineup_id": "string",
  "iterations": "number",
  "results": {
    "mean_score": "number",
    "std_dev": "number",
    "percentiles": {
      "10": "number",
      "25": "number", 
      "50": "number",
      "75": "number",
      "90": "number",
      "95": "number"
    },
    "win_rate": "number",
    "optimal_rate": "number",
    "roi": "number",
    "sharpe": "number",
    "max_drawdown": "number"
  }
}
```

---

## 5. Data Source Adapters

### A. DraftKings Adapter
```typescript
class DraftKingsAdapter implements DataFeedAdapter {
  async getSlates(sport: string, date: string): Promise<Slate[]>
  async getPlayers(slateId: string): Promise<Player[]>
  async getContests(slateId: string): Promise<Contest[]>
}
```

### B. Vegas Odds Adapter
```typescript
class VegasOddsAdapter implements DataFeedAdapter {
  async getGameOdds(gameIds: string[]): Promise<GameOdds[]>
  async getPlayerProps(playerIds: string[]): Promise<PlayerProp[]>
}
```

### C. Weather Adapter
```typescript
class WeatherAdapter implements DataFeedAdapter {
  async getGameWeather(gameIds: string[]): Promise<WeatherData[]>
}
```

---

## 6. Caching Strategy

### A. Redis Cache Layers
- **L1 Cache**: Frequently accessed data (5 min TTL)
- **L2 Cache**: Player projections (15 min TTL)
- **L3 Cache**: Historical data (24 hour TTL)

### B. Cache Keys
```
slate:{sport}:{date}
players:{slate_id}
contests:{slate_id}
projections:{player_id}:{source}
ownership:{player_id}:{date}
```

---

## 7. Data Quality & Validation

### A. Validation Rules
- **Salary Validation**: Must be positive integer
- **Projection Validation**: Must be positive number with reasonable bounds
- **Ownership Validation**: Must be 0-100%
- **Game Validation**: Start times must be future dates

### B. Data Quality Metrics
- **Completeness**: % of required fields populated
- **Freshness**: Time since last update
- **Accuracy**: Validation against known good sources
- **Consistency**: Cross-source data agreement

---

## 8. Error Handling

### A. Graceful Degradation
- **Primary Source Failure**: Fall back to cached data
- **Projection Source Failure**: Use consensus of available sources
- **API Rate Limiting**: Implement exponential backoff
- **Network Issues**: Retry with circuit breaker pattern

### B. Error Reporting
```typescript
interface DataFeedError {
  source: string;
  error_type: 'timeout' | 'rate_limit' | 'invalid_data' | 'auth_failure';
  message: string;
  timestamp: string;
  retry_count: number;
}
```

---

## 9. Required Environment Variables

```bash
# Data Provider APIs (user-owned keys)
SPORTSDATAIO_API_KEY=your_key_here
FANTASYNERDS_API_KEY=your_key_here
ODDS_API_KEY=your_key_here
WEATHER_API_KEY=your_key_here

# Database & Cache
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgres://dfs:dfs@localhost:5432/dfs

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=60
REQUEST_TIMEOUT=30000

# Feature Flags
ENABLE_LIVE_DATA=true
ENABLE_MULTI_SOURCE=true
ENABLE_OWNERSHIP_TRACKING=true
```

---

## 10. Implementation Checklist

### Phase 1: Basic Data Feeds
- [ ] DraftKings salary data adapter
- [ ] FanDuel salary data adapter
- [ ] Basic projection engine
- [ ] Redis caching layer
- [ ] API endpoint structure

### Phase 2: Enhanced Data
- [ ] Vegas odds integration
- [ ] Weather data for outdoor sports
- [ ] Injury report integration
- [ ] Multi-source projection blending
- [ ] Ownership projection engine

### Phase 3: Advanced Features
- [ ] Real-time data updates
- [ ] Custom projection upload
- [ ] Historical data analysis
- [ ] Data quality monitoring
- [ ] Performance optimization

---

**__CLINE_DONE__ DATA_FEEDS**
