#!/usr/bin/env python3
"""
SLATE LEVEL ANALYSIS
Analyze win%, ROI, and boom potential across the entire slate
"""

import csv
from collections import defaultdict

def main():
    print("📊 SLATE LEVEL WIN% / ROI / BOOM ANALYSIS")
    print("Analyzing performance across entire slate")
    print("=" * 60)
    
    # Analyze the highest win rate CSV
    analyze_slate_performance()

def analyze_slate_performance():
    """Analyze slate-wide performance metrics"""
    print("🔍 ANALYZING SLATE-WIDE PERFORMANCE")
    print("=" * 50)
    
    contest_data = defaultdict(list)
    player_usage = defaultdict(int)
    boom_players = defaultdict(float)
    
    # Read the CSV and analyze
    with open('DKEntries_HIGHEST_WINRATE_NO_DUPLICATES.csv', 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            contest = row['Contest Name']
            instructions = row['Instructions']
            
            # Extract metrics from instructions
            if 'Win:' in instructions and 'ROI:' in instructions and 'pts |' in instructions:
                try:
                    # Extract projection, win%, ROI
                    proj_str = instructions.split('| ')[2].split('pts')[0]
                    win_str = instructions.split('Win: ')[1].split('%')[0]
                    roi_str = instructions.split('ROI: ')[1].split('%')[0]
                    
                    projection = float(proj_str)
                    win_rate = float(win_str)
                    roi = float(roi_str.replace(',', ''))
                    
                    contest_data[contest].append({
                        'entry_id': row['Entry ID'],
                        'projection': projection,
                        'win_rate': win_rate,
                        'roi': roi
                    })
                    
                    # Track player usage and boom potential
                    for pos in ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX']:
                        player_data = row.get(pos, '')
                        if player_data and '(' in player_data:
                            player_name = player_data.split(' (')[0]
                            player_usage[player_name] += 1
                            
                            # Boom potential (high projection players)
                            boom_players[player_name] += projection / 180  # Average contribution
                            
                except Exception as e:
                    continue
    
    # Analyze by contest type (slate level)
    print("🎯 SLATE-LEVEL PERFORMANCE BY CONTEST TYPE:")
    print("=" * 50)
    
    overall_slate_metrics = {
        'total_lineups': 0,
        'total_projection': 0,
        'total_win_rate': 0,
        'total_roi': 0
    }
    
    for contest, entries in contest_data.items():
        if not entries:
            continue
            
        # Slate-level calculations
        slate_avg_projection = sum(e['projection'] for e in entries) / len(entries)
        slate_avg_win_rate = sum(e['win_rate'] for e in entries) / len(entries)
        slate_avg_roi = sum(e['roi'] for e in entries) / len(entries)
        slate_total_win_rate = sum(e['win_rate'] for e in entries)  # Combined win%
        
        print(f"\n🎯 {contest}")
        print(f"   📊 Lineups in Contest: {len(entries)}")
        print(f"   📈 Slate Avg Projection: {slate_avg_projection:.1f} pts")
        print(f"   🏆 Slate Avg Win%: {slate_avg_win_rate:.1f}%")
        print(f"   💰 Slate Total Win%: {slate_total_win_rate:.1f}% (combined across all entries)")
        print(f"   💵 Slate Avg ROI: {slate_avg_roi:.1f}%")
        
        # Best and worst lineups in this contest
        best_win = max(entries, key=lambda x: x['win_rate'])
        best_roi = max(entries, key=lambda x: x['roi'])
        highest_proj = max(entries, key=lambda x: x['projection'])
        
        print(f"   🥇 Best Win%: {best_win['win_rate']:.1f}% (Entry {best_win['entry_id']})")
        print(f"   💎 Best ROI: {best_roi['roi']:.1f}% (Entry {best_roi['entry_id']})")
        print(f"   🚀 Highest Proj: {highest_proj['projection']:.1f} pts (Entry {highest_proj['entry_id']})")
        
        # Add to overall slate
        overall_slate_metrics['total_lineups'] += len(entries)
        overall_slate_metrics['total_projection'] += sum(e['projection'] for e in entries)
        overall_slate_metrics['total_win_rate'] += sum(e['win_rate'] for e in entries)
        overall_slate_metrics['total_roi'] += sum(e['roi'] for e in entries)
    
    # Overall slate analysis
    print(f"\n📊 OVERALL SLATE PERFORMANCE:")
    print("=" * 50)
    total_lineups = overall_slate_metrics['total_lineups']
    if total_lineups > 0:
        overall_avg_proj = overall_slate_metrics['total_projection'] / total_lineups
        overall_combined_win = overall_slate_metrics['total_win_rate']
        overall_avg_roi = overall_slate_metrics['total_roi'] / total_lineups
        
        print(f"   📈 Total Lineups: {total_lineups}")
        print(f"   📊 Slate Avg Projection: {overall_avg_proj:.1f} pts")
        print(f"   🎯 Combined Win Rate: {overall_combined_win:.1f}% (across all contests)")
        print(f"   💰 Average ROI: {overall_avg_roi:.1f}%")
    
    # Top boom players analysis
    print(f"\n🚀 TOP BOOM PLAYERS (HIGHEST CEILING POTENTIAL):")
    print("=" * 50)
    
    # Sort players by boom potential
    top_boom_players = sorted(boom_players.items(), key=lambda x: x[1], reverse=True)[:15]
    
    print("Player Name | Usage Count | Boom Score | Boom Potential")
    print("-" * 55)
    for player, boom_score in top_boom_players:
        usage = player_usage[player]
        boom_potential = "🚀 ELITE" if boom_score > 15 else "💎 HIGH" if boom_score > 10 else "⚡ GOOD"
        print(f"{player:<20} | {usage:>3} lineups | {boom_score:>6.1f}pts | {boom_potential}")
    
    print(f"\n✅ SLATE ANALYSIS COMPLETE")

if __name__ == "__main__":
    main()
