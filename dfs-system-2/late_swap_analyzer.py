#!/usr/bin/env python3
"""
LATE SWAP ANALYZER
Analyze post-slate lock lineups for late swap opportunities
Calculate win% and ROI with current locked players vs optimal swaps
"""

import csv
import random

def main():
    print("🔄 LATE SWAP ANALYZER")
    print("Analyzing 180 lineups for late swap opportunities")
    print("=" * 60)
    
    # Analyze the post-lock CSV
    lineups = analyze_post_lock_csv()
    
    # Identify swap opportunities
    swap_opportunities = identify_late_swap_opportunities(lineups)
    
    # Calculate current vs optimal projections
    analyze_win_rates_and_roi(lineups, swap_opportunities)
    
    # Generate late swap recommendations
    generate_late_swap_csv(lineups, swap_opportunities)

def analyze_post_lock_csv():
    """Analyze the post-lock CSV to identify locked vs swappable players"""
    print("🔍 ANALYZING POST-LOCK LINEUPS")
    print("=" * 50)
    
    lineups = []
    
    with open('dfs-system-2/DKEntries (2).csv', 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            entry_id = row.get('Entry ID', '').strip()
            if entry_id and entry_id.isdigit():
                
                # Extract lineup with lock status
                lineup = {
                    'entry_id': entry_id,
                    'contest_name': row.get('Contest Name', ''),
                    'contest_id': row.get('Contest ID', ''),
                    'entry_fee': row.get('Entry Fee', ''),
                    'players': [],
                    'locked_count': 0,
                    'swappable_count': 0
                }
                
                # Analyze each position
                positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST']
                for pos in positions:
                    player_data = row.get(pos, '')
                    if player_data:
                        is_locked = '(LOCKED)' in player_data
                        player_name = player_data.replace(' (LOCKED)', '').split(' (')[0]
                        player_id = player_data.split('(')[1].split(')')[0] if '(' in player_data else ''
                        
                        lineup['players'].append({
                            'position': pos,
                            'name': player_name,
                            'id': player_id,
                            'locked': is_locked,
                            'projection': get_player_projection(player_name)
                        })
                        
                        if is_locked:
                            lineup['locked_count'] += 1
                        else:
                            lineup['swappable_count'] += 1
                
                lineups.append(lineup)
    
    print(f"✅ Analyzed {len(lineups)} lineups")
    
    # Show swap opportunity summary
    total_swappable = sum(l['swappable_count'] for l in lineups)
    print(f"📊 LATE SWAP SUMMARY:")
    print(f"   Total swappable spots: {total_swappable}")
    print(f"   Avg swappable per lineup: {total_swappable / len(lineups) if lineups else 0:.1f}")
    
    return lineups

def identify_late_swap_opportunities(lineups):
    """Identify best late swap opportunities"""
    print(f"\n🎯 IDENTIFYING LATE SWAP OPPORTUNITIES")
    print("=" * 50)
    
    # Available swap players (not locked, games not started)
    available_swaps = {
        'QB': [
            ('Jalen Hurts', '39971298', 6800, 24.28),
            ('Kyler Murray', '39971300', 6400, 18.32),
            ('Patrick Mahomes', '39971302', 6200, 26.02),
            ('Daniel Jones', '39971313', 5200, 29.48)
        ],
        'RB': [
            ('Saquon Barkley', '39971375', 8000, 18.4),
            ('Jonathan Taylor', '39971385', 6700, 12.8),
            ('James Conner', '39971387', 6600, 14.4),
            ('Chuba Hubbard', '39971397', 6000, 17.9),
            ('J.K. Dobbins', '39971409', 5600, 14.8),
            ('Trey Benson', '39971451', 4600, 8.5)
        ],
        'WR': [
            ('Marvin Harrison Jr.', '39971683', 5800, 18.1),
            ('Courtland Sutton', '39971671', 6300, 18.1),
            ('DeVonta Smith', '39971693', 5600, 4.6),
            ('Tetairoa McMillan', '39971699', 5400, 11.8),
            ('Hollywood Brown', '39971707', 5200, 19.9),
            ('Michael Pittman Jr.', '39971709', 5100, 20.0)
        ],
        'TE': [
            ('Dallas Goedert', '39972115', 3800, 11.4),
            ('Travis Kelce', '39972099', 5000, 12.7),
            ('Trey McBride', '39972095', 6000, 12.1),
            ('Xavier Legette', '39971759', 3900, 4.0)
        ],
        'DST': [
            ('Broncos', '39972349', 3500, 14.0),
            ('Eagles', '39972355', 3000, 3.0),
            ('Cardinals', '39972350', 3400, 5.0),
            ('Chiefs', '39972360', 2800, 3.0),
            ('Colts', '39972363', 2600, 13.0),
            ('Panthers', '39972369', 2300, 2.0)
        ]
    }
    
    swap_opportunities = []
    
    for lineup in lineups:
        for player in lineup['players']:
            if not player['locked'] and player['name']:  # Swappable player
                # Find better alternatives
                pos = player['position']
                current_proj = player['projection']
                
                better_options = []
                for name, pid, salary, proj in available_swaps.get(pos, []):
                    if proj > current_proj + 2:  # Significant improvement
                        better_options.append({
                            'name': name,
                            'id': pid,
                            'salary': salary,
                            'projection': proj,
                            'improvement': proj - current_proj
                        })
                
                if better_options:
                    best_swap = max(better_options, key=lambda x: x['improvement'])
                    swap_opportunities.append({
                        'entry_id': lineup['entry_id'],
                        'contest': lineup['contest_name'],
                        'position': pos,
                        'current_player': player['name'],
                        'current_projection': current_proj,
                        'recommended_swap': best_swap,
                        'projection_gain': best_swap['improvement']
                    })
    
    print(f"✅ Found {len(swap_opportunities)} swap opportunities")
    
    # Show top swaps
    top_swaps = sorted(swap_opportunities, key=lambda x: x['projection_gain'], reverse=True)[:10]
    print(f"🔥 TOP LATE SWAP OPPORTUNITIES:")
    for i, swap in enumerate(top_swaps, 1):
        print(f"   {i}. Entry {swap['entry_id']}: {swap['current_player']} → {swap['recommended_swap']['name']} (+{swap['projection_gain']:.1f} pts)")
    
    return swap_opportunities

def get_player_projection(player_name):
    """Get projection for player (from CSV data analysis)"""
    projections = {
        'Josh Allen': 41.76, 'Lamar Jackson': 29.36, 'Justin Fields': 29.52, 'Daniel Jones': 29.48,
        'Patrick Mahomes': 26.02, 'Aaron Rodgers': 25.66, 'Caleb Williams': 24.2, 'Jalen Hurts': 24.28,
        'Hollywood Brown': 19.9, 'Kyler Murray': 18.32, 'Brock Purdy': 18.78, 'Drake Maye': 16.78,
        'Derrick Henry': 33.2, 'Christian McCaffrey': 23.2, 'James Cook': 21.2, 'Javonte Williams': 20.4,
        'Breece Hall': 19.5, 'Saquon Barkley': 18.4, 'Chuba Hubbard': 17.9, 'Dylan Sampson': 17.3,
        'De\'Von Achane': 16.5, 'Jahmyr Gibbs': 15.0, 'J.K. Dobbins': 14.8, 'James Conner': 14.4,
        'Jaylen Warren': 13.9, 'Kyren Williams': 13.9, 'Alvin Kamara': 13.7, 'Chase Brown': 13.1,
        'Jonathan Taylor': 12.8, 'TreVeyon Henderson': 11.1, 'Zay Flowers': 31.1, 'Keon Coleman': 28.2,
        'Puka Nacua': 26.1, 'Jaxon Smith-Njigba': 23.4, 'Garrett Wilson': 22.5, 'CeeDee Lamb': 21.0,
        'Michael Pittman Jr.': 20.0, 'Kayshon Boutte': 19.3, 'Marvin Harrison Jr.': 18.1, 
        'Courtland Sutton': 18.1, 'Ricky Pearsall': 17.8, 'Calvin Austin III': 17.0, 'Cedric Tillman': 16.2,
        'Rome Odunze': 15.7, 'DK Metcalf': 12.3, 'Khalil Shakir': 12.4, 'Chris Olave': 12.4,
        'Malik Nabers': 12.1, 'Stefon Diggs': 11.7, 'Jerry Jeudy': 11.6, 'DeAndre Hopkins': 11.5,
        'Tetairoa McMillan': 11.8, 'Wan\'Dale Robinson': 11.5,
        'Juwan Johnson': 15.6, 'Tyler Warren': 14.9, 'Dalton Kincaid': 14.8, 'Sam LaPorta': 13.9,
        'Harold Fannin Jr.': 13.6, 'Travis Kelce': 12.7, 'George Kittle': 12.5, 'Jonnu Smith': 12.5,
        'Noah Fant': 12.6, 'Trey McBride': 12.1, 'Dallas Goedert': 11.4, 'Hunter Henry': 10.6,
        'Broncos': 14.0, 'Colts': 13.0, 'Bears': 11.0, 'Jaguars': 11.0, 'Titans': 10.0
    }
    
    return projections.get(player_name, 5.0)  # Default 5.0 if not found

def analyze_win_rates_and_roi(lineups, swap_opportunities):
    """Calculate win rates and ROI with current vs optimal swaps"""
    print(f"\n📊 WIN RATE & ROI ANALYSIS")
    print("=" * 50)
    
    contest_analysis = {}
    
    for lineup in lineups:
        contest = lineup['contest_name']
        if contest not in contest_analysis:
            contest_analysis[contest] = {
                'lineups': [],
                'current_projections': [],
                'optimal_projections': []
            }
        
        # Current lineup projection
        current_proj = sum(p['projection'] for p in lineup['players'])
        
        # Optimal projection with best swaps
        optimal_proj = current_proj
        for swap in swap_opportunities:
            if swap['entry_id'] == lineup['entry_id']:
                optimal_proj += swap['projection_gain']
        
        # Calculate win rates and ROI
        current_win, current_roi = calculate_contest_metrics(contest, current_proj)
        optimal_win, optimal_roi = calculate_contest_metrics(contest, optimal_proj)
        
        lineup_analysis = {
            'entry_id': lineup['entry_id'],
            'current_projection': current_proj,
            'optimal_projection': optimal_proj,
            'projection_gain': optimal_proj - current_proj,
            'current_win_rate': current_win,
            'optimal_win_rate': optimal_win,
            'win_rate_gain': optimal_win - current_win,
            'current_roi': current_roi,
            'optimal_roi': optimal_roi,
            'roi_gain': optimal_roi - current_roi
        }
        
        contest_analysis[contest]['lineups'].append(lineup_analysis)
        contest_analysis[contest]['current_projections'].append(current_proj)
        contest_analysis[contest]['optimal_projections'].append(optimal_proj)
    
    # Print analysis by contest
    for contest, analysis in contest_analysis.items():
        print(f"\n🎯 {contest}")
        print(f"   Lineups: {len(analysis['lineups'])}")
        
        if analysis['lineups']:
            # Current performance
            avg_current_proj = sum(analysis['current_projections']) / len(analysis['current_projections'])
            avg_current_win = sum(l['current_win_rate'] for l in analysis['lineups']) / len(analysis['lineups'])
            avg_current_roi = sum(l['current_roi'] for l in analysis['lineups']) / len(analysis['lineups'])
            
            # Optimal performance
            avg_optimal_proj = sum(analysis['optimal_projections']) / len(analysis['optimal_projections'])
            avg_optimal_win = sum(l['optimal_win_rate'] for l in analysis['lineups']) / len(analysis['lineups'])
            avg_optimal_roi = sum(l['optimal_roi'] for l in analysis['lineups']) / len(analysis['lineups'])
            
            print(f"   📈 CURRENT: {avg_current_proj:.1f} pts | {avg_current_win:.1f}% win | {avg_current_roi:.1f}% ROI")
            print(f"   🚀 OPTIMAL: {avg_optimal_proj:.1f} pts | {avg_optimal_win:.1f}% win | {avg_optimal_roi:.1f}% ROI")
            print(f"   💡 GAIN: +{avg_optimal_proj - avg_current_proj:.1f} pts | +{avg_optimal_win - avg_current_win:.1f}% win | +{avg_optimal_roi - avg_current_roi:.1f}% ROI")
            
            # Best opportunities in this contest
            best_lineup = max(analysis['lineups'], key=lambda x: x['projection_gain'])
            if best_lineup['projection_gain'] > 0:
                print(f"   🏆 BEST SWAP: Entry {best_lineup['entry_id']} (+{best_lineup['projection_gain']:.1f} pts, +{best_lineup['win_rate_gain']:.1f}% win)")

def calculate_contest_metrics(contest_name, projection):
    """Calculate win% and ROI based on contest and projection"""
    if 'Play-Action [20' in contest_name:
        # Cash game
        win_rate = max(10, min(50, (projection - 140) / 3))
        roi = (win_rate / 100 * 1.8 - 1) * 100
    elif '[150 Entry Max]' in contest_name:
        # Small GPP
        win_rate = max(2, min(30, (projection - 150) / 4))
        roi = (win_rate / 100 * 12 - 1) * 100
    elif 'Flea Flicker' in contest_name:
        # Mid GPP
        win_rate = max(0.5, min(10, (projection - 160) / 6))
        roi = (win_rate / 100 * 100 - 1) * 100
    else:
        # Large GPP
        win_rate = max(0.01, min(2, (projection - 170) / 10))
        roi = (win_rate / 100 * 5000 - 1) * 100
    
    return win_rate, roi

def generate_late_swap_csv(lineups, swap_opportunities):
    """Generate CSV with late swap analysis"""
    print(f"\n📤 GENERATING LATE SWAP ANALYSIS CSV")
    print("=" * 50)
    
    with open('dfs-system-2/Late_Swap_Analysis.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Entry ID', 'Contest Name', 'Current Projection', 'Optimal Projection', 
                        'Projection Gain', 'Current Win%', 'Optimal Win%', 'Win% Gain',
                        'Current ROI%', 'Optimal ROI%', 'ROI Gain', 'Recommended Swaps'])
        
        for lineup in lineups:
            # Calculate current metrics
            current_proj = sum(p['projection'] for p in lineup['players'])
            current_win, current_roi = calculate_contest_metrics(lineup['contest_name'], current_proj)
            
            # Find swaps for this lineup
            lineup_swaps = [s for s in swap_opportunities if s['entry_id'] == lineup['entry_id']]
            optimal_proj = current_proj + sum(s['projection_gain'] for s in lineup_swaps)
            optimal_win, optimal_roi = calculate_contest_metrics(lineup['contest_name'], optimal_proj)
            
            # Recommended swaps summary
            swap_summary = '; '.join([f"{s['current_player']}→{s['recommended_swap']['name']}" for s in lineup_swaps[:3]])
            
            writer.writerow([
                lineup['entry_id'],
                lineup['contest_name'],
                f"{current_proj:.1f}",
                f"{optimal_proj:.1f}",
                f"+{optimal_proj - current_proj:.1f}",
                f"{current_win:.1f}%",
                f"{optimal_win:.1f}%", 
                f"+{optimal_win - current_win:.1f}%",
                f"{current_roi:.1f}%",
                f"{optimal_roi:.1f}%",
                f"+{optimal_roi - current_roi:.1f}%",
                swap_summary if swap_summary else 'No beneficial swaps'
            ])
    
    print(f"✅ LATE SWAP ANALYSIS COMPLETE")
    print(f"📄 File: Late_Swap_Analysis.csv")

if __name__ == "__main__":
    main()
