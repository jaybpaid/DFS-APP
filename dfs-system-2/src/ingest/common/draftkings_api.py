import requests
import pandas as pd
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from ..base import JSONIngestor, DataNormalizer
from ...data.schemas import DataIngestionStatus, SportType, Player

class DraftKingsAPIIngestor(JSONIngestor):
    """Ingestor for DraftKings Draftables API - automatically pulls salary data"""
    
    def __init__(self, sport: SportType, source_name: str, config: Dict[str, Any]):
        super().__init__(sport, source_name, config)
        self.sport = sport
        self.base_url = "https://api.draftkings.com"
        
    def ingest(self) -> DataIngestionStatus:
        """Ingest DraftKings salary and contest data"""
        start_time = datetime.now()
        errors = []
        warnings = []
        total_records = 0
        
        try:
            # Step 1: Get available contests to find draftGroupIds
            sport_param = self.sport.value
            contests_url = f"https://www.draftkings.com/lobby/getcontests?sport={sport_param}"
            
            print(f"Fetching DK contests for {sport_param}...")
            contests_df = self._fetch_data(contests_url)
            
            if contests_df.empty:
                return self._create_status(
                    "warning",
                    warnings=[f"No contests found for {sport_param}"]
                )
            
            # Step 2: Extract draftGroupIds from contests
            draft_group_ids = self._extract_draft_group_ids(contests_df)
            
            if not draft_group_ids:
                return self._create_status(
                    "warning", 
                    warnings=["No draft group IDs found in contests"]
                )
            
            print(f"Found {len(draft_group_ids)} draft groups")
            
            # Step 3: Get draftables (players with salaries) for each group
            all_players = []
            
            for group_id in draft_group_ids[:5]:  # Limit to first 5 groups to avoid rate limits
                try:
                    draftables_url = f"{self.base_url}/draftgroups/v1/draftgroups/{group_id}/draftables"
                    draftables_df = self._fetch_data(draftables_url)
                    
                    if not draftables_df.empty:
                        players = self._process_draftables(draftables_df, group_id)
                        all_players.extend(players)
                        print(f"  Group {group_id}: {len(players)} players")
                    
                except Exception as e:
                    warnings.append(f"Failed to get draftables for group {group_id}: {str(e)}")
                    continue
            
            if all_players:
                # Convert to DataFrame and save
                players_df = pd.DataFrame([player.dict() for player in all_players])
                total_records = len(players_df)
                
                # Save processed data
                self._save_processed_data(players_df, f'dk_{self.sport.value.lower()}_salaries')
                
                print(f"Successfully ingested {total_records} DK players")
            else:
                return self._create_status(
                    "warning",
                    warnings=["No player data found"]
                )
            
        except Exception as e:
            errors.append(f"DraftKings API ingestion failed: {str(e)}")
            return self._create_status(
                "error",
                errors=errors,
                execution_time=(datetime.now() - start_time).total_seconds()
            )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return self._create_status(
            "success",
            records=total_records,
            warnings=warnings,
            execution_time=execution_time
        )
    
    def _extract_draft_group_ids(self, contests_df: pd.DataFrame) -> List[str]:
        """Extract draft group IDs from contests data"""
        draft_group_ids = []
        
        try:
            # Handle different possible JSON structures
            for _, contest in contests_df.iterrows():
                # Look for draftGroupId in various possible locations
                if 'draftGroupId' in contest:
                    draft_group_ids.append(str(contest['draftGroupId']))
                elif 'DraftGroupId' in contest:
                    draft_group_ids.append(str(contest['DraftGroupId']))
                elif isinstance(contest.get('draftGroup'), dict):
                    if 'draftGroupId' in contest['draftGroup']:
                        draft_group_ids.append(str(contest['draftGroup']['draftGroupId']))
            
            # Remove duplicates and return
            return list(set(draft_group_ids))
            
        except Exception as e:
            print(f"Error extracting draft group IDs: {e}")
            return []
    
    def _process_draftables(self, draftables_df: pd.DataFrame, group_id: str) -> List[Player]:
        """Process draftables data into Player objects"""
        players = []
        
        try:
            for _, draftable in draftables_df.iterrows():
                # Extract player info from draftable
                player_info = draftable.get('displayName', '')
                salary = draftable.get('salary', 0)
                position = draftable.get('rosterSlotId', '')
                
                # Try to extract team info
                team = ''
                if 'teamAbbreviation' in draftable:
                    team = draftable['teamAbbreviation']
                elif 'competition' in draftable and isinstance(draftable['competition'], dict):
                    # Extract team from competition info
                    comp = draftable['competition']
                    if 'name' in comp:
                        # Parse team from competition name (e.g., "LAL@GSW")
                        name_parts = comp['name'].replace('@', ' ').split()
                        if len(name_parts) >= 2:
                            team = name_parts[0]  # Take first team
                
                # Generate player ID
                player_id = self._generate_player_id(player_info, team, position)
                
                # Create Player object
                player = Player(
                    id=player_id,
                    name=player_info,
                    position=self._normalize_position(position),
                    team=team.upper() if team else 'UNK',
                    salary=int(salary) if salary else 5000,
                    dk_salary=int(salary) if salary else 5000,
                    dk_position=position,
                    game_id=group_id
                )
                
                players.append(player)
                
        except Exception as e:
            print(f"Error processing draftables: {e}")
        
        return players
    
    def _normalize_position(self, position: str) -> str:
        """Normalize DraftKings position codes"""
        position = str(position).upper().strip()
        
        if self.sport == SportType.NBA:
            # NBA position mapping
            position_map = {
                'PG': 'PG', 'SG': 'SG', 'SF': 'SF', 'PF': 'PF', 'C': 'C',
                'G': 'PG', 'F': 'SF', 'UTIL': 'SF'  # Default mappings
            }
        else:  # NFL
            position_map = {
                'QB': 'QB', 'RB': 'RB', 'WR': 'WR', 'TE': 'TE', 
                'DST': 'DST', 'K': 'K', 'FLEX': 'FLEX'
            }
        
        return position_map.get(position, position)
    
    def _generate_player_id(self, name: str, team: str, position: str) -> str:
        """Generate unique player ID"""
        name_clean = str(name).replace(' ', '').replace('.', '').replace("'", "").lower()
        team_clean = str(team).upper()[:3] if team else 'UNK'
        pos_clean = str(position).upper()[:2] if position else 'XX'
        
        return f"dk_{name_clean}_{team_clean}_{pos_clean}"
    
    def _save_processed_data(self, df: pd.DataFrame, filename: str):
        """Save processed data to cache"""
        cache_path = self.cache_dir / f"{filename}_{datetime.now().strftime('%Y%m%d_%H%M')}.parquet"
        df.to_parquet(cache_path, compression='snappy')
        print(f"Saved {len(df)} DK players to {cache_path}")

class DraftKingsContestIngestor(JSONIngestor):
    """Separate ingestor for DraftKings contest information"""
    
    def ingest(self) -> DataIngestionStatus:
        """Ingest DraftKings contest information"""
        start_time = datetime.now()
        
        try:
            sport_param = self.sport.value
            url = f"https://www.draftkings.com/lobby/getcontests?sport={sport_param}"
            
            df = self._fetch_data(url)
            
            if df.empty:
                return self._create_status(
                    "warning",
                    warnings=[f"No contests found for {sport_param}"]
                )
            
            # Process and save contest data
            contests = self._process_contests(df)
            
            # Save processed data
            self._save_processed_data(contests, f'dk_{sport_param.lower()}_contests')
            
            return self._create_status(
                "success",
                records=len(contests),
                execution_time=(datetime.now() - start_time).total_seconds()
            )
            
        except Exception as e:
            return self._create_status(
                "error",
                errors=[f"Contest ingestion failed: {str(e)}"],
                execution_time=(datetime.now() - start_time).total_seconds()
            )
    
    def _process_contests(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process contest data"""
        processed = []
        
        for _, contest in df.iterrows():
            processed_contest = {
                'contest_id': contest.get('contestId', ''),
                'name': contest.get('name', ''),
                'entry_fee': contest.get('entryFee', 0),
                'total_payouts': contest.get('totalPayouts', 0),
                'contest_type': contest.get('contestType', ''),
                'draft_group_id': contest.get('draftGroupId', ''),
                'start_time': contest.get('startTime', ''),
                'entries': contest.get('entries', 0),
                'max_entries': contest.get('maxEntries', 0)
            }
            processed.append(processed_contest)
        
        return pd.DataFrame(processed)
    
    def _save_processed_data(self, df: pd.DataFrame, filename: str):
        """Save processed contest data"""
        cache_path = self.cache_dir / f"{filename}_{datetime.now().strftime('%Y%m%d_%H%M')}.parquet"
        df.to_parquet(cache_path, compression='snappy')
        print(f"Saved {len(df)} contests to {cache_path}")
