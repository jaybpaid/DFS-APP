"""
Projection Blending Service
Combines projections from multiple sources with configurable weights
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from collections import defaultdict

from ...packages.shared.types import Player

logger = logging.getLogger(__name__)

@dataclass
class ProjectionSource:
    """Represents a single projection source"""
    name: str
    weight: float
    reliability_score: float
    last_updated: datetime
    projections: Dict[str, float]  # player_id -> projection

@dataclass
class BlendConfig:
    """Configuration for projection blending"""
    global_weights: Dict[str, float]  # source_name -> weight
    player_overrides: Dict[str, Dict[str, float]]  # player_id -> {source_name: weight}
    min_sources: int = 1
    max_deviation: float = 0.5  # Max deviation from consensus (as fraction)
    recency_bonus: float = 0.1  # Bonus for recent projections

@dataclass
class BlendedProjection:
    """Result of blending multiple projections"""
    player_id: str
    blended_projection: float
    confidence_score: float  # 0-100
    sources_used: int
    source_breakdown: Dict[str, float]  # source_name -> contribution
    standard_deviation: float
    range: Tuple[float, float]  # min, max projections
    last_updated: datetime

class ProjectionBlender:
    """Blends projections from multiple sources"""

    def __init__(self, config: Optional[BlendConfig] = None):
        self.config = config or BlendConfig(
            global_weights={
                'fantasynerds': 0.4,
                'sportsdataio': 0.3,
                'draftkings': 0.3
            }
        )
        self.sources: Dict[str, ProjectionSource] = {}

    def add_source(self, name: str, projections: Dict[str, float],
                   reliability_score: float = 80.0) -> None:
        """Add a projection source"""
        source = ProjectionSource(
            name=name,
            weight=self.config.global_weights.get(name, 0.3),
            reliability_score=reliability_score,
            last_updated=datetime.now(),
            projections=projections
        )
        self.sources[name] = source
        logger.info(f"Added projection source: {name} with {len(projections)} projections")

    def update_source(self, name: str, projections: Dict[str, float]) -> None:
        """Update projections for an existing source"""
        if name in self.sources:
            self.sources[name].projections = projections
            self.sources[name].last_updated = datetime.now()
            logger.info(f"Updated projections for source: {name}")
        else:
            logger.warning(f"Source {name} not found, use add_source instead")

    def blend_projections(self, player_ids: Optional[List[str]] = None) -> Dict[str, BlendedProjection]:
        """Blend projections for specified players (or all if None)"""
        if not self.sources:
            logger.warning("No projection sources available")
            return {}

        # Get all player IDs if not specified
        if player_ids is None:
            all_player_ids = set()
            for source in self.sources.values():
                all_player_ids.update(source.projections.keys())
            player_ids = list(all_player_ids)

        blended_projections = {}

        for player_id in player_ids:
            blended = self._blend_single_player(player_id)
            if blended:
                blended_projections[player_id] = blended

        logger.info(f"Blended projections for {len(blended_projections)} players")
        return blended_projections

    def _blend_single_player(self, player_id: str) -> Optional[BlendedProjection]:
        """Blend projections for a single player"""
        # Collect all projections for this player
        player_projections = {}
        weights = {}

        for source_name, source in self.sources.items():
            if player_id in source.projections:
                projection = source.projections[player_id]

                # Get weight (check for player-specific override first)
                weight = self.config.player_overrides.get(player_id, {}).get(source_name)
                if weight is None:
                    weight = source.weight

                # Apply recency bonus
                hours_old = (datetime.now() - source.last_updated).total_seconds() / 3600
                recency_multiplier = 1.0 + (self.config.recency_bonus * max(0, 1 - hours_old/24))

                # Apply reliability bonus
                reliability_multiplier = source.reliability_score / 80.0  # Normalize to 1.0 baseline

                final_weight = weight * recency_multiplier * reliability_multiplier

                player_projections[source_name] = projection
                weights[source_name] = final_weight

        if len(player_projections) < self.config.min_sources:
            return None

        # Calculate blended projection
        total_weight = sum(weights.values())
        if total_weight == 0:
            return None

        blended_projection = sum(
            proj * (weights[source] / total_weight)
            for source, proj in player_projections.items()
        )

        # Calculate confidence score
        confidence_score = min(100, len(player_projections) * 20)  # Base confidence on source count

        # Adjust for consistency (lower std dev = higher confidence)
        projections_list = list(player_projections.values())
        if len(projections_list) > 1:
            import numpy as np
            std_dev = np.std(projections_list)
            mean_proj = np.mean(projections_list)

            # Reduce confidence if high variance
            if mean_proj > 0:
                variance_ratio = std_dev / mean_proj
                confidence_score *= max(0.5, 1 - variance_ratio)
        else:
            std_dev = 0

        # Source breakdown
        source_breakdown = {
            source: (weights[source] / total_weight) * 100
            for source in player_projections.keys()
        }

        # Range
        proj_values = list(player_projections.values())
        proj_range = (min(proj_values), max(proj_values))

        return BlendedProjection(
            player_id=player_id,
            blended_projection=round(blended_projection, 1),
            confidence_score=round(confidence_score, 1),
            sources_used=len(player_projections),
            source_breakdown=source_breakdown,
            standard_deviation=round(std_dev, 2),
            range=proj_range,
            last_updated=datetime.now()
        )

    def get_consensus_rankings(self, sport: str = 'NFL') -> List[Tuple[str, float, float]]:
        """Get consensus rankings based on blended projections"""
        blended = self.blend_projections()

        # Sort by blended projection (descending)
        rankings = []
        for player_id, projection in blended.items():
            rankings.append((player_id, projection.blended_projection, projection.confidence_score))

        rankings.sort(key=lambda x: x[1], reverse=True)
        return rankings

    def detect_outliers(self, threshold: float = 2.0) -> Dict[str, List[str]]:
        """Detect projection outliers (sources that deviate significantly)"""
        outliers = defaultdict(list)

        for player_id in self._get_all_player_ids():
            player_projections = {}
            for source_name, source in self.sources.items():
                if player_id in source.projections:
                    player_projections[source_name] = source.projections[player_id]

            if len(player_projections) < 2:
                continue

            # Calculate mean and std
            import numpy as np
            projections = list(player_projections.values())
            mean_proj = np.mean(projections)
            std_proj = np.std(projections)

            if std_proj == 0:
                continue

            # Find outliers
            for source_name, projection in player_projections.items():
                z_score = abs(projection - mean_proj) / std_proj
                if z_score > threshold:
                    outliers[player_id].append(f"{source_name} ({projection:.1f}, z={z_score:.1f})")

        return dict(outliers)

    def optimize_weights(self, historical_accuracy: Dict[str, float],
                        iterations: int = 100) -> Dict[str, float]:
        """Optimize source weights based on historical accuracy"""
        # Simple optimization - in practice you'd use more sophisticated methods
        optimized_weights = {}

        for source_name in self.sources.keys():
            if source_name in historical_accuracy:
                # Weight by accuracy, but keep some diversity
                accuracy = historical_accuracy[source_name]
                optimized_weights[source_name] = 0.7 * accuracy + 0.3 * self.config.global_weights.get(source_name, 0.3)
            else:
                optimized_weights[source_name] = self.config.global_weights.get(source_name, 0.3)

        # Normalize to sum to 1
        total = sum(optimized_weights.values())
        if total > 0:
            optimized_weights = {k: v/total for k, v in optimized_weights.items()}

        return optimized_weights

    def set_player_override(self, player_id: str, source_weights: Dict[str, float]) -> None:
        """Set custom weights for a specific player"""
        if player_id not in self.config.player_overrides:
            self.config.player_overrides[player_id] = {}

        self.config.player_overrides[player_id].update(source_weights)
        logger.info(f"Set custom weights for player {player_id}: {source_weights}")

    def get_blend_stats(self) -> Dict[str, Any]:
        """Get statistics about the current blend"""
        blended = self.blend_projections()

        if not blended:
            return {'total_players': 0}

        confidence_scores = [p.confidence_score for p in blended.values()]
        sources_used = [p.sources_used for p in blended.values()]

        return {
            'total_players': len(blended),
            'avg_confidence': round(sum(confidence_scores) / len(confidence_scores), 1),
            'avg_sources': round(sum(sources_used) / len(sources_used), 1),
            'high_confidence_count': sum(1 for c in confidence_scores if c >= 80),
            'sources': list(self.sources.keys()),
            'last_updated': datetime.now().isoformat()
        }

    def _get_all_player_ids(self) -> List[str]:
        """Get all unique player IDs across sources"""
        player_ids = set()
        for source in self.sources.values():
            player_ids.update(source.projections.keys())
        return list(player_ids)

    def save_blend_config(self, filepath: str) -> None:
        """Save current blend configuration"""
        import json

        config_data = {
            'global_weights': self.config.global_weights,
            'player_overrides': self.config.player_overrides,
            'min_sources': self.config.min_sources,
            'max_deviation': self.config.max_deviation,
            'recency_bonus': self.config.recency_bonus
        }

        with open(filepath, 'w') as f:
            json.dump(config_data, f, indent=2, default=str)

        logger.info(f"Saved blend configuration to {filepath}")

    def load_blend_config(self, filepath: str) -> None:
        """Load blend configuration"""
        import json

        with open(filepath, 'r') as f:
            config_data = json.load(f)

        self.config.global_weights = config_data.get('global_weights', {})
        self.config.player_overrides = config_data.get('player_overrides', {})
        self.config.min_sources = config_data.get('min_sources', 1)
        self.config.max_deviation = config_data.get('max_deviation', 0.5)
        self.config.recency_bonus = config_data.get('recency_bonus', 0.1)

        logger.info(f"Loaded blend configuration from {filepath}")

# Convenience functions
def create_blender_with_sources(sources_data: Dict[str, Dict[str, float]]) -> ProjectionBlender:
    """Create a blender and add multiple sources at once"""
    blender = ProjectionBlender()

    for source_name, projections in sources_data.items():
        blender.add_source(source_name, projections)

    return blender

def blend_player_projections(player_id: str, sources: Dict[str, float]) -> Optional[BlendedProjection]:
    """Quick blend for a single player"""
    blender = ProjectionBlender()
    blender.add_source('primary', sources)

    results = blender.blend_projections([player_id])
    return results.get(player_id)

async def blend_from_adapters(player_ids: List[str], sport: str = 'NFL') -> Dict[str, BlendedProjection]:
    """Blend projections using data from adapters"""
    # This would integrate with the actual adapters
    # For now, return empty dict as placeholder
    return {}
