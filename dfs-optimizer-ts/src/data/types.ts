export type Sport = 'NFL' | 'NBA';
export type Site = 'DK' | 'FD';

export interface GameInfo {
  home: string;
  away: string;
  start: string;
  total?: number;
  spread?: number;
}

export interface Player {
  site: Site;
  sport: Sport;
  slateId: string;
  playerId: string;
  name: string;
  team: string;
  opponent?: string;
  positions: string[];
  salary: number;
  status?: string;
  game?: GameInfo;
  projection?: number;
  ownership?: number;
  boomPercentage?: number;
  floor?: number;
  ceiling?: number;
  
  // AI-powered metrics
  bigPlayPotential?: number; // 0-1 scale
  redZoneUsage?: number;     // 0-1 scale
  injuryRisk?: number;      // 0-1 scale
  matchupDifficulty?: number; // 0-1 scale
  volatility?: number;       // 0-1 scale
  weatherImpact?: number;   // 0-1 scale (1 = neutral, <1 = negative, >1 = positive)
  stadiumFactor?: number;    // 0-1 scale (dome vs outdoor, turf vs grass)
}

export interface Slate {
  id: string;
  name: string;
  sport: Sport;
  startTime: string;
  draftGroupId: string;
  playerCount: number;
}

export interface PoolValidationResult {
  isValid: boolean;
  errors: string[];
  counts: {
    total: number;
    byPosition: Record<string, number>;
    byTeam: Record<string, number>;
  };
}

export interface SimulationResult {
  trials: number;
  playerMetrics: Record<string, PlayerSimMetrics>;
  lineupMetrics: LineupMetrics[];
  correlationApplied: boolean;
}

export interface PlayerSimMetrics {
  optimalPercentage: number;
  cashPercentage: number;
  boomPercentage: number;
  averagePoints: number;
  standardDeviation: number;
}

export interface LineupMetrics {
  score: number;
  optimalPercentage: number;
  cashPercentage: number;
  boomPercentage: number;
}

export interface Portfolio {
  lineups: Lineup[];
  exposures: Record<string, number>;
  uniqueness: number;
  totalEV: number;
  totalROI: number;
}

export interface Lineup {
  players: Player[];
  totalSalary: number;
  projectedScore: number;
  simEV: number;
  constraints: ConstraintStatus[];
  
  // AI-powered lineup metrics
  boomBustScore?: number;   // 1-10 scale (higher = more boom potential)
  bustRisk?: number;        // 1-10 scale (higher = more bust risk)
  expectedROI?: number;     // Expected ROI percentage
}

export interface ConstraintStatus {
  type: string;
  satisfied: boolean;
  description: string;
}

export interface BuildSettings {
  mode: 'CASH' | 'GPP';
  numberOfLineups: number;
  exposureCaps: Record<string, number>;
  stackRules: StackRule[];
  groupRules: GroupRule[];
  uniquenessThreshold: number;
}

export interface StackRule {
  type: string;
  required: number;
  positions: string[];
  bringBack?: boolean;
}

export interface GroupRule {
  condition: string;
  required: number;
  players: string[];
}

export interface OptimizationSettings {
  maxLineups: number;
  maxExposure: number;
  minSalary: number;
  maxSalary: number;
  sport: string;
}
