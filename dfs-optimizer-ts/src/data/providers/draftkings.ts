import { Player, Slate, Sport } from '../types';
import log from 'loglevel';

const BASE_URL = 'https://api.draftkings.com';
const DEMO_DATA_URL = '/data/dk_nfl_latest.json'; // Will be served by Vite dev server

export class DraftKingsProvider {
  private sport: Sport;
  private currentSlate?: Slate;

  constructor(sport: Sport) {
    this.sport = sport;
    log.setLevel('info');
  }

  async getAvailableSlates(): Promise<Slate[]> {
    try {
      const response = await fetch(
        `https://www.draftkings.com/lobby/getcontests?sport=${this.sport}`
      );
      const data = await response.json();

      const slates: Slate[] = data
        .filter(
          (contest: any) =>
            contest.ContestType === 'Classic' &&
            contest.ContestStartTime > new Date().toISOString()
        )
        .map((contest: any) => ({
          id: contest.ContestKey,
          name: contest.ContestName,
          sport: this.sport,
          startTime: contest.ContestStartTime,
          draftGroupId: contest.DraftGroupId.toString(),
          playerCount: 0, // Will be populated later
        }));

      return slates;
    } catch (error) {
      log.warn('API failed, using demo slates:', error);
      // Return demo slates when API fails
      return [
        {
          id: 'demo_nfl_001',
          name: 'NFL Main Slate (Demo)',
          sport: this.sport,
          startTime: '2025-09-15T20:20:00.000Z',
          draftGroupId: 'demo_001',
          playerCount: 0,
        },
      ];
    }
  }

  async selectSlate(slateId: string): Promise<void> {
    const slates = await this.getAvailableSlates();
    const slate = slates.find(s => s.id === slateId);

    if (!slate) {
      throw new Error(`Slate ${slateId} not found for ${this.sport}`);
    }

    this.currentSlate = slate;
  }

  async getPlayers(): Promise<Player[]> {
    if (!this.currentSlate) {
      throw new Error('No slate selected. Call selectSlate() first.');
    }

    try {
      const response = await fetch(
        `${BASE_URL}/draftgroups/v1/draftgroups/${this.currentSlate.draftGroupId}/draftables`
      );
      const data = await response.json();

      const players: Player[] = data.draftables
        .filter((draftable: any) => draftable.draftableId && draftable.displayName)
        .map((draftable: any) => {
          const gameInfo =
            draftable.games && draftable.games[0]
              ? {
                  home: draftable.games[0].homeTeam,
                  away: draftable.games[0].awayTeam,
                  start: draftable.games[0].startDate,
                }
              : undefined;

          return {
            site: 'DK' as const,
            sport: this.sport,
            slateId: this.currentSlate!.id,
            playerId: draftable.draftableId.toString(),
            name: draftable.displayName,
            team: draftable.teamAbbreviation,
            opponent: this.getOpponent(draftable),
            positions: [draftable.position],
            salary: draftable.salary,
            status: draftable.status,
            game: gameInfo,
          };
        });

      // Update slate player count
      this.currentSlate.playerCount = players.length;

      return players;
    } catch (error) {
      log.error('Failed to fetch players:', error);
      throw new Error(
        `Failed to fetch DraftKings players for slate ${this.currentSlate.id}`
      );
    }
  }

  private getOpponent(draftable: any): string | undefined {
    if (!draftable.games || !draftable.games[0]) return undefined;

    const game = draftable.games[0];
    return draftable.teamAbbreviation === game.homeTeam ? game.awayTeam : game.homeTeam;
  }

  async validatePlayerPool(
    players: Player[]
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const counts = {
      NFL: { DK: 250, FD: 250 },
      NBA: { DK: 150, FD: 150 },
    };

    const threshold = counts[this.sport].DK;

    if (players.length < threshold) {
      errors.push(
        `Player count (${players.length}) below minimum threshold (${threshold}) for ${this.sport}`
      );
    }

    // Check for unique player IDs
    const playerIds = new Set(players.map(p => p.playerId));
    if (playerIds.size !== players.length) {
      errors.push('Duplicate player IDs found');
    }

    // Check for valid salaries
    const invalidSalaries = players.filter(p => p.salary <= 0 || isNaN(p.salary));
    if (invalidSalaries.length > 0) {
      errors.push(`${invalidSalaries.length} players have invalid salaries`);
    }

    // Check position coverage
    const positions = new Set(players.flatMap(p => p.positions));
    const requiredPositions =
      this.sport === 'NFL'
        ? ['QB', 'RB', 'WR', 'TE', 'DST', 'FLEX']
        : ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL'];

    const missingPositions = requiredPositions.filter(pos => !positions.has(pos));
    if (missingPositions.length > 0) {
      errors.push(`Missing positions: ${missingPositions.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getCurrentSlate(): Slate | undefined {
    return this.currentSlate;
  }
}

// Vite proxy configuration for development
export const configureProxy = () => {
  if (import.meta.env.DEV) {
    // Vite will handle proxying /dk/* to https://api.draftkings.com/*
    // This is configured in vite.config.ts
    log.info('Development mode: Using Vite proxy for DraftKings API');
  }
};
