"""
Data Merger Service
Combines and normalizes data from multiple sources with conflict resolution
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict

from ...packages.shared.types import Player, Game, Slate, Site, Sport
from .adapters.dk_adapter import get_dk_slate
from .adapters.fantasynerds_adapter import get_fn_nfl_players, get_fn_nba_players
from .adapters.sportsdataio_adapter import get_sdi_nfl_dfs_projections, get_sdi_nba_dfs_projections

logger = logging.getLogger(__name__)

class DataMerger:
    """Merges and normalizes data from multiple sources"""

    def __init__(self):
        self.source_weights = {
            'fantasynerds': 0.4,  # High quality DFS data
            'sportsdataio': 0.3,  # Comprehensive stats
            'draftkings': 0.3,    # Official salaries
        }

    async def merge_slate_data(self, sport: str, slate_id: Optional[str] = None) -> Optional[Slate]:
        """Merge slate data from all available sources"""
        logger.info(f"Merging {sport} slate data (slate_id: {slate_id})")

        try:
            # Fetch data from all sources in parallel
            tasks = []

            if sport.upper() == "NFL":
                tasks.extend([
                    self._get_dk_nfl_data(slate_id),
                    self._get_fn_nfl_data(slate_id),
                    self._get_sdi_nfl_data(slate_id),
                ])
            elif sport.upper() == "NBA":
                tasks.extend([
                    self._get_dk_nba_data(slate_id),
                    self._get_fn_nba_data(slate_id),
                    self._get_sdi_nba_data(slate_id),
                ])
            else:
                logger.error(f"Unsupported sport: {sport}")
                return None

            # Wait for all data sources
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results and merge
            all_players = []
            all_games = []

            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.warning(f"Data source {i} failed: {result}")
                    continue

                if result:
                    source_players, source_games = result
                    all_players.extend(source_players or [])
                    all_games.extend(source_games or [])

            if not all_players:
                logger.error("No player data available from any source")
                return None

            # Merge and deduplicate players
            merged_players = self._merge_players(all_players)

            # Merge and deduplicate games
            merged_games = self._merge_games(all_games)

            # Create merged slate
            sport_enum = Sport.NFL if sport.upper() == "NFL" else Sport.NBA
            final_slate_id = slate_id or f"merged_{sport.lower()}_main"

            slate = Slate(
                slateId=final_slate_id,
                site=Site.DK,  # Default to DK for DFS context
                sport=sport_enum,
                label=f"Merged {sport} Slate",
                games=merged_games,
                players=merged_players
            )

            logger.info(f"Successfully merged slate with {len(merged_players)} players and {len(merged_games)} games")
            return slate

        except Exception as e:
            logger.error(f"Failed to merge slate data: {e}")
            return None

    async def _get_dk_nfl_data(self, slate_id: Optional[str]) -> Tuple[List[Player], List[Game]]:
        """Get NFL data from DraftKings"""
        try:
            final_slate_id = slate_id or "dk_nfl_main"
            slate = await get_dk_slate(final_slate_id)
            if slate:
                return slate.players, slate.games
            return [], []
        except Exception as e:
            logger.error(f"DK NFL data fetch failed: {e}")
            return [], []

    async def _get_fn_nfl_data(self, slate_id: Optional[str]) -> Tuple[List[Player], List[Game]]:
        """Get NFL data from FantasyNerds"""
        try:
            players = await get_fn_nfl_players(slate_id)
            return players, []  # FantasyNerds doesn't provide game data
        except Exception as e:
            logger.error(f"FantasyNerds NFL data fetch failed: {e}")
            return [], []

    async def _get_sdi_nfl_data(self, slate_id: Optional[str]) -> Tuple[List[Player], List[Game]]:
        """Get NFL data from SportsDataIO"""
        try:
            # Extract week from slate_id if present
            week = None
            if slate_id and "week" in slate_id:
                try:
                    week = int(slate_id.split("_")[-1])
                except:
                    pass

            players = await get_sdi_nfl_dfs_projections(week)
            return players, []  # Games would need separate call
        except Exception as e:
            logger.error(f"SportsDataIO NFL data fetch failed: {e}")
            return [], []

    async def _get_dk_nba_data(self, slate_id: Optional[str]) -> Tuple[List[Player], List[Game]]:
        """Get NBA data from DraftKings"""
        try:
            final_slate_id = slate_id or "dk_nba_main"
            slate = await get_dk_slate(final_slate_id)
            if slate:
                return slate.players, slate.games
            return [], []
        except Exception as e:
            logger.error(f"DK NBA data fetch failed: {e}")
            return [], []

    async def _get_fn_nba_data(self, slate_id: Optional[str]) -> Tuple[List[Player], List[Game]]:
        """Get NBA data from FantasyNerds"""
        try:
            players = await get_fn_nba_players(slate_id)
            return players, []
        except Exception as e:
            logger.error(f"FantasyNerds NBA data fetch failed: {e}")
            return [], []

    async def _get_sdi_nba_data(self, slate_id: Optional[str]) -> Tuple[List[Player], List[Game]]:
        """Get NBA data from SportsDataIO"""
        try:
            season = str(datetime.now().year)
            players = await get_sdi_nba_dfs_projections(season)
            return players, []
        except Exception as e:
            logger.error(f"SportsDataIO NBA data fetch failed: {e}")
            return [], []

    def _merge_players(self, players: List[Player]) -> List[Player]:
        """Merge and deduplicate players from multiple sources"""
        # Group players by name and team (fuzzy matching)
        player_groups = defaultdict(list)

        for player in players:
            # Create a key for grouping (name + team + position)
            key = f"{player.name.lower()}_{player.team}_{player.pos[0] if player.pos else 'UNK'}"
            player_groups[key].append(player)

        merged_players = []

        for group_key, group_players in player_groups.items():
            if len(group_players) == 1:
                # Only one source, use as-is
                merged_players.append(group_players[0])
            else:
                # Multiple sources, merge data
                merged_player = self._merge_player_group(group_players)
                if merged_player:
                    merged_players.append(merged_player)

        logger.info(f"Merged {len(players)} raw players into {len(merged_players)} unique players")
        return merged_players

    def _merge_player_group(self, players: List[Player]) -> Optional[Player]:
        """Merge a group of players from different sources"""
        if not players:
            return None

        # Use the first player as base
        base_player = players[0]

        # Collect data from all sources
        salaries = []
        projections = []
        ownerships = []
        values = []
        leverages = []
        booms = []

        source_count = 0

        for player in players:
            if player.salary and player.salary > 0:
                salaries.append((player.salary, self._get_source_weight(player.playerId)))
            if player.projection and player.projection > 0:
                projections.append((player.projection, self._get_source_weight(player.playerId)))
            if player.ownership and player.ownership > 0:
                ownerships.append((player.ownership, self._get_source_weight(player.playerId)))
            if player.value and player.value > 0:
                values.append((player.value, self._get_source_weight(player.playerId)))
            if player.leverage and player.leverage > 0:
                leverages.append((player.leverage, self._get_source_weight(player.playerId)))
            if player.boom and player.boom > 0:
                booms.append((player.boom, self._get_source_weight(player.playerId)))
            source_count += 1

        # Weighted averages
        merged_salary = self._weighted_average(salaries) if salaries else base_player.salary
        merged_projection = self._weighted_average(projections) if projections else base_player.projection
        merged_ownership = self._weighted_average(ownerships) if ownerships else base_player.ownership
        merged_value = self._weighted_average(values) if values else base_player.value
        merged_leverage = self._weighted_average(leverages) if leverages else base_player.leverage
        merged_boom = self._weighted_average(booms) if booms else base_player.boom

        # Recalculate value if we have both projection and salary
        if merged_projection and merged_salary and merged_salary > 0:
            merged_value = merged_projection / (merged_salary / 1000)

        # Create merged player
        merged_player = Player(
            playerId=f"merged_{base_player.name.lower().replace(' ', '_')}_{base_player.team}",
            name=base_player.name,
            team=base_player.team,
            opp=base_player.opp,
            pos=base_player.pos,
            site=base_player.site,
            sport=base_player.sport,
            slateId=base_player.slateId,
            salary=int(merged_salary) if merged_salary else 0,
            projection=round(merged_projection, 1) if merged_projection else 0,
            ownership=round(merged_ownership, 3) if merged_ownership else None,
            value=round(merged_value, 2) if merged_value else None,
            leverage=round(merged_leverage, 2) if merged_leverage else None,
            boom=round(merged_boom, 2) if merged_boom else None,
            status=base_player.status
        )

        return merged_player

    def _merge_games(self, games: List[Game]) -> List[Game]:
        """Merge and deduplicate games"""
        # Simple deduplication by home-away teams
        game_map = {}

        for game in games:
            key = f"{game.home}_{game.away}"
            if key not in game_map:
                game_map[key] = game

        return list(game_map.values())

    def _get_source_weight(self, player_id: str) -> float:
        """Get weight for a data source based on player ID prefix"""
        if player_id.startswith("fn_"):
            return self.source_weights.get("fantasynerds", 0.4)
        elif player_id.startswith("sdi_"):
            return self.source_weights.get("sportsdataio", 0.3)
        elif player_id.startswith("dk_"):
            return self.source_weights.get("draftkings", 0.3)
        else:
            return 0.3  # Default weight

    def _weighted_average(self, values_weights: List[Tuple[float, float]]) -> float:
        """Calculate weighted average"""
        if not values_weights:
            return 0

        total_weight = sum(weight for _, weight in values_weights)
        if total_weight == 0:
            return sum(value for value, _ in values_weights) / len(values_weights)

        weighted_sum = sum(value * weight for value, weight in values_weights)
        return weighted_sum / total_weight

    async def get_merged_projections(self, sport: str, player_ids: Optional[List[str]] = None) -> Dict[str, Dict]:
        """Get merged projections for specific players"""
        logger.info(f"Getting merged projections for {len(player_ids) if player_ids else 'all'} {sport} players")

        # This would fetch detailed projections from multiple sources
        # For now, return empty dict as placeholder
        return {}

# Convenience functions
async def merge_slate_data(sport: str, slate_id: Optional[str] = None) -> Optional[Slate]:
    """Merge slate data from all sources"""
    merger = DataMerger()
    return await merger.merge_slate_data(sport, slate_id)

async def get_merged_projections(sport: str, player_ids: Optional[List[str]] = None) -> Dict[str, Dict]:
    """Get merged projections"""
    merger = DataMerger()
    return await merger.get_merged_projections(sport, player_ids)
