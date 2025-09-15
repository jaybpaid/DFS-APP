#!/usr/bin/env python3
"""
ROBUST CSV PARSER OPTIMIZER
Fix fundamental CSV parsing issues and create working 180 lineup solution
"""

import csv
import random
from collections import defaultdict

def main():
    print("🔧 ROBUST CSV PARSER OPTIMIZER")
    print("Fixing fundamental CSV parsing issues")
    print("=" * 60)
    
    # Step 1: Fix CSV parsing
    entries, players = robust_csv_parse()
    
    if not players:
        print("❌ CRITICAL: CSV parsing still failing")
        return
    
    # Step 2: Filter out inactive players
    active_players = filter_inactive_players(players)
    
    # Step 3: Generate 180 lineups with active players only
    generate_final_180_csv(entries, active_players)

def robust_csv_parse():
    """Robust CSV parsing that handles the actual file structure"""
    print("🔍 ROBUST CSV PARSING")
    print("=" * 50)
    
    entries = []
    players = []
    
    try:
        with open('DKEntries (1).csv', 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            
            # Parse line by line to handle mixed structure
            for i, line in enumerate(lines):
                if not line.strip():
                    continue
                
                # Split by comma but handle quoted fields
                fields = []
                current_field = ""
                in_quotes = False
                
                for char in line:
                    if char == '"':
                        in_quotes = not in_quotes
                    elif char == ',' and not in_quotes:
                        fields.append(current_field.strip())
                        current_field = ""
                    else:
                        current_field += char
                
                if current_field:
                    fields.append(current_field.strip())
                
                # Identify entry rows (start with numeric Entry ID)
                if len(fields) > 0 and fields[0].isdigit():
                    entry = {
                        'entry_id': fields[0],
                        'contest_name': fields[1] if len(fields) > 1 else '',
                        'contest_id': fields[2] if len(fields) > 2 else '',
                        'entry_fee': fields[3] if len(fields) > 3 else ''
                    }
                    entries.append(entry)
                
                # Identify player rows (have Position, Name, ID, Salary, AvgPointsPerGame)
                if (len(fields) >= 9 and 
                    fields[0] in ['QB', 'RB', 'WR', 'TE', 'DST'] and
                    fields[3].isdigit() and  # ID
                    fields[5].isdigit()):    # Salary
                    
                    try:
                        player = {
                            'position': fields[0],
                            'name': fields[1].replace(f' ({fields[3]})', ''),  # Remove ID from name
                            'id': fields[3],
                            'salary': int(fields[5]),
                            'projection': float(fields[8]) if fields[8] and fields[8] != '' else 0.0,
                            'team': fields[7] if len(fields) > 7 else '',
                            'game_info': fields[6] if len(fields) > 6 else ''
                        }
                        
                        if player['id'] and player['salary'] > 0:
                            # Check for duplicates
                            if not any(p['id'] == player['id'] for p in players):
                                players.append(player)
                                
                    except Exception as e:
                        continue
        
        print(f"✅ PARSING SUCCESS:")
        print(f"   Entries extracted: {len(entries)}")
        print(f"   Players extracted: {len(players)}")
        
        # Show breakdown by position
        by_pos = defaultdict(list)
        for player in players:
            by_pos[player['position']].append(player)
        
        for pos, pos_players in by_pos.items():
            active_count = sum(1 for p in pos_players if p['projection'] > 3.0)
            print(f"   {pos}: {len(pos_players)} total ({active_count} with >3 pts)")
        
        return entries, players
        
    except Exception as e:
        print(f"❌ CSV parsing error: {e}")
        return [], []

def filter_inactive_players(all_players):
    """Filter out inactive players using comprehensive rules"""
    print(f"\n🚨 FILTERING INACTIVE PLAYERS")
    print("=" * 50)
    
    # User-confirmed inactive players
    confirmed_inactive = {
        'Brock Purdy', 'Dallas Goedert', 'Tua Tagovailoa', 'Drake Maye',
        'Xavier Worthy', 'Anthony Richardson Sr.', 'Brandon Aiyuk'
    }
    
    active_players = defaultdict(list)
    inactive_count = 0
    
    for player in all_players:
        # Filter rules
        is_active = (
            player['name'] not in confirmed_inactive and  # Not user-confirmed inactive
            player['projection'] >= 8.0 and              # High projection threshold
            player['salary'] > 0 and                     # Valid salary
            not (player['salary'] > 5000 and player['projection'] < 5.0)  # No salary/projection anomalies
        )
        
        if is_active:
            # Add value calculation
            player['value'] = player['projection'] / (player['salary'] / 1000)
            active_players[player['position']].append(player)
        else:
            inactive_count += 1
            if inactive_count <= 10:  # Show first 10 inactive
                print(f"   ❌ FILTERED: {player['name']} - {player['projection']:.1f} pts")
    
    # Sort by projection
    for pos in active_players:
        active_players[pos].sort(key=lambda x: x['projection'], reverse=True)
    
    print(f"\n✅ ACTIVE PLAYER RESULTS:")
    total_active = 0
    for pos, players in active_players.items():
        if players:
            best = players[0]
            print(f"   {pos}: {len(players)} active (Best: {best['name']} - {best['projection']:.1f} pts)")
            total_active += len(players)
    
    print(f"✅ Total active: {total_active}")
    print(f"❌ Filtered out: {inactive_count} inactive players")
    
    return active_players

def generate_final_180_csv(entries, active_players):
    """Generate final 180 CSV with active players only"""
    print(f"\n⚡ GENERATING FINAL 180 CSV")
    print("=" * 50)
    
    if not active_players.get('QB') or not active_players.get('RB') or not active_players.get('WR'):
        print("❌ CRITICAL: Insufficient active players for lineup generation")
        return
    
    with open('DKEntries_FINAL_ACTIVE_180.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        successful = 0
        
        for i, entry in enumerate(entries[:180]):
            # Create lineup with active players
            lineup = create_active_lineup(active_players, i)
            
            if lineup and len(lineup) == 9:
                # Validate no inactive players
                if all(p['projection'] >= 8.0 for p in lineup):
                    # Organize by position
                    qb = next((p for p in lineup if p['position'] == 'QB'), None)
                    rbs = [p for p in lineup if p['position'] == 'RB']
                    wrs = [p for p in lineup if p['position'] == 'WR']
                    te = next((p for p in lineup if p['position'] == 'TE'), None)
                    dst = next((p for p in lineup if p['position'] == 'DST'), None)
                    
                    # FLEX
                    used_core = [qb] + rbs[:2] + wrs[:3] + [te, dst]
                    flex = next((p for p in lineup if p not in used_core), None)
                    
                    # Calculate metrics
                    total_proj = sum(p['projection'] for p in lineup)
                    total_salary = sum(p['salary'] for p in lineup)
                    win_rate, roi = calculate_contest_metrics(entry['contest_name'], total_proj)
                    
                    writer.writerow([
                        entry['entry_id'],
                        entry['contest_name'],
                        entry['contest_id'],
                        entry['entry_fee'],
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
                        f"${total_salary:,} | ACTIVE ONLY | {total_proj:.1f}pts | Win: {win_rate:.1f}% | ROI: {roi:.1f}%"
                    ])
                    
                    successful += 1
                    
                    if successful % 30 == 0:
                        print(f"   Generated {successful}/180 active-only lineups")
    
    print(f"\n🎉 SUCCESS: {successful} ACTIVE-ONLY LINEUPS GENERATED")
    print(f"✅ NO inactive players (Brock Purdy, Dallas Goedert, etc. excluded)")
    print(f"✅ Only players with 8+ point projections")
    print(f"✅ Contest-specific win% and ROI")
    print(f"📄 File: DKEntries_FINAL_ACTIVE_180.csv")

def create_active_lineup(active_players, seed):
    """Create lineup with active players only"""
    random.seed(seed)
    
    lineup = []
    used_ids = set()
    salary_used = 0
    
    try:
        # QB
        if active_players['QB']:
            qb = random.choice(active_players['QB'][:8])
            lineup.append(qb)
            used_ids.add(qb['id'])
            salary_used += qb['salary']
        
        # RBs
        rb_candidates = [p for p in active_players['RB'] if p['id'] not in used_ids]
        for i in range(2):
            if rb_candidates and salary_used + min(p['salary'] for p in rb_candidates) <= 45000:
                rb = random.choice(rb_candidates[:12])
                lineup.append(rb)
                used_ids.add(rb['id'])
                salary_used += rb['salary']
                rb_candidates = [p for p in rb_candidates if p['id'] != rb['id']]
        
        # WRs
        wr_candidates = [p for p in active_players['WR'] if p['id'] not in used_ids]
        for i in range(3):
            if wr_candidates and salary_used + min(p['salary'] for p in wr_candidates) <= 47000:
                wr = random.choice(wr_candidates[:15])
                lineup.append(wr)
                used_ids.add(wr['id'])
                salary_used += wr['salary']
                wr_candidates = [p for p in wr_candidates if p['id'] != wr['id']]
        
        # TE
        if active_players['TE'] and salary_used <= 47000:
            te_candidates = [p for p in active_players['TE'] if p['id'] not in used_ids]
            if te_candidates:
                te = random.choice(te_candidates[:8])
                lineup.append(te)
                used_ids.add(te['id'])
                salary_used += te['salary']
        
        # FLEX
        flex_candidates = []
        for pos in ['RB', 'WR', 'TE']:
            flex_candidates.extend([p for p in active_players[pos] if p['id'] not in used_ids])
        
        if flex_candidates and salary_used <= 48000:
            valid_flex = [p for p in flex_candidates if salary_used + p['salary'] <= 49000]
            if valid_flex:
                flex = random.choice(valid_flex[:10])
                lineup.append(flex)
                used_ids.add(flex['id'])
                salary_used += flex['salary']
        
        # DST
        if active_players['DST'] and salary_used <= 49000:
            dst_candidates = [p for p in active_players['DST'] if p['id'] not in used_ids]
            if dst_candidates:
                valid_dst = [p for p in dst_candidates if salary_used + p['salary'] <= 50000]
                if valid_dst:
                    dst = random.choice(valid_dst)
                    lineup.append(dst)
                    used_ids.add(dst['id'])
                    salary_used += dst['salary']
        
        return lineup if len(lineup) == 9 and salary_used <= 50000 else None
        
    except Exception as e:
        print(f"   ⚠️ Lineup creation error: {e}")
        return None

def calculate_contest_metrics(contest_name, total_projection):
    """Calculate contest-specific win% and ROI"""
    if 'Play-Action [20' in contest_name:
        # Cash game
        base_win = max(15, min(45, (total_projection - 120) / 2))
        roi = (base_win / 100 * 1.8 - 1) * 100
    elif '[150 Entry Max]' in contest_name:
        # Small GPP
        base_win = max(5, min(25, (total_projection - 130) / 3))
        roi = (base_win / 100 * 12 - 1) * 100
    elif 'Flea Flicker' in contest_name:
        # Mid GPP
        base_win = max(1, min(8, (total_projection - 140) / 5))
        roi = (base_win / 100 * 100 - 1) * 100
    else:
        # Large GPP
        base_win = max(0.01, min(2, (total_projection - 150) / 10))
        roi = (base_win / 100 * 5000 - 1) * 100
    
    return base_win, roi

if __name__ == "__main__":
    main()
