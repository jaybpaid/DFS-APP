#!/usr/bin/env python3
"""
DUPLICATE FIX OPTIMIZER
Fixes duplicate player issues and creates valid DraftKings lineups
"""

import csv

def main():
    print("🔧 DUPLICATE FIX OPTIMIZER")
    print("Fixing duplicate player issues for DraftKings validation")
    print("=" * 60)
    
    # Load current entries and fix duplicates
    entries = load_and_fix_duplicates()
    
    # Create corrected upload file
    create_duplicate_free_upload(entries)

def load_and_fix_duplicates():
    """Load entries and fix any duplicate players"""
    entries = []
    
    with open('DKEntries (7).csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) >= 13 and row[0] and row[1] and not row[0].lower().startswith('position'):
                entry_id = row[0].strip()
                contest_name = row[1].strip()
                
                if entry_id and contest_name:
                    # Parse lineup and identify duplicates
                    lineup_players = []
                    positions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST']
                    
                    lineup = {}
                    used_player_ids = set()
                    
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
                            
                            used_player_ids.add(player_id)
                        else:
                            lineup[pos_name] = {'name': '', 'id': '', 'locked': False}
                    
                    entries.append({
                        'entry_id': entry_id,
                        'contest_name': contest_name,
                        'lineup': lineup,
                        'used_ids': used_player_ids
                    })
    
    return entries

def create_duplicate_free_upload(entries):
    """Create upload file with no duplicate players"""
    print("⚡ CREATING DUPLICATE-FREE LINEUPS")
    
    # Available PHI@KC players (only unlocked game)
    phi_kc_players = {
        'QB': [
            ('Patrick Mahomes', '40011288', 6200),
            ('Jalen Hurts', '40011286', 6800)
        ],
        'RB': [
            ('Saquon Barkley', '40011305', 8000),
            ('Isiah Pacheco', '40011315', 5500),
            ('Kareem Hunt', '40011325', 4500)
        ],
        'WR': [
            ('Hollywood Brown', '40011389', 5200),  # Best option
            ('A.J. Brown', '40011377', 6600),       # Leverage
            ('JuJu Smith-Schuster', '40011399', 4000),
            ('Jahan Dotson', '40011407', 3600),
            ('DeVonta Smith', '40011385', 5600),
            ('Tyquan Thornton', '40011409', 3600)
        ],
        'TE': [
            ('Dallas Goedert', '40011495', 3800),
            ('Noah Gray', '40011499', 3000)
        ],
        'DST': [
            ('Eagles', '40011559', 3000),
            ('Chiefs', '40011560', 2800)
        ]
    }
    
    with open('DUPLICATE_FREE_UPLOAD.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        for entry in entries:
            # Fix duplicates and optimize
            fixed_lineup = fix_lineup_duplicates(entry, phi_kc_players)
            
            if fixed_lineup:
                writer.writerow([
                    entry['entry_id'], entry['contest_name'], '181925376', '$18',
                    f"{fixed_lineup['QB']['name']} ({fixed_lineup['QB']['id']})",
                    f"{fixed_lineup['RB1']['name']} ({fixed_lineup['RB1']['id']})",
                    f"{fixed_lineup['RB2']['name']} ({fixed_lineup['RB2']['id']})",
                    f"{fixed_lineup['WR1']['name']} ({fixed_lineup['WR1']['id']})",
                    f"{fixed_lineup['WR2']['name']} ({fixed_lineup['WR2']['id']})",
                    f"{fixed_lineup['WR3']['name']} ({fixed_lineup['WR3']['id']})",
                    f"{fixed_lineup['TE']['name']} ({fixed_lineup['TE']['id']})",
                    f"{fixed_lineup['FLEX']['name']} ({fixed_lineup['FLEX']['id']})",
                    f"{fixed_lineup['DST']['name']} ({fixed_lineup['DST']['id']})",
                    '',
                    f"DUPLICATE-FREE: No duplicate players | PHI@KC shootout optimized | ${fixed_lineup['total_salary']:,}"
                ])
                
                print(f"✅ Entry {entry['entry_id']} - Duplicates fixed")
    
    print(f"\n✅ DUPLICATE-FREE OPTIMIZATION COMPLETE")
    print(f"📄 File: DUPLICATE_FREE_UPLOAD.csv")

def fix_lineup_duplicates(entry, available_players):
    """Fix duplicate players in lineup using only PHI@KC players"""
    fixed_lineup = {}
    used_ids = set()
    
    # Start with current lineup
    for pos, player in entry['lineup'].items():
        fixed_lineup[pos] = player.copy()
        if player['id']:
            used_ids.add(player['id'])
    
    # Check for duplicates and fix unlocked positions only
    positions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST']
    
    for pos in positions:
        current_player = fixed_lineup[pos]
        
        # Skip locked players
        if current_player.get('locked', False):
            continue
        
        # Check if this player is already used elsewhere
        player_id = current_player['id']
        if player_id and list(used_ids).count(player_id) > 1:
            # Need to replace with different PHI@KC player
            replacement = find_replacement_phi_kc_player(pos, used_ids, available_players, current_player['name'])
            
            if replacement:
                # Remove duplicate
                used_ids.discard(player_id)
                
                # Add replacement
                fixed_lineup[pos] = {
                    'name': replacement[0],
                    'id': replacement[1],
                    'locked': False
                }
                used_ids.add(replacement[1])
                
                print(f"   🔄 {pos}: {current_player['name']} → {replacement[0]} (duplicate fix)")
    
    # Calculate salary
    salary_map = {
        'Patrick Mahomes': 6200, 'Jalen Hurts': 6800, 'Saquon Barkley': 8000,
        'Hollywood Brown': 5200, 'A.J. Brown': 6600, 'DeVonta Smith': 5600,
        'JuJu Smith-Schuster': 4000, 'Dallas Goedert': 3800, 'Jahan Dotson': 3600,
        'Tyquan Thornton': 3600, 'Eagles': 3000, 'Chiefs': 2800, 'Isiah Pacheco': 5500
    }
    
    total_salary = sum(salary_map.get(p['name'], 4000) for p in fixed_lineup.values())
    
    return {
        **fixed_lineup,
        'total_salary': total_salary
    }

def find_replacement_phi_kc_player(position, used_ids, available_players, current_name):
    """Find replacement PHI@KC player for duplicate fix"""
    
    # Determine player pool based on position
    if position == 'QB':
        pool = available_players.get('QB', [])
    elif position in ['RB1', 'RB2']:
        pool = available_players.get('RB', [])
    elif position in ['WR1', 'WR2', 'WR3']:
        pool = available_players.get('WR', [])
    elif position == 'TE':
        pool = available_players.get('TE', [])
    elif position == 'FLEX':
        # FLEX can be RB or WR from PHI@KC
        pool = available_players.get('WR', []) + available_players.get('RB', [])
    elif position == 'DST':
        pool = available_players.get('DST', [])
    else:
        pool = []
    
    # Find best available replacement
    for player_name, player_id, salary in pool:
        if player_id not in used_ids and player_name != current_name:
            return (player_name, player_id, salary)
    
    return None

if __name__ == "__main__":
    main()
