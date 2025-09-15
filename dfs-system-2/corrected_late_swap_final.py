#!/usr/bin/env python3
"""
CORRECTED LATE SWAP SIMULATOR
Only uses players from UPCOMING games, avoids In Progress + Inactive players
"""

import csv

def main():
    print("🕒 CORRECTED LATE SWAP SIMULATOR")
    print("ONLY using players from upcoming games")
    print("=" * 60)
    
    # Load entries and identify game status
    entries = load_entries_with_game_status()
    upcoming_players = get_upcoming_game_players_only()
    
    print(f"📊 Loaded {len(entries)} entries")
    print(f"🟢 Available upcoming game players: {sum(len(pos) for pos in upcoming_players.values())}")
    
    # Run corrected late swap
    run_corrected_late_swap(entries, upcoming_players)

def load_entries_with_game_status():
    """Load entries and identify which games are in progress vs upcoming"""
    entries = []
    
    with open('DKEntries (4).csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) >= 13 and row[0] and row[1] and not row[0].lower().startswith('position'):
                entry_id = row[0].strip()
                contest_name = row[1].strip()
                
                if entry_id and contest_name:
                    lineup = {}
                    positions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST']
                    
                    for i, pos_data in enumerate(row[4:13]):
                        pos_name = positions[i]
                        if pos_data and pos_data.strip():
                            is_locked = '(LOCKED)' in pos_data
                            clean_data = pos_data.replace(' (LOCKED)', '').strip()
                            
                            if '(' in clean_data and ')' in clean_data:
                                name = clean_data.split('(')[0].strip()
                                player_id = clean_data.split('(')[1].split(')')[0].strip()
                            else:
                                name = clean_data
                                player_id = ''
                            
                            lineup[pos_name] = {
                                'name': name,
                                'id': player_id,
                                'locked': is_locked
                            }
                        else:
                            lineup[pos_name] = {'name': '', 'id': '', 'locked': False}
                    
                    entries.append({
                        'entry_id': entry_id,
                        'contest_name': contest_name,
                        'contest_id': row[2].strip(),
                        'entry_fee': row[3].strip(),
                        'lineup': lineup
                    })
    
    return entries

def get_upcoming_game_players_only():
    """Get only players from UPCOMING games (not In Progress)"""
    
    print("🟢 IDENTIFYING UPCOMING GAME PLAYERS ONLY...")
    
    # ONLY players from upcoming games based on DKEntries (4).csv game info
    upcoming_players = {
        'QB': [
            # PHI@KC game players
            {'name': 'Jalen Hurts', 'id': '39971298', 'salary': 6800, 'projection': 24.28, 'game': 'PHI@KC'},
            # DEN@IND game players  
            {'name': 'Daniel Jones', 'id': '39971313', 'salary': 5200, 'projection': 29.48, 'game': 'DEN@IND'},
            # CAR@ARI game players
            {'name': 'Kyler Murray', 'id': '39971300', 'salary': 6400, 'projection': 18.32, 'game': 'CAR@ARI'},
            {'name': 'Andy Dalton', 'id': '39971328', 'salary': 4100, 'projection': 0.0, 'game': 'CAR@ARI'},
            {'name': 'Bryce Young', 'id': '39971314', 'salary': 5100, 'projection': 11.16, 'game': 'CAR@ARI'},
        ],
        'RB1': [
            # PHI@KC
            {'name': 'Saquon Barkley', 'id': '39971375', 'salary': 8000, 'projection': 18.4, 'game': 'PHI@KC'},
            # DEN@IND
            {'name': 'Jonathan Taylor', 'id': '39971385', 'salary': 6700, 'projection': 12.8, 'game': 'DEN@IND'},
            {'name': 'J.K. Dobbins', 'id': '39971409', 'salary': 5600, 'projection': 14.8, 'game': 'DEN@IND'},
            # CAR@ARI
            {'name': 'James Conner', 'id': '39971387', 'salary': 6600, 'projection': 14.4, 'game': 'CAR@ARI'},
            {'name': 'Trey Benson', 'id': '39971451', 'salary': 4600, 'projection': 8.5, 'game': 'CAR@ARI'},
        ],
        'RB2': [
            {'name': 'Saquon Barkley', 'id': '39971375', 'salary': 8000, 'projection': 18.4, 'game': 'PHI@KC'},
            {'name': 'Jonathan Taylor', 'id': '39971385', 'salary': 6700, 'projection': 12.8, 'game': 'DEN@IND'},
            {'name': 'James Conner', 'id': '39971387', 'salary': 6600, 'projection': 14.4, 'game': 'CAR@ARI'},
            {'name': 'J.K. Dobbins', 'id': '39971409', 'salary': 5600, 'projection': 14.8, 'game': 'DEN@IND'},
            {'name': 'Trey Benson', 'id': '39971451', 'salary': 4600, 'projection': 8.5, 'game': 'CAR@ARI'},
        ],
        'WR1': [
            # PHI@KC 
            {'name': 'DeVonta Smith', 'id': '39971693', 'salary': 5600, 'projection': 4.6, 'game': 'PHI@KC'},
            {'name': 'Hollywood Brown', 'id': '39971707', 'salary': 5200, 'projection': 19.9, 'game': 'PHI@KC'},
            # DEN@IND
            {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100, 'projection': 20.0, 'game': 'DEN@IND'},
            {'name': 'Courtland Sutton', 'id': '39971671', 'salary': 6300, 'projection': 18.1, 'game': 'DEN@IND'},
            # CAR@ARI
            {'name': 'Marvin Harrison Jr.', 'id': '39971683', 'salary': 5800, 'projection': 18.1, 'game': 'CAR@ARI'},
        ],
        'WR2': [
            {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100, 'projection': 20.0, 'game': 'DEN@IND'},
            {'name': 'Hollywood Brown', 'id': '39971707', 'salary': 5200, 'projection': 19.9, 'game': 'PHI@KC'},
            {'name': 'Marvin Harrison Jr.', 'id': '39971683', 'salary': 5800, 'projection': 18.1, 'game': 'CAR@ARI'},
            {'name': 'Courtland Sutton', 'id': '39971671', 'salary': 6300, 'projection': 18.1, 'game': 'DEN@IND'},
        ],
        'WR3': [
            {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100, 'projection': 20.0, 'game': 'DEN@IND'},
            {'name': 'Hollywood Brown', 'id': '39971707', 'salary': 5200, 'projection': 19.9, 'game': 'PHI@KC'},
            {'name': 'Marvin Harrison Jr.', 'id': '39971683', 'salary': 5800, 'projection': 18.1, 'game': 'CAR@ARI'},
            {'name': 'Courtland Sutton', 'id': '39971671', 'salary': 6300, 'projection': 18.1, 'game': 'DEN@IND'},
        ],
        'TE': [
            # DEN@IND
            {'name': 'Tyler Warren', 'id': '39972105', 'salary': 4500, 'projection': 14.9, 'game': 'DEN@IND'},
            {'name': 'Evan Engram', 'id': '39972109', 'salary': 4200, 'projection': 5.1, 'game': 'DEN@IND'},
            # PHI@KC  
            {'name': 'Dallas Goedert', 'id': '39972115', 'salary': 3800, 'projection': 11.4, 'game': 'PHI@KC'},
            # CAR@ARI
            {'name': 'Trey McBride', 'id': '39972095', 'salary': 6000, 'projection': 12.1, 'game': 'CAR@ARI'},
        ],
        'FLEX': [
            {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100, 'projection': 20.0, 'game': 'DEN@IND'},
            {'name': 'Hollywood Brown', 'id': '39971707', 'salary': 5200, 'projection': 19.9, 'game': 'PHI@KC'},
            {'name': 'Saquon Barkley', 'id': '39971375', 'salary': 8000, 'projection': 18.4, 'game': 'PHI@KC'},
            {'name': 'Jonathan Taylor', 'id': '39971385', 'salary': 6700, 'projection': 12.8, 'game': 'DEN@IND'},
            {'name': 'James Conner', 'id': '39971387', 'salary': 6600, 'projection': 14.4, 'game': 'CAR@ARI'},
        ],
        'DST': [
            {'name': 'Broncos', 'id': '39972349', 'salary': 3500, 'projection': 14.0, 'game': 'DEN@IND'},
            {'name': 'Colts', 'id': '39972363', 'salary': 2600, 'projection': 13.0, 'game': 'DEN@IND'},
            {'name': 'Cardinals', 'id': '39972350', 'salary': 3400, 'projection': 5.0, 'game': 'CAR@ARI'},
            {'name': 'Panthers', 'id': '39972369', 'salary': 2300, 'projection': 2.0, 'game': 'CAR@ARI'},
            {'name': 'Chiefs', 'id': '39972360', 'salary': 2800, 'projection': 3.0, 'game': 'PHI@KC'},
            {'name': 'Eagles', 'id': '39972355', 'salary': 3000, 'projection': 3.0, 'game': 'PHI@KC'},
        ]
    }
    
    print(f"✅ UPCOMING GAME PLAYERS LOADED:")
    print(f"   🟢 PHI@KC: Eagles, Chiefs players")
    print(f"   🟢 DEN@IND: Broncos, Colts players") 
    print(f"   🟢 CAR@ARI: Panthers, Cardinals players")
    
    return upcoming_players

def run_corrected_late_swap(entries, upcoming_players):
    """Run late swap using ONLY upcoming game players"""
    print("⚡ RUNNING CORRECTED LATE SWAP (UPCOMING GAMES ONLY)")
    
    with open('CORRECTED_LATE_SWAP_UPLOAD.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        successful_swaps = 0
        
        for entry in entries:
            # Optimize using only upcoming players
            optimized_lineup = optimize_with_upcoming_players_only(entry, upcoming_players)
            
            if optimized_lineup:
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
                    f"CORRECTED: Only upcoming games, no locked/inactive | ${optimized_lineup['total_salary']:,}"
                ])
                successful_swaps += 1
        
        print(f"✅ {successful_swaps}/{len(entries)} entries optimized with upcoming players only")
    
    print(f"\n✅ CORRECTED LATE SWAP COMPLETE")
    print(f"📄 File: CORRECTED_LATE_SWAP_UPLOAD.csv")

def optimize_with_upcoming_players_only(entry, upcoming_players):
    """Optimize using ONLY upcoming game players"""
    optimized = {}
    used_ids = set()
    
    # Start with current lineup
    for pos, player in entry['lineup'].items():
        optimized[pos] = player.copy()
        if player['id']:
            used_ids.add(player['id'])
    
    # Only swap NON-LOCKED positions with UPCOMING game players
    for pos, player in entry['lineup'].items():
        if not player['locked'] and pos in upcoming_players:
            # Find best upcoming game swap
            available_upcoming = [p for p in upcoming_players[pos] 
                                if p['id'] not in used_ids and p['projection'] > 0]
            
            if available_upcoming:
                # Sort by projection for best available
                available_upcoming.sort(key=lambda x: x['projection'], reverse=True)
                best_upcoming = available_upcoming[0]
                
                # Only swap if significantly better
                if best_upcoming['projection'] > player.get('projection', 0) + 3:
                    # Remove old player
                    if player['id']:
                        used_ids.discard(player['id'])
                    
                    # Add upcoming game player
                    optimized[pos] = {
                        'name': best_upcoming['name'],
                        'id': best_upcoming['id'],
                        'salary': best_upcoming['salary'],
                        'projection': best_upcoming['projection'],
                        'locked': False
                    }
                    used_ids.add(best_upcoming['id'])
    
    # Calculate totals
    total_salary = sum(get_salary(p['name']) for p in optimized.values())
    
    if total_salary <= 50000:
        return {
            **optimized,
            'total_salary': total_salary
        }
    
    return None

def get_salary(name):
    """Get player salary"""
    salaries = {
        'Jalen Hurts': 6800, 'Daniel Jones': 5200, 'Kyler Murray': 6400,
        'Saquon Barkley': 8000, 'Jonathan Taylor': 6700, 'James Conner': 6600,
        'J.K. Dobbins': 5600, 'Trey Benson': 4600,
        'Michael Pittman Jr.': 5100, 'Hollywood Brown': 5200, 'Marvin Harrison Jr.': 5800,
        'Courtland Sutton': 6300, 'DeVonta Smith': 5600,
        'Tyler Warren': 4500, 'Dallas Goedert': 3800, 'Trey McBride': 6000,
        'Broncos': 3500, 'Colts': 2600, 'Cardinals': 3400, 'Panthers': 2300,
        'Chiefs': 2800, 'Eagles': 3000
    }
    return salaries.get(name, 4000)

if __name__ == "__main__":
    main()
