/**
 * API Bridge Layer for DFSForge + DFS-SYSTEM-2 Integration
 * Translates between frontend expectations and backend reality
 */

import { z } from 'zod';

// ================================
// Data Transformation Schemas
// ================================

// DFS-SYSTEM-2 Backend Schemas
const DFSSystem2PlayerSchema = z.object({
  player_id: z.string(),
  name: z.string(),
  roster_position: z.string(),
  salary: z.number(),
  fppg: z.number(),
  ownership_proj: z.number().optional(),
  team: z.string(),
  opponent: z.string().optional(),
  game_info: z
    .object({
      game_time: z.string(),
      weather: z.string().optional(),
      spread: z.number().optional(),
      total: z.number().optional(),
    })
    .optional(),
});

const DFSSystem2LineupSchema = z.object({
  lineup_id: z.string(),
  players: z.array(DFSSystem2PlayerSchema),
  total_salary: z.number(),
  projected_points: z.number(),
  ownership_proj: z.number().optional(),
  leverage_score: z.number().optional(),
});

// DFSForge Frontend Schemas
const DFSForgePlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string(),
  salary: z.number(),
  projection: z.number(),
  ownership: z.number().optional(),
  team: z.string(),
  opponent: z.string().optional(),
  gameInfo: z
    .object({
      gameTime: z.string(),
      weather: z.string().optional(),
      spread: z.number().optional(),
      total: z.number().optional(),
    })
    .optional(),
});

const DFSForgeLineupSchema = z.object({
  id: z.string(),
  players: z.array(DFSForgePlayerSchema),
  totalSalary: z.number(),
  projection: z.number(),
  ownership: z.number().optional(),
  leverage: z.number().optional(),
});

// ================================
// Type Definitions
// ================================

type DFSSystem2Player = z.infer<typeof DFSSystem2PlayerSchema>;
type DFSSystem2Lineup = z.infer<typeof DFSSystem2LineupSchema>;
type DFSForgePlayer = z.infer<typeof DFSForgePlayerSchema>;
type DFSForgeLineup = z.infer<typeof DFSForgeLineupSchema>;

// ================================
// API Bridge Class
// ================================

export class DFSIntegrationBridge {
  private baseUrl: string;
  private dfsSystem2Port: number = 8000;
  private draftKingsApiPort: number = 8765;

  constructor(baseUrl: string = 'http://localhost') {
    this.baseUrl = baseUrl;
  }

  // ================================
  // Data Transformation Methods
  // ================================

  private transformPlayer(player: DFSSystem2Player): DFSForgePlayer {
    return {
      id: player.player_id,
      name: player.name,
      position: player.roster_position,
      salary: player.salary,
      projection: player.fppg,
      ownership: player.ownership_proj,
      team: player.team,
      opponent: player.opponent,
      gameInfo: player.game_info
        ? {
            gameTime: player.game_info.game_time,
            weather: player.game_info.weather,
            spread: player.game_info.spread,
            total: player.game_info.total,
          }
        : undefined,
    };
  }

  private transformLineup(lineup: DFSSystem2Lineup): DFSForgeLineup {
    return {
      id: lineup.lineup_id,
      players: lineup.players.map(p => this.transformPlayer(p)),
      totalSalary: lineup.total_salary,
      projection: lineup.projected_points,
      ownership: lineup.ownership_proj,
      leverage: lineup.leverage_score,
    };
  }

  // ================================
  // API Methods
  // ================================

  async getPlayers(sport: 'nfl' | 'nba' | 'mlb' | 'nhl'): Promise<DFSForgePlayer[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}:${this.draftKingsApiPort}/api/players?sport=${sport.toUpperCase()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch players: ${response.statusText}`);
      }

      const data = await response.json();
      const players = z.array(DFSSystem2PlayerSchema).parse(data);

      return players.map(player => this.transformPlayer(player));
    } catch (error) {
      console.error('Error fetching players:', error);
      throw new Error('Failed to fetch player data from DFS-SYSTEM-2');
    }
  }

  async getSlates(sport: 'nfl' | 'nba' | 'mlb' | 'nhl', date?: string): Promise<any[]> {
    try {
      const url = new URL(`${this.baseUrl}:${this.draftKingsApiPort}/api/contests`);
      url.searchParams.set('sport', sport.toUpperCase());
      if (date) url.searchParams.set('date', date);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch slates: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching slates:', error);
      throw new Error('Failed to fetch slate data from DFS-SYSTEM-2');
    }
  }

  async generateLineups(config: {
    sport: 'nfl' | 'nba' | 'mlb' | 'nhl';
    site: 'dk' | 'fd';
    lineupCount: number;
    objective: 'ev' | 'projection' | 'hybrid' | 'ceiling';
    simulationRuns?: number;
    stackingEnabled?: boolean;
    lockedPlayers?: string[];
    bannedPlayers?: string[];
    exposureSettings?: any;
  }): Promise<DFSForgeLineup[]> {
    try {
      const requestBody = {
        sport: config.sport.toUpperCase(),
        site: config.site.toUpperCase(),
        lineup_count: config.lineupCount,
        optimization_objective: config.objective,
        simulation_runs: config.simulationRuns || 10000,
        stacking_enabled: config.stackingEnabled || true,
        locked_players: config.lockedPlayers || [],
        banned_players: config.bannedPlayers || [],
        exposure_settings: config.exposureSettings || {},
      };

      const response = await fetch(
        `${this.baseUrl}:${this.dfsSystem2Port}/api/generate-lineups`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate lineups: ${response.statusText}`);
      }

      const data = await response.json();
      const lineups = z.array(DFSSystem2LineupSchema).parse(data.lineups);

      return lineups.map(lineup => this.transformLineup(lineup));
    } catch (error) {
      console.error('Error generating lineups:', error);
      throw new Error('Failed to generate lineups with DFS-SYSTEM-2');
    }
  }

  async runSimulation(config: {
    lineups: DFSForgeLineup[];
    simulationCount: number;
    fieldSize: number;
  }): Promise<any> {
    try {
      // Transform lineups back to DFS-SYSTEM-2 format
      const dfsSystem2Lineups = config.lineups.map(lineup => ({
        lineup_id: lineup.id,
        players: lineup.players.map(player => ({
          player_id: player.id,
          name: player.name,
          roster_position: player.position,
          salary: player.salary,
          fppg: player.projection,
          ownership_proj: player.ownership,
          team: player.team,
          opponent: player.opponent,
        })),
        total_salary: lineup.totalSalary,
        projected_points: lineup.projection,
        ownership_proj: lineup.ownership,
        leverage_score: lineup.leverage,
      }));

      const requestBody = {
        lineups: dfsSystem2Lineups,
        simulation_count: config.simulationCount,
        field_size: config.fieldSize,
      };

      const response = await fetch(
        `${this.baseUrl}:${this.dfsSystem2Port}/api/run-simulation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to run simulation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error running simulation:', error);
      throw new Error('Failed to run simulation with DFS-SYSTEM-2');
    }
  }

  async exportLineups(
    lineups: DFSForgeLineup[],
    format: 'dk' | 'fd' = 'dk'
  ): Promise<string> {
    try {
      const requestBody = {
        lineups: lineups.map(lineup => this.transformLineupForExport(lineup)),
        format: format.toUpperCase(),
      };

      const response = await fetch(
        `${this.baseUrl}:${this.dfsSystem2Port}/api/export-optimized`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to export lineups: ${response.statusText}`);
      }

      const data = await response.json();
      return data.csv_content;
    } catch (error) {
      console.error('Error exporting lineups:', error);
      throw new Error('Failed to export lineups with DFS-SYSTEM-2');
    }
  }

  private transformLineupForExport(lineup: DFSForgeLineup): any {
    return {
      lineup_id: lineup.id,
      players: lineup.players.map(player => ({
        player_id: player.id,
        name: player.name,
        roster_position: player.position,
        salary: player.salary,
        fppg: player.projection,
        team: player.team,
      })),
      total_salary: lineup.totalSalary,
      projected_points: lineup.projection,
    };
  }

  // ================================
  // Health Check Methods
  // ================================

  async healthCheck(): Promise<{ dfsSystem2: boolean; draftKingsApi: boolean }> {
    try {
      const [dfsSystem2Response, dkApiResponse] = await Promise.allSettled([
        fetch(`${this.baseUrl}:${this.dfsSystem2Port}/health`),
        fetch(`${this.baseUrl}:${this.draftKingsApiPort}/health`),
      ]);

      return {
        dfsSystem2:
          dfsSystem2Response.status === 'fulfilled' && dfsSystem2Response.value.ok,
        draftKingsApi: dkApiResponse.status === 'fulfilled' && dkApiResponse.value.ok,
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return { dfsSystem2: false, draftKingsApi: false };
    }
  }
}

// ================================
// React Hook for Integration
// ================================

export function useDFSIntegration() {
  const bridge = new DFSIntegrationBridge();

  return {
    getPlayers: bridge.getPlayers.bind(bridge),
    getSlates: bridge.getSlates.bind(bridge),
    generateLineups: bridge.generateLineups.bind(bridge),
    runSimulation: bridge.runSimulation.bind(bridge),
    exportLineups: bridge.exportLineups.bind(bridge),
    healthCheck: bridge.healthCheck.bind(bridge),
  };
}

export default DFSIntegrationBridge;
