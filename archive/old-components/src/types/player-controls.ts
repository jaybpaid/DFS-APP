export interface PlayerControls {
  // Core Controls (1-4)
  locked: boolean;
  banned: boolean;
  minExposure: number; // 0-100
  maxExposure: number; // 0-100

  // Projection Controls (5-7)
  customProjection?: number;
  projectionBoost: number; // +/- %
  ownershipOverride?: number;

  // Advanced Controls (8-12)
  ownershipFadeBoost: boolean;
  randomnessDeviation: number; // variance per player
  ceilingFloorToggle: 'ceiling' | 'floor' | 'projection';
  multiPosEligibility: string[];
  salaryOverride?: number;

  // Group & Stack Controls (13-14)
  groupMemberships: string[];
  stackRole: 'qb_stack' | 'bring_back' | 'punt' | 'contrarian' | 'none';

  // Status & Signals (15-18)
  injuryTag: 'ACTIVE' | 'Q' | 'D' | 'O' | 'NIR';
  newsSignalBadge?: string;
  boomPercentage?: number;
  bustPercentage?: number;

  // Analytics (19-22)
  leverageScore?: number;
  matchupScore?: number;
  depthChartRole: 'starter' | 'backup' | 'rotation' | 'injury_fill';
  hypeScore?: number;

  // Advanced Features (23-26)
  lateSwapEligible: boolean;
  priorityTag: 'core' | 'contrarian' | 'gpp_only' | 'cash_only' | 'none';
  advancedNotes: string;
  duplicationRisk?: number;
}

export interface EnhancedPlayer {
  // Base player data
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPoints: number;
  ownership: number;

  // Enhanced controls
  controls: PlayerControls;

  // MCP-driven signals
  mcpSignals?: {
    leverage: number;
    boom: number;
    bust: number;
    matchup: number;
    hype: number;
    injury: string;
    news: string;
    weather: number;
    vegas: number;
    asOf: string;
    provenance: string[];
  };
}

export interface PlayerGroup {
  id: string;
  name: string;
  playerIds: string[];
  minFromGroup: number;
  maxFromGroup: number;
  enabled: boolean;
}

export interface StackConfiguration {
  id: string;
  type: 'QB+2' | 'QB+3' | 'RB+DST' | 'custom';
  team: string;
  positions: string[];
  bringBack: number;
  minFromStack: number;
  maxFromStack: number;
  enabled: boolean;
}
