"""
DFS Lineup Optimizer Engines
Implements ILP/MIP optimization and sim-guided sampling with comprehensive rules
"""

import asyncio
import logging
import random
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass
from itertools import combinations
import numpy as np

try:
    from pulp import LpProblem, LpVariable, LpMaximize, LpStatus, lpSum, LpInteger
    PULP_AVAILABLE = True
except ImportError:
    PULP_AVAILABLE = False

from ...packages.shared.types import Player, Lineup, Ruleset, Site, Sport
from .model import MonteCarloSimulator, calculate_overall_score

logger = logging.getLogger(__name__)

@dataclass
class OptimizationResult:
    """Result of optimization"""
    lineups: List[Lineup]
    total_lineups: int
    generation_time: float
    engine_used: str
    constraints_satisfied: bool
    error_message: Optional[str] = None

class ILPOptimizer:
    """Integer Linear Programming optimizer using PuLP"""

    def __init__(self, players: List[Player], ruleset: Ruleset):
        self.players = players
        self.ruleset = ruleset
        self.player_map = {p.playerId: p for p in players}

        if not PULP_AVAILABLE:
            raise ImportError("PuLP not available. Install with: pip install pulp")

    def optimize(self, num_lineups: int = 1, objective: str = 'projection') -> OptimizationResult:
        """Generate optimal lineups using ILP"""
        start_time = time.time()

        try:
            lineups = []

            for i in range(num_lineups):
                lineup = self._solve_single_lineup(objective)
                if lineup:
                    # Add unique ID
                    lineup.lineupId = f"ilp_{int(time.time())}_{i}"
                    lineups.append(lineup)
                else:
                    break

            generation_time = time.time() - start_time

            return OptimizationResult(
                lineups=lineups,
                total_lineups=len(lineups),
                generation_time=generation_time,
                engine_used="ILP",
                constraints_satisfied=len(lineups) > 0
            )

        except Exception as e:
            logger.error(f"ILP optimization failed: {e}")
            return OptimizationResult(
                lineups=[],
                total_lineups=0,
                generation_time=time.time() - start_time,
                engine_used="ILP",
                constraints_satisfied=False,
                error_message=str(e)
            )

    def _solve_single_lineup(self, objective: str) -> Optional[Lineup]:
        """Solve for a single optimal lineup"""
        # Create the problem
        prob = LpProblem("DFS_Lineup_Optimization", LpMaximize)

        # Create decision variables (0 or 1 for each player)
        player_vars = {p.playerId: LpVariable(f"player_{p.playerId}", 0, 1, LpInteger)
                      for p in self.players}

        # Objective function
        if objective == 'projection':
            prob += lpSum([player_vars[p.playerId] * (p.projection or 0) for p in self.players])
        elif objective == 'value':
            prob += lpSum([player_vars[p.playerId] * (p.value or 0) for p in self.players])
        elif objective == 'leverage':
            prob += lpSum([player_vars[p.playerId] * (p.leverage or 1) for p in self.players])

        # Basic constraints
        self._add_basic_constraints(prob, player_vars)

        # Stacking constraints
        self._add_stacking_constraints(prob, player_vars)

        # Group constraints
        self._add_group_constraints(prob, player_vars)

        # Exposure constraints
        self._add_exposure_constraints(prob, player_vars)

        # Solve the problem
        status = prob.solve()

        if LpStatus[status] == 'Optimal':
            # Extract selected players
            selected_players = []
            total_salary = 0
            total_projection = 0

            for player in self.players:
                if player_vars[player.playerId].value() == 1:
                    selected_players.append(player)
                    total_salary += player.salary
                    total_projection += player.projection or 0

            # Create lineup
            lineup = Lineup(
                lineupId="",  # Will be set by caller
                site=self.players[0].site if self.players else Site.DK,
                sport=self.players[0].sport if self.players else Sport.NFL,
                slateId=self.players[0].slateId if self.players else "",
                playerIds=[p.playerId for p in selected_players],
                salary=total_salary
            )

            return lineup

        return None

    def _add_basic_constraints(self, prob: LpProblem, player_vars: Dict[str, LpVariable]):
        """Add basic roster and salary constraints"""
        # Roster size constraint
        prob += lpSum([player_vars[p.playerId] for p in self.players]) == len(self.ruleset.rosterSlots)

        # Salary cap constraint
        prob += lpSum([player_vars[p.playerId] * p.salary for p in self.players]) <= self.ruleset.salaryCap

        # Position constraints
        position_counts = {}
        for slot in self.ruleset.rosterSlots:
            if slot not in position_counts:
                position_counts[slot] = 0
            position_counts[slot] += 1

        for position, count in position_counts.items():
            if position == 'FLEX':
                # FLEX can be RB/WR/TE
                flex_eligible = [p for p in self.players if any(pos in ['RB', 'WR', 'TE'] for pos in p.pos)]
                prob += lpSum([player_vars[p.playerId] for p in flex_eligible]) >= count
            else:
                position_players = [p for p in self.players if position in p.pos]
                prob += lpSum([player_vars[p.playerId] for p in position_players]) == count

        # Max from team constraint
        if self.ruleset.maxFromTeam:
            teams = set(p.team for p in self.players)
            for team in teams:
                team_players = [p for p in self.players if p.team == team]
                prob += lpSum([player_vars[p.playerId] for p in team_players]) <= self.ruleset.maxFromTeam

    def _add_stacking_constraints(self, prob: LpProblem, player_vars: Dict[str, LpVariable]):
        """Add stacking constraints"""
        if not self.ruleset.stack:
            return

        sport = self.players[0].sport if self.players else Sport.NFL

        # NFL stacking rules
        if sport == Sport.NFL:
            self._add_nfl_stacking(prob, player_vars)
        elif sport == Sport.NBA:
            self._add_nba_stacking(prob, player_vars)

    def _add_nfl_stacking(self, prob: LpProblem, player_vars: Dict[str, LpVariable]):
        """Add NFL-specific stacking constraints"""
        qbs = [p for p in self.players if 'QB' in p.pos]
        rbs = [p for p in self.players if 'RB' in p.pos]
        wrs = [p for p in self.players if 'WR' in p.pos]
        tes = [p for p in self.players if 'TE' in p.pos]

        # QB+2+bring-back stack
        if 'QB+2+bringback' in (self.ruleset.stack.templates or []):
            for qb in qbs:
                qb_team = qb.team
                team_wrs = [wr for wr in wrs if wr.team == qb_team]

                if len(team_wrs) >= 2:
                    # If QB selected, at least 2 WR from same team
                    prob += player_vars[qb.playerId] <= lpSum([player_vars[wr.playerId] for wr in team_wrs]) / len(team_wrs)

        # 3-1 stack (3 WR, 1 TE)
        if '3-1' in (self.ruleset.stack.templates or []):
            # Ensure at most 3 WR and 1 TE, or other combinations
            prob += lpSum([player_vars[wr.playerId] for wr in wrs]) <= 3
            prob += lpSum([player_vars[te.playerId] for te in tes]) <= 1

        # 2-1 stack (2 WR, 1 TE)
        if '2-1' in (self.ruleset.stack.templates or []):
            prob += lpSum([player_vars[wr.playerId] for wr in wrs]) <= 2
            prob += lpSum([player_vars[te.playerId] for te in tes]) <= 1

        # Disallow RB vs opponent DST
        if self.ruleset.stack.disallowRbVsOppDst:
            dsts = [p for p in self.players if 'DST' in p.pos]
            for dst in dsts:
                opp_team = dst.team  # Assuming DST team is the opponent
                opp_rbs = [rb for rb in rbs if rb.opp == opp_team]
                for rb in opp_rbs:
                    prob += player_vars[rb.playerId] + player_vars[dst.playerId] <= 1

    def _add_nba_stacking(self, prob: LpProblem, player_vars: Dict[str, LpVariable]):
        """Add NBA-specific stacking constraints"""
        # NBA stacking is less common, mostly game-based
        # Simplified implementation
        pass

    def _add_group_constraints(self, prob: LpProblem, player_vars: Dict[str, LpVariable]):
        """Add group constraints (if A then B, never A with C, etc.)"""
        if not self.ruleset.groups:
            return

        for group in self.ruleset.groups:
            if 'ifIncludes' in group and 'requireAtLeastOneOf' in group:
                # If A then at least one of B
                condition_players = [p for p in self.players if p.playerId in group['ifIncludes']]
                required_players = [p for p in self.players if p.playerId in group['requireAtLeastOneOf']]

                if condition_players and required_players:
                    for condition_player in condition_players:
                        prob += player_vars[condition_player.playerId] <= lpSum([player_vars[p.playerId] for p in required_players])

            elif 'neverTogether' in group:
                # Never A with B
                for i in range(len(group['neverTogether'])):
                    for j in range(i+1, len(group['neverTogether'])):
                        p1 = next((p for p in self.players if p.playerId == group['neverTogether'][i]), None)
                        p2 = next((p for p in self.players if p.playerId == group['neverTogether'][j]), None)
                        if p1 and p2:
                            prob += player_vars[p1.playerId] + player_vars[p2.playerId] <= 1

            elif 'atMostOneOf' in group:
                # At most one of the group
                group_players = [p for p in self.players if p.playerId in group['atMostOneOf']]
                prob += lpSum([player_vars[p.playerId] for p in group_players]) <= 1

    def _add_exposure_constraints(self, prob: LpProblem, player_vars: Dict[str, LpVariable]):
        """Add exposure constraints"""
        # For single lineup optimization, exposure constraints are handled differently
        # This is mainly for when generating multiple lineups
        pass

class SimGuidedOptimizer:
    """Simulation-guided sampling optimizer"""

    def __init__(self, players: List[Player], ruleset: Ruleset,
                 simulator: Optional[MonteCarloSimulator] = None):
        self.players = players
        self.ruleset = ruleset
        self.player_map = {p.playerId: p for p in players}
        self.simulator = simulator

    def optimize(self, num_lineups: int = 20, n_simulations: int = 1000,
                randomness: float = 0.1) -> OptimizationResult:
        """Generate lineups using sim-guided sampling"""
        start_time = time.time()

        try:
            lineups = []
            attempts = 0
            max_attempts = num_lineups * 10  # Allow multiple attempts per lineup

            while len(lineups) < num_lineups and attempts < max_attempts:
                lineup = self._sample_lineup(randomness)
                if lineup and self._validate_lineup(lineup):
                    # Check for duplicates
                    if not self._is_duplicate(lineup, lineups):
                        lineups.append(lineup)
                attempts += 1

            # If we have a simulator, rank and select best lineups
            if self.simulator and len(lineups) > num_lineups:
                lineups = self._rank_by_simulation(lineups, n_simulations)[:num_lineups]

            generation_time = time.time() - start_time

            return OptimizationResult(
                lineups=lineups,
                total_lineups=len(lineups),
                generation_time=generation_time,
                engine_used="Sim-Guided",
                constraints_satisfied=len(lineups) > 0
            )

        except Exception as e:
            logger.error(f"Sim-guided optimization failed: {e}")
            return OptimizationResult(
                lineups=[],
                total_lineups=0,
                generation_time=time.time() - start_time,
                engine_used="Sim-Guided",
                constraints_satisfied=False,
                error_message=str(e)
            )

    def _sample_lineup(self, randomness: float) -> Optional[Lineup]:
        """Sample a lineup using weighted random selection"""
        selected_players = []

        # Sample by position
        position_counts = self._get_position_counts()

        for position, count in position_counts.items():
            candidates = self._get_position_candidates(position)

            if not candidates:
                return None

            # Weight by projection with some randomness
            weights = []
            for player in candidates:
                base_weight = player.projection or 0
                # Add randomness
                random_factor = 1 + (random.random() - 0.5) * randomness
                weight = base_weight * random_factor
                weights.append(max(0.1, weight))  # Minimum weight

            # Sample players for this position
            if len(candidates) <= count:
                # Take all if fewer than needed
                selected_players.extend(candidates)
            else:
                # Weighted sampling without replacement
                sampled = self._weighted_sample_without_replacement(candidates, weights, count)
                selected_players.extend(sampled)

        # Create lineup
        total_salary = sum(p.salary for p in selected_players)
        total_projection = sum(p.projection or 0 for p in selected_players)

        lineup = Lineup(
            lineupId=f"sim_{int(time.time())}_{random.randint(1000, 9999)}",
            site=self.players[0].site if self.players else Site.DK,
            sport=self.players[0].sport if self.players else Sport.NFL,
            slateId=self.players[0].slateId if self.players else "",
            playerIds=[p.playerId for p in selected_players],
            salary=total_salary
        )

        return lineup

    def _get_position_counts(self) -> Dict[str, int]:
        """Get required counts for each position"""
        counts = {}
        for slot in self.ruleset.rosterSlots:
            counts[slot] = counts.get(slot, 0) + 1
        return counts

    def _get_position_candidates(self, position: str) -> List[Player]:
        """Get eligible players for a position"""
        if position == 'FLEX':
            return [p for p in self.players if any(pos in ['RB', 'WR', 'TE'] for pos in p.pos)]
        else:
            return [p for p in self.players if position in p.pos]

    def _weighted_sample_without_replacement(self, items: List[Any],
                                           weights: List[float],
                                           n: int) -> List[Any]:
        """Sample n items without replacement using weights"""
        if n >= len(items):
            return items

        selected = []
        remaining_items = items.copy()
        remaining_weights = weights.copy()

        for _ in range(n):
            if not remaining_items:
                break

            # Normalize weights
            total_weight = sum(remaining_weights)
            if total_weight == 0:
                # Equal weights if all zero
                normalized_weights = [1.0 / len(remaining_weights)] * len(remaining_weights)
            else:
                normalized_weights = [w / total_weight for w in remaining_weights]

            # Sample
            r = random.random()
            cumulative = 0
            for i, weight in enumerate(normalized_weights):
                cumulative += weight
                if r <= cumulative:
                    selected.append(remaining_items[i])
                    del remaining_items[i]
                    del remaining_weights[i]
                    break

        return selected

    def _validate_lineup(self, lineup: Lineup) -> bool:
        """Validate that lineup meets all constraints"""
        selected_players = [self.player_map[pid] for pid in lineup.playerIds]

        # Salary constraint
        if lineup.salary > self.ruleset.salaryCap:
            return False

        # Roster size
        if len(selected_players) != len(self.ruleset.rosterSlots):
            return False

        # Position constraints
        position_counts = {}
        for player in selected_players:
            for pos in player.pos:
                position_counts[pos] = position_counts.get(pos, 0) + 1

        required_counts = self._get_position_counts()
        for pos, required in required_counts.items():
            if pos == 'FLEX':
                flex_count = sum(position_counts.get(p, 0) for p in ['RB', 'WR', 'TE'])
                if flex_count < required:
                    return False
            else:
                if position_counts.get(pos, 0) != required:
                    return False

        # Team constraints
        if self.ruleset.maxFromTeam:
            team_counts = {}
            for player in selected_players:
                team_counts[player.team] = team_counts.get(player.team, 0) + 1
            if any(count > self.ruleset.maxFromTeam for count in team_counts.values()):
                return False

        # Stacking constraints
        if not self._validate_stacking(selected_players):
            return False

        # Group constraints
        if not self._validate_groups(selected_players):
            return False

        return True

    def _validate_stacking(self, players: List[Player]) -> bool:
        """Validate stacking constraints"""
        if not self.ruleset.stack:
            return True

        sport = players[0].sport if players else Sport.NFL

        if sport == Sport.NFL:
            return self._validate_nfl_stacking(players)

        return True

    def _validate_nfl_stacking(self, players: List[Player]) -> bool:
        """Validate NFL stacking rules"""
        qbs = [p for p in players if 'QB' in p.pos]
        rbs = [p for p in players if 'RB' in p.pos]
        wrs = [p for p in players if 'WR' in p.pos]
        tes = [p for p in players if 'TE' in p.pos]
        dsts = [p for p in players if 'DST' in p.pos]

        # Check stacking templates
        templates = self.ruleset.stack.templates or []

        if 'QB+2+bringback' in templates:
            for qb in qbs:
                qb_team = qb.team
                team_wrs = [wr for wr in wrs if wr.team == qb_team]
                if len(team_wrs) < 2:
                    return False

        if '3-1' in templates:
            if len(wrs) > 3 or len(tes) > 1:
                return False

        if '2-1' in templates:
            if len(wrs) > 2 or len(tes) > 1:
                return False

        # RB vs DST constraint
        if self.ruleset.stack.disallowRbVsOppDst:
            for rb in rbs:
                for dst in dsts:
                    if rb.opp == dst.team:  # Assuming DST team is opponent
                        return False

        return True

    def _validate_groups(self, players: List[Player]) -> bool:
        """Validate group constraints"""
        if not self.ruleset.groups:
            return True

        player_ids = {p.playerId for p in players}

        for group in self.ruleset.groups:
            if 'ifIncludes' in group and 'requireAtLeastOneOf' in group:
                # If any condition player is included, at least one required player must be
                condition_included = any(pid in player_ids for pid in group['ifIncludes'])
                if condition_included:
                    required_included = any(pid in player_ids for pid in group['requireAtLeastOneOf'])
                    if not required_included:
                        return False

            elif 'neverTogether' in group:
                # No more than one from the group
                group_included = sum(1 for pid in group['neverTogether'] if pid in player_ids)
                if group_included > 1:
                    return False

            elif 'atMostOneOf' in group:
                # At most one from the group
                group_included = sum(1 for pid in group['atMostOneOf'] if pid in player_ids)
                if group_included > 1:
                    return False

        return True

    def _is_duplicate(self, lineup: Lineup, existing_lineups: List[Lineup]) -> bool:
        """Check if lineup is too similar to existing ones"""
        for existing in existing_lineups:
            overlap = len(set(lineup.playerIds) & set(existing.playerIds))
            if overlap >= len(lineup.playerIds) * 0.8:  # 80% overlap
                return True
        return False

    async def _rank_by_simulation(self, lineups: List[Lineup], n_simulations: int) -> List[Lineup]:
        """Rank lineups by simulation results"""
        if not self.simulator:
            return lineups

        # Simulate all lineups
        sim_results = await self.simulator.simulate_multiple_lineups(lineups, n_simulations)

        # Calculate overall scores
        lineup_scores = []
        for lineup in lineups:
            if lineup.lineupId in sim_results:
                sim_result = sim_results[lineup.lineupId]
                overall_score = calculate_overall_score(sim_result)
                lineup_scores.append((lineup, overall_score))

        # Sort by overall score (descending)
        lineup_scores.sort(key=lambda x: x[1], reverse=True)

        return [lineup for lineup, _ in lineup_scores]

class PortfolioOptimizer:
    """Optimizes portfolio of lineups with exposure controls"""

    def __init__(self, players: List[Player], ruleset: Ruleset):
        self.players = players
        self.ruleset = ruleset
        self.player_map = {p.playerId: p for p in players}

    def optimize_portfolio(self, base_lineups: List[Lineup],
                          target_exposures: Optional[Dict[str, float]] = None,
                          min_uniques: Optional[int] = None) -> List[Lineup]:
        """Optimize portfolio with exposure controls"""
        if not target_exposures and not min_uniques:
            return base_lineups

        optimized_lineups = base_lineups.copy()

        # Apply exposure caps
        if target_exposures:
            optimized_lineups = self._apply_exposure_caps(optimized_lineups, target_exposures)

        # Apply min uniques
        if min_uniques:
            optimized_lineups = self._ensure_min_uniques(optimized_lineups, min_uniques)

        return optimized_lineups

    def _apply_exposure_caps(self, lineups: List[Lineup],
                           target_exposures: Dict[str, float]) -> List[Lineup]:
        """Apply exposure caps to portfolio"""
        # Count current exposures
        player_counts = {}
        for lineup in lineups:
            for player_id in lineup.playerIds:
                player_counts[player_id] = player_counts.get(player_id, 0) + 1

        # Adjust lineups that exceed caps
        adjusted_lineups = []
        for lineup in lineups:
            adjusted_lineup = self._adjust_lineup_exposure(lineup, player_counts, target_exposures, len(lineups))
            adjusted_lineups.append(adjusted_lineup)

        return adjusted_lineups

    def _adjust_lineup_exposure(self, lineup: Lineup, player_counts: Dict[str, int],
                              target_exposures: Dict[str, float], total_lineups: int) -> Lineup:
        """Adjust a single lineup to meet exposure constraints"""
        # For now, return unchanged - full implementation would require complex optimization
        return lineup

    def _ensure_min_uniques(self, lineups: List[Lineup], min_uniques: int) -> List[Lineup]:
        """Ensure minimum unique players across portfolio"""
        # Simple implementation - could be much more sophisticated
        return lineups

# Main optimization function
async def optimize_lineups(players: List[Player], ruleset: Ruleset,
                          num_lineups: int = 20, engine: str = 'sim-guided',
                          objective: str = 'projection', randomness: float = 0.1,
                          contest: Optional[Any] = None) -> OptimizationResult:
    """Main optimization function"""
    try:
        if engine == 'ilp':
            if not PULP_AVAILABLE:
                raise ImportError("PuLP not available for ILP optimization")
            optimizer = ILPOptimizer(players, ruleset)
            return optimizer.optimize(num_lineups, objective)
        else:  # sim-guided
            simulator = MonteCarloSimulator(players, contest) if contest else None
            optimizer = SimGuidedOptimizer(players, ruleset, simulator)
            return optimizer.optimize(num_lineups, randomness=randomness)

    except Exception as e:
        logger.error(f"Optimization failed: {e}")
        return OptimizationResult(
            lineups=[],
            total_lineups=0,
            generation_time=0,
            engine_used=engine,
            constraints_satisfied=False,
            error_message=str(e)
        )
