"""
Games API Routes
Provides game data including matchups, lines, and venue information
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any, Optional
import json
import asyncio
from datetime import datetime, timedelta
import logging

from ..weather_impact import WeatherConditions, WeatherImpact, get_weather_icon
from ..data_pipeline import get_data_pipeline
from ..database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/games", tags=["games"])

# Cache for games data (10 minutes)
games_cache: Dict[str, Dict[str, Any]] = {}
cache_timestamps: Dict[str, datetime] = {}
CACHE_TTL = timedelta(minutes=10)


def validate_games_schema(data: Dict[str, Any]) -> bool:
    """Validate games data against schema"""
    required_fields = ["slateId", "asOf", "games"]

    if not all(field in data for field in required_fields):
        return False

    for game in data.get("games", []):
        game_required = [
            "gameId",
            "away",
            "home",
            "kickoff",
            "spread",
            "total",
            "teamTotals",
            "venue",
        ]
        if not all(field in game for field in game_required):
            return False

        # Validate team totals sum approximately to total
        team_totals = game.get("teamTotals", {})
        if "away" in team_totals and "home" in team_totals:
            total_sum = team_totals["away"] + team_totals["home"]
            game_total = game.get("total", 0)
            if abs(total_sum - game_total) > 2:  # Allow 2 point tolerance
                logger.warning(
                    f"Team totals ({total_sum}) don't match game total ({game_total}) for game {game.get('gameId')}"
                )

    return True


async def get_games_from_mcp(slate_id: str) -> Optional[Dict[str, Any]]:
    """Get games data from MCP server"""
    try:
        pipeline = await get_data_pipeline()

        # Use MCP to get matchup data
        # This would call your DFS MCP server's get_matchups method
        mcp_data = await pipeline._make_request("dfs-mcp", f"matchups/{slate_id}")

        if not mcp_data:
            return None

        # Transform MCP data to our schema format
        games_data = {
            "slateId": slate_id,
            "asOf": datetime.utcnow().isoformat() + "Z",
            "games": [],
        }

        for matchup in mcp_data.get("matchups", []):
            game = {
                "gameId": matchup.get(
                    "gameId", f"{matchup.get('away')}@{matchup.get('home')}"
                ),
                "away": matchup.get("away"),
                "home": matchup.get("home"),
                "kickoff": matchup.get("kickoff"),
                "spread": matchup.get("spread", 0),
                "total": matchup.get("total", 0),
                "teamTotals": {
                    "away": matchup.get("awayTotal", 0),
                    "home": matchup.get("homeTotal", 0),
                },
                "venue": {
                    "stadium": matchup.get("stadium", ""),
                    "roof": matchup.get("roof", "OPEN"),
                    "city": matchup.get("city", ""),
                    "tz": matchup.get("timezone", "America/New_York"),
                },
            }

            # Add pace data if available
            if "expectedPlays" in matchup or "paceRank" in matchup:
                game["pace"] = {}
                if "expectedPlays" in matchup:
                    game["pace"]["expectedPlays"] = matchup["expectedPlays"]
                if "paceRank" in matchup:
                    game["pace"]["paceRank"] = matchup["paceRank"]

            games_data["games"].append(game)

        return games_data

    except Exception as e:
        logger.error(f"Error getting games from MCP: {str(e)}")
        return None


async def get_fallback_games_data(slate_id: str) -> Dict[str, Any]:
    """Get fallback games data when MCP is unavailable"""
    # This would typically come from your existing data sources
    # For now, return a sample structure

    return {
        "slateId": slate_id,
        "asOf": datetime.utcnow().isoformat() + "Z",
        "games": [
            {
                "gameId": "PHI@DAL",
                "away": "PHI",
                "home": "DAL",
                "kickoff": "2025-09-18T20:20:00Z",
                "spread": -3.5,
                "total": 47.5,
                "teamTotals": {"away": 22.0, "home": 25.5},
                "venue": {
                    "stadium": "AT&T Stadium",
                    "roof": "RETRACTABLE_CLOSED",
                    "city": "Arlington",
                    "tz": "America/Chicago",
                },
                "pace": {"expectedPlays": 128, "paceRank": 12},
            }
        ],
    }


@router.get("/{slate_id}")
async def get_games(slate_id: str) -> Dict[str, Any]:
    """Get games data for a slate"""

    # Check cache first
    if slate_id in games_cache and slate_id in cache_timestamps:
        if datetime.utcnow() - cache_timestamps[slate_id] < CACHE_TTL:
            return games_cache[slate_id]

    try:
        # Try to get from MCP first
        games_data = await get_games_from_mcp(slate_id)

        # Fall back to other sources if MCP fails
        if not games_data:
            logger.warning(f"MCP unavailable for slate {slate_id}, using fallback data")
            games_data = await get_fallback_games_data(slate_id)

        # Validate schema
        if not validate_games_schema(games_data):
            raise HTTPException(
                status_code=500, detail="Games data failed schema validation"
            )

        # Cache the result
        games_cache[slate_id] = games_data
        cache_timestamps[slate_id] = datetime.utcnow()

        return games_data

    except Exception as e:
        logger.error(f"Error getting games for slate {slate_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve games data: {str(e)}"
        )


@router.get("/{slate_id}/summary")
async def get_slate_summary(slate_id: str) -> Dict[str, Any]:
    """Get combined games and weather data for a slate"""

    try:
        # Get games data
        games_data = await get_games(slate_id)

        # Get weather data
        from .weather import get_weather

        weather_data = await get_weather(slate_id)

        # Combine the data
        summary = {
            "slateId": slate_id,
            "asOf": min(games_data.get("asOf", ""), weather_data.get("asOf", "")),
            "games": games_data.get("games", []),
            "weather": weather_data.get("byGame", []),
            "provenance": weather_data.get("provenance", []),
        }

        # Add weather icons to games
        weather_by_game = {w["gameId"]: w for w in weather_data.get("byGame", [])}

        for game in summary["games"]:
            game_id = game["gameId"]
            if game_id in weather_by_game:
                weather_info = weather_by_game[game_id]

                # Create weather conditions object
                weather_conditions = WeatherConditions(
                    temp_f=weather_info["tempF"],
                    wind_mph=weather_info["windMph"],
                    precip=weather_info["precip"],
                    is_dome=weather_info["isDome"],
                    impact=WeatherImpact(weather_info["impact"]),
                    summary=weather_info["summary"],
                )

                # Add weather icon
                game["weatherIcon"] = get_weather_icon(weather_conditions)
                game["weatherSummary"] = weather_info["summary"]

        return summary

    except Exception as e:
        logger.error(f"Error getting slate summary for {slate_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve slate summary: {str(e)}"
        )


@router.post("/{slate_id}/refresh")
async def refresh_games_cache(slate_id: str) -> Dict[str, Any]:
    """Force refresh of games cache for a slate"""

    try:
        # Clear cache
        if slate_id in games_cache:
            del games_cache[slate_id]
        if slate_id in cache_timestamps:
            del cache_timestamps[slate_id]

        # Get fresh data
        games_data = await get_games(slate_id)

        return {
            "success": True,
            "message": f"Games cache refreshed for slate {slate_id}",
            "asOf": games_data.get("asOf"),
            "gameCount": len(games_data.get("games", [])),
        }

    except Exception as e:
        logger.error(f"Error refreshing games cache for {slate_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to refresh games cache: {str(e)}"
        )


@router.get("/{slate_id}/validate")
async def validate_games_data(slate_id: str) -> Dict[str, Any]:
    """Validate games data for a slate"""

    try:
        games_data = await get_games(slate_id)

        validation_results = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "gameCount": len(games_data.get("games", [])),
            "asOf": games_data.get("asOf"),
        }

        # Validate each game
        for i, game in enumerate(games_data.get("games", [])):
            game_id = game.get("gameId", f"Game {i+1}")

            # Check team totals vs game total
            team_totals = game.get("teamTotals", {})
            if "away" in team_totals and "home" in team_totals:
                total_sum = team_totals["away"] + team_totals["home"]
                game_total = game.get("total", 0)

                if abs(total_sum - game_total) > 2:
                    validation_results["warnings"].append(
                        f"{game_id}: Team totals ({total_sum}) don't match game total ({game_total})"
                    )

            # Check for required fields
            required_fields = ["away", "home", "kickoff", "spread", "total"]
            for field in required_fields:
                if field not in game or game[field] is None:
                    validation_results["errors"].append(
                        f"{game_id}: Missing required field '{field}'"
                    )
                    validation_results["valid"] = False

            # Check kickoff time format
            try:
                datetime.fromisoformat(game.get("kickoff", "").replace("Z", "+00:00"))
            except ValueError:
                validation_results["errors"].append(
                    f"{game_id}: Invalid kickoff time format"
                )
                validation_results["valid"] = False

        return validation_results

    except Exception as e:
        logger.error(f"Error validating games data for {slate_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to validate games data: {str(e)}"
        )
