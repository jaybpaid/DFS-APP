from typing import List, Dict
import numpy as np

def monte_carlo_simulation(player_projections: Dict[str, float], num_simulations: int = 10000) -> Dict[str, List[float]]:
    results = {player: [] for player in player_projections.keys()}
    
    for _ in range(num_simulations):
        for player, projection in player_projections.items():
            # Simulate player performance based on projection with some randomness
            simulated_performance = np.random.normal(loc=projection, scale=projection * 0.1)  # 10% std deviation
            results[player].append(simulated_performance)
    
    return results

def evaluate_lineup(lineup: List[str], simulation_results: Dict[str, List[float]]) -> float:
    total_score = 0
    for player in lineup:
        if player in simulation_results:
            total_score += np.mean(simulation_results[player])
    return total_score

def run_monte_carlo_for_lineups(lineups: List[List[str]], player_projections: Dict[str, float], num_simulations: int = 10000) -> Dict[str, float]:
    simulation_results = monte_carlo_simulation(player_projections, num_simulations)
    lineup_scores = {str(lineup): evaluate_lineup(lineup, simulation_results) for lineup in lineups}
    return lineup_scores