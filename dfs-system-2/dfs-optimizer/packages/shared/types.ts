// DFS Optimizer TypeScript Types
// Based on the comprehensive build pack specification

export type Site = 'DK' | 'FD';
export type Sport = 'NFL' | 'NBA' | 'MLB' | 'MMA' | 'CFB' | 'NASCAR' | 'NHL' | 'PGA';

export interface Game {
  gameId: string; site: Site; sport: Sport;
  home: string; away: string; startTime: string; total?: number; spread?: number; weather?: string;
}

export interface Player {
  playerId: string; // site player id
  name: string; team: string; opp?: string; pos: string[];
  site: Site; sport: Sport; slateId: string;
  salary: number; status?: 'ACTIVE'|'OUT'|'Q'|'D'|'GTD';
  projection: number; stdev?: number; ceiling?: number; floor?: number;
  ownership?: number; value?: number; boom?: number; leverage?: number; meta?: Record<string,any>;
}

export interface Slate { slateId: string; site: Site; sport: Sport; label: string; games: Game[]; players: Player[] }

export interface Contest {
  contestId: string; site: Site; name: string; entries: number; maxEntries: number; entryFee: number;
  payoutCurve: { place: number; pct: number }[]; // sum pct ~ 1.0
}

export interface StackRule {
  sport: Sport; teamMax?: number; gameMax?: number;
  templates?: string[]; // e.g., NFL: ['QB+2+bringback','3-1','2-1']
  disallowRbVsOppDst?: boolean;
}

export type GroupPredicate =
  | { ifIncludes: string[]; requireAtLeastOneOf: string[] }
  | { neverTogether: string[] }
  | { atMostOneOf: string[] };

export interface Ruleset {
  salaryCap: number; rosterSlots: string[]; flexRules?: Record<string,string[]>; maxFromTeam?: number;
  stack: StackRule; groups: GroupPredicate[];
  exposureCaps?: Record<string, number>; // playerId -> cap%
  minUniques?: number; ownershipFade?: number; randomness?: number;
}

export interface Lineup {
  lineupId: string; site: Site; sport: Sport; slateId: string; playerIds: string[]; salary: number;
  metrics?: { proj: number; roi?: number; winPct?: number; topPct?: number; boom?: number; bust?: number; optimalPct?: number; leverage?: number; dupRisk?: number; overall?: number };
  tags?: string[];
}

export interface Portfolio { lineups: Lineup[]; exposures?: Record<string, number>; notes?: string }

export interface Entry { entryId: string; contestId: string; site: Site; slateId: string; assignedLineupId?: string }

// Legacy types for compatibility
export type SportType = Sport;
export type SiteType = Site;
export type Position = string;
export type ContestType = 'gpp' | 'cash' | 'satellite' | 'qualifier';
export type OptimizationObjective = 'ev' | 'leverage' | 'ceiling' | 'sharpe' | 'cash';

// API Response Types
export interface OptimizationResponse {
  success: boolean;
  lineups: Lineup[];
  total_lineups: number;
  generation_time: number;
  player_pool: Player[];
  error?: string;
}

export interface SimulationResponse {
  success: boolean;
  simulation_results: SimulationResults[];
  summary: SimulationSummary;
  field_analysis: FieldAnalysis;
  error?: string;
}

export interface SimulationResults {
  iterations: number;
  mean_score: number;
  std_dev: number;
  percentiles: { [key: number]: number };
  win_rate: number;
  optimal_rate: number;
  roi: number;
  sharpe: number;
  max_drawdown: number;
}

export interface SimulationSummary {
  total_lineups: number;
  iterations_per_lineup: number;
  avg_roi: number;
  avg_win_rate: number;
  avg_sharpe: number;
  field_size: number;
  simulation_time: number;
}

export interface FieldAnalysis {
  ownership_efficiency: number;
  leverage_opportunities: LeverageOpportunity[];
  contrarian_plays: ContrarianPlay[];
  stack_popularity: { [stack_type: string]: number };
}

export interface LeverageOpportunity {
  player_id: string;
  player_name: string;
  projected_ownership: number;
  projection_rank: number;
  leverage_score: number;
  opportunity_type: 'underowned_stud' | 'value_play' | 'contrarian_chalk';
}

export interface ContrarianPlay {
  player_id: string;
  player_name: string;
  ownership_delta: number;
  projection_rank: number;
  contrarian_score: number;
}

// CSV Import/Export Types
export interface CSVImportResult {
  success: boolean;
  entries: EntryMap[];
  lineups: Lineup[];
  total_entries: number;
  validation_errors: string[];
}

export interface EntryMap {
  contest_id: string;
  entry_id: string;
  lineup_id?: string;
  contest_name: string;
  entry_fee: number;
  max_entries: number;
}

export interface CSVExportConfig {
  site: 'draftkings' | 'fanduel';
  format: 'contest_entry' | 'lineup_only';
  max_lineups_per_file: number;
  include_projections: boolean;
  include_ownership: boolean;
}

// Late Swap Types
export interface SwapOpportunity {
  original_player: Player;
  replacement_player: Player;
  salary_delta: number;
  projection_delta: number;
  ownership_delta: number;
  ev_delta: number;
  swap_confidence: number;
  reason: string;
}

export interface LateSwapConfig {
  locked_positions: string[];
  remaining_salary: number;
  time_remaining: number;
  news_cutoff: string;
  max_swaps_per_lineup: number;
  min_ev_improvement: number;
}

// Error Types
export interface DFSError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}
