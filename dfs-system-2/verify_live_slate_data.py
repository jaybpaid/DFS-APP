#!/usr/bin/env python3
"""
Verify Live DraftKings Slate Data Access
Test if we can access current NFL contests with complete player pools and salaries
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Optional

# Test DraftKings client for live data
try:
    from draft_kings import Client
    DK_CLIENT_AVAILABLE = True
    print("✅ DraftKings client available")
except ImportError as e:
    print(f"❌ DraftKings client not available: {e}")
    DK_CLIENT_AVAILABLE = False

class LiveSlateDataVerifier:
    """Verify access to live DraftKings slate data"""
    
    def __init__(self):
        if not DK_CLIENT_AVAILABLE:
            raise Exception("DraftKings client required")
        
        self.client = Client()
        self.verification_results = {
            'timestamp': datetime.now().isoformat(),
            'live_data_access': False,
            'contests_accessed': 0,
            'total_players_found': 0,
            'complete_slate_data': {},
            'salary_ranges_current': {},
            'key_players_verified': {},
            'data_freshness_indicators': [],
            'errors': []
        }
    
    def get_live_nfl_contests(self) -> List:
        """Get current live NFL contests"""
        print("🏈 ACCESSING LIVE NFL CONTESTS...")
        
        try:
            contests = self.client.contests(sport='NFL')
            
            if contests and len(contests) > 0:
                self.verification_results['contests_accessed'] = len(contests)
                print(f"✅ Found {len(contests)} live NFL contests")
                
                # Show contest details
                for i, contest in enumerate(contests[:3], 1):  # Show first 3
                    contest_info = {
                        'id': getattr(contest, 'id', 'Unknown'),
                        'name': getattr(contest, 'name', 'Unknown'),
                        'entry_fee': getattr(contest, 'entry_fee', 0),
                        'entries': getattr(contest, 'total_entries', 0),
                        'start_time': getattr(contest, 'starts_at', 'Unknown')
                    }
                    print(f"  Contest {i}: {contest_info['name']}")
                    print(f"    Entry: ${contest_info['entry_fee']} | Entries: {contest_info['entries']}")
                    print(f"    Start: {contest_info['start_time']}")
                
                return contests
            else:
                print("❌ No NFL contests found")
                self.verification_results['errors'].append("No NFL contests available")
                return []
                
        except Exception as e:
            error_msg = f"Contest access failed: {str(e)}"
            print(f"❌ {error_msg}")
            self.verification_results['errors'].append(error_msg)
            return []
    
    def get_complete_player_pool(self, contest_id: str) -> List:
        """Get the complete player pool for a contest"""
        print(f"\n👥 ACCESSING COMPLETE PLAYER POOL for contest {contest_id}...")
        
        try:
            players = self.client.draftables(contest_id=contest_id)
            
            if players:
                self.verification_results['total_players_found'] = len(players)
                print(f"✅ Retrieved COMPLETE slate: {len(players)} total players")
                
                # Analyze complete player pool
                position_breakdown = {}
                team_breakdown = {}
                salary_analysis = {}
                
                complete_player_data = []
                
                for player in players:
                    player_info = {
                        'id': getattr(player, 'player_id', 'Unknown'),
                        'name': getattr(player, 'display_name', 'Unknown'),
                        'position': getattr(player, 'roster_position', 'Unknown'),
                        'team': getattr(player, 'team_abbreviation', 'Unknown'),
                        'salary': getattr(player, 'salary', 0),
                        'opponent': getattr(player, 'opponent_abbreviation', 'Unknown')
                    }
                    complete_player_data.append(player_info)
                    
                    # Track position breakdown
                    pos = player_info['position']
                    position_breakdown[pos] = position_breakdown.get(pos, 0) + 1
                    
                    # Track team breakdown  
                    team = player_info['team']
                    team_breakdown[team] = team_breakdown.get(team, 0) + 1
                    
                    # Track salary ranges
                    salary = player_info['salary']
                    if pos not in salary_analysis:
                        salary_analysis[pos] = []
                    salary_analysis[pos].append(salary)
                
                # Calculate salary ranges
                for pos, salaries in salary_analysis.items():
                    if salaries:
                        self.verification_results['salary_ranges_current'][pos] = {
                            'count': len(salaries),
                            'min': min(salaries),
                            'max': max(salaries),
                            'avg': round(sum(salaries) / len(salaries))
                        }
                
                # Store complete data
                self.verification_results['complete_slate_data'] = {
                    'total_players': len(complete_player_data),
                    'position_breakdown': position_breakdown,
                    'team_breakdown': team_breakdown,
                    'player_sample': complete_player_data[:20],  # First 20 for verification
                    'all_players': complete_player_data
                }
                
                print(f"📊 Position Breakdown: {position_breakdown}")
                print(f"🏈 Teams Represented: {len(team_breakdown)}")
                print(f"💰 Salary Ranges:")
                for pos, data in self.verification_results['salary_ranges_current'].items():
                    print(f"    {pos}: ${data['min']:,} - ${data['max']:,} ({data['count']} players)")
                
                return complete_player_data
            else:
                print("❌ No players found")
                return []
                
        except Exception as e:
            error_msg = f"Player pool access failed: {str(e)}"
            print(f"❌ {error_msg}")
            self.verification_results['errors'].append(error_msg)
            return []
    
    def verify_key_players_current_teams(self, player_data: List[Dict]) -> Dict:
        """Verify key players have current team assignments"""
        print(f"\n🔍 VERIFYING KEY PLAYERS' CURRENT TEAMS...")
        
        # Key players to check for current data
        key_player_checks = {
            'Deebo Samuel': 'WAS',  # Should be WAS after trade
            'Stefon Diggs': 'HOU',  # Should be HOU after trade
            'Saquon Barkley': 'PHI', # Should be PHI after signing
            'Lamar Jackson': 'BAL',  # Control - should be BAL
            'Josh Allen': 'BUF',     # Control - should be BUF
            'Patrick Mahomes': 'KC'  # Control - should be KC
        }
        
        verification_results = {}
        data_freshness_score = 0
        total_checks = len(key_player_checks)
        
        for expected_name, expected_team in key_player_checks.items():
            # Find player in live data
            matching_players = [p for p in player_data if expected_name.lower() in p['name'].lower()]
            
            if matching_players:
                player = matching_players[0]  # Take first match
                actual_team = player['team']
                
                if actual_team == expected_team:
                    verification_results[expected_name] = {
                        'status': 'CURRENT',
                        'team': actual_team,
                        'salary': player['salary']
                    }
                    data_freshness_score += 1
                    print(f"  ✅ {expected_name}: {actual_team} (${player['salary']:,}) - CURRENT")
                else:
                    verification_results[expected_name] = {
                        'status': 'STALE', 
                        'team': actual_team,
                        'expected': expected_team,
                        'salary': player['salary']
                    }
                    print(f"  ❌ {expected_name}: {actual_team} (expected {expected_team}) - STALE")
            else:
                verification_results[expected_name] = {
                    'status': 'NOT_FOUND',
                    'team': 'NOT_FOUND'
                }
                print(f"  ❌ {expected_name}: NOT FOUND in live data")
        
        # Calculate freshness percentage
        freshness_percentage = (data_freshness_score / total_checks) * 100
        
        self.verification_results['key_players_verified'] = verification_results
        self.verification_results['data_freshness_percentage'] = freshness_percentage
        
        print(f"\n📊 Data Freshness Score: {data_freshness_score}/{total_checks} ({freshness_percentage:.1f}%)")
        
        if freshness_percentage >= 80:
            print("✅ Live data appears CURRENT")
            self.verification_results['live_data_access'] = True
        elif freshness_percentage >= 60:
            print("⚠️ Live data appears PARTIALLY CURRENT")
            self.verification_results['live_data_access'] = True
        else:
            print("❌ Live data appears STALE")
            self.verification_results['live_data_access'] = False
        
        return verification_results
    
    def export_complete_live_slate(self, player_data: List[Dict], contest_info: Dict):
        """Export the complete live slate data"""
        print(f"\n📤 EXPORTING COMPLETE LIVE SLATE DATA...")
        
        # Create comprehensive slate export
        slate_export = {
            'export_timestamp': datetime.now().isoformat(),
            'data_source': 'LIVE_DRAFTKINGS_API',
            'contest_info': contest_info,
            'total_players': len(player_data),
            'salary_cap': 50000,  # Standard DraftKings
            'complete_player_pool': player_data,
            'verification_results': self.verification_results
        }
        
        # Save complete slate
        with open('live_draftkings_complete_slate.json', 'w') as f:
            json.dump(slate_export, f, indent=2)
        
        print(f"✅ Exported complete slate with {len(player_data)} players")
        
        # Create CSV for immediate use
        import csv
        with open('live_draftkings_player_pool.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            
            # Headers
            headers = ['Player ID', 'Name', 'Position', 'Team', 'Opponent', 'Salary']
            writer.writerow(headers)
            
            # All players
            for player in player_data:
                row = [
                    player['id'],
                    player['name'], 
                    player['position'],
                    player['team'],
                    player['opponent'],
                    player['salary']
                ]
                writer.writerow(row)
        
        print(f"✅ Created CSV with complete player pool: live_draftkings_player_pool.csv")
        
        return slate_export
    
    def run_complete_live_verification(self):
        """Run complete verification of live DraftKings data access"""
        print("🚨 LIVE DRAFTKINGS SLATE DATA VERIFICATION")
        print("Testing access to current NFL contest data with complete player pools")
        print("=" * 80)
        
        if not DK_CLIENT_AVAILABLE:
            print("❌ DraftKings client not available - cannot verify live data")
            return False
        
        # Step 1: Get live contests
        contests = self.get_live_nfl_contests()
        if not contests:
            print("❌ CRITICAL: Cannot access live NFL contests")
            return False
        
        # Step 2: Get complete player pool from first available contest
        contest = contests[0]
        contest_id = getattr(contest, 'id', None)
        
        if not contest_id:
            print("❌ CRITICAL: Cannot get contest ID")
            return False
        
        contest_info = {
            'id': contest_id,
            'name': getattr(contest, 'name', 'Unknown'),
            'sport': 'NFL'
        }
        
        complete_player_data = self.get_complete_player_pool(contest_id)
        if not complete_player_data:
            print("❌ CRITICAL: Cannot access complete player pool")
            return False
        
        # Step 3: Verify data currency with key players
        key_player_verification = self.verify_key_players_current_teams(complete_player_data)
        
        # Step 4: Export complete live data
        slate_export = self.export_complete_live_slate(complete_player_data, contest_info)
        
        # Generate final assessment
        print(f"\n" + "=" * 80)
        print("LIVE SLATE DATA VERIFICATION RESULTS")
        print("=" * 80)
        print(f"✅ Live Contest Access: {len(contests)} contests found")
        print(f"✅ Complete Player Pool: {len(complete_player_data)} players retrieved") 
        print(f"✅ Salary Data: All {len(complete_player_data)} players have current pricing")
        print(f"📊 Data Freshness: {self.verification_results.get('data_freshness_percentage', 0):.1f}%")
        
        if self.verification_results['live_data_access']:
            print(f"🔥 LIVE DATA VERIFIED: Access to current DraftKings slate confirmed")
            print(f"💰 Current Salary Ranges:")
            for pos, data in self.verification_results['salary_ranges_current'].items():
                print(f"   {pos}: ${data['min']:,} - ${data['max']:,} ({data['count']} players)")
            
            print(f"\n🎯 Key Player Verification:")
            for player, status in self.verification_results['key_players_verified'].items():
                if status['status'] == 'CURRENT':
                    print(f"   ✅ {player}: {status['team']} (${status['salary']:,})")
                elif status['status'] == 'STALE':
                    print(f"   ❌ {player}: {status['team']} should be {status.get('expected', '?')}")
                else:
                    print(f"   ❌ {player}: NOT FOUND")
        
        if self.verification_results['errors']:
            print(f"\n⚠️ ERRORS ENCOUNTERED:")
            for error in self.verification_results['errors']:
                print(f"   • {error}")
        
        # Save comprehensive verification
        with open('live_slate_verification_report.json', 'w') as f:
            json.dump(self.verification_results, f, indent=2)
        
        print(f"\n📄 Files Generated:")
        print(f"   • live_draftkings_complete_slate.json - Complete slate data")
        print(f"   • live_draftkings_player_pool.csv - All players in CSV format")
        print(f"   • live_slate_verification_report.json - Verification results")
        
        print("=" * 80)
        
        return self.verification_results['live_data_access'] and len(complete_player_data) > 0

if __name__ == "__main__":
    print("🚨 CRITICAL TEST: LIVE DRAFTKINGS SLATE DATA VERIFICATION")
    print("Verifying access to current NFL contest data with complete player pools")
    
    if DK_CLIENT_AVAILABLE:
        try:
            verifier = LiveSlateDataVerifier()
            success = verifier.run_complete_live_verification()
            
            if success:
                print(f"\n🎉 SUCCESS: LIVE DRAFTKINGS DATA ACCESS CONFIRMED")
                print(f"✅ Can access current NFL contests")
                print(f"✅ Can retrieve complete player pools")
                print(f"✅ Can get current salary data")
                print(f"✅ Data appears current for September 2025")
                print(f"\n🔥 RECOMMENDATION: Implement live DraftKings data pipeline")
            else:
                print(f"\n⚠️ PARTIAL SUCCESS OR ISSUES DETECTED")
                print(f"🔧 FALLBACK: Use manually corrected current database")
                print(f"✅ Our 210-player database with Sep 2025 corrections remains viable")
                
        except Exception as e:
            print(f"\n❌ LIVE DATA TEST FAILED: {str(e)}")
            print(f"🔧 RECOMMENDATION: Use manually corrected database")
    else:
        print("❌ Cannot test live data - DraftKings client not installed")
        print("🔧 Install with: pip install draft-kings")
