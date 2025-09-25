"""
150 Lineup Proof Validation Test
Generates 150 lineups and validates DraftKings export format
"""

import json
import csv
import io
import time
from typing import Dict, List, Any

# Import optimization engine
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../apps/api-python'))

from optimization_engine import DFSOptimizer, Player, Stack, Constraints, OptimizationRequest

def create_production_player_pool() -> List[Player]:
    """Create a production-ready player pool"""
    players = []
    
    # NFL Week 3 2025 - Realistic player data
    player_data = [
        # QBs
        ("1", "Josh Allen", "QB", "BUF", 8400, 22.5, 0.28, True, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 28.5, 15.2, 1.25, 8.5, "starter", 7.2, False, "core", "", None),
        ("2", "Lamar Jackson", "QB", "BAL", 8000, 21.8, 0.25, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 26.3, 16.8, 1.15, 8.2, "starter", 6.8, False, "none", "", None),
        ("3", "Patrick Mahomes", "QB", "KC", 8200, 22.1, 0.30, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 24.7, 18.1, 0.95, 7.9, "starter", 6.5, False, "none", "", None),
        ("4", "Dak Prescott", "QB", "DAL", 7600, 20.5, 0.18, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 22.1, 19.5, 1.35, 7.6, "starter", 5.9, False, "contrarian", "", None),
        ("5", "Tua Tagovailoa", "QB", "MIA", 7200, 19.2, 0.15, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 20.8, 21.2, 1.45, 7.3, "starter", 5.5, False, "contrarian", "", None),
        
        # RBs
        ("6", "Christian McCaffrey", "RB", "SF", 9000, 18.2, 0.35, False, True, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 22.3, 18.7, 0.85, 8.8, "starter", 7.5, False, "none", "Expensive but banned", None),
        ("7", "Saquon Barkley", "RB", "NYG", 7400, 16.1, 0.24, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 25.1, 16.3, 1.05, 8.1, "starter", 6.8, False, "core", "", None),
        ("8", "Dalvin Cook", "RB", "MIN", 6800, 15.2, 0.16, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 23.7, 17.9, 0.95, 7.8, "starter", 6.2, False, "none", "", None),
        ("9", "Nick Chubb", "RB", "CLE", 7000, 16.5, 0.22, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 24.2, 16.8, 0.88, 8.0, "starter", 6.5, False, "none", "", None),
        ("10", "Derrick Henry", "RB", "TEN", 6600, 15.8, 0.20, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 26.5, 15.2, 0.75, 7.5, "starter", 5.8, False, "none", "", None),
        ("11", "Austin Ekeler", "RB", "LAC", 6400, 14.5, 0.18, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 21.8, 19.3, 1.15, 7.2, "starter", 6.0, False, "contrarian", "", None),
        ("12", "Tony Pollard", "RB", "DAL", 5800, 12.8, 0.12, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 19.5, 22.1, 1.25, 6.8, "starter", 5.5, False, "contrarian", "", None),
        ("13", "Rhamondre Stevenson", "RB", "NE", 5400, 11.9, 0.10, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 18.2, 23.5, 1.35, 6.5, "starter", 5.2, False, "contrarian", "", None),
        
        # WRs
        ("14", "Tyreek Hill", "WR", "MIA", 8200, 16.8, 0.22, False, False, 30, 60, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 32.1, 12.8, 1.55, 9.2, "starter", 8.5, False, "core", "High target share", None),
        ("15", "Stefon Diggs", "WR", "BUF", 7600, 15.3, 0.19, False, False, 0, 100, 17.5, 0, None, False, 10, "projection", [], None, [], "qb_stack", "ACTIVE", None, 29.8, 14.2, 1.15, 8.8, "starter", 8.0, False, "core", "Boosted projection", None),
        ("16", "Cooper Kupp", "WR", "LAR", 7200, 14.8, 0.18, False, False, 0, 100, None, -10, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 27.5, 15.6, 0.75, 8.5, "starter", 7.5, False, "none", "Faded 10%", None),
        ("17", "Davante Adams", "WR", "LV", 7800, 15.8, 0.21, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 28.9, 14.8, 0.95, 8.7, "starter", 7.8, False, "none", "", None),
        ("18", "DeAndre Hopkins", "WR", "ARI", 6800, 13.5, 0.16, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 25.3, 17.2, 1.05, 8.0, "starter", 7.0, False, "contrarian", "Value play", None),
        ("19", "Keenan Allen", "WR", "LAC", 6400, 12.8, 0.14, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 24.1, 18.5, 0.85, 7.8, "starter", 6.8, False, "none", "", None),
        ("20", "CeeDee Lamb", "WR", "DAL", 7000, 14.2, 0.17, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 26.7, 16.1, 1.25, 8.3, "starter", 7.3, False, "none", "", None),
        ("21", "Jaylen Waddle", "WR", "MIA", 6200, 12.1, 0.13, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 23.8, 19.7, 1.35, 7.5, "starter", 6.5, False, "contrarian", "", None),
        ("22", "Gabriel Davis", "WR", "BUF", 5600, 11.5, 0.11, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "qb_stack", "ACTIVE", None, 22.5, 21.3, 1.45, 7.2, "starter", 6.2, False, "contrarian", "", None),
        ("23", "Mike Evans", "WR", "TB", 6600, 13.2, 0.15, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 25.9, 17.8, 0.95, 7.9, "starter", 6.9, False, "none", "", None),
        ("24", "Chris Godwin", "WR", "TB", 6000, 12.5, 0.12, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 24.3, 18.9, 1.05, 7.6, "starter", 6.6, False, "contrarian", "", None),
        
        # TEs
        ("25", "Travis Kelce", "TE", "KC", 7800, 14.5, 0.31, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 28.1, 16.5, 0.95, 8.9, "starter", 8.2, False, "core", "Elite target share", None),
        ("26", "Mark Andrews", "TE", "BAL", 6400, 12.1, 0.20, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 25.7, 18.2, 0.85, 8.3, "starter", 7.5, False, "none", "", None),
        ("27", "George Kittle", "TE", "SF", 6800, 13.2, 0.18, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 26.9, 17.1, 0.75, 8.5, "starter", 7.8, False, "none", "", None),
        ("28", "Darren Waller", "TE", "LV", 6000, 11.8, 0.16, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 24.5, 19.3, 1.05, 8.0, "starter", 7.2, False, "contrarian", "", None),
        ("29", "T.J. Hockenson", "TE", "DET", 5400, 10.5, 0.12, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 22.8, 21.5, 1.15, 7.7, "starter", 6.8, False, "contrarian", "", None),
        ("30", "Dallas Goedert", "TE", "PHI", 5000, 9.8, 0.10, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 21.3, 23.1, 1.25, 7.4, "starter", 6.5, False, "contrarian", "", None),
        
        # DSTs
        ("31", "Bills DST", "DST", "BUF", 3200, 8.2, 0.15, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 18.5, 25.3, 0.55, 6.8, "starter", 5.5, False, "none", "", None),
        ("32", "Ravens DST", "DST", "BAL", 3000, 7.8, 0.12, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 17.2, 26.8, 0.45, 6.5, "starter", 5.2, False, "contrarian", "", None),
        ("33", "49ers DST", "DST", "SF", 2800, 7.5, 0.10, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 16.8, 27.5, 0.65, 6.3, "starter", 5.0, False, "contrarian", "", None),
        ("34", "Cowboys DST", "DST", "DAL", 2600, 7.2, 0.08, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 15.9, 28.2, 0.75, 6.0, "starter", 4.8, False, "contrarian", "", None),
        ("35", "Chiefs DST", "DST", "KC", 2400, 6.8, 0.06, False, False, 0, 100, None, 0, None, False, 10, "projection", [], None, [], "none", "ACTIVE", None, 14.7, 29.1, 0.85, 5.8, "starter", 4.5, False, "contrarian", "", None)
    ]
    
    # Create Player objects with all 26 controls
    for data in player_data:
        (pid, name, pos, team, salary, proj, own, locked, banned, min_exp, max_exp, custom_proj, 
         proj_boost, own_override, own_fade_boost, randomness, ceiling_floor, multi_pos, salary_override,
         groups, stack_role, injury, news, boom, bust, leverage, matchup, depth, hype, late_swap,
         priority, notes, dup_risk) = data
        
        player = Player(
            id=pid,
            name=name,
            position=pos,
            team=team,
            salary=salary,
            projected_points=proj,
            ownership=own,
            locked=locked,
            banned=banned,
            min_exposure=min_exp,
            max_exposure=max_exp,
            custom_projection=custom_proj,
            projection_boost=proj_boost,
            ownership_override=own_override,
            priority_tag=priority,
            stack_role=stack_role,
            leverage=leverage,
            boom_rate=boom,
            bust_rate=bust,
            matchup_score=matchup,
            hype_score=hype
        )
        players.append(player)
    
    return players

def create_production_constraints() -> Constraints:
    """Create production constraints"""
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

def create_production_stacks() -> List[Stack]:
    """Create production stack configurations"""
    return [
        Stack("buf_qb_stack", "QB+2", "BUF", ["QB", "WR", "TE"], enabled=True),
        Stack("bal_qb_stack", "QB+2", "BAL", ["QB", "WR", "TE"], enabled=True),
        Stack("kc_qb_stack", "QB+2", "KC", ["QB", "WR", "TE"], enabled=True),
        Stack("mia_qb_stack", "QB+2", "MIA", ["QB", "WR", "TE"], enabled=True),
        Stack("dal_qb_stack", "QB+2", "DAL", ["QB", "WR", "TE"], enabled=True)
    ]

def generate_draftkings_csv(lineups: List[Dict]) -> str:
    """Generate DraftKings-compatible CSV"""
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
        for i, rb in enumerate(rbs[:2]):
            row[1 + i] = f"{rb['name']} ({rb['player_id']})"
        
        # WRs (positions 3-5)
        wrs = position_groups.get('WR', [])
        for i, wr in enumerate(wrs[:3]):
            row[3 + i] = f"{wr['name']} ({wr['player_id']})"
        
        # TE (position 6)
        if 'TE' in position_groups:
            te = position_groups['TE'][0]
            row[6] = f"{te['name']} ({te['player_id']})"
        
        # FLEX (position 7)
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

def validate_150_lineup_proof():
    """Main validation function for 150 lineup proof"""
    print("=" * 80)
    print("150 LINEUP PROOF VALIDATION")
    print("=" * 80)
    
    # Step 1: Initialize system
    print("\n1. Initializing DFS Optimizer System...")
    optimizer = DFSOptimizer()
    players = create_production_player_pool()
    constraints = create_production_constraints()
    stacks = create_production_stacks()
    
    print(f"   ✓ Loaded {len(players)} players")
    print(f"   ✓ Applied {sum(1 for p in players if p.locked or p.banned)} player controls")
    print(f"   ✓ Configured {len(stacks)} stack types")
    
    # Step 2: Create optimization request
    print("\n2. Creating Optimization Request...")
    request = OptimizationRequest(
        slate_id="proof_validation_2025_09_17",
        players=players,
        constraints=constraints,
        stacks=stacks,
        num_lineups=150,
        variance_settings={
            'enable_randomness': True,
            'randomness_percentage': 12,
            'distribution_mode': 'normal'
        }
    )
    print("   ✓ Request configured for 150 lineups with variance")
    
    # Step 3: Run optimization
    print("\n3. Running Optimization Engine...")
    start_time = time.time()
    result = optimizer.optimize(request)
    optimization_time = time.time() - start_time
    
    if not result['success']:
        print(f"   ✗ OPTIMIZATION FAILED: {result['message']}")
        return False
    
    print(f"   ✓ Optimization completed in {optimization_time:.2f} seconds")
    print(f"   ✓ Generated {len(result['lineups'])} lineups")
    
    # Step 4: Validate lineup constraints
    print("\n4. Validating Lineup Constraints...")
    constraint_violations = 0
    
    for i, lineup in enumerate(result['lineups']):
        # Salary validation
        if lineup['total_salary'] > constraints.salary_cap:
            print(f"   ✗ Lineup {i+1}: Salary cap violation ({lineup['total_salary']})")
            constraint_violations += 1
            continue
        
        if lineup['total_salary'] < constraints.salary_cap * 0.98:
            print(f"   ✗ Lineup {i+1}: Salary underutilization ({lineup['total_salary']} < $49,000)")
            constraint_violations += 1
            continue
        
        # Position validation
        positions = [p['position'] for p in lineup['players']]
        position_counts = {pos: positions.count(pos) for pos in set(positions)}
        
        if position_counts.get('QB', 0) != 1:
            print(f"   ✗ Lineup {i+1}: Invalid QB count ({position_counts.get('QB', 0)})")
            constraint_violations += 1
            continue
        
        if not (2 <= position_counts.get('RB', 0) <= 3):
            print(f"   ✗ Lineup {i+1}: Invalid RB count ({position_counts.get('RB', 0)})")
            constraint_violations += 1
            continue
        
        if not (3 <= position_counts.get('WR', 0) <= 4):
            print(f"   ✗ Lineup {i+1}: Invalid WR count ({position_counts.get('WR', 0)})")
            constraint_violations += 1
            continue
        
        if not (1 <= position_counts.get('TE', 0) <= 2):
            print(f"   ✗ Lineup {i+1}: Invalid TE count ({position_counts.get('TE', 0)})")
            constraint_violations += 1
            continue
        
        if position_counts.get('DST', 0) != 1:
            print(f"   ✗ Lineup {i+1}: Invalid DST count ({position_counts.get('DST', 0)})")
            constraint_violations += 1
            continue
        
        # Team limit validation
        teams = [p['team'] for p in lineup['players']]
        team_counts = {}
        for team in teams:
            team_counts[team] = team_counts.get(team, 0) + 1
        
        for team, count in team_counts.items():
            if count > constraints.max_from_team:
                print(f"   ✗ Lineup {i+1}: Team limit violation for {team} ({count})")
                constraint_violations += 1
                break
    
    if constraint_violations == 0:
        print("   ✓ All lineup constraints validated successfully")
    else:
        print(f"   ✗ Found {constraint_violations} constraint violations")
        return False
    
    # Step 5: Validate player controls
    print("\n5. Validating Player Controls...")
    control_violations = 0
    
    # Check locked players
    locked_players = [p for p in players if p.locked]
    for locked_player in locked_players:
        appearances = 0
        for lineup in result['lineups']:
            if locked_player.id in [p['player_id'] for p in lineup['players']]:
                appearances += 1
        
        if appearances != len(result['lineups']):
            print(f"   ✗ Locked player {locked_player.name} not in all lineups ({appearances}/{len(result['lineups'])})")
            control_violations += 1
    
    # Check banned players
    banned_players = [p for p in players if p.banned]
    for banned_player in banned_players:
        appearances = 0
        for lineup in result['lineups']:
            if banned_player.id in [p['player_id'] for p in lineup['players']]:
                appearances += 1
        
        if appearances > 0:
            print(f"   ✗ Banned player {banned_player.name} found in lineups ({appearances})")
            control_violations += 1
    
    # Check exposure limits
    exposure_violations = 0
    for player in players:
        if player.min_exposure > 0 or player.max_exposure < 100:
            appearances = 0
            for lineup in result['lineups']:
                if player.id in [p['player_id'] for p in lineup['players']]:
                    appearances += 1
            
            exposure_pct = (appearances / len(result['lineups'])) * 100
            
            if exposure_pct < player.min_exposure:
                print(f"   ✗ {player.name} under min exposure: {exposure_pct:.1f}% < {player.min_exposure}%")
                exposure_violations += 1
            elif exposure_pct > player.max_exposure:
                print(f"   ✗ {player.name} over max exposure: {exposure_pct:.1f}% > {player.max_exposure}%")
                exposure_violations += 1
    
    if control_violations == 0 and exposure_violations == 0:
        print("   ✓ All player controls validated successfully")
    else:
        print(f"   ✗ Found {control_violations + exposure_violations} control violations")
        return False
    
    # Step 6: Validate lineup diversity
    print("\n6. Validating Lineup Diversity...")
    lineup_signatures = set()
    for lineup in result['lineups']:
        signature = tuple(sorted([p['player_id'] for p in lineup['players']]))
        lineup_signatures.add(signature)
    
    uniqueness_rate = len(lineup_signatures) / len(result['lineups'])
    
    if uniqueness_rate < 0.75:
        print(f"   ✗ Lineup uniqueness too low: {uniqueness_rate:.2%}")
        return False
    
    print(f"   ✓ Lineup uniqueness: {uniqueness_rate:.2%}")
    
    # Step 7: Generate and validate DraftKings CSV
    print("\n7. Generating DraftKings CSV Export...")
    csv_content = generate_draftkings_csv(result['lineups'])
    
    # Validate CSV format
    csv_reader = csv.reader(io.StringIO(csv_content))
    rows = list(csv_reader)
    
    # Check header
    expected_header = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST']
    if rows[0] != expected_header:
        print(f"   ✗ Invalid CSV header: {rows[0]}")
        return False
    
    # Check row count
    if len(rows) != len(result['lineups']) + 1:  # +1 for header
        print(f"   ✗ CSV row count mismatch: {len(rows)} vs {len(result['lineups']) + 1}")
        return False
    
    # Validate each lineup row
    csv_violations = 0
    for i, row in enumerate(rows[1:], 1):
        if len(row) != 9:
            print(f"   ✗ Lineup {i}: Wrong position count ({len(row)})")
            csv_violations += 1
            continue
        
        # Check for empty positions
        for j, entry in enumerate(row):
            if not entry.strip():
                print(f"   ✗ Lineup {i}: Empty position {j}")
                csv_violations += 1
            elif '(' not in entry or ')' not in entry:
                print(f"   ✗ Lineup {i}: Invalid player format at position {j}")
                csv_violations += 1
    
    if csv_violations == 0:
        print(f"   ✓ CSV export validated: {len(result['lineups'])} lineups")
        print(f"   ✓ File size: {len(csv_content)} characters")
    else:
        print(f"   ✗ Found {csv_violations} CSV format violations")
        return False
    
    # Step 8: Performance metrics
    print("\n8. Performance Metrics...")
    print(f"   ✓ Optimization time: {optimization_time:.2f} seconds")
    print(f"   ✓ Lineups per second: {len(result['lineups']) / optimization_time:.1f}")
    print(f"   ✓ Average salary utilization: {sum(l['total_salary'] for l in result['lineups']) / len(result['lineups']) / constraints.salary_cap * 100:.1f}%")
    print(f"   ✓ Average projected score: {sum(l['projected_score'] for l in result['lineups']) / len(result['lineups']):.1f}")
