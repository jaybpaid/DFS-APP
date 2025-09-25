import { EnhancedPlayer, PlayerControls } from '../types/player-controls';

interface OptimizationRequest {
  slateId: string;
  players: EnhancedPlayer[];
  constraints: {
    numLineups: number;
    salaryCapMode: 'hard' | 'soft';
    salaryCap: number;
    uniquePlayers: number;
    minSalary: number;
    maxSalary: number;
  };
  stacks: StackConfiguration[];
  variance: {
    randomnessLevel: number;
    distributionMode: 'normal' | 'lognormal' | 'empirical';
    weatherAdjustments: boolean;
  };
  simulation: {
    enabled: boolean;
    iterations: number;
    correlationMatrix: boolean;
  };
}

interface StackConfiguration {
  type: 'QB+2' | 'QB+3' | 'RB+DST' | 'Game' | 'Custom';
  team: string;
  positions: string[];
  minFromStack: number;
  maxFromStack: number;
  bringBack: number;
}

interface OptimizedLineup {
  lineupId: string;
  players: {
    playerId: string;
    playerName: string;
    position: string;
    team: string;
    salary: number;
    projectedPoints: number;
    ownership: number;
  }[];
  totalSalary: number;
  projectedScore: number;
  ownership: number;
  leverage: number;
  stackInfo: string;
  uniqueness: number;
  roi: number;
  percentile: number;
  simulationResults?: {
    floor: number;
    ceiling: number;
    median: number;
    standardDeviation: number;
    boomRate: number;
    bustRate: number;
  };
}

interface ExposureAnalysis {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  targetMin: number;
  targetMax: number;
  actualExposure: number;
  actualCount: number;
  status: 'within' | 'over' | 'under';
  variance: number;
}

interface OptimizationResponse {
  success: boolean;
  message: string;
  lineups: OptimizedLineup[];
  exposureAnalysis: ExposureAnalysis[];
  summary: {
    totalLineups: number;
    avgProjectedScore: number;
    avgLeverage: number;
    avgSalaryUtilization: number;
    optimizationTime: number;
    constraintsViolated: string[];
  };
  simulationSummary?: {
    totalIterations: number;
    avgROI: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

class OptimizationAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8001';
  }

  private getHeaders(): HeadersInit {
    const apiKey = process.env.REACT_APP_DFS_API_KEY;
    if (!apiKey) {
      throw new Error('DFS_API_KEY is not set in environment variables');
    }
    return {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    };
  }

  async optimize(request: OptimizationRequest): Promise<OptimizationResponse> {
    try {
      console.log(
        '🚀 Starting optimization with',
        request.constraints.numLineups,
        'lineups'
      );

      const response = await fetch(`${this.baseURL}/api/optimize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.statusText}`);
      }

      const result: OptimizationResponse = await response.json();

      console.log('✅ Optimization complete:', {
        lineups: result.lineups.length,
        avgScore: result.summary.avgProjectedScore,
        time: result.summary.optimizationTime,
      });

      return result;
    } catch (error) {
      console.error('❌ Optimization error:', error);
      throw new Error(
        `Failed to optimize: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async simulate(
    lineups: OptimizedLineup[],
    iterations: number = 10000
  ): Promise<{
    lineups: OptimizedLineup[];
    summary: {
      totalIterations: number;
      avgROI: number;
      winRate: number;
      sharpeRatio: number;
      maxDrawdown: number;
    };
  }> {
    try {
      console.log('🎲 Starting Monte Carlo simulation with', iterations, 'iterations');

      const response = await fetch(`${this.baseURL}/api/simulate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          lineups: lineups.map(l => ({
            lineupId: l.lineupId,
            players: l.players,
          })),
          iterations,
          distributionType: 'normal',
          correlationMatrix: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Simulation failed: ${response.statusText}`);
      }

      const result = await response.json();

      console.log('✅ Simulation complete:', {
        iterations: result.summary.totalIterations,
        avgROI: result.summary.avgROI,
        winRate: result.summary.winRate,
      });

      return result;
    } catch (error) {
      console.error('❌ Simulation error:', error);
      throw new Error(
        `Failed to simulate: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async validateConstraints(players: EnhancedPlayer[]): Promise<{
    valid: boolean;
    violations: string[];
    warnings: string[];
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/validate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ players }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Validation error:', error);
      return {
        valid: false,
        violations: [
          `API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        warnings: [],
      };
    }
  }

  async exportCSV(
    lineups: OptimizedLineup[],
    format: 'draftkings' | 'fanduel' | 'superdraft'
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/api/export`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          lineups: lineups.map(l => ({
            lineupId: l.lineupId,
            players: l.players,
          })),
          format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.csv;
    } catch (error) {
      console.error('❌ Export error:', error);
      throw new Error(
        `Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Health check for Python API
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    services: {
      optimizer: boolean;
      simulator: boolean;
      database: boolean;
      mcpServers: boolean;
    };
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/healthz`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `API unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        services: {
          optimizer: false,
          simulator: false,
          database: false,
          mcpServers: false,
        },
      };
    }
  }
}

// Singleton instance
export const optimizationAPI = new OptimizationAPI();

// Export types
export type {
  OptimizationRequest,
  OptimizedLineup,
  ExposureAnalysis,
  OptimizationResponse,
  StackConfiguration,
};
