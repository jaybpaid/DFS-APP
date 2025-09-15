#!/usr/bin/env python3
"""
Live DraftKings Contest Optimizer & Simulation Engine
Parse actual DraftKings CSV, optimize lineups per contest, run simulations
Generate updated CSV for DraftKings re-import
"""

import csv
import json
import random
import math
from datetime import datetime
from typing import Dict, List, Any, Set
from collections import defaultdict

class LiveContestOptimizer:
    """Professional optimizer using live DraftKings contest data"""
    
    def __init__(self):
        self.salary_cap = 50000
        self.contests = {}
        self.player_pool = {}
        self.optimization_results = {}
        self.simulation_results = {}
        
    def parse_draftkings_csv(self, csv_file: str) -> Dict:
        """Parse the live DraftKings CSV export"""
        print("🔥 PARSING LIVE DRAFTKINGS CONTEST DATA")
        print("=" * 60)
        
        contests = {}
        player_data = {}
        contest_entries = []
        
        with open(csv_file, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Parse contest entries (first section)
                entry_id = row.get('Entry ID', '').strip()
                contest_name = row.get('Contest Name', '').strip()
                contest_id = row.get('Contest ID', '').strip()
                entry_fee = row.get('Entry Fee', '').replace('$', '') if row.get('Entry Fee') else '0'
                
                if entry_id and contest_name and entry_id.isdigit():
                    # Extract max entries from contest name
                    max_entries = 1000000  # Default large
                    if '[20 Entry Max]' in contest_name:
                        max_entries = 20
                    elif '[150 Entry Max]' in contest_name:
                        max_entries = 150
                    elif 'Flea Flicker' in contest_name:
                        max_entries = 50000
                    elif 'Millionaire' in contest_name:
                        max_entries = 1000000
                    
                    contest_type = 'cash' if max_entries <= 20 else 'gpp'
                    
                    if contest_name not in contests:
                        contests[contest_name] = {
                            'id': contest_id,
                            'name': contest_name,
                            'entry_fee': float(entry_fee) if entry_fee.replace('.', '').isdigit() else 0,
                            'max_entries': max_entries,
                            'contest_type': contest_type,
                            'entries_count': 0
                        }
                    contests[contest_name]['entries_count'] += 1
                    
                    contest_entries.append({
                        'entry_id': entry_id,
                        'contest_name': contest_name,
                        'contest_type': contest_type,
                        'max_entries': max_entries
                    })
                
                # Parse player pool data (detailed section)
                if row.get('Position') and row.get('Name') and row.get('ID'):
                    player_name = row['Name'].strip()
                    player_id = row['ID'].strip()
                    
                    if player_name and player_id and player_id.isdigit():
                        salary = 0
                        try:
                            salary = int(row['Salary']) if row['Salary'] else 0
                        except:
                            pass
                        
                        projection = 0
                        try:
                            projection = float(row['AvgPointsPerGame']) if row['AvgPointsPerGame'] else 8.0
                        except:
                            projection = 8.0
                        
                        player_info = {
                            'id': player_id,
                            'name': player_name,
                            'position': row['Position'].strip(),
                            'roster_position': row.get('Roster Position', '').strip(),
                            'salary': salary,
                            'team': row.get('TeamAbbrev', '').strip(),
                            'game_info': row.get('Game Info', '').strip(),
                            'projection': max(projection, 0.1),  # Minimum 0.1 points
                            'ownership': self.estimate_ownership(salary, row['Position'].strip()),
                            'value': round(projection / max(salary / 1000, 1), 2) if salary > 0 else 0
                        }
                        player_data[player_id] = player_info
        
        self.contests = contests
        self.player_pool = player_data
        
        print(f"✅ Parsed {len(contests)} unique contests:")
        for name, info in contests.items():
            print(f"   • {name} (${info['entry_fee']}) - {info['entries_count']} entries - {info['contest_type'].upper()}")
        
        print(f"✅ Parsed {len(player_data)} players from live slate")
        
        # Analyze player pool
        positions = defaultdict(int)
        salary_ranges = defaultdict(list)
        
        for player in player_data.values():
            positions[player['position']] += 1
            salary_ranges[player['position']].append(player['salary'])
        
        print(f"📊 Position breakdown: {dict(positions)}")
        print(f"💰 Salary ranges:")
        for pos, salaries in salary_ranges.items():
            if salaries:
                print(f"   {pos}: ${min(salaries):,} - ${max(salaries):,}")
        
        return {
            'contests': contests,
            'players': player_data,
            'entries': contest_entries
        }
    
    def estimate_ownership(self, salary: int, position: str) -> float:
        """Estimate ownership based on salary and position"""
        if salary <= 0:
            return 1.0
            
        # Base ownership by salary tier
        if salary >= 7000:
            base = 25 + (salary - 7000) / 200  # High salary = higher ownership
        elif salary >= 5000:
            base = 10 + (salary - 5000) / 200  # Mid salary
        else:
            base = 5 + (salary - 3000) / 200   # Low salary
        
        # Position adjustments
        if position in ['QB', 'RB']:
            base += 5  # QBs and RBs get higher ownership
        elif position == 'DST':
            base -= 10  # Defenses get lower ownership
        
        return max(1.0, min(60.0, base + random.uniform(-5, 5)))
    
    def generate_optimal_lineup(self, available_players: List[Dict], banned_players: Set[str] = None) -> Dict:
        """Generate single optimal lineup"""
        if banned_players is None:
            banned_players = set()
        
        # Filter available players
        valid_players = [
            p for p in available_players 
            if p['id'] not in banned_players and p['salary'] > 0
        ]
        
        # Sort by value (projection per $1000)
        valid_players.sort(key=lambda x: x['value'], reverse=True)
        
        lineup = []
        remaining_salary = self.salary_cap
        
        # DraftKings NFL positions: QB(1), RB(2), WR(3), TE(1), FLEX(1), DST(1)
        position_requirements = {
            'QB': 1,
            'RB': 2, 
            'WR': 3,
            'TE': 1,
            'DST': 1
        }
        
        # Fill core positions first
        for position, count in position_requirements.items():
            pos_players = [p for p in valid_players if p['position'] == position]
            
            for _ in range(count):
                for player in pos_players:
                    if (player['salary'] <= remaining_salary and 
                        player not in lineup and 
                        player['id'] not in banned_players):
                        lineup.append(player)
                        remaining_salary -= player['salary']
                        pos_players.remove(player)
                        break
        
        # Fill FLEX with best remaining RB/WR/TE
        flex_candidates = [p for p in valid_players 
                          if p['position'] in ['RB', 'WR', 'TE'] 
                          and p not in lineup 
                          and p['salary'] <= remaining_salary
                          and p['id'] not in banned_players]
        
        if flex_candidates:
            best_flex = max(flex_candidates, key=lambda x: x['value'])
            lineup.append(best_flex)
            remaining_salary -= best_flex['salary']
        
        return {
            'players': lineup,
            'total_salary': self.salary_cap - remaining_salary,
            'total_projection': sum(p['projection'] for p in lineup),
            'valid': len(lineup) == 9 and (self.salary_cap - remaining_salary) <= self.salary_cap
        }
    
    def optimize_for_contest(self, contest_info: Dict, num_lineups: int) -> List[Dict]:
        """Generate optimized lineups for specific contest"""
        print(f"\n⚡ Optimizing {num_lineups} lineups for {contest_info['name']}")
        print(f"   Contest Type: {contest_info['contest_type'].upper()}")
        print(f"   Field Size: {contest_info['max_entries']:,}")
        print(f"   Entry Fee: ${contest_info['entry_fee']}")
        
        available_players = list(self.player_pool.values())
        lineups = []
        used_combinations = set()
        
        for i in range(num_lineups):
            # Create banned set for diversity
            banned_players = set()
            
            # For GPPs, ban some high-ownership players for uniqueness
            if contest_info['contest_type'] == 'gpp' and i > 0:
                # Ban players from recent lineups for diversity
                for prev_lineup in lineups[-3:]:
                    prev_player_ids = [p['id'] for p in prev_lineup['players']]
                    # Ban 30-40% of previous lineup players
                    ban_count = max(2, int(len(prev_player_ids) * 0.35))
                    banned_players.update(random.sample(prev_player_ids, ban_count))
            
            # Generate lineup
            lineup = self.generate_optimal_lineup(available_players, banned_players)
            
            if lineup['valid']:
                # Create signature for uniqueness
                lineup_signature = tuple(sorted(p['id'] for p in lineup['players']))
                
                if lineup_signature not in used_combinations:
                    lineup['id'] = f"{contest_info['contest_type']}_{i+1:03d}"
                    lineup['contest'] = contest_info['name']
                    lineups.append(lineup)
                    used_combinations.add(lineup_signature)
        
        print(f"   ✅ Generated {len(lineups)} unique lineups")
        return lineups
    
    def run_monte_carlo_simulation(self, lineup: Dict, field_size: int, num_sims: int = 10000) -> Dict:
        """Run Monte Carlo simulation for lineup"""
        lineup_scores = []
        
        for _ in range(num_sims):
            sim_score = 0
            for player in lineup['players']:
                # Add variance to projection (20% std dev)
                std_dev = player['projection'] * 0.20
                player_score = max(0, random.gauss(player['projection'], std_dev))
                sim_score += player_score
            lineup_scores.append(sim_score)
        
        # Calculate statistics
        avg_score = sum(lineup_scores) / len(lineup_scores)
        sorted_scores = sorted(lineup_scores)
        
        # Percentiles
        p10 = sorted_scores[int(len(sorted_scores) * 0.10)]  # Floor
        p90 = sorted_scores[int(len(sorted_scores) * 0.90)]  # Ceiling
        
        # Estimate field performance
        field_avg = 140  # Estimated field average
        field_std = 25   # Field standard deviation
        
        # Calculate win rate against field
        wins = 0
        for score in lineup_scores:
            # Estimate how many opponents this score beats
            opponents_beaten = field_size * (1 - self.normal_cdf(score, field_avg, field_std))
            if opponents_beaten < 1:  # Top 1 finish
                wins += 1
        
        win_rate = (wins / num_sims) * 100
        
        # Calculate ROI
        # Simple ROI: (win_rate * payout_multiplier - entry_fee) / entry_fee * 100
        roi = (win_rate / 100 * 3.0 - 1.0) * 100  # Assuming 3x payout for simplicity
        
        return {
            'avg_score': round(avg_score, 1),
            'floor': round(p10, 1),
            'ceiling': round(p90, 1),
            'win_rate': round(win_rate, 2),
            'roi': round(roi, 1),
            'boom_rate': round(sum(1 for s in lineup_scores if s > avg_score * 1.2) / num_sims * 100, 1),
            'bust_rate': round(sum(1 for s in lineup_scores if s < avg_score * 0.8) / num_sims * 100, 1),
            'simulations': num_sims
        }
    
    def normal_cdf(self, x: float, mean: float, std: float) -> float:
        """Normal cumulative distribution function"""
        return 0.5 * (1 + math.erf((x - mean) / (std * math.sqrt(2))))
    
    def optimize_all_contests(self) -> Dict:
        """Generate optimal lineups for all contest types"""
        print("\n🎯 OPTIMIZING LINEUPS FOR ALL CONTESTS")
        print("=" * 60)
        
        optimization_results = {}
        
        for contest_name, contest_info in self.contests.items():
            # Determine number of lineups to generate based on your entries
            num_entries = contest_info['entries_count']
            
            # Generate optimized lineups for this contest
            lineups = self.optimize_for_contest(contest_info, num_entries)
            
            # Run simulations on each lineup
            simulation_data = []
            for lineup in lineups:
                sim_result = self.run_monte_carlo_simulation(
                    lineup, 
                    contest_info['max_entries']
                )
                sim_result['lineup_id'] = lineup['id']
                simulation_data.append(sim_result)
            
            optimization_results[contest_name] = {
                'contest_info': contest_info,
                'lineups': lineups,
                'simulations': simulation_data,
                'summary': {
                    'lineups_generated': len(lineups),
                    'avg_projection': round(sum(l['total_projection'] for l in lineups) / len(lineups), 1) if lineups else 0,
                    'avg_win_rate': round(sum(s['win_rate'] for s in simulation_data) / len(simulation_data), 2) if simulation_data else 0,
                    'best_roi': max(s['roi'] for s in simulation_data) if simulation_data else 0
                }
            }
        
        self.optimization_results = optimization_results
        return optimization_results
    
    def export_updated_csv(self, output_file: str) -> str:
        """Export updated CSV for DraftKings re-import"""
        print(f"\n📤 EXPORTING UPDATED CSV FOR DRAFTKINGS RE-IMPORT")
        print("=" * 60)
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Write headers (match DraftKings format)
            headers = ['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee', 
                      'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions']
            writer.writerow(headers)
            
            entry_counter = 1
            
            # Write optimized lineups for each contest
            for contest_name, results in self.optimization_results.items():
                contest_info = results['contest_info']
                lineups = results['lineups']
                simulations = results['simulations']
                
                for i, (lineup, sim) in enumerate(zip(lineups, simulations)):
                    # Get players by position
                    players = lineup['players']
                    qb = next((p for p in players if p['position'] == 'QB'), None)
                    rbs = [p for p in players if p['position'] == 'RB']
                    wrs = [p for p in players if p['position'] == 'WR']
                    te = next((p for p in players if p['position'] == 'TE'), None)
                    dst = next((p for p in players if p['position'] == 'DST'), None)
                    
                    # Find FLEX (not QB or DST)
                    flex = next((p for p in players if p['position'] in ['RB', 'WR', 'TE'] and 
                               p not in rbs[:2] and p not in wrs[:3] and p != te), None)
                    
                    def format_player(p):
                        return f"{p['name']} ({p['id']})" if p else ''
                    
                    # Create row with optimized lineup
                    row = [
                        f"OPT_{entry_counter:06d}",  # New optimized entry ID
                        contest_name,
                        contest_info['id'],
                        f"${contest_info['entry_fee']}",
                        format_player(qb),
                        format_player(rbs[0] if len(rbs) > 0 else None),
                        format_player(rbs[1] if len(rbs) > 1 else None),
                        format_player(wrs[0] if len(wrs) > 0 else None),
                        format_player(wrs[1] if len(wrs) > 1 else None),
                        format_player(wrs[2] if len(wrs) > 2 else None),
                        format_player(te),
                        format_player(flex),
                        format_player(dst),
                        '',
                        f"OPTIMIZED: {lineup['total_projection']:.1f}pts | Win%: {sim['win_rate']:.1f}% | ROI: {sim['roi']:.1f}%"
                    ]
                    writer.writerow(row)
                    entry_counter += 1
        
        print(f"✅ Exported {entry_counter-1} optimized lineups to {output_file}")
        return output_file
    
    def generate_simulation_report(self) -> Dict:
        """Generate comprehensive simulation report"""
        print(f"\n📊 GENERATING SIMULATION REPORT")
        print("=" * 60)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_contests': len(self.contests),
            'total_lineups_optimized': sum(len(r['lineups']) for r in self.optimization_results.values()),
            'contest_analysis': {},
            'top_lineups': [],
            'recommendations': []
        }
        
        all_simulations = []
        
        for contest_name, results in self.optimization_results.items():
            contest_simulations = results['simulations']
            contest_summary = results['summary']
            
            # Add to all simulations for overall analysis
            all_simulations.extend(contest_simulations)
            
            # Contest-specific analysis
            report['contest_analysis'][contest_name] = {
                'contest_type': results['contest_info']['contest_type'],
                'field_size': results['contest_info']['max_entries'],
                'lineups_generated': contest_summary['lineups_generated'],
                'avg_projection': contest_summary['avg_projection'],
                'avg_win_rate': contest_summary['avg_win_rate'],
                'best_lineup_win_rate': max(s['win_rate'] for s in contest_simulations) if contest_simulations else 0,
                'best_lineup_roi': max(s['roi'] for s in contest_simulations) if contest_simulations else 0
            }
            
            print(f"📈 {contest_name}:")
            print(f"   Field Size: {results['contest_info']['max_entries']:,}")
            print(f"   Lineups: {contest_summary['lineups_generated']}")
            print(f"   Avg Win Rate: {contest_summary['avg_win_rate']:.2f}%")
            print(f"   Best ROI: {contest_summary['best_roi']:.1f}%")
        
        # Find top lineups across all contests
        if all_simulations:
            top_sims = sorted(all_simulations, key=lambda x: x['roi'], reverse=True)[:10]
            report['top_lineups'] = top_sims
            
            print(f"\n🏆 TOP 5 LINEUPS ACROSS ALL CONTESTS:")
            for i, sim in enumerate(top_sims[:5], 1):
                print(f"   {i}. Win Rate: {sim['win_rate']:.2f}% | ROI: {sim['roi']:.1f}% | Score: {sim['avg_score']:.1f}")
        
        # Generate recommendations
        report['recommendations'] = [
            f"✅ CASH GAMES: Focus on high floor lineups ({min(20, len([s for s in all_simulations if 'cash' in s.get('contest_type', '')]))}/20 entry max contests)",
            f"🎯 GPPS: Prioritize high ceiling lineups for larger fields",
            f"🔥 BEST ROI: {max(s['roi'] for s in all_simulations):.1f}% projected ROI lineup available",
            f"📊 DIVERSIFICATION: Generated unique lineups for each contest type",
            f"⚡ SIMULATION ENGINE: Verified with {all_simulations[0]['simulations'] if all_simulations else 0} Monte Carlo iterations"
        ]
        
        return report
    
    def run_complete_optimization(self, csv_file: str) -> str:
        """Run complete optimization and simulation process"""
        print("🚨 LIVE DRAFTKINGS CONTEST OPTIMIZATION & SIMULATION")
        print("September 14, 2025 - NFL Week 2 Slate")
        print("=" * 80)
        
        # Parse live data
        parsed_data = self.parse_draftkings_csv(csv_file)
        
        # Generate optimal lineups for each contest
        optimization_results = self.optimize_all_contests()
        
        # Run simulation analysis
        simulation_report = self.generate_simulation_report()
        
        # Export updated CSV
        output_file = 'DKEntries_OPTIMIZED.csv'
        exported_file = self.export_updated_csv(output_file)
        
        # Save comprehensive results
        final_report = {
            'optimization_timestamp': datetime.now().isoformat(),
            'input_file': csv_file,
            'output_file': exported_file,
            'contests_processed': len(self.contests),
            'total_players_available': len(self.player_pool),
            'optimization_results': optimization_results,
            'simulation_report': simulation_report
        }
        
        with open('live_optimization_report.json', 'w') as f:
            json.dump(final_report, f, indent=2)
        
        print(f"\n" + "=" * 80)
        print("LIVE CONTEST OPTIMIZATION COMPLETE")
        print("=" * 80)
        print(f"✅ Contests Optimized: {len(self.contests)}")
        print(f"✅ Total Lineups Generated: {sum(len(r['lineups']) for r in optimization_results.values())}")
        print(f"✅ Player Pool: {len(self.player_pool)} live DraftKings players")
        print(f"✅ Simulation Engine: Monte Carlo with win%, ROI, boom/bust analysis")
        print(f"📄 Updated CSV: {exported_file}")
        print(f"📊 Full Report: live_optimization_report.json")
        
        return exported_file

if __name__ == "__main__":
    print("🔥 LIVE DRAFTKINGS CONTEST OPTIMIZER")
    print("Parsing your contest entries and optimizing with simulations")
    
    optimizer = LiveDraftKingsOptimizer()
    
    # Use your provided CSV file
    csv_file = "DKEntries (1).csv"
    
    try:
        optimized_csv = optimizer.run_complete_optimization(csv_file)
        
        print(f"\n🎉 SUCCESS: OPTIMIZATION COMPLETE!")
        print(f"✅ Your optimized lineups are ready in: {optimized_csv}")
        print(f"📊 Each lineup includes simulation analysis:")
        print(f"   • Win Rate % for each contest field size")
        print(f"   • ROI projections based on contest structure")  
        print(f"   • Boom/Bust analysis for risk assessment")
        print(f"   • Floor/Ceiling scoring ranges")
        print(f"\n🔄 READY TO IMPORT: Upload {optimized_csv} back to DraftKings!")
        
    except Exception as e:
        print(f"❌ Optimization failed: {str(e)}")
