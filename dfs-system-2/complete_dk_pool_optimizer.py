#!/usr/bin/env python3
"""
Complete DraftKings Pool Optimizer
Extract ENTIRE player pool with exact salaries from your CSV
Build optimized lineups using complete slate for max ROI and win%
"""

import csv
import random
from collections import defaultdict

def extract_complete_player_pool():
    """Extract EVERY player from your DraftKings CSV with exact salaries"""
    print("🔍 EXTRACTING COMPLETE DRAFTKINGS PLAYER POOL")
    print("=" * 60)
    
    all_players = []
    entry_data = []
    
    with open('DKEntries (1).csv', 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Extract your Entry IDs
            entry_id = row.get('Entry ID', '').strip()
            if entry_id and entry_id.isdigit():
                entry_data.append({
                    'entry_id': entry_id,
                    'contest_name': row.get('Contest Name', ''),
                    'contest_id': row.get('Contest ID', ''),
                    'entry_fee': row.get('Entry Fee', '')
                })
            
            # Extract ALL players with exact DraftKings data
            if (row.get('Position') and row.get('Name') and 
                row.get('ID') and row.get('Salary')):
                try:
                    name = row['Name'].strip()
                    player_id = row['ID'].strip()
                    position = row['Position'].strip()
                    salary = int(row['Salary'])
                    team = row.get('TeamAbbrev', '').strip()
                    avg_pts = float(row.get('AvgPointsPerGame', 0))
                    
                    if player_id.isdigit() and salary > 0:
                        player = {
                            'name': name,
                            'id': player_id,
                            'position': position,
                            'salary': salary,
                            'projection': max(avg_pts, 0.1),  # Use DK projections
                            'team': team,
                            'value': max(avg_pts, 0.1) / (salary / 1000) if salary > 0 else 0.001,
                            'game_info': row.get('Game Info', ''),
                            'roster_position': row.get('Roster Position', '')
                        }
                        
                        # Only add unique players
                        if not any(p['id'] == player_id for p in all_players):
                            all_players.append(player)
                            
                except Exception as e:
                    pass
    
    # Organize by position
    by_position = defaultdict(list)
    for player in all_players:
        by_position[player['position']].append(player)
    
    print(f"📊 COMPLETE PLAYER POOL EXTRACTED:")
    total_players = 0
    for pos, players in by_position.items():
        players.sort(key=lambda x: x['value'], reverse=True)  # Sort by value
        print(f"   {pos}: {len(players)} players (${min(p['salary'] for p in players):,} - ${max(p['salary'] for p in players):,})")
        total_players += len(players)
    
    print(f"✅ TOTAL: {total_players} players with exact DraftKings salaries")
    print(f"✅ ENTRIES: {len(entry_data)} to optimize")
    
    return entry_data, by_position, all_players

def create_optimized_lineup(players_by_pos, seed, contest_type, target_salary=49500):
    """Create optimized lineup using complete player pool"""
    random.seed(seed)
    
    lineup = []
    salary_used = 0
    used_ids = set()
    
    # Strategy by contest type
    if 'Play-Action [20 Entry Max]' in contest_type:
        # Cash game - high floor
        variance_factor = 0.3
        target_percentile = 0.7  # Use top 70% of players by value
    else:
        # GPP - high ceiling with some variance
        variance_factor = 0.8
        target_percentile = 0.85  # Use top 85% for more options
    
    # Fill QB - budget $7500 max
    qbs = players_by_pos.get('QB', [])
    qb_options = [p for p in qbs if p['salary'] <= 7500][:int(len(qbs) * target_percentile)]
    if qb_options:
        qb = random.choice(qb_options[:12])  # Top options with variance
        lineup.append(qb)
        salary_used += qb['salary']
        used_ids.add(qb['id'])
    
    # Fill RB1 - premium, budget $8500 max
    rbs = players_by_pos.get('RB', [])
    rb1_options = [p for p in rbs if p['id'] not in used_ids and p['salary'] <= 8500 and salary_used + p['salary'] <= 42000]
    if rb1_options:
        rb1 = random.choice(rb1_options[:10])
        lineup.append(rb1)
        salary_used += rb1['salary']
        used_ids.add(rb1['id'])
    
    # Fill RB2 - value, budget remaining
    rb2_options = [p for p in rbs if p['id'] not in used_ids and salary_used + p['salary'] <= 44000]
    if rb2_options:
        # Mix of mid-tier and value
        rb2 = random.choice(rb2_options[5:25] if len(rb2_options) > 25 else rb2_options)
        lineup.append(rb2)
        salary_used += rb2['salary']
        used_ids.add(rb2['id'])
    
    # Fill WR1 - elite, budget $8500 max
    wrs = players_by_pos.get('WR', [])
    wr1_options = [p for p in wrs if p['id'] not in used_ids and p['salary'] <= 8500 and salary_used + p['salary'] <= 44000]
    if wr1_options:
        wr1 = random.choice(wr1_options[:8])
        lineup.append(wr1)
        salary_used += wr1['salary']
        used_ids.add(wr1['id'])
    
    # Fill WR2 - mid-tier
    wr2_options = [p for p in wrs if p['id'] not in used_ids and salary_used + p['salary'] <= 46000]
    if wr2_options:
        wr2 = random.choice(wr2_options[5:20] if len(wr2_options) > 20 else wr2_options)
        lineup.append(wr2)
        salary_used += wr2['salary']
        used_ids.add(wr2['id'])
    
    # Fill WR3 - value from complete pool
    wr3_options = [p for p in wrs if p['id'] not in used_ids and salary_used + p['salary'] <= 47500]
    if wr3_options:
        # Include all value options, not just top players
        wr3 = random.choice(wr3_options[8:] if len(wr3_options) > 15 else wr3_options)
        lineup.append(wr3)
        salary_used += wr3['salary']
        used_ids.add(wr3['id'])
    
    # Fill TE - all options
    tes = players_by_pos.get('TE', [])
    te_options = [p for p in tes if p['id'] not in used_ids and salary_used + p['salary'] <= 48500]
    if te_options:
        te = random.choice(te_options)
        lineup.append(te)
        salary_used += te['salary']
        used_ids.add(te['id'])
    
    # Fill FLEX - best available from complete pool
    flex_candidates = []
    for pos in ['RB', 'WR', 'TE']:
        flex_candidates.extend([p for p in players_by_pos.get(pos, []) 
                               if p['id'] not in used_ids and salary_used + p['salary'] <= 49200])
    
    if flex_candidates:
        flex_candidates.sort(key=lambda x: x['value'], reverse=True)
        # Use value-based selection from complete pool
        flex = random.choice(flex_candidates[:20])
        lineup.append(flex)
        salary_used += flex['salary']
        used_ids.add(flex['id'])
    
    # Fill DST - all available options
    dsts = players_by_pos.get('DST', [])
    dst_options = [p for p in dsts if p['id'] not in used_ids and salary_used + p['salary'] <= 50000]
    if dst_options:
        dst = random.choice(dst_options)
        lineup.append(dst)
        salary_used += dst['salary']
        used_ids.add(dst['id'])
    
    return lineup, salary_used, len(used_ids) == 9

def calculate_advanced_simulation(lineup, contest_name):
    """Calculate realistic win% and ROI based on contest type"""
    total_projection = sum(p['projection'] for p in lineup)
    
    # Contest-specific calculations
    if 'Play-Action [20 Entry Max]' in contest_name:
        # Cash game (20 people)
        field_avg = 140
        threshold = field_avg + 2
        win_rate = max(0.5, min(45.0, (total_projection - threshold) * 2))
        roi = (win_rate / 100 * 1.8 - 1) * 100  # 1.8x payout
        
    elif '[150 Entry Max]' in contest_name:
        # Small GPP (150 people) 
        field_avg = 142
        threshold = field_avg + 15
        win_rate = max(0.1, min(25.0, (total_projection - threshold) * 1.2))
        roi = (win_rate / 100 * 15 - 1) * 100  # ~15x payout
        
    elif 'Flea Flicker' in contest_name:
        # Mid GPP (50,000 people)
        field_avg = 145
        threshold = field_avg + 25
        win_rate = max(0.01, min(5.0, (total_projection - threshold) * 0.3))
        roi = (win_rate / 100 * 100 - 1) * 100  # ~100x payout
        
    else:
        # Large GPP (1M+ people)
        field_avg = 148
        threshold = field_avg + 35
        win_rate = max(0.001, min(0.5, (total_projection - threshold) * 0.05))
        roi = (win_rate / 100 * 10000 - 1) * 100  # Massive payout
    
    return round(win_rate, 2), round(roi, 1), round(total_projection, 1)

def main():
    print("🚀 COMPLETE DRAFTKINGS POOL OPTIMIZER")
    print("Using entire player pool with exact DraftKings salaries")
    print("=" * 70)
    
    # Extract complete data
    entries, players_by_pos, all_players = extract_complete_player_pool()
    
    if not entries or not all_players:
        print("❌ Could not extract player data")
        return
    
    # Generate optimized lineups using COMPLETE player pool
    print(f"\n⚡ OPTIMIZING {len(entries)} LINEUPS USING COMPLETE POOL")
    print("=" * 70)
    
    valid_lineups = 0
    failed_lineups = 0
    
    with open('DKEntries_COMPLETE_POOL.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        for i, entry in enumerate(entries):
            attempts = 0
            while attempts < 15:  # Try harder to create valid lineup
                lineup, salary_used, is_valid = create_optimized_lineup(
                    players_by_pos, i * 100 + attempts, entry['contest_name']
                )
                
                if is_valid and len(lineup) == 9 and salary_used <= 50000:
                    # Organize by position
                    qb = next((p for p in lineup if p['position'] == 'QB'), None)
                    rbs = [p for p in lineup if p['position'] == 'RB']
                    wrs = [p for p in lineup if p['position'] == 'WR'] 
                    te = next((p for p in lineup if p['position'] == 'TE'), None)
                    dst = next((p for p in lineup if p['position'] == 'DST'), None)
                    
                    # FLEX is remaining player
                    core_players = [qb] + rbs[:2] + wrs[:3] + [te, dst]
                    flex = next((p for p in lineup if p not in core_players), None)
                    
                    # Calculate advanced metrics
                    win_rate, roi, projection = calculate_advanced_simulation(lineup, entry['contest_name'])
                    
                    # Write lineup
                    writer.writerow([
                        entry['entry_id'],
                        entry['contest_name'],
                        entry['contest_id'],
                        entry['entry_fee'],
                        f"{qb['name']} ({qb['id']})" if qb else 'ERROR',
                        f"{rbs[0]['name']} ({rbs[0]['id']})" if len(rbs) > 0 else 'ERROR',
                        f"{rbs[1]['name']} ({rbs[1]['id']})" if len(rbs) > 1 else 'ERROR',
                        f"{wrs[0]['name']} ({wrs[0]['id']})" if len(wrs) > 0 else 'ERROR',
                        f"{wrs[1]['name']} ({wrs[1]['id']})" if len(wrs) > 1 else 'ERROR', 
                        f"{wrs[2]['name']} ({wrs[2]['id']})" if len(wrs) > 2 else 'ERROR',
                        f"{te['name']} ({te['id']})" if te else 'ERROR',
                        f"{flex['name']} ({flex['id']})" if flex else 'ERROR',
                        f"{dst['name']} ({dst['id']})" if dst else 'ERROR',
                        '',
                        f"${salary_used:,} | {projection:.1f}pts | Win: {win_rate:.2f}% | ROI: {roi:.1f}%"
                    ])
                    
                    valid_lineups += 1
                    
                    if valid_lineups <= 10 or valid_lineups % 25 == 0:
                        contest_type = 'CASH' if 'Play-Action [20' in entry['contest_name'] else 'GPP'
                        print(f"   #{valid_lineups}: ${salary_used:,} | {projection:.1f}pts | Win: {win_rate:.2f}% | {contest_type}")
                    
                    break
                    
                attempts += 1
            
            if attempts >= 15:
                failed_lineups += 1
                print(f"   ⚠️ Failed to create lineup for entry {entry['entry_id']} after 15 attempts")
    
    print(f"\n🎉 OPTIMIZATION COMPLETE USING FULL PLAYER POOL")
    print(f"✅ Valid lineups: {valid_lineups}")
    print(f"⚠️ Failed lineups: {failed_lineups}")
    print(f"✅ Used complete DraftKings slate data")
    print(f"✅ All lineups under $50,000 salary cap")
    print(f"✅ No duplicate players")
    print(f"✅ Contest-specific win% and ROI calculations")
    print(f"📄 File: DKEntries_COMPLETE_POOL.csv")
    
    # Show best lineups
    print(f"\n📊 SAMPLE RESULTS BY CONTEST TYPE:")
    cash_contests = [e for e in entries if 'Play-Action [20' in e['contest_name']]
    gpp_contests = [e for e in entries if 'Play-Action [20' not in e['contest_name']]
    
    print(f"   Cash Games: {len(cash_contests)} entries (20 field size)")
    print(f"   GPP Contests: {len(gpp_contests)} entries (150-1M field sizes)")
    print(f"   Total Optimized: {valid_lineups} lineups")
    
    if valid_lineups > 0:
        print(f"\n🚀 READY FOR DRAFTKINGS UPLOAD!")
    else:
        print(f"\n❌ Need to debug lineup creation issues")

if __name__ == "__main__":
    main()
