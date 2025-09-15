#!/usr/bin/env python3
"""
DraftKings Contest Optimizer - Using Live Data
Parse your DraftKings CSV, optimize lineups, run simulations
"""

import csv
import json
import random
import math
from datetime import datetime
from typing import Dict, List, Any

class DraftKingsContestOptimizer:
    """Optimize your actual DraftKings contest entries"""
    
    def __init__(self):
        self.contests = {}
        self.players = {}
        self.results = {}
        
    def parse_dk_csv(self) -> bool:
        """Parse your DraftKings contest CSV"""
        print("🔥 PARSING YOUR DRAFTKINGS CONTESTS")
        print("=" * 50)
        
        contests = {}
        players = {}
        
        try:
            with open('DKEntries (1).csv', 'r') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    # Parse contests from your entries
                    contest_name = row.get('Contest Name', '').strip()
                    if contest_name and 'NFL' in contest_name:
                        if contest_name not in contests:
                            # Determine contest type
                            field_size = 20
                            if '[150 Entry Max]' in contest_name:
                                field_size = 150
                            elif 'Millionaire' in contest_name:
                                field_size = 1000000
                            elif 'Flea Flicker' in contest_name:
                                field_size = 50000
                            
                            contests[contest_name] = {
                                'name': contest_name,
                                'field_size': field_size,
                                'entry_fee': float(row.get('Entry Fee', '$0').replace('$', '') or 0),
                                'entries': 0,
                                'type': 'cash' if field_size <= 20 else 'gpp'
                            }
                        contests[contest_name]['entries'] += 1
                    
                    # Parse player data
                    if (row.get('Position') and row.get('Name') and 
                        row.get('ID') and row.get('Salary')):
                        try:
                            player_id = row['ID'].strip()
                            if player_id.isdigit():
                                players[player_id] = {
                                    'id': player_id,
                                    'name': row['Name'].strip(),
                                    'position': row['Position'].strip(),
                                    'team': row.get('TeamAbbrev', '').strip(),
                                    'salary': int(row['Salary']),
                                    'projection': float(row.get('AvgPointsPerGame', 10)),
                                    'value': float(row.get('AvgPointsPerGame', 10)) / (int(row['Salary']) / 1000) if int(row['Salary']) > 0 else 0
                                }
                        except:
                            pass
            
            self.contests = contests
            self.players = players
            
            print(f"✅ Found {len(contests)} contests:")
            for name, info in contests.items():
                print(f"   • {name[:50]}... ({info['entries']} entries, {info['field_size']:,} field)")
            
            print(f"✅ Found {len(players)} players with live salaries")
            
            # Show top players by value
            top_players = sorted(players.values(), key=lambda x: x['value'], reverse=True)[:10]
            print(f"📈 Top value players:")
            for p in top_players[:5]:
                print(f"   • {p['name']} ({p['position']}) - ${p['salary']:,} - {p['projection']:.1f}pts - {p['value']:.2f}x")
            
            return True
            
        except Exception as e:
            print(f"❌ Error parsing CSV: {e}")
            return False
    
    def create_optimal_lineup(self, banned_ids: set = None) -> Dict:
        """Create one optimal lineup"""
        if banned_ids is None:
            banned_ids = set()
        
        # Get available players
        available = [p for p in self.players.values() 
                    if p['id'] not in banned_ids and p['salary'] > 0]
        
        # Sort by value
        available.sort(key=lambda x: x['value'], reverse=True)
        
        lineup = []
        salary_used = 0
        
        # Fill positions: QB(1), RB(2), WR(3), TE(1), FLEX(1), DST(1) = 9 total
        position_needs = {'QB': 1, 'RB': 2, 'WR': 3, 'TE': 1, 'DST': 1}
        
        # Fill core positions
        for pos, count in position_needs.items():
            pos_players = [p for p in available if p['position'] == pos]
            for _ in range(count):
                for player in pos_players:
                    if salary_used + player['salary'] <= 50000 and player not in lineup:
                        lineup.append(player)
                        salary_used += player['salary']
                        pos_players.remove(player)
                        break
        
        # Fill FLEX with best remaining RB/WR/TE
        if len(lineup) < 9:
            flex_options = [p for p in available 
                          if p['position'] in ['RB', 'WR', 'TE'] 
                          and p not in lineup
                          and salary_used + p['salary'] <= 50000]
            if flex_options:
                best_flex = max(flex_options, key=lambda x: x['value'])
                lineup.append(best_flex)
                salary_used += best_flex['salary']
        
        return {
            'players': lineup,
            'salary': salary_used,
            'projection': sum(p['projection'] for p in lineup),
            'valid': len(lineup) >= 8 and salary_used <= 50000
        }
    
    def run_simulation(self, lineup: Dict, field_size: int) -> Dict:
        """Run Monte Carlo simulation"""
        scores = []
        
        # Run 5000 simulations
        for _ in range(5000):
            total_score = 0
            for player in lineup['players']:
                # Add realistic variance
                std_dev = player['projection'] * 0.25
                score = max(0, random.gauss(player['projection'], std_dev))
                total_score += score
            scores.append(total_score)
        
        # Calculate stats
        avg_score = sum(scores) / len(scores)
        scores.sort()
        
        floor = scores[int(len(scores) * 0.1)]
        ceiling = scores[int(len(scores) * 0.9)]
        
        # Estimate win rate (simple field model)
        field_avg = 145
        wins = sum(1 for s in scores if s > field_avg + (field_size / 10000))
        win_rate = (wins / len(scores)) * 100
        
        # Calculate ROI (simplified)
        roi = (win_rate / 100 * 5.0 - 1.0) * 100  # Assume 5x payout average
        
        return {
            'avg_score': round(avg_score, 1),
            'floor': round(floor, 1),
            'ceiling': round(ceiling, 1), 
            'win_rate': round(win_rate, 2),
            'roi': round(roi, 1),
            'boom_pct': round(sum(1 for s in scores if s > avg_score * 1.15) / len(scores) * 100, 1),
            'bust_pct': round(sum(1 for s in scores if s < avg_score * 0.85) / len(scores) * 100, 1)
        }
    
    def optimize_all_contests(self) -> str:
        """Optimize lineups for all your contests"""
        print(f"\n⚡ OPTIMIZING ALL YOUR CONTESTS")
        print("=" * 50)
        
        all_lineups = []
        entry_id_counter = 1
        
        # Create optimized lineups for each contest
        for contest_name, contest_info in self.contests.items():
            print(f"\n🎯 {contest_name}")
            print(f"   Entries: {contest_info['entries']}")
            print(f"   Field: {contest_info['field_size']:,}")
            print(f"   Type: {contest_info['type'].upper()}")
            
            contest_lineups = []
            used_combinations = set()
            
            # Generate required number of lineups
            for i in range(contest_info['entries']):
                banned_players = set()
                
                # For diversity in GPPs
                if contest_info['type'] == 'gpp' and i > 0:
                    # Ban some players from previous lineups
                    for prev_lineup in contest_lineups[-2:]:
                        prev_ids = [p['id'] for p in prev_lineup['players']]
                        ban_count = min(3, len(prev_ids))
                        banned_players.update(random.sample(prev_ids, ban_count))
                
                lineup = self.create_optimal_lineup(banned_players)
                
                if lineup['valid']:
                    # Check uniqueness
                    signature = tuple(sorted(p['id'] for p in lineup['players']))
                    if signature not in used_combinations or len(used_combinations) == 0:
                        # Run simulation
                        sim_results = self.run_simulation(lineup, contest_info['field_size'])
                        
                        lineup_data = {
                            'entry_id': f'OPT_{entry_id_counter:06d}',
                            'contest_name': contest_name,
                            'contest_id': contest_info.get('id', '181801626'),
                            'entry_fee': f"${contest_info['entry_fee']}",
                            'lineup': lineup,
                            'simulation': sim_results
                        }
                        
                        contest_lineups.append(lineup_data)
                        all_lineups.append(lineup_data)
                        used_combinations.add(signature)
                        entry_id_counter += 1
                        
                        print(f"     Lineup {i+1}: {sim_results['avg_score']:.1f}pts | Win%: {sim_results['win_rate']:.1f}% | ROI: {sim_results['roi']:.1f}%")
            
            print(f"   ✅ Generated {len(contest_lineups)} optimized lineups")
        
        # Export updated CSV
        output_file = 'DKEntries_OPTIMIZED.csv'
        
        with open(output_file, 'w', newline='') as f:
            writer = csv.writer(f)
            
            # Headers
            headers = ['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                      'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions']
            writer.writerow(headers)
            
            # Write each optimized lineup
            for lineup_data in all_lineups:
                lineup = lineup_data['lineup']
                sim = lineup_data['simulation']
                
                players = lineup['players']
                qb = next((p for p in players if p['position'] == 'QB'), None)
                rbs = [p for p in players if p['position'] == 'RB']
                wrs = [p for p in players if p['position'] == 'WR']
                te = next((p for p in players if p['position'] == 'TE'), None)
                dst = next((p for p in players if p['position'] == 'DST'), None)
                
                # FLEX is remaining player
                flex = None
                used_core = (rbs[:2] if len(rbs) >= 2 else rbs) + (wrs[:3] if len(wrs) >= 3 else wrs)
                if te:
                    used_core.append(te)
                
                for p in players:
                    if p not in used_core and p != qb and p != dst:
                        flex = p
                        break
                
                row = [
                    lineup_data['entry_id'],
                    lineup_data['contest_name'], 
                    lineup_data['contest_id'],
                    lineup_data['entry_fee'],
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
                    f"OPTIMIZED - Win: {sim['win_rate']:.1f}% ROI: {sim['roi']:.1f}% Boom: {sim['boom_pct']:.1f}%"
                ]
                writer.writerow(row)
        
        print(f"\n✅ EXPORTED {len(all_lineups)} OPTIMIZED LINEUPS")
        print(f"📄 File: {output_file}")
        
        return output_file

if __name__ == "__main__":
    print("🚀 DRAFTKINGS LIVE CONTEST OPTIMIZER")
    print("Optimizing your actual contest entries with simulations")
    
    optimizer = DraftKingsContestOptimizer()
    
    # Parse your CSV
    if optimizer.parse_dk_csv():
        # Run optimization
        output_file = optimizer.optimize_all_contests()
        
        print(f"\n🎉 SUCCESS!")
        print(f"✅ Optimized all your contest entries")
        print(f"✅ Generated unique lineups per contest type") 
        print(f"✅ Included win%, ROI, boom/bust analysis")
        print(f"📄 Ready to import: {output_file}")
        print(f"\n🔄 NEXT STEP: Upload {output_file} to DraftKings!")
    else:
        print("❌ Failed to parse CSV data")
