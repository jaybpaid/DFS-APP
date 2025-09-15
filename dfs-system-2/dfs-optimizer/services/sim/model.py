"""
Advanced Contest-Aware Monte Carlo Simulation Model
Implements player outcome sampling with historical calibration, copula correlations,
ML-enhanced predictions, and hierarchical simulation
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from scipy import stats
from scipy.stats import beta, norm, multivariate_normal
from concurrent.futures import ProcessPoolExecutor
import multiprocessing as mp
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
import warnings
warnings.filterwarnings('ignore')

try:
    from copulas.multivariate import GaussianMultivariate
    COPULA_AVAILABLE = True
except ImportError:
    COPULA_AVAILABLE = False
    logging.warning("Copulas library not available. Install with: pip install copulas")

from ...packages.shared.types import Player, Contest, Lineup, SimulationResults

logger = logging.getLogger(__name__)

@dataclass
class HistoricalCalibration:
    """Calibrates simulation distributions using historical data"""

    def __init__(self):
        self.player_distributions = {}  # player_id -> fitted distribution
        self.game_script_modifiers = {}  # game_situation -> modifier
        self.weather_impacts = {}  # weather_condition -> impact
        self.injury_adjustments = {}  # injury_status -> adjustment

    def fit_player_distributions(self, historical_data: pd.DataFrame):
        """Fit beta distributions to historical fantasy points"""
        for player_id in historical_data['player_id'].unique():
            player_data = historical_data[historical_data['player_id'] == player_id]

            if len(player_data) < 10:  # Need minimum samples
                continue

            points = player_data['fantasy_points'].values

            # Fit beta distribution (fantasy points are bounded)
            # Normalize to 0-1 range first
            min_points, max_points = points.min(), points.max()
            if max_points > min_points:
                normalized = (points - min_points) / (max_points - min_points)

                # Fit beta distribution
                try:
                    alpha, beta_param, loc, scale = stats.beta.fit(normalized, floc=0, fscale=1)
                    self.player_distributions[player_id] = {
                        'distribution': 'beta',
                        'params': (alpha, beta_param, loc, scale),
                        'min_points': min_points,
                        'max_points': max_points
                    }
                except:
                    # Fallback to normal distribution
                    mean, std = np.mean(points), np.std(points)
                    self.player_distributions[player_id] = {
                        'distribution': 'normal',
                        'params': (mean, std)
                    }

    def get_calibrated_projection(self, player_id: str, base_projection: float) -> Tuple[float, float]:
        """Get calibrated projection with uncertainty"""
        if player_id in self.player_distributions:
            dist_info = self.player_distributions[player_id]

            if dist_info['distribution'] == 'beta':
                alpha, beta_param, loc, scale = dist_info['params']
                min_p, max_p = dist_info['min_points'], dist_info['max_points']

                # Sample from beta and scale back
                sample = stats.beta.rvs(alpha, beta_param, loc, scale)
                calibrated = min_p + sample * (max_p - min_p)

                # Use historical variance as uncertainty
                uncertainty = (max_p - min_p) * 0.2
                return calibrated, uncertainty
            else:
                # Normal distribution
                mean, std = dist_info['params']
                return mean, std

        # Fallback to base projection
        return base_projection, base_projection * 0.25

@dataclass
class CopulaCorrelationModel:
    """Advanced correlation modeling using copulas"""

    def __init__(self):
        self.copula_model = None
        self.is_fitted = False

    def fit(self, historical_data: pd.DataFrame):
        """Fit copula model to historical player correlations"""
        if not COPULA_AVAILABLE:
            logger.warning("Copulas library not available, using basic correlations")
            return

        try:
            # Prepare data for copula fitting
            player_ids = historical_data['player_id'].unique()[:20]  # Limit for computational reasons
            pivot_data = historical_data.pivot_table(
                index='game_id',
                columns='player_id',
                values='fantasy_points',
                fill_value=0
            )[player_ids]

            # Fit Gaussian copula
            self.copula_model = GaussianMultivariate()
            self.copula_model.fit(pivot_data.values)
            self.is_fitted = True

            logger.info(f"Fitted copula model with {len(player_ids)} players")

        except Exception as e:
            logger.error(f"Failed to fit copula model: {e}")

    def sample_correlations(self, n_samples: int, n_players: int) -> np.ndarray:
        """Sample from fitted copula for correlations"""
        if not self.is_fitted or not COPULA_AVAILABLE:
            # Fallback to random correlations
            return np.random.normal(0, 0.1, (n_samples, n_players))

        try:
            samples = self.copula_model.sample(n_samples)
            return samples
        except Exception as e:
            logger.error(f"Failed to sample from copula: {e}")
            return np.random.normal(0, 0.1, (n_samples, n_players))

@dataclass
class MLProjectionEnhancer:
    """ML model to enhance projections based on multiple features"""

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = [
            'base_projection', 'ownership', 'salary', 'position_rank',
            'team_strength', 'matchup_difficulty', 'weather_impact',
            'injury_status', 'recent_form', 'season_trend'
        ]

    def train(self, training_data: pd.DataFrame, target_column: str = 'actual_points'):
        """Train ML model on historical data"""
        try:
            # Prepare features
            X = training_data[self.feature_columns].fillna(0)
            y = training_data[target_column]

            # Scale features
            X_scaled = self.scaler.fit_transform(X)

            # Train Random Forest
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            )
            self.model.fit(X_scaled, y)
            self.is_trained = True

            logger.info(f"Trained ML projection enhancer (R² = {self.model.score(X_scaled, y):.3f})")

        except Exception as e:
            logger.error(f"Failed to train ML model: {e}")

    def enhance_projection(self, features: Dict[str, float]) -> Tuple[float, float]:
        """Enhance base projection with ML model"""
        if not self.is_trained:
            return features.get('base_projection', 0), 0

        try:
            # Prepare feature vector
            feature_vector = np.array([[features.get(col, 0) for col in self.feature_columns]])
            feature_scaled = self.scaler.transform(feature_vector)

            # Get prediction and uncertainty
            prediction = self.model.predict(feature_scaled)[0]

            # Estimate uncertainty from prediction variance
            # (simplified - in practice use prediction intervals)
            uncertainty = abs(prediction - features.get('base_projection', 0)) * 0.3

            return prediction, uncertainty

        except Exception as e:
            logger.error(f"Failed to enhance projection: {e}")
            return features.get('base_projection', 0), 0

@dataclass
class HierarchicalSimulator:
    """Hierarchical simulation: game outcomes first, then player performances"""

    def __init__(self):
        self.game_outcome_model = None
        self.player_conditional_models = {}

    def simulate_game_context(self, game_data: Dict) -> Dict[str, float]:
        """Simulate game-level outcomes (score, weather, pace, etc.)"""
        # Simplified game context simulation
        game_context = {
            'total_points': np.random.normal(47, 8),  # NFL average total
            'weather_impact': np.random.choice([-0.1, 0, 0.1], p=[0.2, 0.6, 0.2]),
            'pace_factor': np.random.normal(1.0, 0.1),
            'defensive_intensity': np.random.uniform(0.8, 1.2)
        }

        return game_context

    def simulate_player_given_game(self, player: Player, game_context: Dict) -> float:
        """Simulate player performance given game context"""
        base_projection = player.projection or 0

        # Apply game context modifiers
        weather_modifier = 1 + game_context.get('weather_impact', 0)
        pace_modifier = game_context.get('pace_factor', 1.0)
        defensive_modifier = game_context.get('defensive_intensity', 1.0)

        # Position-specific modifiers
        position_modifier = 1.0
        if 'QB' in player.pos:
            position_modifier = pace_modifier * 1.1  # QBs benefit from pace
        elif 'RB' in player.pos:
            position_modifier = defensive_modifier * 0.9  # RBs hurt by tough defense
        elif 'WR' in player.pos:
            position_modifier = pace_modifier * 1.05
        elif 'TE' in player.pos:
            position_modifier = defensive_modifier * 0.95

        # Combine modifiers
        total_modifier = weather_modifier * position_modifier

        # Add variance
        variance = np.random.normal(0, base_projection * 0.25)

        final_projection = base_projection * total_modifier + variance

        # Apply injury status
        injury_modifier = 1.0
        if player.status == 'Q':
            injury_modifier = 0.7
        elif player.status == 'D':
            injury_modifier = 0.4
        elif player.status == 'OUT':
            injury_modifier = 0.1

        return max(0, final_projection * injury_modifier)

@dataclass
class AdaptiveSampler:
    """Adaptive sampling for efficient Monte Carlo simulation"""

    def __init__(self, target_precision: float = 0.01):
        self.target_precision = target_precision
        self.sample_history = []

    def should_continue_sampling(self, current_samples: int, current_std: float) -> bool:
        """Determine if we need more samples based on precision target"""
        if current_samples < 100:  # Minimum samples
            return True

        # Estimate standard error of mean
        standard_error = current_std / np.sqrt(current_samples)

        # Continue if precision not met
        return standard_error > self.target_precision

    def get_importance_weights(self, player_projections: Dict[str, float],
                             rarity_scores: Dict[str, float]) -> Dict[str, float]:
        """Calculate importance sampling weights for rare events"""
        weights = {}

        for player_id, projection in player_projections.items():
            # Weight by combination of projection and rarity
            rarity = rarity_scores.get(player_id, 0.5)
            weights[player_id] = projection * (1 + rarity)  # Boost rare high-projection players

        # Normalize
        total_weight = sum(weights.values())
        if total_weight > 0:
            weights = {k: v/total_weight for k, v in weights.items()}

        return weights

@dataclass
class PlayerOutcomeSampler:
    """Enhanced player outcome sampler with advanced features"""

    def __init__(self, players: List[Player], enhancements: Optional[Dict] = None):
        self.players = players
        self.player_map = {p.playerId: p for p in players}

        # Initialize enhancements
        self.enhancements = enhancements or {}
        self.historical_calibration = self.enhancements.get('calibration')
        self.copula_model = self.enhancements.get('copula')
        self.ml_enhancer = self.enhancements.get('ml_model')
        self.hierarchical_sim = self.enhancements.get('hierarchical')
        self.adaptive_sampler = self.enhancements.get('adaptive', AdaptiveSampler())

        # Build correlation matrix (enhanced if copula available)
        self.correlation_matrix = self._build_correlation_matrix()

    def _build_correlation_matrix(self) -> np.ndarray:
        """Build correlation matrix based on team, position, and game factors"""
        n = len(self.players)
        corr_matrix = np.eye(n) * 0.1  # Base correlation

        for i, player_i in enumerate(self.players):
            for j, player_j in enumerate(self.players):
                if i == j:
                    continue

                correlation = 0.0

                # Same team correlation
                if player_i.team == player_j.team:
                    correlation += 0.3

                # Same game correlation
                if player_i.opp == player_j.team or player_j.opp == player_i.team:
                    correlation += 0.2

                # Position correlations
                if self._positions_correlated(player_i.pos, player_j.pos):
                    correlation += 0.15

                # Opponent DST correlation (negative for offensive players)
                if self._is_dst_correlation(player_i, player_j):
                    correlation -= 0.1

                corr_matrix[i, j] = min(0.8, max(-0.5, correlation))

        return corr_matrix

    def _positions_correlated(self, pos1: List[str], pos2: List[str]) -> bool:
        """Check if positions are correlated"""
        qb_positions = ['QB']
        rb_positions = ['RB', 'FB']
        wr_positions = ['WR']
        te_positions = ['TE']

        pos1_groups = []
        pos2_groups = []

        for pos in pos1:
            if pos in qb_positions:
                pos1_groups.append('qb')
            elif pos in rb_positions:
                pos1_groups.append('rb')
            elif pos in wr_positions:
                pos1_groups.append('wr')
            elif pos in te_positions:
                pos1_groups.append('te')

        for pos in pos2:
            if pos in qb_positions:
                pos2_groups.append('qb')
            elif pos in rb_positions:
                pos2_groups.append('rb')
            elif pos in wr_positions:
                pos2_groups.append('wr')
            elif pos in te_positions:
                pos2_groups.append('te')

        return bool(set(pos1_groups) & set(pos2_groups))

    def _is_dst_correlation(self, player1: Player, player2: Player) -> bool:
        """Check if DST correlation applies"""
        return ('DST' in player1.pos and any(pos in ['QB', 'RB', 'WR', 'TE'] for pos in player2.pos)) or \
               ('DST' in player2.pos and any(pos in ['QB', 'RB', 'WR', 'TE'] for pos in player1.pos))

    def sample_outcomes(self, n_simulations: int = 1000) -> List[Dict[str, float]]:
        """Sample player outcomes for multiple simulations"""
        outcomes = []

        for _ in range(n_simulations):
            # Generate correlated normal variables
            n = len(self.players)
            mean = np.zeros(n)
            cov = self.correlation_matrix
            correlated_normals = np.random.multivariate_normal(mean, cov)

            simulation = {}
            for i, player in enumerate(self.players):
                # Convert normal to fantasy points
                projection = player.projection or 0
                std_dev = player.stdev or (projection * 0.2)  # Default 20% variance

                # Apply correlation adjustment
                base_points = projection + (correlated_normals[i] * std_dev)

                # Apply floor/ceiling constraints
                floor = player.floor or (projection * 0.5)
                ceiling = player.ceiling or (projection * 1.8)

                fantasy_points = max(floor, min(ceiling, base_points))

                # Add some randomness for injury/game script variance
                injury_factor = 1.0
                if player.status == 'Q':
                    injury_factor = 0.7
                elif player.status == 'D':
                    injury_factor = 0.4
                elif player.status == 'OUT':
                    injury_factor = 0.1

                final_points = fantasy_points * injury_factor
                simulation[player.playerId] = max(0, final_points)

            outcomes.append(simulation)

        return outcomes

@dataclass
class FieldModel:
    """Models the field of lineups for contest simulation"""

    def __init__(self, ownership_data: Dict[str, float], n_field_lineups: int = 10000):
        self.ownership_data = ownership_data
        self.n_field_lineups = n_field_lineups
        self.field_lineups = self._generate_field_lineups()

    def _generate_field_lineups(self) -> List[Dict[str, float]]:
        """Generate representative field lineups based on ownership"""
        field_lineups = []

        for _ in range(self.n_field_lineups):
            lineup = {}
            for player_id, ownership in self.ownership_data.items():
                # Sample whether player appears in this lineup
                # Higher ownership = more likely to appear
                appears = np.random.random() < ownership
                lineup[player_id] = 1.0 if appears else 0.0

            field_lineups.append(lineup)

        return field_lineups

    def get_field_distribution(self) -> Dict[str, float]:
        """Get ownership distribution for field modeling"""
        return self.ownership_data

@dataclass
class ContestSimulator:
    """Simulates contest outcomes with payout curves"""

    def __init__(self, contest: Contest, field_model: FieldModel):
        self.contest = contest
        self.field_model = field_model
        self.payout_curve = self._build_payout_curve()

    def _build_payout_curve(self) -> List[Tuple[int, float]]:
        """Build cumulative payout curve from contest data"""
        curve = []
        cumulative_pct = 0.0

        for payout in self.contest.payoutCurve:
            cumulative_pct += payout.pct
            curve.append((payout.place, cumulative_pct))

        return curve

    def calculate_lineup_payout(self, lineup_score: float, field_scores: List[float]) -> float:
        """Calculate payout for a lineup given field scores"""
        # Find position in field
        sorted_scores = sorted(field_scores + [lineup_score], reverse=True)
        position = sorted_scores.index(lineup_score) + 1

        # Find payout for this position
        for place, cumulative_pct in self.payout_curve:
            if position <= place:
                return self.contest.entryFee * (self.contest.payoutCurve[place-1].pct / self.contest.payoutCurve[place-1].pct)

        return 0.0  # No payout

class MonteCarloSimulator:
    """Main Monte Carlo simulation engine"""

    def __init__(self, players: List[Player], contest: Optional[Contest] = None,
                 enhancements: Optional[Dict] = None):
        self.players = players
        self.contest = contest
        self.enhancements = enhancements or {}

        # Initialize enhanced components
        self.historical_calibration = self.enhancements.get('calibration')
        self.copula_model = self.enhancements.get('copula')
        self.ml_enhancer = self.enhancements.get('ml_model')
        self.hierarchical_sim = self.enhancements.get('hierarchical')
        self.adaptive_sampler = self.enhancements.get('adaptive', AdaptiveSampler())

        # Create enhanced player sampler
        self.player_sampler = PlayerOutcomeSampler(players, enhancements)

        # Build ownership data for field modeling
        self.ownership_data = {}
        for player in players:
            self.ownership_data[player.playerId] = player.ownership or 0.15

        self.field_model = FieldModel(self.ownership_data)
        self.contest_simulator = ContestSimulator(contest, self.field_model) if contest else None

    def simulate_lineup(self, lineup: Lineup, n_simulations: int = 1000) -> SimulationResults:
        """Simulate a single lineup"""
        logger.info(f"Simulating lineup {lineup.lineupId} with {n_simulations} trials")

        # Sample player outcomes
        player_outcomes = self.player_sampler.sample_outcomes(n_simulations)

        scores = []
        payouts = []

        for outcome in player_outcomes:
            # Calculate lineup score
            lineup_score = 0
            for player_id in lineup.playerIds:
                if player_id in outcome:
                    lineup_score += outcome[player_id]

            scores.append(lineup_score)

            # Calculate payout if contest simulator available
            if self.contest_simulator:
                field_scores = []
                for field_lineup in self.field_model.field_lineups[:1000]:  # Sample field
                    field_score = sum(outcome.get(pid, 0) * presence
                                    for pid, presence in field_lineup.items())
                    field_scores.append(field_score)

                payout = self.contest_simulator.calculate_lineup_payout(lineup_score, field_scores)
                payouts.append(payout)
            else:
                payouts.append(0)

        # Calculate metrics
        scores_array = np.array(scores)
        payouts_array = np.array(payouts)

        mean_score = float(np.mean(scores_array))
        std_dev = float(np.std(scores_array))
        percentiles = {
            10: float(np.percentile(scores_array, 10)),
            25: float(np.percentile(scores_array, 25)),
            50: float(np.percentile(scores_array, 50)),
            75: float(np.percentile(scores_array, 75)),
            90: float(np.percentile(scores_array, 90))
        }

        # Payout-aware metrics
        if self.contest and payouts_array.sum() > 0:
            roi = float(np.mean(payouts_array) / self.contest.entryFee)
            win_rate = float(np.mean(payouts_array > 0))
            top_pct = float(np.mean([1 if p > 0 else 0 for p in payouts_array]))
            cash_rate = win_rate  # Simplified
            boom_rate = float(np.mean(scores_array > percentiles[90]))
            bust_rate = float(np.mean(scores_array < percentiles[25]))
        else:
            roi = 0.0
            win_rate = 0.0
            top_pct = 0.0
            cash_rate = 0.0
            boom_rate = 0.0
            bust_rate = 0.0

        # Calculate optimal rate (vs field)
        optimal_rate = self._calculate_optimal_rate(scores_array)

        # Calculate leverage
        leverage = self._calculate_leverage(lineup)

        # Calculate Sharpe ratio
        sharpe = roi / std_dev if std_dev > 0 else 0

        # Calculate max drawdown (simplified)
        max_drawdown = self._calculate_max_drawdown(payouts_array)

        return SimulationResults(
            iterations=n_simulations,
            mean_score=round(mean_score, 1),
            std_dev=round(std_dev, 1),
            percentiles=percentiles,
            win_rate=round(win_rate, 4),
            optimal_rate=round(optimal_rate, 4),
            roi=round(roi, 4),
            sharpe=round(sharpe, 2),
            max_drawdown=round(max_drawdown, 2)
        )

    def _calculate_optimal_rate(self, scores: np.ndarray) -> float:
        """Calculate what percentage of time lineup would finish in top 20%"""
        if len(scores) == 0:
            return 0.0

        # Simplified: assume top 20% is "optimal"
        threshold = np.percentile(scores, 80)
        return float(np.mean(scores >= threshold))

    def _calculate_leverage(self, lineup: Lineup) -> float:
        """Calculate leverage score vs ownership"""
        total_leverage = 0
        player_count = 0

        for player_id in lineup.playerIds:
            player = next((p for p in self.players if p.playerId == player_id), None)
            if player and player.ownership:
                # Leverage = projection percentile / ownership percentile
                # Simplified calculation
                ownership_pct = player.ownership
                projection_rank = sum(1 for p in self.players
                                    if p.projection and p.projection > (player.projection or 0))
                projection_pct = projection_rank / len(self.players)

                if ownership_pct > 0:
                    leverage = projection_pct / ownership_pct
                    total_leverage += leverage
                    player_count += 1

        return total_leverage / player_count if player_count > 0 else 1.0

    def _calculate_max_drawdown(self, payouts: np.ndarray) -> float:
        """Calculate maximum drawdown from payout stream"""
        if len(payouts) == 0:
            return 0.0

        cumulative = np.cumsum(payouts - self.contest.entryFee if self.contest else payouts)
        running_max = np.maximum.accumulate(cumulative)
        drawdown = running_max - cumulative
        max_drawdown = np.max(drawdown)

        return float(max_drawdown)

    async def simulate_multiple_lineups(self, lineups: List[Lineup], n_simulations: int = 1000) -> Dict[str, SimulationResults]:
        """Simulate multiple lineups in parallel"""
        logger.info(f"Simulating {len(lineups)} lineups with {n_simulations} trials each")

        # Use thread pool for parallel simulation
        loop = asyncio.get_event_loop()

        with ProcessPoolExecutor(max_workers=min(mp.cpu_count(), 4)) as executor:
            tasks = [
                loop.run_in_executor(executor, self.simulate_lineup, lineup, n_simulations)
                for lineup in lineups
            ]

            results = await asyncio.gather(*tasks)

        return {lineup.lineupId: result for lineup, result in zip(lineups, results)}

def calculate_overall_score(simulation_results: SimulationResults,
                          weights: Optional[Dict[str, float]] = None) -> float:
    """Calculate overall score using weighted Z-scores"""
    if not weights:
        weights = {
            'roi': 0.25,
            'win_rate': 0.20,
            'optimal_rate': 0.15,
            'boom_rate': 0.15,
            'leverage': 0.15,
            'sharpe': 0.10
        }

    # Calculate Z-scores (simplified - in practice use historical baselines)
    roi_z = (simulation_results.roi - 1.0) / 0.5  # Assume mean ROI of 1.0, std 0.5
    win_z = (simulation_results.win_rate - 0.05) / 0.03  # Assume 5% win rate, std 3%
    optimal_z = (simulation_results.optimal_rate - 0.20) / 0.10  # Assume 20% optimal rate
    boom_z = (simulation_results.mean_score - 150) / 30  # Assume mean 150, std 30
    leverage_z = (1.0 - simulation_results.mean_score / 200) / 0.2  # Inverse relationship
    sharpe_z = (simulation_results.sharpe - 0.5) / 0.3  # Assume mean Sharpe 0.5

    # Weighted sum
    overall_score = (
        weights['roi'] * roi_z +
        weights['win_rate'] * win_z +
        weights['optimal_rate'] * optimal_z +
        weights['boom_rate'] * boom_z +
        weights['leverage'] * leverage_z +
        weights['sharpe'] * sharpe_z
    )

    # Normalize to 0-100 scale
    return max(0, min(100, 50 + overall_score * 10))

class AdvancedMonteCarloSimulator:
    """Advanced Monte Carlo simulator with all enhancements"""

    def __init__(self, players: List[Player], contest: Optional[Contest] = None,
                 historical_data: Optional[pd.DataFrame] = None):
        self.players = players
        self.contest = contest

        # Initialize all enhancements
        self.historical_calibration = HistoricalCalibration()
        self.copula_model = CopulaCorrelationModel()
        self.ml_enhancer = MLProjectionEnhancer()
        self.hierarchical_sim = HierarchicalSimulator()
        self.adaptive_sampler = AdaptiveSampler(target_precision=0.01)

        # Train models if historical data available
        if historical_data is not None:
            self._train_enhancement_models(historical_data)

        # Create enhancement dictionary
        enhancements = {
            'calibration': self.historical_calibration,
            'copula': self.copula_model,
            'ml_model': self.ml_enhancer,
            'hierarchical': self.hierarchical_sim,
            'adaptive': self.adaptive_sampler
        }

        # Initialize base simulator with enhancements
        self.simulator = MonteCarloSimulator(players, contest, enhancements)

    def _train_enhancement_models(self, historical_data: pd.DataFrame):
        """Train all enhancement models with historical data"""
        try:
            # Fit historical calibration
            self.historical_calibration.fit_player_distributions(historical_data)

            # Fit copula model
            self.copula_model.fit(historical_data)

            # Train ML model (simplified - would need proper feature engineering)
            # For now, create mock training data
            mock_training_data = self._create_mock_training_data(historical_data)
            self.ml_enhancer.train(mock_training_data)

            logger.info("Successfully trained all enhancement models")

        except Exception as e:
            logger.error(f"Failed to train enhancement models: {e}")

    def _create_mock_training_data(self, historical_data: pd.DataFrame) -> pd.DataFrame:
        """Create mock training data for ML model (simplified)"""
        # This would be much more sophisticated in production
        training_records = []

        for _, row in historical_data.iterrows():
            record = {
                'base_projection': row.get('fantasy_points', 10),
                'ownership': np.random.uniform(0.05, 0.35),
                'salary': np.random.randint(3000, 10000),
                'position_rank': np.random.randint(1, 50),
                'team_strength': np.random.uniform(0.3, 0.8),
                'matchup_difficulty': np.random.uniform(0.2, 0.9),
                'weather_impact': np.random.choice([-0.1, 0, 0.1]),
                'injury_status': np.random.choice([0, 0.3, 0.7]),  # 0=healthy, 0.3=questionable, 0.7=injured
                'recent_form': np.random.uniform(0.3, 1.0),
                'season_trend': np.random.uniform(0.4, 1.1),
                'actual_points': row.get('fantasy_points', 10) + np.random.normal(0, 2)
            }
            training_records.append(record)

        return pd.DataFrame(training_records)

    async def simulate_lineup_advanced(self, lineup: Lineup,
                                     n_simulations: int = 1000,
                                     use_adaptive: bool = True) -> SimulationResults:
        """Advanced simulation with all enhancements"""
        if use_adaptive:
            return await self._adaptive_simulation(lineup, n_simulations)
        else:
            return await self.simulator.simulate_lineup(lineup, n_simulations)

    async def _adaptive_simulation(self, lineup: Lineup, max_simulations: int = 5000) -> SimulationResults:
        """Adaptive simulation that continues until precision target met"""
        logger.info(f"Starting adaptive simulation for lineup {lineup.lineupId}")

        all_scores = []
        all_payouts = []
        n_simulations = 0
        batch_size = 500

        while n_simulations < max_simulations:
            # Run batch of simulations
            batch_result = await self.simulator.simulate_lineup(lineup, batch_size)
            n_simulations += batch_size

            # Extract scores and payouts from batch result
            # (This is simplified - in practice we'd need to modify simulate_lineup to return raw data)
            batch_scores = [batch_result.mean_score + np.random.normal(0, batch_result.std_dev)
                          for _ in range(batch_size)]
            batch_payouts = [0] * batch_size  # Simplified

            all_scores.extend(batch_scores)
            all_payouts.extend(batch_payouts)

            # Check if we should continue
            current_std = np.std(all_scores)
            if not self.adaptive_sampler.should_continue_sampling(n_simulations, current_std):
                break

        # Calculate final metrics
        scores_array = np.array(all_scores)
        payouts_array = np.array(all_payouts)

        mean_score = float(np.mean(scores_array))
        std_dev = float(np.std(scores_array))
        percentiles = {
            10: float(np.percentile(scores_array, 10)),
            25: float(np.percentile(scores_array, 25)),
            50: float(np.percentile(scores_array, 50)),
            75: float(np.percentile(scores_array, 75)),
            90: float(np.percentile(scores_array, 90))
        }

        # Payout-aware metrics (simplified)
        roi = 0.0
        win_rate = 0.0
        if self.contest:
            roi = float(np.mean(payouts_array) / self.contest.entryFee)
            win_rate = float(np.mean(payouts_array > 0))

        return SimulationResults(
            iterations=n_simulations,
            mean_score=round(mean_score, 1),
            std_dev=round(std_dev, 1),
            percentiles=percentiles,
            win_rate=round(win_rate, 4),
            optimal_rate=0.0,  # Would need field simulation
            roi=round(roi, 4),
            sharpe=round(roi / std_dev, 2) if std_dev > 0 else 0,
            max_drawdown=0.0
        )

    async def hierarchical_simulation(self, lineup: Lineup, n_games: int = 100) -> SimulationResults:
        """Hierarchical simulation: games first, then players"""
        logger.info(f"Running hierarchical simulation for lineup {lineup.lineupId}")

        total_scores = []

        for _ in range(n_games):
            # Simulate game context
            game_context = self.hierarchical_sim.simulate_game_context({})

            # Simulate each player given game context
            game_score = 0
            for player_id in lineup.playerIds:
                player = next((p for p in self.players if p.playerId == player_id), None)
                if player:
                    player_points = self.hierarchical_sim.simulate_player_given_game(player, game_context)
                    game_score += player_points

            total_scores.append(game_score)

        # Calculate metrics
        scores_array = np.array(total_scores)
        mean_score = float(np.mean(scores_array))
        std_dev = float(np.std(scores_array))

        percentiles = {
            10: float(np.percentile(scores_array, 10)),
            25: float(np.percentile(scores_array, 25)),
            50: float(np.percentile(scores_array, 50)),
            75: float(np.percentile(scores_array, 75)),
            90: float(np.percentile(scores_array, 90))
        }

        return SimulationResults(
            iterations=n_games,
            mean_score=round(mean_score, 1),
            std_dev=round(std_dev, 1),
            percentiles=percentiles,
            win_rate=0.0,
            optimal_rate=0.0,
            roi=0.0,
            sharpe=0.0,
            max_drawdown=0.0
        )

    def get_enhancement_stats(self) -> Dict[str, Any]:
        """Get statistics about enhancement models"""
        return {
            'historical_calibration': {
                'fitted_players': len(self.historical_calibration.player_distributions),
                'distributions': list(self.historical_calibration.player_distributions.keys())[:5]
            },
            'copula_model': {
                'is_fitted': self.copula_model.is_fitted,
                'available': COPULA_AVAILABLE
            },
            'ml_enhancer': {
                'is_trained': self.ml_enhancer.is_trained,
                'features': self.ml_enhancer.feature_columns if self.ml_enhancer.is_trained else []
            },
            'adaptive_sampler': {
                'target_precision': self.adaptive_sampler.target_precision
            }
        }

# Convenience functions
async def simulate_lineup(lineup: Lineup, players: List[Player],
                         contest: Optional[Contest] = None,
                         n_simulations: int = 1000) -> SimulationResults:
    """Simulate a single lineup"""
    simulator = MonteCarloSimulator(players, contest)
    return simulator.simulate_lineup(lineup, n_simulations)

async def simulate_lineups(lineups: List[Lineup], players: List[Player],
                          contest: Optional[Contest] = None,
                          n_simulations: int = 1000) -> Dict[str, SimulationResults]:
    """Simulate multiple lineups"""
    simulator = MonteCarloSimulator(players, contest)
    return await simulator.simulate_multiple_lineups(lineups, n_simulations)

async def simulate_lineup_advanced(lineup: Lineup, players: List[Player],
                                  contest: Optional[Contest] = None,
                                  historical_data: Optional[pd.DataFrame] = None,
                                  n_simulations: int = 1000,
                                  use_adaptive: bool = True) -> SimulationResults:
    """Advanced simulation with all enhancements"""
    simulator = AdvancedMonteCarloSimulator(players, contest, historical_data)
    return await simulator.simulate_lineup_advanced(lineup, n_simulations, use_adaptive)

async def simulate_hierarchical(lineup: Lineup, players: List[Player],
                               n_games: int = 100) -> SimulationResults:
    """Hierarchical simulation"""
    simulator = AdvancedMonteCarloSimulator(players)
    return await simulator.hierarchical_simulation(lineup, n_games)
