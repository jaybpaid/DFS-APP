"""
Live Data Pipeline Integration for DFS Optimizer
Handles real-time data feeds, API rate limiting, and data validation
"""

import asyncio
import aiohttp
import time
import json
import logging
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataSource(Enum):
    DRAFTKINGS = "draftkings"
    FANDUEL = "fanduel"
    ROTOWIRE = "rotowire"
    FANTASYPROS = "fantasypros"
    SUPERDRAFT = "superdraft"
    ESPN = "espn"
    YAHOO = "yahoo"


@dataclass
class DataSourceConfig:
    name: str
    base_url: str
    api_key: Optional[str]
    rate_limit: int  # requests per minute
    timeout: int
    retry_attempts: int
    priority: int  # 1 = highest priority
    enabled: bool = True


@dataclass
class PlayerData:
    id: str
    name: str
    position: str
    team: str
    salary: int
    projected_points: float
    ownership: float
    injury_status: str
    news: List[str]
    weather_impact: float
    matchup_rating: float
    source: str
    timestamp: datetime
    confidence: float


@dataclass
class SlateData:
    id: str
    sport: str
    contest_type: str
    start_time: datetime
    salary_cap: int
    players: List[PlayerData]
    source: str
    timestamp: datetime


class RateLimiter:
    """Rate limiter for API calls"""

    def __init__(self, max_requests: int, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
        self.lock = asyncio.Lock()

    async def acquire(self):
        """Acquire permission to make a request"""
        async with self.lock:
            now = time.time()
            # Remove old requests outside the time window
            self.requests = [
                req_time
                for req_time in self.requests
                if now - req_time < self.time_window
            ]

            if len(self.requests) >= self.max_requests:
                # Calculate wait time
                oldest_request = min(self.requests)
                wait_time = self.time_window - (now - oldest_request)
                if wait_time > 0:
                    logger.info(f"Rate limit reached, waiting {wait_time:.2f} seconds")
                    await asyncio.sleep(wait_time)
                    return await self.acquire()

            self.requests.append(now)


class DataValidator:
    """Validates incoming data for quality and consistency"""

    @staticmethod
    def validate_player_data(player: Dict[str, Any]) -> bool:
        """Validate player data structure and values"""
        required_fields = [
            "id",
            "name",
            "position",
            "team",
            "salary",
            "projected_points",
        ]

        # Check required fields
        for field in required_fields:
            if field not in player or player[field] is None:
                logger.warning(f"Missing required field: {field}")
                return False

        # Validate data types and ranges
        try:
            salary = float(player["salary"])
            projected_points = float(player["projected_points"])

            if salary < 0 or salary > 20000:
                logger.warning(f"Invalid salary: {salary}")
                return False

            if projected_points < 0 or projected_points > 100:
                logger.warning(f"Invalid projected points: {projected_points}")
                return False

            if player["position"] not in ["QB", "RB", "WR", "TE", "DST", "K"]:
                logger.warning(f"Invalid position: {player['position']}")
                return False

            return True

        except (ValueError, TypeError) as e:
            logger.warning(f"Data validation error: {str(e)}")
            return False

    @staticmethod
    def validate_slate_data(slate: Dict[str, Any]) -> bool:
        """Validate slate data structure"""
        required_fields = ["id", "sport", "contest_type", "start_time", "salary_cap"]

        for field in required_fields:
            if field not in slate or slate[field] is None:
                logger.warning(f"Missing required slate field: {field}")
                return False

        try:
            salary_cap = int(slate["salary_cap"])
            if salary_cap < 10000 or salary_cap > 100000:
                logger.warning(f"Invalid salary cap: {salary_cap}")
                return False

            return True

        except (ValueError, TypeError) as e:
            logger.warning(f"Slate validation error: {str(e)}")
            return False


class DataPipeline:
    """Main data pipeline for managing live data feeds"""

    def __init__(self):
        self.data_sources = self._initialize_data_sources()
        self.rate_limiters = {}
        self.session = None
        self.cache = {}
        self.cache_ttl = {}
        self.validator = DataValidator()
        self.callbacks = []

        # Initialize rate limiters
        for source_name, config in self.data_sources.items():
            self.rate_limiters[source_name] = RateLimiter(config.rate_limit)

    def _initialize_data_sources(self) -> Dict[str, DataSourceConfig]:
        """Initialize data source configurations"""
        return {
            DataSource.DRAFTKINGS.value: DataSourceConfig(
                name="DraftKings",
                base_url="https://api.draftkings.com/draftgroups/v1",
                api_key=os.getenv("DRAFTKINGS_API_KEY"),
                rate_limit=100,  # requests per minute
                timeout=30,
                retry_attempts=3,
                priority=1,
                enabled=True,
            ),
            DataSource.FANDUEL.value: DataSourceConfig(
                name="FanDuel",
                base_url="https://api.fanduel.com/fixture-lists",
                api_key=os.getenv("FANDUEL_API_KEY"),
                rate_limit=60,
                timeout=30,
                retry_attempts=3,
                priority=2,
                enabled=True,
            ),
            DataSource.ROTOWIRE.value: DataSourceConfig(
                name="RotoWire",
                base_url="https://api.rotowire.com/v1",
                api_key=os.getenv("ROTOWIRE_API_KEY"),
                rate_limit=120,
                timeout=30,
                retry_attempts=3,
                priority=1,
                enabled=True,
            ),
            DataSource.FANTASYPROS.value: DataSourceConfig(
                name="FantasyPros",
                base_url="https://api.fantasypros.com/v2",
                api_key=os.getenv("FANTASYPROS_API_KEY"),
                rate_limit=100,
                timeout=30,
                retry_attempts=3,
                priority=2,
                enabled=True,
            ),
            DataSource.SUPERDRAFT.value: DataSourceConfig(
                name="SuperDraft",
                base_url="https://api.superdraft.com/v1",
                api_key=os.getenv("SUPERDRAFT_API_KEY"),
                rate_limit=50,
                timeout=30,
                retry_attempts=3,
                priority=3,
                enabled=True,
            ),
        }

    async def initialize(self):
        """Initialize the data pipeline"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=60),
            connector=aiohttp.TCPConnector(limit=100, limit_per_host=20),
        )
        logger.info("Data pipeline initialized")

    async def close(self):
        """Close the data pipeline"""
        if self.session:
            await self.session.close()
        logger.info("Data pipeline closed")

    def register_callback(self, callback: Callable[[str, Any], None]):
        """Register a callback for data updates"""
        self.callbacks.append(callback)

    async def _notify_callbacks(self, event_type: str, data: Any):
        """Notify all registered callbacks"""
        for callback in self.callbacks:
            try:
                await callback(event_type, data)
            except Exception as e:
                logger.error(f"Callback error: {str(e)}")

    async def _make_request(
        self, source: str, endpoint: str, params: Dict[str, Any] = None
    ) -> Optional[Dict[str, Any]]:
        """Make a rate-limited API request"""
        config = self.data_sources.get(source)
        if not config or not config.enabled:
            return None

        # Apply rate limiting
        await self.rate_limiters[source].acquire()

        url = f"{config.base_url}/{endpoint.lstrip('/')}"
        headers = {}

        if config.api_key:
            headers["Authorization"] = f"Bearer {config.api_key}"

        for attempt in range(config.retry_attempts):
            try:
                async with self.session.get(
                    url, params=params, headers=headers, timeout=config.timeout
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    elif response.status == 429:  # Rate limited
                        wait_time = int(response.headers.get("Retry-After", 60))
                        logger.warning(
                            f"Rate limited by {source}, waiting {wait_time} seconds"
                        )
                        await asyncio.sleep(wait_time)
                    else:
                        logger.warning(
                            f"API request failed: {response.status} - {await response.text()}"
                        )

            except asyncio.TimeoutError:
                logger.warning(f"Request timeout for {source} (attempt {attempt + 1})")
            except Exception as e:
                logger.error(f"Request error for {source}: {str(e)}")

            if attempt < config.retry_attempts - 1:
                await asyncio.sleep(2**attempt)  # Exponential backoff

        return None

    async def get_slates(self, sport: str = "nfl") -> List[SlateData]:
        """Get available slates from all sources"""
        slates = []
        tasks = []

        for source_name, config in self.data_sources.items():
            if config.enabled:
                task = self._get_slates_from_source(source_name, sport)
                tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                slates.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Error getting slates: {str(result)}")

        # Deduplicate and sort by priority
        unique_slates = self._deduplicate_slates(slates)
        await self._notify_callbacks("slates_updated", unique_slates)

        return unique_slates

    async def _get_slates_from_source(self, source: str, sport: str) -> List[SlateData]:
        """Get slates from a specific source"""
        cache_key = f"slates_{source}_{sport}"

        # Check cache
        if cache_key in self.cache and time.time() < self.cache_ttl.get(cache_key, 0):
            return self.cache[cache_key]

        slates = []

        if source == DataSource.DRAFTKINGS.value:
            slates = await self._get_draftkings_slates(sport)
        elif source == DataSource.FANDUEL.value:
            slates = await self._get_fanduel_slates(sport)
        elif source == DataSource.ROTOWIRE.value:
            slates = await self._get_rotowire_slates(sport)
        elif source == DataSource.FANTASYPROS.value:
            slates = await self._get_fantasypros_slates(sport)
        elif source == DataSource.SUPERDRAFT.value:
            slates = await self._get_superdraft_slates(sport)

        # Cache results for 5 minutes
        if slates:
            self.cache[cache_key] = slates
            self.cache_ttl[cache_key] = time.time() + 300

        return slates

    async def _get_draftkings_slates(self, sport: str) -> List[SlateData]:
        """Get slates from DraftKings"""
        try:
            data = await self._make_request(
                DataSource.DRAFTKINGS.value, f"draftgroups?sport={sport}"
            )
            if not data or "draftGroups" not in data:
                return []

            slates = []
            for group in data["draftGroups"]:
                if self.validator.validate_slate_data(
                    {
                        "id": group.get("draftGroupId"),
                        "sport": sport,
                        "contest_type": group.get("gameType", "classic"),
                        "start_time": group.get("startTimeSuffix"),
                        "salary_cap": group.get("salaryCap", 50000),
                    }
                ):
                    slate = SlateData(
                        id=str(group["draftGroupId"]),
                        sport=sport,
                        contest_type=group.get("gameType", "classic"),
                        start_time=datetime.fromisoformat(
                            group["startTimeSuffix"].replace("Z", "+00:00")
                        ),
                        salary_cap=group.get("salaryCap", 50000),
                        players=[],  # Will be populated separately
                        source=DataSource.DRAFTKINGS.value,
                        timestamp=datetime.now(),
                    )
                    slates.append(slate)

            return slates

        except Exception as e:
            logger.error(f"Error getting DraftKings slates: {str(e)}")
            return []

    async def _get_fanduel_slates(self, sport: str) -> List[SlateData]:
        """Get slates from FanDuel"""
        # Implementation for FanDuel API
        return []

    async def _get_rotowire_slates(self, sport: str) -> List[SlateData]:
        """Get slates from RotoWire"""
        # Implementation for RotoWire API
        return []

    async def _get_fantasypros_slates(self, sport: str) -> List[SlateData]:
        """Get slates from FantasyPros"""
        # Implementation for FantasyPros API
        return []

    async def _get_superdraft_slates(self, sport: str) -> List[SlateData]:
        """Get slates from SuperDraft"""
        # Implementation for SuperDraft API
        return []

    def _deduplicate_slates(self, slates: List[SlateData]) -> List[SlateData]:
        """Remove duplicate slates and prioritize by source"""
        slate_map = {}

        for slate in slates:
            # Create a unique key based on start time and contest type
            key = f"{slate.start_time.isoformat()}_{slate.contest_type}_{slate.sport}"

            if key not in slate_map:
                slate_map[key] = slate
            else:
                # Keep the slate from the higher priority source
                current_priority = self.data_sources[slate_map[key].source].priority
                new_priority = self.data_sources[slate.source].priority

                if new_priority < current_priority:  # Lower number = higher priority
                    slate_map[key] = slate

        return list(slate_map.values())

    async def get_player_data(self, slate_id: str) -> List[PlayerData]:
        """Get player data for a specific slate"""
        cache_key = f"players_{slate_id}"

        # Check cache
        if cache_key in self.cache and time.time() < self.cache_ttl.get(cache_key, 0):
            return self.cache[cache_key]

        players = []
        tasks = []

        for source_name, config in self.data_sources.items():
            if config.enabled:
                task = self._get_player_data_from_source(source_name, slate_id)
                tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                players.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Error getting player data: {str(result)}")

        # Merge and validate player data
        merged_players = self._merge_player_data(players)

        # Cache for 2 minutes
        if merged_players:
            self.cache[cache_key] = merged_players
            self.cache_ttl[cache_key] = time.time() + 120

        await self._notify_callbacks(
            "players_updated", {"slate_id": slate_id, "players": merged_players}
        )

        return merged_players

    async def _get_player_data_from_source(
        self, source: str, slate_id: str
    ) -> List[PlayerData]:
        """Get player data from a specific source"""
        if source == DataSource.DRAFTKINGS.value:
            return await self._get_draftkings_players(slate_id)
        elif source == DataSource.ROTOWIRE.value:
            return await self._get_rotowire_players(slate_id)
        # Add other sources...

        return []

    async def _get_draftkings_players(self, slate_id: str) -> List[PlayerData]:
        """Get player data from DraftKings"""
        try:
            data = await self._make_request(
                DataSource.DRAFTKINGS.value, f"draftgroups/{slate_id}/draftables"
            )
            if not data or "draftables" not in data:
                return []

            players = []
            for draftable in data["draftables"]:
                player_data = {
                    "id": draftable.get("playerId"),
                    "name": draftable.get("displayName"),
                    "position": draftable.get("position"),
                    "team": draftable.get("teamAbbreviation"),
                    "salary": draftable.get("salary"),
                    "projected_points": draftable.get("ppg", 0),
                }

                if self.validator.validate_player_data(player_data):
                    player = PlayerData(
                        id=str(player_data["id"]),
                        name=player_data["name"],
                        position=player_data["position"],
                        team=player_data["team"],
                        salary=int(player_data["salary"]),
                        projected_points=float(player_data["projected_points"]),
                        ownership=0.0,  # Will be updated from other sources
                        injury_status="ACTIVE",
                        news=[],
                        weather_impact=0.0,
                        matchup_rating=5.0,
                        source=DataSource.DRAFTKINGS.value,
                        timestamp=datetime.now(),
                        confidence=0.8,
                    )
                    players.append(player)

            return players

        except Exception as e:
            logger.error(f"Error getting DraftKings players: {str(e)}")
            return []

    async def _get_rotowire_players(self, slate_id: str) -> List[PlayerData]:
        """Get player data from RotoWire"""
        # Implementation for RotoWire player data
        return []

    def _merge_player_data(self, players: List[PlayerData]) -> List[PlayerData]:
        """Merge player data from multiple sources"""
        player_map = {}

        for player in players:
            key = f"{player.name}_{player.position}_{player.team}"

            if key not in player_map:
                player_map[key] = player
            else:
                # Merge data from multiple sources
                existing = player_map[key]

                # Use the most confident source for core data
                if player.confidence > existing.confidence:
                    player_map[key] = player

                # Merge news and other supplementary data
                existing.news.extend(player.news)
                existing.news = list(set(existing.news))  # Remove duplicates

        return list(player_map.values())

    async def start_live_updates(self, interval: int = 300):
        """Start live data updates"""
        logger.info(f"Starting live data updates every {interval} seconds")

        while True:
            try:
                # Update slates
                await self.get_slates()

                # Update player data for active slates
                # This would be implemented based on your specific needs

                await asyncio.sleep(interval)

            except Exception as e:
                logger.error(f"Error in live updates: {str(e)}")
                await asyncio.sleep(60)  # Wait before retrying


# Global data pipeline instance
data_pipeline = DataPipeline()


async def get_data_pipeline():
    """Get data pipeline instance"""
    if not data_pipeline.session:
        await data_pipeline.initialize()
    return data_pipeline


# Utility functions
async def get_live_slates(sport: str = "nfl") -> List[Dict[str, Any]]:
    """Get live slates with caching"""
    pipeline = await get_data_pipeline()
    slates = await pipeline.get_slates(sport)
    return [asdict(slate) for slate in slates]


async def get_live_player_data(slate_id: str) -> List[Dict[str, Any]]:
    """Get live player data with caching"""
    pipeline = await get_data_pipeline()
    players = await pipeline.get_player_data(slate_id)
    return [asdict(player) for player in players]


if __name__ == "__main__":
    # Test data pipeline
    async def test_pipeline():
        pipeline = await get_data_pipeline()
        slates = await pipeline.get_slates("nfl")
        logger.info(f"Found {len(slates)} slates")
        await pipeline.close()

    asyncio.run(test_pipeline())
