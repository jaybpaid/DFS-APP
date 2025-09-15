import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime

from ..data.schemas import (
    Player, Lineup, LineupPlayer, SportType, SiteType, 
    CSVExport, ExportConfig
)

class CSVImporter:
    """Import salary data and player information from DK/FD CSV files"""
    
    def __init__(self):
        # Common column mappings for different sites
        self.dk_columns = {
            'name': ['Name', 'Player Name', 'Full Name'],
            'position': ['Position', 'Roster Position', 'Pos'],
            'team': ['TeamAbbrev', 'Team', 'Team Abbrev'],
            'salary': ['Salary', 'Cost'],
            'opponent': ['OpponentAbbrev', 'Opponent', 'Opp'],
            'game_info': ['Game Info', 'GameInfo'],
            'avg_points': ['AvgPointsPerGame', 'Avg Points', 'FPPG']
        }
        
        self.fd_columns = {
            'name': ['Nickname', 'Name', 'Player Name', 'Full Name'],
            'position': ['Position', 'Pos'],
            'team': ['Team', 'Team Abbrev'],
            'salary': ['Salary', 'Cost'],
            'opponent': ['Opponent', 'Opp'],
            'game': ['Game', 'Game Info'],
            'fppg': ['FPPG', 'Avg Points']
        }
    
    def import_salary_file(self, file_path: str, auto_detect: bool = True) -> Tuple[List[Player], Dict[str, Any]]:
        """Import salary file and return players with metadata"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"Salary file not found: {file_path}")
        
        # Read CSV file
        df = pd.read_csv(file_path)
        
        if df.empty:
            raise ValueError("CSV file is empty")
        
        # Auto-detect site and sport
        if auto_detect:
            site, sport = self._detect_site_and_sport(df)
        else:
            site, sport = SiteType.DRAFTKINGS, SportType.NFL  # Default
        
        # Parse players
        players = self._parse_players(df, site, sport)
        
        # Extract metadata
        metadata = {
            'site': site,
            'sport': sport,
            'slate_name': self._extract_slate_name(file_path.name),
            'num_players': len(players),
            'import_time': datetime.now(),
            'salary_cap': self._get_salary_cap(site, sport),
            'roster_size': self._get_roster_size(site, sport)
        }
        
        return players, metadata
    
    def _detect_site_and_sport(self, df: pd.DataFrame) -> Tuple[SiteType, SportType]:
        """Auto-detect DFS site and sport from CSV structure"""
        columns = [col.lower() for col in df.columns]
        
        # Detect site
        site = SiteType.DRAFTKINGS  # Default
        if any('nickname' in col for col in columns):
            site = SiteType.FANDUEL
        elif any('teamabbrev' in col for col in columns):
            site = SiteType.DRAFTKINGS
        
        # Detect sport based on positions
        positions = set()
        for col in df.columns:
            if 'position' in col.lower() or 'pos' in col.lower():
                positions.update(df[col].dropna().unique())
                break
        
        sport = SportType.NFL  # Default
        if any(pos in ['PG', 'SG', 'SF', 'PF', 'C'] for pos in positions):
            sport = SportType.NBA
        elif any(pos in ['QB', 'RB', 'WR', 'TE', 'DST', 'D'] for pos in positions):
            sport = SportType.NFL
        
        return site, sport
    
    def _parse_players(self, df: pd.DataFrame, site: SiteType, sport: SportType) -> List[Player]:
        """Parse players from DataFrame"""
        players = []
        column_map = self.dk_columns if site == SiteType.DRAFTKINGS else self.fd_columns
        
        for idx, row in df.iterrows():
            try:
                # Extract player data using column mapping
                player_data = self._extract_player_data(row, column_map, site, sport)
                
                if player_data:
                    player = Player(**player_data)
                    players.append(player)
                    
            except Exception as e:
                print(f"Error parsing player at row {idx}: {e}")
                continue
        
        return players
    
    def _extract_player_data(self, row: pd.Series, column_map: Dict[str, List[str]], 
                           site: SiteType, sport: SportType) -> Optional[Dict[str, Any]]:
        """Extract player data from a row using column mapping"""
        player_data = {}
        
        # Helper function to find column value
        def find_column_value(possible_names: List[str], default=None):
            for name in possible_names:
                for col in row.index:
                    if name.lower() in col.lower():
                        value = row[col]
                        return value if pd.notna(value) else default
            return default
        
        # Extract basic fields
        name = find_column_value(column_map.get('name', ['Name']))
        if not name:
            return None  # Skip if no name
        
        position = find_column_value(column_map.get('position', ['Position']))
        team = find_column_value(column_map.get('team', ['Team']))
        salary = find_column_value(column_map.get('salary', ['Salary']))
        
        # Convert salary to int
        try:
            salary = int(float(str(salary).replace('$', '').replace(',', '')))
        except (ValueError, TypeError):
            salary = 5000  # Default salary
        
        # Generate player ID
        player_id = self._generate_player_id(name, team, position)
        
        player_data = {
            'id': player_id,
            'name': str(name).strip(),
            'position': str(position).strip().upper() if position else 'FLEX',
            'team': str(team).strip().upper() if team else 'UNK',
            'salary': salary
        }
        
        # Add site-specific salary
        if site == SiteType.DRAFTKINGS:
            player_data['dk_salary'] = salary
            player_data['dk_position'] = player_data['position']
        else:
            player_data['fd_salary'] = salary
            player_data['fd_position'] = player_data['position']
        
        # Extract opponent info
        opponent = find_column_value(column_map.get('opponent', ['Opponent']))
        if opponent:
            player_data['opponent'] = str(opponent).strip().upper()
        
        # Determine home/away
        game_info = find_column_value(column_map.get('game_info', ['Game Info']))
        if game_info and '@' in str(game_info):
            player_data['home_away'] = 'Away' if str(game_info).startswith(player_data['team']) else 'Home'
        
        return player_data
    
    def _generate_player_id(self, name: str, team: str, position: str) -> str:
        """Generate unique player ID"""
        name_clean = str(name).replace(' ', '').replace('.', '').replace("'", "").lower()
        team_clean = str(team).upper()[:3] if team else 'UNK'
        pos_clean = str(position).upper()[:2] if position else 'XX'
        
        return f"{name_clean}_{team_clean}_{pos_clean}"
    
    def _extract_slate_name(self, filename: str) -> str:
        """Extract slate name from filename"""
        # Remove file extension
        name = Path(filename).stem
        
        # Common patterns
        if 'main' in name.lower():
            return 'Main Slate'
        elif 'showdown' in name.lower():
            return 'Showdown'
        elif 'turbo' in name.lower():
            return 'Turbo'
        else:
            return name.replace('_', ' ').replace('-', ' ').title()
    
    def _get_salary_cap(self, site: SiteType, sport: SportType) -> int:
        """Get salary cap for site/sport combination"""
        if site == SiteType.DRAFTKINGS:
            return 50000
        else:  # FanDuel
            return 60000
    
    def _get_roster_size(self, site: SiteType, sport: SportType) -> int:
        """Get roster size for site/sport combination"""
        if sport == SportType.NBA:
            return 8 if site == SiteType.DRAFTKINGS else 9
        else:  # NFL
            return 9


class CSVExporter:
    """Export lineups to DK/FD upload format"""
    
    def __init__(self):
        pass
    
    def export_lineups(self, lineups: List[Lineup], config: ExportConfig, 
                      output_path: str) -> str:
        """Export lineups to CSV file"""
        if not lineups:
            raise ValueError("No lineups to export")
        
        # Create DataFrame based on site format
        if config.site == SiteType.DRAFTKINGS:
            df = self._create_dk_export(lineups, config)
        else:
            df = self._create_fd_export(lineups, config)
        
        # Save to CSV
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        df.to_csv(output_path, index=False)
        
        print(f"Exported {len(lineups)} lineups to {output_path}")
        return str(output_path)
    
    def _create_dk_export(self, lineups: List[Lineup], config: ExportConfig) -> pd.DataFrame:
        """Create DraftKings export format"""
        export_data = []
        
        # DraftKings column order
        if config.sport == SportType.NFL:
            columns = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST']
        else:  # NBA
            columns = ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL']
        
        for lineup in lineups:
            row_data = {}
            
            # Map players to positions
            position_mapping = self._map_players_to_positions(lineup.players, columns)
            
            for pos in columns:
                if pos in position_mapping:
                    player = position_mapping[pos]
                    row_data[pos] = self._format_player_name(player.player_id)
                else:
                    row_data[pos] = ''
            
            # Add optional columns
            if config.include_projections:
                row_data['Projected Points'] = round(lineup.total_projection, 2)
            
            if config.include_ownership:
                row_data['Total Ownership'] = round(lineup.total_ownership or 0, 1)
            
            if config.include_metrics:
                row_data['Salary Used'] = lineup.total_salary
                row_data['Salary Remaining'] = 50000 - lineup.total_salary
                if hasattr(lineup, 'sharpe'):
                    row_data['Sharpe Ratio'] = round(lineup.sharpe, 3)
            
            export_data.append(row_data)
        
        return pd.DataFrame(export_data)
    
    def _create_fd_export(self, lineups: List[Lineup], config: ExportConfig) -> pd.DataFrame:
        """Create FanDuel export format"""
        export_data = []
        
        # FanDuel column order
        if config.sport == SportType.NFL:
            columns = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'D']
        else:  # NBA
            columns = ['PG', 'PG', 'SG', 'SG', 'SF', 'SF', 'PF', 'PF', 'C']
        
        for lineup in lineups:
            row_data = {}
            
            # Map players to positions
            position_mapping = self._map_players_to_positions(lineup.players, columns)
            
            for pos in columns:
                if pos in position_mapping:
                    player = position_mapping[pos]
                    row_data[pos] = self._format_player_name(player.player_id)
                else:
                    row_data[pos] = ''
            
            # Add optional columns
            if config.include_projections:
                row_data['Projected Points'] = round(lineup.total_projection, 2)
            
            if config.include_ownership:
                row_data['Total Ownership'] = round(lineup.total_ownership or 0, 1)
            
            if config.include_metrics:
                row_data['Salary Used'] = lineup.total_salary
                row_data['Salary Remaining'] = 60000 - lineup.total_salary
            
            export_data.append(row_data)
        
        return pd.DataFrame(export_data)
    
    def _map_players_to_positions(self, players: List[LineupPlayer], 
                                 required_positions: List[str]) -> Dict[str, LineupPlayer]:
        """Map players to required positions for export"""
        position_mapping = {}
        available_players = players.copy()
        
        # First pass: exact position matches
        for pos in required_positions:
            if pos in position_mapping:
                continue  # Position already filled
                
            for player in available_players:
                if player.roster_position == pos:
                    position_mapping[pos] = player
                    available_players.remove(player)
                    break
        
        # Second pass: flexible position matching
        remaining_positions = [pos for pos in required_positions if pos not in position_mapping]
        
        for pos in remaining_positions:
            for player in available_players:
                if self._position_compatible(player.roster_position, pos):
                    position_mapping[pos] = player
                    available_players.remove(player)
                    break
        
        return position_mapping
    
    def _position_compatible(self, player_position: str, required_position: str) -> bool:
        """Check if player position is compatible with required position"""
        # NFL compatibility
        if required_position == 'FLEX':
            return player_position in ['RB', 'WR', 'TE']
        
        # NBA compatibility
        if required_position == 'G':
            return player_position in ['PG', 'SG']
        elif required_position == 'F':
            return player_position in ['SF', 'PF']
        elif required_position == 'UTIL':
            return True  # Any position
        
        return player_position == required_position
    
    def _format_player_name(self, player_id: str) -> str:
        """Format player name for export (placeholder - would lookup actual name)"""
        # This would typically lookup the actual player name from the ID
        # For now, return a cleaned version of the ID
        parts = player_id.split('_')
        if len(parts) >= 1:
            name_part = parts[0]
            # Convert back to proper name format
            return name_part.replace('', ' ').title()
        return player_id
