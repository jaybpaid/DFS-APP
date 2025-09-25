"""
Integration Tests for DFS Optimization Pipeline
Tests the complete optimization workflow from player data to lineup generation
"""

import pytest
import json
import numpy as np
from typing import Dict, List, Any

# Import our optimization engine
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../apps/api-python'))

from optimization_engine import DFSOptimizer, Player, Stack, Constraints, OptimizationRequest
from simulation_engine import MonteCarloSimulator, SimulationRequest

class TestOptimizationPipeline:
    """Integration tests for the complete optimization pipeline"""
    
    @pytest.fixture
    def sample_players(self) -> List[Player]:
        """Create sample player data for testing"""
        return [
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
            Player("11", "Lamar Jackson", "QB", "BAL", 8000, 21.8, 0.25, leverage=1.1),
            Player("12", "Davante Adams", "WR", "LV", 7800, 15.8, 0.21, leverage=0.9),
            Player("13", "Nick Chubb", "RB", "CLE", 7000, 16.5, 0.22, leverage=0.8),
            Player("14", "George Kittle", "TE", "SF", 6800, 13.2, 0.18, leverage=0.7),
            Player("15", "Ravens DST", "DST", "BAL", 3000, 7.8, 0.12, leverage=0.4)
        ]
    
    @pytest.fixture
    def sample_constraints(self) -> Constraints:
        """Create sample constraints for testing"""
        return Constraints(
            salary_cap=50000,
            max_from_team=4,
            min_games=2,
            unique_players=9,
            qb_min=1, qb_max=1,
            rb_min=2, rb_max=3,
            wr_min=3, wr_max=4,
            te_min=1, te_max=2,
            dst_min=1, dst_max=1
        )
    
    @pytest.fixture
    def sample_stacks(self) -> List[Stack]:
        """Create sample stack configurations for testing"""
        return [
            Stack("buf_qb_stack", "QB+2", "BUF", ["QB", "WR", "TE"], enabled=True),
            Stack("bal_qb_stack", "QB+2", "BAL", ["QB", "WR", "TE"], enabled=True)
        ]
    
    def test_single_lineup_optimization(self, sample_players, sample_constraints, sample_stacks):
        """Test optimization of a single lineup"""
        optimizer = DFSOptimizer()
        
        # Create optimization request
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=1
        )
        
        # Run optimization
        result = optimizer.optimize(request)
        
        # Validate results
        assert result['success'] is True
        assert len(result['lineups']) == 1
        assert len(result['exposures']) == len(sample_players)
        
        lineup = result['lineups'][0]
        assert len(lineup['players']) == 9
        assert lineup['total_salary'] <= 50000
        assert lineup['projected_score'] > 0
        
        # Validate position requirements
        positions = [p['position'] for p in lineup['players']]
        assert positions.count('QB') == 1
        assert positions.count('RB') >= 2
        assert positions.count('WR') >= 3
        assert positions.count('TE') >= 1
        assert positions.count('DST') == 1
    
    def test_multiple_lineup_optimization(self, sample_players, sample_constraints, sample_stacks):
        """Test optimization of multiple lineups with diversity"""
        optimizer = DFSOptimizer()
        
        # Create optimization request for 10 lineups
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=10
        )
        
        # Run optimization
        result = optimizer.optimize(request)
        
        # Validate results
        assert result['success'] is True
        assert len(result['lineups']) == 10
        assert result['total_generated'] == 10
        
        # Check lineup diversity
        lineups = result['lineups']
        unique_lineups = set()
        for lineup in lineups:
            player_ids = tuple(sorted([p['player_id'] for p in lineup['players']]))
            unique_lineups.add(player_ids)
        
        # Should have some diversity (at least 70% unique)
        assert len(unique_lineups) >= 7
        
        # Validate exposure analysis
        exposures = result['exposures']
        total_exposures = sum(exp['actual_count'] for exp in exposures)
        assert total_exposures == 10 * 9  # 10 lineups * 9 players each
    
    def test_player_controls_integration(self, sample_players, sample_constraints, sample_stacks):
        """Test that player controls are properly applied"""
        optimizer = DFSOptimizer()
        
        # Lock Josh Allen and ban Christian McCaffrey
        sample_players[0].locked = True  # Josh Allen
        sample_players[1].banned = True  # Christian McCaffrey
        
        # Set exposure limits
        sample_players[2].min_exposure = 50  # Tyreek Hill - at least 50%
        sample_players[2].max_exposure = 80  # Tyreek Hill - at most 80%
        
        # Create optimization request
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=10
        )
        
        # Run optimization
        result = optimizer.optimize(request)
        
        # Validate player controls were applied
        assert result['success'] is True
        
        # Check that Josh Allen is in all lineups (locked)
        josh_allen_count = 0
        mccaffrey_count = 0
        tyreek_count = 0
        
        for lineup in result['lineups']:
            player_ids = [p['player_id'] for p in lineup['players']]
            if '1' in player_ids:  # Josh Allen
                josh_allen_count += 1
            if '2' in player_ids:  # McCaffrey
                mccaffrey_count += 1
            if '3' in player_ids:  # Tyreek Hill
                tyreek_count += 1
        
        assert josh_allen_count == 10  # Should be in all lineups (locked)
        assert mccaffrey_count == 0     # Should be in no lineups (banned)
        assert 5 <= tyreek_count <= 8   # Should respect exposure limits (50-80%)
    
    def test_stack_enforcement(self, sample_players, sample_constraints, sample_stacks):
        """Test that stack configurations are properly enforced"""
        optimizer = DFSOptimizer()
        
        # Create optimization request with stack enforcement
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=20
        )
        
        # Run optimization
        result = optimizer.optimize(request)
        
        # Validate stack enforcement
        assert result['success'] is True
        
        # Check stack audit
        stack_audit = result['stack_audit']
        stack_types = [audit['stack_type'] for audit in stack_audit]
        
        # Should have some QB stacks
        qb_stacks = [s for s in stack_types if 'QB+' in s]
        assert len(qb_stacks) > 0
        
        # Validate individual lineups for stack compliance
        stacked_lineups = 0
        for lineup in result['lineups']:
            if 'QB+' in lineup['stack_info']:
                stacked_lineups += 1
        
        # Should have some stacked lineups
        assert stacked_lineups > 0
    
    def test_salary_cap_compliance(self, sample_players, sample_constraints, sample_stacks):
        """Test that all lineups comply with salary cap"""
        optimizer = DFSOptimizer()
        
        # Create optimization request
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=50
        )
        
        # Run optimization
        result = optimizer.optimize(request)
        
        # Validate salary compliance
        assert result['success'] is True
        
        for lineup in result['lineups']:
            assert lineup['total_salary'] <= sample_constraints.salary_cap
            assert lineup['total_salary'] >= sample_constraints.salary_cap * 0.95  # Use at least 95% of cap
    
    def test_position_requirements_compliance(self, sample_players, sample_constraints, sample_stacks):
        """Test that all lineups meet position requirements"""
        optimizer = DFSOptimizer()
        
        # Create optimization request
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=30
        )
        
        # Run optimization
        result = optimizer.optimize(request)
        
        # Validate position compliance
        assert result['success'] is True
        
        for lineup in result['lineups']:
            positions = [p['position'] for p in lineup['players']]
            
            # Check position requirements
            assert positions.count('QB') >= sample_constraints.qb_min
            assert positions.count('QB') <= sample_constraints.qb_max
            assert positions.count('RB') >= sample_constraints.rb_min
            assert positions.count('RB') <= sample_constraints.rb_max
            assert positions.count('WR') >= sample_constraints.wr_min
            assert positions.count('WR') <= sample_constraints.wr_max
            assert positions.count('TE') >= sample_constraints.te_min
            assert positions.count('TE') <= sample_constraints.te_max
            assert positions.count('DST') >= sample_constraints.dst_min
            assert positions.count('DST') <= sample_constraints.dst_max
            
            # Total players
            assert len(positions) == sample_constraints.unique_players
    
    def test_team_limits_compliance(self, sample_players, sample_constraints, sample_stacks):
        """Test that team limits are enforced"""
        optimizer = DFSOptimizer()
        
        # Create optimization request
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=25
        )
        
        # Run optimization
        result = optimizer.optimize(request)
        
        # Validate team limits
        assert result['success'] is True
        
        for lineup in result['lineups']:
            teams = [p['team'] for p in lineup['players']]
            team_counts = {}
            for team in teams:
                team_counts[team] = team_counts.get(team, 0) + 1
            
            # Check that no team exceeds the limit
            for team, count in team_counts.items():
                assert count <= sample_constraints.max_from_team
    
    def test_monte_carlo_simulation_integration(self, sample_players, sample_constraints, sample_stacks):
        """Test integration with Monte Carlo simulation"""
        # First, generate some lineups
        optimizer = DFSOptimizer()
        
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=5
        )
        
        optimization_result = optimizer.optimize(request)
        assert optimization_result['success'] is True
        
        # Now run simulation on the lineups
        simulator = MonteCarloSimulator()
        
        # Convert players to dict format for simulation
        player_dicts = []
        for player in sample_players:
            player_dicts.append({
                'id': player.id,
                'name': player.name,
                'position': player.position,
                'team': player.team,
                'projected_points': player.projected_points,
                'mcp_signals': {
                    'boom_rate': player.boom_rate,
                    'bust_rate': player.bust_rate,
                    'weather': 0,
                    'injury': 'ACTIVE'
                }
            })
        
        sim_request = SimulationRequest(
            slate_id="test_slate",
            players=player_dicts,
            lineups=optimization_result['lineups'],
            num_simulations=1000,
            seed=42,
            distribution_type='normal'
        )
        
        sim_result = simulator.simulate(sim_request)
        
        # Validate simulation results
        assert sim_result['success'] is True
        assert len(sim_result['player_outcomes']) == len(sample_players)
        assert len(sim_result['lineup_results']) == 5
        
        # Check ROI distribution
        roi_dist = sim_result['roi_distribution']
        assert 'mean_roi' in roi_dist
        assert 'median_roi' in roi_dist
        assert 'positive_roi_rate' in roi_dist
    
    def test_error_handling_insufficient_players(self, sample_constraints, sample_stacks):
        """Test error handling when there are insufficient players"""
        optimizer = DFSOptimizer()
        
        # Create insufficient player pool (only 5 players)
        insufficient_players = [
            Player("1", "Josh Allen", "QB", "BUF", 8400, 22.5, 0.28),
            Player("2", "Christian McCaffrey", "RB", "SF", 9000, 18.2, 0.35),
            Player("3", "Tyreek Hill", "WR", "MIA", 8200, 16.8, 0.22),
            Player("4", "Travis Kelce", "TE", "KC", 7800, 14.5, 0.31),
            Player("5", "Bills DST", "DST", "BUF", 3200, 8.2, 0.15)
        ]
        
        request = OptimizationRequest(
            slate_id="test_slate",
            players=insufficient_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=1
        )
        
        result = optimizer.optimize(request)
        
        # Should handle gracefully but may not generate lineups
        assert 'success' in result
        assert 'message' in result
    
    def test_error_handling_impossible_constraints(self, sample_players, sample_stacks):
        """Test error handling with impossible constraints"""
        optimizer = DFSOptimizer()
        
        # Create impossible constraints (salary cap too low)
        impossible_constraints = Constraints(
            salary_cap=10000,  # Way too low
            max_from_team=4,
            min_games=2,
            unique_players=9
        )
        
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=impossible_constraints,
            stacks=sample_stacks,
            num_lineups=1
        )
        
        result = optimizer.optimize(request)
        
        # Should handle gracefully
        assert 'success' in result
        assert 'message' in result
        if not result['success']:
            assert 'salary' in result['message'].lower() or 'constraint' in result['message'].lower()
    
    def test_performance_benchmarks(self, sample_players, sample_constraints, sample_stacks):
        """Test performance benchmarks for optimization"""
        import time
        
        optimizer = DFSOptimizer()
        
        # Test 150 lineup generation performance
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=150
        )
        
        start_time = time.time()
        result = optimizer.optimize(request)
        end_time = time.time()
        
        optimization_time = end_time - start_time
        
        # Should complete within reasonable time (30 seconds)
        assert optimization_time < 30.0
        assert result['success'] is True
        assert len(result['lineups']) <= 150  # May generate fewer if constraints are tight
        
        print(f"150 lineup optimization completed in {optimization_time:.2f} seconds")
        print(f"Generated {len(result['lineups'])} lineups")
    
    def test_lineup_uniqueness_validation(self, sample_players, sample_constraints, sample_stacks):
        """Test that generated lineups have sufficient uniqueness"""
        optimizer = DFSOptimizer()
        
        request = OptimizationRequest(
            slate_id="test_slate",
            players=sample_players,
            constraints=sample_constraints,
            stacks=sample_stacks,
            num_lineups=100
        )
        
        result = optimizer.optimize(request)
        assert result['success'] is True
        
        # Check lineup uniqueness
        lineup_signatures = set()
        for lineup in result['lineups']:
            # Create signature from sorted player IDs
            signature = tuple(sorted([p['player_id'] for p in lineup['players']]))
            lineup_signatures.add(signature)
        
        # Should have high uniqueness (at least 80% unique lineups)
        uniqueness_rate = len(lineup_signatures) / len(result['lineups'])
        assert uniqueness_rate >= 0.8
        
        print(f"Lineup uniqueness rate: {uniqueness_rate:.2%}")

if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])
