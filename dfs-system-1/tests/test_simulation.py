import pytest
from src.simulation.monte_carlo import run_monte_carlo_simulation

def test_monte_carlo_simulation():
    # Sample input data for the simulation
    player_data = [
        {"name": "Player A", "projection": 25, "variance": 5},
        {"name": "Player B", "projection": 30, "variance": 10},
        {"name": "Player C", "projection": 20, "variance": 2},
    ]
    
    # Run the Monte Carlo simulation
    results = run_monte_carlo_simulation(player_data, num_simulations=1000)
    
    # Check that results are returned
    assert results is not None
    assert len(results) == 1000  # Ensure we have the expected number of simulations

    # Validate that the results contain expected keys
    for result in results:
        assert "lineup" in result
        assert "total_projection" in result

    # Check that the total projections are within a reasonable range
    total_projections = [result["total_projection"] for result in results]
    assert all(15 <= total <= 100 for total in total_projections)  # Adjust range as necessary

    # Additional checks can be added based on specific requirements of the simulation outputs