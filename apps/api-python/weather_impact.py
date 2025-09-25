"""
Weather Impact System for DFS Optimizer
Calculates weather-based adjustments to player projections and provides impact indicators
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class WeatherImpact(Enum):
    NONE = "NONE"
    MINOR = "MINOR"
    MODERATE = "MODERATE"
    MAJOR = "MAJOR"


class Position(Enum):
    QB = "QB"
    RB = "RB"
    WR = "WR"
    TE = "TE"
    K = "K"
    DST = "DST"


@dataclass
class WeatherConditions:
    temp_f: float
    wind_mph: float
    precip: float  # 0.0 to 1.0
    is_dome: bool
    impact: WeatherImpact
    summary: str


@dataclass
class PlayerWeatherImpact:
    player_id: str
    position: str
    projection_modifier: float  # Percentage change (e.g., -0.05 for -5%)
    impact_tag: str  # UI display tag
    impact_description: str  # Tooltip description
    confidence: float  # 0.0 to 1.0


class WeatherImpactCalculator:
    """Calculates weather impact on player performance"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or self._default_config()

    def _default_config(self) -> Dict[str, Any]:
        """Default weather impact configuration"""
        return {
            # Dome boosts (percentage)
            "dome_boost": {
                "QB": 0.005,  # +0.5%
                "WR": 0.005,  # +0.5%
                "TE": 0.005,  # +0.5%
                "RB": 0.002,  # +0.2%
                "K": 0.01,  # +1.0%
                "DST": 0.0,  # No change
            },
            # Wind impact thresholds and multipliers
            "wind_thresholds": {
                "light": 10,  # 10-15 mph
                "moderate": 15,  # 15-20 mph
                "strong": 20,  # 20-25 mph
                "severe": 25,  # 25+ mph
            },
            "wind_impact": {
                "QB": {
                    "light": -0.01,  # -1%
                    "moderate": -0.02,  # -2%
                    "strong": -0.035,  # -3.5%
                    "severe": -0.05,  # -5%
                },
                "WR": {
                    "light": -0.01,
                    "moderate": -0.025,
                    "strong": -0.04,
                    "severe": -0.055,
                },
                "TE": {
                    "light": -0.005,
                    "moderate": -0.015,
                    "strong": -0.025,
                    "severe": -0.035,
                },
                "RB": {
                    "light": 0.002,  # Slight boost
                    "moderate": 0.005,
                    "strong": 0.008,
                    "severe": 0.01,
                },
                "K": {
                    "light": -0.02,
                    "moderate": -0.05,
                    "strong": -0.08,
                    "severe": -0.12,
                },
                "DST": {
                    "light": 0.01,  # More turnovers
                    "moderate": 0.02,
                    "strong": 0.03,
                    "severe": 0.04,
                },
            },
            # Precipitation impact
            "precip_impact": {
                "light_rain": 0.25,  # 25% chance
                "moderate_rain": 0.5,  # 50% chance
                "heavy_rain": 0.75,  # 75% chance
            },
            "rain_multipliers": {
                "QB": {
                    "light_rain": -0.015,
                    "moderate_rain": -0.025,
                    "heavy_rain": -0.04,
                },
                "WR": {
                    "light_rain": -0.02,
                    "moderate_rain": -0.03,
                    "heavy_rain": -0.045,
                },
                "TE": {
                    "light_rain": -0.01,
                    "moderate_rain": -0.02,
                    "heavy_rain": -0.03,
                },
                "RB": {"light_rain": 0.01, "moderate_rain": 0.015, "heavy_rain": 0.02},
                "K": {"light_rain": -0.03, "moderate_rain": -0.05, "heavy_rain": -0.08},
                "DST": {
                    "light_rain": 0.015,
                    "moderate_rain": 0.025,
                    "heavy_rain": 0.035,
                },
            },
            # Temperature impact
            "temp_thresholds": {
                "very_cold": 15,  # Below 15°F
                "cold": 25,  # 15-25°F
                "cool": 40,  # 25-40°F
                "hot": 85,  # Above 85°F
                "very_hot": 95,  # Above 95°F
            },
            "temp_multipliers": {
                "very_cold": {
                    "QB": -0.025,
                    "WR": -0.02,
                    "TE": -0.015,
                    "RB": -0.005,
                    "K": -0.08,
                    "DST": 0.01,
                },
                "cold": {
                    "QB": -0.015,
                    "WR": -0.01,
                    "TE": -0.008,
                    "RB": 0.0,
                    "K": -0.05,
                    "DST": 0.005,
                },
                "hot": {
                    "QB": -0.005,
                    "WR": -0.005,
                    "TE": -0.005,
                    "RB": -0.01,
                    "K": 0.0,
                    "DST": 0.0,
                },
                "very_hot": {
                    "QB": -0.01,
                    "WR": -0.01,
                    "TE": -0.01,
                    "RB": -0.02,
                    "K": -0.005,
                    "DST": 0.005,
                },
            },
            # Impact level multipliers
            "impact_multipliers": {"MINOR": 0.5, "MODERATE": 1.0, "MAJOR": 1.5},
            # Safety limits
            "max_negative_impact": -0.15,  # -15% max
            "max_positive_impact": 0.10,  # +10% max
        }

    def calculate_weather_impact(
        self, player_id: str, position: str, weather: WeatherConditions
    ) -> PlayerWeatherImpact:
        """Calculate weather impact for a single player"""

        total_modifier = 0.0
        impact_factors = []

        # Dome boost
        if weather.is_dome:
            dome_boost = self.config["dome_boost"].get(position, 0.0)
            total_modifier += dome_boost
            if dome_boost > 0:
                impact_factors.append(f"Dome +{dome_boost*100:.1f}%")

        # Wind impact
        if not weather.is_dome and weather.wind_mph > 0:
            wind_modifier = self._calculate_wind_impact(position, weather.wind_mph)
            total_modifier += wind_modifier
            if abs(wind_modifier) > 0.005:  # Only show significant impacts
                sign = "+" if wind_modifier > 0 else ""
                impact_factors.append(
                    f"Wind {weather.wind_mph:.0f}mph {sign}{wind_modifier*100:.1f}%"
                )

        # Precipitation impact
        if not weather.is_dome and weather.precip > 0.1:
            rain_modifier = self._calculate_rain_impact(position, weather.precip)
            total_modifier += rain_modifier
            if abs(rain_modifier) > 0.005:
                sign = "+" if rain_modifier > 0 else ""
                rain_desc = self._get_rain_description(weather.precip)
                impact_factors.append(f"{rain_desc} {sign}{rain_modifier*100:.1f}%")

        # Temperature impact
        if not weather.is_dome:
            temp_modifier = self._calculate_temp_impact(position, weather.temp_f)
            total_modifier += temp_modifier
            if abs(temp_modifier) > 0.005:
                sign = "+" if temp_modifier > 0 else ""
                impact_factors.append(
                    f"{weather.temp_f:.0f}°F {sign}{temp_modifier*100:.1f}%"
                )

        # Apply impact level multiplier
        impact_multiplier = self.config["impact_multipliers"].get(
            weather.impact.value, 1.0
        )
        total_modifier *= impact_multiplier

        # Apply safety limits
        total_modifier = max(
            self.config["max_negative_impact"],
            min(self.config["max_positive_impact"], total_modifier),
        )

        # Generate impact tag and description
        impact_tag = self._generate_impact_tag(total_modifier, impact_factors, weather)
        impact_description = self._generate_impact_description(impact_factors, weather)

        # Calculate confidence based on weather certainty
        confidence = self._calculate_confidence(weather)

        return PlayerWeatherImpact(
            player_id=player_id,
            position=position,
            projection_modifier=total_modifier,
            impact_tag=impact_tag,
            impact_description=impact_description,
            confidence=confidence,
        )

    def _calculate_wind_impact(self, position: str, wind_mph: float) -> float:
        """Calculate wind impact for a position"""
        wind_config = self.config["wind_impact"].get(position, {})
        thresholds = self.config["wind_thresholds"]

        if wind_mph >= thresholds["severe"]:
            return wind_config.get("severe", 0.0)
        elif wind_mph >= thresholds["strong"]:
            return wind_config.get("strong", 0.0)
        elif wind_mph >= thresholds["moderate"]:
            return wind_config.get("moderate", 0.0)
        elif wind_mph >= thresholds["light"]:
            return wind_config.get("light", 0.0)
        else:
            return 0.0

    def _calculate_rain_impact(self, position: str, precip: float) -> float:
        """Calculate precipitation impact for a position"""
        rain_config = self.config["rain_multipliers"].get(position, {})

        if precip >= self.config["precip_impact"]["heavy_rain"]:
            return rain_config.get("heavy_rain", 0.0)
        elif precip >= self.config["precip_impact"]["moderate_rain"]:
            return rain_config.get("moderate_rain", 0.0)
        elif precip >= self.config["precip_impact"]["light_rain"]:
            return rain_config.get("light_rain", 0.0)
        else:
            return 0.0

    def _calculate_temp_impact(self, position: str, temp_f: float) -> float:
        """Calculate temperature impact for a position"""
        thresholds = self.config["temp_thresholds"]
        temp_config = self.config["temp_multipliers"]

        if temp_f <= thresholds["very_cold"]:
            return temp_config["very_cold"].get(position, 0.0)
        elif temp_f <= thresholds["cold"]:
            return temp_config["cold"].get(position, 0.0)
        elif temp_f >= thresholds["very_hot"]:
            return temp_config["very_hot"].get(position, 0.0)
        elif temp_f >= thresholds["hot"]:
            return temp_config["hot"].get(position, 0.0)
        else:
            return 0.0

    def _get_rain_description(self, precip: float) -> str:
        """Get rain description from precipitation probability"""
        if precip >= self.config["precip_impact"]["heavy_rain"]:
            return "Heavy Rain"
        elif precip >= self.config["precip_impact"]["moderate_rain"]:
            return "Rain"
        else:
            return "Light Rain"

    def _generate_impact_tag(
        self, modifier: float, factors: List[str], weather: WeatherConditions
    ) -> str:
        """Generate a concise impact tag for UI display"""
        if weather.is_dome:
            return "Dome"

        if abs(modifier) < 0.005:
            return ""

        # Use the most significant factor
        if factors:
            primary_factor = factors[0]
            if "Wind" in primary_factor:
                return f"Wind {weather.wind_mph:.0f}mph"
            elif "Rain" in primary_factor:
                return self._get_rain_description(weather.precip)
            elif "°F" in primary_factor:
                if weather.temp_f <= 25:
                    return "Cold"
                elif weather.temp_f >= 85:
                    return "Hot"

        return f"{modifier*100:+.1f}%"

    def _generate_impact_description(
        self, factors: List[str], weather: WeatherConditions
    ) -> str:
        """Generate detailed impact description for tooltips"""
        if weather.is_dome:
            return "Indoor game - passing offense boost, kicker accuracy boost"

        if not factors:
            return "No significant weather impact"

        base_desc = f"Weather: {weather.summary}"
        if factors:
            impact_desc = " | ".join(factors)
            return f"{base_desc} | Impact: {impact_desc}"

        return base_desc

    def _calculate_confidence(self, weather: WeatherConditions) -> float:
        """Calculate confidence in weather impact assessment"""
        base_confidence = 0.8

        # Dome games have high confidence
        if weather.is_dome:
            return 0.95

        # Reduce confidence for extreme conditions (harder to predict)
        if weather.wind_mph > 25 or weather.precip > 0.8 or weather.temp_f < 10:
            base_confidence -= 0.2

        # Impact level affects confidence
        impact_confidence = {
            WeatherImpact.NONE: 0.9,
            WeatherImpact.MINOR: 0.8,
            WeatherImpact.MODERATE: 0.7,
            WeatherImpact.MAJOR: 0.6,
        }

        return min(base_confidence, impact_confidence.get(weather.impact, 0.7))


def apply_weather_impact_to_players(
    players: List[Dict[str, Any]],
    weather_by_game: Dict[str, WeatherConditions],
    config: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Apply weather impact to a list of players"""

    calculator = WeatherImpactCalculator(config)
    updated_players = []

    for player in players:
        game_id = player.get("game_id")
        if not game_id or game_id not in weather_by_game:
            # No weather data available
            updated_players.append({**player, "weather_impact": None})
            continue

        weather = weather_by_game[game_id]
        impact = calculator.calculate_weather_impact(
            player["id"], player["position"], weather
        )

        # Apply projection modifier
        original_projection = player.get("projected_points", 0)
        adjusted_projection = original_projection * (1 + impact.projection_modifier)

        updated_players.append(
            {
                **player,
                "projected_points": adjusted_projection,
                "original_projection": original_projection,
                "weather_impact": {
                    "modifier": impact.projection_modifier,
                    "tag": impact.impact_tag,
                    "description": impact.impact_description,
                    "confidence": impact.confidence,
                },
            }
        )

    return updated_players


def get_weather_icon(weather: WeatherConditions) -> str:
    """Get weather icon identifier for UI"""
    if weather.is_dome:
        return "dome"

    if weather.wind_mph >= 20:
        return "wind_strong"
    elif weather.precip >= 0.60:
        return "rain_heavy"
    elif weather.precip >= 0.25:
        return "rain"
    elif weather.temp_f <= 25:
        return "cold"
    else:
        return "clear"


# Example usage and testing
if __name__ == "__main__":
    # Test weather impact calculation
    calculator = WeatherImpactCalculator()

    # Test dome game
    dome_weather = WeatherConditions(
        temp_f=72,
        wind_mph=0,
        precip=0.0,
        is_dome=True,
        impact=WeatherImpact.NONE,
        summary="Indoor game",
    )

    qb_impact = calculator.calculate_weather_impact("1", "QB", dome_weather)
    print(
        f"Dome QB Impact: {qb_impact.projection_modifier*100:.1f}% - {qb_impact.impact_tag}"
    )

    # Test windy game
    windy_weather = WeatherConditions(
        temp_f=45,
        wind_mph=22,
        precip=0.1,
        is_dome=False,
        impact=WeatherImpact.MODERATE,
        summary="22mph crosswind",
    )

    qb_wind_impact = calculator.calculate_weather_impact("2", "QB", windy_weather)
    print(
        f"Windy QB Impact: {qb_wind_impact.projection_modifier*100:.1f}% - {qb_wind_impact.impact_tag}"
    )

    rb_wind_impact = calculator.calculate_weather_impact("3", "RB", windy_weather)
    print(
        f"Windy RB Impact: {rb_wind_impact.projection_modifier*100:.1f}% - {rb_wind_impact.impact_tag}"
    )
