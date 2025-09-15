"""
Test script for advanced Monte Carlo simulation enhancements
Demonstrates historical calibration, copula correlations, ML enhancement, and adaptive sampling
"""

import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

import sys
import os
# Add the dfs-optimizer directory to the path
dfs_optimizer_path = os.path.join(os.path.dirname(__file__), 'dfs-optimizer')
sys.path.insert(0, dfs_optimizer_path)

from services.sim.model import (
    AdvancedMonteCarloSimulator,
    HistoricalCalibration,
    CopulaCorrelationModel,
    MLProjectionEnhancer,
    AdaptiveSampler,
    simulate_lineup_advanced,
    simulate_hierarchical
)
from packages.shared.types import Player, Lineup, Contest, Site

async def create_mock_historical_data() -> pd.DataFrame:
    """Create mock historical data for testing enhancements"""
    print("📊 Creating mock historical data...")

    # Create realistic NFL player data
    players = ['Josh Allen', 'Christian McCaffrey', 'Tyreek Hill', 'Travis Kelce',
              'Buffalo Bills', 'Patrick Mahomes', 'Austin Ekeler', 'Davante Adams']

    historical_data = []

    # Generate 100 games of historical data
    for game_id in range(100):
        game_date = datetime.now() - timedelta(days=np.random.randint(1, 365))

        for player in players:
            # Generate realistic fantasy points based on player
            if 'Allen' in player or 'Mahomes' in player:
                base_points = np.random.normal(20, 5)  # QB
            elif 'McCaffrey' in player or 'Ekeler' in player:
                base_points = np.random.normal(18, 6)  # RB
            elif 'Hill' in player or 'Adams' in player:
                base_points = np.random.normal(15, 4)  # WR
            elif 'Kelce' in player:
                base_points = np.random.normal(12, 3)  # TE
            elif 'Bills' in player:
                base_points = np.random.normal(8, 4)  # DST
            else:
                base_points = np.random.normal(10, 3)

            # Ensure non-negative
            fantasy_points = max(0, base_points)

            historical_data.append({
                'game_id': game_id,
                'player_id': player.replace(' ', '').lower(),
                'player_name': player,
                'fantasy_points': fantasy_points,
                'date': game_date
            })

    return pd.DataFrame(historical_data)

def create_test_players() -> list[Player]:
    """Create test player objects"""
    print("👥 Creating test players...")

    players_data = [
        ('joshallen', 'Josh Allen', 'BUF', ['QB'], 8000, 22.5, 0.25, 'Active'),
        ('christianmccaffrey', 'Christian McCaffrey', 'SF', ['RB'], 9500, 20.1, 0.30, 'Active'),
        ('tyreekhill', 'Tyreek Hill', 'MIA', ['WR'], 7800, 18.7, 0.22, 'Active'),
        ('traviskelce', 'Travis Kelce', 'KC', ['TE'], 6500, 14.2, 0.18, 'Active'),
        ('buffalobills', 'Buffalo Bills', 'BUF', ['DST'], 3500, 9.8, 0.12, 'Active'),
        ('patrickmahomes', 'Patrick Mahomes', 'KC', ['QB'], 8500, 21.8, 0.28, 'Active'),
        ('austinekeler', 'Austin Ekeler', 'LAC', ['RB'], 7200, 16.5, 0.20, 'Active'),
        ('davanteadams', 'Davante Adams', 'LV', ['WR'], 7600, 17.3, 0.19, 'Active')
    ]

    players = []
    for player_id, name, team, pos, salary, proj, own, status in players_data:
        player = Player(
            playerId=player_id,
            name=name,
            team=team,
            pos=pos,
            salary=salary,
            projection=proj,
            stdev=proj * 0.25,  # 25% standard deviation
            ownership=own,
            status=status,
            opp='OPP',  # Placeholder
            floor=proj * 0.6,
            ceiling=proj * 1.6
        )
        players.append(player)

    return players

def create_test_lineup(players: list[Player]) -> Lineup:
    """Create a test lineup"""
    print("📋 Creating test lineup...")

    # Select top players for a lineup (QB, 2 RB, 2 WR, TE, FLEX, DST)
    lineup_players = [
        'joshallen',  # QB
        'christianmccaffrey',  # RB1
        'austinekeler',  # RB2
        'tyreekhill',  # WR1
        'davanteadams',  # WR2
        'traviskelce',  # TE
        'tyreekhill',  # FLEX (duplicate for simplicity)
        'buffalobills'  # DST
    ]

    return Lineup(
        lineupId='test_lineup_001',
        playerIds=lineup_players,
        salary=sum(p.salary for p in players if p.playerId in lineup_players[:7]),  # Exclude FLEX duplicate
        projected=sum(p.projection or 0 for p in players if p.playerId in lineup_players[:7])
    )

async def test_basic_enhancements():
    """Test basic enhancement components"""
    print("\n🧪 Testing Basic Enhancements")
    print("=" * 50)

    # Create historical data
    historical_data = await create_mock_historical_data()

    # Test Historical Calibration
    print("\n📈 Testing Historical Calibration...")
    calibration = HistoricalCalibration()
    calibration.fit_player_distributions(historical_data)

    print(f"✅ Fitted distributions for {len(calibration.player_distributions)} players")

    # Test sample calibration
    test_player = 'joshallen'
    base_proj = 22.5
    calibrated, uncertainty = calibration.get_calibrated_projection(test_player, base_proj)
    print(f"   Calibrated: {calibrated:.1f} ± {uncertainty:.1f}")

    # Test Copula Model
    print("\n🔗 Testing Copula Correlation Model...")
    copula = CopulaCorrelationModel()
    copula.fit(historical_data)
    print(f"✅ Copula model fitted: {copula.is_fitted}")

    # Test ML Enhancer
    print("\n🤖 Testing ML Projection Enhancer...")
    ml_model = MLProjectionEnhancer()

    # Create mock training data
    training_data = pd.DataFrame({
        'base_projection': np.random.uniform(5, 25, 100),
        'ownership': np.random.uniform(0.05, 0.35, 100),
        'salary': np.random.randint(3000, 10000, 100),
        'position_rank': np.random.randint(1, 50, 100),
        'team_strength': np.random.uniform(0.3, 0.8, 100),
        'matchup_difficulty': np.random.uniform(0.2, 0.9, 100),
        'weather_impact': np.random.choice([-0.1, 0, 0.1], 100),
        'injury_status': np.random.choice([0, 0.3, 0.7], 100),
        'recent_form': np.random.uniform(0.3, 1.0, 100),
        'season_trend': np.random.uniform(0.4, 1.1, 100),
        'actual_points': np.random.uniform(5, 25, 100)
    })

    ml_model.train(training_data)
    print(f"✅ ML model trained: {ml_model.is_trained}")

    # Test enhancement
    features = {
        'base_projection': 20.0,
        'ownership': 0.25,
        'salary': 8000,
        'position_rank': 5,
        'team_strength': 0.7,
        'matchup_difficulty': 0.4,
        'weather_impact': 0.0,
        'injury_status': 0.0,
        'recent_form': 0.8,
        'season_trend': 0.9
    }

    enhanced, uncertainty = ml_model.enhance_projection(features)
    print(f"   Enhanced: {enhanced:.1f} ± {uncertainty:.1f}")
async def test_advanced_simulation():
    """Test the full advanced Monte Carlo simulator"""
    print("\n🚀 Testing Advanced Monte Carlo Simulation")
    print("=" * 50)

    # Create test data
    players = create_test_players()
    lineup = create_test_lineup(players)
    historical_data = await create_mock_historical_data()

    print(f"📊 Testing with {len(players)} players and historical data from {len(historical_data)} games")

    # Create advanced simulator
    simulator = AdvancedMonteCarloSimulator(players, historical_data=historical_data)

    # Get enhancement stats
    stats = simulator.get_enhancement_stats()
    print("\n📈 Enhancement Model Status:")
    print(f"   Historical Calibration: {stats['historical_calibration']['fitted_players']} players fitted")
    print(f"   Copula Model: {'✅ Fitted' if stats['copula_model']['is_fitted'] else '❌ Not fitted'}")
    print(f"   ML Enhancer: {'✅ Trained' if stats['ml_enhancer']['is_trained'] else '❌ Not trained'}")

    # Test standard simulation
    print("\n🎯 Running Standard Simulation (1,000 trials)...")
    standard_result = await simulator.simulate_lineup_advanced(lineup, 1000, use_adaptive=False)
    print(f"   Mean Score: {standard_result.mean_score:.1f} ± {standard_result.std_dev:.1f}")
    print(f"   90th Percentile: {standard_result.percentiles[90]:.1f}")
    print(f"   Sharpe Ratio: {standard_result.sharpe:.2f}")

    # Test adaptive simulation
    print("\n🎯 Running Adaptive Simulation (precision target: 0.01)...")
    adaptive_result = await simulator.simulate_lineup_advanced(lineup, 5000, use_adaptive=True)
    print(f"   Ran {adaptive_result.iterations} simulations")
    print(f"   Mean Score: {adaptive_result.mean_score:.1f} ± {adaptive_result.std_dev:.1f}")
    print(f"   Standard Error: {adaptive_result.std_dev / (adaptive_result.iterations ** 0.5):.3f}")

    # Test hierarchical simulation
    print("\n🎯 Running Hierarchical Simulation (100 games)...")
    hierarchical_result = await simulator.hierarchical_simulation(lineup, 100)
    print(f"   Mean Score: {hierarchical_result.mean_score:.1f} ± {hierarchical_result.std_dev:.1f}")
    print(f"   Game-to-Game Variance: {hierarchical_result.std_dev:.1f}")

async def test_comparison():
    """Compare different simulation approaches"""
    print("\n⚖️ Comparing Simulation Approaches")
    print("=" * 50)

    players = create_test_players()
    lineup = create_test_lineup(players)
    historical_data = await create_mock_historical_data()

    results = {}

    # Basic Monte Carlo
    from dfs_optimizer.services.sim.model import MonteCarloSimulator
    basic_sim = MonteCarloSimulator(players)
    results['Basic MC'] = await basic_sim.simulate_lineup(lineup, 1000)

    # Advanced Monte Carlo
    advanced_sim = AdvancedMonteCarloSimulator(players, historical_data=historical_data)
    results['Advanced MC'] = await advanced_sim.simulate_lineup_advanced(lineup, 1000, use_adaptive=False)

    # Hierarchical
    results['Hierarchical'] = await advanced_sim.hierarchical_simulation(lineup, 100)

    print("\n📊 Simulation Comparison:")
    print(f"{'Method':<15} {'Mean Score':<12} {'Std Dev':<10} {'90th %ile':<10}")
    print("-" * 60)

    for method, result in results.items():
        print(f"{method:<15} {result.mean_score:<12.1f} {result.std_dev:<10.1f} {result.percentiles[90]:<10.1f}")
async def main():
    """Main test function"""
    print("🧪 Advanced Monte Carlo Simulation Test Suite")
    print("=" * 60)
    print("Testing all enhancements: Historical Calibration, Copula Correlations,")
    print("ML Enhancement, Hierarchical Simulation, and Adaptive Sampling")
    print()

    try:
        # Test basic enhancements
        await test_basic_enhancements()

        # Test advanced simulation
        await test_advanced_simulation()

        # Test comparison
        await test_comparison()

        print("\n🎉 All Advanced Simulation Tests Completed Successfully!")
        print("\n✨ Key Improvements Demonstrated:")
        print("   • Historical calibration using beta distributions")
        print("   • Copula-based correlation modeling")
        print("   • ML-enhanced projections with feature engineering")
        print("   • Adaptive sampling for precision targeting")
        print("   • Hierarchical game-then-player simulation")
        print("   • Professional-grade statistical rigor")

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
