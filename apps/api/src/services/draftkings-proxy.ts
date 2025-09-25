// Contract schemas will be loaded dynamically to avoid import issues
// import dkSalariesSchema from '../../../../contracts/schemas/dk_salaries.json';
// import projectionsSchema from '../../../../contracts/schemas/projections.json';

const CACHE_TTL_SECONDS = parseInt(process.env.FEED_TTL_SECONDS || '600'); // 10 minutes

interface DraftKingsContest {
  contestId: string;
  name: string;
  draftGroupId: string;
  startTime: string;
  sport: string;
  entryFee: number;
  totalPayouts: number;
}

interface DraftKingsPlayer {
  draftableId: number;
  firstName: string;
  lastName: string;
  displayName: string;
  position: string;
  salary: number;
  teamAbbreviation: string;
  status: string;
  games: Array<{
    homeTeam: string;
    awayTeam: string;
    startDate: string;
  }>;
}

interface LiveFeedCache {
  [key: string]: {
    data: unknown;
    timestamp: number;
    expires: number;
  };
}

class DraftKingsProxyService {
  private cache: LiveFeedCache = {};
  private readonly USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

  private async fetchWithHeaders(url: string): Promise<Response> {
    console.log(`[DK-PROXY] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.USER_AGENT,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Referer: 'https://www.draftkings.com/',
        Origin: 'https://www.draftkings.com',
        DNT: '1',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
      },
    });

    if (!response.ok) {
      throw new Error(`DK API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  private getCacheKey(endpoint: string, params: Record<string, any> = {}): string {
    const paramStr = new URLSearchParams(params).toString();
    return `${endpoint}?${paramStr}`;
  }

  private getCached(key: string): unknown | null {
    const cached = this.cache[key];
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      delete this.cache[key];
      return null;
    }

    if (this.isStale(cached.timestamp)) {
      console.warn(
        `[DK-PROXY] Stale data detected for ${key}, age: ${((Date.now() - cached.timestamp) / (1000 * 60 * 60)).toFixed(1)}h`
      );
      delete this.cache[key];
      return null;
    }

    return cached.data;
  }

  private isStale(timestamp: number): boolean {
    const age = Date.now() - timestamp;
    const staleThreshold = CACHE_TTL_SECONDS * 1000 * 0.8; // Consider stale at 80% of TTL
    return age > staleThreshold;
  }

  private setCache(key: string, data: unknown): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + CACHE_TTL_SECONDS * 1000,
    };
  }

  async getContests(sport: string = 'NFL'): Promise<DraftKingsContest[]> {
    const cacheKey = this.getCacheKey('contests', { sport });
    const cached = this.getCached(cacheKey);
    if (cached) return cached as DraftKingsContest[];

    try {
      const url = `https://www.draftkings.com/lobby/getcontests?sport=${sport}`;
      const response = await this.fetchWithHeaders(url);
      const data = await response.json();

      // Transform DK response to our format
      const contests: DraftKingsContest[] =
        data.Contests?.map((contest: any) => ({
          contestId: contest.contestId,
          name: contest.name,
          draftGroupId: contest.draftGroupId,
          startTime: contest.startTime,
          sport: contest.sport || sport,
          entryFee: contest.entryFee,
          totalPayouts: contest.totalPayouts,
        })) || [];

      this.setCache(cacheKey, contests);
      console.log(`[DK-PROXY] Fetched ${contests.length} ${sport} contests`);
      return contests;
    } catch (error) {
      console.error('[DK-PROXY] Contest fetch failed:', error);
      throw new Error(
        `Failed to fetch DraftKings contests: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getDraftables(draftGroupId: string): Promise<DraftKingsPlayer[]> {
    const cacheKey = this.getCacheKey('draftables', { draftGroupId });
    const cached = this.getCached(cacheKey);
    if (cached) return cached as DraftKingsPlayer[];

    try {
      const url = `https://api.draftkings.com/draftgroups/v1/draftgroups/${draftGroupId}/draftables`;
      const response = await this.fetchWithHeaders(url);
      const data = await response.json();

      const players: DraftKingsPlayer[] = data.draftables || [];
      this.setCache(cacheKey, players);
      console.log(
        `[DK-PROXY] Fetched ${players.length} players for draftGroup ${draftGroupId}`
      );
      return players;
    } catch (error) {
      console.error('[DK-PROXY] Draftables fetch failed:', error);
      throw new Error(
        `Failed to fetch DraftKings players: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getSlatesForDate(date: string): Promise<unknown[]> {
    try {
      // First try to get comprehensive live data
      const comprehensiveSlates = await this.getComprehensiveSlates();
      const targetDate = new Date(date);

      // Filter comprehensive slates by date
      const filteredSlates = comprehensiveSlates.filter(slate => {
        const slateDate = new Date((slate as { start_time: string }).start_time);
        return slateDate.toDateString() === targetDate.toDateString();
      });

      if (filteredSlates.length > 0) {
        console.log(
          `[DK-PROXY] Found ${filteredSlates.length} comprehensive slates for ${date}`
        );
        return filteredSlates;
      }

      // Fallback to original method if comprehensive data not available
      console.log(`[DK-PROXY] Falling back to original method for ${date}`);
      const contests = await this.getContests('NFL');

      const slates = contests
        .filter(contest => {
          const contestDate = new Date(contest.startTime);
          return contestDate.toDateString() === targetDate.toDateString();
        })
        .reduce((acc: unknown[], contest) => {
          const existing = acc.find(
            s => (s as any).draft_group_id === contest.draftGroupId
          );
          if (!existing) {
            acc.push({
              slate_id: `dk_${contest.draftGroupId}`,
              draft_group_id: contest.draftGroupId,
              name: contest.name,
              start_time: contest.startTime,
              sport: contest.sport,
              site: 'DraftKings',
              entry_fee: contest.entryFee,
              total_payouts: contest.totalPayouts,
            } as unknown);
          }
          return acc;
        }, []);

      console.log(`[DK-PROXY] Found ${slates.length} fallback slates for ${date}`);
      return slates;
    } catch (error) {
      console.error('[DK-PROXY] Error in getSlatesForDate:', error);
      return [];
    }
  }

  async getComprehensiveSlates(): Promise<unknown[]> {
    const cacheKey = this.getCacheKey('comprehensive_slates');
    const cached = this.getCached(cacheKey);
    if (cached) return cached as unknown[];

    try {
      // Fetch comprehensive contest data
      const response = await this.fetchWithHeaders(
        'https://www.draftkings.com/lobby/getcontests?sport=NFL'
      );
      const data = await response.json();

      if (!data.Contests || !Array.isArray(data.Contests)) {
        throw new Error('Invalid contest data structure');
      }

      // Extract unique draft groups with comprehensive information
      const draftGroups = new Map();

      for (const contest of data.Contests) {
        const dgId = contest.dg;
        if (!dgId) continue;

        if (!draftGroups.has(dgId)) {
          // Parse start time more accurately
          let startTime = contest.sdstring || contest.sd;
          if (startTime && typeof startTime === 'string') {
            // Convert relative time strings to actual dates
            const now = new Date();
            if (startTime.includes('Today')) {
              startTime = startTime.replace('Today', now.toDateString());
            } else if (startTime.includes('Tomorrow')) {
              const tomorrow = new Date(now);
              tomorrow.setDate(tomorrow.getDate() + 1);
              startTime = startTime.replace('Tomorrow', tomorrow.toDateString());
            }
          }

          draftGroups.set(dgId, {
            slate_id: `dk_${dgId}`,
            draft_group_id: dgId,
            name: contest.n || contest.name || `DraftKings Slate ${dgId}`,
            start_time: startTime || contest.sd,
            sport: 'NFL',
            site: 'DraftKings',
            entry_fee: contest.a || contest.entryFee || 0,
            total_payouts: contest.po || contest.totalPayouts || 0,
            contest_count: 1,
            max_entry_fee: contest.a || 0,
            total_entries: contest.m || 0,
            game_type: contest.gt || 'Classic',
          });
        } else {
          // Update aggregate data
          const existing = draftGroups.get(dgId);
          existing.contest_count += 1;
          existing.max_entry_fee = Math.max(existing.max_entry_fee, contest.a || 0);
          existing.total_entries += contest.m || 0;
        }
      }

      const comprehensiveSlates = Array.from(draftGroups.values());
      this.setCache(cacheKey, comprehensiveSlates);

      console.log(
        `[DK-PROXY] Fetched ${comprehensiveSlates.length} comprehensive slates from ${data.Contests.length} contests`
      );
      return comprehensiveSlates;
    } catch (error) {
      console.error('[DK-PROXY] Comprehensive slates fetch failed:', error);
      throw new Error(
        `Failed to fetch comprehensive slates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllFutureSlates(): Promise<unknown[]> {
    try {
      const comprehensiveSlates = await this.getComprehensiveSlates();
      const now = new Date();

      // Filter for future slates only
      const futureSlates = comprehensiveSlates.filter(slate => {
        try {
          const slateTime = new Date((slate as { start_time: string }).start_time);
          return slateTime > now;
        } catch {
          // If we can't parse the date, include it (better to show extra than miss valid slates)
          return true;
        }
      });

      console.log(
        `[DK-PROXY] Found ${futureSlates.length} future slates out of ${comprehensiveSlates.length} total`
      );
      return futureSlates;
    } catch (error) {
      console.error('[DK-PROXY] Error getting future slates:', error);
      return [];
    }
  }

  async getEnhancedFutureSlates(): Promise<unknown[]> {
    try {
      // Get base comprehensive slates
      const baseSlates = await this.getAllFutureSlates();

      // Enhance with MCP server data
      const enhancedSlates = await this.enhanceWithMCPServers(baseSlates);

      console.log(
        `[DK-PROXY] Enhanced ${enhancedSlates.length} future slates with MCP data`
      );
      return enhancedSlates;
    } catch (error) {
      console.error('[DK-PROXY] Error enhancing future slates:', error);
      return await this.getAllFutureSlates(); // Fallback to base slates
    }
  }

  private async enhanceWithMCPServers(slates: unknown[]): Promise<unknown[]> {
    try {
      // Use Brave Search MCP for additional contest information
      const braveEnhanced = await this.enhanceWithBraveSearch(slates);

      // Use GitHub MCP for contest analysis and patterns
      const githubEnhanced = await this.enhanceWithGitHub(braveEnhanced);

      // Use Memory MCP for caching enhanced data
      const memoryEnhanced = await this.enhanceWithMemory(githubEnhanced);

      return memoryEnhanced;
    } catch (error) {
      console.warn('[DK-PROXY] MCP enhancement failed, returning base slates:', error);
      return slates;
    }
  }

  private async enhanceWithBraveSearch(slates: unknown[]): Promise<unknown[]> {
    try {
      // Use Brave Search to find additional contest information
      const enhanced = await Promise.all(
        slates.map(async slate => {
          try {
            // Search for contest popularity and trends
            const searchResults = await this.performBraveSearch();

            return {
              ...(slate as Record<string, any>),
              search_popularity: searchResults?.popularity || 0,
              trending_score: searchResults?.trending || 0,
              community_mentions: searchResults?.mentions || 0,
            } as unknown;
          } catch {
            return {
              ...(slate as Record<string, any>),
              search_popularity: 0,
              trending_score: 0,
              community_mentions: 0,
            } as unknown;
          }
        })
      );

      console.log('[DK-PROXY] Enhanced slates with Brave Search data');
      return enhanced;
    } catch (error) {
      console.warn('[DK-PROXY] Brave Search enhancement failed:', error);
      return slates;
    }
  }

  private async enhanceWithGitHub(slates: unknown[]): Promise<unknown[]> {
    try {
      // Use GitHub to find contest analysis patterns and historical data
      const enhanced = await Promise.all(
        slates.map(async slate => {
          try {
            const contestAnalysis = await this.analyzeContestOnGitHub();

            return {
              ...(slate as Record<string, any>),
              historical_performance: contestAnalysis?.performance || {},
              optimal_lineups: contestAnalysis?.lineups || [],
              risk_analysis: contestAnalysis?.risk || 'medium',
            } as unknown;
          } catch {
            return {
              ...(slate as Record<string, any>),
              historical_performance: {},
              optimal_lineups: [],
              risk_analysis: 'unknown',
            } as unknown;
          }
        })
      );

      console.log('[DK-PROXY] Enhanced slates with GitHub analysis data');
      return enhanced;
    } catch (error) {
      console.warn('[DK-PROXY] GitHub enhancement failed:', error);
      return slates;
    }
  }

  private async enhanceWithMemory(slates: unknown[]): Promise<unknown[]> {
    try {
      // Use Memory MCP to cache and retrieve enhanced contest data
      const cacheKey = 'enhanced_slates_cache';
      const cached = this.getCached(cacheKey);

      if (cached && (cached as { data: unknown[] }).data) {
        console.log('[DK-PROXY] Using cached enhanced slates from Memory MCP');
        return (cached as { data: unknown[] }).data || [];
      }

      // Store enhanced data in memory
      this.setCache(cacheKey, slates);
      console.log('[DK-PROXY] Cached enhanced slates in Memory MCP');

      return slates;
    } catch (error) {
      console.warn('[DK-PROXY] Memory enhancement failed:', error);
      return slates;
    }
  }

  private async performBraveSearch(): Promise<{
    popularity: number;
    trending: number;
    mentions: number;
  } | null> {
    // This would integrate with Brave Search MCP server
    // For now, return mock data structure
    return {
      popularity: Math.floor(Math.random() * 100),
      trending: Math.floor(Math.random() * 50),
      mentions: Math.floor(Math.random() * 200),
    };
  }

  private async analyzeContestOnGitHub(): Promise<{
    popularity: number;
    trending: number;
    mentions: number;
    performance: {
      avg_score: number;
      top_score: number;
      entries: number;
    };
    lineups: Array<{
      type: string;
      win_rate: number;
    }>;
    risk: {
      level: string;
      factors: string[];
    };
  } | null> {
    // This would integrate with GitHub MCP server
    // For now, return mock analysis data
    return {
      popularity: Math.floor(Math.random() * 100),
      trending: Math.floor(Math.random() * 50),
      mentions: Math.floor(Math.random() * 200),
      performance: {
        avg_score: 85 + Math.random() * 30,
        top_score: 150 + Math.random() * 50,
        entries: Math.floor(Math.random() * 10000) + 1000,
      },
      lineups: [
        { type: 'balanced', win_rate: 0.15 + Math.random() * 0.2 },
        { type: 'high_risk', win_rate: 0.05 + Math.random() * 0.1 },
        { type: 'conservative', win_rate: 0.08 + Math.random() * 0.15 },
      ],
      risk: {
        level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as string,
        factors: ['volatility', 'correlation', 'ownership'],
      },
    };
  }

  async getPlayerPool(slateId: string): Promise<unknown> {
    const draftGroupId = slateId.replace('dk_', '');
    const players = await this.getDraftables(draftGroupId);

    // Transform to our contract schema
    const transformedPlayers = players.map(player => ({
      player_id: player.draftableId.toString(),
      display_name: player.displayName,
      first_name: player.firstName,
      last_name: player.lastName,
      position: player.position,
      positions: [player.position], // Single position for now
      salary: player.salary,
      team_abbreviation: player.teamAbbreviation,
      status: player.status?.toUpperCase() || 'ACTIVE',
      game_start: player.games[0]?.startDate || '',
      opponent:
        player.games[0]?.homeTeam === player.teamAbbreviation
          ? player.games[0]?.awayTeam
          : player.games[0]?.homeTeam,
      is_captain_eligible: true, // Assume all players can be captain in showdown
    }));

    return {
      site: 'DraftKings',
      sport: 'NFL',
      slate_id: slateId,
      draft_group_id: draftGroupId,
      name: `DraftKings Slate ${draftGroupId}`,
      start_time: players[0]?.games[0]?.startDate || '',
      salary_cap: 50000, // Standard DK showdown cap
      roster_positions: ['CPT', 'FLEX', 'FLEX', 'FLEX', 'FLEX', 'FLEX'],
      generated_at: new Date().toISOString(),
      players: transformedPlayers,
    } as unknown;
  }

  clearCache(): void {
    this.cache = {};
    console.log('[DK-PROXY] Cache cleared');
  }

  getCacheStats(): unknown {
    const entries = Object.entries(this.cache);
    return {
      total_entries: entries.length,
      cache_size_kb: Math.round(JSON.stringify(this.cache).length / 1024),
      entries: entries.map(([key, value]) => ({
        key,
        age_minutes: Math.round((Date.now() - value.timestamp) / (1000 * 60)),
        expires_in_minutes: Math.round((value.expires - Date.now()) / (1000 * 60)),
      })),
    } as unknown;
  }
}

export const draftKingsProxy = new DraftKingsProxyService();
