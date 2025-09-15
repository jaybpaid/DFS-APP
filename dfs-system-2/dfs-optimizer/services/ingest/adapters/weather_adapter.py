"""
Weather Adapter
Live weather data for DFS matchup analysis
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import aiohttp
import json
from dataclasses import dataclass

from ...packages.shared.types import Player

logger = logging.getLogger(__name__)

@dataclass
class WeatherData:
    """Weather data structure"""
    location: str
    temperature: float  # Fahrenheit
    humidity: int       # Percentage
    wind_speed: float   # MPH
    precipitation: float # Inches
    conditions: str     # 'clear', 'rain', 'snow', 'cloudy', etc.
    game_time: datetime
    last_updated: datetime

@dataclass
class WeatherImpact:
    """Weather impact on player performance"""
    player_id: str
    position: str
    weather_factor: float  # Multiplier (1.0 = neutral)
    impact_type: str       # 'positive', 'negative', 'neutral'
    reasons: List[str]
    confidence: float

class WeatherAdapter:
    """Adapter for weather data and DFS impact analysis"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or "demo_key"  # OpenWeatherMap API key
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.session = None
        self.cache = {}
        self.cache_expiry = 1800  # 30 minutes

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def get_game_weather(self, location: str, game_time: datetime) -> Optional[WeatherData]:
        """Get weather forecast for game location and time"""
        cache_key = f"weather_{location}_{game_time.strftime('%Y%m%d_%H')}"

        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]

        try:
            weather_data = await self._fetch_weather_data(location, game_time)
            if weather_data:
                self.cache[cache_key] = weather_data
            return weather_data

        except Exception as e:
            logger.error(f"Failed to fetch weather for {location}: {e}")
            return None

    async def _fetch_weather_data(self, location: str, game_time: datetime) -> Optional[WeatherData]:
        """Fetch weather data from OpenWeatherMap"""
        try:
            # Convert location to coordinates (simplified)
            coords = self._location_to_coords(location)

            if not coords:
                return None

            lat, lon = coords

            # Use forecast endpoint for future weather
            hours_ahead = int((game_time - datetime.now()).total_seconds() / 3600)

            if hours_ahead <= 0:
                # Current weather
                url = f"{self.base_url}/weather"
                params = {
                    'lat': lat,
                    'lon': lon,
                    'appid': self.api_key,
                    'units': 'imperial'
                }
            else:
                # Forecast (up to 5 days)
                url = f"{self.base_url}/forecast"
                params = {
                    'lat': lat,
                    'lon': lon,
                    'appid': self.api_key,
                    'units': 'imperial'
                }

            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_weather_response(data, location, game_time, hours_ahead)
                else:
                    logger.error(f"Weather API error: {response.status}")
                    return None

        except Exception as e:
            logger.error(f"Weather fetch error: {e}")
            # Return mock data for demo
            return self._get_mock_weather(location, game_time)

    def _location_to_coords(self, location: str) -> Optional[Tuple[float, float]]:
        """Convert location name to coordinates"""
        # Simplified coordinate mapping
        coords_map = {
            'BUF': (42.8864, -78.8784),  # Buffalo
            'SF': (37.7749, -122.4194),  # San Francisco
            'MIA': (25.7617, -80.1918),  # Miami
            'KC': (39.0997, -94.5786),   # Kansas City
            'LV': (36.1699, -115.1398),  # Las Vegas
            'DET': (42.3314, -83.0458),  # Detroit
            'GB': (44.5133, -88.0158),   # Green Bay
            'NE': (41.2524, -95.9980),   # New England
            'PIT': (40.4406, -79.9959),  # Pittsburgh
            'CLE': (41.4993, -81.6944),  # Cleveland
        }

        # Extract team code from location
        team_code = location.split(',')[0].strip() if ',' in location else location[:3].upper()

        return coords_map.get(team_code)

    def _parse_weather_response(self, data: Dict, location: str, game_time: datetime,
                              hours_ahead: int) -> WeatherData:
        """Parse OpenWeatherMap response"""
        try:
            if 'list' in data:  # Forecast response
                # Find closest forecast to game time
                target_time = game_time.timestamp()
                closest_forecast = min(data['list'],
                    key=lambda x: abs(x['dt'] - target_time))
                weather = closest_forecast['main']
                wind = closest_forecast.get('wind', {})
                conditions = closest_forecast['weather'][0]['main'].lower()
                rain = closest_forecast.get('rain', {}).get('3h', 0)
            else:  # Current weather response
                weather = data['main']
                wind = data.get('wind', {})
                conditions = data['weather'][0]['main'].lower()
                rain = data.get('rain', {}).get('1h', 0)

            return WeatherData(
                location=location,
                temperature=round(weather['temp'], 1),
                humidity=int(weather['humidity']),
                wind_speed=round(wind.get('speed', 0), 1),
                precipitation=round(rain, 2),
                conditions=conditions,
                game_time=game_time,
                last_updated=datetime.now()
            )

        except Exception as e:
            logger.error(f"Failed to parse weather response: {e}")
            return self._get_mock_weather(location, game_time)

    def _get_mock_weather(self, location: str, game_time: datetime) -> WeatherData:
        """Return mock weather data for demo purposes"""
        # Generate realistic weather based on location and season
        base_temp = 70  # Default temperature

        # Location-based adjustments
        if 'BUF' in location or 'GB' in location or 'NE' in location:
            base_temp = 45  # Cold weather teams
        elif 'MIA' in location or 'LV' in location:
            base_temp = 85  # Warm weather teams

        # Seasonal adjustments (simplified)
        month = game_time.month
        if month in [12, 1, 2]:
            base_temp -= 15  # Winter
        elif month in [6, 7, 8]:
            base_temp += 10  # Summer

        return WeatherData(
            location=location,
            temperature=round(base_temp + np.random.normal(0, 5), 1),
            humidity=np.random.randint(40, 80),
            wind_speed=round(np.random.uniform(5, 15), 1),
            precipitation=round(np.random.uniform(0, 0.5), 2),
            conditions=np.random.choice(['clear', 'cloudy', 'rain', 'partly_cloudy']),
            game_time=game_time,
            last_updated=datetime.now()
        )

    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached weather data is still valid"""
        if cache_key not in self.cache:
            return False

        # Weather data expires after 30 minutes
        if isinstance(self.cache[cache_key], WeatherData):
            last_updated = self.cache[cache_key].last_updated
            return (datetime.now() - last_updated).seconds < self.cache_expiry

        return False

    async def analyze_weather_impact(self, players: List[Player], weather: WeatherData) -> List[WeatherImpact]:
        """Analyze how weather affects player performance"""
        impacts = []

        for player in players:
            impact = self._calculate_weather_impact(player, weather)
            impacts.append(impact)

        return impacts

    def _calculate_weather_impact(self, player: Player, weather: WeatherData) -> WeatherImpact:
        """Calculate weather impact for a specific player"""
        base_factor = 1.0
        reasons = []
        impact_type = 'neutral'

        # Temperature impact
        if weather.temperature < 40:  # Very cold
            if player.pos[0] in ['QB', 'RB', 'TE']:  # Mobile players
                base_factor *= 0.85
                reasons.append("Cold weather reduces mobility")
                impact_type = 'negative'
            elif 'DST' in player.pos:
                base_factor *= 1.05
                reasons.append("Cold weather favors defense")
                impact_type = 'positive'
        elif weather.temperature > 85:  # Very hot
            if player.pos[0] in ['QB', 'RB']:
                base_factor *= 0.90
                reasons.append("Heat affects performance")
                impact_type = 'negative'

        # Wind impact
        if weather.wind_speed > 15:  # Windy
            if player.pos[0] == 'QB':
                base_factor *= 0.88
                reasons.append("High winds affect passing accuracy")
                impact_type = 'negative'
            elif player.pos[0] == 'WR':
                base_factor *= 0.92
                reasons.append("Wind affects route running")
                impact_type = 'negative'

        # Precipitation impact
        if weather.precipitation > 0.1:  # Rain
            if player.pos[0] == 'QB':
                base_factor *= 0.87
                reasons.append("Rain affects ball handling")
                impact_type = 'negative'
            elif 'DST' in player.pos:
                base_factor *= 1.08
                reasons.append("Rain favors defense")
                impact_type = 'positive'

        # Humidity impact
        if weather.humidity > 70:  # Humid
            if player.pos[0] in ['QB', 'RB']:
                base_factor *= 0.93
                reasons.append("High humidity reduces endurance")
                impact_type = 'negative'

        # Conditions impact
        if weather.conditions == 'snow':
            if player.pos[0] in ['RB', 'QB']:
                base_factor *= 0.80
                reasons.append("Snow severely impacts performance")
                impact_type = 'negative'
            elif 'DST' in player.pos:
                base_factor *= 1.15
                reasons.append("Snow heavily favors defense")
                impact_type = 'positive'

        # Calculate confidence based on weather severity
        weather_severity = (
            abs(weather.temperature - 70) / 50 +  # Temperature deviation
            weather.wind_speed / 20 +             # Wind factor
            weather.precipitation * 10 +          # Precipitation factor
            weather.humidity / 100                # Humidity factor
        ) / 4

        confidence = min(0.9, max(0.5, weather_severity))

        return WeatherImpact(
            player_id=player.playerId,
            position=player.pos[0] if player.pos else 'UNK',
            weather_factor=round(base_factor, 3),
            impact_type=impact_type,
            reasons=reasons,
            confidence=round(confidence, 2)
        )

    async def get_weather_alerts(self, games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get weather alerts for upcoming games"""
        alerts = []

        for game in games:
            location = game.get('location', '')
            game_time = game.get('game_time')

            if location and game_time:
                weather = await self.get_game_weather(location, game_time)

                if weather:
                    # Check for severe weather conditions
                    if weather.temperature < 32:
                        alerts.append({
                            'type': 'freezing',
                            'location': location,
                            'game_time': game_time,
                            'temperature': weather.temperature,
                            'impact': 'Severe cold may affect player performance'
                        })
                    elif weather.wind_speed > 20:
                        alerts.append({
                            'type': 'windy',
                            'location': location,
                            'game_time': game_time,
                            'wind_speed': weather.wind_speed,
                            'impact': 'High winds may affect passing games'
                        })
                    elif weather.precipitation > 0.5:
                        alerts.append({
                            'type': 'heavy_rain',
                            'location': location,
                            'game_time': game_time,
                            'precipitation': weather.precipitation,
                            'impact': 'Heavy rain may favor defenses'
                        })

        return alerts

# Convenience functions
async def get_game_weather(location: str, game_time: datetime) -> Optional[WeatherData]:
    """Get weather for a game"""
    async with WeatherAdapter() as adapter:
        return await adapter.get_game_weather(location, game_time)

async def analyze_weather_impact(players: List[Player], weather: WeatherData) -> List[WeatherImpact]:
    """Analyze weather impact on players"""
    async with WeatherAdapter() as adapter:
        return await adapter.analyze_weather_impact(players, weather)

async def get_weather_alerts(games: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Get weather alerts for games"""
    async with WeatherAdapter() as adapter:
        return await adapter.get_weather_alerts(games)
