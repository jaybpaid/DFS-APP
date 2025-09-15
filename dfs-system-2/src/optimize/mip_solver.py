import json
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
from ortools.linear_solver import pywraplp
from datetime import datetime

from ..data.schemas import (
    Player, Lineup, LineupPlayer, OptimizationConfig, 
    SportType, SiteType
)

class MIPOptimizer:
    """Mixed Integer Programming optimizer for DFS lineup generation"""
    
    def __init__(self, sport: SportType, site: SiteType, config_dir: str = "src/config"):
        self.sport = sport
        self.site = site
        self.config_dir = Path(config_dir)
        
        # Load roster rules
        self.rules = self._load_roster_rules()
        
        # Initialize solver
        self.solver = pywraplp.Solver.CreateSolver('SCIP')
        if not self.solver:
            raise RuntimeError("SCIP solver not available. Install OR-Tools with SCIP support.")
    
    def _load_roster_rules(self) -> Dict[str, Any]:
        """Load roster construction rules for sport/site combination"""
        site_abbrev = "dk" if self.site == SiteType.DRAFTKINGS else "fd"
        sport_lower = self.sport.value.lower()
        
        rules_file = self.config_dir / "rules" / f"{site_abbrev}_{sport_lower}.json"
        
        try:
            with open(rules_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise ValueError(f"Rules file not found: {rules_file}")
    
    def optimize_lineup(self, 
                       players: List[Player], 
                       config: OptimizationConfig) -> Optional[Lineup]:
        """Optimize a single lineup"""
        lineups = self.optimize_lineups(players, config)
        return lineups[0] if lineups else None
    
    def optimize_lineups(self, 
                        players: List[Player], 
                        config: OptimizationConfig) -> List[Lineup]:
        """Optimize multiple lineups with diversification"""
        if not players:
            raise ValueError("No players provided for optimization")
        
        lineups = []
        used_combinations = set()
        
        for lineup_num in range(config.num_lineups):
            print(f"Optimizing lineup {lineup_num + 1}/{config.num_lineups}")
            
            # Create solver instance for this lineup
            solver = pywraplp.Solver.CreateSolver('SCIP')
            if not solver:
                raise RuntimeError("SCIP solver not available")
            
            # Create variables
            player_vars = {}
            for i, player in enumerate(players):
                player_vars[i] = solver.IntVar(0, 1, f'player_{i}')
            
            # Add constraints
            self._add_roster_constraints(solver, players, player_vars)
            self._add_salary_constraints(solver, players, player_vars)
            self._add_exposure_constraints(solver, players, player_vars, config, lineups)
            self._add_lock_ban_constraints(solver, players, player_vars, config)
            
            # Add diversification constraints
            if lineups:
                self._add_diversification_constraints(solver, players, player_vars, lineups, config)
            
            # Set objective
            self._set_objective(solver, players, player_vars, config)
            
            # Solve
            status = solver.Solve()
            
            if status == pywraplp.Solver.OPTIMAL:
                lineup = self._extract_lineup(players, player_vars, lineup_num)
                
                # Check for duplicate lineups
                lineup_key = tuple(sorted([p.player_id for p in lineup.players]))
                if lineup_key not in used_combinations:
                    lineups.append(lineup)
                    used_combinations.add(lineup_key)
                else:
                    print(f"Duplicate lineup detected for lineup {lineup_num + 1}, skipping")
            else:
                print(f"No optimal solution found for lineup {lineup_num + 1}")
                break
        
        return lineups
    
    def _add_roster_constraints(self, solver, players: List[Player], player_vars: Dict[int, Any]):
        """Add roster construction constraints"""
        positions = self.rules['positions']
        
        # Group players by position
        position_players = {}
        for i, player in enumerate(players):
            pos = self._get_player_position(player)
            if pos not in position_players:
                position_players[pos] = []
            position_players[pos].append(i)
        
        # Add position constraints
        for pos_name, pos_rules in positions.items():
            eligible_positions = pos_rules['eligible_positions']
            min_players = pos_rules['min']
            max_players = pos_rules['max']
            
            # Find players eligible for this roster position
            eligible_player_indices = []
            for eligible_pos in eligible_positions:
                if eligible_pos in position_players:
                    eligible_player_indices.extend(position_players[eligible_pos])
            
            if eligible_player_indices:
                # Must select between min and max players for this position
                solver.Add(
                    solver.Sum([player_vars[i] for i in eligible_player_indices]) >= min_players
                )
                solver.Add(
                    solver.Sum([player_vars[i] for i in eligible_player_indices]) <= max_players
                )
        
        # Total roster size constraint
        total_players = solver.Sum(player_vars.values())
        solver.Add(total_players == self.rules['roster_size'])
    
    def _add_salary_constraints(self, solver, players: List[Player], player_vars: Dict[int, Any]):
        """Add salary cap constraints"""
        # Salary cap constraint
        total_salary = solver.Sum([
            player_vars[i] * self._get_player_salary(players[i])
            for i in range(len(players))
        ])
        solver.Add(total_salary <= self.rules['salary_cap'])
        
        # Minimum salary constraint (optional)
        min_salary = self.rules['constraints'].get('min_salary_used')
        if min_salary:
            solver.Add(total_salary >= min_salary)
    
    def _add_exposure_constraints(self, solver, players: List[Player], player_vars: Dict[int, Any],
                                 config: OptimizationConfig, existing_lineups: List[Lineup]):
        """Add exposure constraints across multiple lineups"""
        if not config.max_exposure or not existing_lineups:
            return
        
        # Count how many times each player has been used
        player_usage_count = {}
        for player in players:
            player_usage_count[player.id] = 0
        
        for lineup in existing_lineups:
            for lineup_player in lineup.players:
                if lineup_player.player_id in player_usage_count:
                    player_usage_count[lineup_player.player_id] += 1
        
        # Add exposure constraints
        max_lineups = len(existing_lineups) + 1  # Including current lineup
        for i, player in enumerate(players):
            max_exposure = config.max_exposure.get(player.id, 1.0)
            max_usage = int(max_exposure * max_lineups)
            current_usage = player_usage_count.get(player.id, 0)
            
            if current_usage >= max_usage:
                # Player has reached exposure limit
                solver.Add(player_vars[i] == 0)
    
    def _add_lock_ban_constraints(self, solver, players: List[Player], player_vars: Dict[int, Any],
                                 config: OptimizationConfig):
        """Add lock and ban constraints"""
        # Lock constraints
        if config.locked_players:
            for i, player in enumerate(players):
                if player.id in config.locked_players:
                    solver.Add(player_vars[i] == 1)
        
        # Ban constraints
        if config.banned_players:
            for i, player in enumerate(players):
                if player.id in config.banned_players:
                    solver.Add(player_vars[i] == 0)
    
    def _add_diversification_constraints(self, solver, players: List[Player], player_vars: Dict[int, Any],
                                       existing_lineups: List[Lineup], config: OptimizationConfig):
        """Add constraints to ensure lineup diversity"""
        if not config.max_overlap or not existing_lineups:
            return
        
        # Prevent too much overlap with existing lineups
        max_overlap_players = int(config.max_overlap * self.rules['roster_size'])
        
        for existing_lineup in existing_lineups:
            existing_player_ids = {p.player_id for p in existing_lineup.players}
            
            # Count overlapping players
            overlap_vars = []
            for i, player in enumerate(players):
                if player.id in existing_player_ids:
                    overlap_vars.append(player_vars[i])
            
            if overlap_vars:
                solver.Add(solver.Sum(overlap_vars) <= max_overlap_players)
    
    def _set_objective(self, solver, players: List[Player], player_vars: Dict[int, Any],
                      config: OptimizationConfig):
        """Set optimization objective"""
        objective_terms = []
        
        for i, player in enumerate(players):
            # Base objective (projection or expected value)
            if config.objective == "projection":
                coefficient = self._get_player_projection(player)
            elif config.objective == "ev":
                coefficient = self._get_player_ev(player)
            else:
                coefficient = self._get_player_projection(player)  # Default
            
            # Apply ownership penalty if specified
            if config.ownership_penalty > 0:
                ownership = getattr(player, 'projected_ownership', 0.1)
                coefficient -= config.ownership_penalty * ownership
            
            # Add randomness if specified
            if config.randomness > 0:
                random_factor = 1 + (np.random.random() - 0.5) * config.randomness
                coefficient *= random_factor
            
            objective_terms.append(player_vars[i] * coefficient)
        
        # Maximize objective
        solver.Maximize(solver.Sum(objective_terms))
    
    def _extract_lineup(self, players: List[Player], player_vars: Dict[int, Any], 
                       lineup_id: int) -> Lineup:
        """Extract lineup from solver solution"""
        selected_players = []
        total_salary = 0
        total_projection = 0.0
        
        for i, player in enumerate(players):
            if player_vars[i].solution_value() > 0.5:  # Selected
                roster_position = self._assign_roster_position(player, selected_players)
                
                lineup_player = LineupPlayer(
                    player_id=player.id,
                    roster_position=roster_position,
                    salary=self._get_player_salary(player),
                    projection=self._get_player_projection(player),
                    ownership=getattr(player, 'projected_ownership', None)
                )
                
                selected_players.append(lineup_player)
                total_salary += lineup_player.salary
                total_projection += lineup_player.projection
        
        return Lineup(
            id=f"lineup_{lineup_id}",
            players=selected_players,
            total_salary=total_salary,
            total_projection=total_projection,
            total_ownership=sum(p.ownership or 0 for p in selected_players)
        )
    
    def _get_player_position(self, player: Player) -> str:
        """Get player's position"""
        if self.site == SiteType.DRAFTKINGS:
            return getattr(player, 'dk_position', player.position)
        else:
            return getattr(player, 'fd_position', player.position)
    
    def _get_player_salary(self, player: Player) -> int:
        """Get player's salary for the site"""
        if self.site == SiteType.DRAFTKINGS:
            return getattr(player, 'dk_salary', player.salary)
        else:
            return getattr(player, 'fd_salary', player.salary)
    
    def _get_player_projection(self, player: Player) -> float:
        """Get player's projection - placeholder for now"""
        # This would connect to the projection system
        return np.random.uniform(5.0, 25.0)  # Placeholder
    
    def _get_player_ev(self, player: Player) -> float:
        """Get player's expected value - placeholder for now"""
        # This would connect to the simulation system
        return self._get_player_projection(player) * 1.1  # Placeholder
    
    def _assign_roster_position(self, player: Player, existing_players: List[LineupPlayer]) -> str:
        """Assign specific roster position to player"""
        player_position = self._get_player_position(player)
        positions = self.rules['positions']
        
        # Count existing positions
        position_counts = {}
        for existing_player in existing_players:
            pos = existing_player.roster_position
            position_counts[pos] = position_counts.get(pos, 0) + 1
        
        # Find best position for this player
        for pos_name, pos_rules in positions.items():
            if player_position in pos_rules['eligible_positions']:
                current_count = position_counts.get(pos_name, 0)
                if current_count < pos_rules['max']:
                    return pos_name
        
        # Fallback to first eligible position
        for pos_name, pos_rules in positions.items():
            if player_position in pos_rules['eligible_positions']:
                return pos_name
        
        return player_position  # Fallback
