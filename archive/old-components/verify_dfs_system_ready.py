#!/usr/bin/env python3
"""
COMPREHENSIVE DFS SYSTEM READINESS VERIFICATION
Checks all components for today's DraftKings slate
"""

import json
import os
import requests
import pandas as pd
from datetime import datetime
import sys

class DFSSystemVerifier:
    def __init__(self):
        self.results = {
            'overall_status': 'CHECKING',
            'components': {},
            'recommendations': [],
            'timestamp': datetime.now().isoformat()
        }
        
    def check_data_files(self):
        """Verify all required data files exist and are current"""
        print("📁 Checking Data Files...")
        
        required_files = [
            'data/available_slates.json',
            'data/current_player_pool.json',
            'data/weather_data.json'
        ]
        
        data_status = {
            'files_exist': True,
            'files_fresh': True,
            'details': {}
        }
        
        for file_path in required_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                    
                    if file_path == 'data/available_slates.json':
                        slates = data.get('slates', [])
                        active_slates = [s for s in slates if s.get('status') == 'active']
                        data_status['details']['slates'] = {
                            'total': len(slates),
                            'active': len(active_slates),
                            'player_count': sum(s.get('player_count', 0) for s in active_slates)
                        }
                        
                    elif file_path == 'data/current_player_pool.json':
                        player_count = len(data) if isinstance(data, list) else 0
                        data_status['details']['players'] = {
                            'total_players': player_count,
                            'has_salaries': sum(1 for p in data if p.get('salary', 0) > 0) if isinstance(data, list) else 0
                        }
                        
                    data_status['details'][file_path] = 'EXISTS_AND_VALID'
                    print(f"✅ {file_path}")
                    
                except Exception as e:
                    data_status['details'][file_path] = f'ERROR: {str(e)}'
                    print(f"❌ {file_path} - {str(e)}")
                    data_status['files_fresh'] = False
            else:
                data_status['files_exist'] = False
                data_status['details'][file_path] = 'MISSING'
                print(f"❌ {file_path} - MISSING")
        
        self.results['components']['data_files'] = data_status
        return data_status['files_exist'] and data_status['files_fresh']
    
    def check_today_slate_availability(self):
        """Check if today's slates are available and active"""
        print("\n🎯 Checking Today's Slate Availability...")
        
        slate_status = {
            'slates_today': 0,
            'active_slates': 0,
            'total_players': 0,
            'kc_phi_game': False,
            'details': []
        }
        
        try:
            with open('data/available_slates.json', 'r') as f:
                slates_data = json.load(f)
            
            slates = slates_data.get('slates', [])
            today_date = datetime.now().strftime('%Y-%m-%d')
            
            for slate in slates:
                slate_date = slate.get('start_time', '')[:10]  # Get YYYY-MM-DD part
                if slate_date == today_date:
                    slate_status['slates_today'] += 1
                    if slate.get('status') == 'active':
                        slate_status['active_slates'] += 1
                        slate_status['total_players'] += slate.get('player_count', 0)
                    
                    # Check for KC vs PHI game
                    games = slate.get('games', [])
                    for game in games:
                        if ('KC' in [game.get('home_team'), game.get('away_team')] and 
                            'PHI' in [game.get('home_team'), game.get('away_team')]):
                            slate_status['kc_phi_game'] = True
                    
                    slate_status['details'].append({
                        'name': slate.get('name'),
                        'type': slate.get('type'),
                        'status': slate.get('status'),
                        'player_count': slate.get('player_count'),
                        'entry_fee': slate.get('entry_fee')
                    })
            
            print(f"✅ Found {slate_status['active_slates']} active slates today")
            print(f"✅ Total players available: {slate_status['total_players']}")
            print(f"✅ KC vs PHI game available: {slate_status['kc_phi_game']}")
            
        except Exception as e:
            print(f"❌ Error checking slates: {str(e)}")
            slate_status['error'] = str(e)
        
        self.results['components']['today_slates'] = slate_status
        return slate_status['active_slates'] > 0
    
    def check_player_data_quality(self):
        """Verify player data is complete and current"""
        print("\n👥 Checking Player Data Quality...")
        
        player_status = {
            'total_players': 0,
            'players_with_salaries': 0,
            'players_with_projections': 0,
            'positions_covered': set(),
            'teams_covered': set(),
            'data_freshness': None
        }
        
        try:
            with open('data/current_player_pool.json', 'r') as f:
                players = json.load(f)
            
            if isinstance(players, list):
                player_status['total_players'] = len(players)
                
                for player in players:
                    if player.get('salary', 0) > 0:
                        player_status['players_with_salaries'] += 1
                    
                    if player.get('ffpg'):
                        player_status['players_with_projections'] += 1
                    
                    if player.get('position'):
                        player_status['positions_covered'].add(player['position'])
                    
                    if player.get('team'):
                        player_status['teams_covered'].add(player['team'])
                
                # Check data freshness
                if players and players[0].get('last_updated'):
                    last_updated = datetime.fromisoformat(players[0]['last_updated'].replace('Z', '+00:00'))
                    hours_old = (datetime.now() - last_updated.replace(tzinfo=None)).total_seconds() / 3600
                    player_status['data_freshness'] = f"{hours_old:.1f} hours old"
            
            player_status['positions_covered'] = list(player_status['positions_covered'])
            player_status['teams_covered'] = list(player_status['teams_covered'])
            
            print(f"✅ {player_status['total_players']} total players")
            print(f"✅ {player_status['players_with_salaries']} players with salaries")
            print(f"✅ {len(player_status['positions_covered'])} positions covered")
            print(f"✅ Data freshness: {player_status['data_freshness']}")
            
        except Exception as e:
            print(f"❌ Error checking player data: {str(e)}")
            player_status['error'] = str(e)
        
        self.results['components']['player_data'] = player_status
        return player_status['players_with_salaries'] > 300  # Need substantial player pool
    
    def check_optimizer_systems(self):
        """Check if optimizer systems are working"""
        print("\n⚙️ Checking Optimizer Systems...")
        
        optimizer_status = {
            'main_app': False,
            'optimizer_files': 0,
            'key_optimizers': []
        }
        
        # Check main app.py
        if os.path.exists('app.py'):
            optimizer_status['main_app'] = True
            print("✅ Main app.py exists")
        
        # Check for optimizer files
        optimizer_patterns = [
            'dfs-system-2/final_working_180_optimizer.py',
            'dfs-system-2/bulletproof_late_swap_engine.py',
            'dfs-system-2/industry_standard_hybrid_optimizer.py'
        ]
        
        for optimizer_file in optimizer_patterns:
            if os.path.exists(optimizer_file):
                optimizer_status['key_optimizers'].append(optimizer_file)
                optimizer_status['optimizer_files'] += 1
                print(f"✅ {optimizer_file}")
        
        # Count all optimizer files
        if os.path.exists('dfs-system-2'):
            all_optimizers = [f for f in os.listdir('dfs-system-2') if 'optimizer' in f and f.endswith('.py')]
            optimizer_status['total_optimizer_files'] = len(all_optimizers)
            print(f"✅ Found {len(all_optimizers)} optimizer files total")
        
        self.results['components']['optimizers'] = optimizer_status
        return optimizer_status['main_app'] and optimizer_status['optimizer_files'] > 0
    
    def generate_final_report(self):
        """Generate final readiness report"""
        print("\n" + "="*60)
        print("🚀 DFS SYSTEM READINESS REPORT")
        print("="*60)
        
        # Determine overall status
        all_checks = [
            self.results['components'].get('data_files', {}).get('files_exist', False),
            self.results['components'].get('today_slates', {}).get('active_slates', 0) > 0,
            self.results['components'].get('player_data', {}).get('players_with_salaries', 0) > 300,
            self.results['components'].get('optimizers', {}).get('main_app', False)
        ]
        
        if all(all_checks):
            self.results['overall_status'] = '🟢 READY FOR TODAY\'S SLATE'
            print("🟢 SYSTEM STATUS: READY FOR TODAY'S DRAFTKINGS SLATE")
        elif sum(all_checks) >= 3:
            self.results['overall_status'] = '🟡 MOSTLY READY - MINOR ISSUES'
            print("🟡 SYSTEM STATUS: MOSTLY READY - MINOR ISSUES")
        else:
            self.results['overall_status'] = '🔴 NOT READY - CRITICAL ISSUES'
            print("🔴 SYSTEM STATUS: NOT READY - CRITICAL ISSUES")
        
        print(f"\n📊 COMPONENT STATUS:")
        
        # Data Files
        data_files = self.results['components'].get('data_files', {})
        print(f"📁 Data Files: {'✅' if data_files.get('files_exist') else '❌'}")
        
        # Today's Slates
        slates = self.results['components'].get('today_slates', {})
        print(f"🎯 Active Slates: {slates.get('active_slates', 0)} ({'✅' if slates.get('active_slates', 0) > 0 else '❌'})")
        print(f"   - KC vs PHI Game: {'✅' if slates.get('kc_phi_game') else '❌'}")
        
        # Player Data
        players = self.results['components'].get('player_data', {})
        print(f"👥 Player Pool: {players.get('players_with_salaries', 0)} players ({'✅' if players.get('players_with_salaries', 0) > 300 else '❌'})")
        
        # Optimizers
        optimizers = self.results['components'].get('optimizers', {})
        print(f"⚙️ Optimizers: {'✅' if optimizers.get('main_app') else '❌'}")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if slates.get('active_slates', 0) == 0:
            print("   - No active slates found for today - check data refresh")
        if players.get('players_with_salaries', 0) < 300:
            print("   - Player pool may be incomplete - verify data sync")
        if not optimizers.get('main_app'):
            print("   - Main application not found - check app.py")
        
        print(f"\n⏰ Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        return self.results

def main():
    print("🔍 DFS SYSTEM VERIFICATION STARTING...")
    print("="*60)
    
    verifier = DFSSystemVerifier()
    
    # Run all checks
    data_check = verifier.check_data_files()
    slate_check = verifier.check_today_slate_availability()
    player_check = verifier.check_player_data_quality()
    optimizer_check = verifier.check_optimizer_systems()
    
    # Generate final report
    final_report = verifier.generate_final_report()
    
    # Save report
    with open('dfs_system_readiness_report.json', 'w') as f:
        json.dump(final_report, f, indent=2, default=str)
    
    print(f"\n📄 Detailed report saved to: dfs_system_readiness_report.json")
    
    return final_report

if __name__ == "__main__":
    main()
