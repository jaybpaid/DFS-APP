"""
Fantasy Nerds API Ingestor - Free DFS data source
https://api.fantasynerds.com/docs/nfl

This ingestor provides access to:
- DFS salaries for DraftKings, FanDuel, Yahoo
- Player projections and "Bang for Your Buck" scores
- Defensive rankings by position
- Weekly injury reports
- Some endpoints free, others paid
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Optional, Any
import os
import sys
import requests
import json

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from ..base import BaseIngestor

class FantasyNerdsIngestor(BaseIngestor):
    """Ingestor for Fantasy Nerds API data"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.source_name = "fantasy_nerds"
        self.base_url = "https://api.fantasynerds.com/v1"
        self.api_key = os.getenv('FANTASY_NERDS_API_KEY')  # Optional - some endpoints work without it

    def fetch_data(self) -> Dict[str, pd.DataFrame]:
        """Implement abstract method - fetch all data"""
        return self.fetch_all_platforms()

    def fetch_dfs_salaries(self, platform: str = "draftkings", week: int = None) -> pd.DataFrame:
        """Fetch DFS salaries for specified platform"""
        if week is None:
            # Calculate current NFL week
            week = self._get_current_nfl_week()

        self.logger.info(f"Fetching {platform} salaries for week {week}")

        try:
            endpoint = f"{self.base_url}/nfl/{platform}/salaries"
            params = {'week': week}

            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            if 'data' in data:
                df = pd.DataFrame(data['data'])
                self.logger.info(f"Fetched {len(df)} {platform} salary records")
                return df
            else:
                self.logger.warning("No salary data found in response")
                return pd.DataFrame()

        except Exception as e:
            self.logger.error(f"Error fetching {platform} salaries: {e}")
            return pd.DataFrame()

    def fetch_player_projections(self, week: int = None) -> pd.DataFrame:
        """Fetch player projections"""
        if week is None:
            week = self._get_current_nfl_week()

        self.logger.info(f"Fetching player projections for week {week}")

        try:
            endpoint = f"{self.base_url}/nfl/projections"
            params = {'week': week}

            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            if 'data' in data:
                df = pd.DataFrame(data['data'])
                self.logger.info(f"Fetched {len(df)} player projection records")
                return df
            else:
                self.logger.warning("No projection data found in response")
                return pd.DataFrame()

        except Exception as e:
            self.logger.error(f"Error fetching player projections: {e}")
            return pd.DataFrame()

    def fetch_bang_for_buck(self, platform: str = "draftkings", week: int = None) -> pd.DataFrame:
        """Fetch Bang for Your Buck scores"""
        if week is None:
            week = self._get_current_nfl_week()

        self.logger.info(f"Fetching {platform} Bang for Your Buck for week {week}")

        try:
            endpoint = f"{self.base_url}/nfl/{platform}/bangforbuck"
            params = {'week': week}

            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            if 'data' in data:
                df = pd.DataFrame(data['data'])
                self.logger.info(f"Fetched {len(df)} Bang for Your Buck records")
                return df
            else:
                self.logger.warning("No Bang for Your Buck data found in response")
                return pd.DataFrame()

        except Exception as e:
            self.logger.error(f"Error fetching Bang for Your Buck: {e}")
            return pd.DataFrame()

    def fetch_defensive_rankings(self, week: int = None) -> pd.DataFrame:
        """Fetch defensive rankings by position"""
        if week is None:
            week = self._get_current_nfl_week()

        self.logger.info(f"Fetching defensive rankings for week {week}")

        try:
            endpoint = f"{self.base_url}/nfl/defense/rankings"
            params = {'week': week}

            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            if 'data' in data:
                df = pd.DataFrame(data['data'])
                self.logger.info(f"Fetched {len(df)} defensive ranking records")
                return df
            else:
                self.logger.warning("No defensive ranking data found in response")
                return pd.DataFrame()

        except Exception as e:
            self.logger.error(f"Error fetching defensive rankings: {e}")
            return pd.DataFrame()

    def fetch_injury_reports(self, week: int = None) -> pd.DataFrame:
        """Fetch weekly injury reports"""
        if week is None:
            week = self._get_current_nfl_week()

        self.logger.info(f"Fetching injury reports for week {week}")

        try:
            endpoint = f"{self.base_url}/nfl/injuries"
            params = {'week': week}

            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            if 'data' in data:
                df = pd.DataFrame(data['data'])
                self.logger.info(f"Fetched {len(df)} injury report records")
                return df
            else:
                self.logger.warning("No injury data found in response")
                return pd.DataFrame()

        except Exception as e:
            self.logger.error(f"Error fetching injury reports: {e}")
            return pd.DataFrame()

    def fetch_all_platforms(self, week: int = None) -> Dict[str, pd.DataFrame]:
        """Fetch data for all supported platforms"""
        if week is None:
            week = self._get_current_nfl_week()

        platforms = ['draftkings', 'fanduel', 'yahoo']
        data = {}

        for platform in platforms:
            data[f'{platform}_salaries'] = self.fetch_dfs_salaries(platform, week)
            data[f'{platform}_bangforbuck'] = self.fetch_bang_for_buck(platform, week)

        # Add common data
        data['projections'] = self.fetch_player_projections(week)
        data['defensive_rankings'] = self.fetch_defensive_rankings(week)
        data['injuries'] = self.fetch_injury_reports(week)

        return data

    def _get_current_nfl_week(self) -> int:
        """Calculate current NFL week based on date"""
        now = datetime.now()

        # NFL season typically starts in September
        # This is a simplified calculation - you might want to make it more sophisticated
        if now.month >= 9:  # September or later
            # Calculate week number from September 1st
            sept_1 = datetime(now.year, 9, 1)
            days_diff = (now - sept_1).days
            week = (days_diff // 7) + 1
            return min(week, 18)  # NFL regular season is 18 weeks
        else:
            return 1  # Pre-season or off-season

    def calculate_value_metrics(self, salaries_df: pd.DataFrame,
                               projections_df: pd.DataFrame) -> pd.DataFrame:
        """Calculate value metrics combining salaries and projections"""
        try:
            if salaries_df.empty or projections_df.empty:
                return pd.DataFrame()

            # Merge salary and projection data
            value_data = salaries_df.merge(
                projections_df,
                on='player_id',
                how='left',
                suffixes=('_salary', '_proj')
            )

            # Calculate value metrics
            if 'salary' in value_data.columns and 'projected_points' in value_data.columns:
                value_data['points_per_dollar'] = (
                    value_data['projected_points'] / value_data['salary']
                )

                # Calculate percentile ranks for value
                value_data['value_percentile'] = (
                    value_data['points_per_dollar'].rank(pct=True) * 100
                )

                # Calculate salary efficiency
                value_data['salary_efficiency'] = (
                    value_data['points_per_dollar'] /
                    value_data['points_per_dollar'].mean()
                )

            self.logger.info(f"Calculated value metrics for {len(value_data)} players")
            return value_data

        except Exception as e:
            self.logger.error(f"Error calculating value metrics: {e}")
            return pd.DataFrame()

    def get_data_quality_report(self, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Generate data quality report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'source': self.source_name,
            'api_status': 'operational',
            'data_types': {},
            'quality_metrics': {}
        }

        for data_type, df in data.items():
            if isinstance(df, pd.DataFrame):
                report['data_types'][data_type] = {
                    'record_count': len(df),
                    'column_count': len(df.columns),
                    'columns': list(df.columns),
                    'null_percentage': (df.isnull().sum() / len(df) * 100).mean()
                }

        return report
