import os
import pandas as pd
from datetime import datetime
from typing import Dict, Any
from ..base import JSONIngestor, DataNormalizer
from ...data.schemas import DataIngestionStatus, SportType

class TheOddsAPIIngestor(JSONIngestor):
    """Ingestor for The Odds API NFL betting lines"""
    
    def __init__(self, sport: SportType, source_name: str, config: Dict[str, Any]):
        super().__init__(sport, source_name, config)
        self.api_key = os.getenv('ODDS_API_KEY')
        
    def ingest(self) -> DataIngestionStatus:
        """Ingest NFL odds from The Odds API"""
        start_time = datetime.now()
        errors = []
        warnings = []
        total_records = 0
        
        if not self.api_key:
            return self._create_status(
                "error",
                errors=["ODDS_API_KEY not found in environment variables"]
            )
        
        try:
            # Get NFL odds
            params = {
                'apiKey': self.api_key,
                'regions': 'us',
                'markets': 'h2h,spreads,totals',
                'oddsFormat': 'american',
                'dateFormat': 'iso'
            }
            
            df = self._fetch_data(self.config['url'], params)
            
            if df.empty:
                return self._create_status(
                    "warning",
                    warnings=["No odds data returned from The Odds API"]
                )
            
            # Process odds data
            df = self._process_odds_data(df)
            total_records = len(df)
            
            # Save processed data
            self._save_processed_data(df, 'nfl_odds')
            
        except Exception as e:
            errors.append(f"The Odds API ingestion failed: {str(e)}")
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
    
    def _process_odds_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Process odds data from The Odds API"""
        processed_games = []
        
        for _, game in df.iterrows():
            try:
                game_data = {
                    'game_id': game.get('id', ''),
                    'sport_key': game.get('sport_key', ''),
                    'sport_title': game.get('sport_title', ''),
                    'commence_time': pd.to_datetime(game.get('commence_time', '')),
                    'home_team': self._normalize_team_name(game.get('home_team', '')),
                    'away_team': self._normalize_team_name(game.get('away_team', ''))
                }
                
                # Process bookmaker odds
                bookmakers = game.get('bookmakers', [])
                if bookmakers:
                    # Use first available bookmaker (could be enhanced to compare)
                    bookmaker = bookmakers[0]
                    markets = bookmaker.get('markets', [])
                    
                    for market in markets:
                        market_key = market.get('key', '')
                        outcomes = market.get('outcomes', [])
                        
                        if market_key == 'h2h':  # Moneyline
                            for outcome in outcomes:
                                team = self._normalize_team_name(outcome.get('name', ''))
                                price = outcome.get('price', 0)
                                if team == game_data['home_team']:
                                    game_data['home_ml'] = price
                                elif team == game_data['away_team']:
                                    game_data['away_ml'] = price
                        
                        elif market_key == 'spreads':  # Point spreads
                            for outcome in outcomes:
                                team = self._normalize_team_name(outcome.get('name', ''))
                                point = outcome.get('point', 0)
                                if team == game_data['home_team']:
                                    game_data['home_spread'] = point
                                elif team == game_data['away_team']:
                                    game_data['away_spread'] = point
                        
                        elif market_key == 'totals':  # Over/Under
                            for outcome in outcomes:
                                if outcome.get('name') == 'Over':
                                    game_data['total'] = outcome.get('point', 0)
                                    game_data['over_price'] = outcome.get('price', 0)
                                elif outcome.get('name') == 'Under':
                                    game_data['under_price'] = outcome.get('price', 0)
                
                # Calculate implied probabilities
                if 'home_ml' in game_data and 'away_ml' in game_data:
                    game_data['home_implied_prob'] = self._american_to_probability(game_data['home_ml'])
                    game_data['away_implied_prob'] = self._american_to_probability(game_data['away_ml'])
                
                processed_games.append(game_data)
                
            except Exception as e:
                print(f"Error processing game {game.get('id', 'unknown')}: {e}")
                continue
        
        return pd.DataFrame(processed_games)
    
    def _normalize_team_name(self, team_name: str) -> str:
        """Normalize team names to match our standard abbreviations"""
        # The Odds API uses full team names, convert to abbreviations
        team_map = {
            'Arizona Cardinals': 'ARI', 'Atlanta Falcons': 'ATL', 'Baltimore Ravens': 'BAL',
            'Buffalo Bills': 'BUF', 'Carolina Panthers': 'CAR', 'Chicago Bears': 'CHI',
            'Cincinnati Bengals': 'CIN', 'Cleveland Browns': 'CLE', 'Dallas Cowboys': 'DAL',
            'Denver Broncos': 'DEN', 'Detroit Lions': 'DET', 'Green Bay Packers': 'GB',
            'Houston Texans': 'HOU', 'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAC',
            'Kansas City Chiefs': 'KC', 'Las Vegas Raiders': 'LVR', 'Los Angeles Chargers': 'LAC',
            'Los Angeles Rams': 'LAR', 'Miami Dolphins': 'MIA', 'Minnesota Vikings': 'MIN',
            'New England Patriots': 'NE', 'New Orleans Saints': 'NO', 'New York Giants': 'NYG',
            'New York Jets': 'NYJ', 'Philadelphia Eagles': 'PHI', 'Pittsburgh Steelers': 'PIT',
            'San Francisco 49ers': 'SF', 'Seattle Seahawks': 'SEA', 'Tampa Bay Buccaneers': 'TB',
            'Tennessee Titans': 'TEN', 'Washington Commanders': 'WAS'
        }
        
        return team_map.get(team_name, team_name.upper()[:3])
    
    def _american_to_probability(self, american_odds: int) -> float:
        """Convert American odds to implied probability"""
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)
    
    def _save_processed_data(self, df: pd.DataFrame, filename: str):
        """Save processed data to cache"""
        cache_path = self.cache_dir / f"{filename}_{datetime.now().strftime('%Y%m%d')}.parquet"
        df.to_parquet(cache_path, compression='snappy')
        print(f"Saved {len(df)} odds records to {cache_path}")
