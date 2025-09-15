import { Player, Lineup, SimulationResult, PlayerSimMetrics, LineupMetrics } from '../data/types';

export interface SimulationSettings {
  trials: number;
  includeCorrelation: boolean;
  sport: 'NFL' | 'NBA';
  contestType: 'CASH' | 'GPP';
}

export class MonteCarloSimulator {
  private players: Player[];
  private lineups: Lineup[];
  private settings: SimulationSettings;

  constructor(players: Player[], lineups: Lineup[], settings: SimulationSettings) {
    this.players = players;
    this.lineups = lineups;
    this.settings = settings;
  }

  async simulate(): Promise<SimulationResult> {
    const playerMetrics = this.calculatePlayerMetrics();
    const lineupMetrics = this.simulateLineups(playerMetrics);
    const correlationApplied = this.settings.includeCorrelation;

    return {
      trials: this.settings.trials,
      playerMetrics,
      lineupMetrics,
      correlationApplied
    };
  }

  private calculatePlayerMetrics(): Record<string, PlayerSimMetrics> {
    const metrics: Record<string, PlayerSimMetrics> = {};

    this.players.forEach(player => {
      const projection = player.projection || 0;
      const volatility = player.volatility || 0.4;
      const ceiling = player.ceiling || projection * 1.8;
      const floor = player.floor || projection * 0.6;

      // AI-powered simulation metrics
      const stdDev = projection * volatility;
      const boomThreshold = projection * 1.5;
      const cashThreshold = projection * 0.8;

      metrics[player.playerId] = {
        optimalPercentage: 0,
        cashPercentage: 0,
        boomPercentage: 0,
        averagePoints: projection,
        standardDeviation: stdDev
      };
    });

    return metrics;
  }

  private simulateLineups(playerMetrics: Record<string, PlayerSimMetrics>): LineupMetrics[] {
    const lineupResults: LineupMetrics[] = [];

    for (let i = 0; i < this.settings.trials; i++) {
      this.lineups.forEach((lineup, lineupIndex) => {
        const lineupScore = this.simulateLineupPerformance(lineup, playerMetrics);
        
        if (!lineupResults[lineupIndex]) {
          lineupResults[lineupIndex] = {
            score: 0,
            optimalPercentage: 0,
            cashPercentage: 0,
            boomPercentage: 0
          };
        }

        lineupResults[lineupIndex].score += lineupScore;
        
        // Update player metrics based on this simulation
        this.updatePlayerMetrics(lineup, lineupScore, playerMetrics);
      });
    }

    // Calculate percentages
    lineupResults.forEach(result => {
      result.score /= this.settings.trials;
      result.optimalPercentage = this.calculateOptimalPercentage(result.score);
      result.cashPercentage = this.calculateCashPercentage(result.score);
      result.boomPercentage = this.calculateBoomPercentage(result.score);
    });

    // Normalize player percentages
    Object.values(playerMetrics).forEach(metrics => {
      metrics.optimalPercentage /= this.settings.trials;
      metrics.cashPercentage /= this.settings.trials;
      metrics.boomPercentage /= this.settings.trials;
    });

    return lineupResults;
  }

  private simulateLineupPerformance(lineup: Lineup, playerMetrics: Record<string, PlayerSimMetrics>): number {
    let totalScore = 0;
    const correlationFactor = this.settings.includeCorrelation ? this.calculateCorrelationFactor(lineup) : 1.0;

    lineup.players.forEach(player => {
      const metrics = playerMetrics[player.playerId];
      const baseScore = metrics.averagePoints;
      const stdDev = metrics.standardDeviation;
      
      // Apply normal distribution with correlation
      let playerScore = this.generateNormalRandom(baseScore, stdDev);
      
      // Apply game-specific factors
      playerScore *= this.applyGameFactors(player);
      
      // Apply correlation
      playerScore *= correlationFactor;

      totalScore += Math.max(0, playerScore);
    });

    return totalScore;
  }

  private generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  private calculateCorrelationFactor(lineup: Lineup): number {
    // AI-powered correlation modeling
    let correlation = 1.0;
    const teams = new Set(lineup.players.map(p => p.team));
    const gameCount = teams.size;

    // Stacking bonuses
    const qbWrStacks = this.countQBWRStacks(lineup);
    const gameStacks = this.countGameStacks(lineup);

    // Positive correlation for stacks
    correlation += qbWrStacks * 0.05;
    correlation += gameStacks * 0.03;

    // Negative correlation for diversification
    if (gameCount >= 4) {
      correlation -= 0.02;
    }

    return Math.max(0.8, Math.min(1.2, correlation));
  }

  private countQBWRStacks(lineup: Lineup): number {
    let count = 0;
    const qb = lineup.players.find(p => p.positions.includes('QB'));
    
    if (qb) {
      count = lineup.players.filter(p => 
        p.team === qb.team && 
        (p.positions.includes('WR') || p.positions.includes('TE'))
      ).length;
    }

    return count;
  }

  private countGameStacks(lineup: Lineup): number {
    const teamPlayers: Record<string, number> = {};
    
    lineup.players.forEach(player => {
      teamPlayers[player.team] = (teamPlayers[player.team] || 0) + 1;
    });

    return Object.values(teamPlayers).filter(count => count >= 2).length;
  }

  private applyGameFactors(player: Player): number {
    let factor = 1.0;

    // Weather impact
    if (player.weatherImpact !== undefined) {
      factor *= player.weatherImpact;
    }

    // Stadium factor
    if (player.stadiumFactor !== undefined) {
      factor *= player.stadiumFactor;
    }

    // Matchup difficulty
    if (player.matchupDifficulty !== undefined) {
      factor *= (1.0 - player.matchupDifficulty * 0.2);
    }

    return Math.max(0.5, Math.min(1.5, factor));
  }

  private updatePlayerMetrics(lineup: Lineup, lineupScore: number, playerMetrics: Record<string, PlayerSimMetrics>): void {
    const optimalThreshold = this.getOptimalThreshold();
    const cashThreshold = this.getCashThreshold();
    const boomThreshold = this.getBoomThreshold();

    lineup.players.forEach(player => {
      const metrics = playerMetrics[player.playerId];
      
      if (lineupScore >= optimalThreshold) {
        metrics.optimalPercentage++;
      }
      if (lineupScore >= cashThreshold) {
        metrics.cashPercentage++;
      }
      if (lineupScore >= boomThreshold) {
        metrics.boomPercentage++;
      }
    });
  }

  private getOptimalThreshold(): number {
    // Based on contest type and sport
    switch (this.settings.sport) {
      case 'NFL':
        return this.settings.contestType === 'CASH' ? 150 : 180;
      case 'NBA':
        return this.settings.contestType === 'CASH' ? 300 : 350;
      default:
        return 200;
    }
  }

  private getCashThreshold(): number {
    switch (this.settings.sport) {
      case 'NFL':
        return this.settings.contestType === 'CASH' ? 120 : 140;
      case 'NBA':
        return this.settings.contestType === 'CASH' ? 250 : 280;
      default:
        return 180;
    }
  }

  private getBoomThreshold(): number {
    switch (this.settings.sport) {
      case 'NFL':
        return this.settings.contestType === 'CASH' ? 200 : 250;
      case 'NBA':
        return this.settings.contestType === 'CASH' ? 400 : 450;
      default:
        return 300;
    }
  }

  private calculateOptimalPercentage(score: number): number {
    const threshold = this.getOptimalThreshold();
    return Math.min(1, Math.max(0, (score - threshold + 20) / 40));
  }

  private calculateCashPercentage(score: number): number {
    const threshold = this.getCashThreshold();
    return Math.min(1, Math.max(0, (score - threshold + 15) / 30));
  }

  private calculateBoomPercentage(score: number): number {
    const threshold = this.getBoomThreshold();
    return Math.min(1, Math.max(0, (score - threshold + 25) / 50));
  }
}
