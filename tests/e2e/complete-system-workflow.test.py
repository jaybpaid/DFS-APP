"""
End-to-End Tests for Complete DFS Optimizer System
Tests the entire workflow from UI interaction to lineup export
"""

import pytest
import json
import time
import csv
import io
from typing import Dict, List, Any
from unittest.mock import Mock, patch

# Import system components
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../apps/api-python'))

from optimization_engine import DFSOptimizer, Player, Stack, Constraints, OptimizationRequest
from simulation_engine import MonteCarloSimulator, SimulationRequest

class TestCompleteSystemWorkflow:
    """End-to-end tests for the complete DFS optimizer system"""
    
    @pytest.fixture
    def full_player_pool(self) -> List[Player]:
        """Create a full player pool for realistic testing"""
        players = []
        
        # QBs
        qbs = [
            ("1", "Josh Allen", "QB", "BUF", 8400, 22.5, 0.28, 1.2),
            ("2", "Lamar Jackson", "QB", "BAL", 8000, 21.8, 0.25, 1.1),
            ("3", "Patrick Mahomes", "QB", "KC", 8200, 22.1, 0.30, 0.9),
            ("4", "Dak Prescott", "QB", "DAL", 7600, 20.5, 0.18, 1.3),
            ("5", "Tua Tagovailoa", "QB", "MIA", 7200, 19.2, 0.15, 1.4)
        ]
        
        # RBs
        rbs = [
            ("6", "Christian McCaffrey", "RB", "SF", 9000, 18.2, 0.35, 0.8),
            ("7", "Saquon Barkley", "RB", "NYG", 7400, 16.1, 0.24, 1.0),
            ("8", "Dalvin Cook", "RB", "MIN", 6800, 15.2, 0.16, 0.9),
            ("9", "Nick Chubb", "RB", "CLE", 7000, 16.5, 0.22, 0.8),
            ("10", "Derrick Henry", "RB", "TEN", 6600, 15.8, 0.20, 0.7),
            ("11", "Austin Ekeler", "RB", "LAC", 6400, 14.5, 0.18, 1.1),
            ("12", "Tony Pollard", "RB", "DAL", 5800, 12.8, 0.12, 1.2)
        ]
        
        # WRs
        wrs = [
            ("13", "Tyreek Hill", "WR", "MIA", 8200, 16.8, 0.22, 1.5),
            ("14", "Stefon Diggs", "WR", "BUF", 7600, 15.3, 0.19, 1.1),
            ("15", "Cooper Kupp", "WR", "LAR", 7200, 14.8, 0.18, 0.7),
            ("16", "Davante Adams", "WR", "LV", 7800, 15.8, 0.21, 0.9),
            ("17", "DeAndre Hopkins", "WR", "ARI", 6800, 13.5, 0.16, 1.0),
            ("18", "Keenan Allen", "WR", "LAC", 6400, 12.8, 0.14, 0.8),
            ("19", "CeeDee Lamb", "WR", "DAL", 7000, 14.2, 0.17, 1.2),
            ("20", "Jaylen Waddle", "WR", "MIA", 6200, 12.1, 0.13, 1.3),
            ("21", "Gabriel Davis", "WR", "BUF", 5600, 11.5, 0.11, 1.4),
            ("22", "Mike Evans", "WR", "TB", 6600, 13.2, 0.15, 0.9)
        ]
        
        # TEs
        tes = [
            ("23", "Travis Kelce", "TE", "KC", 7800, 14.5, 0.31, 0.9),
            ("24", "Mark Andrews", "TE", "BAL", 6400, 12.1, 0.20, 0.8),
            ("25", "George Kittle", "TE", "SF", 6800, 13.2, 0.18, 0.7),
            ("26", "Darren Waller", "TE", "LV", 6000, 11.8, 0.16, 1.0),
            ("27", "T.J. Hockenson", "TE", "DET", 5400, 10.5, 0.12, 1.1)
        ]
        
        # DSTs
        dsts = [
            ("28", "Bills DST", "DST", "BUF", 3200, 8.2, 0.15, 0.5),
            ("29", "Ravens DST", "DST", "BAL", 3000, 7.8, 0.12, 0.4),
            ("30", "49ers DST", "DST", "SF", 2800, 7.5, 0.10, 0.6),
            ("31", "Cowboys DST", "DST", "DAL", 2600, 7.2, 0.08, 0.7),
            ("32", "Chiefs DST", "DST", "KC", 2400, 6.8, 0.06, 0.8)
        ]
        
        # Create Player objects
        all_player_data = qbs + rbs + wrs + tes + dsts
        for pid, name, pos, team, salary, proj, own, lev in all_player_data:
            players.append(Player(
                id=pid,
                name=name,
                position=pos,
                team=team,
                salary=salary,
                projected_points=proj,
                ownership=own,
                leverage=lev
            ))
        
        return players
    
    @pytest.fixture
    def production_constraints(self) -> Constraints:
        """Create production-ready constraints"""
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
    def production_stacks(self) -> List[Stack]:
        """Create production stack configurations"""
        return [
            Stack("buf_qb_stack", "QB+2", "BUF", ["QB", "WR", "TE"], enabled=True),
            Stack("bal_qb_stack", "QB+2", "BAL", ["QB", "WR", "TE"], enabled=True),
            Stack("kc_qb_stack", "QB+2", "KC", ["QB", "WR", "TE"], enabled=True),
            Stack("mia_qb_stack", "QB+2", "MIA", ["QB", "WR", "TE"], enabled=True),
            Stack("dal_qb_stack", "QB+2", "DAL", ["QB", "WR", "TE"], enabled=True)
        ]
    
    def test_complete_150_lineup_workflow(self, full_player_pool, production_constraints, production_stacks):
        """Test the complete workflow for generating 150 lineups"""
        print("\n=== Testing Complete 150 Lineup Workflow ===")
        
        # Step 1: Initialize optimizer
        optimizer = DFSOptimizer()
        
        # Step 2: Apply various player controls
        # Lock a core QB
        full_player_pool[0].locked = True  # Josh Allen
        
        # Ban an expensive RB
        full_player_pool[5].banned = True  # Christian McCaffrey
        
        # Set exposure limits on key players
        full_player_pool[12].min_exposure = 30  # Tyreek Hill - at least 30%
        full_player_pool[12].max_exposure = 60  # Tyreek Hill - at most 60%
        
        # Set custom projections
        full_player_pool[13].custom_projection = 17.5  # Boost Stefon Diggs
        full_player_pool[14].projection_boost = -10    # Fade Cooper Kupp by 10%
        
        # Set priority tags
        full_player_pool[22].priority_tag = 'core'      # Travis Kelce as core
        full_player_pool[16].priority_tag = 'contrarian' # DeAndre Hopkins as contrarian
        
        print(f"Applied player controls to {len(full_player_pool)} players")
        
        # Step 3: Create optimization request
        request = OptimizationRequest(
            slate_id="production_slate_2025_09_17",
            players=full_player_pool,
            constraints=production_constraints,
            stacks=production_stacks,
            num_lineups=150,
            variance_settings={
                'enable_randomness': True,
                'randomness_percentage': 15,
                'distribution_mode': 'normal'
            }
        )
        
        # Step 4: Run optimization
        start_time = time.time()
        result = optimizer.optimize(request)
        optimization_time = time.time() - start_time
        
        print(f"Optimization completed in {optimization_time:.2f} seconds")
        
        # Step 5: Validate optimization results
        assert result['success'] is True, f"Optimization failed: {result.get('message', 'Unknown error')}"
        assert len(result['lineups']) > 0, "No lineups generated"
        assert len(result['lineups']) <= 150, f"Too many lineups generated: {len(result['lineups'])}"
        
        print(f"Generated {len(result['lineups'])} lineups")
        
        # Step 6: Validate player controls were applied
        josh_allen_count = 0
        mccaffrey_count = 0
        tyreek_count = 0
        
        for lineup in result['lineups']:
            player_ids = [p['player_id'] for p in lineup['players']]
            if '1' in player_ids:  # Josh Allen
                josh_allen_count += 1
            if '6' in player_ids:  # McCaffrey
                mccaffrey_count += 1
            if '13' in player_ids:  # Tyreek Hill
                tyreek_count += 1
        
        assert josh_allen_count == len(result['lineups']), "Locked player not in all lineups"
        assert mccaffrey_count == 0, "Banned player found in lineups"
        
        tyreek_exposure = (tyreek_count / len(result['lineups'])) * 100
        assert 25 <= tyreek_exposure <= 65, f"Tyreek Hill exposure {tyreek_exposure:.1f}% outside target range"
        
        print(f"Player controls validation passed:")
        print(f"  - Josh Allen in {josh_allen_count}/{len(result['lineups'])} lineups (locked)")
        print(f"  - McCaffrey in {mccaffrey_count}/{len(result['lineups'])} lineups (banned)")
        print(f"  - Tyreek Hill in {tyreek_count}/{len(result['lineups'])} lineups ({tyreek_exposure:.1f}% exposure)")
        
        # Step 7: Validate lineup constraints
        for i, lineup in enumerate(result['lineups']):
            # Salary cap compliance
            assert lineup['total_salary'] <= production_constraints.salary_cap, f"Lineup {i+1} exceeds salary cap"
            assert lineup['total_salary'] >= production_constraints.salary_cap * 0.95, f"Lineup {i+1} underutilizes salary cap"
            
            # Position requirements
            positions = [p['position'] for p in lineup['players']]
            assert positions.count('QB') == 1, f"Lineup {i+1} has wrong QB count"
            assert 2 <= positions.count('RB') <= 3, f"Lineup {i+1} has wrong RB count"
            assert 3 <= positions.count('WR') <= 4, f"Lineup {i+1} has wrong WR count"
            assert 1 <= positions.count('TE') <= 2, f"Lineup {i+1} has wrong TE count"
            assert positions.count('DST') == 1, f"Lineup {i+1} has wrong DST count"
            
            # Team limits
            teams = [p['team'] for p in lineup['players']]
            team_counts = {}
            for team in teams:
                team_counts[team] = team_counts.get(team, 0) + 1
            
            for team, count in team_counts.items():
                assert count <= production_constraints.max_from_team, f"Lineup {i+1} exceeds team limit for {team}"
        
        print("All lineup constraints validated successfully")
        
        # Step 8: Analyze lineup diversity
        lineup_signatures = set()
        for lineup in result['lineups']:
            signature = tuple(sorted([p['player_id'] for p in lineup['players']]))
            lineup_signatures.add(signature)
        
        uniqueness_rate = len(lineup_signatures) / len(result['lineups'])
        assert uniqueness_rate >= 0.75, f"Lineup uniqueness too low: {uniqueness_rate:.2%}"
        
        print(f"Lineup uniqueness: {uniqueness_rate:.2%}")
        
        # Step 9: Validate exposure analysis
        exposures = result['exposures']
        assert len(exposures) == len(full_player_pool), "Exposure data incomplete"
        
        total_player_slots = sum(exp['actual_count'] for exp in exposures)
        expected_slots = len(result['lineups']) * 9
        assert total_player_slots == expected_slots, "Exposure count mismatch"
        
        print(f"Exposure analysis validated: {total_player_slots} total player slots")
        
        # Step 10: Validate stack audit
        stack_audit = result['stack_audit']
        assert len(stack_audit) > 0, "No stack audit data"
        
        total_stack_percentage = sum(audit['percentage'] for audit in stack_audit)
        assert 95 <= total_stack_percentage <= 105, "Stack audit percentages don't sum to ~100%"
        
        print(f"Stack audit validated: {len(stack_audit)} stack types")
        
        return result
    
    def test_monte_carlo_simulation_workflow(self, full_player_pool, production_constraints, production_stacks):
        """Test the complete Monte Carlo simulation workflow"""
        print("\n=== Testing Monte Carlo Simulation Workflow ===")
        
        # Step 1: Generate lineups for simulation
        optimizer = DFSOptimizer()
        
        request = OptimizationRequest(
            slate_id="simulation_test_slate",
            players=full_player_pool,
            constraints=production_constraints,
            stacks=production_stacks,
            num_lineups=20
        )
        
        optimization_result = optimizer.optimize(request)
        assert optimization_result['success'] is True
        
        print(f"Generated {len(optimization_result['lineups'])} lineups for simulation")
        
        # Step 2: Prepare simulation data
        simulator = MonteCarloSimulator()
        
        # Convert players to dict format
        player_dicts = []
        for player in full_player_pool:
            player_dicts.append({
                'id': player.id,
                'name': player.name,
                'position': player.position,
                'team': player.team,
                'projected_points': player.projected_points,
                'mcp_signals': {
                    'boom_rate': player.boom_rate if hasattr(player, 'boom_rate') else 25.0,
                    'bust_rate': player.bust_rate if hasattr(player, 'bust_rate') else 20.0,
                    'weather': 0,
                    'injury': 'ACTIVE'
                }
            })
        
        # Step 3: Run simulation
        sim_request = SimulationRequest(
            slate_id="simulation_test_slate",
            players=player_dicts,
            lineups=optimization_result['lineups'],
            num_simulations=10000,
            seed=42,
            distribution_type='normal',
            correlation_strength=0.7
        )
        
        start_time = time.time()
        sim_result = simulator.simulate(sim_request)
        simulation_time = time.time() - start_time
        
        print(f"Simulation completed in {simulation_time:.2f} seconds")
        
        # Step 4: Validate simulation results
        assert sim_result['success'] is True, f"Simulation failed: {sim_result.get('message', 'Unknown error')}"
        
        # Validate player outcomes
        player_outcomes = sim_result['player_outcomes']
        assert len(player_outcomes) == len(full_player_pool), "Player outcomes incomplete"
        
        for outcome in player_outcomes:
            assert outcome['projected_points'] > 0, "Invalid projected points"
            assert outcome['mean_outcome'] > 0, "Invalid mean outcome"
            assert outcome['p5'] <= outcome['p25'] <= outcome['p50'] <= outcome['p75'] <= outcome['p95'], "Invalid percentiles"
            assert 0 <= outcome['boom_rate'] <= 100, "Invalid boom rate"
            assert 0 <= outcome['bust_rate'] <= 100, "Invalid bust rate"
            assert outcome['variance'] >= 0, "Invalid variance"
        
        print(f"Player outcomes validated: {len(player_outcomes)} players")
        
        # Validate lineup results
        lineup_results = sim_result['lineup_results']
        assert len(lineup_results) == len(optimization_result['lineups']), "Lineup results incomplete"
        
        for result in lineup_results:
            assert result['projected_score'] > 0, "Invalid projected score"
            assert result['actual_score'] > 0, "Invalid actual score"
            assert 0 <= result['percentile'] <= 100, "Invalid percentile"
            assert 0 <= result['boom_rate'] <= 100, "Invalid boom rate"
            assert 0 <= result['bust_rate'] <= 100, "Invalid bust rate"
        
        print(f"Lineup results validated: {len(lineup_results)} lineups")
        
        # Validate ROI distribution
        roi_dist = sim_result['roi_distribution']
        required_fields = ['mean_roi', 'median_roi', 'std_roi', 'min_roi', 'max_roi', 'positive_roi_rate']
        for field in required_fields:
            assert field in roi_dist, f"Missing ROI field: {field}"
        
        assert 0 <= roi_dist['positive_roi_rate'] <= 100, "Invalid positive ROI rate"
        
        print(f"ROI distribution validated: {roi_dist['positive_roi_rate']:.1f}% positive ROI rate")
        
        return sim_result
    
    def test_draftkings_csv_export_workflow(self, full_player_pool, production_constraints, production_stacks):
        """Test the complete DraftKings CSV export workflow"""
        print("\n=== Testing DraftKings CSV Export Workflow ===")
        
        # Step 1: Generate lineups
        optimizer = DFSOptimizer()
        
        request = OptimizationRequest(
            slate_id="export_test_slate",
            players=full_player_pool,
            constraints=production_constraints,
            stacks=production_stacks,
            num_lineups=150
        )
        
        result = optimizer.optimize(request)
        assert result['success'] is True
        
        print(f"Generated {len(result['lineups'])} lineups for export")
        
        # Step 2: Generate DraftKings CSV
        csv_content = self.generate_draftkings_csv(result['lineups'])
        
        # Step 3: Validate CSV format
        csv_reader = csv.reader(io.StringIO(csv_content))
        rows = list(csv_reader)
        
        # Validate header
        expected_header = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST']
        assert rows[0] == expected_header, f"Invalid CSV header: {rows[0]}"
        
        # Validate lineup rows
        assert len(rows) == len(result['lineups']) + 1, "CSV row count mismatch"  # +1 for header
        
        for i, row in enumerate(rows[1:], 1):  # Skip header
            assert len(row) == 9, f"Lineup {i} has wrong number of positions: {len(row)}"
            
            # Validate each position has a player
            for j, player_entry in enumerate(row):
                assert player_entry.strip() != '', f"Lineup {i}, position {j} is empty"
                assert '(' in player_entry and ')' in player_entry, f"Invalid player format in lineup {i}, position {j}"
        
        print(f"CSV validation passed: {len(rows)-1} lineup rows with proper format")
        
        # Step 4: Validate position mapping
        for i, lineup in enumerate(result['lineups']):
            csv_row = rows[i + 1]  # +1 to skip header
            
            # Extract player names from CSV
            csv_players = []
            for entry in csv_row:
                player_name = entry.split(' (')[0]  # Extract name before parentheses
                csv_players.append(player_name)
            
            # Validate position mapping
            lineup_positions = {}
            for player in lineup['players']:
                pos = player['position']
                if pos not in lineup_positions:
                    lineup_positions[pos] = []
                lineup_positions[pos].append(player['name'])
            
            # Check QB position
            qb_players = lineup_positions.get('QB', [])
            assert len(qb_players) == 1, f"Lineup {i+1} should have exactly 1 QB"
            assert qb_players[0] in csv_players[0], f"QB mismatch in lineup {i+1}"
            
            # Check RB positions (positions 1-2, and possibly FLEX)
            rb_players = lineup_positions.get('RB', [])
            assert len(rb_players) >= 2, f"Lineup {i+1} should have at least 2 RBs"
            
            # Check WR positions (positions 3-5, and possibly FLEX)
            wr_players = lineup_positions.get('WR', [])
            assert len(wr_players) >= 3, f"Lineup {i+1} should have at least 3 WRs"
            
            # Check TE position (position 6, and possibly FLEX)
            te_players = lineup_positions.get('TE', [])
            assert len(te_players) >= 1, f"Lineup {i+1} should have at least 1 TE"
            
            # Check DST position
            dst_players = lineup_positions.get('DST', [])
            assert len(dst_players) == 1, f"Lineup {i+1} should have exactly 1 DST"
            assert dst_players[0] in csv_players[8], f"DST mismatch in lineup {i+1}"
        
        print("Position mapping validation passed")
        
        # Step 5: Test file export simulation
        filename = f"dfs_lineups_draftkings_{time.strftime('%Y%m%d_%H%M%S')}.csv"
        
        # Simulate file write (in real implementation, this would write to disk)
        file_size = len(csv_content.encode('utf-8'))
        assert file_size > 1000, "CSV file too small"  # Should be substantial
        
        print(f"Export simulation complete: {filename} ({file_size} bytes)")
        
        return csv_content
    
    def generate_draftkings_csv(self, lineups: List[Dict]) -> str:
        """Generate DraftKings-compatible CSV from lineups"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        header = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST']
        writer.writerow(header)
        
        # Write lineup rows
        for lineup in lineups:
            players = lineup['players']
            
            # Group players by position
            position_groups = {}
            for player in players:
                pos = player['position']
                if pos not in position_groups:
                    position_groups[pos] = []
                position_groups[pos].append(player)
            
            # Build row according to DraftKings format
            row = [''] * 9
            
            # QB (position 0)
            if 'QB' in position_groups:
                qb = position_groups['QB'][0]
                row[0] = f"{qb['name']} ({qb['player_id']})"
            
            # RBs (positions 1-2)
            rbs = position_groups.get('RB', [])
            for i, rb in enumerate(rbs[:2]):  # First 2 RBs go to RB slots
                row[1 + i] = f"{rb['name']} ({rb['player_id']})"
            
            # WRs (positions 3-5)
            wrs = position_groups.get('WR', [])
            for i, wr in enumerate(wrs[:3]):  # First 3 WRs go to WR slots
                row[3 + i] = f"{wr['name']} ({wr['player_id']})"
            
            # TE (position 6)
            if 'TE' in position_groups:
                te = position_groups['TE'][0]
                row[6] = f"{te['name']} ({te['player_id']})"
            
            # FLEX (position 7) - remaining RB, WR, or TE
            flex_candidates = []
            if len(rbs) > 2:
                flex_candidates.extend(rbs[2:])
            if len(wrs) > 3:
                flex_candidates.extend(wrs[3:])
            if len(position_groups.get('TE', [])) > 1:
                flex_candidates.extend(position_groups['TE'][1:])
            
            if flex_candidates:
                flex = flex_candidates[0]
                row[7] = f"{flex['name']} ({flex['player_id']})"
            
            # DST (position 8)
            if 'DST' in position_groups:
                dst = position_groups['DST'][0]
                row[8] = f"{dst['name']} ({dst['player_id']})"
            
            writer.writerow(row)
        
        return output.getvalue()
    
    def test_error_recovery_workflow(self, full_player_pool, production_constraints, production_stacks):
        """Test error recovery and graceful degradation"""
        print("\n=== Testing Error Recovery Workflow ===")
        
        optimizer = DFSOptimizer()
        
        # Test 1: Impossible constraints
        impossible_constraints = Constraints(
            salary_cap=5000,  # Way too low
            max_from_team=1,  # Too restrictive
            min_games=10,     # Impossible
            unique_players=9
        )
        
        request = OptimizationRequest(
            slate_id="error_test_slate",
            players=full_player_pool,
            constraints=impossible_constraints,
            stacks=production_stacks,
            num_lineups=10
        )
        
        result = optimizer.optimize(request)
        
        # Should handle gracefully
        assert 'success' in result
        assert 'message' in result
        print(f"Impossible constraints handled: {result['message']}")
        
        # Test 2: All players banned
        banned_players = []
        for player in full_player_pool:
            banned_player = Player(
                id=player.id,
                name=player.name,
                position=player.position,
                team=player.team,
                salary=player.salary,
                projected_points=player.projected_points,
                ownership=player.ownership,
                banned=True
            )
            banned_players.append(banned_player)
        
        request = OptimizationRequest(
            slate_id="all_banned_test",
            players=banned_players,
            constraints=production_constraints,
            stacks=production_stacks,
            num_lineups=1
        )
        
        result = optimizer.optimize(request)
        assert 'success' in result
        print(f"All players banned handled: {result['message']}")
        
        # Test 3: Conflicting locks
        conflicting_players = full_player_pool[:5]  # Take first 5 players
        for player in conflicting_players:
            player.locked = True  # Lock all QBs (should be impossible)
        
        request = OptimizationRequest(
            slate_id="conflicting_locks_test",
            players=conflicting_players + full_player_pool[5:],
            constraints=production_constraints,
            stacks=production_stacks,
            num_lineups=1
        )
        
        result = optimizer.optimize(request)
        assert 'success' in result
        print(f"Conflicting locks handled: {result['message']}")
        
        print("Error recovery workflow completed successfully")
    
    def test_performance_benchmarks(self, full_player_pool, production_constraints, production_stacks):
        """Test performance benchmarks for the complete system"""
        print("\n=== Testing Performance Benchmarks ===")
        
        optimizer = DFSOptimizer()
        
        # Benchmark 1: 150 lineup generation
        request = OptimizationRequest(
            slate_id="performance_test_150",
            players=full_player_pool,
            constraints=production_constraints,
            stacks=production_stacks,
            num_lineups=150
        )
        
        start_time = time.time()
        result = optimizer.optimize(request)
        optimization_time = time.time() - start_time
        
        assert result['success'] is True
        assert optimization_time < 30.0, f"150 lineup optimization too slow: {optimization_time:.2f}s"
        
        print(f"150 lineup optimization: {optimization_time:.2f}s")
        
        # Benchmark 2: Monte Carlo simulation
        if len(result['lineups']) > 0:
            simulator = MonteCarloSimulator()
            
            player_dicts = []
            for player in full_player_pool:
                player_dicts.append({
                    'id': player.id,
                    'name': player.name,
                    'position': player.position,
                    'team': player.team,
                    'projected_points': player.projected_points
                })
            
            sim_request = SimulationRequest(
                slate_id="performance_test_sim",
                players=player_dicts,
                lineups=result['lineups'][:20
