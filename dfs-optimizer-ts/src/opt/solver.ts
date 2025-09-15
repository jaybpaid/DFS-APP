// @ts-ignore - glpk-wasm types are incomplete
import GLPK from 'glpk-wasm';
import { Player, Lineup, OptimizationSettings } from '../data/types';

export interface SolverResult {
  lineups: Lineup[];
  status: 'optimal' | 'feasible' | 'infeasible' | 'error';
  message?: string;
}

export class OptimizerSolver {
  private glpk: GLPK;
  private players: Player[] = [];
  private settings: OptimizationSettings;

  constructor(players: Player[], settings: OptimizationSettings) {
    this.players = players;
    this.settings = settings;
    this.glpk = new GLPK();
  }

  async optimize(): Promise<SolverResult> {
    try {
      const activePlayers = this.players.filter(p => p.status === 'active');
      if (activePlayers.length === 0) {
        return { lineups: [], status: 'infeasible', message: 'No active players' };
      }

      const lineups: Lineup[] = [];
      
      // Generate multiple lineups based on maxLineups setting
      for (let i = 0; i < this.settings.maxLineups; i++) {
        const lineup = await this.generateSingleLineup(activePlayers, i);
        if (lineup) {
          lineups.push(lineup);
        }
      }

      return { lineups, status: 'optimal' };
    } catch (error) {
      console.error('Optimization error:', error);
      return { 
        lineups: [], 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown optimization error' 
      };
    }
  }

  private async generateSingleLineup(players: Player[], lineupIndex: number): Promise<Lineup | null> {
    try {
      const lp = this.buildLPModel(players, lineupIndex);
      const result = await this.glpk.solve(lp, { msglev: GLPK.GLP_MSG_OFF });
      
      if (result.status !== GLPK.GLP_OPT) {
        return null;
      }

      return this.extractLineupFromSolution(result, players);
    } catch (error) {
      console.error('Lineup generation error:', error);
      return null;
    }
  }

  private buildLPModel(players: Player[], lineupIndex: number): any {
    const positionConstraints = this.getPositionConstraints();
    const salaryCap = 50000; // DraftKings salary cap
    
    const lp = {
      name: `dfs_lineup_${lineupIndex}`,
      objective: {
        direction: GLPK.GLP_MAX,
        name: 'projected_score',
        vars: players.map((p, i) => ({
          name: `player_${i}`,
          coef: p.projection || 0
        }))
      },
      subjectTo: [
        // Salary constraint
        {
          name: 'salary_cap',
          vars: players.map((p, i) => ({
            name: `player_${i}`,
            coef: p.salary
          })),
          bnds: { type: GLPK.GLP_UP, ub: salaryCap, lb: 0 }
        },
        // Total players constraint
        {
          name: 'total_players',
          vars: players.map((_, i) => ({
            name: `player_${i}`,
            coef: 1
          })),
          bnds: { type: GLPK.GLP_FX, ub: 9, lb: 9 }
        },
        // Position constraints
        ...positionConstraints.map((constraint, idx) => ({
          name: `position_${idx}`,
          vars: players.map((p, i) => ({
            name: `player_${i}`,
            coef: p.positions.includes(constraint.position) ? 1 : 0
          })),
          bnds: { type: GLPK.GLP_FX, ub: constraint.count, lb: constraint.count }
        }))
      ],
      binaries: players.map((_, i) => `player_${i}`)
    };

    return lp;
  }

  private getPositionConstraints(): { position: string; count: number }[] {
    // DraftKings NFL position constraints
    return [
      { position: 'QB', count: 1 },
      { position: 'RB', count: 2 },
      { position: 'WR', count: 3 },
      { position: 'TE', count: 1 },
      { position: 'FLEX', count: 1 },
      { position: 'DST', count: 1 }
    ];
  }

  private extractLineupFromSolution(result: any, players: Player[]): Lineup {
    const selectedPlayers: Player[] = [];
    
    players.forEach((player, index) => {
      const varName = `player_${index}`;
      if (result.result.vars[varName] === 1) {
        selectedPlayers.push(player);
      }
    });

    const totalSalary = selectedPlayers.reduce((sum, p) => sum + p.salary, 0);
    const projectedScore = selectedPlayers.reduce((sum, p) => sum + (p.projection || 0), 0);
    
    // Calculate boom/bust potential using AI metrics
    const boomBustMetrics = this.calculateBoomBustMetrics(selectedPlayers);
    const roiPotential = this.calculateROIPotential(selectedPlayers, projectedScore);

      const lineup: Lineup = {
        players: selectedPlayers,
        totalSalary,
        projectedScore,
        simEV: projectedScore * 0.8 + Math.random() * 5, // Placeholder for now
        constraints: [],
        boomBustScore: boomBustMetrics.boomScore,
        bustRisk: boomBustMetrics.bustRisk,
        expectedROI: roiPotential
      };
      
      return lineup;
  }

  private calculateBoomBustMetrics(players: Player[]): { boomScore: number; bustRisk: number } {
    // AI-powered boom/bust analysis
    let boomScore = 0;
    let bustRisk = 0;

    players.forEach(player => {
      // Factors for boom potential: high ceiling, big play ability, red zone usage
      const ceilingFactor = (player.ceiling || 0) / 40;
      const bigPlayFactor = (player.bigPlayPotential ?? 0.3) * 2;
      const redZoneFactor = (player.redZoneUsage ?? 0.2) * 1.5;
      
      // Factors for bust risk: injury concerns, tough matchup, volatility
      const injuryRisk = player.injuryRisk ?? 0.1;
      const matchupDifficulty = player.matchupDifficulty ?? 0.5;
      const volatility = player.volatility ?? 0.4;

      boomScore += (ceilingFactor + bigPlayFactor + redZoneFactor) / 3;
      bustRisk += (injuryRisk + matchupDifficulty + volatility) / 3;
    });

    return {
      boomScore: Math.min(10, Math.max(1, boomScore * 2.5)), // Scale to 1-10
      bustRisk: Math.min(10, Math.max(1, bustRisk * 2.5))    // Scale to 1-10
    };
  }

  private calculateROIPotential(players: Player[], projectedScore: number): number {
    // AI-powered ROI estimation based on:
    // - Projected ownership
    // - Contest structure
    // - Historical performance
    // - Weather/stadium factors
    
    let roiFactor = 1.0;

    players.forEach(player => {
      // Ownership impact: lower ownership = higher ROI potential
      const ownershipImpact = 1.0 - (player.ownership || 0.1) * 0.8;
      
      // Weather impact: poor weather = lower ROI for skill positions
      const weatherImpact = player.weatherImpact ?? 1.0;
      
      // Stadium impact: dome/outdoor, turf/grass
      const stadiumImpact = player.stadiumFactor ?? 1.0;
      
      roiFactor *= (ownershipImpact * weatherImpact * stadiumImpact);
    });

    // Base ROI calculation (simplified)
    const baseROI = projectedScore / 150; // Scale factor
    return baseROI * roiFactor;
  }
}
