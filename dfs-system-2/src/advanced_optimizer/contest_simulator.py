import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import json
from dataclasses import dataclass
from enum import Enum

class ContestType(str, Enum):
    CASH = "cash"
    GPP = "gpp" 
    TOURNAMENT = "tournament"
    SATELLITE = "satellite"
    MULTIPLIER = "multiplier"

class StackType(str, Enum):
    TEAM_STACK = "team_stack"
    QB_WR = "qb_wr"
    QB_DOUBLE_WR = "qb_double_wr"
    GAME_STACK = "game_stack" 
    BRING_BACK = "bring_back"
    MINI_STACK = "mini_stack"
    CORRELATION_STACK = "correlation_stack"

@dataclass
class SimulationResult:
    """Results from Monte Carlo contest simulation"""
    lineup_id: str
    mean_score: float
    std_score: float
    percentiles: Dict[int, float]  # {10: 120.5, 25: 135.2, 50: 148.1, ...}
    win_rates: Dict[str, float]   # {"top1": 0.012, "top10": 0.089, "cash": 0.523}
    expected_roi: float
    sharpe_ratio: float
    kelly_criterion: float
    
@dataclass
class AdvancedConstraints:
    """Advanced lineup construction constraints"""
    # Exposure controls
    max_player_exposure: Dict[str, float]
    min_player_exposure: Dict[str, float]
    max_team_exposure: Dict[str, int]
    max_game_exposure: Dict[str, int]
    
    # Stacking requirements
    required_stacks: List[Dict[str, Any]]
    forbidden_combinations: List[List[str]]
    correlation_requirements: Dict[str, float]
    
    # Risk management
    max_salary_variance: float
    min_unique_players: int
    max_lineup_overlap: float
    force_contrarian_percentage: float
    
    # Contest-specific
    ownership_leverage_target: float
    expected_field_size: int
    payout_structure: Dict[str, float]

class AdvancedContestSimulator:
    """Advanced contest simulation engine with game theory"""
    
    def __init__(self, contest_type: ContestType = ContestType.GPP):
        self.contest_type = contest_type
        self.simulation_runs = 50000
        self.field_simulation_runs = 10000
        
        # Contest payout structures
        self.payout_structures = {
            ContestType.CASH: {"cash": 1.8},  # Double up
            ContestType.GPP: {
                "1st": 0.12, "top1%": 0.05, "top5%": 0.02, 
                "top10%": 0.015, "top20%": 0.01, "min_cash": 0.002
            },
            ContestType.TOURNAMENT: {
                "1st": 0.20, "top1%": 0.08, "top10%": 0.03, "min_cash": 0.005
            }
        }
        
    def simulate_contest_performance(self, lineups: List[Dict], 
                                   contest_info: Dict,
                                   ownership_projections: Dict[str, float]) -> List[SimulationResult]:
        """Simulate lineup performance in specific contest"""
        
        results = []
        field_size = contest_info.get("field_size", 100000)
        
        for lineup in lineups:
            # Monte Carlo simulation for this lineup
            sim_scores = self._run_lineup_simulation(lineup)
            
            # Contest-specific performance
            win_rates = self._calculate_win_rates(sim_scores, field_size, ownership_projections, lineup)
            expected_roi = self._calculate_expected_roi(win_rates, contest_info)
            
            result = SimulationResult(
                lineup_id=lineup["id"],
                mean_score=np.mean(sim_scores),
                std_score=np.std(sim_scores),
                percentiles=self._calculate_percentiles(sim_scores),
                win_rates=win_rates,
                expected_roi=expected_roi,
                sharpe_ratio=self._calculate_sharpe_ratio(sim_scores, expected_roi),
                kelly_criterion=self._calculate_kelly_criterion(win_rates, contest_info)
            )
            
            results.append(result)
        
        return results
    
    def _run_lineup_simulation(self, lineup: Dict) -> np.ndarray:
        """Run Monte Carlo simulation for single lineup"""
        num_sims = self.simulation_runs
        lineup_scores = []
        
        players = lineup["players"]
        
        for sim in range(num_sims):
            total_score = 0
            
            # Simulate each player performance
            for player in players:
                # Use advanced distribution modeling
                base_projection = player.get("projection", 10.0)
                volatility = player.get("std", base_projection * 0.3)
                
                # Apply position-specific distributions
                if player["position"] == "QB":
                    # QBs have right-skewed distribution
                    score = max(0, np.random.lognormal(np.log(base_projection), 0.4))
                elif player["position"] in ["RB", "WR", "TE"]:
                    # Skill positions have more variance
                    score = max(0, np.random.normal(base_projection, volatility))
                else:  # DST, K, etc.
                    # Defense has high variance
                    score = max(0, np.random.gamma(2, base_projection/2))
                
                total_score += score
            
            # Apply game correlations
            total_score = self._apply_game_correlations(total_score, players, sim)
            
            lineup_scores.append(total_score)
        
        return np.array(lineup_scores)
    
    def _apply_game_correlations(self, base_score: float, players: List[Dict], sim_num: int) -> float:
        """Apply player and game correlations"""
        # Game environment factors
        game_multipliers = {}
        
        # Group players by game
        games = {}
        for player in players:
            game = player.get("game_info", "UNK")
            if game not in games:
                games[game] = []
            games[game].append(player)
        
        # Apply game-level correlation
        for game, game_players in games.items():
            if len(game_players) > 1:
                # Correlated game outcome
                game_factor = np.random.normal(1.0, 0.15)  # Games can go high/low together
                
                # Stack bonuses for correlated players
                for player in game_players:
                    if player["position"] == "QB":
                        # QB gets correlation bonus with own WRs/TEs
                        wr_te_teammates = [p for p in game_players 
                                          if p["position"] in ["WR", "TE"] and p["team"] == player["team"]]
                        if wr_te_teammates:
                            base_score *= (1.0 + 0.05 * len(wr_te_teammates))  # Stack bonus
                    
                    base_score *= game_factor
        
        return base_score
    
    def _calculate_win_rates(self, sim_scores: np.ndarray, field_size: int,
                           ownership_projections: Dict[str, float], lineup: Dict) -> Dict[str, float]:
        """Calculate win rates against projected field"""
        
        # Estimate field score distribution based on ownership and chalky plays
        avg_ownership = np.mean([ownership_projections.get(p["name"], 10.0) for p in lineup["players"]])
        
        # Field distribution - more chalk = more scores clustered around mean
        field_mean = np.mean(sim_scores) * (0.85 + 0.15 * (avg_ownership / 100))
        field_std = np.std(sim_scores) * (1.2 - 0.3 * (avg_ownership / 100))
        
        # Calculate percentile finishes
        win_rates = {}
        
        for score in sim_scores:
            # What percentile is this score in the field?
            percentile = 1 - np.random.normal(
                (score - field_mean) / field_std * 0.1 + 0.5,
                0.1
            )
            percentile = max(0, min(1, percentile))
            
            # Convert to finish positions
            if percentile >= 0.99:
                win_rates["top1"] = win_rates.get("top1", 0) + 1
            elif percentile >= 0.9:
                win_rates["top10"] = win_rates.get("top10", 0) + 1
            elif percentile >= 0.8:
                win_rates["top20"] = win_rates.get("top20", 0) + 1
            elif percentile >= 0.5:
                win_rates["cash"] = win_rates.get("cash", 0) + 1
        
        # Normalize to percentages
        sim_count = len(sim_scores)
        return {k: (v / sim_count) for k, v in win_rates.items()}
    
    def _calculate_expected_roi(self, win_rates: Dict[str, float], contest_info: Dict) -> float:
        """Calculate expected ROI based on win rates and payout structure"""
        entry_fee = contest_info.get("entry_fee", 1.0)
        payout_structure = self.payout_structures.get(self.contest_type, {})
        
        expected_winnings = 0
        for finish_type, rate in win_rates.items():
            payout_multiple = payout_structure.get(finish_type, 0)
            expected_winnings += rate * payout_multiple * entry_fee
        
        roi = (expected_winnings - entry_fee) / entry_fee
        return roi
    
    def _calculate_percentiles(self, scores: np.ndarray) -> Dict[int, float]:
        """Calculate score percentiles"""
        percentiles = [5, 10, 25, 50, 75, 90, 95]
        return {p: float(np.percentile(scores, p)) for p in percentiles}
    
    def _calculate_sharpe_ratio(self, scores: np.ndarray, expected_roi: float) -> float:
        """Calculate Sharpe ratio for risk-adjusted returns"""
        if np.std(scores) == 0:
            return 0.0
        
        excess_returns = np.mean(scores) - np.median(scores)  # Excess over median
        return excess_returns / np.std(scores)
    
    def _calculate_kelly_criterion(self, win_rates: Dict[str, float], contest_info: Dict) -> float:
        """Calculate Kelly criterion for optimal bet sizing"""
        win_prob = win_rates.get("cash", 0.5)
        avg_payout = 1.8  # Simplified
        
        if win_prob <= 0 or avg_payout <= 1:
            return 0.0
        
        # Kelly = (bp - q) / b where b = odds, p = win prob, q = loss prob
        b = avg_payout - 1
        p = win_prob
        q = 1 - p
        
        kelly = (b * p - q) / b
        return max(0, min(0.25, kelly))  # Cap at 25% of bankroll

class AdvancedStackingEngine:
    """Advanced stacking logic with correlation modeling"""
    
    def __init__(self, sport: str):
        self.sport = sport
        
        # Correlation matrices by sport
        if sport == "NFL":
            self.correlations = {
                "qb_wr_same_team": 0.75,
                "qb_te_same_team": 0.65,
                "qb_rb_same_team": 0.25,
                "rb_wr_same_team": -0.15,
                "wr_wr_same_team": -0.10,
                "game_total_correlation": 0.45,
                "opposing_def_negative": -0.30
            }
        else:  # NBA
            self.correlations = {
                "teammates": 0.35,
                "opponents": -0.25,
                "pace_correlation": 0.55,
                "blowout_negative": -0.40,
                "usage_competition": -0.20
            }
    
    def generate_stack_combinations(self, players: List[Dict], 
                                  stack_requirements: List[Dict]) -> List[List[str]]:
        """Generate valid stacking combinations"""
        stack_combos = []
        
        for stack_req in stack_requirements:
            stack_type = StackType(stack_req["type"])
            
            if stack_type == StackType.QB_WR and self.sport == "NFL":
                combos = self._generate_qb_wr_stacks(players, stack_req)
                stack_combos.extend(combos)
            elif stack_type == StackType.GAME_STACK:
                combos = self._generate_game_stacks(players, stack_req)
                stack_combos.extend(combos)
            elif stack_type == StackType.TEAM_STACK:
                combos = self._generate_team_stacks(players, stack_req)
                stack_combos.extend(combos)
        
        return stack_combos
    
    def _generate_qb_wr_stacks(self, players: List[Dict], requirements: Dict) -> List[List[str]]:
        """Generate QB-WR stack combinations"""
        stacks = []
        qbs = [p for p in players if p["position"] == "QB"]
        
        for qb in qbs:
            team = qb["team"]
            wrs = [p for p in players if p["position"] in ["WR", "TE"] and p["team"] == team]
            
            # Generate 2-player and 3-player stacks
            for wr1 in wrs:
                stacks.append([qb["id"], wr1["id"]])
                
                for wr2 in wrs:
                    if wr2["id"] != wr1["id"]:
                        stacks.append([qb["id"], wr1["id"], wr2["id"]])
        
        return stacks
    
    def _generate_game_stacks(self, players: List[Dict], requirements: Dict) -> List[List[str]]:
        """Generate game stack combinations"""
        stacks = []
        games = {}
        
        # Group players by game
        for player in players:
            game = player.get("game_info", "")
            if game not in games:
                games[game] = {"home": [], "away": []}
            
            # Determine home/away (simplified)
            if "@" in game:
                away_team, home_team = game.split("@")
                if player["team"] == away_team.strip():
                    games[game]["away"].append(player)
                else:
                    games[game]["home"].append(player)
        
        # Create game stacks (players from both teams)
        for game, teams in games.items():
            home_players = teams["home"][:3]  # Top 3 from each team
            away_players = teams["away"][:3]
            
            for h_player in home_players:
                for a_player in away_players:
                    stacks.append([h_player["id"], a_player["id"]])
        
        return stacks
    
    def _generate_team_stacks(self, players: List[Dict], requirements: Dict) -> List[List[str]]:
        """Generate team stack combinations"""
        stacks = []
        teams = {}
        
        # Group players by team
        for player in players:
            team = player["team"]
            if team not in teams:
                teams[team] = []
            teams[team].append(player)
        
        # Generate 3-1, 4-1 team stacks
        for team, team_players in teams.items():
            if len(team_players) >= 3:
                # 3-player team stacks
                from itertools import combinations
                for combo in combinations(team_players[:5], 3):
                    stacks.append([p["id"] for p in combo])
                
                # 4-player team stacks  
                if len(team_players) >= 4:
                    for combo in combinations(team_players[:6], 4):
                        stacks.append([p["id"] for p in combo])
        
        return stacks

class AdvancedOwnershipEngine:
    """Advanced ownership projection and game theory engine"""
    
    def __init__(self):
        self.ownership_factors = {
            "salary_factor": 0.25,    # Higher salary = higher ownership  
            "projection_factor": 0.30, # Higher projection = higher ownership
            "value_factor": -0.20,    # Higher value = lower ownership (contrarian)
            "news_factor": 0.15,      # Breaking news impact
            "weather_factor": 0.10    # Weather impact on ownership
        }
    
    def project_field_ownership(self, players: List[Dict], 
                              contest_type: ContestType,
                              field_size: int = 100000) -> Dict[str, float]:
        """Project ownership percentages for each player"""
        
        ownership_projections = {}
        
        for player in players:
            # Base ownership calculation
            salary = player["salary"]
            projection = player.get("projection", 10.0)
            value = player.get("value", 3.0)
            
            # Salary tier influence
            salary_percentile = self._get_salary_percentile(salary, players)
            salary_ownership = salary_percentile * 30  # High salary = high ownership
            
            # Projection influence  
            proj_percentile = self._get_projection_percentile(projection, players)
            proj_ownership = proj_percentile * 40
            
            # Value influence (inverse)
            value_percentile = self._get_value_percentile(value, players)
            value_ownership = (1 - value_percentile) * 25  # High value = lower ownership
            
            # Contest type adjustments
            if contest_type == ContestType.CASH:
                # Cash games: higher ownership on safe plays
                base_ownership = salary_ownership * 0.4 + proj_ownership * 0.6
            else:
                # Tournaments: more spread out ownership
                base_ownership = salary_ownership * 0.3 + proj_ownership * 0.4 + value_ownership * 0.3
            
            # Add randomness and specific adjustments
            final_ownership = max(1.0, min(50.0, base_ownership + np.random.normal(0, 5)))
            
            ownership_projections[player["name"]] = round(final_ownership, 1)
        
        return ownership_projections
    
    def calculate_leverage_scores(self, players: List[Dict], 
                                ownership_projections: Dict[str, float]) -> Dict[str, float]:
        """Calculate leverage scores (EV vs ownership)"""
        leverage_scores = {}
        
        for player in players:
            name = player["name"]
            projection = player.get("projection", 10.0)
            ownership = ownership_projections.get(name, 10.0)
            
            # Leverage = Projection per dollar vs ownership
            value = projection / (player["salary"] / 1000)
            leverage = value / (ownership / 100)  # Higher value/lower ownership = better leverage
            
            leverage_scores[name] = round(leverage, 2)
        
        return leverage_scores
    
    def _get_salary_percentile(self, salary: float, players: List[Dict]) -> float:
        """Get salary percentile within player pool"""
        salaries = [p["salary"] for p in players]
        return np.percentile(salaries, salary) / max(salaries)
    
    def _get_projection_percentile(self, projection: float, players: List[Dict]) -> float:
        """Get projection percentile within player pool"""
        projections = [p.get("projection", 10.0) for p in players]
        return np.percentile(projections, projection) / max(projections)
    
    def _get_value_percentile(self, value: float, players: List[Dict]) -> float:
        """Get value percentile within player pool"""
        values = [p.get("value", 3.0) for p in players]
        return np.percentile(values, value) / max(values) if max(values) > 0 else 0.5

class AdvancedLineupBuilder:
    """Advanced lineup construction with all professional features"""
    
    def __init__(self, sport: str, site: str):
        self.sport = sport
        self.site = site
        self.simulator = AdvancedContestSimulator()
        self.stacking_engine = AdvancedStackingEngine(sport)
        self.ownership_engine = AdvancedOwnershipEngine()
        
    def build_advanced_lineups(self, players: List[Dict], 
                             constraints: AdvancedConstraints,
                             contest_info: Dict,
                             num_lineups: int = 150) -> List[Dict]:
        """Build lineups with advanced constraints and features"""
        
        print(f"🚀 Building {num_lineups} advanced lineups with professional constraints...")
        
        # Step 1: Project field ownership
        ownership_projections = self.ownership_engine.project_field_ownership(
            players, 
            ContestType(contest_info.get("type", "gpp")),
            contest_info.get("field_size", 100000)
        )
        
        # Step 2: Generate stack combinations
        stack_combos = self.stacking_engine.generate_stack_combinations(
            players,
            constraints.required_stacks
        )
        
        # Step 3: Build lineups with advanced logic
        lineups = []
        used_combinations = set()
        
        for i in range(num_lineups):
            lineup = self._build_single_advanced_lineup(
                players, constraints, ownership_projections, stack_combos, used_combinations, i
            )
            
            if lineup:
                lineups.append(lineup)
                # Track combination to ensure uniqueness
                combo_key = tuple(sorted([p["id"] for p in lineup["players"]]))
                used_combinations.add(combo_key)
        
        # Step 4: Run contest simulation on all lineups
        sim_results = self.simulator.simulate_contest_performance(
            lineups, contest_info, ownership_projections
        )
        
        # Step 5: Add simulation results to lineups
        for i, lineup in enumerate(lineups):
            if i < len(sim_results):
                lineup["simulation"] = sim_results[i]
                lineup["expected_roi"] = sim_results[i].expected_roi
                lineup["sharpe_ratio"] = sim_results[i].sharpe_ratio
                lineup["win_rates"] = sim_results[i].win_rates
        
        # Step 6: Sort by advanced metrics
        lineups.sort(key=lambda x: x.get("expected_roi", 0), reverse=True)
        
        print(f"✅ Generated {len(lineups)} advanced lineups with simulation data")
        return lineups
    
    def _build_single_advanced_lineup(self, players: List[Dict], 
                                    constraints: AdvancedConstraints,
                                    ownership_projections: Dict[str, float],
                                    stack_combos: List[List[str]],
                                    used_combinations: set,
                                    lineup_index: int) -> Optional[Dict]:
        """Build single lineup with advanced constraints"""
        
        # Advanced player selection logic
        available_players = [p for p in players if p["name"] not in constraints.max_player_exposure or 
                           constraints.max_player_exposure[p["name"]] > 0]
        
        # Apply ownership leverage if specified
        if constraints.ownership_leverage_target > 0:
            leverage_scores = self.ownership_engine.calculate_leverage_scores(
                available_players, ownership_projections
            )
            
            # Favor high-leverage players
            available_players.sort(key=lambda p: leverage_scores.get(p["name"], 0), reverse=True)
        
        # Select players using advanced logic
        selected_players = []
        total_salary = 0
        
        # Force stacks if required
        if stack_combos and np.random.random() < 0.7:  # 70% of lineups use stacks
            stack = np.random.choice(stack_combos)
            for player_id in stack[:3]:  # Max 3 players in stack
                player = next((p for p in available_players if p["id"] == player_id), None)
                if player and total_salary + player["salary"] < (50000 if self.site == "DraftKings" else 60000):
                    selected_players.append(player)
                    total_salary += player["salary"]
        
        # Fill remaining positions
        positions_needed = ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "DST"]
        if self.sport == "NBA":
            positions_needed = ["PG", "SG", "SF", "PF", "C", "G", "F", "UTIL"]
        
        remaining_budget = (50000 if self.site == "DraftKings" else 60000) - total_salary
        remaining_positions = positions_needed[len(selected_players):]
        
        for pos in remaining_positions:
            eligible = [p for p in available_players 
                       if p not in selected_players and 
                       p["salary"] <= remaining_budget and
                       (p["position"] == pos or self._can_play_position(p["position"], pos))]
            
            if eligible:
                # Advanced selection logic
                if constraints.force_contrarian_percentage > 0 and np.random.random() < constraints.force_contrarian_percentage:
                    # Select contrarian play (low ownership)
                    eligible.sort(key=lambda p: ownership_projections.get(p["name"], 50))
                    selected = eligible[0]
                else:
                    # Select by value/projection
                    eligible.sort(key=lambda p: p.get("value", 0), reverse=True)
                    selected = eligible[0]
                
                selected_players.append(selected)
                total_salary += selected["salary"]
                remaining_budget -= selected["salary"]
        
        if len(selected_players) >= 8:  # Valid lineup
            return {
                "id": f"advanced_lineup_{lineup_index}",
                "players": selected_players,
                "total_salary": total_salary,
                "total_projection": sum(p.get("projection", 10) for p in selected_players),
                "avg_ownership": np.mean([ownership_projections.get(p["name"], 10) for p in selected_players]),
                "leverage_score": sum(ownership_projections.get(p["name"], 10) / p.get("projection", 10) for p in selected_players),
                "stack_type": self._identify_stack_type(selected_players),
                "contrarian_score": self._calculate_contrarian_score(selected_players, ownership_projections),
                "correlation_score": self._calculate_correlation_score(selected_players)
            }
        
        return None
    
    def _can_play_position(self, player_pos: str, needed_pos: str) -> bool:
        """Check position eligibility with flex positions"""
        if self.sport == "NFL":
            if needed_pos == "FLEX":
                return player_pos in ["RB", "WR", "TE"]
        else:  # NBA
            if needed_pos == "G":
                return player_pos in ["PG", "SG"]
            elif needed_pos == "F":
                return player_pos in ["SF", "PF"]
            elif needed_pos == "UTIL":
                return True
        
        return player_pos == needed_pos
    
    def _identify_stack_type(self, players: List[Dict]) -> str:
        """Identify the type of stack in lineup"""
        teams = {}
        for player in players:
            team = player["team"]
            teams[team] = teams.get(team, 0) + 1
        
        max_team_count = max(teams.values())
        
        if max_team_count >= 4:
            return "4x1_team_stack"
        elif max_team_count >= 3:
            return "3x1_team_stack"
        else:
            # Check for QB-WR stacks
            qbs = [p for p in players if p["position"] == "QB"]
            if qbs:
                qb_team = qbs[0]["team"]
                same_team_receivers = [p for p in players if p["team"] == qb_team and p["position"] in ["WR", "TE"]]
                if len(same_team_receivers) >= 1:
                    return f"qb_wr_{len(same_team_receivers)}x_stack"
        
        return "no_stack"
    
    def _calculate_contrarian_score(self, players: List[Dict], ownership: Dict[str, float]) -> float:
        """Calculate how contrarian the lineup is"""
        total_ownership = sum(ownership.get(p["name"], 10.0) for p in players)
        avg_ownership = total_ownership / len(players)
        
        # Lower ownership = higher contrarian score
        return max(0, 50 - avg_ownership)
    
    def _calculate_correlation_score(self, players: List[Dict]) -> float:
        """Calculate overall correlation score of lineup"""
        correlation_score = 0
        
        # Check for positive correlations
        teams = {}
        for player in players:
            team = player["team"]
            if team not in teams:
                teams[team] = []
            teams[team].append(player)
        
        # Team correlation bonuses
        for team, team_players in teams.items():
            if len(team_players) >= 2:
                correlation_score += len(team_players) * 0.1
                
                # QB-skill position bonuses
                qbs = [p for p in team_players if p["position"] == "QB"]
                skill_players = [p for p in team_players if p["position"] in ["WR", "TE", "RB"]]
                
                if qbs and skill_players:
                    correlation_score += len(skill_players) * 0.15
        
        return correlation_score
