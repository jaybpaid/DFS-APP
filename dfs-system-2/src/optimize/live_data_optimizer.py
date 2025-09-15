#!/usr/bin/env python3
"""
Live Data DFS Optimizer - Professional MIP-based lineup generation with real-time DraftKings integration
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
# Try OR-Tools first, fallback to PuLP
try:
    from ortools.linear_solver import pywraplp
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False

# Always import PuLP as fallback
try:
    import pulp
    HAS_PULP = True
except ImportError:
    HAS_PULP = False
import pandas as pd
from dataclasses import dataclass
from enum import Enum
import scipy.stats

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OptimizationObjective(Enum):
    EXPECTED_VALUE = "ev"
    LEVERAGE = "leverage"
    CEILING = "ceiling"
    SHARPE_RATIO = "sharpe"

class ContestType(Enum):
    CASH_GAME = "cash"
    TOURNAMENT = "gpp"

@dataclass
class Player:
    """Enhanced player data structure with live metrics"""
    id: str
    name: str
    position: str
    team: str
    salary: int
    projection: float
    ownership: float
    leverage_score: float
    boom_pct: int
    floor: float
    ceiling: float
    correlation_score: float
    volatility: float
    sources_count: int
    locked: bool = False
    banned: bool = False
    exposure: float = 100.0

@dataclass
class Lineup:
    """Optimized lineup with advanced metrics"""
    players: List[Player]
    total_salary: int
    total_projection: float
    expected_roi: float
    win_rate: float
    sharpe_ratio: float
    kelly_percent: float
    diversity_score: float
    correlation_risk: float
    strategy: str

class LiveDataOptimizer:
    """Professional DFS optimizer with live DraftKings data integration"""

    def __init__(self, sport: str = "NFL", site: str = "DraftKings"):
        self.sport = sport
        self.site = site
        self.api_base = "http://localhost:8001"
        self.session = None
        self.players: List[Player] = []
        self.last_data_update = None
        self.data_cache_ttl = 900  # 15 minutes

        # Position requirements
        self.position_requirements = {
            'NFL': {
                'DraftKings': {'QB': 1, 'RB': 2, 'WR': 3, 'TE': 1, 'DST': 1},
                'FanDuel': {'QB': 1, 'RB': 2, 'WR': 3, 'TE': 1}
            },
            'NBA': {
                'DraftKings': {'PG': 1, 'SG': 1, 'SF': 1, 'PF': 1, 'C': 1, 'FLEX': 3},
                'FanDuel': {'PG': 1, 'SG': 1, 'SF': 1, 'PF': 1, 'C': 1, 'FLEX': 3}
            }
        }

        self.salary_cap = 50000 if site == "DraftKings" else 60000

    async def initialize(self):
        """Initialize the optimizer with live data connection"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        )
        logger.info(f"🚀 Live Data Optimizer initialized for {self.sport} {self.site}")

    async def close(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()

    async def load_live_data(self, force_refresh: bool = False) -> bool:
        """Load live player data from DraftKings API"""
        try:
            # Ensure session exists
            if not self.session:
                logger.info("Initializing session for live data loading...")
                await self.initialize()

            # Check cache validity
            if not force_refresh and self.last_data_update and \
               (datetime.now() - self.last_data_update) < timedelta(seconds=self.data_cache_ttl):
                logger.info("Using cached live data")
                return True

            # Fetch live data
            url = f"{self.api_base}/api/players?sport={self.sport}"
            logger.info(f"Fetching live data from: {url}")

            async with self.session.get(url) as response:
                if response.status != 200:
                    logger.error(f"API request failed with status {response.status}")
                    return False

                data = await response.json()
                if data is None:
                    logger.error("API returned None response")
                    return False

                if data.get('status') != 'active':
                    logger.error(f"API returned error status: {data.get('status', 'Unknown error')}")
                    return False

                # Transform API data to Player objects
                self.players = self._transform_api_data(data['players'])
                self.last_data_update = datetime.now()

                logger.info(f"✅ Loaded {len(self.players)} players from live DraftKings data")
                return True

        except Exception as e:
            logger.error(f"Error loading live data: {str(e)}")
            return False

    def _transform_api_data(self, api_players: List[Dict]) -> List[Player]:
        """Transform API response to Player objects"""
        players = []

        for p in api_players:
            try:
                position = p.get('position') or p.get('pos', 'UTIL')

                # Skip FLEX positions as they are duplicate entries
                if position == 'FLEX':
                    continue

                player = Player(
                    id=p.get('id') or p['name'].replace(' ', '').lower(),
                    name=p['name'],
                    position=position,
                    team=p['team'],
                    salary=int(p.get('salary_dk') or p.get('salary') or p.get('salary_fd') or 0),
                    projection=float(p.get('projection') or 15.0),
                    ownership=float(p.get('ownership') or 15.0),
                    leverage_score=float(p.get('value') or 2.0),
                    boom_pct=int(p.get('boom_pct') or 25),
                    floor=float(p.get('floor') or (p.get('projection') or 15.0) * 0.7),
                    ceiling=float(p.get('ceiling') or (p.get('projection') or 15.0) * 1.4),
                    correlation_score=float(p.get('correlation_score') or 0.5),
                    volatility=float(p.get('volatility') or 0.2),
                    sources_count=int(p.get('sources_count') or 1),
                    locked=bool(p.get('locked', False)),
                    banned=bool(p.get('banned', False)),
                    exposure=float(p.get('exposure', 100.0))
                )
                players.append(player)
            except (KeyError, ValueError, TypeError) as e:
                logger.warning(f"Skipping invalid player data: {p.get('name', 'Unknown')} - {str(e)}")
                continue

        return players

    def generate_lineups(self,
                        num_lineups: int = 20,
                        objective: OptimizationObjective = OptimizationObjective.EXPECTED_VALUE,
                        contest_type: ContestType = ContestType.TOURNAMENT,
                        locked_players: List[str] = None,
                        banned_players: List[str] = None,
                        max_exposure: float = 100.0,
                        min_salary_remaining: int = 0) -> List[Lineup]:
        """
        Generate optimized lineups using MIP solver

        Args:
            num_lineups: Number of lineups to generate
            objective: Optimization objective
            contest_type: Cash game or tournament
            locked_players: List of player names to lock
            banned_players: List of player names to ban
            max_exposure: Maximum exposure per player
            min_salary_remaining: Minimum salary remaining

        Returns:
            List of optimized Lineup objects
        """

        if not self.players:
            logger.error("No player data available. Load live data first.")
            return []

        # Apply locks and bans
        available_players = self._apply_constraints(locked_players or [], banned_players or [])

        if len(available_players) < self._get_min_players_required():
            logger.error("Insufficient players after applying constraints")
            return []

        lineups = []

        for i in range(num_lineups):
            try:
                lineup = self._optimize_single_lineup(
                    available_players, objective, contest_type,
                    max_exposure, min_salary_remaining
                )

                if lineup and lineup.players:
                    # Add advanced metrics
                    lineup = self._calculate_advanced_metrics(lineup, available_players)
                    lineups.append(lineup)
                    logger.info(f"Generated lineup {i+1}/{num_lineups}: {lineup.total_projection:.1f} pts, ${lineup.total_salary}")

                    # Remove used players for diversity (except locked ones)
                    if contest_type == ContestType.TOURNAMENT:
                        available_players = self._remove_high_exposure_players(available_players, lineup)
                else:
                    logger.warning(f"Lineup {i+1} optimization returned None or empty lineup")

            except Exception as e:
                logger.error(f"Error generating lineup {i+1}: {str(e)}")
                continue

        logger.info(f"✅ Generated {len(lineups)} optimized lineups")
        return lineups

    def _apply_constraints(self, locked_players: List[str], banned_players: List[str]) -> List[Player]:
        """Apply locked and banned player constraints"""
        available = []

        for player in self.players:
            # Check if player is banned
            if player.name in banned_players or player.banned:
                continue

            # Check if player should be locked
            if player.name in locked_players:
                player.locked = True

            available.append(player)

        return available

    def _optimize_single_lineup(self,
                               available_players: List[Player],
                               objective: OptimizationObjective,
                               contest_type: ContestType,
                               max_exposure: float,
                               min_salary_remaining: int) -> Optional[Lineup]:
        """Optimize a single lineup using MIP solver (OR-Tools or PuLP fallback)"""

        if HAS_ORTOOLS:
            logger.info("Trying OR-Tools solver...")
            result = self._optimize_with_ortools(available_players, objective, contest_type, max_exposure, min_salary_remaining)
            if result is None:
                logger.info("OR-Tools failed, trying PuLP fallback...")
                return self._optimize_with_pulp(available_players, objective, contest_type, max_exposure, min_salary_remaining)
            return result
        else:
            logger.info("Using PuLP solver (OR-Tools not available)")
            return self._optimize_with_pulp(available_players, objective, contest_type, max_exposure, min_salary_remaining)

    def _optimize_with_ortools(self,
                               available_players: List[Player],
                               objective: OptimizationObjective,
                               contest_type: ContestType,
                               max_exposure: float,
                               min_salary_remaining: int) -> Optional[Lineup]:
        """Optimize using OR-Tools"""

        # Create solver
        solver = pywraplp.Solver.CreateSolver('SCIP')
        if not solver:
            logger.error("Could not create OR-Tools MIP solver")
            return None

        # Create binary variables for each player
        player_vars = {}
        for player in available_players:
            player_vars[player.id] = solver.BoolVar(f'player_{player.id}')

        # Position constraints
        pos_reqs = self.position_requirements[self.sport][self.site]
        pos_players = self._group_players_by_position(available_players)

        for pos, count in pos_reqs.items():
            if pos in pos_players:
                solver.Add(sum(player_vars[p.id] for p in pos_players[pos]) == count)

        # Salary cap constraint
        solver.Add(sum(player_vars[p.id] * p.salary for p in available_players) <= self.salary_cap)
        solver.Add(sum(player_vars[p.id] * p.salary for p in available_players) >= self.salary_cap - 5000)  # Min salary usage (relaxed)

        # Locked players constraint
        for player in available_players:
            if player.locked:
                solver.Add(player_vars[player.id] == 1)

        # Max 4 players per team (NFL) or 3 per team (NBA) - RELAXED FOR TESTING
        # max_per_team = 4 if self.sport == 'NFL' else 3
        # team_players = self._group_players_by_team(available_players)
        # for team, players in team_players.items():
        #     solver.Add(sum(player_vars[p.id] for p in players) <= max_per_team)

        # Objective function based on optimization goal
        if objective == OptimizationObjective.EXPECTED_VALUE:
            # Maximize projected points
            solver.Maximize(sum(player_vars[p.id] * p.projection for p in available_players))
        elif objective == OptimizationObjective.LEVERAGE:
            # Maximize leverage score
            solver.Maximize(sum(player_vars[p.id] * p.leverage_score for p in available_players))
        elif objective == OptimizationObjective.CEILING:
            # Maximize ceiling projection
            solver.Maximize(sum(player_vars[p.id] * p.ceiling for p in available_players))
        elif objective == OptimizationObjective.SHARPE_RATIO:
            # Maximize risk-adjusted return (projection / volatility)
            solver.Maximize(sum(player_vars[p.id] * (p.projection / max(p.volatility, 0.1)) for p in available_players))

        # Solve the problem
        status = solver.Solve()

        if status != pywraplp.Solver.OPTIMAL:
            logger.warning("No optimal solution found with OR-Tools")
            return None

        # Extract selected players
        selected_players = []
        total_salary = 0
        total_projection = 0.0

        for player in available_players:
            if player_vars[player.id].solution_value() > 0.5:
                selected_players.append(player)
                total_salary += player.salary
                total_projection += player.projection

        return Lineup(
            players=selected_players,
            total_salary=total_salary,
            total_projection=round(total_projection, 1),
            expected_roi=0.0,  # Will be calculated later
            win_rate=0.0,
            sharpe_ratio=0.0,
            kelly_percent=0.0,
            diversity_score=0.0,
            correlation_risk=0.0,
            strategy=objective.value
        )

    def _optimize_with_pulp(self,
                           available_players: List[Player],
                           objective: OptimizationObjective,
                           contest_type: ContestType,
                           max_exposure: float,
                           min_salary_remaining: int) -> Optional[Lineup]:
        """Fallback optimization using PuLP"""

        logger.info("Using PuLP solver (OR-Tools not available)")

        # Create PuLP problem
        prob = pulp.LpProblem("DFS_Lineup_Optimization", pulp.LpMaximize)

        # Create binary variables for each player
        player_vars = pulp.LpVariable.dicts("player", [p.id for p in available_players], cat='Binary')

        # Position constraints
        pos_reqs = self.position_requirements[self.sport][self.site]
        pos_players = self._group_players_by_position(available_players)

        for pos, count in pos_reqs.items():
            if pos in pos_players:
                player_ids = [p.id for p in pos_players[pos]]
                prob += pulp.lpSum([player_vars[p_id] for p_id in player_ids]) == count

        # Salary cap constraint
        prob += pulp.lpSum([player_vars[p.id] * p.salary for p in available_players]) <= self.salary_cap
        prob += pulp.lpSum([player_vars[p.id] * p.salary for p in available_players]) >= self.salary_cap - 5000

        # Locked players constraint
        for player in available_players:
            if player.locked:
                prob += player_vars[player.id] == 1

        # Max players per team
        max_per_team = 4 if self.sport == 'NFL' else 3
        team_players = self._group_players_by_team(available_players)
        for team, players in team_players.items():
            player_ids = [p.id for p in players]
            prob += pulp.lpSum([player_vars[p_id] for p_id in player_ids]) <= max_per_team

        # Objective function
        if objective == OptimizationObjective.EXPECTED_VALUE:
            prob += pulp.lpSum([player_vars[p.id] * p.projection for p in available_players])
        elif objective == OptimizationObjective.LEVERAGE:
            prob += pulp.lpSum([player_vars[p.id] * p.leverage_score for p in available_players])
        elif objective == OptimizationObjective.CEILING:
            prob += pulp.lpSum([player_vars[p.id] * p.ceiling for p in available_players])
        elif objective == OptimizationObjective.SHARPE_RATIO:
            prob += pulp.lpSum([player_vars[p.id] * (p.projection / max(p.volatility, 0.1)) for p in available_players])

        # Solve the problem
        prob.solve(pulp.PULP_CBC_CMD(msg=False))

        if pulp.LpStatus[prob.status] != 'Optimal':
            logger.warning("No optimal solution found with PuLP")
            return None

        # Extract selected players
        selected_players = []
        total_salary = 0
        total_projection = 0.0

        for player in available_players:
            if player_vars[player.id].value() > 0.5:
                selected_players.append(player)
                total_salary += player.salary
                total_projection += player.projection

        return Lineup(
            players=selected_players,
            total_salary=total_salary,
            total_projection=round(total_projection, 1),
            expected_roi=0.0,
            win_rate=0.0,
            sharpe_ratio=0.0,
            kelly_percent=0.0,
            diversity_score=0.0,
            correlation_risk=0.0,
            strategy=objective.value
        )

    def _calculate_advanced_metrics(self, lineup: Lineup, all_players: List[Player]) -> Lineup:
        """Calculate advanced portfolio metrics for the lineup"""

        # Expected ROI based on projections and ownership
        avg_ownership = np.mean([p.ownership for p in lineup.players])
        lineup.expected_roi = (lineup.total_projection / 100) - (avg_ownership / 100) * 2

        # Win rate estimation (simplified model)
        lineup.win_rate = min(0.95, max(0.01, lineup.total_projection / 200))

        # Sharpe ratio (risk-adjusted return)
        volatilities = [p.volatility for p in lineup.players]
        avg_volatility = np.mean(volatilities)
        lineup.sharpe_ratio = lineup.expected_roi / max(avg_volatility, 0.1)

        # Kelly Criterion bet sizing
        win_prob = lineup.win_rate
        odds = 1 / (1 - win_prob) - 1  # Simplified odds calculation
        lineup.kelly_percent = max(0, min(20, (win_prob * (odds + 1) - 1) / odds * 100))

        # Diversity score (position distribution)
        positions = [p.position for p in lineup.players]
        unique_positions = len(set(positions))
        lineup.diversity_score = unique_positions / len(positions) * 100

        # Correlation risk (simplified)
        correlations = [p.correlation_score for p in lineup.players]
        lineup.correlation_risk = np.mean(correlations) * 100

        return lineup

    def _remove_high_exposure_players(self, players: List[Player], lineup: Lineup) -> List[Player]:
        """Remove high-exposure players for lineup diversity"""
        # Simple exposure management - remove players already used
        used_player_ids = {p.id for p in lineup.players}
        return [p for p in players if p.id not in used_player_ids]

    def _group_players_by_position(self, players: List[Player]) -> Dict[str, List[Player]]:
        """Group players by position"""
        groups = {}
        for player in players:
            if player.position not in groups:
                groups[player.position] = []
            groups[player.position].append(player)
        return groups

    def _group_players_by_team(self, players: List[Player]) -> Dict[str, List[Player]]:
        """Group players by team"""
        groups = {}
        for player in players:
            if player.team not in groups:
                groups[player.team] = []
            groups[player.team].append(player)
        return groups

    def _get_min_players_required(self) -> int:
        """Get minimum players required for a valid lineup"""
        pos_reqs = self.position_requirements[self.sport][self.site]
        return sum(pos_reqs.values())

    async def run_monte_carlo_simulation(self,
                                       lineups: List[Lineup],
                                       num_simulations: int = 50000,
                                       field_size: int = 100000) -> Dict[str, Any]:
        """
        Run Monte Carlo simulation to estimate lineup performance

        Args:
            lineups: List of lineups to simulate
            num_simulations: Number of simulation runs
            field_size: Size of the contest field

        Returns:
            Dictionary with simulation results
        """

        logger.info(f"Running {num_simulations} Monte Carlo simulations...")

        # Simulate each lineup's performance
        lineup_results = []

        for lineup in lineups:
            scores = []

            for _ in range(num_simulations):
                # Generate realistic score based on player projections and correlations
                total_score = 0.0

                for player in lineup.players:
                    # Add some randomness based on volatility
                    random_factor = np.random.normal(0, player.volatility)
                    player_score = player.projection * (1 + random_factor)
                    # Ensure minimum floor
                    player_score = max(player.floor, player_score)
                    total_score += player_score

                scores.append(total_score)

            scores = np.array(scores)

            # Calculate statistics
            mean_score = np.mean(scores)
            std_score = np.std(scores)
            percentile_90 = np.percentile(scores, 90)
            percentile_99 = np.percentile(scores, 99)

            # Estimate win probability (simplified)
            # Assume field has normal distribution around mean score
            field_mean = mean_score * 0.95  # Slightly lower average
            field_std = std_score * 1.2     # Slightly more variance
            win_prob = 1 - scipy.stats.norm.cdf(mean_score, field_mean, field_std)

            lineup_results.append({
                'lineup_id': f"lineup_{lineups.index(lineup) + 1}",
                'mean_score': round(mean_score, 1),
                'std_score': round(std_score, 1),
                'score_90th': round(percentile_90, 1),
                'score_99th': round(percentile_99, 1),
                'win_probability': round(win_prob * 100, 2),
                'roi_potential': round((win_prob * field_size * 0.1) - 1, 2)  # Simplified ROI
            })

        # Overall statistics
        overall_stats = {
            'total_simulations': num_simulations,
            'field_size': field_size,
            'avg_win_rate': round(np.mean([r['win_probability'] for r in lineup_results]), 2),
            'best_lineup': max(lineup_results, key=lambda x: x['win_probability']),
            'lineup_results': lineup_results
        }

        logger.info(f"✅ Monte Carlo simulation complete. Avg win rate: {overall_stats['avg_win_rate']}%")
        return overall_stats

    def calculate_late_swaps(self,
                            lineups: List[Lineup],
                            locked_players: List[str] = None) -> List[Dict[str, Any]]:
        """
        Calculate optimal late swap opportunities

        Args:
            lineups: Current lineups
            locked_players: Players that are locked (can't be swapped)

        Returns:
            List of swap recommendations
        """

        if not lineups:
            return []

        locked_players = set(locked_players or [])
        swap_recommendations = []

        # Analyze each lineup for potential improvements
        for lineup_idx, lineup in enumerate(lineups):
            lineup_swaps = []

            for player in lineup.players:
                if player.name in locked_players:
                    continue

                # Find potential replacements
                replacements = self._find_swap_candidates(player, lineup.players)

                for replacement in replacements[:3]:  # Top 3 candidates
                    salary_diff = replacement.salary - player.salary
                    projection_diff = replacement.projection - player.projection
                    ownership_diff = replacement.ownership - player.ownership

                    # Calculate swap value
                    swap_value = projection_diff - (salary_diff / 1000) * 2  # Salary efficiency factor

                    if swap_value > 0.5:  # Only recommend positive value swaps
                        lineup_swaps.append({
                            'lineup_id': f"lineup_{lineup_idx + 1}",
                            'current_player': player.name,
                            'replacement_player': replacement.name,
                            'position': player.position,
                            'salary_diff': salary_diff,
                            'projection_diff': round(projection_diff, 1),
                            'ownership_diff': round(ownership_diff, 1),
                            'swap_value': round(swap_value, 1),
                            'reason': self._get_swap_reason(salary_diff, projection_diff, ownership_diff)
                        })

            # Sort by swap value and take top recommendations
            lineup_swaps.sort(key=lambda x: x['swap_value'], reverse=True)
            swap_recommendations.extend(lineup_swaps[:2])  # Top 2 per lineup

        # Sort all recommendations by value
        swap_recommendations.sort(key=lambda x: x['swap_value'], reverse=True)

        logger.info(f"✅ Generated {len(swap_recommendations)} late swap recommendations")
        return swap_recommendations

    def _find_swap_candidates(self, current_player: Player, lineup_players: List[Player]) -> List[Player]:
        """Find potential replacement players for a given player"""
        candidates = []

        for player in self.players:
            # Same position, not in current lineup, not banned
            if (player.position == current_player.position and
                player.name not in [p.name for p in lineup_players] and
                not player.banned):

                # Calculate fit score
                salary_efficiency = player.projection / player.salary
                ownership_leverage = 1 / max(player.ownership, 1)  # Lower ownership = higher leverage

                fit_score = salary_efficiency * ownership_leverage
                player.fit_score = fit_score
                candidates.append(player)

        # Sort by fit score
        candidates.sort(key=lambda x: x.fit_score, reverse=True)
        return candidates

    def _get_swap_reason(self, salary_diff: int, projection_diff: float, ownership_diff: float) -> str:
        """Generate human-readable reason for the swap"""
        reasons = []

        if salary_diff < 0:
            reasons.append("Salary efficient")
        if projection_diff > 2:
            reasons.append("Major projection upgrade")
        elif projection_diff > 0.5:
            reasons.append("Projection upgrade")
        if ownership_diff < -5:
            reasons.append("Ownership leverage")

        return " • ".join(reasons) if reasons else "Balanced upgrade"

# Global optimizer instance
live_optimizer = LiveDataOptimizer()

async def initialize_optimizer():
    """Initialize the global optimizer"""
    await live_optimizer.initialize()

async def generate_optimized_lineups(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main API endpoint for generating optimized lineups

    Expected request_data:
    {
        "sport": "NFL",
        "site": "DraftKings",
        "num_lineups": 20,
        "objective": "ev",
        "contest_type": "gpp",
        "locked_players": ["Josh Allen", "CMC"],
        "banned_players": [],
        "max_exposure": 100.0,
        "force_refresh": false
    }
    """

    try:
        # Update optimizer settings
        sport = request_data.get('sport', 'NFL')
        site = request_data.get('site', 'DraftKings')

        if sport != live_optimizer.sport or site != live_optimizer.site:
            await live_optimizer.close()
            live_optimizer.__init__(sport, site)
            await live_optimizer.initialize()

        # Load live data
        data_loaded = await live_optimizer.load_live_data(
            force_refresh=request_data.get('force_refresh', False)
        )

        if not data_loaded:
            return {
                'success': False,
                'error': 'Failed to load live data',
                'lineups': []
            }

        # Generate lineups
        num_lineups = min(request_data.get('num_lineups', 20), 150)  # Cap at 150

        objective_map = {
            'ev': OptimizationObjective.EXPECTED_VALUE,
            'leverage': OptimizationObjective.LEVERAGE,
            'ceiling': OptimizationObjective.CEILING,
            'sharpe': OptimizationObjective.SHARPE_RATIO
        }

        objective = objective_map.get(request_data.get('objective', 'ev'), OptimizationObjective.EXPECTED_VALUE)
        contest_type = ContestType.TOURNAMENT if request_data.get('contest_type') == 'gpp' else ContestType.CASH_GAME

        lineups = live_optimizer.generate_lineups(
            num_lineups=num_lineups,
            objective=objective,
            contest_type=contest_type,
            locked_players=request_data.get('locked_players', []),
            banned_players=request_data.get('banned_players', []),
            max_exposure=request_data.get('max_exposure', 100.0)
        )

        # Convert to JSON-serializable format
        lineup_data = []
        for lineup in lineups:
            lineup_dict = {
                'id': f"lineup_{lineups.index(lineup) + 1}",
                'players': [{
                    'name': p.name,
                    'position': p.position,
                    'team': p.team,
                    'salary': p.salary,
                    'projection': p.projection,
                    'ownership': p.ownership
                } for p in lineup.players],
                'total_salary': lineup.total_salary,
                'total_projection': lineup.total_projection,
                'expected_roi': round(lineup.expected_roi, 2),
                'win_rate': round(lineup.win_rate, 3),
                'sharpe_ratio': round(lineup.sharpe_ratio, 2),
                'kelly_percent': round(lineup.kelly_percent, 1),
                'diversity_score': round(lineup.diversity_score, 1),
                'correlation_risk': round(lineup.correlation_risk, 1),
                'strategy': lineup.strategy
            }
            lineup_data.append(lineup_dict)

        # Also include the full player pool for the frontend
        player_pool_data = []
        for player in live_optimizer.players:
            player_dict = {
                'id': player.id,
                'name': player.name,
                'position': player.position,
                'team': player.team,
                'salary': player.salary,
                'projection': player.projection,
                'consensus_projection': player.projection,
                'ownership': player.ownership,
                'rg_ownership': player.ownership,
                'leverage_score': player.leverage_score,
                'boom_pct': player.boom_pct,
                'floor': player.floor,
                'ceiling': player.ceiling,
                'correlation_score': player.correlation_score,
                'volatility': player.volatility,
                'sources_count': player.sources_count,
                'locked': player.locked,
                'banned': player.banned,
                'exposure': player.exposure,
                'value': round(player.projection / (player.salary / 1000), 2) if player.salary > 0 else 0
            }
            player_pool_data.append(player_dict)

        return {
            'success': True,
            'sport': sport,
            'site': site,
            'total_lineups': len(lineup_data),
            'data_timestamp': live_optimizer.last_data_update.isoformat() if live_optimizer.last_data_update else None,
            'lineups': lineup_data,
            'player_pool': player_pool_data,
            'total_players': len(player_pool_data)
        }

    except Exception as e:
        logger.error(f"Error generating lineups: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'lineups': []
        }

async def run_simulation(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation on lineups

    Expected request_data:
    {
        "lineups": [...],  # Lineup data from generate_optimized_lineups
        "num_simulations": 50000,
        "field_size": 100000
    }
    """

    try:
        # Convert lineup data back to Lineup objects
        lineups = []
        for lineup_data in request_data.get('lineups', []):
            players = []
            for p_data in lineup_data['players']:
                player = Player(
                    id=p_data['name'].replace(' ', '').lower(),
                    name=p_data['name'],
                    position=p_data['position'],
                    team=p_data['team'],
                    salary=p_data['salary'],
                    projection=p_data['projection'],
                    ownership=p_data.get('ownership', 15.0),
                    leverage_score=2.0,
                    boom_pct=25,
                    floor=p_data['projection'] * 0.7,
                    ceiling=p_data['projection'] * 1.4,
                    correlation_score=0.5,
                    volatility=0.2,
                    sources_count=1
                )
                players.append(player)

            lineup = Lineup(
                players=players,
                total_salary=lineup_data['total_salary'],
                total_projection=lineup_data['total_projection'],
                expected_roi=lineup_data.get('expected_roi', 0.0),
                win_rate=lineup_data.get('win_rate', 0.0),
                sharpe_ratio=lineup_data.get('sharpe_ratio', 0.0),
                kelly_percent=lineup_data.get('kelly_percent', 0.0),
                diversity_score=lineup_data.get('diversity_score', 0.0),
                correlation_risk=lineup_data.get('correlation_risk', 0.0),
                strategy=lineup_data.get('strategy', 'ev')
            )
            lineups.append(lineup)

        # Run simulation
        num_simulations = request_data.get('num_simulations', 50000)
        field_size = request_data.get('field_size', 100000)

        results = await live_optimizer.run_monte_carlo_simulation(
            lineups, num_simulations, field_size
        )

        return {
            'success': True,
            'simulation_results': results
        }

    except Exception as e:
        logger.error(f"Error running simulation: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

async def calculate_swaps(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate late swap opportunities

    Expected request_data:
    {
        "lineups": [...],  # Lineup data from generate_optimized_lineups
        "locked_players": ["Josh Allen"]
    }
    """

    try:
        # Convert lineup data back to Lineup objects (simplified)
        lineups = []
        for lineup_data in request_data.get('lineups', []):
            players = []
            for p_data in lineup_data['players']:
                player = Player(
                    id=p_data['name'].replace(' ', '').lower(),
                    name=p_data['name'],
                    position=p_data['position'],
                    team=p_data['team'],
                    salary=p_data['salary'],
                    projection=p_data['projection'],
                    ownership=p_data.get('ownership', 15.0),
                    leverage_score=2.0,
                    boom_pct=25,
                    floor=p_data['projection'] * 0.7,
                    ceiling=p_data['projection'] * 1.4,
                    correlation_score=0.5,
                    volatility=0.2,
                    sources_count=1
                )
                players.append(player)

            lineup = Lineup(
                players=players,
                total_salary=lineup_data['total_salary'],
                total_projection=lineup_data['total_projection'],
                expected_roi=0.0,
                win_rate=0.0,
                sharpe_ratio=0.0,
                kelly_percent=0.0,
                diversity_score=0.0,
                correlation_risk=0.0,
                strategy='ev'
            )
            lineups.append(lineup)

        # Calculate swaps
        locked_players = request_data.get('locked_players', [])
        swap_recommendations = live_optimizer.calculate_late_swaps(lineups, locked_players)

        return {
            'success': True,
            'swap_recommendations': swap_recommendations
        }

    except Exception as e:
        logger.error(f"Error calculating swaps: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

# Initialize when called (not at import time)
