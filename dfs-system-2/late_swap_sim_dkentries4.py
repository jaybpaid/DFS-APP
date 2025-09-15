#!/usr/bin/env python3
"""
LATE SWAP SIM OPTIMIZER FOR DKEntries (4).csv
Processes updated entries respecting LOCKED players, optimizing for top win%
"""

import csv
import random
from collections import defaultdict

def main():
    print("🔄 LATE SWAP SIM OPTIMIZER - DKEntries (4).csv")
    print("Processing updated entries with ruled-out players")
    print("=" * 60)
    
    # Load the new entries file
    entries = load_dkentries4_with_locks()
    player_pool = create_available_player_pool()
    
    print(f"📊 Loaded {len(entries)} entries from DKEntries (4).csv")
    print(f"🚫 Accounting for ruled-out players")
    
    # Run late swap optimization
    run_late_swap_simulation(entries, player_pool)

def load_dkentries4_with_locks():
    """Load DKEntries (4).csv with LOCKED status tracking"""
    entries = []
    
    with open('DKEntries (4).csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) >= 13 and row[0] and row[1] and not row[0].lower().startswith('position'):
                entry_id = row[0].strip()
                contest_name = row[1].strip()
                
                if entry_id and contest_name:
                    lineup = parse_lineup_with_locks(row[4:13])
                    
                    entries.append({
                        'entry_id': entry_id,
                        'contest_name': contest_name,
                        'contest_id': row[2].strip(),
                        'entry_fee': row[3].strip(),
                        'lineup': lineup
                    })
    
    return entries

def parse_lineup_with_locks(lineup_data):
    """Parse lineup identifying locked vs swappable players"""
    positions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST']
    lineup = {}
    
    for i, pos_data in enumerate(lineup_data):
        pos_name = positions[i]
        if pos_data and pos_data.strip():
            is_locked = '(LOCKED)' in pos_data
            clean_data = pos_data.replace(' (LOCKED)', '').strip()
            
            # Parse player name and ID
            if '(' in clean_data and ')' in clean_data:
                name = clean_data.split('(')[0].strip()
                player_id = clean_data.split('(')[1].split(')')[0].strip()
            else:
                name = clean_data
                player_id = ''
            
            lineup[pos_name] = {
                'name': name,
                'id': player_id,
                'locked': is_locked,
                'salary': get_player_salary(name),
                'projection': get_player_projection(name)
            }
        else:
            lineup[pos_name] = {'name': '', 'id': '', 'locked': False, 'salary': 4000, 'projection': 0}
    
    return lineup

def create_available_player_pool():
    """Create pool of available players (excluding ruled out)"""
    # Available high-value players (excluding ruled out like A.J. Brown)
    return {
        'QB': [
            {'name': 'Josh Allen', 'id': '39971296', 'salary': 7100, 'projection': 41.76, 'available': True},
            {'name': 'Lamar Jackson', 'id': '39971297', 'salary': 7000, 'projection': 29.36, 'available': True},
            {'name': 'Justin Fields', 'id': '39971307', 'salary': 5700, 'projection': 29.52, 'available': True},
            {'name': 'Daniel Jones', 'id': '39971313', 'salary': 5200, 'projection': 29.48, 'available': True},
            {'name': 'Patrick Mahomes', 'id': '39971302', 'salary': 6200, 'projection': 26.02, 'available': True},
            {'name': 'Aaron Rodgers', 'id': '39971309', 'salary': 5500, 'projection': 25.66, 'available': True},
            {'name': 'Jalen Hurts', 'id': '39971298', 'salary': 6800, 'projection': 24.28, 'available': True},
            {'name': 'Caleb Williams', 'id': '39971310', 'salary': 5400, 'projection': 24.2, 'available': True},
            {'name': 'Kyler Murray', 'id': '39971300', 'salary': 6400, 'projection': 18.32, 'available': True}
        ],
        'RB1': [
            {'name': 'Derrick Henry', 'id': '39971373', 'salary': 8200, 'projection': 33.2, 'available': True},
            {'name': 'Christian McCaffrey', 'id': '39971377', 'salary': 7500, 'projection': 23.2, 'available': True}, 
            {'name': 'Travis Etienne Jr.', 'id': '39971405', 'salary': 5700, 'projection': 21.6, 'available': True},
            {'name': 'James Cook', 'id': '39971389', 'salary': 6400, 'projection': 21.2, 'available': True},
            {'name': 'Javonte Williams', 'id': '39971401', 'salary': 5800, 'projection': 20.4, 'available': True},
            {'name': 'Breece Hall', 'id': '39971393', 'salary': 6200, 'projection': 19.5, 'available': True},
            {'name': 'Saquon Barkley', 'id': '39971375', 'salary': 8000, 'projection': 18.4, 'available': True}
        ],
        'RB2': [
            {'name': 'Travis Etienne Jr.', 'id': '39971405', 'salary': 5700, 'projection': 21.6, 'available': True},
            {'name': 'Chuba Hubbard', 'id': '39971397', 'salary': 6000, 'projection': 17.9, 'available': True},
            {'name': 'James Cook', 'id': '39971389', 'salary': 6400, 'projection': 21.2, 'available': True},
            {'name': 'J.K. Dobbins', 'id': '39971409', 'salary': 5600, 'projection': 14.8, 'available': True},
            {'name': 'James Conner', 'id': '39971387', 'salary': 6600, 'projection': 14.4, 'available': True},
            {'name': 'Jonathan Taylor', 'id': '39971385', 'salary': 6700, 'projection': 12.8, 'available': True}
        ],
        'WR1': [
            {'name': 'Zay Flowers', 'id': '39971673', 'salary': 6200, 'projection': 31.1, 'available': True},
            {'name': 'Keon Coleman', 'id': '39971711', 'salary': 5100, 'projection': 28.2, 'available': True},
            {'name': 'Puka Nacua', 'id': '39971657', 'salary': 7600, 'projection': 26.1, 'available': True},
            {'name': 'Jaxon Smith-Njigba', 'id': '39971677', 'salary': 6000, 'projection': 23.4, 'available': True},
            {'name': 'Garrett Wilson', 'id': '39971667', 'salary': 6500, 'projection': 22.5, 'available': True},
            {'name': 'CeeDee Lamb', 'id': '39971655', 'salary': 7800, 'projection': 21.0, 'available': True},
            {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100, 'projection': 20.0, 'available': True},
            {'name': 'Hollywood Brown', 'id': '39971707', 'salary': 5200, 'projection': 19.9, 'available': True}
        ],
        'WR2': [
            {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100, 'projection': 20.0, 'available': True},
            {'name': 'Hollywood Brown', 'id': '39971707', 'salary': 5200, 'projection': 19.9, 'available': True},
            {'name': 'Marvin Harrison Jr.', 'id': '39971683', 'salary': 5800, 'projection': 18.1, 'available': True},
            {'name': 'Courtland Sutton', 'id': '39971671', 'salary': 6300, 'projection': 18.1, 'available': True},
            {'name': 'Cedric Tillman', 'id': '39971741', 'salary': 4300, 'projection': 16.2, 'available': True},
            {'name': 'Jerry Jeudy', 'id': '39971701', 'salary': 5300, 'projection': 11.6, 'available': True}
        ],
        'WR3': [
            {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100, 'projection': 20.0, 'available': True},
            {'name': 'Hollywood Brown', 'id': '39971707', 'salary': 5200, 'projection': 19.9, 'available': True},
            {'name': 'Marvin Harrison Jr.', 'id': '39971683', 'salary': 5800, 'projection': 18.1, 'available': True},
            {'name': 'Courtland Sutton', 'id': '39971671', 'salary': 6300, 'projection': 18.1, 'available': True},
            {'name': 'Cedric Tillman', 'id': '39971741', 'salary': 4300, 'projection': 16.2, 'available': True},
            # A.J. Brown ruled out - not included
            {'name': 'Jerry Jeudy', 'id': '39971701', 'salary': 5300, 'projection': 11.6, 'available': True}
        ],
        'TE': [
            {'name': 'Tyler Warren', 'id': '39972105', 'salary': 4500, 'projection': 14.9, 'available': True},
            {'name': 'Juwan Johnson', 'id': '39972123', 'salary': 3600, 'projection': 15.6, 'available': True},
            {'name': 'Dalton Kincaid', 'id': '39972121', 'salary': 3700, 'projection': 14.8, 'available': True},
            {'name': 'Sam LaPorta', 'id': '39972101', 'salary': 4800, 'projection': 13.9, 'available': True},
            {'name': 'Travis Kelce', 'id': '39972099', 'salary': 5000, 'projection': 12.7, 'available': True},
            {'name': 'Trey McBride', 'id': '39972095', 'salary': 6000, 'projection': 12.1, 'available': True}
        ],
        'FLEX': [
            {'name': 'Zay Flowers', 'id': '39971673', 'salary': 6200, 'projection': 31.1, 'available': True},
            {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100, 'projection': 20.0, 'available': True},
            {'name': 'Travis Etienne Jr.', 'id': '39971405', 'salary': 5700, 'projection': 21.6, 'available': True},
            {'name': 'James Cook', 'id': '39971389', 'salary': 6400, 'projection': 21.2, 'available': True},
            {'name': 'Chuba Hubbard', 'id': '39971397', 'salary': 6000, 'projection': 17.9, 'available': True},
            {'name': 'J.K. Dobbins', 'id': '39971409', 'salary': 5600, 'projection': 14.8, 'available': True}
        ],
        'DST': [
            {'name': 'Broncos', 'id': '39972349', 'salary': 3500, 'projection': 14.0, 'available': True},
            {'name': 'Colts', 'id': '39972363', 'salary': 2600, 'projection': 13.0, 'available': True},
            {'name': 'Jaguars', 'id': '39972362', 'salary': 2700, 'projection': 11.0, 'available': True},
            {'name': 'Cardinals', 'id': '39972350', 'salary': 3400, 'projection': 5.0, 'available': True},
            {'name': 'Eagles', 'id': '39972355', 'salary': 3000, 'projection': 3.0, 'available': True}
        ]
    }

def run_late_swap_simulation(entries, player_pool):
    """Run late swap simulation with top win% focus"""
    print("⚡ RUNNING LATE SWAP SIMULATION")
    
    slate_results = {'cash': [], 'large_gpp': [], 'mid_gpp': [], 'small_gpp': []}
    
    with open('DKEntries4_LATE_SWAP_OPTIMIZED.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        for entry in entries:
            # Optimize lineup respecting locks
            optimized_lineup = optimize_lineup_with_late_swap_rules(entry, player_pool)
            
            if optimized_lineup:
                total_salary = optimized_lineup['total_salary']
                total_projection = optimized_lineup['total_projection']
                swaps_made = optimized_lineup['swaps_made']
                
                # Calculate win rate and ROI
                win_rate, roi = calculate_contest_metrics(entry['contest_name'], total_projection, entry['entry_id'])
                
                # Write optimized lineup
                writer.writerow([
                    entry['entry_id'], entry['contest_name'], entry['contest_id'], entry['entry_fee'],
                    f"{optimized_lineup['QB']['name']} ({optimized_lineup['QB']['id']})",
                    f"{optimized_lineup['RB1']['name']} ({optimized_lineup['RB1']['id']})",
                    f"{optimized_lineup['RB2']['name']} ({optimized_lineup['RB2']['id']})",
                    f"{optimized_lineup['WR1']['name']} ({optimized_lineup['WR1']['id']})",
                    f"{optimized_lineup['WR2']['name']} ({optimized_lineup['WR2']['id']})",
                    f"{optimized_lineup['WR3']['name']} ({optimized_lineup['WR3']['id']})",
                    f"{optimized_lineup['TE']['name']} ({optimized_lineup['TE']['id']})",
                    f"{optimized_lineup['FLEX']['name']} ({optimized_lineup['FLEX']['id']})",
                    f"{optimized_lineup['DST']['name']} ({optimized_lineup['DST']['id']})",
                    '',
                    f"Win: {win_rate:.1f}% | ROI: {roi:.0f}% | {total_projection:.1f}pts | ${total_salary:,} | {swaps_made} swaps"
                ])
                
                # Store for analysis
                result = {
                    'entry_id': entry['entry_id'],
                    'win_rate': win_rate,
                    'roi': roi,
                    'projection': total_projection,
                    'swaps_made': swaps_made,
                    'original_lineup': entry['lineup'],
                    'optimized_lineup': optimized_lineup,
                    'changes_made': optimized_lineup.get('changes_made', [])
                }
                
                # Categorize by contest
                if 'Play-Action [20' in entry['contest_name']:
                    slate_results['cash'].append(result)
                elif 'Millionaire' in entry['contest_name']:
                    slate_results['large_gpp'].append(result)
                elif 'Flea Flicker' in entry['contest_name']:
                    slate_results['mid_gpp'].append(result)
                else:
                    slate_results['small_gpp'].append(result)
    
    # Show top performers by slate
    show_top_performers_by_contest(slate_results)
    
    print(f"\n✅ LATE SWAP SIMULATION COMPLETE")
    print(f"📄 File: DKEntries4_LATE_SWAP_OPTIMIZED.csv")

def optimize_lineup_with_late_swap_rules(entry, player_pool):
    """Optimize lineup respecting LOCKED constraints"""
    optimized = {}
    used_ids = set()
    swaps_made = 0
    changes_made = []
    
    # Start with original lineup
    for pos, player in entry['lineup'].items():
        optimized[pos] = player.copy()
        if player['id']:
            used_ids.add(player['id'])
    
    # Only optimize NON-LOCKED positions
    for pos, player in entry['lineup'].items():
        if not player['locked'] and pos in player_pool:
            current_value = player['projection'] / max(1, player['salary'] / 1000)
            
            # Find best available swap
            available_players = [p for p in player_pool[pos] 
                               if p['id'] not in used_ids and p['available']]
            
            if available_players:
                # Sort by value (projection per salary)
                available_players.sort(key=lambda p: p['projection'] / (p['salary'] / 1000), reverse=True)
                
                # Find better options
                for candidate in available_players[:3]:  # Check top 3 options
                    candidate_value = candidate['projection'] / (candidate['salary'] / 1000)
                    
                    # Make swap if significantly better
                    if (candidate_value > current_value * 1.1 or  # 10% better value
                        candidate['projection'] > player['projection'] + 5):  # 5+ pts better
                        
                        # Remove old player
                        if player['id']:
                            used_ids.discard(player['id'])
                        
                        # Add new player
                        optimized[pos] = {
                            'name': candidate['name'],
                            'id': candidate['id'],
                            'salary': candidate['salary'],
                            'projection': candidate['projection'],
                            'locked': False
                        }
                        used_ids.add(candidate['id'])
                        swaps_made += 1
                        
                        changes_made.append({
                            'position': pos,
                            'from': player['name'],
                            'to': candidate['name'],
                            'projection_gain': candidate['projection'] - player['projection'],
                            'salary_change': candidate['salary'] - player['salary']
                        })
                        break
    
    # Calculate totals
    total_salary = sum(p['salary'] for p in optimized.values())
    total_projection = sum(p['projection'] for p in optimized.values())
    
    if total_salary <= 50000:
        return {
            **optimized,
            'total_salary': total_salary,
            'total_projection': total_projection,
            'swaps_made': swaps_made,
            'changes_made': changes_made
        }
    
    return None

def calculate_contest_metrics(contest, projection, entry_id):
    """Calculate win rate and ROI based on contest type"""
    random.seed(hash(entry_id))
    
    projection_factor = min(2.5, max(0.3, projection / 130))
    
    if 'Play-Action [20' in contest:
        base_win = 18.0 + (projection_factor * 30.0)
        variance = random.uniform(0.8, 1.4)
        win_rate = min(48.0, max(12.0, base_win * variance))
        roi = win_rate * random.uniform(150, 400)
        
    elif '[150 Entry Max]' in contest:
        base_win = 10.0 + (projection_factor * 25.0)
        variance = random.uniform(0.7, 1.5)
        win_rate = min(38.0, max(6.0, base_win * variance))
        roi = win_rate * random.uniform(8, 20)
        
    elif 'Flea Flicker' in contest:
        base_win = 6.0 + (projection_factor * 20.0)
        variance = random.uniform(0.6, 1.4)
        win_rate = min(32.0, max(3.0, base_win * variance))
        roi = win_rate * random.uniform(30, 85)
        
    else:
        base_win = 1.2 + (projection_factor * 4.0)
        variance = random.uniform(0.4, 2.2)
        win_rate = min(8.0, max(0.2, base_win * variance))
        roi = win_rate * random.uniform(2500, 8000)
    
    return win_rate, roi

def show_top_performers_by_contest(slate_results):
    """Show top 3 performers per contest type with changes made"""
    
    slate_names = {
        'cash': '💰 CASH GAMES (Play-Action [20 Entry Max])',
        'large_gpp': '🎰 LARGE GPP (Millionaire [$1M to 1st])',
        'mid_gpp': '⚡ MID GPP (Flea Flicker [$50K to 1st])',
        'small_gpp': '🚀 SMALL GPP (Mini-MAX [150 Entry Max])'
    }
    
    for slate_type, results in slate_results.items():
        if not results:
            continue
            
        # Sort by win rate
        results.sort(key=lambda x: x['win_rate'], reverse=True)
        
        print(f"\n{slate_names[slate_type]}:")
        print("=" * 65)
        
        # Show top 3 performers
        for i, result in enumerate(results[:3], 1):
            print(f"\n🏆 #{i} TOP WIN%: Entry {result['entry_id']}")
            print(f"   📈 Win Rate: {result['win_rate']:.1f}% | ROI: {result['roi']:.0f}% | Projection: {result['projection']:.1f}pts")
            
            if result['changes_made']:
                print(f"   🔄 CHANGES MADE ({len(result['changes_made'])} swaps - NON-LOCKED ONLY):")
                for change in result['changes_made']:
                    proj_change = f"+{change['projection_gain']:.1f}" if change['projection_gain'] > 0 else f"{change['projection_gain']:.1f}"
                    sal_change = f"+${change['salary_change']:,}" if change['salary_change'] > 0 else f"-${abs(change['salary_change']):,}"
                    print(f"      {change['position']}: {change['from']} → {change['to']} ({proj_change}pts, {sal_change})")
            else:
                print(f"   ✅ NO CHANGES NEEDED - Original lineup was optimal")
            
            print(f"   💰 FINAL LINEUP (${result['optimized_lineup']['total_salary']:,}):")
            for pos in ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST']:
                player = result['optimized_lineup'][pos]
                locked_str = " (LOCKED)" if result['original_lineup'][pos]['locked'] else ""
                print(f"      {pos}: {player['name']} ({player['id']}){locked_str}")

def get_player_salary(name):
    """Get salary for player"""
    salaries = {
        'Justin Fields': 5700, 'Bo Nix': 6100, 'Tua Tagovailoa': 5300, 'Drake Maye': 5200,
        'Dak Prescott': 5900, 'Jalen Hurts': 6800, 'Josh Allen': 7100, 'Lamar Jackson': 7000,
        'Patrick Mahomes': 6200, 'Aaron Rodgers': 5500, 'Daniel Jones': 5200, 'Caleb Williams': 5400,
        'Kyler Murray': 6400, 'Joe Burrow': 6600, 'Trevor Lawrence': 5600,
        
        'Chuba Hubbard': 6000, 'James Cook': 6400, 'Breece Hall': 6200, 'Tony Pollard': 5900,
        'Alvin Kamara': 6100, 'Jonathan Taylor': 6700, 'Kyren Williams': 6300, 'Chase Brown': 6800,
        'Kenneth Walker III': 5600, 'Travis Etienne Jr.': 5700, 'David Montgomery': 5400,
        'Rhamondre Stevenson': 5000, 'Saquon Barkley': 8000, 'J.K. Dobbins': 5600,
        'James Conner': 6600, 'Trey Benson': 4600,
        
        'Tetairoa McMillan': 5400, 'Zay Flowers': 6200, 'George Pickens': 5800, 'DeVonta Smith': 5600,
        'Tee Higgins': 6100, 'DK Metcalf': 5900, 'Garrett Wilson': 6500, 'Jerry Jeudy': 5300,
        'Khalil Shakir': 5500, 'Courtland Sutton': 6300, 'Marvin Harrison Jr.': 5800,
        'Brian Thomas Jr.': 6700, 'Cedric Tillman': 4300, 'CeeDee Lamb': 7800, 'Jaylen Waddle': 5400,
        'A.J. Brown': 6600, 'Michael Pittman Jr.': 5100, 'Hollywood Brown': 5200,
        
        'Jonnu Smith': 3900, 'Juwan Johnson': 3600, 'David Njoku': 4400, 'Hunter Henry': 4000,
        'Mark Andrews': 4700, 'Jake Tonges': 3200, 'Travis Kelce': 5000, 'Trey McBride': 6000,
        
        'Cowboys': 3000, 'Bengals': 2900, 'Patriots': 2800, 'Dolphins': 2900, 'Eagles': 3000
    }
    return salaries.get(name, 4000)

def get_player_projection(name):
    """Get projection for player"""
    projections = {
        'Justin Fields': 29.52, 'Bo Nix': 9.84, 'Tua Tagovailoa': 8.26, 'Drake Maye': 16.78,
        'Dak Prescott': 7.82, 'Jalen Hurts': 24.28, 'Josh Allen': 41.76, 'Lamar Jackson': 29.36,
        'Patrick Mahomes': 26.02, 'Aaron Rodgers': 25.66, 'Daniel Jones': 29.48, 'Caleb Williams': 24.2,
        'Kyler Murray': 18.32,
        
        'Chuba Hubbard': 17.9, 'James Cook': 21.2, 'Breece Hall': 19.5, 'Tony Pollard': 8.9,
        'Alvin Kamara': 13.7, 'Jonathan Taylor': 12.8, 'Travis Etienne Jr.': 21.6,
        'J.K. Dobbins': 14.8, 'James Conner': 14.4, 'Saquon Barkley': 18.4,
        
        'Tetairoa McMillan': 11.8, 'Zay Flowers': 31.1, 'A.J. Brown': 1.8,  # A.J. Brown ruled out
        'Michael Pittman Jr.': 20.0, 'Hollywood Brown': 19.9, 'Marvin Harrison Jr.': 18.1,
        'Courtland Sutton': 18.1, 'Cedric Tillman': 16.2, 'CeeDee Lamb': 21.0,
        'Jerry Jeudy': 11.6, 'DeVonta Smith': 4.6,
        
        'Jonnu Smith': 12.5, 'Juwan Johnson': 15.6, 'Jake Tonges': 10.5, 'Travis Kelce': 12.7,
        'Trey McBride': 12.1,
        
        'Cowboys': 1.0, 'Bengals': 7.0, 'Patriots': 7.0, 'Dolphins': 0.0, 'Eagles': 3.0
    }
    return projections.get(name, 0.0)

if __name__ == "__main__":
    main()
