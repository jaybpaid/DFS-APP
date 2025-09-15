import json
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime

from ..data.schemas import Player, SportType, SiteType

class JSONImporter:
    """Import player data from JSON files with projections and ownership"""
    
    def __init__(self):
        self.supported_formats = ['dk_nfl', 'dk_nba', 'fd_nfl', 'fd_nba']
    
    def import_json_file(self, file_path: str) -> Tuple[List[Player], Dict[str, Any]]:
        """Import JSON file and return players with metadata"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"JSON file not found: {file_path}")
        
        # Read JSON file
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        if not data or 'players' not in data:
            raise ValueError("Invalid JSON format or no players found")
        
        # Extract metadata
        metadata = self._extract_metadata(data)
        
        # Parse players
        players = self._parse_players(data['players'], metadata['site'], metadata['sport'])
        
        # Update metadata
        metadata.update({
            'num_players': len(players),
            'import_time': datetime.now(),
            'salary_cap': self._get_salary_cap(metadata['site'], metadata['sport']),
            'roster_size': self._get_roster_size(metadata['site'], metadata['sport'])
        })
        
        return players, metadata
    
    def _extract_metadata(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract metadata from JSON data"""
        metadata = {
            'site': SiteType.DRAFTKINGS,  # Default
            'sport': SportType.NFL,      # Default
            'slate_name': 'Main Slate',   # Default
            'timestamp': data.get('timestamp', datetime.now().isoformat())
        }
        
        # Detect site and sport from data
        if 'site' in data:
            site_str = data['site'].upper()
            if site_str == 'DRAFTKINGS':
                metadata['site'] = SiteType.DRAFTKINGS
            elif site_str == 'FANDUEL':
                metadata['site'] = SiteType.FANDUEL
        
        if 'sport' in data:
            sport_str = data['sport'].upper()
            if sport_str == 'NFL':
                metadata['sport'] = SportType.NFL
            elif sport_str == 'NBA':
                metadata['sport'] = SportType.NBA
        
        # Extract slate info
        if 'slate' in data:
            slate = data['slate']
            metadata['slate_name'] = slate.get('name', 'Main Slate')
            metadata['slate_id'] = slate.get('id')
            metadata['start_time'] = slate.get('startTime')
            metadata['game_count'] = slate.get('gameCount')
        
        return metadata
    
    def _parse_players(self, players_data: List[Dict], site: SiteType, sport: SportType) -> List[Player]:
        """Parse players from JSON data"""
        players = []
        
        for player_data in players_data:
            try:
                player = self._parse_player(player_data, site, sport)
                if player:
                    players.append(player)
            except Exception as e:
                print(f"Error parsing player {player_data.get('displayName', 'Unknown')}: {e}")
                continue
        
        return players
    
    def _parse_player(self, player_data: Dict[str, Any], site: SiteType, sport: SportType) -> Optional[Player]:
        """Parse individual player from JSON data"""
        # Extract basic fields
        name = player_data.get('displayName')
        if not name:
            return None
        
        position = player_data.get('rosterSlotId', player_data.get('position', ''))
        team = player_data.get('teamAbbreviation', player_data.get('team', ''))
        salary = player_data.get('salary', 5000)
        
        # Generate player ID
        player_id = self._generate_player_id(name, team, position)
        
        # Create player data
        player_dict = {
            'id': player_id,
            'name': str(name).strip(),
            'position': str(position).strip().upper(),
            'team': str(team).strip().upper(),
            'salary': int(salary),
            'projection': float(player_data.get('projection', 0)),
            'ownership': float(player_data.get('ownership', 0)),
            'boom_pct': float(player_data.get('boom_pct', 0))
        }
        
        # Add additional metrics if available
        if 'leverage_score' in player_data:
            player_dict['leverage_score'] = float(player_data['leverage_score'])
        if 'value' in player_data:
            player_dict['value'] = float(player_data['value'])
        if 'floor' in player_data:
            player_dict['floor'] = float(player_data['floor'])
        if 'ceiling' in player_data:
            player_dict['ceiling'] = float(player_data['ceiling'])
        
        # Add site-specific data
        if site == SiteType.DRAFTKINGS:
            player_dict['dk_salary'] = salary
            player_dict['dk_position'] = position
        else:
            player_dict['fd_salary'] = salary
            player_dict['fd_position'] = position
        
        # Create Player object
        return Player(**player_dict)
    
    def _generate_player_id(self, name: str, team: str, position: str) -> str:
        """Generate unique player ID"""
        name_clean = str(name).replace(' ', '').replace('.', '').replace("'", "").lower()
        team_clean = str(team).upper()[:3] if team else 'UNK'
        pos_clean = str(position).upper()[:2] if position else 'XX'
        
        return f"{name_clean}_{team_clean}_{pos_clean}"
    
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
    
    def load_prefetched_data(self, sport: str = "NFL", site: str = "DraftKings") -> Tuple[List[Player], Dict[str, Any]]:
        """Load pre-fetched data from public/data directory"""
        data_dir = Path("public/data")
        
        # Determine filename based on sport and site
        filename = f"{site.lower()}_{sport.lower()}_latest.json"
        file_path = data_dir / filename
        
        if not file_path.exists():
            # Try alternative naming
            filename = f"{site.lower()[:2]}_{sport.lower()}_latest.json"
            file_path = data_dir / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"No pre-fetched data found for {site} {sport}")
        
        return self.import_json_file(str(file_path))
