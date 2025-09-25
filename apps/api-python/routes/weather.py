"""
Weather API Routes
Provides weather data for games with impact calculations
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

router = APIRouter(prefix="/weather", tags=["weather"])

# Cache for weather data (10 minutes)
weather_cache: Dict[str, Dict[str, Any]] = {}
cache_timestamps: Dict[str, datetime] = {}
CACHE_TTL = timedelta(minutes=10)


def validate_weather_schema(data: Dict[str, Any]) -> bool:
    """Validate weather data against schema"""
    required_fields = ["slateId", "asOf", "byGame"]

    if not all(field in data for field in required_fields):
        return False

    for weather in data.get("byGame", []):
        weather_required = [
            "gameId",
            "tempF",
            "windMph",
            "precip",
            "impact",
            "summary",
            "isDome",
        ]
        if not all(field in weather for field in weather_required):
            return False

        # Validate numeric ranges
        if not (0 <= weather.get("precip", -1) <= 1):
            logger.warning(f"Invalid precipitation value: {weather.get('precip')}")
            return False

        if weather.get("windMph", -1) < 0:
            logger.warning(f"Invalid wind speed: {weather.get('windMph')}")
            return False

        # Validate impact enum
        if weather.get("impact") not in ["NONE", "MINOR", "MODERATE", "MAJOR"]:
            logger.warning(f"Invalid impact level: {weather.get('impact')}")
            return False

    return True


async def get_weather_from_mcp(slate_id: str) -> Optional[Dict[str, Any]]:
    """Get weather data from MCP server"""
    try:
        pipeline = await get_data_pipeline()

        # Use MCP to get weather data
        # This would call your DFS MCP server's get_weather method
        mcp_data = await pipeline._make_request("dfs-mcp", f"weather/{slate_id}")

        if not mcp_data:
            return None

        # Transform MCP data to our schema format
        weather_data = {
            "slateId": slate_id,
            "asOf": datetime.utcnow().isoformat() + "Z",
            "provenance": mcp_data.get("sources", ["dfs-mcp"]),
            "byGame": [],
        }

        for game_weather in mcp_data.get("weather", []):
            weather_entry = {
                "gameId": game_weather.get("gameId"),
                "tempF": game_weather.get("temperature", 70),
                "windMph": game_weather.get("windSpeed", 0),
                "precip": game_weather.get("precipitationChance", 0)
                / 100.0,  # Convert percentage to decimal
                "impact": game_weather.get("impact", "NONE"),
                "summary": game_weather.get("summary", "Clear conditions"),
                "isDome": game_weather.get("isDome", False),
            }

            # Add optional details if available
            if "details" in game_weather:
                details = game_weather["details"]
                weather_entry["details"] = {
                    "humidity": details.get("humidity"),
                    "windDirection": details.get("windDirection"),
                    "visibility": details.get("visibility"),
                    "conditions": details.get("conditions", []),
                }

            # Add forecast if available
            if "forecast" in game_weather:
                weather_entry["forecast"] = game_weather["forecast"]

            weather_data["byGame"].append(weather_entry)

        return weather_data

    except Exception as e:
        logger.error(f"Error getting weather from MCP: {str(e)}")
        return None


async def get_fallback_weather_data(slate_id: str) -> Dict[str, Any]:
    """Get fallback weather data when MCP is unavailable"""
    # This would typically come from your existing weather sources
    # For now, return a sample structure

    return {
        "slateId": slate_id,
        "asOf": datetime.utcnow().isoformat() + "Z",
        "provenance": ["fallback"],
        "byGame": [
            {
                "gameId": "PHI@DAL",
                "tempF": 72,
                "windMph": 0,
                "precip": 0.0,
                "impact": "NONE",
                "summary": "Indoor game",
                "isDome": True,
                "details": {
                    "humidity": 45,
                    "windDirection": "N/A",
                    "visibility": 10,
                    "conditions": ["CLEAR"],
                },
            }
        ],
    }


@router.get("/{slate_id}")
async def get_weather(slate_id: str) -> Dict[str, Any]:
    """Get weather data for a slate"""

    # Check cache first
    if slate_id in weather_cache and slate_id in cache_timestamps:
        if datetime.utcnow() - cache_timestamps[slate_id] < CACHE_TTL:
            return weather_cache[slate_id]

    try:
        # Try to get from MCP first
        weather_data = await get_weather_from_mcp(slate_id)

        # Fall back to other sources if MCP fails
        if not weather_data:
            logger.warning(
                f"MCP unavailable for weather {slate_id}, using fallback data"
            )
            weather_data = await get_fallback_weather_data(slate_id)

        # Validate schema
        if not validate_weather_schema(weather_data):
            raise HTTPException(
                status_code=500, detail="Weather data failed schema validation"
            )

        # Cache the result
        weather_cache[slate_id] = weather_data
        cache_timestamps[slate_id] = datetime.utcnow()

        return weather_data

    except Exception as e:
        logger.error(f"Error getting weather for slate {slate_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve weather data: {str(e)}"
        )


@router.get("/{slate_id}/impact")
async def get_weather_impact(slate_id: str) -> Dict[str, Any]:
    """Get weather impact analysis for a slate"""

    try:
        weather_data = await get_weather(slate_id)

        impact_analysis = {
            "slateId": slate_id,
            "asOf": weather_data.get("asOf"),
            "summary": {
                "totalGames": len(weather_data.get("byGame", [])),
                "domeGames": 0,
                "weatherImpactGames": 0,
                "highImpactGames": 0,
            },
            "gameImpacts": [],
        }

        for game_weather in weather_data.get("byGame", []):
            game_impact = {
                "gameId": game_weather["gameId"],
                "isDome": game_weather["isDome"],
                "impact": game_weather["impact"],
                "summary": game_weather["summary"],
                "weatherIcon": get_weather_icon(
                    WeatherConditions(
                        temp_f=game_weather["tempF"],
                        wind_mph=game_weather["windMph"],
                        precip=game_weather["precip"],
                        is_dome=game_weather["isDome"],
                        impact=WeatherImpact(game_weather["impact"]),
                        summary=game_weather["summary"],
                    )
                ),
                "factors": [],
            }

            # Analyze impact factors
            if game_weather["isDome"]:
                impact_analysis["summary"]["domeGames"] += 1
                game_impact["factors"].append(
                    "Dome boost for passing offense and kickers"
                )
            else:
                if game_weather["windMph"] >= 15:
                    game_impact["factors"].append(
                        f"Wind {game_weather['windMph']}mph affects passing"
                    )
                    impact_analysis["summary"]["weatherImpactGames"] += 1

                if game_weather["precip"] >= 0.25:
                    precip_desc = (
                        "Heavy rain" if game_weather["precip"] >= 0.6 else "Rain"
                    )
                    game_impact["factors"].append(
                        f"{precip_desc} affects ball handling"
                    )
                    impact_analysis["summary"]["weatherImpactGames"] += 1

                if game_weather["tempF"] <= 32:
                    game_impact["factors"].append(
                        f"Cold {game_weather['tempF']}°F affects performance"
                    )
                    impact_analysis["summary"]["weatherImpactGames"] += 1

            if game_weather["impact"] in ["MODERATE", "MAJOR"]:
                impact_analysis["summary"]["highImpactGames"] += 1

            impact_analysis["gameImpacts"].append(game_impact)

        return impact_analysis

    except Exception as e:
        logger.error(f"Error getting weather impact for slate {slate_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve weather impact: {str(e)}"
        )


@router.post("/{slate_id}/refresh")
async def refresh_weather_cache(slate_id: str) -> Dict[str, Any]:
    """Force refresh of weather cache for a slate"""

    try:
        # Clear cache
        if slate_id in weather_cache:
            del weather_cache[slate_id]
        if slate_id in cache_timestamps:
            del cache_timestamps[slate_id]

        # Get fresh data
        weather_data = await get_weather(slate_id)

        return {
            "success": True,
            "message": f"Weather cache refreshed for slate {slate_id}",
            "asOf": weather_data.get("asOf"),
            "gameCount": len(weather_data.get("byGame", [])),
            "provenance": weather_data.get("provenance", []),
        }

    except Exception as e:
        logger.error(f"Error refreshing weather cache for {slate_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to refresh weather cache: {str(e)}"
        )


@router.get("/{slate_id}/validate")
async def validate_weather_data(slate_id: str) -> Dict[str, Any]:
    """Validate weather data for a slate"""

    try:
        weather_data = await get_weather(slate_id)

        validation_results = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "gameCount": len(weather_data.get("byGame", [])),
            "asOf": weather_data.get("asOf"),
            "provenance": weather_data.get("provenance", []),
        }

        # Validate each game's weather
        for i, weather in enumerate(weather_data.get("byGame", [])):
            game_id = weather.get("gameId", f"Game {i+1}")

            # Check required fields
            required_fields = [
                "tempF",
                "windMph",
                "precip",
                "impact",
                "summary",
                "isDome",
            ]
            for field in required_fields:
                if field not in weather or weather[field] is None:
                    validation_results["errors"].append(
                        f"{game_id}: Missing required field '{field}'"
                    )
                    validation_results["valid"] = False

            # Validate ranges
            if "precip" in weather:
                precip = weather["precip"]
                if not (0 <= precip <= 1):
                    validation_results["errors"].append(
                        f"{game_id}: Precipitation must be between 0 and 1, got {precip}"
                    )
                    validation_results["valid"] = False

            if "windMph" in weather:
                wind = weather["windMph"]
                if wind < 0:
                    validation_results["errors"].append(
                        f"{game_id}: Wind speed cannot be negative, got {wind}"
                    )
                    validation_results["valid"] = False
                elif wind > 50:
                    validation_results["warnings"].append(
                        f"{game_id}: Unusually high wind speed: {wind}mph"
                    )

            if "tempF" in weather:
                temp = weather["tempF"]
                if temp < -20 or temp > 120:
                    validation_results["warnings"].append(
                        f"{game_id}: Extreme temperature: {temp}°F"
                    )

            # Validate impact enum
            if "impact" in weather:
                if weather["impact"] not in ["NONE", "MINOR", "MODERATE", "MAJOR"]:
                    validation_results["errors"].append(
                        f"{game_id}: Invalid impact level '{weather['impact']}'"
                    )
                    validation_results["valid"] = False

        return validation_results

    except Exception as e:
        logger.error(f"Error validating weather data for {slate_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to validate weather data: {str(e)}"
        )


@router.get("/{slate_id}/icons")
async def get_weather_icons(slate_id: str) -> Dict[str, Any]:
    """Get weather icons for all games in a slate"""

    try:
        weather_data = await get_weather(slate_id)

        icons = {"slateId": slate_id, "asOf": weather_data.get("asOf"), "icons": {}}

        for game_weather in weather_data.get("byGame", []):
            weather_conditions = WeatherConditions(
                temp_f=game_weather["tempF"],
                wind_mph=game_weather["windMph"],
                precip=game_weather["precip"],
                is_dome=game_weather["isDome"],
                impact=WeatherImpact(game_weather["impact"]),
                summary=game_weather["summary"],
            )

            icons["icons"][game_weather["gameId"]] = {
                "icon": get_weather_icon(weather_conditions),
                "summary": game_weather["summary"],
                "isDome": game_weather["isDome"],
            }

        return icons

    except Exception as e:
        logger.error(f"Error getting weather icons for slate {slate_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve weather icons: {str(e)}"
        )
