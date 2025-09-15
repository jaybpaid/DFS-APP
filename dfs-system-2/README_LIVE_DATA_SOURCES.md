# Live Data Sources Configuration Guide

This guide explains how to configure and use live data sources in the DFS Optimizer system.

## Current Data Sources

The system supports multiple live data sources:

1. **DraftKings API** - Player pools, salaries, contests (no API key required)
2. **The Odds API** - Betting odds and lines (API key required)
3. **OpenWeather API** - Weather data for NFL games (API key required)
4. **nflfastR** - NFL play-by-play and advanced stats (no API key required)

## API Key Configuration

### 1. The Odds API

**Purpose**: Fetch betting odds, spreads, and totals for NFL/NBA games

**Getting an API Key**:
1. Visit [The Odds API](https://the-odds-api.com/)
2. Sign up for a free account (500 requests/month free)
3. Get your API key from the dashboard

**Configuration**:
```bash
# In your .env file
THE_ODDS_API_KEY=your_actual_api_key_here
```

### 2. OpenWeather API

**Purpose**: Fetch weather conditions for NFL games

**Getting an API Key**:
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account (1,000 calls/day free)
3. Get your API key from the dashboard

**Configuration**:
```bash
# In your .env file
OPENWEATHER_API_KEY=your_actual_api_key_here
```

## Automatic Data Fetching

The system includes an automated data fetcher that runs periodically:

### Manual Execution
```bash
# Fetch all live data
python scripts/fetch_live_data.py

# Fetch DraftKings data only (Node.js required)
node scripts/prefetch-dk.js
```

### Scheduled Execution (Recommended)

Add to your crontab for automatic daily updates:

```bash
# Daily at 8 AM, 12 PM, and 4 PM
0 8,12,16 * * * cd /path/to/dfs-system-2 && python scripts/fetch_live_data.py

# Every 30 minutes during game days
*/30 * * * 0,1,4,5 cd /path/to/dfs-system-2 && node scripts/prefetch-dk.js
```

## Data Storage

Live data is stored in `public/data/` directory:

- `dk_nfl_latest.json` - Latest NFL player pool
- `dk_nba_latest.json` - Latest NBA player pool  
- `odds_*.json` - Betting odds data
- `weather_*.json` - Weather data
- `nflfastr_*.parquet` - NFL advanced stats

## Fallback to Demo Data

When live data sources are unavailable (no contests, API issues, etc.), the system automatically falls back to high-quality demo data:

- **NFL**: 280 players with realistic projections, ownership, boom percentages
- **NBA**: Similar comprehensive demo dataset
- **Odds/Weather**: Placeholder data with realistic values

## Troubleshooting

### Common Issues

1. **No DraftKings Contests Found**
   - Occurs when no live contests are available (off-season, between slates)
   - System automatically uses demo data

2. **API Key Errors**
   - Check that API keys are correctly configured in `.env`
   - Verify API key validity with the provider

3. **Rate Limiting**
   - The Odds API: 500 requests/month free tier
   - OpenWeather: 1,000 calls/day free tier
   - Consider upgrading to paid tiers for heavy usage

4. **Network Issues**
   - Ensure stable internet connection
   - Check firewall/proxy settings

### Debug Mode

Enable debug logging to see detailed fetch operations:

```bash
# Set debug mode
DEBUG=true python scripts/fetch_live_data.py
```

## Data Validation

The system performs automatic validation:

- Minimum player count checks (NFL: 250+, NBA: 150+)
- Position validation
- Salary/projection sanity checks
- Timestamp validation

## Integration with Optimizer

Live data is automatically integrated into:

- Web dashboard (`/dashboard`)
- Professional optimizer interface
- CLI tools
- AI projection systems

## Best Practices

1. **Keep API Keys Secure**
   - Never commit `.env` files to version control
   - Use environment variables in production
   - Rotate keys periodically

2. **Monitor Usage**
   - Check API usage quotas regularly
   - Set up alerts for near-limit conditions

3. **Schedule Updates**
   - Fetch data 2-3 times daily during season
   - More frequent updates on game days

4. **Backup Demo Data**
   - Maintain high-quality demo datasets
   - Update demo data periodically to reflect current trends

## Support

For issues with live data integration:
1. Check the logs in `public/data/live_data_report.json`
2. Verify API keys are valid and active
3. Ensure network connectivity to external APIs
4. Check if contests are currently available on DraftKings
