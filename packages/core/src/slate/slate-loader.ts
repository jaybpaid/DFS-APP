import { z } from 'zod';
import { ParsedPlayer, parseSalaryCsv } from '../csv/dk-mappers.js';

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

export const SlateSchema = z.object({
  id: z.string(),
  sport: z.enum(['NFL', 'NBA']),
  date: z.string(), // ISO date string
  slateType: z.enum(['main', 'showdown', 'turbo', 'classic']),
  contestType: z.enum(['GPP', 'Cash', 'H2H', 'League']),
  isLive: z.boolean(),
  gameCount: z.number(),
  playerCount: z.number(),
  salaryCapUsd: z.number(),
  entryDeadline: z.string(), // ISO datetime string
  lateSwapDeadline: z.string().optional(), // ISO datetime string
  games: z.array(
    z.object({
      id: z.string(),
      homeTeam: z.string(),
      awayTeam: z.string(),
      startTime: z.string(), // ISO datetime string
      weather: z
        .object({
          temperature: z.number().optional(),
          windSpeed: z.number().optional(),
          precipitation: z.number().optional(),
          conditions: z.string().optional(),
        })
        .optional(),
    })
  ),
  players: z.array(z.string()), // Array of player IDs
  metadata: z.record(z.unknown()).optional(),
});

export const PlayerPoolSchema = z.object({
  slateId: z.string(),
  generatedAt: z.string(), // ISO datetime string
  players: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      nameWithId: z.string(),
      position: z.string(),
      team: z.string(),
      opponent: z.string(),
      gameTime: z.string(),
      salary: z.number(),
      isActive: z.boolean(),
      injuryStatus: z.string().optional(),
      gameId: z.string(),
      // Core projections
      projections: z.object({
        points: z.number().optional(),
        floor: z.number().optional(),
        ceiling: z.number().optional(),
        ownership: z.number().optional(), // 0-100 percentage
        value: z.number().optional(), // points per $1000 salary
      }),
      // Multiple projection sources
      projectionSources: z
        .record(
          z.object({
            points: z.number(),
            floor: z.number().optional(),
            ceiling: z.number().optional(),
            ownership: z.number().optional(),
          })
        )
        .optional(),
      // Advanced metrics
      advanced: z
        .object({
          leverage: z.number().optional(),
          correlation: z.record(z.number()).optional(), // player_id -> correlation score
          stackValue: z.record(z.number()).optional(), // stack_type -> value
          gameScript: z.string().optional(), // positive, negative, neutral
          pace: z.number().optional(),
          targetShare: z.number().optional(),
          redZoneTargets: z.number().optional(),
        })
        .optional(),
    })
  ),
  metadata: z.object({
    totalSalaryCap: z.number(),
    avgSalary: z.number(),
    totalProjectedPoints: z.number(),
    avgProjectedPoints: z.number(),
    highestSalary: z.number(),
    lowestSalary: z.number(),
    projectionSources: z.array(z.string()),
    lastUpdated: z.string(),
  }),
});

export type Slate = z.infer<typeof SlateSchema>;
export type PlayerPool = z.infer<typeof PlayerPoolSchema>;
export type SlatePlayer = PlayerPool['players'][0];

// ============================================================================
// SLATE LOADING FUNCTIONS
// ============================================================================

export class SlateLoader {
  private slates: Map<string, Slate> = new Map();
  private playerPools: Map<string, PlayerPool> = new Map();

  /**
   * Load slate from DraftKings salary CSV
   */
  async loadSlateFromSalaryCsv(
    csvContent: string,
    slateId: string,
    options: {
      sport: 'NFL' | 'NBA';
      date: string;
      slateType: 'main' | 'showdown' | 'turbo' | 'classic';
      contestType: 'GPP' | 'Cash' | 'H2H' | 'League';
      entryDeadline: string;
      lateSwapDeadline?: string;
    }
  ): Promise<Slate> {
    try {
      const players = parseSalaryCsv(csvContent);

      // Extract unique games from player data
      const games = this.extractGamesFromPlayers(players);

      const slate: Slate = {
        id: slateId,
        sport: options.sport,
        date: options.date,
        slateType: options.slateType,
        contestType: options.contestType,
        isLive: new Date() < new Date(options.entryDeadline),
        gameCount: games.length,
        playerCount: players.length,
        salaryCapUsd: options.sport === 'NFL' ? 50000 : 50000,
        entryDeadline: options.entryDeadline,
        lateSwapDeadline: options.lateSwapDeadline,
        games,
        players: players.map(p => p.id),
        metadata: {
          csvLoadedAt: new Date().toISOString(),
          originalPlayerCount: players.length,
        },
      };

      this.slates.set(slateId, slate);
      return slate;
    } catch (error) {
      throw new Error(
        `Failed to load slate from CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get slate by ID
   */
  getSlate(slateId: string): Slate | null {
    return this.slates.get(slateId) || null;
  }

  /**
   * Get all slates
   */
  getAllSlates(): Slate[] {
    return Array.from(this.slates.values());
  }

  /**
   * Get live slates only
   */
  getLiveSlates(): Slate[] {
    return this.getAllSlates().filter(slate => slate.isLive);
  }

  /**
   * Update slate live status
   */
  updateSlateLiveStatus(slateId: string): boolean {
    const slate = this.slates.get(slateId);
    if (!slate) return false;

    slate.isLive = new Date() < new Date(slate.entryDeadline);
    return slate.isLive;
  }

  /**
   * Extract games from player data
   */
  private extractGamesFromPlayers(players: ParsedPlayer[]): Slate['games'] {
    const gamesMap = new Map<string, Slate['games'][0]>();

    for (const player of players) {
      const gameInfo = player.gameInfo;
      const match = gameInfo.match(/^(\w+)@(\w+)\s+(.+)$/);

      if (match) {
        const [, awayTeam, homeTeam, timeInfo] = match;
        const gameId = `${awayTeam}@${homeTeam}`;

        if (!gamesMap.has(gameId)) {
          gamesMap.set(gameId, {
            id: gameId,
            homeTeam,
            awayTeam,
            startTime: this.parseGameTime(timeInfo),
          });
        }
      }
    }

    return Array.from(gamesMap.values());
  }

  /**
   * Parse game time from DraftKings format
   */
  private parseGameTime(timeInfo: string): string {
    // Parse formats like "01:00PM ET", "04:25PM ET"
    const match = timeInfo.match(/(\d{1,2}:\d{2}[AP]M)\s+ET/);
    if (match) {
      const timeStr = match[1];
      const today = new Date().toISOString().split('T')[0];

      // Convert to 24-hour format and create ISO string
      const time12h = timeStr;
      const time24h = this.convertTo24Hour(time12h);
      return `${today}T${time24h}:00.000Z`;
    }

    // Fallback to current time + 1 hour
    const fallback = new Date();
    fallback.setHours(fallback.getHours() + 1);
    return fallback.toISOString();
  }

  /**
   * Convert 12-hour time to 24-hour format
   */
  private convertTo24Hour(time12h: string): string {
    const [time, modifier] = time12h.split(/([AP]M)/);
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours !== 12) {
      hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

// ============================================================================
// PLAYER POOL ASSEMBLY
// ============================================================================

export class PlayerPoolAssembler {
  /**
   * Assemble comprehensive player pool from slate and additional data sources
   */
  async assemblePlayerPool(
    slate: Slate,
    players: ParsedPlayer[],
    options: {
      projectionSources?: Record<string, any[]>;
      ownershipData?: Record<string, number>;
      injuryReports?: Record<string, string>;
      weatherData?: Record<string, any>;
      vegas?: Record<string, any>;
    } = {}
  ): Promise<PlayerPool> {
    try {
      const assembledPlayers: PlayerPool['players'] = [];

      for (const player of players) {
        const slatePlayer: SlatePlayer = {
          id: player.id,
          name: player.name,
          nameWithId: player.nameWithId,
          position: player.position,
          team: player.teamAbbrev,
          opponent: this.extractOpponent(player.gameInfo),
          gameTime: this.extractGameTime(player.gameInfo),
          salary: player.salary,
          isActive: true, // TODO: Check against injury reports
          injuryStatus: options.injuryReports?.[player.id],
          gameId: this.extractGameId(player.gameInfo),
          projections: {
            points: player.avgPointsPerGame || 0,
            ownership: options.ownershipData?.[player.id],
            value: this.calculateValue(player.avgPointsPerGame || 0, player.salary),
          },
        };

        // Add projection sources if available
        if (options.projectionSources) {
          slatePlayer.projectionSources = this.blendProjections(
            player.id,
            options.projectionSources
          );
        }

        // Calculate advanced metrics
        slatePlayer.advanced = {
          leverage: this.calculateLeverage(slatePlayer),
          gameScript: this.inferGameScript(slatePlayer, options.vegas),
        };

        assembledPlayers.push(slatePlayer);
      }

      // Sort by salary descending
      assembledPlayers.sort((a: SlatePlayer, b: SlatePlayer) => b.salary - a.salary);

      const metadata = this.calculatePoolMetadata(
        assembledPlayers,
        options.projectionSources
      );

      const playerPool: PlayerPool = {
        slateId: slate.id,
        generatedAt: new Date().toISOString(),
        players: assembledPlayers,
        metadata,
      };

      return playerPool;
    } catch (error) {
      throw new Error(
        `Failed to assemble player pool: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract opponent from game info
   */
  private extractOpponent(gameInfo: string): string {
    const match = gameInfo.match(/^(\w+)@(\w+)/);
    if (match) {
      const [, away, home] = match;
      return `${away}@${home}`;
    }
    return 'TBD';
  }

  /**
   * Extract game time from game info
   */
  private extractGameTime(gameInfo: string): string {
    const match = gameInfo.match(/(\d{1,2}:\d{2}[AP]M\s+ET)/);
    return match ? match[1] : 'TBD';
  }

  /**
   * Extract game ID from game info
   */
  private extractGameId(gameInfo: string): string {
    const match = gameInfo.match(/^(\w+@\w+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Calculate player value (points per $1000 salary)
   */
  private calculateValue(projection: number, salary: number): number {
    if (salary === 0) return 0;
    return (projection / salary) * 1000;
  }

  /**
   * Blend projections from multiple sources
   */
  private blendProjections(
    playerId: string,
    projectionSources: Record<string, any[]>
  ): Record<string, any> {
    const blended: Record<string, any> = {};

    for (const [sourceName, sourceData] of Object.entries(projectionSources)) {
      const playerData = sourceData.find(
        (p: any) => p.id === playerId || p.playerId === playerId
      );
      if (playerData) {
        blended[sourceName] = {
          points: playerData.projection || playerData.points || 0,
          floor: playerData.floor || playerData.points * 0.7,
          ceiling: playerData.ceiling || playerData.points * 1.4,
          ownership: playerData.ownership || playerData.own || 0,
        };
      }
    }

    return blended;
  }

  /**
   * Calculate leverage for a player
   */
  private calculateLeverage(player: SlatePlayer): number {
    if (!player.projections.ownership || !player.projections.points) return 0;

    // Leverage = (Projected Points / Expected Ownership) - 1
    const expectedOwn = player.projections.ownership / 100;
    if (expectedOwn === 0) return 0;

    return player.projections.points / expectedOwn - 1;
  }

  /**
   * Infer game script from Vegas data
   */
  private inferGameScript(player: SlatePlayer, vegas?: Record<string, any>): string {
    if (!vegas) return 'neutral';

    const gameData = vegas[player.gameId];
    if (!gameData) return 'neutral';

    // TODO: Implement game script logic based on spreads and totals
    return 'neutral';
  }

  /**
   * Calculate player pool metadata
   */
  private calculatePoolMetadata(
    players: SlatePlayer[],
    projectionSources?: Record<string, any[]>
  ): PlayerPool['metadata'] {
    const salaries = players.map(p => p.salary);
    const projections = players.map(p => p.projections.points || 0);

    return {
      totalSalaryCap: 50000,
      avgSalary: salaries.reduce((sum, s) => sum + s, 0) / salaries.length,
      totalProjectedPoints: projections.reduce((sum, p) => sum + p, 0),
      avgProjectedPoints:
        projections.reduce((sum, p) => sum + p, 0) / projections.length,
      highestSalary: Math.max(...salaries),
      lowestSalary: Math.min(...salaries),
      projectionSources: projectionSources ? Object.keys(projectionSources) : ['base'],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// ============================================================================
// PROJECTION BLENDING ENGINE
// ============================================================================

export class ProjectionBlender {
  /**
   * Blend multiple projection sources with weighted averaging
   */
  blendProjections(
    projections: Record<string, { points: number; weight: number }>,
    method: 'weighted' | 'geometric' | 'harmonic' = 'weighted'
  ): number {
    const entries = Object.entries(projections);
    if (entries.length === 0) return 0;

    switch (method) {
      case 'weighted':
        return this.weightedAverage(entries);
      case 'geometric':
        return this.geometricMean(entries.map(([, data]) => data.points));
      case 'harmonic':
        return this.harmonicMean(entries.map(([, data]) => data.points));
      default:
        return this.weightedAverage(entries);
    }
  }

  /**
   * Calculate weighted average of projections
   */
  private weightedAverage(
    entries: [string, { points: number; weight: number }][]
  ): number {
    const totalWeight = entries.reduce((sum, [, data]) => sum + data.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = entries.reduce(
      (sum, [, data]) => sum + data.points * data.weight,
      0
    );
    return weightedSum / totalWeight;
  }

  /**
   * Calculate geometric mean
   */
  private geometricMean(values: number[]): number {
    if (values.length === 0 || values.some(v => v <= 0)) return 0;

    const product = values.reduce((prod, val) => prod * val, 1);
    return Math.pow(product, 1 / values.length);
  }

  /**
   * Calculate harmonic mean
   */
  private harmonicMean(values: number[]): number {
    if (values.length === 0 || values.some(v => v <= 0)) return 0;

    const reciprocalSum = values.reduce((sum, val) => sum + 1 / val, 0);
    return values.length / reciprocalSum;
  }

  /**
   * Apply projection adjustments based on context
   */
  applyContextualAdjustments(
    baseProjection: number,
    context: {
      weather?: { windSpeed?: number; precipitation?: number; temperature?: number };
      injuryStatus?: string;
      gameScript?: string;
      pace?: number;
      restDays?: number;
    }
  ): number {
    let adjusted = baseProjection;

    // Weather adjustments
    if (context.weather) {
      if (context.weather.windSpeed && context.weather.windSpeed > 15) {
        adjusted *= 0.95; // 5% reduction for high wind
      }
      if (context.weather.precipitation && context.weather.precipitation > 0.1) {
        adjusted *= 0.93; // 7% reduction for rain
      }
      if (context.weather.temperature && context.weather.temperature < 32) {
        adjusted *= 0.96; // 4% reduction for freezing temps
      }
    }

    // Injury status adjustments
    if (context.injuryStatus) {
      switch (context.injuryStatus.toLowerCase()) {
        case 'questionable':
          adjusted *= 0.85;
          break;
        case 'doubtful':
          adjusted *= 0.6;
          break;
        case 'out':
          adjusted = 0;
          break;
      }
    }

    // Game script adjustments
    if (context.gameScript) {
      switch (context.gameScript) {
        case 'positive':
          adjusted *= 1.05;
          break;
        case 'negative':
          adjusted *= 0.95;
          break;
      }
    }

    // Pace adjustments
    if (context.pace) {
      const paceMultiplier = Math.max(0.85, Math.min(1.15, context.pace / 100));
      adjusted *= paceMultiplier;
    }

    return Math.max(0, adjusted);
  }
}

// ============================================================================
// OWNERSHIP INFERENCE ENGINE
// ============================================================================

export class OwnershipInference {
  /**
   * Infer ownership percentages based on multiple factors
   */
  inferOwnership(
    player: SlatePlayer,
    context: {
      historicalOwnership?: Record<string, number[]>;
      salaryPercentile?: number;
      projectionPercentile?: number;
      valuePercentile?: number;
      gameSlot?: 'early' | 'afternoon' | 'prime' | 'late';
      weather?: any;
      news?: string[];
    }
  ): number {
    let baseOwnership = this.calculateBaseOwnership(player);

    // Salary tier adjustments
    if (context.salaryPercentile !== undefined) {
      baseOwnership *= this.getSalaryMultiplier(context.salaryPercentile);
    }

    // Value tier adjustments
    if (context.valuePercentile !== undefined) {
      baseOwnership *= this.getValueMultiplier(context.valuePercentile);
    }

    // Game slot adjustments
    if (context.gameSlot) {
      baseOwnership *= this.getGameSlotMultiplier(context.gameSlot);
    }

    // News impact
    if (context.news && context.news.length > 0) {
      baseOwnership *= this.getNewsMultiplier(context.news);
    }

    // Weather impact
    if (context.weather) {
      baseOwnership *= this.getWeatherMultiplier(context.weather);
    }

    return Math.max(0.1, Math.min(100, baseOwnership));
  }

  /**
   * Calculate base ownership from salary and position
   */
  private calculateBaseOwnership(player: SlatePlayer): number {
    // Base ownership varies by position and salary tier
    const salaryPercentile = this.getSalaryPercentile(player.salary, player.position);

    // Position-based base ownership
    const positionBase =
      (
        {
          QB: 15,
          RB: 12,
          WR: 10,
          TE: 8,
          DST: 6,
        } as Record<string, number>
      )[player.position] || 10;

    // Salary tier multiplier
    let salaryMultiplier = 1.0;
    if (salaryPercentile > 80)
      salaryMultiplier = 1.5; // Premium players
    else if (salaryPercentile > 60)
      salaryMultiplier = 1.2; // Mid-tier
    else if (salaryPercentile < 20) salaryMultiplier = 0.7; // Value plays

    return positionBase * salaryMultiplier;
  }

  /**
   * Get salary percentile for position
   */
  private getSalaryPercentile(salary: number, position: string): number {
    // TODO: Calculate against actual position salary distribution
    // For now, use rough estimates
    const salaryRanges = {
      QB: { min: 4500, max: 9000 },
      RB: { min: 3500, max: 8500 },
      WR: { min: 3000, max: 8000 },
      TE: { min: 2500, max: 7500 },
      DST: { min: 1800, max: 3200 },
    };

    const range = salaryRanges[position as keyof typeof salaryRanges];
    if (!range) return 50;

    return ((salary - range.min) / (range.max - range.min)) * 100;
  }

  /**
   * Get salary-based ownership multiplier
   */
  private getSalaryMultiplier(percentile: number): number {
    if (percentile > 90) return 1.8; // Top tier gets highest ownership
    if (percentile > 70) return 1.3;
    if (percentile > 50) return 1.1;
    if (percentile > 30) return 0.9;
    return 0.6; // Punt plays get low ownership
  }

  /**
   * Get value-based ownership multiplier
   */
  private getValueMultiplier(percentile: number): number {
    if (percentile > 80) return 1.4; // High value gets more ownership
    if (percentile > 60) return 1.2;
    if (percentile > 40) return 1.0;
    return 0.8;
  }

  /**
   * Get game slot ownership multiplier
   */
  private getGameSlotMultiplier(gameSlot: string): number {
    switch (gameSlot) {
      case 'prime':
        return 1.3; // Sunday/Monday night gets more attention
      case 'afternoon':
        return 1.1;
      case 'early':
        return 1.0;
      case 'late':
        return 0.9; // Late games get less ownership
      default:
        return 1.0;
    }
  }

  /**
   * Get news-based ownership multiplier
   */
  private getNewsMultiplier(news: string[]): number {
    let multiplier = 1.0;

    for (const item of news) {
      const lower = item.toLowerCase();
      if (lower.includes('inactive') || lower.includes('out')) {
        multiplier = 0; // Player is out
        break;
      } else if (lower.includes('questionable')) {
        multiplier *= 0.8;
      } else if (lower.includes('likely') || lower.includes('expected')) {
        multiplier *= 1.2;
      } else if (lower.includes('trending up') || lower.includes('full practice')) {
        multiplier *= 1.15;
      }
    }

    return multiplier;
  }

  /**
   * Get weather-based ownership multiplier
   */
  private getWeatherMultiplier(weather: any): number {
    let multiplier = 1.0;

    if (weather.windSpeed > 20) multiplier *= 0.9; // High wind reduces ownership
    if (weather.precipitation > 0.2) multiplier *= 0.85; // Rain reduces ownership
    if (weather.temperature < 20) multiplier *= 0.9; // Very cold reduces ownership

    return multiplier;
  }
}

// ============================================================================
// SLATE MANAGEMENT
// ============================================================================

export class SlateManager {
  private slateLoader = new SlateLoader();
  private poolAssembler = new PlayerPoolAssembler();
  private projectionBlender = new ProjectionBlender();
  private ownershipInference = new OwnershipInference();

  /**
   * Create complete slate with player pool from CSV
   */
  async createSlateFromCsv(
    csvContent: string,
    slateConfig: Parameters<SlateLoader['loadSlateFromSalaryCsv']>[1],
    options: Parameters<SlateLoader['loadSlateFromSalaryCsv']>[2] & {
      projectionSources?: Record<string, any[]>;
      ownershipData?: Record<string, number>;
      injuryReports?: Record<string, string>;
      weatherData?: Record<string, any>;
      vegas?: Record<string, any>;
    }
  ): Promise<{ slate: Slate; playerPool: PlayerPool }> {
    // Load slate
    const slate = await this.slateLoader.loadSlateFromSalaryCsv(
      csvContent,
      slateConfig,
      options
    );

    // Parse players
    const players = parseSalaryCsv(csvContent);

    // Assemble player pool
    const playerPool = await this.poolAssembler.assemblePlayerPool(
      slate,
      players,
      options
    );

    return { slate, playerPool };
  }

  /**
   * Refresh slate data with new projections/ownership
   */
  async refreshSlateData(
    slateId: string,
    updates: {
      projectionSources?: Record<string, any[]>;
      ownershipData?: Record<string, number>;
      injuryReports?: Record<string, string>;
      weatherData?: Record<string, any>;
    }
  ): Promise<PlayerPool | null> {
    const slate = this.slateLoader.getSlate(slateId);
    if (!slate) return null;

    // TODO: Reload players from stored CSV or database
    // For now, return null to indicate refresh needed
    return null;
  }

  /**
   * Get all available slates
   */
  getAvailableSlates(): Slate[] {
    return this.slateLoader.getAllSlates();
  }

  /**
   * Get live slates only
   */
  getLiveSlates(): Slate[] {
    return this.slateLoader.getLiveSlates();
  }
}

// Export singleton instance
export const slateManager = new SlateManager();
