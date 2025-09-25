// Shared schema types for the DFS application

export interface PlayerWithProjection {
  player_id: string;
  id: string;
  display_name: string;
  name: string;
  first_name: string;
  last_name: string;
  position: string;
  positions: string[];
  salary: number;
  team_abbreviation: string;
  team: string;
  status: string;
  game_start: string;
  opponent: string;
  is_captain_eligible: boolean;
  projection?: number;
  ownership?: number;
  value?: number;
  floor?: number;
  ceiling?: number;
  tier?: string;
  customProjection?: number;
  salaryOverride?: number;
  ownershipFade?: number;
  boomBustVariance?: number;
  stackRole?: string;
  leverage?: number;
  lastNewsUpdate?: string;
  minExposure?: number;
}

export interface DashboardStats {
  totalPlayers: number;
  activePlayers: number;
  questionablePlayers: number;
  outPlayers: number;
  averageSalary: number;
  averageProjection: number;
  topProjectedPlayer: PlayerWithProjection;
  topValuePlayer: PlayerWithProjection;
  playerCount: number;
  lineupCount: number;
  simulationCount: number;
  lastUpdate: string;
  dataSources: DataSource[];
}

export interface DataSource {
  id: string;
  name: string;
  type: 'live' | 'cached' | 'mock';
  last_updated: string;
  status: 'healthy' | 'stale' | 'error';
  playerCount: number;
  sport: string;
  category: string;
  isEnabled: boolean;
  lastUpdate: string;
}

export interface OptimizationSettings {
  site: string;
  sport: string;
  slate_id: string;
  max_salary: number;
  min_salary: number;
  lineupCount: number;
  exposure_limit: number;
  stack_size: number;
  allow_duplicates: boolean;
  use_correlations: boolean;
  use_stacking: boolean;
  use_ownership: boolean;
  use_late_swap: boolean;
  objective: string;
  simulationRuns: number;
  stackingEnabled: boolean;
  stackRules: {
    qbPassCatchers: number;
    bringBack: number;
    rbDst: number;
  };
  teamCorrelation: number;
  maxExposure: number;
  minExposure: number;
  maxPerTeam: number;
  salaryFloor: number;
  lockedPlayers: any[];
  bannedPlayers: any[];
}

export interface LineupWithPlayers {
  lineup_id: string;
  id: string;
  totalSalary: number;
  totalProjection: number;
  expectedValue: number;
  totalOwnership: number;
  riskLevel: string;
  players: PlayerWithProjection[];
  playerDetails: any;
  created_at: string;
  updated_at: string;
}

export interface LateSwapStatus {
  enabled: boolean;
  last_update: string;
  available_swaps: number;
  processed_swaps: number;
  lineupsAffected: number;
}

export interface BreakingNews {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  affected_players: string[];
  timestamp: string;
  source: string;
  type: string;
  player: string;
  message: string;
}

export interface SlateInfo {
  slate_id: string;
  name: string;
  sport: string;
  site: string;
  start_time: string;
  status: 'upcoming' | 'live' | 'final';
  game_count: number;
  player_count: number;
  salary_cap: number;
  roster_positions: string[];
}

export interface ContestInfo {
  contest_id: string;
  name: string;
  entry_fee: number;
  total_prize_pool: number;
  max_entries: number;
  current_entries: number;
  start_time: string;
  status: 'open' | 'filling' | 'full' | 'cancelled';
}
