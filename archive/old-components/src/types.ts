export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  salary: number;
  projectedPoints: number;
  ownership: number;
}

export interface DraftKingsPlayer {
  player_id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  position: string;
  positions: string[];
  salary: number;
  team_abbreviation: string;
  status: string;
  game_start: string;
  opponent: string;
  is_captain_eligible: boolean;
}
