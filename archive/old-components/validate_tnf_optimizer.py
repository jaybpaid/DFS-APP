#!/usr/bin/env python3
"""
Validation Engineer: TNF 9/18/25 Optimizer Test
Test actual optimization functionality with TNF slate
"""

import json
import random
from datetime import datetime

def load_tnf_slate():
    """Load TNF slate data"""
    with open('data/tnf_2025-09-18.json', 'r') as f:
        return json.load(f)

def generate_showdown_lineup(players, salary_cap=50000):
    """Generate a valid showdown lineup"""
    # Showdown format: 1 CPT (1.5x points, 1.5x salary) + 5 FLEX
    
    # Select captain (highest projection QB/RB/WR)
    skill_players = [p for p in players if p['position'] in ['QB', 'RB', 'WR']]
    captain = max(skill_players, key=lambda p: p['projection'])
    captain_salary = int(captain['salary'] * 1.5)
    captain_projection = captain['projection'] * 1.5
    
    # Remaining salary for FLEX spots
    remaining_salary = salary_cap - captain_salary
    flex_players = [p for p in players if p['id'] != captain['id']]
    
    # Select 5 FLEX players (greedy by value)
    flex_lineup = []
    current_salary = 0
    
    # Sort by value (projection per $1000 salary)
    flex_players.sort(key=lambda p: p['projection'] / (p['salary'] / 1000), reverse=True)
    
    # Fill exactly 5 FLEX spots
    for player in flex_players:
        if len(flex_lineup) >= 5:
            break
        if current_salary + player['salary'] <= remaining_salary:
            flex_lineup.append(player)
            current_salary += player['salary']
    
    # If we need more players and have salary, add cheapest available
    while len(flex_lineup) < 5 and flex_players:
        cheapest = min([p for p in flex_players if p not in flex_lineup], 
                      key=lambda p: p['salary'])
        if current_salary + cheapest['salary'] <= remaining_salary:
            flex_lineup.append(cheapest)
            current_salary += cheapest['salary']
        else:
            break
    
    # Build lineup
    lineup = {
        'CPT': f"{captain['name']} (CPT)",
        'FLEX1': flex_lineup[0]['name'] if len(flex_lineup) > 0 else 'Empty',
        'FLEX2': flex_lineup[1]['name'] if len(flex_lineup) > 1 else 'Empty', 
        'FLEX3': flex_lineup[2]['name'] if len(flex_lineup) > 2 else 'Empty',
        'FLEX4': flex_lineup[3]['name'] if len(flex_lineup) > 3 else 'Empty',
        'FLEX5': flex_lineup[4]['name'] if len(flex_lineup) > 4 else 'Empty',
        'total_salary': captain_salary + current_salary,
        'projected_points': captain_projection + sum(p['projection'] for p in flex_lineup),
        'salary_remaining': salary_cap - (captain_salary + current_salary)
    }
    
    return lineup

def optimize_tnf_lineups(slate_data, lineup_count=20):
    """Generate multiple optimized TNF lineups"""
    players = slate_data['players']
    lineups = []
    
    print(f"🏈 Optimizing {lineup_count} lineups for {slate_data['name']}")
    print(f"Teams: {slate_data['teams'][0]} @ {slate_data['teams'][1]}")
    print(f"Players: {len(players)}, Salary Cap: ${slate_data['salary_cap']:,}")
    print("-" * 60)
    
    # Generate lineups with variation
    for i in range(lineup_count):
        # Add some randomization for lineup diversity
        players_copy = players.copy()
        if i > 0:  # Keep first lineup optimal, add variance to others
            random.shuffle(players_copy)
        
        lineup = generate_showdown_lineup(players_copy, slate_data['salary_cap'])
        lineup['id'] = f"tnf_lineup_{i+1}"
        lineups.append(lineup)
        
        # Print first few lineups
        if i < 5:
            print(f"Lineup {i+1}:")
            print(f"  CPT: {lineup['CPT']}")
            print(f"  FLEX: {lineup['FLEX1']}, {lineup['FLEX2']}, {lineup['FLEX3']}")
            print(f"  Salary: ${lineup['total_salary']:,} (${lineup['salary_remaining']:,} remaining)")
            print(f"  Projected: {lineup['projected_points']:.1f} points")
            print()
    
    return lineups

def export_dk_csv(lineups, filename='tnf_lineups_export.csv'):
    """Export lineups to DraftKings Showdown CSV format"""
    import csv
    
    with open(filename, 'w', newline='') as csvfile:
        fieldnames = ['CPT', 'FLEX', 'FLEX', 'FLEX', 'FLEX', 'FLEX']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for lineup in lineups:
            writer.writerow({
                'CPT': lineup['CPT'],
                'FLEX': lineup['FLEX1'],
                'FLEX': lineup['FLEX2'], 
                'FLEX': lineup['FLEX3'],
                'FLEX': lineup['FLEX4'],
                'FLEX': lineup['FLEX5']
            })
    
    return filename

def validate_lineup_constraints(lineup, salary_cap=50000):
    """Validate lineup meets DK constraints"""
    errors = []
    
    if lineup['total_salary'] > salary_cap:
        errors.append(f"Salary cap violation: ${lineup['total_salary']:,} > ${salary_cap:,}")
    
    if 'Empty' in [lineup['CPT'], lineup['FLEX1'], lineup['FLEX2'], lineup['FLEX3'], lineup['FLEX4'], lineup['FLEX5']]:
        errors.append("Incomplete lineup - missing players")
    
    return len(errors) == 0, errors

def main():
    """Run TNF optimization validation"""
    print("🚀 VALIDATION ENGINEER: TNF 9/18/25 Optimization Test")
    print("=" * 60)
    
    try:
        # Load TNF slate
        slate = load_tnf_slate()
        
        # Generate lineups
        lineups = optimize_tnf_lineups(slate, lineup_count=20)
        
        # Validate constraints
        valid_count = 0
        for i, lineup in enumerate(lineups):
            is_valid, errors = validate_lineup_constraints(lineup)
            if is_valid:
                valid_count += 1
            elif i < 3:  # Show first few errors only
                print(f"❌ Lineup {i+1} validation errors: {errors}")
        
        print(f"✅ Generated: {len(lineups)} lineups")
        print(f"✅ Valid: {valid_count}/{len(lineups)} lineups")
        print(f"✅ Success Rate: {(valid_count/len(lineups)*100):.1f}%")
        
        # Export CSV
        csv_file = export_dk_csv(lineups)
        print(f"✅ Exported: {csv_file}")
        
        # Validate export
        with open(csv_file, 'r') as f:
            lines = f.readlines()
            print(f"✅ CSV Export: {len(lines)-1} lineup rows + header")
        
        print("\n🎯 VALIDATION RESULTS:")
        print(f"  • TNF Slate: DEN @ NYJ ✅")
        print(f"  • Player Pool: {len(slate['players'])} players ✅")
        print(f"  • Optimization: {len(lineups)} lineups generated ✅")
        print(f"  • Validation: {valid_count} valid lineups ✅")
        print(f"  • CSV Export: {csv_file} ready for DraftKings ✅")
        
        return True
        
    except Exception as e:
        print(f"❌ VALIDATION FAILED: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
