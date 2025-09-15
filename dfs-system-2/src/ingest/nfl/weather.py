import os
import pandas as pd
from datetime import datetime
from typing import Dict, Any
from ..base import JSONIngestor
from ...data.schemas import DataIngestionStatus, SportType

class OpenWeatherIngestor(JSONIngestor):
    """Ingestor for OpenWeatherMap API"""
    
    def __init__(self, sport: SportType, source_name: str, config: Dict[str, Any]):
        super().__init__(sport, source_name, config)
        self.api_key = os.getenv('OPENWEATHER_API_KEY')
        
        # NFL stadium locations (lat, lon)
        self.nfl_stadiums = {
            'ARI': (33.5276, -112.2626), 'ATL': (33.7553, -84.4006), 'BAL': (39.2780, -76.6227),
            'BUF': (42.7738, -78.7870), 'CAR': (35.2258, -80.8529), 'CHI': (41.8623, -87.6167),
            'CIN': (39.0955, -84.5161), 'CLE': (41.5061, -81.6995), 'DAL': (32.7473, -97.0945),
            'DEN': (39.7439, -105.0201), 'DET': (42.3400, -83.0456), 'GB': (44.5013, -88.0622),
            'HOU': (29.6847, -95.4107), 'IND': (39.7601, -86.1639), 'JAC': (30.3240, -81.6373),
            'KC': (39.0489, -94.4839), 'LVR': (36.0909, -115.1834), 'LAC': (33.8634, -118.2611),
            'LAR': (34.0137, -118.2879), 'MIA': (25.9580, -80.2389), 'MIN': (44.9778, -93.2650),
            'NE': (42.0909, -71.2643), 'NO': (29.9511, -90.0812), 'NYG': (40.8135, -74.0745),
            'NYJ': (40.8135, -74.0745), 'PHI': (39.9008, -75.1675), 'PIT': (40.4468, -80.0158),
            'SF': (37.4032, -121.9698), 'SEA': (47.5952, -122.3316), 'TB': (27.9759, -82.5033),
            'TEN': (36.1665, -86.7713), 'WAS': (38.9076, -76.8645)
        }
        
        # Dome stadiums (no weather impact)
        self.dome_teams = ['ARI', 'ATL', 'DAL', 'DET', 'HOU', 'IND', 'LVR', 'LAR', 'MIN', 'NO']
    
    def ingest(self) -> DataIngestionStatus:
        """Ingest weather data for NFL stadiums"""
        start_time = datetime.now()
        errors = []
        warnings = []
        total_records = 0
        
        if not self.api_key:
            return self._create_status(
                "error",
                errors=["OPENWEATHER_API_KEY not found in environment variables"]
            )
        
        try:
            weather_data = []
            
            for team, (lat, lon) in self.nfl_stadiums.items():
                try:
                    # Skip dome stadiums
                    if team in self.dome_teams:
                        weather_record = self._create_dome_record(team)
                        weather_data.append(weather_record)
                        continue
                    
                    # Get weather for outdoor stadiums
                    params = {
                        'lat': lat,
                        'lon': lon,
                        'appid': self.api_key,
                        'units': 'imperial'  # Fahrenheit
                    }
                    
                    weather_df = self._fetch_data(self.config['url'], params)
                    
                    if not weather_df.empty:
                        weather_record = self._process_weather_data(weather_df.iloc[0], team)
                        weather_data.append(weather_record)
                    
                except Exception as e:
                    warnings.append(f"Failed to get weather for {team}: {str(e)}")
                    continue
            
            if weather_data:
                df = pd.DataFrame(weather_data)
                total_records = len(df)
                self._save_processed_data(df, 'nfl_weather')
            else:
                return self._create_status(
                    "warning",
                    warnings=["No weather data collected"]
                )
            
        except Exception as e:
            errors.append(f"Weather ingestion failed: {str(e)}")
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
            'last_updated': datetime.now()
        }
    
    def _process_weather_data(self, weather_row: pd.Series, team: str) -> Dict[str, Any]:
        """Process weather data from OpenWeatherMap"""
        weather = weather_row.get('weather', [{}])[0] if isinstance(weather_row.get('weather'), list) else {}
        main = weather_row.get('main', {})
        wind = weather_row.get('wind', {})
        
        condition = weather.get('main', 'Clear')
        temp = main.get('temp', 72.0)
        humidity = main.get('humidity', 50.0)
        wind_speed = wind.get('speed', 0.0)
        wind_deg = wind.get('deg', 0)
        
        # Convert wind direction
        wind_direction = self._degrees_to_direction(wind_deg)
        
        # Calculate weather impact score (0-1, higher = more impact)
        impact_score = self._calculate_weather_impact(condition, temp, wind_speed)
        
        return {
            'team': team,
            'condition': condition,
            'temperature': temp,
            'wind_speed': wind_speed,
            'wind_direction': wind_direction,
            'humidity': humidity,
            'precipitation': weather_row.get('rain', {}).get('1h', 0) + weather_row.get('snow', {}).get('1h', 0),
            'dome': False,
            'weather_impact_score': impact_score,
            'last_updated': datetime.now()
        }
    
    def _degrees_to_direction(self, degrees: float) -> str:
        """Convert wind degrees to direction"""
        directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
        index = round(degrees / 22.5) % 16
        return directions[index]
    
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
        print(f"Saved {len(df)} weather records to {cache_path}")
