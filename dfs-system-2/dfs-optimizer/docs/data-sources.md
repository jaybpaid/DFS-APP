# Data Sources Registry
## Comprehensive Directory of DFS Data Feeds and APIs

---

## Overview

This registry documents all available data sources for DFS optimization, including official APIs, community tools, and research references. Sources are categorized by type, availability, and integration status.

---

## 1. Official DFS Platform APIs

### DraftKings (Unofficial Endpoints)
- **Status**: Unofficial, volatile, may change without notice
- **Endpoints**: 
  - DraftGroups → `/draftgroups/v1/draftgroups`
  - Draftables → `/draftgroups/v1/draftgroups/{draftGroupId}/draftables`
- **Auth**: None required (public endpoints)
- **Rate Limits**: Unknown, implement conservative limits
- **Coverage**: NFL, NBA, MLB, NHL, PGA, MMA
- **References**: jaebradley/draftkings_client GitHub repo
- **Integration Status**: Partial implementation

### FanDuel
- **Status**: No stable public endpoints
- **Approach**: Use paid feeds or user-owned logged-in access
- **Alternative**: FantasyNerds/SportsDataIO FD feeds
- **Integration Status**: Requires paid API keys

---

## 2. Commercial DFS Data Providers

### FantasyNerds
- **API**: https://api.fantasynerds.com/docs/nfl
- **Status**: Paid service with free trial
- **Coverage**: NFL, NBA, MLB projections and salaries
- **Features**: Slate IDs → player salaries/projections for DK/FD/Yahoo
- **Auth**: API key required
- **Rate Limits**: Varies by plan
- **Integration Status**: Ready for implementation

### SportsDataIO
- **API**: https://sportsdata.io/fantasy-sports-api
- **Status**: Paid service with free trial
- **Coverage**: Comprehensive across major sports
- **Features**: Salaries, projections, ownership, injuries, news
- **Auth**: API key required
- **Rate Limits**: Varies by plan
- **Integration Status**: Ready for implementation

---

## 3. Vegas Odds & Betting Data

### The Odds API
- **API**: https://the-odds-api.com/
- **Status**: Free tier available, paid plans
- **Coverage**: NFL, NBA, MLB, NHL, international sports
- **Features**: Real-time odds from multiple bookmakers
- **Auth**: API key required (free tier available)
- **Rate Limits**: 500 requests/month free, higher paid
- **Integration Status**: Ready for implementation

### SportsDataIO Odds
- **API**: https://sportsdata.io/live-odds-api
- **Status**: Paid service
- **Coverage**: Comprehensive odds data
- **Features**: Live odds, spreads, totals, player props
- **Auth**: API key required
- **Rate Limits**: Varies by plan
- **Integration Status**: Requires paid subscription

### Sportradar (Enterprise)
- **API**: https://developer.sportradar.com/odds
- **Status**: Enterprise-grade, expensive
- **Coverage**: Global sports coverage
- **Features**: Professional odds data feeds
- **Auth**: Complex enterprise authentication
- **Integration Status**: Enterprise clients only

---

## 4. Weather Data APIs

### OpenWeatherMap
- **API**: https://openweathermap.org/api
- **Status**: Free tier available, paid plans
- **Coverage**: Global weather data
- **Features**: Current weather, forecasts, historical data
- **Auth**: API key required
- **Rate Limits**: 60 calls/minute free, 1M calls/month
- **Integration Status**: Ready for implementation

### WeatherAPI
- **API**: https://www.weatherapi.com/
- **Status**: Free tier available
- **Coverage**: Global weather data
- **Features**: Real-time weather, forecasts, sports weather
- **Auth**: API key required
- **Rate Limits**: 1M calls/month free
- **Integration Status**: Ready for implementation

### Weather.gov (NOAA)
- **API**: https://www.weather.gov/documentation/services-web-api
- **Status**: Free, no API key required
- **Coverage**: US only
- **Features**: Official US government weather data
- **Auth**: None required
- **Rate Limits**: Unknown, be conservative
- **Integration Status**: Ready for implementation

---

## 5. Injury & News Sources

### RotoWire
- **Web**: https://www.rotowire.com/
- **Status**: Web scraping required (respect ToS)
- **Coverage**: Comprehensive injury reports, depth charts
- **Features**: Player status updates, team news
- **Integration Status**: Requires careful ToS compliance

### Sleeper API (Community References)
- **Status**: Unofficial public endpoints
- **Coverage**: News alerts, player updates
- **Features**: Real-time notifications
- **Integration Status**: Community references only

### Team Websites
- **Status**: Official sources, scraping required
- **Coverage**: Team-specific injury reports
- **Integration Status**: Manual monitoring recommended

---

## 6. Open Source Tools & References

### jaebradley/draftkings_client
- **GitHub**: https://github.com/jaebradley/draftkings_client
- **Status**: Active Python client
- **Features**: DraftKings API wrapper
- **Language**: Python
- **Integration Status**: Reference implementation

### pydfs-lineup-optimizer
- **GitHub**: https://github.com/DimaKudosh/pydfs-lineup-optimizer
- **Status**: Active multi-site optimizer
- **Features**: ILP optimization with constraints
- **Language**: Python
- **Integration Status**: Reference for optimization techniques

### draftfast
- **GitHub**: https://github.com/BenBrostoff/draftfast
- **Status**: Lineup automation tool
- **Features**: DK/FD lineup optimization
- **Language**: Python
- **Integration Status**: Reference implementation

### GitHub daily-fantasy-sports topic
- **URL**: https://github.com/topics/daily-fantasy-sports
- **Status**: Active community projects
- **Features**: Various DFS tools and libraries
- **Integration Status**: Research and reference

---

## 7. Community & Forum Resources

### Reddit r/dfsports
- **URL**: https://www.reddit.com/r/dfsports/
- **Status**: Active community discussion
- **Features**: Strategy discussions, data source recommendations
- **Integration Status**: Research only

### RotoGrinders
- **URL**: https://rotogrinders.com/
- **Status**: Professional DFS community
- **Features**: Projections, tools, educational content
- **Integration Status**: Research and reference

### FantasyLabs
- **URL**: https://www.fantasylabs.com/
- **Status**: Premium DFS tools
- **Features**: Advanced analytics, ownership projections
- **Integration Status**: Premium service reference

---

## 8. Implementation Status Tracking

### Integrated Sources
- [ ] DraftKings unofficial endpoints
- [ ] FantasyNerds API
- [ ] SportsDataIO API
- [ ] The Odds API
- [ ] OpenWeatherMap
- [ ] WeatherAPI
- [ ] Weather.gov

### Planned Integration
- [ ] FanDuel via paid feeds
- [ ] Sportradar (enterprise clients)
- [ ] RotoWire web scraping
- [ ] Sleeper API endpoints

### Research Phase
- [ ] Additional bookmaker APIs
- [ ] Alternative projection sources
- [ ] Real-time ownership feeds
- [ ] Advanced correlation data

---

## 9. Rate Limit Management

### Recommended Limits
```yaml
draftkings:
  requests_per_minute: 30
  retry_delay: 2000ms
  
fantasynerds:
  requests_per_minute: 60
  retry_delay: 1000ms

odds_api:
  requests_per_minute: 10
  retry_delay: 5000ms

weather_apis:
  requests_per_minute: 20
  retry_delay: 3000ms
```

### Circuit Breaker Patterns
```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenAttempts: number;
}
```

---

## 10. Data Quality Metrics

### Completeness Scores
- **Salary Data**: 98% target
- **Projections**: 95% target
- **Ownership**: 90% target
- **Injury Data**: 85% target

### Freshness Requirements
- **Live Data**: < 5 minutes old
- **Projections**: < 30 minutes old
- **Historical**: < 24 hours old
- **Static**: As needed

---

## 11. Error Handling Strategy

### Graceful Degradation
- Primary source failure → fallback to cached data
- Multiple source failures → use last known good data
- Complete failure → informative error messages

### Monitoring
- **Uptime monitoring**: All data feeds
- **Quality alerts**: Data validation failures
- **Performance metrics**: Response times, success rates

---

## 12. Environment Configuration

### Required API Keys
```bash
# Commercial APIs
SPORTSDATAIO_API_KEY=
FANTASYNERDS_API_KEY=
ODDS_API_KEY=

# Weather APIs
OPENWEATHER_API_KEY=
WEATHERAPI_KEY=

# Optional Premium
SPORTRADAR_API_KEY=
FANDUEL_API_KEY=
```

### Rate Limit Configuration
```bash
MAX_REQUESTS_PER_MINUTE=60
REQUEST_TIMEOUT_MS=30000
RETRY_ATTEMPTS=3
CIRCUIT_BREAKER_THRESHOLD=5
```

---

## 13. Implementation Checklist

### Phase 1: Core Data Feeds
- [x] DraftKings salary data integration
- [ ] FantasyNerds projections integration
- [ ] The Odds API integration
- [ ] Weather data integration
- [ ] Basic caching implementation

### Phase 2: Enhanced Features
- [ ] Multi-source projection blending
- [ ] Ownership projection engine
- [ ] Injury data integration
- [ ] Advanced caching strategies
- [ ] Data quality monitoring

### Phase 3: Premium Features
- [ ] SportsDataIO comprehensive integration
- [ ] Real-time data streams
- [ ] Advanced correlation modeling
- [ ] Machine learning projections
- [ ] Custom data source support

---

**Last Updated**: 2025-09-13  
**Next Review**: 2025-10-13

**__CLINE_DONE__ DATA_SOURCES_REGISTRY**
