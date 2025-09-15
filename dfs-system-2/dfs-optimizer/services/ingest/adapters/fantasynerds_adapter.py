"""
FantasyNerds Data Adapter
Official DFS data provider with projections, salaries, and ownership
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import aiohttp
from dataclasses import dataclass

from ...packages.shared.types import Player, Game, Slate, Site, Sport

logger = logging.getLogger(__name__)

@dataclass
class FantasyNerdsConfig:
    """Configuration for FantasyNerds adapter"""
    base_url: str = "https://api.fantasynerds.com/v1"
    api_key: Optional[str] = None
    timeout: int = 30
    retries: int = 3
    rate_limit_delay: float = 1.0

class FantasyNerdsAdapter:
    """Adapter for FantasyNerds DFS data"""

    def __init__(self, config: Optional[FantasyNerdsConfig] = None):
        self.config = config or FantasyNerdsConfig()
        if not self.config.api_key:
            self.config.api_key = os.getenv("FANTASYNERDS_API_KEY")
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        headers = {"Authorization": f"Bearer {self.config.api_key}"} if self.config.api_key else {}
        self.session = aiohttp.ClientSession(
            headers=headers,
            timeout=aiohttp.ClientTimeout(total=self.config.timeout)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Make authenticated API request"""
        if not self.config.api_key:
            logger.error("FantasyNerds API key not configured")
            return None

        url = f"{self.config.base_url}{endpoint}"

        for attempt in range(self.config.retries):
            try:
                if not self.session:
                    headers = {"Authorization": f"Bearer {self.config.api_key}"}
                    self.session = aiohttp.ClientSession(
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=self.config.timeout)
                    )

                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status == 401:
                        logger.error("Invalid FantasyNerds API key")
                        return None
                    elif response.status == 429:
                        wait_time = 2 ** attempt
                        logger.warning(f"Rate limited, waiting {wait_time}s")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.error(f"FantasyNerds API error: HTTP {response.status}")
                        return None

            except Exception as e:
                logger.error(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < self.config.retries - 1:
                    await asyncio.sleep(2 ** attempt)
                continue

        return None

    async def get_nfl_slates(self) -> List[Dict]:
        """Get available NFL slates"""
        logger.info("Fetching NFL slates from FantasyNerds")

        # FantasyNerds provides DFS-specific endpoints
        data = await self._make_request("/nfl/dfs-slates")

        if not data or "slates" not in data:
            logger.warning("No NFL slates found from FantasyNerds")
            return []

        slates = []
        for slate_data in data["slates"]:
            slate = {
                "slateId": f"fn_nfl_{slate_data.get('id', 'unknown')}",
                "name": slate_data.get("name", "NFL Slate"),
                "sport": "NFL",
                "startTime": slate_data.get("start_time"),
                "games": slate_data.get("game_count", 0),
                "totalPlayers": slate_data.get("player_count", 0),
                "site": "draftkings"  # FantasyNerds focuses on DK/FD
            }
            slates.append(slate)

        return slates

    async def get_nfl_players(self, slate_id: Optional[str] = None) -> List[Player]:
        """Get NFL player projections and salaries"""
        logger.info(f"Fetching NFL players from FantasyNerds (slate: {slate_id})")

        # Get player data - FantasyNerds provides comprehensive DFS data
        data = await self._make_request("/nfl/players", {"slate": slate_id})

        if not data or "players" not in data:
            logger.warning("No NFL players found from FantasyNerds")
            return []

        players = []
        for player_data in data["players"]:
            try:
                player = self._parse_player_data(player_data, "NFL", slate_id)
                if player:
                    players.append(player)
            except Exception as e:
                logger.error(f"Failed to parse player {player_data.get('name', 'unknown')}: {e}")
                continue

        logger.info(f"Successfully parsed {len(players)} NFL players")
        return players

    async def get_nba_slates(self) -> List[Dict]:
        """Get available NBA slates"""
        logger.info("Fetching NBA slates from FantasyNerds")

        data = await self._make_request("/nba/dfs-slates")

        if not data or "slates" not in data:
            logger.warning("No NBA slates found from FantasyNerds")
            return []

        slates = []
        for slate_data in data["slates"]:
            slate = {
                "slateId": f"fn_nba_{slate_data.get('id', 'unknown')}",
                "name": slate_data.get("name", "NBA Slate"),
                "sport": "NBA",
                "startTime": slate_data.get("start_time"),
                "games": slate_data.get("game_count", 0),
                "totalPlayers": slate_data.get("player_count", 0),
                "site": "draftkings"
            }
            slates.append(slate)

        return slates

    async def get_nba_players(self, slate_id: Optional[str] = None) -> List[Player]:
        """Get NBA player projections and salaries"""
        logger.info(f"Fetching NBA players from FantasyNerds (slate: {slate_id})")

        data = await self._make_request("/nba/players", {"slate": slate_id})

        if not data or "players" not in data:
            logger.warning("No NBA players found from FantasyNerds")
            return []

        players = []
        for player_data in data["players"]:
            try:
                player = self._parse_player_data(player_data, "NBA", slate_id)
                if player:
                    players.append(player)
            except Exception as e:
                logger.error(f"Failed to parse player {player_data.get('name', 'unknown')}: {e}")
                continue

        logger.info(f"Successfully parsed {len(players)} NBA players")
        return players

    def _parse_player_data(self, data: Dict, sport: str, slate_id: Optional[str]) -> Optional[Player]:
        """Parse FantasyNerds player data into our Player type"""
        try:
            # Extract basic info
            player_id = str(data.get("id", data.get("player_id", "")))
            name = data.get("name", "").strip()
            if not player_id or not name:
                return None

            # Position and team
            position = data.get("position", "UNK")
            team = data.get("team", "UNK")
            opponent = data.get("opponent", data.get("opp"))

            # Salary and projection data
            salary = data.get("salary", 0)
            projection = data.get("projection", data.get("fantasy_points", 0))

            # Advanced metrics
            ownership = data.get("ownership", data.get("projected_ownership"))
            ceiling = data.get("ceiling", data.get("high", projection * 1.3))
            floor = data.get("floor", data.get("low", projection * 0.7))
            std_dev = data.get("std_dev", data.get("volatility", 0))

            # Calculate derived metrics
            value = projection / (salary / 1000) if salary > 0 else 0
            leverage = self._calculate_leverage_score(data)
            boom = data.get("boom_rate", data.get("boom_pct", 0.25))

            player = Player(
                playerId=f"fn_{player_id}",
                name=name,
                team=team,
                opp=opponent,
                pos=[position],
                site=Site.DK,  # FantasyNerds focuses on DK
                sport=Sport.NFL if sport == "NFL" else Sport.NBA,
                slateId=slate_id or f"fn_{sport.lower()}_main",
                salary=salary,
                projection=projection,
                stdev=std_dev,
                ceiling=ceiling,
                floor=floor,
                ownership=ownership,
                value=value,
                leverage=leverage,
                boom=boom,
                status=data.get("status", "ACTIVE")
            )

            return player

        except Exception as e:
            logger.error(f"Error parsing player data: {e}")
            return None

    def _calculate_leverage_score(self, data: Dict) -> float:
        """Calculate leverage score based on various factors"""
        base_score = 1.0

        # Ownership-based leverage
        ownership = data.get("ownership", 0.15)
        if ownership < 0.10:  # Low ownership stud
            base_score += 0.5
        elif ownership > 0.30:  # High ownership chalk
            base_score -= 0.3

        # Projection rank vs salary rank
        proj_rank = data.get("projection_rank", 50)
        salary_rank = data.get("salary_rank", 50)
        if proj_rank < salary_rank:  # Better projection than salary suggests
            base_score += (salary_rank - proj_rank) / 100

        # Recent form bonus
        recent_form = data.get("recent_form", 0.5)
        base_score += (recent_form - 0.5) * 0.4

        return max(0.5, min(2.5, base_score))

    async def get_player_projections(self, player_ids: List[str], sport: str) -> Dict[str, Dict]:
        """Get detailed projections for specific players"""
        logger.info(f"Fetching detailed projections for {len(player_ids)} {sport} players")

        # FantasyNerds provides detailed player analysis
        projections = {}

        for player_id in player_ids:
            try:
                # Remove 'fn_' prefix if present
                clean_id = player_id.replace("fn_", "")

                endpoint = f"/{sport.lower()}/players/{clean_id}/projections"
                data = await self._make_request(endpoint)

                if data and "projections" in data:
                    projections[player_id] = data["projections"]

            except Exception as e:
                logger.error(f"Failed to get projections for player {player_id}: {e}")
                continue

        return projections

    async def get_ownership_data(self, sport: str, slate_id: Optional[str] = None) -> Dict[str, float]:
        """Get ownership projections for all players"""
        logger.info(f"Fetching ownership data for {sport}")

        params = {"slate": slate_id} if slate_id else {}
        data = await self._make_request(f"/{sport.lower()}/ownership", params)

        if not data or "ownership" not in data:
            return {}

        ownership = {}
        for player_data in data["ownership"]:
            player_id = f"fn_{player_data.get('player_id', '')}"
            projected_own = player_data.get("projected_ownership", 0.15)
            ownership[player_id] = projected_own

        return ownership

# Convenience functions
async def get_fn_nfl_players(slate_id: Optional[str] = None) -> List[Player]:
    """Get NFL players from FantasyNerds"""
    async with FantasyNerdsAdapter() as adapter:
        return await adapter.get_nfl_players(slate_id)

async def get_fn_nba_players(slate_id: Optional[str] = None) -> List[Player]:
    """Get NBA players from FantasyNerds"""
    async with FantasyNerdsAdapter() as adapter:
        return await adapter.get_nba_players(slate_id)

async def get_fn_slates(sport: str) -> List[Dict]:
    """Get available slates from FantasyNerds"""
    async with FantasyNerdsAdapter() as adapter:
        if sport.upper() == "NFL":
            return await adapter.get_nfl_slates()
        elif sport.upper() == "NBA":
            return await adapter.get_nba_slates()
        else:
            return []
