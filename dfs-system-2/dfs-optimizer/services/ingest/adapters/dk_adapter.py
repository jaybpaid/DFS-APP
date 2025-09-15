"""
DraftKings Data Adapter
Handles unofficial DraftKings API endpoints for slate and player data
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import aiohttp
import requests
from dataclasses import dataclass
from urllib.parse import urljoin

from ...packages.shared.types import Player, Game, Slate, Site, Sport

logger = logging.getLogger(__name__)

@dataclass
class DKAdapterConfig:
    """Configuration for DK adapter"""
    base_url: str = "https://api.draftkings.com"
    timeout: int = 30
    retries: int = 3
    rate_limit_delay: float = 1.0
    user_agent: str = "Mozilla/5.0 (compatible; DFS-Optimizer/1.0)"

class DKAdapter:
    """Adapter for DraftKings data sources"""

    def __init__(self, config: Optional[DKAdapterConfig] = None):
        self.config = config or DKAdapterConfig()
        self.session: Optional[aiohttp.ClientSession] = None
        self.last_request_time = 0

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={"User-Agent": self.config.user_agent},
            timeout=aiohttp.ClientTimeout(total=self.config.timeout)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def _rate_limit(self):
        """Enforce rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.config.rate_limit_delay:
            time.sleep(self.config.rate_limit_delay - elapsed)
        self.last_request_time = time.time()

    async def _make_request(self, url: str, method: str = "GET", **kwargs) -> Optional[Dict]:
        """Make HTTP request with retry logic"""
        for attempt in range(self.config.retries):
            try:
                self._rate_limit()

                if not self.session:
                    self.session = aiohttp.ClientSession(
                        headers={"User-Agent": self.config.user_agent},
                        timeout=aiohttp.ClientTimeout(total=self.config.timeout)
                    )

                async with self.session.request(method, url, **kwargs) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status == 429:  # Rate limited
                        wait_time = 2 ** attempt  # Exponential backoff
                        logger.warning(f"Rate limited, waiting {wait_time}s")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.error(f"HTTP {response.status} for {url}")
                        return None

            except Exception as e:
                logger.error(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < self.config.retries - 1:
                    await asyncio.sleep(2 ** attempt)
                continue

        return None

    async def get_available_slates(self, sport: str = "NFL") -> List[Dict]:
        """Get available slates for a sport"""
        # This is a mock implementation since DK endpoints are unofficial
        # In practice, you'd reverse-engineer their API calls

        logger.info(f"Fetching available {sport} slates from DraftKings")

        # Mock data - replace with actual API calls
        mock_slates = [
            {
                "slateId": f"dk_{sport.lower()}_main",
                "name": f"{sport} Main Slate",
                "sport": sport,
                "startTime": (datetime.now() + timedelta(days=1)).isoformat(),
                "games": 16 if sport == "NFL" else 10,
                "totalPlayers": 150 if sport == "NFL" else 120
            }
        ]

        return mock_slates

    async def get_slate_players(self, slate_id: str) -> List[Player]:
        """Get all players for a specific slate"""
        logger.info(f"Fetching players for slate {slate_id}")

        # Mock implementation - replace with actual DK API calls
        # In practice, this would call endpoints like:
        # - DraftGroups endpoint for slate metadata
        # - Draftables endpoint for player data

        sport = "NFL" if "nfl" in slate_id else "NBA"

        mock_players = self._generate_mock_players(slate_id, sport)
        return mock_players

    async def get_slate_games(self, slate_id: str) -> List[Game]:
        """Get games for a specific slate"""
        logger.info(f"Fetching games for slate {slate_id}")

        sport = "NFL" if "nfl" in slate_id else "NBA"

        mock_games = self._generate_mock_games(slate_id, sport)
        return mock_games

    async def get_slate_data(self, slate_id: str) -> Optional[Slate]:
        """Get complete slate data including players and games"""
        try:
            logger.info(f"Fetching complete slate data for {slate_id}")

            # In parallel, fetch players and games
            players_task = self.get_slate_players(slate_id)
            games_task = self.get_slate_games(slate_id)

            players, games = await asyncio.gather(players_task, games_task)

            if not players or not games:
                return None

            # Determine sport from slate_id
            sport = "NFL" if "nfl" in slate_id else "NBA"
            sport_enum = Sport.NFL if sport == "NFL" else Sport.NBA

            slate = Slate(
                slateId=slate_id,
                site=Site.DK,
                sport=sport_enum,
                label=f"{sport} Main Slate",
                games=games,
                players=players
            )

            return slate

        except Exception as e:
            logger.error(f"Failed to get slate data for {slate_id}: {e}")
            return None

    def _generate_mock_players(self, slate_id: str, sport: str) -> List[Player]:
        """Generate mock player data for testing"""
        if sport == "NFL":
            return self._generate_nfl_players(slate_id)
        elif sport == "NBA":
            return self._generate_nba_players(slate_id)
        else:
            return []

    def _generate_nfl_players(self, slate_id: str) -> List[Player]:
        """Generate mock NFL players"""
        players_data = [
            ("Josh Allen", "QB", "BUF", "MIA", 8500, 24.5),
            ("Patrick Mahomes", "QB", "KC", "LAC", 8200, 23.1),
            ("Christian McCaffrey", "RB", "SF", "NYG", 9200, 22.1),
            ("Austin Ekeler", "RB", "LAC", "KC", 7800, 18.7),
            ("Tyreek Hill", "WR", "MIA", "BUF", 7800, 18.7),
            ("Davante Adams", "WR", "LV", "DEN", 7600, 17.8),
            ("Travis Kelce", "TE", "KC", "LAC", 6200, 14.3),
            ("Buffalo Bills", "DST", "BUF", "MIA", 3800, 11.2),
        ]

        players = []
        for name, pos, team, opp, salary, proj in players_data:
            player = Player(
                playerId=f"dk_{name.lower().replace(' ', '_')}",
                name=name,
                team=team,
                opp=opp,
                pos=[pos],
                site=Site.DK,
                sport=Sport.NFL,
                slateId=slate_id,
                salary=salary,
                projection=proj,
                status="ACTIVE",
                ownership=0.15 + (salary / 10000) * 0.3,  # Mock ownership
                value=proj / (salary / 1000),
                leverage=1.2 + (salary / 10000) * 0.5,
                boom=0.25 + (salary / 10000) * 0.2
            )
            players.append(player)

        return players

    def _generate_nba_players(self, slate_id: str) -> List[Player]:
        """Generate mock NBA players"""
        players_data = [
            ("Luka Doncic", "PG", "DAL", "LAL", 10800, 55.2),
            ("Nikola Jokic", "C", "DEN", "GSW", 10500, 52.8),
            ("Giannis Antetokounmpo", "PF", "MIL", "BOS", 10200, 51.1),
            ("Joel Embiid", "C", "PHI", "BKN", 10100, 49.7),
            ("Stephen Curry", "PG", "GSW", "DEN", 9800, 47.3),
        ]

        players = []
        for name, pos, team, opp, salary, proj in players_data:
            player = Player(
                playerId=f"dk_{name.lower().replace(' ', '_')}",
                name=name,
                team=team,
                opp=opp,
                pos=[pos],
                site=Site.DK,
                sport=Sport.NBA,
                slateId=slate_id,
                salary=salary,
                projection=proj,
                status="ACTIVE",
                ownership=0.20 + (salary / 10000) * 0.4,
                value=proj / (salary / 1000),
                leverage=1.3 + (salary / 10000) * 0.6,
                boom=0.30 + (salary / 10000) * 0.25
            )
            players.append(player)

        return players

    def _generate_mock_games(self, slate_id: str, sport: str) -> List[Game]:
        """Generate mock game data"""
        if sport == "NFL":
            games_data = [
                ("BUF", "MIA", "2025-09-14T20:15:00Z", 43.5, 6.5),
                ("KC", "LAC", "2025-09-14T20:05:00Z", 47.0, 3.5),
                ("SF", "NYG", "2025-09-14T16:25:00Z", 42.0, 2.5),
                ("LV", "DEN", "2025-09-14T16:05:00Z", 44.5, 1.5),
            ]
        else:  # NBA
            games_data = [
                ("DAL", "LAL", "2025-09-14T19:30:00Z", 220.5, 3.5),
                ("DEN", "GSW", "2025-09-14T19:00:00Z", 225.0, 2.5),
                ("MIL", "BOS", "2025-09-14T17:30:00Z", 218.0, 4.5),
                ("PHI", "BKN", "2025-09-14T15:30:00Z", 216.5, 1.5),
            ]

        games = []
        for home, away, start_time, total, spread in games_data:
            game = Game(
                gameId=f"dk_{home}_{away}",
                home=home,
                away=away,
                startTime=start_time,
                total=total,
                spread=spread,
                weather=None  # Could be populated from weather API
            )
            games.append(game)

        return games

# Convenience functions
async def get_dk_slate(slate_id: str) -> Optional[Slate]:
    """Get a complete DraftKings slate"""
    async with DKAdapter() as adapter:
        return await adapter.get_slate_data(slate_id)

async def get_dk_slates(sport: str = "NFL") -> List[Dict]:
    """Get available DraftKings slates for a sport"""
    async with DKAdapter() as adapter:
        return await adapter.get_available_slates(sport)
