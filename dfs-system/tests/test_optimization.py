import pytest
from src.optimization.mip_solver import MIPSolver

def test_mip_solver_valid_lineup():
    solver = MIPSolver()
    # Example input data for testing
    players = [
        {"name": "Player A", "salary": 8000, "projection": 30},
        {"name": "Player B", "salary": 7000, "projection": 25},
        {"name": "Player C", "salary": 6000, "projection": 20},
    ]
    budget = 20000
    optimal_lineup = solver.solve(players, budget)
    
    # Check if the lineup is valid
    total_salary = sum(player['salary'] for player in optimal_lineup)
    assert total_salary <= budget, "Lineup exceeds budget"
    assert len(optimal_lineup) > 0, "Lineup should not be empty"

def test_mip_solver_constraints():
    solver = MIPSolver()
    players = [
        {"name": "Player A", "salary": 8000, "projection": 30, "position": "PG"},
        {"name": "Player B", "salary": 7000, "projection": 25, "position": "SG"},
        {"name": "Player C", "salary": 6000, "projection": 20, "position": "SF"},
        {"name": "Player D", "salary": 5000, "projection": 15, "position": "PF"},
        {"name": "Player E", "salary": 4000, "projection": 10, "position": "C"},
    ]
    budget = 20000
    optimal_lineup = solver.solve(players, budget, position_constraints={"PG": 1, "SG": 1, "SF": 1, "PF": 1, "C": 1})
    
    # Check if the lineup meets position constraints
    position_count = {pos: 0 for pos in ["PG", "SG", "SF", "PF", "C"]}
    for player in optimal_lineup:
        position_count[player['position']] += 1
    
    for pos, count in position_constraints.items():
        assert position_count[pos] == count, f"Lineup does not meet position constraint for {pos}"

def test_mip_solver_empty_input():
    solver = MIPSolver()
    optimal_lineup = solver.solve([], 20000)
    assert optimal_lineup == [], "Lineup should be empty for no players"

def test_mip_solver_exceeding_budget():
    solver = MIPSolver()
    players = [
        {"name": "Player A", "salary": 10000, "projection": 30},
        {"name": "Player B", "salary": 9000, "projection": 25},
    ]
    budget = 15000
    optimal_lineup = solver.solve(players, budget)
    
    # Check if the lineup is empty due to budget constraints
    assert optimal_lineup == [], "Lineup should be empty when exceeding budget"