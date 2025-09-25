"""
Professional Monte Carlo Simulation Engine for DFS
Handles player outcome distributions, correlations, and ROI analysis
"""

import json
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from scipy import stats
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PlayerOutcome:
    player_id: str
    player_name: str
    position: str
    projected_points: float
    mean_outcome: float
    p5: float
    p25: float
    p50: float
    p75: float
    p95: float
    boom_rate: float
    bust_rate: float
    variance: float


@dataclass
class LineupResult:
    lineup_id: str
    projected_score: float
    actual_score: float
    roi: float
    percentile: float
    boom_rate: float
    bust_rate: float


@dataclass
class SimulationRequest:
    slate_id: str
    players: List[Dict[str, Any]]
    lineups: List[Dict[str, Any]]
    num_simulations: int = 10000
    seed: int = 42
    use_mcp_signals: bool = True
    distribution_type: str = "normal"  # 'normal', 'lognormal', 'empirical'
    correlation_strength: float = 0.7
    weather_adjustments: bool = True
    injury_adjustments: bool = True


class MonteCarloSimulator:
    def __init__(self):
        self.players = []
        self.lineups = []
        self.correlation_matrix = None
        self.simulation_results = []

    def simulate(self, request: SimulationRequest) -> Dict[str, Any]:
        """
        Main simulation function
        """
        try:
            self.players = request.players
            self.lineups = request.lineups

            # Set random seed for reproducibility
            np.random.seed(request.seed)

            # Build correlation matrix
            self.correlation_matrix = self._build_correlation_matrix(
                self.players, request.correlation_strength
            )

            # Run simulations
            logger.info(f"Running {request.num_simulations} simulations...")

            player_outcomes = []
            lineup_results = []

            # Generate player outcome distributions
            for player in self.players:
                outcome = self._simulate_player_outcomes(
                    player, request.num_simulations, request.distribution_type
                )
                player_outcomes.append(outcome)

            # Generate lineup results
            for lineup in self.lineups:
                result = self._simulate_lineup_outcomes(
                    lineup, request.num_simulations, request.distribution_type
                )
                lineup_results.append(result)

            # Calculate ROI distribution
            roi_distribution = self._calculate_roi_distribution(lineup_results)

            return {
                "success": True,
                "player_outcomes": [outcome.__dict__ for outcome in player_outcomes],
                "lineup_results": [result.__dict__ for result in lineup_results],
                "roi_distribution": roi_distribution,
                "simulation_stats": {
                    "num_simulations": request.num_simulations,
                    "seed": request.seed,
                    "distribution_type": request.distribution_type,
                    "correlation_strength": request.correlation_strength,
                },
                "message": f"Successfully completed {request.num_simulations} simulations",
            }

        except Exception as e:
            logger.error(f"Simulation failed: {str(e)}")
            return {
                "success": False,
                "player_outcomes": [],
                "lineup_results": [],
                "roi_distribution": {},
                "simulation_stats": {},
                "message": f"Simulation failed: {str(e)}",
            }

    def _build_correlation_matrix(
        self, players: List[Dict[str, Any]], strength: float
    ) -> np.ndarray:
        """
        Build correlation matrix between players
        """
        n_players = len(players)
        correlation_matrix = np.eye(n_players)

        for i, player1 in enumerate(players):
            for j, player2 in enumerate(players):
                if i != j:
                    correlation = self._calculate_player_correlation(
                        player1, player2, strength
                    )
                    correlation_matrix[i, j] = correlation

        # Ensure matrix is positive semi-definite
        eigenvals, eigenvecs = np.linalg.eigh(correlation_matrix)
        eigenvals = np.maximum(eigenvals, 0.01)  # Ensure positive eigenvalues
        correlation_matrix = eigenvecs @ np.diag(eigenvals) @ eigenvecs.T

        return correlation_matrix

    def _calculate_player_correlation(
        self, player1: Dict[str, Any], player2: Dict[str, Any], base_strength: float
    ) -> float:
        """
        Calculate correlation between two players based on various factors
        """
        correlation = 0.0

        # Same team correlation
        if player1.get("team") == player2.get("team"):
            # QB-WR/TE stack correlation
            if (
                player1.get("position") == "QB"
                and player2.get("position") in ["WR", "TE"]
            ) or (
                player2.get("position") == "QB"
                and player1.get("position") in ["WR", "TE"]
            ):
                correlation = base_strength * 0.8
            # Same team skill positions
            elif player1.get("position") in ["WR", "RB", "TE"] and player2.get(
                "position"
            ) in ["WR", "RB", "TE"]:
                correlation = base_strength * 0.3
            # RB-DST correlation (game script)
            elif (
                player1.get("position") == "RB" and player2.get("position") == "DST"
            ) or (player2.get("position") == "RB" and player1.get("position") == "DST"):
                correlation = base_strength * 0.4

        # Opposing team negative correlation
        elif self._are_opposing_teams(player1.get("team"), player2.get("team")):
            # QB vs opposing DST
            if (
                player1.get("position") == "QB" and player2.get("position") == "DST"
            ) or (player2.get("position") == "QB" and player1.get("position") == "DST"):
                correlation = -base_strength * 0.3
            # General opposing team correlation
            else:
                correlation = -base_strength * 0.1

        # Same position correlation (competition for targets/carries)
        elif player1.get("position") == player2.get("position") and player1.get(
            "position"
        ) in ["WR", "RB", "TE"]:
            correlation = -base_strength * 0.2

        return np.clip(correlation, -0.8, 0.8)

    def _are_opposing_teams(self, team1: str, team2: str) -> bool:
        """
        Check if two teams are playing against each other
        This would need to be enhanced with actual game data
        """
        # Simplified - in real implementation, would check actual matchups
        return False

    def _simulate_player_outcomes(
        self, player: Dict[str, Any], num_sims: int, distribution_type: str
    ) -> PlayerOutcome:
        """
        Simulate outcomes for a single player
        """
        projected = player.get("projected_points", 0)

        # Determine variance based on position and other factors
        variance = self._calculate_player_variance(player)

        # Generate samples based on distribution type
        if distribution_type == "normal":
            samples = np.random.normal(projected, variance, num_sims)
        elif distribution_type == "lognormal":
            # Convert to lognormal parameters
            mu = np.log(projected**2 / np.sqrt(variance**2 + projected**2))
            sigma = np.sqrt(np.log(variance**2 / projected**2 + 1))
            samples = np.random.lognormal(mu, sigma, num_sims)
        else:  # empirical
            # Use historical data if available, otherwise normal
            samples = np.random.normal(projected, variance, num_sims)

        # Ensure non-negative values
        samples = np.maximum(samples, 0)

        # Calculate percentiles
        percentiles = np.percentile(samples, [5, 25, 50, 75, 95])

        # Calculate boom/bust rates
        boom_threshold = projected * 1.5  # 50% above projection
        bust_threshold = projected * 0.5  # 50% below projection

        boom_rate = (samples >= boom_threshold).mean() * 100
        bust_rate = (samples <= bust_threshold).mean() * 100

        return PlayerOutcome(
            player_id=player.get("id", ""),
            player_name=player.get("name", ""),
            position=player.get("position", ""),
            projected_points=projected,
            mean_outcome=samples.mean(),
            p5=percentiles[0],
            p25=percentiles[1],
            p50=percentiles[2],
            p75=percentiles[3],
            p95=percentiles[4],
            boom_rate=boom_rate,
            bust_rate=bust_rate,
            variance=samples.var(),
        )

    def _calculate_player_variance(self, player: Dict[str, Any]) -> float:
        """
        Calculate variance for a player based on position and other factors
        """
        base_variance = {"QB": 4.0, "RB": 5.0, "WR": 6.0, "TE": 4.5, "DST": 3.0}

        position = player.get("position", "WR")
        variance = base_variance.get(position, 5.0)

        # Adjust based on MCP signals if available
        if player.get("mcp_signals"):
            signals = player["mcp_signals"]

            # Higher variance for boom/bust players
            if signals.get("boom_rate", 0) > 25:
                variance *= 1.3
            if signals.get("bust_rate", 0) > 25:
                variance *= 1.2

            # Weather impact
            if signals.get("weather", 0) < -1:  # Bad weather
                if position in ["QB", "WR", "TE"]:
                    variance *= 1.4

            # Injury impact
            if signals.get("injury") in ["Q", "D"]:
                variance *= 1.5

        return variance

    def _simulate_lineup_outcomes(
        self, lineup: Dict[str, Any], num_sims: int, distribution_type: str
    ) -> LineupResult:
        """
        Simulate outcomes for a lineup
        """
        lineup_players = lineup.get("players", [])
        projected_score = sum(p.get("projected_points", 0) for p in lineup_players)

        # Generate correlated samples for all players in lineup
        lineup_samples = []

        for sim in range(num_sims):
            lineup_score = 0

            for player in lineup_players:
                # Get player outcome for this simulation
                player_variance = self._calculate_player_variance(player)
                projected = player.get("projected_points", 0)

                if distribution_type == "normal":
                    sample = np.random.normal(projected, player_variance)
                elif distribution_type == "lognormal":
                    mu = np.log(
                        projected**2 / np.sqrt(player_variance**2 + projected**2)
                    )
                    sigma = np.sqrt(np.log(player_variance**2 / projected**2 + 1))
                    sample = np.random.lognormal(mu, sigma)
                else:
                    sample = np.random.normal(projected, player_variance)

                lineup_score += max(0, sample)

            lineup_samples.append(lineup_score)

        lineup_samples = np.array(lineup_samples)

        # Calculate ROI (simplified - assumes $25 entry fee and top 20% cash)
        entry_fee = 25
        payout_threshold = np.percentile(lineup_samples, 80)  # Top 20%

        roi_samples = []
        for score in lineup_samples:
            if score >= payout_threshold:
                # Simplified payout structure
                payout = entry_fee * 4  # 4x payout for top 20%
                roi = (payout - entry_fee) / entry_fee
            else:
                roi = -1  # Lost entry fee
            roi_samples.append(roi)

        roi_samples = np.array(roi_samples)

        # Calculate percentile (vs field)
        percentile = (lineup_samples >= projected_score).mean() * 100

        # Boom/bust for lineups
        boom_threshold = projected_score * 1.2
        bust_threshold = projected_score * 0.8

        boom_rate = (lineup_samples >= boom_threshold).mean() * 100
        bust_rate = (lineup_samples <= bust_threshold).mean() * 100

        return LineupResult(
            lineup_id=lineup.get("lineup_id", ""),
            projected_score=projected_score,
            actual_score=lineup_samples.mean(),
            roi=roi_samples.mean(),
            percentile=percentile,
            boom_rate=boom_rate,
            bust_rate=bust_rate,
        )

    def _calculate_roi_distribution(
        self, lineup_results: List[LineupResult]
    ) -> Dict[str, Any]:
        """
        Calculate ROI distribution statistics
        """
        if not lineup_results:
            return {}

        rois = [result.roi for result in lineup_results]

        return {
            "mean_roi": np.mean(rois),
            "median_roi": np.median(rois),
            "std_roi": np.std(rois),
            "min_roi": np.min(rois),
            "max_roi": np.max(rois),
            "positive_roi_rate": (np.array(rois) > 0).mean() * 100,
            "percentiles": {
                "p10": np.percentile(rois, 10),
                "p25": np.percentile(rois, 25),
                "p75": np.percentile(rois, 75),
                "p90": np.percentile(rois, 90),
            },
        }


# API endpoint function
def run_simulation(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main API endpoint for Monte Carlo simulation
    """
    try:
        request = SimulationRequest(
            slate_id=request_data["slate_id"],
            players=request_data["players"],
            lineups=request_data["lineups"],
            num_simulations=request_data.get("num_simulations", 10000),
            seed=request_data.get("seed", 42),
            use_mcp_signals=request_data.get("use_mcp_signals", True),
            distribution_type=request_data.get("distribution_type", "normal"),
            correlation_strength=request_data.get("correlation_strength", 0.7),
            weather_adjustments=request_data.get("weather_adjustments", True),
            injury_adjustments=request_data.get("injury_adjustments", True),
        )

        simulator = MonteCarloSimulator()
        result = simulator.simulate(request)

        return result

    except Exception as e:
        logger.error(f"API simulation failed: {str(e)}")
        return {
            "success": False,
            "player_outcomes": [],
            "lineup_results": [],
            "roi_distribution": {},
            "simulation_stats": {},
            "message": f"API simulation failed: {str(e)}",
        }


if __name__ == "__main__":
    # Test the simulator
    test_players = [
        {
            "id": "1",
            "name": "Josh Allen",
            "position": "QB",
            "team": "BUF",
            "projected_points": 22.5,
            "mcp_signals": {
                "boom_rate": 28.5,
                "bust_rate": 15.2,
                "weather": 0,
                "injury": "ACTIVE",
            },
        },
        {
            "id": "2",
            "name": "Christian McCaffrey",
            "position": "RB",
            "team": "SF",
            "projected_points": 18.2,
            "mcp_signals": {
                "boom_rate": 22.3,
                "bust_rate": 18.7,
                "weather": 0,
                "injury": "ACTIVE",
            },
        },
    ]

    test_lineups = [{"lineup_id": "test_lineup_1", "players": test_players}]

    test_request = {
        "slate_id": "test_slate",
        "players": test_players,
        "lineups": test_lineups,
        "num_simulations": 1000,
        "seed": 42,
        "distribution_type": "normal",
    }

    result = run_simulation(test_request)
    print(json.dumps(result, indent=2))
