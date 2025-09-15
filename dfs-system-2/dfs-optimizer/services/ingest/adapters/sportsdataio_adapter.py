"""
SportsDataIO Data Adapter
Comprehensive sports data API with DFS projections, ownership, and statistics
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
class SportsDataIOConfig:
    """Configuration for SportsDataIO adapter"""
    base_url: str = "https://api.sportsdata.io/v2/json"
    api_key: Optional[str] = None
    timeout: int = 30
    retries: int = 3
    rate_limit_delay: float = 1.0

class SportsDataIOAdapter:
    """Adapter for SportsDataIO sports data"""

    def __init__(self, config: Optional[SportsDataIOConfig] = None):
        self.config = config or SportsDataIOConfig()
        if not self.config.api_key:
            self.config.api_key = os.getenv("SPORTSDATAIO_API_KEY")
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        headers = {"Ocp-Apim-Subscription-Key": self.config.api_key} if self.config.api_key else {}
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
            logger.error("SportsDataIO API key not configured")
            return None

        url = f"{self.config.base_url}{endpoint}"

        # Add API key to params if not in headers
        if params is None:
            params = {}
        params["key"] = self.config.api_key

        for attempt in range(self.config.retries):
            try:
                if not self.session:
                    self.session = aiohttp.ClientSession(
                        timeout=aiohttp.ClientTimeout(total=self.config.timeout)
                    )

                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        return await response.json()
                    elif response.status == 401 or response.status == 403:
                        logger.error("Invalid SportsDataIO API key")
                        return None
                    elif response.status == 429:
                        wait_time = 2 ** attempt
                        logger.warning(f"Rate limited, waiting {wait_time}s")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.error(f"SportsDataIO API error: HTTP {response.status}")
                        return None

            except Exception as e:
                logger.error(f"Request failed (attempt {attempt + 1}): {e}")
                if attempt < self.config.retries - 1:
                    await asyncio.sleep(2 ** attempt)
                continue

        return None

    async def get_nfl_games(self, season: Optional[str] = None) -> List[Game]:
        """Get NFL games for current/upcoming week"""
        logger.info(f"Fetching NFL games from SportsDataIO (season: {season})")

        if not season:
            # Get current season
            current_year = datetime.now().year
            season = str(current_year)

        # SportsDataIO provides comprehensive game data
        data = await self._make_request(f"/nfl/v2/json/GamesBySeason/{season}")

        if not data:
            logger.warning("No NFL games found from SportsDataIO")
            return []

        games = []
        for game_data in data:
            try:
                game = self._parse_game_data(game_data, "NFL")
                if game:
                    games.append(game)
            except Exception as e:
                logger.error(f"Failed to parse game {game_data.get('GameKey', 'unknown')}: {e}")
                continue

        logger.info(f"Successfully parsed {len(games)} NFL games")
        return games

    async def get_nfl_players(self) -> List[Player]:
        """Get NFL players with basic info"""
        logger.info("Fetching NFL players from SportsDataIO")

        # Get active players
        data = await self._make_request("/nfl/v2/json/Players")

        if not data:
            logger.warning("No NFL players found from SportsDataIO")
            return []

        players = []
        for player_data in data:
            try:
                player = self._parse_player_data(player_data, "NFL")
                if player:
                    players.append(player)
            except Exception as e:
                logger.error(f"Failed to parse player {player_data.get('Name', 'unknown')}: {e}")
                continue

        logger.info(f"Successfully parsed {len(players)} NFL players")
        return players

    async def get_nfl_dfs_projections(self, week: Optional[int] = None) -> List[Player]:
        """Get NFL DFS projections and salaries"""
        logger.info(f"Fetching NFL DFS projections from SportsDataIO (week: {week})")

        if not week:
            # Calculate current week
            week = self._get_current_nfl_week()

        # SportsDataIO provides DFS-specific data
        data = await self._make_request(f"/nfl/v2/json/DailyFantasyPoints/{week}")

        if not data:
            logger.warning("No NFL DFS projections found from SportsDataIO")
            return []

        players = []
        for player_data in data:
            try:
                player = self._parse_dfs_player_data(player_data, "NFL", week)
                if player:
                    players.append(player)
            except Exception as e:
                logger.error(f"Failed to parse DFS player {player_data.get('Name', 'unknown')}: {e}")
                continue

        logger.info(f"Successfully parsed {len(players)} NFL DFS players")
        return players

    async def get_nba_games(self, season: Optional[str] = None) -> List[Game]:
        """Get NBA games for current/upcoming days"""
        logger.info(f"Fetching NBA games from SportsDataIO (season: {season})")

        if not season:
            current_year = datetime.now().year
            season = str(current_year)

        data = await self._make_request(f"/nba/v2/json/GamesBySeason/{season}")

        if not data:
            logger.warning("No NBA games found from SportsDataIO")
            return []

        games = []
        for game_data in data:
            try:
                game = self._parse_game_data(game_data, "NBA")
                if game:
                    games.append(game)
            except Exception as e:
                logger.error(f"Failed to parse game {game_data.get('GameID', 'unknown')}: {e}")
                continue

        logger.info(f"Successfully parsed {len(games)} NBA games")
        return games

    async def get_nba_players(self) -> List[Player]:
        """Get NBA players with basic info"""
        logger.info("Fetching NBA players from SportsDataIO")

        data = await self._make_request("/nba/v2/json/Players")

        if not data:
            logger.warning("No NBA players found from SportsDataIO")
            return []

        players = []
        for player_data in data:
            try:
                player = self._parse_player_data(player_data, "NBA")
                if player:
                    players.append(player)
            except Exception as e:
                logger.error(f"Failed to parse player {player_data.get('Name', 'unknown')}: {e}")
                continue

        logger.info(f"Successfully parsed {len(players)} NBA players")
        return players

    async def get_nba_dfs_projections(self, season: Optional[str] = None) -> List[Player]:
        """Get NBA DFS projections"""
        logger.info(f"Fetching NBA DFS projections from SportsDataIO (season: {season})")

        if not season:
            current_year = datetime.now().year
            season = str(current_year)

        # SportsDataIO NBA DFS data
        data = await self._make_request(f"/nba/v2/json/DailyFantasyPoints/{season}")

        if not data:
            logger.warning("No NBA DFS projections found from SportsDataIO")
            return []

        players = []
        for player_data in data:
            try:
                player = self._parse_dfs_player_data(player_data, "NBA", season)
                if player:
                    players.append(player)
            except Exception as e:
                logger.error(f"Failed to parse DFS player {player_data.get('Name', 'unknown')}: {e}")
                continue

        logger.info(f"Successfully parsed {len(players)} NBA DFS players")
        return players

    def _parse_game_data(self, data: Dict, sport: str) -> Optional[Game]:
        """Parse SportsDataIO game data"""
        try:
            if sport == "NFL":
                game_id = str(data.get("GameKey", ""))
                home_team = data.get("HomeTeam", "")
                away_team = data.get("AwayTeam", "")
                start_time = data.get("DateTime", "")
                total = data.get("OverUnder", 0)
                spread = data.get("PointSpread", 0)
            else:  # NBA
                game_id = str(data.get("GameID", ""))
                home_team = data.get("HomeTeam", "")
                away_team = data.get("AwayTeam", "")
                start_time = data.get("DateTime", "")
                total = data.get("OverUnder", 0)
                spread = data.get("PointSpread", 0)

            if not game_id or not home_team or not away_team:
                return None

            game = Game(
                gameId=f"sdi_{sport.lower()}_{game_id}",
                home=home_team,
                away=away_team,
                startTime=start_time,
                total=total if total > 0 else None,
                spread=spread if spread != 0 else None,
                weather=None  # Would need separate weather API
            )

            return game

        except Exception as e:
            logger.error(f"Error parsing game data: {e}")
            return None

    def _parse_player_data(self, data: Dict, sport: str) -> Optional[Player]:
        """Parse basic SportsDataIO player data"""
        try:
            player_id = str(data.get("PlayerID", ""))
            name = data.get("Name", "").strip()
            team = data.get("Team", "")
            position = data.get("Position", "UNK")

            if not player_id or not name or not team:
                return None

            player = Player(
                playerId=f"sdi_{player_id}",
                name=name,
                team=team,
                pos=[position],
                site=Site.DK,  # Default to DK for DFS context
                sport=Sport.NFL if sport == "NFL" else Sport.NBA,
                slateId=f"sdi_{sport.lower()}_main",
                salary=0,  # Not provided in basic player data
                projection=0,  # Not provided in basic player data
                status="ACTIVE"
            )

            return player

        except Exception as e:
            logger.error(f"Error parsing player data: {e}")
            return None

    def _parse_dfs_player_data(self, data: Dict, sport: str, week_or_season: Any) -> Optional[Player]:
        """Parse SportsDataIO DFS player data with projections"""
        try:
            player_id = str(data.get("PlayerID", ""))
            name = data.get("Name", "").strip()
            team = data.get("Team", "")
            position = data.get("Position", "UNK")

            if not player_id or not name or not team:
                return None

            # DFS-specific data
            salary = data.get("Salary", 0)
            projection = data.get("FantasyPoints", data.get("FantasyPointsDraftKings", 0))
            ownership = data.get("OwnershipPercentage", 0) / 100  # Convert from percentage

            # Calculate derived metrics
            value = projection / (salary / 1000) if salary > 0 else 0
            leverage = self._calculate_leverage_score(data, ownership)
            boom = data.get("BoomPercentage", 25) / 100  # Convert from percentage

            player = Player(
                playerId=f"sdi_{player_id}",
                name=name,
                team=team,
                pos=[position],
                site=Site.DK,
                sport=Sport.NFL if sport == "NFL" else Sport.NBA,
                slateId=f"sdi_{sport.lower()}_week_{week_or_season}",
                salary=salary,
                projection=projection,
                ownership=ownership,
                value=value,
                leverage=leverage,
                boom=boom,
                status="ACTIVE"
            )

            return player

        except Exception as e:
            logger.error(f"Error parsing DFS player data: {e}")
            return None

    def _calculate_leverage_score(self, data: Dict, ownership: float) -> float:
        """Calculate leverage score for SportsDataIO data"""
        base_score = 1.0

        # Ownership-based leverage
        if ownership < 0.10:  # Low ownership stud
            base_score += 0.5
        elif ownership > 0.30:  # High ownership chalk
            base_score -= 0.3

        # Value-based leverage
        value = data.get("Value", 0)
        if value > 2.0:  # Great value
            base_score += 0.3
        elif value < 1.0:  # Poor value
            base_score -= 0.2

        return max(0.5, min(2.5, base_score))

    def _get_current_nfl_week(self) -> int:
        """Calculate current NFL week"""
        # Simple calculation - in practice you'd use NFL schedule
        current_date = datetime.now()
        season_start = datetime(current_date.year, 9, 1)  # Approximate NFL start

        if current_date < season_start:
            return 1

        days_since_start = (current_date - season_start).days
        week = (days_since_start // 7) + 1

        return min(max(week, 1), 18)  # NFL has 18 weeks

    async def get_player_stats(self, player_id: str, sport: str, season: Optional[str] = None) -> Optional[Dict]:
        """Get detailed player statistics"""
        logger.info(f"Fetching stats for {sport} player {player_id}")

        if not season:
            season = str(datetime.now().year)

        endpoint = f"/{sport.lower()}/v2/json/PlayerSeasonStats/{season}"
        data = await self._make_request(endpoint)

        if not data:
            return None

        # Find the specific player
        for player_stats in data:
            if str(player_stats.get("PlayerID", "")) == player_id.replace("sdi_", ""):
                return player_stats

        return None

    async def get_team_stats(self, team: str, sport: str, season: Optional[str] = None) -> Optional[Dict]:
        """Get team statistics"""
        logger.info(f"Fetching stats for {sport} team {team}")

        if not season:
            season = str(datetime.now().year)

        endpoint = f"/{sport.lower()}/v2/json/TeamSeasonStats/{season}"
        data = await self._make_request(endpoint)

        if not data:
            return None

        # Find the specific team
        for team_stats in data:
            if team_stats.get("Team", "").upper() == team.upper():
                return team_stats

        return None

# Convenience functions
async def get_sdi_nfl_games(season: Optional[str] = None) -> List[Game]:
    """Get NFL games from SportsDataIO"""
    async with SportsDataIOAdapter() as adapter:
        return await adapter.get_nfl_games(season)

async def get_sdi_nfl_dfs_projections(week: Optional[int] = None) -> List[Player]:
    """Get NFL DFS projections from SportsDataIO"""
    async with SportsDataIOAdapter() as adapter:
        return await adapter.get_nfl_dfs_projections(week)

async def get_sdi_nba_games(season: Optional[str] = None) -> List[Game]:
    """Get NBA games from SportsDataIO"""
    async with SportsDataIOAdapter() as adapter:
        return await adapter.get_nba_games(season)

async def get_sdi_nba_dfs_projections(season: Optional[str] = None) -> List[Player]:
    """Get NBA DFS projections from SportsDataIO"""
    async with SportsDataIOAdapter() as adapter:
        return await adapter.get_nba_dfs_projections(season)
