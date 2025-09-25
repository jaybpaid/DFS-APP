// CSV Processing
export * from './csv/dk-mappers.js';

// Slate Management
export * from './slate/slate-loader.js';

// Optimization Engine
export * from './optimization/or-tools-optimizer.js';

// Simulation Engine (placeholder for future implementation)
export interface SimulationEngine {
  runMonteCarlo(lineups: any[], iterations: number): Promise<any>;
  calculateLeverage(players: any[], ownership: any[]): any[];
  analyzeCorrelations(players: any[]): any;
}

// Utility Functions
export const formatCurrency = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

export const formatPercentage = (decimal: number): string => {
  return `${(decimal * 100).toFixed(1)}%`;
};

export const calculateValue = (projection: number, salary: number): number => {
  return (projection / salary) * 1000;
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Constants
export const DFS_CONSTANTS = {
  NFL: {
    SALARY_CAP: 50000,
    ROSTER_SIZE: 9,
    POSITIONS: {
      QB: 1,
      RB: 2,
      WR: 3,
      TE: 1,
      FLEX: 1,
      DST: 1,
    },
  },
  NBA: {
    SALARY_CAP: 50000,
    ROSTER_SIZE: 8,
    POSITIONS: {
      PG: 1,
      SG: 1,
      SF: 1,
      PF: 1,
      C: 1,
      G: 1,
      F: 1,
      UTIL: 1,
    },
  },
} as const;

// Error Classes
export class DfsError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'DfsError';
  }
}

export class OptimizationError extends DfsError {
  constructor(message: string) {
    super(message, 'OPTIMIZATION_ERROR');
    this.name = 'OptimizationError';
  }
}

export class ValidationError extends DfsError {
  constructor(
    message: string,
    public errors: string[] = []
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
