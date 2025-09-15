#!/usr/bin/env python3
"""
Robust DraftKings Contest Optimizer
Handle your specific CSV format and generate optimized lineups with simulations
"""

import csv
import json
import random
from datetime import datetime

def parse_your_dk_csv():
    """Parse your specific DraftKings CSV format"""
    print("🔥 PARSING YOUR LIVE DRAFTKINGS DATA")
    print("=" * 50)
    
    contests = {}
    players = {}
    
    with open('DKEntries (1).csv', 'r') as f:
        content = f.read()
        lines = content.strip().split('\n')
        
        # Process line by line to handle mixed format
        for line in lines:
            parts = line.split(',')
            
            # Skip empty lines
            if len(parts) < 5:
                continue
            
            # Parse contest entries (lines with Entry ID)
            entry_id = parts[0].strip()
            if entry_id.isdigit():
                contest_name = parts[1].strip()
                entry_fee = parts[3].replace('$', '') if len(parts) > 3 else '0'
                
                if contest_name not in contests:
                    # Determine field size from contest name
                    field_size = 20  # Default
                    if '[150 Entry Max]' in contest_name:
                        field_size = 150
                    elif 'Millionaire' in contest_name:
                        field_size = 1000000
                    elif 'Flea Flicker' in contest_name:
                        field_size = 50000
                    
                    contests[contest_name] = {
                        'name': contest_name,
                        'field_size': field_size,
                        'entry_fee': float(entry_fee) if entry_fee.replace('.', '').isdigit() else 0,
                        'entries': 0,
                        'type': 'cash' if field_size <= 50 else 'gpp'
                    }
                contests[contest_name]['entries'] += 1
            
            # Parse player data (lines with player information)
            elif len(parts) >= 9 and parts[8].strip():  # Has Name column
                try:
                    position = parts[7].strip() if len(parts) > 7 else ''
                    name = parts[8].strip() if len(parts) > 8 else ''
                    player_id = parts[9].strip() if len(parts) > 9 else ''
                    salary = parts[11].strip() if len(parts) > 11 else '0'
                    team = parts[13].strip() if len(parts) > 13 else ''
                    avg_points = parts[14].strip() if len(parts) > 14 else '0'
                    
                    if position and name and player_id.isdigit() and salary.isdigit():
                        projection = float(avg_points) if avg_points and avg_points != '0' else 8.0
                        sal = int(salary)
                        
                        players[player_id] = {
                            'id': player_id,
                            'name': name,
                            'position': position,
                            'team': team,
                            'salary': sal,
                            'projection': projection,
                            'value': round(projection / max(sal / 1000, 0.1), 2)
                        }
                except:
                    pass
    
    print(f"✅ Found {len(contests)} contests:")
    for name, info in contests.items():
        print(f"   • {name[:40]}... ({info['entries']} entries, {info['field_size']:,} field)")
    
    print(f"✅ Found {len(players)} players with live salaries")
    
    return contests, players

def create_lineup(players, banned=None):
    """Create one optimal lineup"""
    if banned is None:
        banned = set()
    
    available = [p for p in players.values() 
                if p['id'] not in banned and p['salary'] > 0]
    available.sort(key=lambda x: x['value'], reverse=True)
    
    lineup = []
    salary = 0
    
    # Fill positions QB(1), RB(2), WR(3), TE(1), DST(1), FLEX(1)
    for pos in ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'DST']:
        for player in available:
            if (player['position'] == pos and 
                salary + player['salary'] <= 50000 and 
                player not in lineup):
                lineup.append(player)
                salary += player['salary']
                break
    
    # FLEX - best remaining RB/WR/TE
    if len(lineup) < 9:
        flex_options = [p for p in available 
                       if p['position'] in ['RB', 'WR', 'TE'] 
                       and p not in lineup 
                       and salary + p['salary'] <= 50000]
        if flex_options:
            best = max(flex_options, key=lambda x: x['value'])
            lineup.append(best)
            salary += best['salary']
    
    return lineup, salary

def simulate_lineup(lineup, field_size):
    """Run simulation on lineup"""
    scores = []
    
    for _ in range(3000):  # 3K simulations
        total = 0
        for player in lineup:
            variance = player['projection'] * 0.25
            score = max(0, random.gauss(player['projection'], variance))
            total += score
        scores.append(total)
    
    avg = sum(scores) / len(scores)
    scores.sort()
    
    floor = scores[int(len(scores) * 0.1)]
    ceiling = scores[int(len(scores) * 0.9)]
    
    # Win rate estimate
    field_avg = 140 + (field_size / 100000)  # Adjust for field size
    wins = sum(1 for s in scores if s > field_avg)
    win_rate = (wins / len(scores)) * 100
    
    roi = (win_rate / 100 * 10 - 1) * 100  # Simplified ROI
    
    return {
        'avg': round(avg, 1),
        'floor': round(floor, 1), 
        'ceiling': round(ceiling, 1),
        'win_rate': round(win_rate, 2),
        'roi': round(roi, 1),
        'boom': round(sum(1 for s in scores if s > avg * 1.2) / len(scores) * 100, 1),
        'bust': round(sum(1 for s in scores if s < avg * 0.8) / len(scores) * 100, 1)
    }

def main():
    print("🚀 ROBUST DRAFTKINGS OPTIMIZER")
    print("Using your live contest data from September 14, 2025")
    
    # Parse data
    contests, players = parse_your_dk_csv()
    
    if not contests or not players:
        print("❌ No data found")
        return
    
    # Generate optimized lineups
    print(f"\n⚡ OPTIMIZING YOUR CONTEST ENTRIES")
    print("=" * 50)
    
    all_optimized = []
    entry_counter = 1
    
    for contest_name, contest_info in contests.items():
        print(f"\n🎯 {contest_name[:40]}...")
        print(f"   Entries: {contest_info['entries']} | Field: {contest_info['field_size']:,}")
        
        for i in range(contest_info['entries']):
            # Create unique lineups
            banned = set()
            if i > 0:
                # Ban some previous players for diversity
                prev_players = [p['id'] for lineup_data in all_optimized[-2:] for p in lineup_data['lineup']]
                banned.update(random.sample(prev_players, min(3, len(prev_players))))
            
            lineup, salary = create_lineup(players, banned)
            
            if len(lineup) >= 8:
                sim = simulate_lineup(lineup, contest_info['field_size'])
                
                lineup_data = {
                    'entry_id': f'OPT_{entry_counter:06d}',
                    'contest': contest_name,
                    'lineup': lineup,
                    'salary': salary,
                    'sim': sim
                }
                all_optimized.append(lineup_data)
                entry_counter += 1
                
                print(f"     #{i+1}: ${salary:,} | {sim['avg']:.1f}pts | Win: {sim['win_rate']:.1f}% | ROI: {sim['roi']:.1f}%")
    
    # Export optimized CSV
    print(f"\n📤 EXPORTING OPTIMIZED CSV")
    print("=" * 50)
    
    with open('DKEntries_OPTIMIZED.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        
        # Headers
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        for lineup_data in all_optimized:
            lineup = lineup_data['lineup']
            sim = lineup_data['sim']
            
            # Get players by position
            qb = next((p for p in lineup if p['position'] == 'QB'), None)
            rbs = [p for p in lineup if p['position'] == 'RB']
            wrs = [p for p in lineup if p['position'] == 'WR'] 
            te = next((p for p in lineup if p['position'] == 'TE'), None)
            dst = next((p for p in lineup if p['position'] == 'DST'), None)
            
            # FLEX is remaining
            used = [qb] + rbs[:2] + wrs[:3] + [te, dst]
            flex = next((p for p in lineup if p not in used), None)
            
            row = [
                lineup_data['entry_id'],
                lineup_data['contest'],
                '181801626',  # Default contest ID
                '$3',  # Default entry fee
                f"{qb['name']} ({qb['id']})" if qb else '',
                f"{rbs[0]['name']} ({rbs[0]['id']})" if len(rbs) > 0 else '',
                f"{rbs[1]['name']} ({rbs[1]['id']})" if len(rbs) > 1 else '',
                f"{wrs[0]['name']} ({wrs[0]['id']})" if len(wrs) > 0 else '',
                f"{wrs[1]['name']} ({wrs[1]['id']})" if len(wrs) > 1 else '',
                f"{wrs[2]['name']} ({wrs[2]['id']})" if len(wrs) > 2 else '',
                f"{te['name']} ({te['id']})" if te else '',
                f"{flex['name']} ({flex['id']})" if flex else '',
                f"{dst['name']} ({dst['id']})" if dst else '',
                '',
                f"Win: {sim['win_rate']:.1f}% ROI: {sim['roi']:.1f}% Boom: {sim['boom']:.1f}% Bust: {sim['bust']:.1f}%"
            ]
            writer.writerow(row)
    
    print(f"✅ EXPORTED {len(all_optimized)} OPTIMIZED LINEUPS")
    print(f"📄 File ready: DKEntries_OPTIMIZED.csv")
    
    # Summary
    print(f"\n📊 OPTIMIZATION SUMMARY")
    print("=" * 50)
    total_win_rate = sum(l['sim']['win_rate'] for l in all_optimized) / len(all_optimized) if all_optimized else 0
    total_roi = sum(l['sim']['roi'] for l in all_optimized) / len(all_optimized) if all_optimized else 0
    
    print(f"Total Lineups: {len(all_optimized)}")
    print(f"Avg Win Rate: {total_win_rate:.2f}%")
    print(f"Avg ROI: {total_roi:.1f}%")
    print(f"Best Win Rate: {max(l['sim']['win_rate'] for l in all_optimized):.1f}%" if all_optimized else "N/A")
    
    print(f"\n🔄 READY TO IMPORT TO DRAFTKINGS!")

if __name__ == "__main__":
    main()
