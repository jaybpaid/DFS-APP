# DraftKings API Documentation

## Validated Endpoints (Working as of September 2025)

### Contest Information Endpoints

- **Contests (NFL)**: `https://www.draftkings.com/lobby/getcontests?sport=NFL`
- **Contests (NBA)**: `https://www.draftkings.com/lobby/getcontests?sport=NBA`
- **Contests (MLB)**: `https://www.draftkings.com/lobby/getcontests?sport=MLB`
- **Contests (NHL)**: `https://www.draftkings.com/lobby/getcontests?sport=NHL`
- **Contests (PGA)**: `https://www.draftkings.com/lobby/getcontests?sport=PGA`
- **Contests (LOL)**: `https://www.draftkings.com/lobby/getcontests?sport=LOL`

### Player/Salary Data Endpoints

- **Draftables by Group**: `https://api.draftkings.com/draftgroups/v1/draftgroups/{draftGroupId}/draftables`
- **Example**: `https://api.draftkings.com/draftgroups/v1/draftgroups/46589/draftables`

### Game Type/Rules Endpoints

- **Game Type Rules**: `https://api.draftkings.com/lineups/v1/gametypes/{gameTypeId}/rules`
- **Example**: `https://api.draftkings.com/lineups/v1/gametypes/1/rules`

## Response Structure

### Contest Response (`/lobby/getcontests`)

```json
{
  "SelectedSport": "NFL",
  "SelectedSportId": null,
  "Contests": [
    {
      "contestId": "123456",
      "name": "NFL $3M Fantasy Football Millionaire",
      "entryFee": 20,
      "totalPayouts": 3000000,
      "contestType": "Classic",
      "draftGroupId": "46589",
      "startTime": "2025-09-15T20:20:00.000Z",
      "entries": 150000,
      "maxEntries": 150000
    }
  ]
}
```

### Draftables Response (`/draftgroups/v1/draftgroups/{id}/draftables`)

```json
{
  "draftables": [
    {
      "draftableId": 16716485,
      "firstName": "Russell",
      "lastName": "Wilson",
      "displayName": "Russell Wilson",
      "position": "QB",
      "salary": 6500,
      "teamAbbreviation": "PIT",
      "status": "Probable",
      "games": [
        {
          "homeTeam": "PIT",
          "awayTeam": "DEN",
          "startDate": "2025-09-15T20:20:00.000Z"
        }
      ]
    }
  ]
}
```

## Implementation Examples

### Python Implementation

```python
import requests

def get_draftkings_contests(sport="NFL"):
    url = f"https://www.draftkings.com/lobby/getcontests?sport={sport}"
    response = requests.get(url)
    return response.json()

def get_draftkings_players(draft_group_id):
    url = f"https://api.draftkings.com/draftgroups/v1/draftgroups/{draft_group_id}/draftables"
    response = requests.get(url)
    return response.json()
```

### JavaScript Implementation

```javascript
const getDraftKingsContests = async (sport = 'NFL') => {
  const response = await fetch(
    `https://www.draftkings.com/lobby/getcontests?sport=${sport}`
  );
  return await response.json();
};

const getDraftKingsPlayers = async draftGroupId => {
  const response = await fetch(
    `https://api.draftkings.com/draftgroups/v1/draftgroups/${draftGroupId}/draftables`
  );
  return await response.json();
};
```

## Rate Limiting and Best Practices

1. **Rate Limiting**: DraftKings APIs don't have strict rate limits, but be respectful:
   - 1-2 requests per second maximum
   - Use caching for frequently accessed data
   - Avoid polling more than once per minute

2. **Error Handling**: Always implement proper error handling:
   - Timeout handling (10-30 seconds)
   - Retry logic with exponential backoff
   - Fallback to cached data when API fails

3. **Data Caching**: Cache responses for at least:
   - Contest data: 5-10 minutes
   - Player/salary data: 2-5 minutes
   - Game rules: 24 hours

## MCP Server Status

Based on testing, the following MCP servers are working:

- ✅ `brave-search` (@brave/brave-search-mcp-server)
- ✅ `browser-use` (@agent-infra/mcp-server-browser)
- ✅ `github` (github-mcp-server)
- ✅ `apify` (@apify/actors-mcp-server)
- ✅ `slack` (slack-mcp-server)

Servers requiring API keys/configuration:

- ⚠️ `filesystem` - May require permissions
- ⚠️ `git` - May require Git configuration
- ⚠️ `firecrawl` - Requires FIRECRAWL_API_KEY
- ⚠️ `google-maps` - Requires GOOGLE_MAPS_API_KEY
- ⚠️ `memory` - Timeout issues
- ⚠️ `time` - Error issues
- ⚠️ `shell` - Timeout issues

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Use a proxy server or backend API calls
2. **Rate Limiting**: Implement proper caching and retry logic
3. **JSON Parsing Errors**: Validate responses before parsing
4. **Network Timeouts**: Increase timeout values and implement retries

### Debugging Tips:

- Use the test script: `python test_dk_api.py`
- Check network tab in browser developer tools
- Verify endpoint URLs with recent examples
- Monitor response headers for rate limiting info

## Legal Considerations

⚠️ **Important**: DraftKings does not officially support or document these APIs. Use them responsibly:

- Don't overload their servers
- Respect their terms of service
- Use for personal/educational purposes only
- Consider using official APIs if available

## Version History

- **2025-09-12**: All endpoints validated and working
- **2024-12-15**: Initial documentation created
- **2023-11-01**: First successful API integrations

---

_This documentation is based on unofficial reverse engineering and may become outdated. Always test endpoints before relying on them in production._
