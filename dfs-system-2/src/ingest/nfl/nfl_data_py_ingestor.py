"""
NFL Data Py Ingestor - Free comprehensive NFL data source
https://pypi.org/project/nfl-data-py/

This ingestor provides access to:
- Play-by-play data from nflfastR
- Weekly stats, seasonal data, rosters, schedules
- Advanced metrics like EPA, WPA, air yards, YAC
- Completely FREE and actively maintained
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Optional, Any
import os
import sys

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

try:
    import nfl_data_py as nfl
    NFL_DATA_PY_AVAILABLE = True
except ImportError:
    NFL_DATA_PY_AVAILABLE = False
    logging.warning("nfl-data-py not installed. Install with: pip install nfl-data-py")

from ..base import BaseIngestor

class NFLDataPyIngestor(BaseIngestor):
    """Ingestor for nfl-data-py library data"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.source_name = "nfl_data_py"

        if not NFL_DATA_PY_AVAILABLE:
            raise ImportError("nfl-data-py is required. Install with: pip install nfl-data-py")

    def fetch_data(self) -> Dict[str, pd.DataFrame]:
        """Implement abstract method - fetch all data"""
        return self.fetch_all_data()

    def fetch_player_stats(self, year: int = None) -> pd.DataFrame:
        """Fetch comprehensive player statistics"""
        if year is None:
            year = datetime.now().year

        self.logger.info(f"Fetching NFL player stats for {year}")

        try:
            # Get weekly stats
            weekly_stats = nfl.import_weekly_data([year])
            self.logger.info(f"Fetched {len(weekly_stats)} weekly stat records")

            # Get seasonal stats
            seasonal_stats = nfl.import_seasonal_data([year])
            self.logger.info(f"Fetched {len(seasonal_stats)} seasonal stat records")

            # Get PFR stats (advanced metrics)
            pfr_stats = nfl.import_pfr_passing([year])
            self.logger.info(f"Fetched {len(pfr_stats)} PFR passing records")

            # Merge data sources
            combined_stats = self._merge_player_data(weekly_stats, seasonal_stats, pfr_stats)

            return combined_stats

        except Exception as e:
            self.logger.error(f"Error fetching player stats: {e}")
            return pd.DataFrame()

    def fetch_rosters(self, year: int = None) -> pd.DataFrame:
        """Fetch team rosters"""
        if year is None:
            year = datetime.now().year

        self.logger.info(f"Fetching NFL rosters for {year}")

        try:
            rosters = nfl.import_rosters([year])
            self.logger.info(f"Fetched {len(rosters)} roster records")
            return rosters
        except Exception as e:
            self.logger.error(f"Error fetching rosters: {e}")
            return pd.DataFrame()

    def fetch_schedules(self, year: int = None) -> pd.DataFrame:
        """Fetch game schedules"""
        if year is None:
            year = datetime.now().year

        self.logger.info(f"Fetching NFL schedules for {year}")

        try:
            schedules = nfl.import_schedules([year])
            self.logger.info(f"Fetched {len(schedules)} schedule records")
            return schedules
        except Exception as e:
            self.logger.error(f"Error fetching schedules: {e}")
            return pd.DataFrame()

    def fetch_play_by_play(self, year: int = None) -> pd.DataFrame:
        """Fetch play-by-play data with advanced metrics"""
        if year is None:
            year = datetime.now().year

        self.logger.info(f"Fetching NFL play-by-play data for {year}")

        try:
            pbp_data = nfl.import_pbp_data([year])
            self.logger.info(f"Fetched {len(pbp_data)} play-by-play records")

            # Calculate advanced metrics
            pbp_enhanced = self._calculate_advanced_metrics(pbp_data)

            return pbp_enhanced

        except Exception as e:
            self.logger.error(f"Error fetching play-by-play data: {e}")
            return pd.DataFrame()

    def fetch_injuries(self, year: int = None) -> pd.DataFrame:
        """Fetch injury reports"""
        if year is None:
            year = datetime.now().year

        self.logger.info(f"Fetching NFL injury data for {year}")

        try:
            injuries = nfl.import_injuries([year])
            self.logger.info(f"Fetched {len(injuries)} injury records")
            return injuries
        except Exception as e:
            self.logger.error(f"Error fetching injuries: {e}")
            return pd.DataFrame()

    def _merge_player_data(self, weekly: pd.DataFrame, seasonal: pd.DataFrame,
                          pfr: pd.DataFrame) -> pd.DataFrame:
        """Merge different player data sources"""
        try:
            # Start with weekly stats
            combined = weekly.copy()

            # Merge seasonal data
            if not seasonal.empty:
                seasonal_cols = ['player_id', 'season', 'fantasy_points',
                               'fantasy_points_ppr', 'games']
                seasonal_merge = seasonal[seasonal_cols]
                combined = combined.merge(seasonal_merge, on=['player_id', 'season'],
                                        how='left', suffixes=('', '_seasonal'))

            # Merge PFR advanced stats
            if not pfr.empty:
                pfr_cols = ['player_id', 'season', 'pass_rating', 'qbr',
                           'pass_yds', 'pass_td', 'pass_int']
                pfr_merge = pfr[pfr_cols]
                combined = combined.merge(pfr_merge, on=['player_id', 'season'],
                                        how='left', suffixes=('', '_pfr'))

            return combined

        except Exception as e:
            self.logger.error(f"Error merging player data: {e}")
            return weekly  # Return original data if merge fails

    def _calculate_advanced_metrics(self, pbp_data: pd.DataFrame) -> pd.DataFrame:
        """Calculate advanced metrics from play-by-play data"""
        try:
            # EPA (Expected Points Added) is already in nfl-data-py
            # Add additional custom metrics

            # Completion percentage by situation
            if 'complete_pass' in pbp_data.columns and 'pass_attempt' in pbp_data.columns:
                pbp_data['completion_pct'] = (
                    pbp_data.groupby(['passer_player_id', 'week'])['complete_pass']
                    .transform('sum') /
                    pbp_data.groupby(['passer_player_id', 'week'])['pass_attempt']
                    .transform('sum')
                )

            # Yards per attempt
            if 'passing_yards' in pbp_data.columns and 'pass_attempt' in pbp_data.columns:
                pbp_data['ypa'] = (
                    pbp_data.groupby(['passer_player_id', 'week'])['passing_yards']
                    .transform('sum') /
                    pbp_data.groupby(['passer_player_id', 'week'])['pass_attempt']
                    .transform('sum')
                )

            # Touchdown percentage
            if 'pass_touchdown' in pbp_data.columns and 'pass_attempt' in pbp_data.columns:
                pbp_data['td_pct'] = (
                    pbp_data.groupby(['passer_player_id', 'week'])['pass_touchdown']
                    .transform('sum') /
                    pbp_data.groupby(['passer_player_id', 'week'])['pass_attempt']
                    .transform('sum')
                )

            return pbp_data

        except Exception as e:
            self.logger.error(f"Error calculating advanced metrics: {e}")
            return pbp_data

    def fetch_all_data(self, year: int = None) -> Dict[str, pd.DataFrame]:
        """Fetch all available data types"""
        if year is None:
            year = datetime.now().year

        self.logger.info(f"Fetching all NFL data for {year}")

        data = {
            'player_stats': self.fetch_player_stats(year),
            'rosters': self.fetch_rosters(year),
            'schedules': self.fetch_schedules(year),
            'play_by_play': self.fetch_play_by_play(year),
            'injuries': self.fetch_injuries(year)
        }

        # Log summary
        total_records = sum(len(df) for df in data.values() if isinstance(df, pd.DataFrame))
        self.logger.info(f"Total records fetched: {total_records}")

        return data

    def get_data_quality_report(self, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Generate data quality report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'source': self.source_name,
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
