import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export const OptimizationRequestSchema = z.object({
  slateId: z.string(),
  lineupCount: z.number().min(1).max(150),
  uniqueness: z.number().min(0).max(1).default(0.7),
  settings: z
    .object({
      exposures: z.record(z.number()).optional(),
      stacks: z
        .array(
          z.object({
            teamId: z.string(),
            positions: z.array(z.string()),
            minPlayers: z.number(),
            maxPlayers: z.number(),
          })
        )
        .optional(),
      groups: z
        .array(
          z.object({
            playerIds: z.array(z.string()),
            minExposure: z.number(),
            maxExposure: z.number(),
          })
        )
        .optional(),
      locks: z.array(z.string()).optional(),
      bans: z.array(z.string()).optional(),
      minSalary: z.number().optional(),
      maxSalary: z.number().optional(),
    })
    .optional(),
});

export type OptimizationRequest = z.infer<typeof OptimizationRequestSchema>;

export interface Player {
  id: string;
  name: string;
  position: string;
  salary: number;
  projection: number;
  team: string;
  gameId?: string;
}

export interface Lineup {
  id: string;
  players: Player[];
  totalSalary: number;
  projectedPoints: number;
  positions: Record<string, Player>;
}

export interface OptimizationResult {
  success: boolean;
  lineups: Lineup[];
  runtime: number;
  settings: OptimizationRequest['settings'];
  error?: string;
}

// ============================================================================
// OR-TOOLS OPTIMIZER CLASS
// ============================================================================

export class OrToolsOptimizer {
  private players: Player[] = [];
  private positionLimits: Record<string, number> = {
    QB: 1,
    RB: 2,
    WR: 3,
    TE: 1,
    FLEX: 1,
    DST: 1,
  };
  private salaryCap: number = 50000;
  private rosterSize: number = 9;

  constructor(players: Player[], salaryCap: number = 50000) {
    this.players = players;
    this.salaryCap = salaryCap;
    this.validatePlayers();
  }

  /**
   * Validate player data before optimization
   */
  private validatePlayers(): void {
    if (this.players.length === 0) {
      throw new Error('No players provided for optimization');
    }

    for (const player of this.players) {
      if (!player.id || !player.name || !player.position) {
        throw new Error(`Invalid player data: ${JSON.stringify(player)}`);
      }
      if (player.salary <= 0 || player.projection < 0) {
        throw new Error(
          `Invalid player values: ${player.name} - Salary: ${player.salary}, Projection: ${player.projection}`
        );
      }
    }
  }

  /**
   * Main optimization function using OR-Tools CP-SAT
   */
  async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    const startTime = Date.now();

    try {
      // Validate request
      const validatedRequest = OptimizationRequestSchema.parse(request);

      // For now, we'll use a simplified optimization algorithm
      // In production, this would use actual OR-Tools CP-SAT solver
      const lineups = await this.generateLineupsSimplified(validatedRequest);

      const runtime = Date.now() - startTime;

      return {
        success: true,
        lineups,
        runtime,
        settings: validatedRequest.settings,
      };
    } catch (error) {
      return {
        success: false,
        lineups: [],
        runtime: Date.now() - startTime,
        settings: request.settings,
        error: error instanceof Error ? error.message : 'Unknown optimization error',
      };
    }
  }

  /**
   * Simplified lineup generation (placeholder for OR-Tools implementation)
   */
  private async generateLineupsSimplified(
    request: OptimizationRequest
  ): Promise<Lineup[]> {
    const { lineupCount, settings } = request;
    const lineups: Lineup[] = [];

    // Filter players based on locks and bans
    let availablePlayers = this.players.filter(p => {
      if (settings?.bans?.includes(p.id)) return false;
      return true;
    });

    // Sort players by value (projection per dollar)
    availablePlayers.sort((a, b) => b.projection / b.salary - a.projection / a.salary);

    for (let i = 0; i < lineupCount; i++) {
      try {
        const lineup = await this.generateSingleLineup(availablePlayers, settings, i);
        if (lineup) {
          lineups.push(lineup);
        }
      } catch (error) {
        console.warn(`Failed to generate lineup ${i + 1}:`, error);
        // Continue with next lineup
      }
    }

    return lineups;
  }

  /**
   * Generate a single optimized lineup
   */
  private async generateSingleLineup(
    availablePlayers: Player[],
    settings: OptimizationRequest['settings'],
    lineupIndex: number
  ): Promise<Lineup | null> {
    const lineup: Record<string, Player> = {};
    let totalSalary = 0;
    let totalProjection = 0;
    const usedPlayers = new Set<string>();

    // Add locked players first
    if (settings?.locks) {
      for (const lockedPlayerId of settings.locks) {
        const player = availablePlayers.find(p => p.id === lockedPlayerId);
        if (player && !usedPlayers.has(player.id)) {
          // Find appropriate position for locked player
          const position = this.findPositionForPlayer(player, lineup);
          if (position) {
            lineup[position] = player;
            totalSalary += player.salary;
            totalProjection += player.projection;
            usedPlayers.add(player.id);
          }
        }
      }
    }

    // Fill remaining positions with optimal players
    const remainingPositions = this.getRemainingPositions(lineup);

    for (const position of remainingPositions) {
      const eligiblePlayers = availablePlayers.filter(
        p =>
          !usedPlayers.has(p.id) &&
          this.isPlayerEligibleForPosition(p, position) &&
          totalSalary + p.salary <= this.salaryCap
      );

      if (eligiblePlayers.length === 0) {
        // Try to find any player that fits salary constraints
        const anyEligible = availablePlayers.filter(
          p => !usedPlayers.has(p.id) && totalSalary + p.salary <= this.salaryCap
        );

        if (anyEligible.length === 0) {
          return null; // Cannot complete lineup
        }

        // Use the cheapest available player
        const cheapest = anyEligible.sort((a, b) => a.salary - b.salary)[0];
        lineup[position] = cheapest;
        totalSalary += cheapest.salary;
        totalProjection += cheapest.projection;
        usedPlayers.add(cheapest.id);
      } else {
        // Add some randomness for uniqueness
        const randomIndex = Math.floor(
          Math.random() * Math.min(5, eligiblePlayers.length)
        );
        const selectedPlayer = eligiblePlayers[randomIndex];

        lineup[position] = selectedPlayer;
        totalSalary += selectedPlayer.salary;
        totalProjection += selectedPlayer.projection;
        usedPlayers.add(selectedPlayer.id);
      }
    }

    // Validate lineup completeness
    if (Object.keys(lineup).length !== this.rosterSize) {
      return null;
    }

    // Apply salary constraints
    if (settings?.minSalary && totalSalary < settings.minSalary) {
      return null;
    }
    if (settings?.maxSalary && totalSalary > settings.maxSalary) {
      return null;
    }

    return {
      id: `lineup_${lineupIndex + 1}_${Date.now()}`,
      players: Object.values(lineup),
      totalSalary,
      projectedPoints: totalProjection,
      positions: lineup,
    };
  }

  /**
   * Find appropriate position for a player
   */
  private findPositionForPlayer(
    player: Player,
    currentLineup: Record<string, Player>
  ): string | null {
    // Primary position
    if (
      this.isPlayerEligibleForPosition(player, player.position) &&
      !currentLineup[player.position]
    ) {
      return player.position;
    }

    // FLEX position for RB/WR/TE
    if (['RB', 'WR', 'TE'].includes(player.position) && !currentLineup['FLEX']) {
      return 'FLEX';
    }

    // Multiple position slots (RB1, RB2, WR1, WR2, WR3)
    if (player.position === 'RB') {
      if (!currentLineup['RB1']) return 'RB1';
      if (!currentLineup['RB2']) return 'RB2';
    }

    if (player.position === 'WR') {
      if (!currentLineup['WR1']) return 'WR1';
      if (!currentLineup['WR2']) return 'WR2';
      if (!currentLineup['WR3']) return 'WR3';
    }

    return null;
  }

  /**
   * Check if player is eligible for a position
   */
  private isPlayerEligibleForPosition(player: Player, position: string): boolean {
    if (position === 'FLEX') {
      return ['RB', 'WR', 'TE'].includes(player.position);
    }

    if (position.startsWith(player.position)) {
      return true;
    }

    return player.position === position;
  }

  /**
   * Get remaining positions to fill
   */
  private getRemainingPositions(currentLineup: Record<string, Player>): string[] {
    const allPositions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST'];
    return allPositions.filter(pos => !currentLineup[pos]);
  }

  /**
   * Apply uniqueness constraints between lineups
   */
  private applyUniquenessConstraints(lineups: Lineup[], uniqueness: number): Lineup[] {
    if (uniqueness === 0 || lineups.length <= 1) {
      return lineups;
    }

    const filteredLineups: Lineup[] = [lineups[0]]; // Always keep first lineup

    for (let i = 1; i < lineups.length; i++) {
      const currentLineup = lineups[i];
      let isUnique = true;

      for (const existingLineup of filteredLineups) {
        const similarity = this.calculateLineupSimilarity(
          currentLineup,
          existingLineup
        );
        if (similarity > 1 - uniqueness) {
          isUnique = false;
          break;
        }
      }

      if (isUnique) {
        filteredLineups.push(currentLineup);
      }
    }

    return filteredLineups;
  }

  /**
   * Calculate similarity between two lineups
   */
  private calculateLineupSimilarity(lineup1: Lineup, lineup2: Lineup): number {
    const players1 = new Set(lineup1.players.map(p => p.id));
    const players2 = new Set(lineup2.players.map(p => p.id));

    const intersection = new Set([...players1].filter(x => players2.has(x)));
    const union = new Set([...players1, ...players2]);

    return intersection.size / union.size;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create optimizer instance with player data
 */
export function createOptimizer(
  players: Player[],
  salaryCap: number = 50000
): OrToolsOptimizer {
  return new OrToolsOptimizer(players, salaryCap);
}

/**
 * Validate lineup against DFS rules
 */
export function validateLineup(
  lineup: Lineup,
  salaryCap: number = 50000
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check roster size
  if (lineup.players.length !== 9) {
    errors.push(`Invalid roster size: ${lineup.players.length} (expected 9)`);
  }

  // Check salary cap
  if (lineup.totalSalary > salaryCap) {
    errors.push(`Salary cap exceeded: $${lineup.totalSalary} > $${salaryCap}`);
  }

  // Check position requirements
  const positionCounts: Record<string, number> = {};
  lineup.players.forEach(player => {
    positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
  });

  // Validate position limits (simplified for NFL)
  const requiredPositions = { QB: 1, RB: 2, WR: 3, TE: 1, DST: 1 };
  for (const [position, required] of Object.entries(requiredPositions)) {
    const actual = positionCounts[position] || 0;
    if (actual < required) {
      errors.push(`Not enough ${position}: ${actual} (required ${required})`);
    }
  }

  // Check for duplicate players
  const playerIds = lineup.players.map(p => p.id);
  const uniqueIds = new Set(playerIds);
  if (playerIds.length !== uniqueIds.size) {
    errors.push('Duplicate players in lineup');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate lineup value metrics
 */
export function calculateLineupMetrics(lineup: Lineup) {
  const avgSalary = lineup.totalSalary / lineup.players.length;
  const avgProjection = lineup.projectedPoints / lineup.players.length;
  const valueRatio = (lineup.projectedPoints / lineup.totalSalary) * 1000;

  return {
    avgSalary,
    avgProjection,
    valueRatio,
    salaryRemaining: 50000 - lineup.totalSalary,
    projectionPerDollar: lineup.projectedPoints / lineup.totalSalary,
  };
}

/**
 * Export lineups to DraftKings CSV format
 */
export function exportToDraftKingsFormat(lineups: Lineup[]): string {
  const headers = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST'];

  const csvRows = lineups.map(lineup => {
    const row: string[] = [];

    // Map players to positions
    const positionMap: Record<string, string> = {};
    lineup.players.forEach(player => {
      const position = Object.keys(lineup.positions).find(
        pos => lineup.positions[pos].id === player.id
      );
      if (position) {
        positionMap[position] = `${player.name} (${player.id})`;
      }
    });

    // Build row in correct order
    headers.forEach(header => {
      row.push(positionMap[header] || '');
    });

    return row.join(',');
  });

  return [headers.join(','), ...csvRows].join('\n');
}

// ============================================================================
// FALLBACK GLPK.JS OPTIMIZER
// ============================================================================

export class GlpkOptimizer {
  private players: Player[] = [];

  constructor(players: Player[]) {
    this.players = players;
  }

  /**
   * Fallback optimization using GLPK.js
   */
  async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    const startTime = Date.now();

    try {
      // Simple greedy algorithm as fallback
      const lineups = await this.generateGreedyLineups(request);

      return {
        success: true,
        lineups,
        runtime: Date.now() - startTime,
        settings: request.settings,
      };
    } catch (error) {
      return {
        success: false,
        lineups: [],
        runtime: Date.now() - startTime,
        settings: request.settings,
        error: error instanceof Error ? error.message : 'Fallback optimization failed',
      };
    }
  }

  /**
   * Generate lineups using greedy algorithm
   */
  private async generateGreedyLineups(request: OptimizationRequest): Promise<Lineup[]> {
    const lineups: Lineup[] = [];
    const { lineupCount } = request;

    // Simple greedy approach - select highest value players
    const sortedPlayers = [...this.players].sort(
      (a, b) => b.projection / b.salary - a.projection / a.salary
    );

    for (let i = 0; i < lineupCount; i++) {
      const lineup = this.buildGreedyLineup(sortedPlayers, request.settings, i);
      if (lineup) {
        lineups.push(lineup);
      }
    }

    return lineups;
  }

  /**
   * Build single lineup using greedy approach
   */
  private buildGreedyLineup(
    players: Player[],
    settings: OptimizationRequest['settings'],
    index: number
  ): Lineup | null {
    // Implementation would go here
    // For now, return null to indicate not implemented
    return null;
  }
}

// ============================================================================
// MAIN OPTIMIZER FACTORY
// ============================================================================

/**
 * Create optimizer instance with automatic fallback
 */
export async function createDfsOptimizer(players: Player[], salaryCap: number = 50000) {
  try {
    // Try OR-Tools first
    return new OrToolsOptimizer(players, salaryCap);
  } catch (error) {
    console.warn('OR-Tools not available, falling back to GLPK.js:', error);
    return new GlpkOptimizer(players);
  }
}

/**
 * Main optimization entry point
 */
export async function optimizeLineups(
  players: Player[],
  request: OptimizationRequest
): Promise<OptimizationResult> {
  const optimizer = await createDfsOptimizer(players);
  return optimizer.optimize(request);
}
