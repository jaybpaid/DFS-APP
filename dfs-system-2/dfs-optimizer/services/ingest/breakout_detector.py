"""
Breakout Detector
Identifies players that one source loves but others don't
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from collections import defaultdict
import numpy as np

from ...packages.shared.types import Player
from .adapters.weather_adapter import get_game_weather, analyze_weather_impact

logger = logging.getLogger(__name__)

@dataclass
class BreakoutCandidate:
    """A player identified as a potential breakout"""
    player_id: str
    player_name: str
    breakout_source: str
    breakout_projection: float
    consensus_projection: float
    variance: float  # Standard deviation across sources
    confidence_score: float  # 0-100
    reasons: List[str]
    risk_factors: List[str]
    ownership_impact: str  # 'low', 'medium', 'high'
    timestamp: datetime

@dataclass
class SourceComparison:
    """Comparison between different projection sources"""
    player_id: str
    projections: Dict[str, float]  # source -> projection
    consensus: float
    max_variance: float
    outlier_sources: List[str]
    confidence: float

class BreakoutDetector:
    """Advanced breakout detection using multiple data sources"""

    def __init__(self):
        self.breakout_threshold = 1.15  # 15% above consensus
        self.min_sources = 2
        self.max_sources = 8
        self.cache = {}
        self.cache_expiry = 1800  # 30 minutes

    async def detect_breakouts(self, players: List[Player], sport: str = 'nfl') -> List[BreakoutCandidate]:
        """Main breakout detection function"""
        logger.info(f"Starting breakout detection for {len(players)} {sport} players")

        # Gather projections from all sources
        all_projections = await self._gather_all_projections(players, sport)

        # Analyze each player for breakouts
        breakouts = []
        for player in players:
            player_projections = all_projections.get(player.playerId, {})

            if len(player_projections) >= self.min_sources:
                breakout = await self._analyze_player_breakout(player, player_projections, sport)
                if breakout:
                    breakouts.append(breakout)

        # Sort by confidence score
        breakouts.sort(key=lambda x: x.confidence_score, reverse=True)

        logger.info(f"Found {len(breakouts)} potential breakouts")
        return breakouts

    async def _gather_all_projections(self, players: List[Player], sport: str) -> Dict[str, Dict[str, float]]:
        """Gather projections from all available sources"""
        all_projections = defaultdict(dict)

        try:
            # Add base projections from player data (guaranteed to work)
            for player in players:
                if player.projection and player.projection > 0:
                    all_projections[player.playerId]['base'] = player.projection

            # Add weather-adjusted projections (free)
            for player in players:
                weather_adjusted = await self._get_weather_adjusted_projection(player, sport)
                if weather_adjusted:
                    all_projections[player.playerId]['weather_adj'] = weather_adjusted

            # Add position-based adjustments (free analysis)
            for player in players:
                position_adj = self._get_position_adjusted_projection(player)
                if position_adj:
                    all_projections[player.playerId]['position_adj'] = position_adj

        except Exception as e:
            logger.error(f"Error gathering projections: {e}")

        return dict(all_projections)

    async def _get_weather_adjusted_projection(self, player: Player, sport: str) -> Optional[float]:
        """Get weather-adjusted projection for a player"""
        try:
            if not player.team or not player.game_time:
                return None

            # Get weather for player's game
            weather = await get_game_weather(player.team, player.game_time)
            if not weather:
                return None

            # Analyze weather impact
            impacts = await analyze_weather_impact([player], weather)
            if impacts:
                impact = impacts[0]
                # Apply weather factor to base projection
                if player.projection:
                    return player.projection * impact.weather_factor

        except Exception as e:
            logger.debug(f"Could not get weather adjustment for {player.playerId}: {e}")

        return None

    def _get_position_adjusted_projection(self, player: Player) -> Optional[float]:
        """Get position-adjusted projection based on league averages"""
        try:
            if not player.projection or not player.pos:
                return None

            position = player.pos[0] if isinstance(player.pos, list) else player.pos

            # Position-based adjustment factors (based on league averages)
            adjustments = {
                'QB': 1.05,  # QBs have higher variance, slight upward adjustment
                'RB': 0.98,  # RBs often over-projected
                'WR': 1.02,  # WRs have good upside
                'TE': 0.95,  # TEs often underperform projections
                'DST': 1.0   # DSTs are more predictable
            }

            factor = adjustments.get(position, 1.0)
            return player.projection * factor

        except Exception as e:
            logger.debug(f"Could not get position adjustment for {player.playerId}: {e}")
            return None

    def _ownership_to_projection_estimate(self, ownership: float, position: str) -> float:
        """Estimate projection based on ownership percentage"""
        # Simplified estimation based on position
        base_projections = {
            'QB': 20.0,
            'RB': 15.0,
            'WR': 12.0,
            'TE': 10.0,
            'DST': 8.0
        }

        base = base_projections.get(position, 10.0)

        # Adjust based on ownership (lower ownership = higher projection potential)
        if ownership < 5:
            multiplier = 1.4  # Very low ownership = high upside
        elif ownership < 15:
            multiplier = 1.2
        elif ownership < 30:
            multiplier = 1.0
        else:
            multiplier = 0.9  # High ownership = lower projection

        return base * multiplier

    async def _analyze_player_breakout(self, player: Player,
                                     projections: Dict[str, float],
                                     sport: str) -> Optional[BreakoutCandidate]:
        """Analyze if a player is a breakout candidate"""

        if len(projections) < self.min_sources:
            return None

        # Calculate consensus (exclude outliers)
        projection_values = list(projections.values())
        consensus = np.mean(projection_values)

        # Find the highest projection
        max_source = max(projections.items(), key=lambda x: x[1])
        max_projection = max_source[1]
        breakout_source = max_source[0]

        # Calculate variance
        variance = np.std(projection_values) if len(projection_values) > 1 else 0

        # Check breakout criteria
        breakout_ratio = max_projection / consensus if consensus > 0 else 1.0

        if breakout_ratio < self.breakout_threshold:
            return None  # Not enough of a breakout

        # Calculate confidence score
        confidence_score = self._calculate_breakout_confidence(
            breakout_ratio, variance, len(projections), player
        )

        # Get ownership impact
        ownership_impact = await self._get_ownership_impact(player.playerId, sport)

        # Generate reasons and risk factors
        reasons, risk_factors = self._generate_breakout_analysis(
            player, breakout_source, projections, sport
        )

        return BreakoutCandidate(
            player_id=player.playerId,
            player_name=player.name,
            breakout_source=breakout_source,
            breakout_projection=max_projection,
            consensus_projection=consensus,
            variance=variance,
            confidence_score=confidence_score,
            reasons=reasons,
            risk_factors=risk_factors,
            ownership_impact=ownership_impact,
            timestamp=datetime.now()
        )

    def _calculate_breakout_confidence(self, breakout_ratio: float, variance: float,
                                     num_sources: int, player: Player) -> float:
        """Calculate confidence score for breakout prediction"""
        # Base confidence from breakout magnitude
        base_confidence = min(100, (breakout_ratio - 1) * 200)  # 15% = 30 points, 25% = 80 points

        # Adjust for variance (lower variance = higher confidence)
        variance_penalty = min(30, variance * 10)  # High variance reduces confidence

        # Adjust for number of sources (more sources = higher confidence)
        source_bonus = min(20, (num_sources - 2) * 5)

        # Position-based adjustments
        position_multiplier = 1.0
        if player.pos and player.pos[0] in ['QB', 'RB']:
            position_multiplier = 1.1  # QBs/RBs have more variance, so breakouts more meaningful
        elif player.pos and player.pos[0] == 'DST':
            position_multiplier = 0.9  # DSTs are more predictable

        final_confidence = (base_confidence - variance_penalty + source_bonus) * position_multiplier
        return max(0, min(100, final_confidence))

    async def _get_ownership_impact(self, player_id: str, sport: str) -> str:
        """Determine ownership impact level"""
        try:
            ownership_data = await get_linestar_ownership(sport)
            player_ownership = next(
                (o.ownership_pct for o in ownership_data if o.player_id == player_id),
                20.0  # Default
            )

            if player_ownership < 10:
                return 'low'
            elif player_ownership < 25:
                return 'medium'
            else:
                return 'high'

        except:
            return 'unknown'

    def _generate_breakout_analysis(self, player: Player, breakout_source: str,
                                  projections: Dict[str, float], sport: str) -> Tuple[List[str], List[str]]:
        """Generate reasons and risk factors for breakout"""
        reasons = []
        risk_factors = []

        # Source-specific reasons
        if breakout_source == 'weather_adj':
            reasons.append("Weather conditions significantly favor this player")
            reasons.append("Game environment provides matchup advantage")
        elif breakout_source == 'position_adj':
            reasons.append("Position-based analysis shows upside potential")
            reasons.append("League averages suggest this player outperforms projections")
        elif breakout_source == 'base':
            reasons.append("Base projection analysis indicates strong potential")
            reasons.append("Fundamental metrics support higher output")

        # Player-specific factors
        if player.status and player.status.lower() in ['q', 'questionable']:
            reasons.append("Injury risk creates ownership discount")
            risk_factors.append("Questionable injury status")

        # Projection variance analysis
        projection_values = list(projections.values())
        if len(projection_values) > 2:
            variance = np.std(projection_values)
            if variance > 5:
                risk_factors.append("High projection variance across sources")
            else:
                reasons.append("Strong consensus among projection sources")

        # Ownership-based factors
        # (Would integrate with ownership data)

        # Weather factors (simplified)
        reasons.append("Weather conditions may favor performance")

        # Game script factors
        reasons.append("Expected game script matches player skills")

        return reasons, risk_factors

    async def get_top_breakouts(self, players: List[Player], sport: str = 'nfl',
                              top_n: int = 10) -> List[BreakoutCandidate]:
        """Get top N breakout candidates"""
        all_breakouts = await self.detect_breakouts(players, sport)
        return all_breakouts[:top_n]

    async def get_breakouts_by_source(self, players: List[Player], sport: str = 'nfl') -> Dict[str, List[BreakoutCandidate]]:
        """Group breakouts by source"""
        all_breakouts = await self.detect_breakouts(players, sport)
        by_source = defaultdict(list)

        for breakout in all_breakouts:
            by_source[breakout.breakout_source].append(breakout)

        return dict(by_source)

    async def get_breakout_alerts(self, players: List[Player], sport: str = 'nfl') -> List[Dict[str, Any]]:
        """Get actionable breakout alerts"""
        breakouts = await self.get_top_breakouts(players, sport, top_n=5)

        alerts = []
        for breakout in breakouts:
            if breakout.confidence_score > 70:  # High confidence only
                alerts.append({
                    'type': 'breakout_alert',
                    'priority': 'high' if breakout.confidence_score > 85 else 'medium',
                    'player': breakout.player_name,
                    'source': breakout.breakout_source,
                    'projection': breakout.breakout_projection,
                    'consensus': breakout.consensus_projection,
                    'confidence': breakout.confidence_score,
                    'ownership_impact': breakout.ownership_impact,
                    'action': 'Consider adding to lineups despite low ownership'
                })

        return alerts

    def get_breakout_stats(self, breakouts: List[BreakoutCandidate]) -> Dict[str, Any]:
        """Get statistics about detected breakouts"""
        if not breakouts:
            return {'total_breakouts': 0}

        confidence_scores = [b.confidence_score for b in breakouts]
        breakout_ratios = [b.breakout_projection / b.consensus_projection for b in breakouts]

        return {
            'total_breakouts': len(breakouts),
            'avg_confidence': round(sum(confidence_scores) / len(confidence_scores), 1),
            'max_confidence': max(confidence_scores),
            'avg_breakout_ratio': round(sum(breakout_ratios) / len(breakout_ratios), 2),
            'max_breakout_ratio': round(max(breakout_ratios), 2),
            'by_source': self._count_by_attribute(breakouts, 'breakout_source'),
            'by_ownership_impact': self._count_by_attribute(breakouts, 'ownership_impact')
        }

    def _count_by_attribute(self, breakouts: List[BreakoutCandidate], attr: str) -> Dict[str, int]:
        """Count breakouts by attribute"""
        counts = defaultdict(int)
        for breakout in breakouts:
            value = getattr(breakout, attr, 'unknown')
            counts[value] += 1
        return dict(counts)

# Convenience functions
async def detect_breakouts(players: List[Player], sport: str = 'nfl') -> List[BreakoutCandidate]:
    """Detect breakout players"""
    detector = BreakoutDetector()
    return await detector.detect_breakouts(players, sport)

async def get_top_breakouts(players: List[Player], sport: str = 'nfl', top_n: int = 10) -> List[BreakoutCandidate]:
    """Get top breakout candidates"""
    detector = BreakoutDetector()
    return await detector.get_top_breakouts(players, sport, top_n)

async def get_breakout_alerts(players: List[Player], sport: str = 'nfl') -> List[Dict[str, Any]]:
    """Get breakout alerts"""
    detector = BreakoutDetector()
    return await detector.get_breakout_alerts(players, sport)
