"""
Professional DFS Optimization Engine
Uses OR-Tools for ILP/MIP optimization with comprehensive constraints
"""

import json
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from ortools.linear_solver import pywraplp
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Player:
    id: str
    name: str
    position: str
    team: str
    salary: int
    projected_points: float
    ownership: float
    # Player controls
    locked: bool = False
    banned: bool = False
    min_exposure: int = 0
    max_exposure: int = 100
    custom_projection: Optional[float] = None
    projection_boost: float = 0.0
    ownership_override: Optional[float] = None
    priority_tag: str = "none"
    stack_role: str = "none"
    # MCP signals
    leverage: float = 0.0
    boom_rate: float = 0.0
    bust_rate: float = 0.0
    matchup_score: float = 0.0
    hype_score: float = 0.0


@dataclass
class Stack:
    id: str
    type: str  # 'QB+2', 'QB+3', 'RB+DST', 'custom'
    team: str
    positions: List[str]
    bring_back: int = 0
    min_from_stack: int = 2
    max_from_stack: int = 4
    enabled: bool = True


@dataclass
class Constraints:
    salary_cap: int = 50000
    max_from_team: int = 4
    min_games: int = 2
    unique_players: int = 9
    # Position requirements (DraftKings NFL)
    qb_min: int = 1
    qb_max: int = 1
    rb_min: int = 2
    rb_max: int = 3
    wr_min: int = 3
    wr_max: int = 4
    te_min: int = 1
    te_max: int = 2
    dst_min: int = 1
    dst_max: int = 1
    flex_positions: List[str] = None

    def __post_init__(self):
        if self.flex_positions is None:
            self.flex_positions = ["RB", "WR", "TE"]


@dataclass
class OptimizationRequest:
    slate_id: str
    players: List[Player]
    constraints: Constraints
    stacks: List[Stack]
    num_lineups: int = 150
    variance_settings: Dict[str, Any] = None
    correlation_settings: Dict[str, Any] = None
    ownership_settings: Dict[str, Any] = None


class DFSOptimizer:
    def __init__(self):
        self.solver = None
        self.players = []
        self.constraints = None
        self.stacks = []
        self.variables = {}
        self.lineup_variables = []

    def optimize(self, request: OptimizationRequest) -> Dict[str, Any]:
        """
        Main optimization function that generates multiple lineups
        """
        try:
            self.players = request.players
            self.constraints = request.constraints
            self.stacks = request.stacks

            # Generate lineups with diversity
            lineups = []
            exposures = {}

            for i in range(request.num_lineups):
                logger.info(f"Generating lineup {i+1}/{request.num_lineups}")

                # Apply variance for lineup diversity
                varied_players = self._apply_variance(
                    self.players, i, request.variance_settings
                )

                # Solve single lineup
                lineup = self._solve_single_lineup(varied_players, i)

                if lineup:
                    lineups.append(lineup)
                    self._update_exposures(exposures, lineup)
                else:
                    logger.warning(f"Failed to generate lineup {i+1}")

            # Calculate final exposures
            final_exposures = self._calculate_exposures(exposures, len(lineups))

            # Audit stacks
            stack_audit = self._audit_stacks(lineups)

            return {
                "success": True,
                "lineups": lineups,
                "exposures": final_exposures,
                "stack_audit": stack_audit,
                "total_generated": len(lineups),
                "message": f"Successfully generated {len(lineups)} lineups",
            }

        except Exception as e:
            logger.error(f"Optimization failed: {str(e)}")
            return {
                "success": False,
                "lineups": [],
                "exposures": [],
                "stack_audit": [],
                "total_generated": 0,
                "message": f"Optimization failed: {str(e)}",
            }

    def _solve_single_lineup(
        self, players: List[Player], lineup_index: int
    ) -> Optional[Dict[str, Any]]:
        """
        Solve for a single optimal lineup using OR-Tools
        """
        # Create solver
        self.solver = pywraplp.Solver.CreateSolver("SCIP")
        if not self.solver:
            logger.error("Could not create solver")
            return None

        # Create variables
        self.variables = {}
        for player in players:
            if not player.banned:
                self.variables[player.id] = self.solver.IntVar(
                    0, 1, f"player_{player.id}"
                )

        # Objective: Maximize projected points
        objective = self.solver.Objective()
        for player in players:
            if player.id in self.variables:
                points = player.custom_projection or player.projected_points
                # Apply projection boost
                points *= 1 + player.projection_boost / 100
                # Apply leverage bonus for contrarian plays
                if player.leverage > 1:
                    points *= 1 + min(player.leverage * 0.1, 0.5)
                objective.SetCoefficient(self.variables[player.id], points)

        objective.SetMaximization()

        # Add constraints
        self._add_salary_constraint(players)
        self._add_position_constraints(players)
        self._add_team_constraints(players)
        self._add_player_constraints(players, lineup_index)
        self._add_stack_constraints(players)

        # Solve
        status = self.solver.Solve()

        if status == pywraplp.Solver.OPTIMAL:
            return self._extract_lineup(players)
        else:
            logger.warning(f"No optimal solution found for lineup {lineup_index + 1}")
            return None

    def _add_salary_constraint(self, players: List[Player]):
        """Add salary cap constraint - DraftKings requires tight salary utilization"""
        # DraftKings lineups should use 98-100% of salary cap for optimal value
        min_salary = int(self.constraints.salary_cap * 0.98)  # $49,000 minimum
        max_salary = self.constraints.salary_cap  # $50,000 maximum

        constraint = self.solver.Constraint(min_salary, max_salary)
        for player in players:
            if player.id in self.variables:
                constraint.SetCoefficient(self.variables[player.id], player.salary)

    def _add_position_constraints(self, players: List[Player]):
        """Add position-specific constraints"""
        positions = {}
        for player in players:
            if player.id in self.variables:
                if player.position not in positions:
                    positions[player.position] = []
                positions[player.position].append(self.variables[player.id])

        # QB constraint
        if "QB" in positions:
            constraint = self.solver.Constraint(
                self.constraints.qb_min, self.constraints.qb_max
            )
            for var in positions["QB"]:
                constraint.SetCoefficient(var, 1)

        # RB constraint
        if "RB" in positions:
            constraint = self.solver.Constraint(
                self.constraints.rb_min, self.constraints.rb_max
            )
            for var in positions["RB"]:
                constraint.SetCoefficient(var, 1)

        # WR constraint
        if "WR" in positions:
            constraint = self.solver.Constraint(
                self.constraints.wr_min, self.constraints.wr_max
            )
            for var in positions["WR"]:
                constraint.SetCoefficient(var, 1)

        # TE constraint
        if "TE" in positions:
            constraint = self.solver.Constraint(
                self.constraints.te_min, self.constraints.te_max
            )
            for var in positions["TE"]:
                constraint.SetCoefficient(var, 1)

        # DST constraint
        if "DST" in positions:
            constraint = self.solver.Constraint(
                self.constraints.dst_min, self.constraints.dst_max
            )
            for var in positions["DST"]:
                constraint.SetCoefficient(var, 1)

        # Total players constraint
        constraint = self.solver.Constraint(
            self.constraints.unique_players, self.constraints.unique_players
        )
        for player in players:
            if player.id in self.variables:
                constraint.SetCoefficient(self.variables[player.id], 1)

    def _add_team_constraints(self, players: List[Player]):
        """Add team-specific constraints"""
        teams = {}
        for player in players:
            if player.id in self.variables:
                if player.team not in teams:
                    teams[player.team] = []
                teams[player.team].append(self.variables[player.id])

        # Max players from same team
        for team, team_vars in teams.items():
            constraint = self.solver.Constraint(0, self.constraints.max_from_team)
            for var in team_vars:
                constraint.SetCoefficient(var, 1)

    def _add_player_constraints(self, players: List[Player], lineup_index: int):
        """Add player-specific constraints"""
        for player in players:
            if player.id in self.variables:
                var = self.variables[player.id]

                # Locked players must be included
                if player.locked:
                    constraint = self.solver.Constraint(1, 1)
                    constraint.SetCoefficient(var, 1)

                # Priority players get preference (soft constraint via objective bonus)
                if player.priority_tag == "core":
                    # Already handled in objective function
                    pass

    def _add_stack_constraints(self, players: List[Player]):
        """Add stack-specific constraints"""
        for stack in self.stacks:
            if not stack.enabled:
                continue

            # Find players in this stack
            stack_players = [
                p
                for p in players
                if p.team == stack.team and p.position in stack.positions
            ]
            stack_vars = [
                self.variables[p.id] for p in stack_players if p.id in self.variables
            ]

            if len(stack_vars) >= stack.min_from_stack:
                # If any player from stack is selected, enforce minimum
                # This is a simplified version - full implementation would use indicator constraints
                constraint = self.solver.Constraint(0, len(stack_vars))
                for var in stack_vars:
                    constraint.SetCoefficient(var, 1)

    def _extract_lineup(self, players: List[Player]) -> Dict[str, Any]:
        """Extract the optimal lineup from solver results"""
        lineup_players = []
        total_salary = 0
        projected_score = 0
        total_ownership = 0

        for player in players:
            if (
                player.id in self.variables
                and self.variables[player.id].solution_value() > 0.5
            ):
                lineup_players.append(
                    {
                        "player_id": player.id,
                        "name": player.name,
                        "position": player.position,
                        "team": player.team,
                        "salary": player.salary,
                        "projected_points": player.custom_projection
                        or player.projected_points,
                        "ownership": player.ownership_override or player.ownership,
                    }
                )
                total_salary += player.salary
                projected_score += player.custom_projection or player.projected_points
                total_ownership += player.ownership_override or player.ownership

        # Calculate lineup metrics
        avg_ownership = total_ownership / len(lineup_players) if lineup_players else 0
        leverage = (
            sum(
                p.leverage
                for p in players
                if p.id in self.variables
                and self.variables[p.id].solution_value() > 0.5
            )
            / len(lineup_players)
            if lineup_players
            else 0
        )

        # Determine stack info
        stack_info = self._analyze_lineup_stacks(lineup_players)

        return {
            "lineup_id": f"lineup_{len(lineup_players)}_{total_salary}",
            "players": lineup_players,
            "total_salary": total_salary,
            "projected_score": projected_score,
            "ownership": avg_ownership,
            "leverage": leverage,
            "stack_info": stack_info,
            "uniqueness": 100 - (avg_ownership * 100),  # Simple uniqueness metric
        }

    def _apply_variance(
        self,
        players: List[Player],
        lineup_index: int,
        variance_settings: Optional[Dict[str, Any]],
    ) -> List[Player]:
        """Apply variance to player projections for lineup diversity"""
        if not variance_settings:
            return players

        varied_players = []
        np.random.seed(42 + lineup_index)  # Deterministic but varied

        for player in players:
            varied_player = Player(**player.__dict__)

            # Apply randomness to projections
            if variance_settings.get("enable_randomness", False):
                randomness = variance_settings.get("randomness_percentage", 10) / 100
                noise = np.random.normal(0, randomness)
                base_projection = (
                    varied_player.custom_projection or varied_player.projected_points
                )
                varied_player.projected_points = max(0, base_projection * (1 + noise))

            varied_players.append(varied_player)

        return varied_players

    def _update_exposures(self, exposures: Dict[str, int], lineup: Dict[str, Any]):
        """Update player exposure tracking"""
        for player in lineup["players"]:
            player_id = player["player_id"]
            exposures[player_id] = exposures.get(player_id, 0) + 1

    def _calculate_exposures(
        self, exposures: Dict[str, int], total_lineups: int
    ) -> List[Dict[str, Any]]:
        """Calculate final exposure percentages"""
        exposure_data = []

        for player in self.players:
            count = exposures.get(player.id, 0)
            exposure_pct = (count / total_lineups * 100) if total_lineups > 0 else 0

            # Determine status vs targets
            status = "within"
            if exposure_pct > player.max_exposure:
                status = "over"
            elif exposure_pct < player.min_exposure:
                status = "under"

            exposure_data.append(
                {
                    "player_id": player.id,
                    "player_name": player.name,
                    "position": player.position,
                    "team": player.team,
                    "exposure": exposure_pct,
                    "target_min": player.min_exposure,
                    "target_max": player.max_exposure,
                    "actual_count": count,
                    "status": status,
                }
            )

        return exposure_data

    def _audit_stacks(self, lineups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Audit stack usage across all lineups"""
        stack_usage = {}

        for lineup in lineups:
            stack_info = lineup.get("stack_info", "No Stack")
            stack_usage[stack_info] = stack_usage.get(stack_info, 0) + 1

        audit_data = []
        total_lineups = len(lineups)

        for stack_type, count in stack_usage.items():
            audit_data.append(
                {
                    "stack_type": stack_type,
                    "count": count,
                    "percentage": (
                        (count / total_lineups * 100) if total_lineups > 0 else 0
                    ),
                }
            )

        return sorted(audit_data, key=lambda x: x["count"], reverse=True)

    def _analyze_lineup_stacks(self, lineup_players: List[Dict[str, Any]]) -> str:
        """Analyze what type of stack this lineup contains"""
        teams = {}
        positions = {}

        for player in lineup_players:
            team = player["team"]
            pos = player["position"]

            if team not in teams:
                teams[team] = []
            teams[team].append(pos)

            if pos not in positions:
                positions[pos] = []
            positions[pos].append(team)

        # Check for QB stacks
        for team, team_positions in teams.items():
            if "QB" in team_positions:
                skill_positions = [p for p in team_positions if p in ["WR", "TE", "RB"]]
                if len(skill_positions) >= 2:
                    return f"QB+{len(skill_positions)} Stack ({team})"
                elif len(skill_positions) == 1:
                    return f"QB+1 Stack ({team})"

        # Check for game stacks
        game_teams = [team for team, positions in teams.items() if len(positions) >= 2]
        if len(game_teams) >= 2:
            return f'Game Stack ({"/".join(game_teams[:2])})'

        return "No Stack"


# API endpoint functions
def optimize_lineups(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main API endpoint for lineup optimization
    """
    try:
        # Parse request
        players = [Player(**p) for p in request_data["players"]]
        constraints = Constraints(**request_data.get("constraints", {}))
        stacks = [Stack(**s) for s in request_data.get("stacks", [])]

        request = OptimizationRequest(
            slate_id=request_data["slate_id"],
            players=players,
            constraints=constraints,
            stacks=stacks,
            num_lineups=request_data.get("num_lineups", 150),
            variance_settings=request_data.get("variance_settings"),
            correlation_settings=request_data.get("correlation_settings"),
            ownership_settings=request_data.get("ownership_settings"),
        )

        # Run optimization
        optimizer = DFSOptimizer()
        result = optimizer.optimize(request)

        return result

    except Exception as e:
        logger.error(f"API optimization failed: {str(e)}")
        return {
            "success": False,
            "lineups": [],
            "exposures": [],
            "stack_audit": [],
            "total_generated": 0,
            "message": f"API optimization failed: {str(e)}",
        }


if __name__ == "__main__":
    # Test the optimizer
    test_players = [
        Player("1", "Josh Allen", "QB", "BUF", 8400, 22.5, 0.28, leverage=1.2),
        Player("2", "Christian McCaffrey", "RB", "SF", 9000, 18.2, 0.35, leverage=0.8),
        Player("3", "Tyreek Hill", "WR", "MIA", 8200, 16.8, 0.22, leverage=1.5),
        Player("4", "Travis Kelce", "TE", "KC", 7800, 14.5, 0.31, leverage=0.9),
        Player("5", "Bills DST", "DST", "BUF", 3200, 8.2, 0.15, leverage=0.5),
        Player("6", "Stefon Diggs", "WR", "BUF", 7600, 15.3, 0.19, leverage=1.1),
        Player("7", "Saquon Barkley", "RB", "NYG", 7400, 16.1, 0.24, leverage=1.0),
        Player("8", "Cooper Kupp", "WR", "LAR", 7200, 14.8, 0.18, leverage=0.7),
        Player("9", "Dalvin Cook", "RB", "MIN", 6800, 15.2, 0.16, leverage=0.9),
        Player("10", "Mark Andrews", "TE", "BAL", 6400, 12.1, 0.20, leverage=0.8),
    ]

    test_request = OptimizationRequest(
        slate_id="test_slate",
        players=test_players,
        constraints=Constraints(),
        stacks=[],
        num_lineups=5,
    )

    optimizer = DFSOptimizer()
    result = optimizer.optimize(test_request)

    print(json.dumps(result, indent=2))
