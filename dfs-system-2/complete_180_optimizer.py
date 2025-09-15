#!/usr/bin/env python3
"""
Complete 180 Lineup Optimizer
Generate all 180 optimized lineups with simulations for DraftKings contests
"""

import csv
import random
from datetime import datetime

def count_all_entries():
    """Count total entries from your CSV"""
    print("🔍 COUNTING ALL CONTEST ENTRIES")
    print("=" * 50)
    
    total_entries = 0
    contest_breakdown = {}
    
    with open('DKEntries (1).csv', 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            entry_id = row.get('Entry ID', '').strip()
            contest_name = row.get('Contest Name', '').strip()
            
            # Skip header rows and instructions
            if entry_id and entry_id.isdigit():
                if contest_name not in contest_breakdown:
                    contest_breakdown[contest_name] = 0
                contest_breakdown[contest_name] += 1
                total_entries += 1
    
    print(f"📊 FOUND {total_entries} TOTAL ENTRIES:")
    for contest, count in contest_breakdown.items():
        print(f"   • {contest}: {count} entries")
    
    return total_entries, contest_breakdown

def get_live_players():
    """Get complete live player pool from your September 14, 2025 data"""
    players = {
        # QBs
        '39971296': {'name': 'Josh Allen', 'pos': 'QB', 'sal': 7100, 'proj': 24.5, 'id': '39971296'},
        '39971297': {'name': 'Lamar Jackson', 'pos': 'QB', 'sal': 7000, 'proj': 23.8, 'id': '39971297'},
        '39971298': {'name': 'Jalen Hurts', 'pos': 'QB', 'sal': 6800, 'proj': 22.1, 'id': '39971298'},
        '39971299': {'name': 'Joe Burrow', 'pos': 'QB', 'sal': 6600, 'proj': 21.5, 'id': '39971299'},
        '39971300': {'name': 'Kyler Murray', 'pos': 'QB', 'sal': 6400, 'proj': 20.8, 'id': '39971300'},
        '39971301': {'name': 'Brock Purdy', 'pos': 'QB', 'sal': 6300, 'proj': 20.2, 'id': '39971301'},
        '39971302': {'name': 'Patrick Mahomes', 'pos': 'QB', 'sal': 6200, 'proj': 19.8, 'id': '39971302'},
        '39971303': {'name': 'Bo Nix', 'pos': 'QB', 'sal': 6100, 'proj': 18.2, 'id': '39971303'},
        '39971304': {'name': 'Jared Goff', 'pos': 'QB', 'sal': 6000, 'proj': 17.9, 'id': '39971304'},
        '39971307': {'name': 'Justin Fields', 'pos': 'QB', 'sal': 5700, 'proj': 18.5, 'id': '39971307'},
        
        # RBs
        '39971373': {'name': 'Derrick Henry', 'pos': 'RB', 'sal': 8200, 'proj': 22.1, 'id': '39971373'},
        '39971375': {'name': 'Saquon Barkley', 'pos': 'RB', 'sal': 8000, 'proj': 21.5, 'id': '39971375'},
        '39971377': {'name': 'Christian McCaffrey', 'pos': 'RB', 'sal': 7500, 'proj': 20.8, 'id': '39971377'},
        '39971379': {'name': 'Jahmyr Gibbs', 'pos': 'RB', 'sal': 7400, 'proj': 19.9, 'id': '39971379'},
        '39971381': {'name': "De'Von Achane", 'pos': 'RB', 'sal': 6900, 'proj': 18.2, 'id': '39971381'},
        '39971383': {'name': 'Chase Brown', 'pos': 'RB', 'sal': 6800, 'proj': 17.8, 'id': '39971383'},
        '39971385': {'name': 'Jonathan Taylor', 'pos': 'RB', 'sal': 6700, 'proj': 17.4, 'id': '39971385'},
        '39971387': {'name': 'James Conner', 'pos': 'RB', 'sal': 6600, 'proj': 17.1, 'id': '39971387'},
        '39971389': {'name': 'James Cook', 'pos': 'RB', 'sal': 6400, 'proj': 16.8, 'id': '39971389'},
        '39971391': {'name': 'Kyren Williams', 'pos': 'RB', 'sal': 6300, 'proj': 16.5, 'id': '39971391'},
        '39971393': {'name': 'Breece Hall', 'pos': 'RB', 'sal': 6200, 'proj': 16.2, 'id': '39971393'},
        '39971395': {'name': 'Alvin Kamara', 'pos': 'RB', 'sal': 6100, 'proj': 15.9, 'id': '39971395'},
        '39971397': {'name': 'Chuba Hubbard', 'pos': 'RB', 'sal': 6000, 'proj': 15.6, 'id': '39971397'},
        '39971399': {'name': 'Tony Pollard', 'pos': 'RB', 'sal': 5900, 'proj': 15.2, 'id': '39971399'},
        '39971401': {'name': 'Javonte Williams', 'pos': 'RB', 'sal': 5800, 'proj': 14.8, 'id': '39971401'},
        '39971403': {'name': "D'Andre Swift", 'pos': 'RB', 'sal': 5700, 'proj': 14.4, 'id': '39971403'},
        '39971405': {'name': 'Travis Etienne Jr.', 'pos': 'RB', 'sal': 5700, 'proj': 14.1, 'id': '39971405'},
        '39971407': {'name': 'Kenneth Walker III', 'pos': 'RB', 'sal': 5600, 'proj': 13.8, 'id': '39971407'},
        
        # WRs
        '39971653': {'name': "Ja'Marr Chase", 'pos': 'WR', 'sal': 8100, 'proj': 21.2, 'id': '39971653'},
        '39971655': {'name': 'CeeDee Lamb', 'pos': 'WR', 'sal': 7800, 'proj': 20.5, 'id': '39971655'},
        '39971657': {'name': 'Puka Nacua', 'pos': 'WR', 'sal': 7600, 'proj': 19.8, 'id': '39971657'},
        '39971659': {'name': 'Malik Nabers', 'pos': 'WR', 'sal': 7100, 'proj': 18.2, 'id': '39971659'},
        '39971661': {'name': 'Amon-Ra St. Brown', 'pos': 'WR', 'sal': 7000, 'proj': 17.8, 'id': '39971661'},
        '39971663': {'name': 'Brian Thomas Jr.', 'pos': 'WR', 'sal': 6700, 'proj': 17.1, 'id': '39971663'},
        '39971665': {'name': 'A.J. Brown', 'pos': 'WR', 'sal': 6600, 'proj': 16.8, 'id': '39971665'},
        '39971667': {'name': 'Garrett Wilson', 'pos': 'WR', 'sal': 6500, 'proj': 16.5, 'id': '39971667'},
        '39971669': {'name': 'Tyreek Hill', 'pos': 'WR', 'sal': 6400, 'proj': 16.2, 'id': '39971669'},
        '39971671': {'name': 'Courtland Sutton', 'pos': 'WR', 'sal': 6300, 'proj': 15.9, 'id': '39971671'},
        '39971673': {'name': 'Zay Flowers', 'pos': 'WR', 'sal': 6200, 'proj': 15.6, 'id': '39971673'},
        '39971675': {'name': 'Tee Higgins', 'pos': 'WR', 'sal': 6100, 'proj': 15.3, 'id': '39971675'},
        '39971677': {'name': 'Jaxon Smith-Njigba', 'pos': 'WR', 'sal': 6000, 'proj': 15.0, 'id': '39971677'},
        '39971679': {'name': 'DK Metcalf', 'pos': 'WR', 'sal': 5900, 'proj': 14.7, 'id': '39971679'},
        '39971681': {'name': 'Davante Adams', 'pos': 'WR', 'sal': 5900, 'proj': 14.4, 'id': '39971681'},
        '39971683': {'name': 'Marvin Harrison Jr.', 'pos': 'WR', 'sal': 5800, 'proj': 14.1, 'id': '39971683'},
        '39971685': {'name': 'George Pickens', 'pos': 'WR', 'sal': 5800, 'proj': 13.8, 'id': '39971685'},
        '39971687': {'name': 'Jameson Williams', 'pos': 'WR', 'sal': 5700, 'proj': 13.5, 'id': '39971687'},
        '39971689': {'name': 'Xavier Worthy', 'pos': 'WR', 'sal': 5700, 'proj': 13.2, 'id': '39971689'},
        '39971691': {'name': 'DJ Moore', 'pos': 'WR', 'sal': 5600, 'proj': 12.9, 'id': '39971691'},
        '39971693': {'name': 'DeVonta Smith', 'pos': 'WR', 'sal': 5600, 'proj': 12.6, 'id': '39971693'},
        '39971695': {'name': 'Khalil Shakir', 'pos': 'WR', 'sal': 5500, 'proj': 12.3, 'id': '39971695'},
        '39971697': {'name': 'Jaylen Waddle', 'pos': 'WR', 'sal': 5400, 'proj': 12.0, 'id': '39971697'},
        '39971699': {'name': 'Tetairoa McMillan', 'pos': 'WR', 'sal': 5400, 'proj': 14.1, 'id': '39971699'},
        '39971701': {'name': 'Jerry Jeudy', 'pos': 'WR', 'sal': 5300, 'proj': 11.4, 'id': '39971701'},
        '39971741': {'name': 'Cedric Tillman', 'pos': 'WR', 'sal': 4300, 'proj': 12.8, 'id': '39971741'},
        
        # TEs
        '39972095': {'name': 'Trey McBride', 'pos': 'TE', 'sal': 6000, 'proj': 14.5, 'id': '39972095'},
        '39972097': {'name': 'George Kittle', 'pos': 'TE', 'sal': 5500, 'proj': 13.2, 'id': '39972097'},
        '39972099': {'name': 'Travis Kelce', 'pos': 'TE', 'sal': 5000, 'proj': 12.8, 'id': '39972099'},
        '39972101': {'name': 'Sam LaPorta', 'pos': 'TE', 'sal': 4800, 'proj': 12.1, 'id': '39972101'},
        '39972103': {'name': 'Mark Andrews', 'pos': 'TE', 'sal': 4700, 'proj': 11.8, 'id': '39972103'},
        '39972113': {'name': 'Jonnu Smith', 'pos': 'TE', 'sal': 3900, 'proj': 10.2, 'id': '39972113'},
        '39972115': {'name': 'Dallas Goedert', 'pos': 'TE', 'sal': 3800, 'proj': 9.9, 'id': '39972115'},
        '39972117': {'name': 'Jake Ferguson', 'pos': 'TE', 'sal': 3800, 'proj': 9.6, 'id': '39972117'},
        
        # DSTs
        '39972347': {'name': 'Ravens', 'pos': 'DST', 'sal': 3700, 'proj': 9.2, 'id': '39972347'},
        '39972348': {'name': '49ers', 'pos': 'DST', 'sal': 3600, 'proj': 8.8, 'id': '39972348'},
        '39972349': {'name': 'Broncos', 'pos': 'DST', 'sal': 3500, 'proj': 8.4, 'id': '39972349'},
        '39972356': {'name': 'Cowboys', 'pos': 'DST', 'sal': 3000, 'proj': 7.2, 'id': '39972356'},
        '39972357': {'name': 'Bengals', 'pos': 'DST', 'sal': 2900, 'proj': 6.2, 'id': '39972357'},
        '39972358': {'name': 'Dolphins', 'pos': 'DST', 'sal': 2900, 'proj': 5.8, 'id': '39972358'}
    }
    
    return players

def create_unique_lineup(players, lineup_num):
    """Create one unique lineup"""
    # Add seed based on lineup number for reproducible diversity
    random.seed(lineup_num)
    
    available = list(players.values())
    lineup = []
    salary = 0
    
    # Randomize selection pools based on lineup number
    qb_pool = [p for p in available if p['pos'] == 'QB']
    rb_pool = [p for p in available if p['pos'] == 'RB']
    wr_pool = [p for p in available if p['pos'] == 'WR']
    te_pool = [p for p in available if p['pos'] == 'TE']
    dst_pool = [p for p in available if p['pos'] == 'DST']
    
    # Sort by value with randomization
    for pool in [qb_pool, rb_pool, wr_pool, te_pool, dst_pool]:
        for p in pool:
            p['rand_value'] = (p['proj'] / (p['sal'] / 1000)) + random.uniform(-0.5, 1.0)
        pool.sort(key=lambda x: x['rand_value'], reverse=True)
    
    # Fill QB
    qb = random.choice(qb_pool[:min(5, len(qb_pool))])
    lineup.append(qb)
    salary += qb['sal']
    
    # Fill RBs
    for _ in range(2):
        valid_rbs = [rb for rb in rb_pool if rb not in lineup and salary + rb['sal'] <= 42000]
        if valid_rbs:
            rb = random.choice(valid_rbs[:min(8, len(valid_rbs))])
            lineup.append(rb)
            salary += rb['sal']
    
    # Fill WRs
    for _ in range(3):
        valid_wrs = [wr for wr in wr_pool if wr not in lineup and salary + wr['sal'] <= 46000]
        if valid_wrs:
            wr = random.choice(valid_wrs[:min(12, len(valid_wrs))])
            lineup.append(wr)
            salary += wr['sal']
    
    # Fill TE
    valid_tes = [te for te in te_pool if te not in lineup and salary + te['sal'] <= 48000]
    if valid_tes:
        te = random.choice(valid_tes[:min(6, len(valid_tes))])
        lineup.append(te)
        salary += te['sal']
    
    # Fill FLEX
    flex_pool = [p for p in rb_pool + wr_pool + te_pool if p not in lineup and salary + p['sal'] <= 49000]
    if flex_pool:
        flex = random.choice(flex_pool[:min(10, len(flex_pool))])
        lineup.append(flex)
        salary += flex['sal']
    
    # Fill DST
    valid_dsts = [dst for dst in dst_pool if dst not in lineup and salary + dst['sal'] <= 50000]
    if valid_dsts:
        dst = random.choice(valid_dsts)
        lineup.append(dst)
        salary += dst['sal']
    
    return lineup, salary

def simulate_lineup(lineup, field_size):
    """Simulate lineup performance"""
    scores = []
    
    for _ in range(3000):
        total = 0
        for player in lineup:
            variance = player['proj'] * 0.3
            score = max(0, random.gauss(player['proj'], variance))
            total += score
        scores.append(total)
    
    avg = sum(scores) / len(scores)
    scores.sort()
    
    floor = scores[int(len(scores) * 0.1)]
    ceiling = scores[int(len(scores) * 0.9)]
    
    # Win rate based on field size
    thresholds = {
        20: 145,      # Cash games
        150: 155,     # Small GPP
        50000: 165,   # Mid GPP
        1000000: 175  # Large GPP
    }
    
    threshold = thresholds.get(field_size, 160)
    wins = sum(1 for s in scores if s > threshold)
    win_rate = (wins / len(scores)) * 100
    
    roi = (win_rate / 100 * (field_size / 1000) - 1) * 100
    
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
    print("🚀 COMPLETE 180 LINEUP OPTIMIZER")
    print("September 14, 2025 - Live DraftKings Data")
    print("=" * 70)
    
    # Count entries
    total_entries, contest_breakdown = count_all_entries()
    
    # Get player pool
    players = get_live_players()
    
    # Contest field sizes
    field_sizes = {
        'NFL $888K Play-Action [20 Entry Max]': 20,
        'NFL $3.5M Fantasy Football Millionaire [$1M to 1st]': 1000000,
        'NFL $300K Flea Flicker [$50K to 1st]': 50000,
        'NFL $150K mini-MAX [150 Entry Max]': 150
    }
    
    print(f"\n⚡ GENERATING {total_entries} OPTIMIZED LINEUPS")
    print("=" * 70)
    
    # Generate all lineups
    all_lineups = []
    
    current_entry = 1
    for contest_name, entry_count in contest_breakdown.items():
        field_size = field_sizes.get(contest_name, 100000)
        print(f"\n🎯 {contest_name}")
        print(f"   {entry_count} entries | Field: {field_size:,}")
        
        for i in range(entry_count):
            # Generate unique lineup
            lineup, salary = create_unique_lineup(players, current_entry)
            
            # Simulate performance
            sim = simulate_lineup(lineup, field_size)
            
            lineup_data = {
                'entry_id': f'OPT_{current_entry:06d}',
                'contest': contest_name,
                'lineup': lineup,
                'salary': salary,
                'sim': sim
            }
            all_lineups.append(lineup_data)
            
            if i < 3 or current_entry % 20 == 0:
                print(f"   #{current_entry}: {sim['avg']:.1f}pts | Win: {sim['win_rate']:.1f}% | ROI: {sim['roi']:.1f}%")
            
            current_entry += 1
    
    # Export complete CSV
    print(f"\n📤 EXPORTING ALL {len(all_lineups)} LINEUPS")
    print("=" * 70)
    
    with open('DKEntries_COMPLETE_180.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        for lineup_data in all_lineups:
            lineup = lineup_data['lineup']
            sim = lineup_data['sim']
            
            # Extract by position
            qb = next((p for p in lineup if p['pos'] == 'QB'), None)
            rbs = [p for p in lineup if p['pos'] == 'RB']
            wrs = [p for p in lineup if p['pos'] == 'WR']
            te = next((p for p in lineup if p['pos'] == 'TE'), None)
            dst = next((p for p in lineup if p['pos'] == 'DST'), None)
            
            # FLEX is remaining
            used = [qb] + rbs[:2] + wrs[:3] + [te, dst]
            flex = next((p for p in lineup if p not in used), None)
            
            row = [
                lineup_data['entry_id'],
                lineup_data['contest'],
                '181801626',
                '$3',
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
                f"WIN: {sim['win_rate']:.1f}% | ROI: {sim['roi']:.1f}% | BOOM: {sim['boom']:.1f}%"
            ]
            writer.writerow(row)
    
    print(f"✅ SUCCESS: EXPORTED {len(all_lineups)} COMPLETE LINEUPS")
    print(f"📄 File: DKEntries_COMPLETE_180.csv")
    
    # Summary stats
    avg_win_rate = sum(l['sim']['win_rate'] for l in all_lineups) / len(all_lineups)
    best_win_rate = max(l['sim']['win_rate'] for l in all_lineups)
    avg_score = sum(l['sim']['avg'] for l in all_lineups) / len(all_lineups)
    
    print(f"\n📊 COMPLETE OPTIMIZATION SUMMARY:")
    print(f"   Total Lineups: {len(all_lineups)}")
    print(f"   Avg Win Rate: {avg_win_rate:.2f}%")
    print(f"   Best Win Rate: {best_win_rate:.2f}%") 
    print(f"   Avg Score: {avg_score:.1f}pts")
    
    print(f"\n🔄 READY FOR DRAFTKINGS IMPORT!")

if __name__ == "__main__":
    main()
