"""
Base Ingestor Class - Foundation for all data ingestors
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime, timedelta
import pandas as pd
import os
import json

class BaseIngestor(ABC):
    """Abstract base class for all data ingestors"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        self.cache_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'cache')
        os.makedirs(self.cache_dir, exist_ok=True)

    @abstractmethod
    def fetch_data(self) -> Dict[str, pd.DataFrame]:
        """Abstract method to fetch data from source"""
        pass

    def validate_data(self, data: pd.DataFrame, required_columns: List[str]) -> bool:
        """Validate that data contains required columns"""
        if data.empty:
            self.logger.warning("Data is empty")
            return False

        missing_columns = [col for col in required_columns if col not in data.columns]
        if missing_columns:
            self.logger.error(f"Missing required columns: {missing_columns}")
            return False

        return True

    def clean_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Basic data cleaning"""
        try:
            # Remove duplicates
            data = data.drop_duplicates()

            # Handle missing values
            data = data.fillna('')

            # Standardize text columns
            text_columns = data.select_dtypes(include=['object']).columns
            for col in text_columns:
                data[col] = data[col].astype(str).str.strip()

            return data

        except Exception as e:
            self.logger.error(f"Error cleaning data: {e}")
            return data

    def cache_data(self, data: pd.DataFrame, filename: str, ttl_hours: int = 24) -> None:
        """Cache data to disk with TTL"""
        try:
            cache_file = os.path.join(self.cache_dir, filename)
            cache_data = {
                'timestamp': datetime.now().isoformat(),
                'ttl_hours': ttl_hours,
                'data': data.to_dict('records')
            }

            with open(cache_file, 'w') as f:
                json.dump(cache_data, f, default=str)

            self.logger.info(f"Cached data to {cache_file}")

        except Exception as e:
            self.logger.error(f"Error caching data: {e}")

    def load_cached_data(self, filename: str) -> Optional[pd.DataFrame]:
        """Load cached data if still valid"""
        try:
            cache_file = os.path.join(self.cache_dir, filename)

            if not os.path.exists(cache_file):
                return None

            with open(cache_file, 'r') as f:
                cache_data = json.load(f)

            # Check if cache is still valid
            cache_time = datetime.fromisoformat(cache_data['timestamp'])
            ttl_hours = cache_data['ttl_hours']
            expiry_time = cache_time + timedelta(hours=ttl_hours)

            if datetime.now() > expiry_time:
                self.logger.info(f"Cache expired for {filename}")
                return None

            # Convert back to DataFrame
            data = pd.DataFrame(cache_data['data'])
            self.logger.info(f"Loaded cached data from {filename}")
            return data

        except Exception as e:
            self.logger.error(f"Error loading cached data: {e}")
            return None

    def get_data_quality_report(self, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Generate comprehensive data quality report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'source': self.__class__.__name__,
            'data_types': {},
            'quality_metrics': {
                'total_records': 0,
                'total_sources': len(data),
                'data_completeness': 0.0,
                'error_rate': 0.0
            }
        }

        total_records = 0
        total_nulls = 0

        for data_type, df in data.items():
            if isinstance(df, pd.DataFrame) and not df.empty:
                record_count = len(df)
                total_records += record_count

                # Calculate null percentage
                null_percentage = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
                total_nulls += df.isnull().sum().sum()

                report['data_types'][data_type] = {
                    'record_count': record_count,
                    'column_count': len(df.columns),
                    'columns': list(df.columns),
                    'null_percentage': round(null_percentage, 2),
                    'data_types': {col: str(dtype) for col, dtype in df.dtypes.items()}
                }

        # Overall quality metrics
        if total_records > 0:
            report['quality_metrics']['total_records'] = total_records
            report['quality_metrics']['data_completeness'] = round(
                ((total_records * len(list(data.values())[0].columns)) - total_nulls) /
                (total_records * len(list(data.values())[0].columns)) * 100, 2
            )

        return report

    def handle_error(self, error: Exception, context: str = "") -> None:
        """Standardized error handling"""
        error_msg = f"Error in {self.__class__.__name__}"
        if context:
            error_msg += f" - {context}"
        error_msg += f": {str(error)}"

        self.logger.error(error_msg)

        # Could add error reporting, notifications, etc. here
        # For now, just log the error

    def validate_config(self) -> bool:
        """Validate ingestor configuration"""
        required_keys = ['enabled', 'url']
        for key in required_keys:
            if key not in self.config:
                self.logger.error(f"Missing required config key: {key}")
                return False

        if not self.config.get('enabled', False):
            self.logger.info(f"Ingestor {self.__class__.__name__} is disabled")
            return False

        return True
