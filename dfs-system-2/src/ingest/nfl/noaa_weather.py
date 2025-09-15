import os
import pandas as pd
from datetime import datetime
from typing import Dict, Any
from ..base import JSONIngestor
from ...data.schemas import DataIngestionStatus, SportType
import json
from pathlib import Path

class NOAAWeatherIngestor(JSONIngestor):
    """Ingestor for NOAA Weather Service API"""
    
    def __init__(self, sport: SportType, source_name: str, config: Dict[str, Any]):
        super().__init__(sport, source_name, config)
        
        # NFL stadium mapping
        self.stadium_to_team = {
            'MetLife Stadium': ['NYG', 'NYJ'],
            'SoFi Stadium': ['LAR', 'LAC'],
            'Soldier Field': ['CHI'],
            'Hard Rock Stadium': ['MIA'],
            'AT&T Stadium': ['DAL'],
            'Gillette Stadium': ['NE'],
            'M&T Bank Stadium': ['BAL'],
            'Highmark Stadium': ['BUF'],
            'Bank of America Stadium': ['CAR'],
            'Paycor Stadium': ['CIN'],
            'FirstEnergy Stadium': ['CLE'],
            'Empower Field at Mile High': ['DEN'],
            'Ford Field': ['DET'],
            'Lucas Oil Stadium': ['IND'],
            'TIAA Bank Field': ['JAC'],
            'Arrowhead Stadium': ['KC'],
            'Allegiant Stadium': ['LVR'],
            'U.S. Bank Stadium': ['MIN'],
            'Mercedes-Benz Superdome': ['NO'],
            'Lincoln Financial Field': ['PHI'],
            'Acrisure Stadium': ['PIT'],
            'Levi\'s Stadium': ['SF'],
            'Lumen Field': ['SEA'],
            'Raymond James Stadium': ['TB'],
            'Nissan Stadium': ['TEN'],
            'FedExField': ['WAS']
        }
        
        # Dome stadiums (no weather impact)
        self.dome_teams = ['ARI', 'ATL', 'DAL', 'DET', 'HOU', 'IND', 'LVR', 'LAR', 'MIN', 'NO']
    
    def ingest(self) -> DataIngestionStatus:
        """Ingest NOAA weather data"""
        start_time = datetime.now()
        errors = []
        warnings = []
        total_records = 0
        
        try:
            # Load the latest weather data file
            weather_data = self._load_weather_data()
            
            if not weather_data:
                return self._create_status(
                    "warning",
                    warnings=["No NOAA weather data found"]
                )
            
            processed_data = []
            
            for weather_entry in weather_data:
                stadium = weather_entry.get('stadium', '')
                teams = self.stadium_to_team.get(stadium, [])
                
                if not teams:
                    warnings.append(f"No team mapping found for stadium: {stadium}")
                    continue
                
                for team in teams:
                    if team in self.dome_teams:
                        # Create dome record
                        weather_record = self._create_dome_record(team)
                    else:
                        # Process NOAA weather data
                        weather_record = self._process_noaa_weather(weather_entry, team)
                    
                    processed_data.append(weather_record)
            
            if processed_data:
                df = pd.DataFrame(processed_data)
                total_records = len(df)
                self._save_processed_data(df, 'nfl_weather_noaa')
            else:
                return self._create_status(
                    "warning",
                    warnings=["No weather data processed"]
                )
            
        except Exception as e:
            errors.append(f"NOAA weather ingestion failed: {str(e)}")
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
    
    def _load_weather_data(self) -> list:
        """Load the latest NOAA weather data file"""
        data_dir = Path("public/data")
        weather_files = list(data_dir.glob("weather_*.json"))
        
        if not weather_files:
            return []
        
        # Get the most recent file
        latest_file = max(weather_files, key=lambda f: f.stat().st_mtime)
        
        try:
            with open(latest_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to load weather file {latest_file}: {e}")
            return []
    
    def _create_dome_record(self, team: str) -> Dict[str, Any]:
        """Create weather record for dome stadiums"""
        return {
            'team': team,
            'condition': 'Dome',
            'temperature': 72.0,
            'wind_speed': 0.0,
            'wind_direction': 'N/A',
            'humidity': 50.0,
            'precipitation': 0.0,
            'dome': True,
            'weather_impact_score': 0.0,
            'last_updated': datetime.now(),
            'source': 'noaa'
        }
    
    def _process_noaa_weather(self, weather_entry: Dict[str, Any], team: str) -> Dict[str, Any]:
        """Process NOAA weather data"""
        weather_info = weather_entry.get('weather', {})
        
        # Extract temperature
        temp_str = weather_info.get('temperature', 'N/A')
        if isinstance(temp_str, int):
            temperature = float(temp_str)
        elif isinstance(temp_str, str) and temp_str != 'N/A':
            try:
                temperature = float(temp_str)
            except ValueError:
                temperature = 72.0  # Default
        else:
            temperature = 72.0
        
        # Extract wind speed
        wind_speed_str = weather_info.get('windSpeed', '0 mph')
        wind_speed = self._parse_wind_speed(wind_speed_str)
        
        # Extract condition
        condition = weather_info.get('shortForecast', 'Clear')
        if 'rain' in condition.lower() or 'shower' in condition.lower():
            condition = 'Rain'
        elif 'snow' in condition.lower():
            condition = 'Snow'
        elif 'thunder' in condition.lower():
            condition = 'Thunderstorm'
        elif 'cloud' in condition.lower():
            condition = 'Clouds'
        
        # Extract wind direction
        wind_direction = weather_info.get('windDirection', 'N')
        
        # Calculate weather impact score
        impact_score = self._calculate_weather_impact(condition, temperature, wind_speed)
        
        return {
            'team': team,
            'condition': condition,
            'temperature': temperature,
            'wind_speed': wind_speed,
            'wind_direction': wind_direction,
            'humidity': 50.0,  # NOAA doesn't provide humidity in this format
            'precipitation': self._estimate_precipitation(condition),
            'dome': False,
            'weather_impact_score': impact_score,
            'last_updated': datetime.now(),
            'source': 'noaa'
        }
    
    def _parse_wind_speed(self, wind_speed_str: str) -> float:
        """Parse wind speed string to numeric value"""
        try:
            if ' to ' in wind_speed_str:
                # Handle ranges like "5 to 10 mph"
                parts = wind_speed_str.split(' to ')
                if len(parts) >= 2:
                    return (float(parts[0].strip()) + float(parts[1].split()[0].strip())) / 2
            elif 'mph' in wind_speed_str:
                # Handle single values like "6 mph"
                return float(wind_speed_str.split()[0].strip())
        except (ValueError, IndexError):
            pass
        return 0.0
    
    def _estimate_precipitation(self, condition: str) -> float:
        """Estimate precipitation based on condition"""
        if 'rain' in condition.lower() or 'shower' in condition.lower():
            return 0.2  # Light precipitation
        elif 'thunder' in condition.lower():
            return 0.5  # Heavy precipitation
        elif 'snow' in condition.lower():
            return 0.3  # Snow precipitation
        return 0.0
    
    def _calculate_weather_impact(self, condition: str, temp: float, wind_speed: float) -> float:
        """Calculate weather impact score for game"""
        impact = 0.0
        
        # Temperature impact
        if temp < 32 or temp > 90:
            impact += 0.3
        elif temp < 45 or temp > 80:
            impact += 0.1
        
        # Wind impact
        if wind_speed > 20:
            impact += 0.4
        elif wind_speed > 15:
            impact += 0.2
        elif wind_speed > 10:
            impact += 0.1
        
        # Precipitation impact
        if condition in ['Rain', 'Snow', 'Thunderstorm']:
            impact += 0.3
        elif condition in ['Drizzle', 'Mist', 'Fog']:
            impact += 0.1
        
        return min(impact, 1.0)
    
    def _save_processed_data(self, df: pd.DataFrame, filename: str):
        """Save processed data to cache"""
        cache_path = self.cache_dir / f"{filename}_{datetime.now().strftime('%Y%m%d')}.parquet"
        df.to_parquet(cache_path, compression='snappy')
        print(f"Saved {len(df)} NOAA weather records to {cache_path}")
