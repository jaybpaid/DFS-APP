import pandas as pd
from datetime import datetime
from typing import Dict, Any
from ..base import ParquetIngestor, DataNormalizer
from ...data.schemas import DataIngestionStatus, SportType

class NFLFastRIngestor(ParquetIngestor):
    """Ingestor for nflfastR play-by-play data"""
    
    def __init__(self, sport: SportType, source_name: str, config: Dict[str, Any]):
        super().__init__(sport, source_name, config)
        self.current_year = datetime.now().year
        
    def ingest(self) -> DataIngestionStatus:
        """Ingest nflfastR play-by-play data"""
        start_time = datetime.now()
        errors = []
        warnings = []
        total_records = 0
        
        try:
            # Get current season play-by-play data
            url = self.config['url'].format(year=self.current_year)
            
            df = self._fetch_data(url)
            
            if df.empty:
                return self._create_status(
                    "warning", 
                    warnings=["No data returned from nflfastR API"]
                )
            
            # Basic data processing and normalization
            df = self._process_nflfastr_data(df)
            total_records = len(df)
            
            # Save processed data
            self._save_processed_data(df, 'nflfastr_plays')
            
        except Exception as e:
            errors.append(f"NFLFastR ingestion failed: {str(e)}")
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
    
    def _process_nflfastr_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process and clean nflfastR data"""
        # Select relevant columns for DFS analysis
        relevant_cols = [
            'game_id', 'week', 'season', 'game_date', 'home_team', 'away_team',
            'posteam', 'defteam', 'play_type', 'yards_gained', 'touchdown',
            'passer_player_name', 'passer_player_id', 'passing_yards',
            'receiver_player_name', 'receiver_player_id', 'receiving_yards',
            'rusher_player_name', 'rusher_player_id', 'rushing_yards',
            'fantasy_player_name', 'fantasy_player_id', 'fantasy_points',
            'red_zone', 'goal_to_go', 'down', 'ydstogo', 'yardline_100',
            'qb_dropback', 'rush_attempt', 'pass_attempt', 'complete_pass',
            'interception', 'fumble', 'safety', 'penalty'
        ]
        
        # Filter to available columns
        available_cols = [col for col in relevant_cols if col in df.columns]
        df = df[available_cols].copy()
        
        # Filter out non-regular plays
        df = df[
            df['play_type'].isin([
                'pass', 'run', 'punt', 'field_goal', 'extra_point', 'kickoff'
            ])
        ].copy()
        
        # Normalize team names
        for team_col in ['home_team', 'away_team', 'posteam', 'defteam']:
            if team_col in df.columns:
                df = DataNormalizer.normalize_team_names(df, team_col)
        
        # Normalize player names
        for name_col in ['passer_player_name', 'receiver_player_name', 'rusher_player_name', 'fantasy_player_name']:
            if name_col in df.columns:
                df = DataNormalizer.normalize_player_names(df, name_col)
        
        # Convert game_date to datetime
        if 'game_date' in df.columns:
            df['game_date'] = pd.to_datetime(df['game_date'])
        
        # Fill NaN values
        numeric_cols = df.select_dtypes(include=['number']).columns
        df[numeric_cols] = df[numeric_cols].fillna(0)
        
        string_cols = df.select_dtypes(include=['object']).columns
        df[string_cols] = df[string_cols].fillna('')
        
        return df
    
    def _save_processed_data(self, df: pd.DataFrame, filename: str):
        """Save processed data to cache"""
        cache_path = self.cache_dir / f"{filename}_{self.current_year}.parquet"
        df.to_parquet(cache_path, compression='snappy')
        print(f"Saved {len(df)} records to {cache_path}")

class NFLScheduleIngestor(ParquetIngestor):
    """Ingestor for nflfastR schedule data"""
    
    def ingest(self) -> DataIngestionStatus:
        """Ingest NFL schedule data"""
        start_time = datetime.now()
        errors = []
        total_records = 0
        
        try:
            url = self.config['url']
            df = self._fetch_data(url)
            
            if df.empty:
                return self._create_status(
                    "warning",
                    warnings=["No schedule data returned"]
                )
            
            # Process schedule data
            df = self._process_schedule_data(df)
            total_records = len(df)
            
            # Save processed data
            self._save_processed_data(df, 'nfl_schedule')
            
        except Exception as e:
            errors.append(f"NFL Schedule ingestion failed: {str(e)}")
            return self._create_status(
                "error",
                errors=errors,
                execution_time=(datetime.now() - start_time).total_seconds()
            )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return self._create_status(
            "success",
            records=total_records,
            execution_time=execution_time
        )
    
    def _process_schedule_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process NFL schedule data"""
        # Select relevant columns
        relevant_cols = [
            'game_id', 'season', 'week', 'gameday', 'weekday',
            'gametime', 'home_team', 'away_team', 'location',
            'result', 'total', 'overtime', 'home_score', 'away_score',
            'div_game', 'roof', 'surface', 'temp', 'wind'
        ]
        
        available_cols = [col for col in relevant_cols if col in df.columns]
        df = df[available_cols].copy()
        
        # Normalize team names
        df = DataNormalizer.normalize_team_names(df, 'home_team')
        df = DataNormalizer.normalize_team_names(df, 'away_team')
        
        # Convert date/time fields
        if 'gameday' in df.columns:
            df['gameday'] = pd.to_datetime(df['gameday'])
        
        # Filter to current/future games only
        current_date = datetime.now().date()
        if 'gameday' in df.columns:
            df = df[df['gameday'].dt.date >= current_date].copy()
        
        return df

class NFLTeamStatsIngestor(ParquetIngestor):
    """Ingestor for nflfastR team statistics"""
    
    def ingest(self) -> DataIngestionStatus:
        """Ingest NFL team statistics"""
        start_time = datetime.now()
        errors = []
        total_records = 0
        
        try:
            current_year = datetime.now().year
            url = self.config['url'].format(year=current_year)
            df = self._fetch_data(url)
            
            if df.empty:
                return self._create_status(
                    "warning",
                    warnings=["No team stats data returned"]
                )
            
            # Process team stats
            df = self._process_team_stats(df)
            total_records = len(df)
            
            # Save processed data
            self._save_processed_data(df, 'nfl_team_stats')
            
        except Exception as e:
            errors.append(f"NFL Team Stats ingestion failed: {str(e)}")
            return self._create_status(
                "error",
                errors=errors,
                execution_time=(datetime.now() - start_time).total_seconds()
            )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return self._create_status(
            "success",
            records=total_records,
            execution_time=execution_time
        )
    
    def _process_team_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process team statistics data"""
        # Select relevant columns for DFS analysis
        relevant_cols = [
            'team', 'season', 'games',
            'offense_plays', 'offense_yards', 'offense_pass_yards', 'offense_rush_yards',
            'offense_touchdowns', 'offense_turnovers', 'offense_fumbles_lost',
            'offense_interceptions', 'offense_penalties', 'offense_penalty_yards',
            'defense_plays', 'defense_yards', 'defense_pass_yards', 'defense_rush_yards',
            'defense_touchdowns', 'defense_turnovers', 'defense_fumbles_recovered',
            'defense_interceptions', 'defense_sacks', 'defense_penalties',
            'special_teams_tds'
        ]
        
        available_cols = [col for col in relevant_cols if col in df.columns]
        df = df[available_cols].copy()
        
        # Normalize team names
        df = DataNormalizer.normalize_team_names(df, 'team')
        
        # Calculate per-game statistics
        if 'games' in df.columns and df['games'].sum() > 0:
            numeric_cols = df.select_dtypes(include=['number']).columns
            for col in numeric_cols:
                if col != 'games' and col != 'season':
                    df[f"{col}_per_game"] = df[col] / df['games']
        
        return df
