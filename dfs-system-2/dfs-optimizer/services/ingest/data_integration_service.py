#!/usr/bin/env python3
"""
Comprehensive DFS Data Integration Service
Integrates multiple verified data sources for NFL DFS optimization
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import aiohttp
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DataSourceConfig:
    """Configuration for data sources"""
    name: str
    api_key: Optional[str] = None
    base_url: str = ""
    enabled: bool = True
    priority: int = 1
    rate_limit: int = 60  # requests per minute

class DataIntegrationService:
    """Master service for integrating multiple DFS data sources"""

    def __init__(self):
        self.sources = self._initialize_sources()
        self.cache = {}
        self.cache_duration = 300  # 5 minutes
        self.session: Optional[aiohttp.ClientSession] = None

    def _initialize_sources(self) -> Dict[str, DataSourceConfig]:
        """Initialize all configured data sources"""
        return {
            'fantasynerds': DataSourceConfig(
                name='FantasyNerds',
                api_key=os.getenv('FANTASYNERDS_API_KEY'),
                base_url='https://api.fantasynerds.com/v1',
                enabled=bool(os.getenv('FANTASYNERDS_API_KEY')),
                priority=1
            ),
            'sportsdataio': DataSourceConfig(
                name='SportsDataIO',
                api_key=os.getenv('SPORTSDATAIO_API_KEY'),
                base_url='https://api.sportsdata.io/v2/json',
                enabled=bool(os.getenv('SPORTSDATAIO_API_KEY')),
                priority=2
            ),
            'odds_api': DataSourceConfig(
                name='The Odds API',
                api_key=os.getenv('THE_ODDS_API_KEY'),
                base_url='https://api.the-odds-api.com/v4',
                enabled=bool(os.getenv('THE_ODDS_API_KEY')),
                priority=3
            ),
            'openweather': DataSourceConfig(
                name='OpenWeatherMap',
                api_key=os.getenv('OPENWEATHER_API_KEY'),
                base_url='https://api.openweathermap.org/data/2.5',
                enabled=bool(os.getenv('OPENWEATHER_API_KEY')),
                priority=4
            ),
            'draftkings': DataSourceConfig(
                name='DraftKings Unofficial',
                base_url='https://api.draftkings.com',
                enabled=True,
                priority=5
            )
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def get_comprehensive_nfl_data(self) -> Dict:
        """Get comprehensive NFL DFS data from all available sources"""
        logger.info("Starting comprehensive NFL data integration")

        # Initialize result structure
        result = {
            'source': 'Multi-Source Integration',
            'status': 'active',
            'timestamp': datetime.now().isoformat(),
            'data_sources': {},
            'players': [],
            'slates': [],
            'odds': [],
            'weather': [],
            'total_players': 0,
            'quality_score': 0.0
        }

        # Fetch data from each enabled source
        tasks = []
        for source_name, config in self.sources.items():
            if config.enabled:
                tasks.append(self._fetch_source_data(source_name, config))

        # Execute all fetches concurrently
        source_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        for source_name, result_data in zip(self.sources.keys(), source_results):
            if isinstance(result_data, Exception):
                logger.error(f"Failed to fetch from {source_name}: {result_data}")
                result['data_sources'][source_name] = {'status': 'error', 'error': str(result_data)}
            else:
                result['data_sources'][source_name] = result_data

        # Merge and deduplicate data
        await self._merge_data_sources(result)

        # Calculate quality score
        result['quality_score'] = self._calculate_quality_score(result)

        logger.info(f"Completed data integration: {result['total_players']} players from {len(result['data_sources'])} sources")
        return result

    async def _fetch_source_data(self, source_name: str, config: DataSourceConfig) -> Dict:
        """Fetch data from a specific source"""
        try:
            if source_name == 'fantasynerds':
                return await self._fetch_fantasynerds_data(config)
            elif source_name == 'sportsdataio':
                return await self._fetch_sportsdataio_data(config)
            elif source_name == 'odds_api':
                return await self._fetch_odds_data(config)
            elif source_name == 'openweather':
                return await self._fetch_weather_data(config)
            elif source_name == 'draftkings':
                return await self._fetch_draftkings_data(config)
            else:
                return {'status': 'unknown_source'}
        except Exception as e:
            logger.error(f"Error fetching from {source_name}: {e}")
            return {'status': 'error', 'error': str(e)}

    async def _fetch_fantasynerds_data(self, config: DataSourceConfig) -> Dict:
        """Fetch data from FantasyNerds"""
        if not config.api_key:
            return {'status': 'no_api_key'}

        try:
            # Get NFL slates
            slates_url = f"{config.base_url}/nfl/dfs-slates"
            params = {'api_key': config.api_key}

            async with self.session.get(slates_url, params=params) as response:
                if response.status == 200:
                    slates_data = await response.json()

                    # Get players for main slate
                    if 'slates' in slates_data and slates_data['slates']:
                        main_slate = slates_data['slates'][0]
                        players_url = f"{config.base_url}/nfl/dfs-slates/{main_slate['id']}/players"

                        async with self.session.get(players_url, params=params) as players_response:
                            if players_response.status == 200:
                                players_data = await players_response.json()

                                return {
                                    'status': 'success',
                                    'slates': slates_data.get('slates', []),
                                    'players': players_data.get('players', []),
                                    'source_quality': 0.95
                                }

            return {'status': 'api_error', 'http_status': response.status}

        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def _fetch_sportsdataio_data(self, config: DataSourceConfig) -> Dict:
        """Fetch data from SportsDataIO"""
        if not config.api_key:
            return {'status': 'no_api_key'}

        try:
            headers = {'Ocp-Apim-Subscription-Key': config.api_key}

            # Get NFL games for current season
            games_url = f"{config.base_url}/GamesBySeason/2025"
            async with self.session.get(games_url, headers=headers) as response:
                if response.status == 200:
                    games_data = await response.json()

                    # Get player projections
                    projections_url = f"{config.base_url}/PlayerSeasonProjectionStatsBySeason/2025"
                    async with self.session.get(projections_url, headers=headers) as proj_response:
                        projections = []
                        if proj_response.status == 200:
                            projections = await proj_response.json()

                        return {
                            'status': 'success',
                            'games': games_data,
                            'projections': projections,
                            'source_quality': 0.90
                        }

            return {'status': 'api_error', 'http_status': response.status}

        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def _fetch_odds_data(self, config: DataSourceConfig) -> Dict:
        """Fetch betting odds data"""
        if not config.api_key:
            return {'status': 'no_api_key'}

        try:
            # Get NFL odds
            odds_url = f"{config.base_url}/sports/americanfootball_nfl/odds"
            params = {
                'apiKey': config.api_key,
                'regions': 'us',
                'markets': 'spreads,totals'
            }

            async with self.session.get(odds_url, params=params) as response:
                if response.status == 200:
                    odds_data = await response.json()

                    return {
                        'status': 'success',
                        'odds': odds_data,
                        'source_quality': 0.85
                    }

            return {'status': 'api_error', 'http_status': response.status}

        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def _fetch_weather_data(self, config: DataSourceConfig) -> Dict:
        """Fetch weather data for NFL games"""
        if not config.api_key:
            return {'status': 'no_api_key'}

        try:
            # Get weather for major NFL cities
            nfl_cities = [
                {'city': 'Kansas City', 'lat': 39.0997, 'lon': -94.5786},
                {'city': 'Buffalo', 'lat': 42.8864, 'lon': -78.8784},
                {'city': 'Philadelphia', 'lat': 39.9526, 'lon': -75.1652},
                {'city': 'San Francisco', 'lat': 37.7749, 'lon': -122.4194}
            ]

            weather_data = []
            for city_info in nfl_cities:
                weather_url = f"{config.base_url}/weather"
                params = {
                    'lat': city_info['lat'],
                    'lon': city_info['lon'],
                    'appid': config.api_key,
                    'units': 'imperial'
                }

                async with self.session.get(weather_url, params=params) as response:
                    if response.status == 200:
                        city_weather = await response.json()
                        city_weather['city_name'] = city_info['city']
                        weather_data.append(city_weather)

            return {
                'status': 'success',
                'weather': weather_data,
                'source_quality': 0.80
            }

        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def _fetch_draftkings_data(self, config: DataSourceConfig) -> Dict:
        """Fetch data from DraftKings unofficial endpoints"""
        try:
            # Try the main draftables endpoint
            draftables_url = f"{config.base_url}/draftgroups/v1/draftgroups"

            async with self.session.get(draftables_url) as response:
                if response.status == 200:
                    data = await response.json()

                    # Look for NFL draft groups
                    nfl_groups = []
                    if 'draftGroups' in data:
                        for group in data['draftGroups']:
                            if group.get('sport', '').upper() == 'NFL':
                                nfl_groups.append(group)

                    if nfl_groups:
                        # Get players for first NFL group
                        group_id = nfl_groups[0]['draftGroupId']
                        players_url = f"{config.base_url}/draftgroups/v1/draftgroups/{group_id}/draftables"

                        async with self.session.get(players_url) as players_response:
                            if players_response.status == 200:
                                players_data = await players_response.json()

                                return {
                                    'status': 'success',
                                    'draft_groups': nfl_groups,
                                    'players': players_data.get('draftables', []),
                                    'source_quality': 0.70  # Lower quality due to unofficial nature
                                }

            return {'status': 'no_nfl_data'}

        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def _merge_data_sources(self, result: Dict) -> None:
        """Merge data from multiple sources"""
        all_players = []
        player_map = {}  # Map by player name/team to avoid duplicates

        # Process each source
        for source_name, source_data in result['data_sources'].items():
            if source_data.get('status') == 'success':
                players = source_data.get('players', [])

                for player in players:
                    # Create a unique key for deduplication
                    player_key = f"{player.get('name', '')}_{player.get('team', '')}".lower()

                    if player_key not in player_map:
                        # First time seeing this player
                        merged_player = self._standardize_player_data(player, source_name)
                        player_map[player_key] = merged_player
                        all_players.append(merged_player)
                    else:
                        # Update existing player with additional data
                        existing_player = player_map[player_key]
                        self._merge_player_data(existing_player, player, source_name)

        # Add slates from sources
        all_slates = []
        for source_name, source_data in result['data_sources'].items():
            if 'slates' in source_data:
                for slate in source_data['slates']:
                    slate['data_source'] = source_name
                    all_slates.append(slate)

        result['players'] = all_players
        result['slates'] = all_slates
        result['total_players'] = len(all_players)

    def _standardize_player_data(self, player: Dict, source: str) -> Dict:
        """Standardize player data format"""
        return {
            'id': f"{source.lower()}_{player.get('id', player.get('player_id', 'unknown'))}",
            'name': player.get('name', 'Unknown Player'),
            'position': player.get('position', player.get('pos', 'UNK')),
            'team': player.get('team', 'UNK'),
            'opponent': player.get('opponent', player.get('opp', 'UNK')),
            'salary_dk': player.get('salary_dk', player.get('salary', 0)),
            'salary_fd': player.get('salary_fd', 0),
            'projection': player.get('projection', player.get('fantasy_points', 0)),
            'ownership': player.get('ownership', player.get('projected_ownership', 0.15)),
            'value': player.get('value', 0),
            'status': player.get('status', 'active'),
            'injury_status': player.get('injury_status', 'healthy'),
            'data_sources': [source],
            'last_update': datetime.now().isoformat()
        }

    def _merge_player_data(self, existing: Dict, new: Dict, source: str) -> None:
        """Merge new player data into existing player record"""
        # Add source to list
        if source not in existing['data_sources']:
            existing['data_sources'].append(source)

        # Update projections if better data available
        if new.get('projection', 0) > existing.get('projection', 0):
            existing['projection'] = new['projection']

        # Update ownership if available
        if new.get('ownership', 0) > 0:
            existing['ownership'] = new['ownership']

        # Update salary if not set
        if existing.get('salary_dk', 0) == 0 and new.get('salary_dk', 0) > 0:
            existing['salary_dk'] = new['salary_dk']

        # Recalculate value
        if existing.get('salary_dk', 0) > 0:
            existing['value'] = existing['projection'] / (existing['salary_dk'] / 1000)

    def _calculate_quality_score(self, result: Dict) -> float:
        """Calculate overall data quality score"""
        if not result['data_sources']:
            return 0.0

        total_quality = 0.0
        source_count = 0

        for source_data in result['data_sources'].values():
            if source_data.get('status') == 'success':
                quality = source_data.get('source_quality', 0.5)
                total_quality += quality
                source_count += 1

        if source_count == 0:
            return 0.0

        # Bonus for multiple sources
        diversity_bonus = min(0.2, source_count * 0.05)

        return min(1.0, (total_quality / source_count) + diversity_bonus)

    async def get_health_status(self) -> Dict:
        """Get health status of all data sources"""
        health = {
            'overall_status': 'healthy',
            'sources': {},
            'timestamp': datetime.now().isoformat()
        }

        for source_name, config in self.sources.items():
            health['sources'][source_name] = {
                'enabled': config.enabled,
                'has_api_key': bool(config.api_key),
                'priority': config.priority,
                'status': 'unknown'
            }

        # Test each enabled source
        for source_name, config in self.sources.items():
            if config.enabled:
                try:
                    test_result = await self._test_source_connectivity(source_name, config)
                    health['sources'][source_name]['status'] = test_result
                except Exception as e:
                    health['sources'][source_name]['status'] = 'error'
                    health['sources'][source_name]['error'] = str(e)

        # Determine overall status
        error_count = sum(1 for s in health['sources'].values() if s['status'] == 'error')
        if error_count > len(health['sources']) / 2:
            health['overall_status'] = 'degraded'
        elif error_count == len(health['sources']):
            health['overall_status'] = 'unhealthy'

        return health

    async def _test_source_connectivity(self, source_name: str, config: DataSourceConfig) -> str:
        """Test connectivity to a data source"""
        try:
            if source_name == 'fantasynerds' and config.api_key:
                # Quick test with a simple endpoint
                test_url = f"{config.base_url}/nfl/dfs-slates"
                params = {'api_key': config.api_key}

                async with self.session.get(test_url, params=params) as response:
                    return 'healthy' if response.status == 200 else 'unhealthy'

            elif source_name == 'sportsdataio' and config.api_key:
                test_url = f"{config.base_url}/GamesBySeason/2025"
                headers = {'Ocp-Apim-Subscription-Key': config.api_key}

                async with self.session.get(test_url, headers=headers) as response:
                    return 'healthy' if response.status == 200 else 'unhealthy'

            elif source_name == 'odds_api' and config.api_key:
                test_url = f"{config.base_url}/sports"
                params = {'apiKey': config.api_key}

                async with self.session.get(test_url, params=params) as response:
                    return 'healthy' if response.status == 200 else 'unhealthy'

            elif source_name == 'openweather' and config.api_key:
                test_url = f"{config.base_url}/weather"
                params = {'q': 'London', 'appid': config.api_key}

                async with self.session.get(test_url, params=params) as response:
                    return 'healthy' if response.status == 200 else 'unhealthy'

            elif source_name == 'draftkings':
                test_url = f"{config.base_url}/draftgroups/v1/draftgroups"

                async with self.session.get(test_url) as response:
                    return 'healthy' if response.status == 200 else 'unhealthy'

            return 'no_credentials'

        except Exception as e:
            logger.error(f"Connectivity test failed for {source_name}: {e}")
            return 'error'

# Convenience functions
async def get_comprehensive_dfs_data() -> Dict:
    """Get comprehensive DFS data from all sources"""
    async with DataIntegrationService() as service:
        return await service.get_comprehensive_nfl_data()

async def get_data_sources_health() -> Dict:
    """Get health status of all data sources"""
    async with DataIntegrationService() as service:
        return await service.get_health_status()

if __name__ == "__main__":
    async def main():
        print("Testing comprehensive DFS data integration...")

        # Test health status
        health = await get_data_sources_health()
        print(f"Data sources health: {health['overall_status']}")
        for source, status in health['sources'].items():
            print(f"  {source}: {status['status']}")

        # Test comprehensive data fetch
        data = await get_comprehensive_dfs_data()
        print(f"Integration result: {data['total_players']} players from {len(data['data_sources'])} sources")
        print(f"Quality score: {data['quality_score']:.2f}")

    asyncio.run(main())
