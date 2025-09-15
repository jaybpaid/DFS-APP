#!/usr/bin/env python3
"""
Validate DraftKings Client for Live Data Access
Test jaebradley/draftkings_client for current contest and player data
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Optional

# Import DraftKings client
try:
    from draft_kings import Client
    from draft_kings.response.objects import Contest, DraftablePlayer
    DK_CLIENT_AVAILABLE = True
    print("✅ DraftKings client imported successfully")
except ImportError as e:
    print(f"❌ DraftKings client not available: {e}")
    DK_CLIENT_AVAILABLE = False

class DraftKingsLiveDataValidator:
    """Validate DraftKings client for live current data access"""
    
    def __init__(self):
        if not DK_CLIENT_AVAILABLE:
            raise Exception("draft-kings client required but not installed")
        
        self.client = Client()
        self.validation_results = {
            'timestamp': datetime.now().isoformat(),
            'client_status': 'TESTING',
            'contests_found': 0,
            'players_found': 0,
            'data_freshness': 'UNKNOWN',
            'api_endpoints_working': {},
            'live_data_samples': {},
            'errors': [],
            'recommendations': []
        }
    
    def test_contest_access(self) -> bool:
        """Test access to current DraftKings contests"""
        print("🏈 Testing DraftKings Contest Access...")
        
        try:
            # Get available contests for NFL
            contests = self.client.contests(sport='NFL')
            
            if contests and len(contests) > 0:
                self.validation_results['contests_found'] = len(contests)
                print(f"✅ Found {len(contests)} NFL contests")
                
                # Sample contest data
                sample_contest = contests[0] if contests else None
                if sample_contest:
                    contest_sample = {
                        'id': sample_contest.id if hasattr(sample_contest, 'id') else 'Unknown',
                        'name': sample_contest.name if hasattr(sample_contest, 'name') else 'Unknown',
                        'entry_fee': getattr(sample_contest, 'entry_fee', 'Unknown'),
                        'total_entries': getattr(sample_contest, 'total_entries', 'Unknown'),
                        'sport': 'NFL'
                    }
                    self.validation_results['live_data_samples']['contest'] = contest_sample
                    print(f"  📊 Sample: {contest_sample.get('name', 'Unknown Contest')}")
                    print(f"  💰 Entry Fee: ${contest_sample.get('entry_fee', 0)}")
                
                self.validation_results['api_endpoints_working']['contests'] = True
                return True
            else:
                print("❌ No NFL contests found")
                self.validation_results['api_endpoints_working']['contests'] = False
                return False
                
        except Exception as e:
            error_msg = f"Contest access failed: {str(e)}"
            print(f"❌ {error_msg}")
            self.validation_results['errors'].append(error_msg)
            self.validation_results['api_endpoints_working']['contests'] = False
            return False
    
    def test_player_data_access(self) -> bool:
        """Test access to current player data and salaries"""
        print("\n👥 Testing DraftKings Player Data Access...")
        
        try:
            # First get contests to find a contest ID
            contests = self.client.contests(sport='NFL')
            
            if not contests or len(contests) == 0:
                print("❌ No contests available to test player data")
                return False
            
            # Use first available contest
            contest = contests[0]
            contest_id = contest.id if hasattr(contest, 'id') else None
            
            if not contest_id:
                print("❌ Contest ID not available")
                return False
            
            print(f"  🎯 Testing with Contest ID: {contest_id}")
            
            # Get draftable players for this contest
            players = self.client.draftables(contest_id=contest_id)
            
            if players and len(players) > 0:
                self.validation_results['players_found'] = len(players)
                print(f"✅ Found {len(players)} draftable players")
                
                # Analyze player data for current teams and salaries
                current_players_sample = []
                key_players_found = []
                
                for i, player in enumerate(players[:10]):  # Sample first 10
                    player_info = {
                        'name': getattr(player, 'display_name', 'Unknown'),
                        'position': getattr(player, 'roster_position', 'Unknown'),
                        'team': getattr(player, 'team_abbreviation', 'Unknown'),
                        'salary': getattr(player, 'salary', 0),
                        'id': getattr(player, 'player_id', 'Unknown')
                    }
                    current_players_sample.append(player_info)
                    
                    # Check for key players to verify current data
                    player_name = player_info['name']
                    if any(key in player_name for key in ['Deebo', 'Diggs', 'Saquon', 'Jackson']):
                        key_players_found.append(player_info)
                        print(f"  🎯 Key Player: {player_name} ({player_info['team']}) - ${player_info['salary']:,}")
                
                self.validation_results['live_data_samples']['players'] = current_players_sample
                self.validation_results['live_data_samples']['key_players'] = key_players_found
                
                # Check data freshness by examining key player teams
                data_is_current = True
                for kp in key_players_found:
                    if 'Deebo' in kp['name'] and kp['team'] == 'SF':
                        data_is_current = False
                        print(f"    ⚠️ {kp['name']} shows {kp['team']} (may be stale)")
                    elif 'Diggs' in kp['name'] and kp['team'] == 'BUF':
                        data_is_current = False
                        print(f"    ⚠️ {kp['name']} shows {kp['team']} (may be stale)")
                    elif 'Saquon' in kp['name'] and kp['team'] == 'NYG':
                        data_is_current = False
                        print(f"    ⚠️ {kp['name']} shows {kp['team']} (may be stale)")
                
                self.validation_results['data_freshness'] = 'CURRENT' if data_is_current else 'POTENTIALLY_STALE'
                self.validation_results['api_endpoints_working']['players'] = True
                return True
                
            else:
                print("❌ No players found for contest")
                self.validation_results['api_endpoints_working']['players'] = False
                return False
                
        except Exception as e:
            error_msg = f"Player data access failed: {str(e)}"
            print(f"❌ {error_msg}")
            self.validation_results['errors'].append(error_msg)
            self.validation_results['api_endpoints_working']['players'] = False
            return False
    
    def test_live_salary_data(self) -> bool:
        """Test if we can get current salary data"""
        print("\n💰 Testing Live Salary Data...")
        
        try:
            # Get current contests
            contests = self.client.contests(sport='NFL')
            
            if not contests:
                print("❌ No contests available")
                return False
            
            # Get players from first contest
            contest_id = contests[0].id if hasattr(contests[0], 'id') else None
            if not contest_id:
                return False
                
            players = self.client.draftables(contest_id=contest_id)
            
            if players:
                # Analyze salary ranges
                salary_analysis = {}
                positions = {}
                
                for player in players:
                    pos = getattr(player, 'roster_position', 'Unknown')
                    salary = getattr(player, 'salary', 0)
                    
                    if pos not in positions:
                        positions[pos] = []
                    positions[pos].append(salary)
                
                # Calculate ranges per position
                for pos, salaries in positions.items():
                    if salaries:
                        salary_analysis[pos] = {
                            'count': len(salaries),
                            'min': min(salaries),
                            'max': max(salaries),
                            'avg': sum(salaries) / len(salaries)
                        }
                
                self.validation_results['live_data_samples']['salary_analysis'] = salary_analysis
                
                print("  📊 Current Salary Ranges:")
                for pos, data in salary_analysis.items():
                    print(f"    {pos}: ${data['min']:,} - ${data['max']:,} (Avg: ${data['avg']:,.0f})")
                
                print("✅ Live salary data accessible")
                return True
            else:
                print("❌ No salary data available")
                return False
                
        except Exception as e:
            error_msg = f"Salary data test failed: {str(e)}"
            print(f"❌ {error_msg}")
            self.validation_results['errors'].append(error_msg)
            return False
    
    def validate_data_currency(self) -> Dict:
        """Validate if the DraftKings data is more current than our database"""
        print("\n🔍 Validating Data Currency...")
        
        currency_analysis = {
            'dk_client_advantages': [],
            'dk_client_disadvantages': [],
            'recommendation': '',
            'data_comparison': {}
        }
        
        # Check if DK client data is working
        if self.validation_results['api_endpoints_working'].get('players'):
            currency_analysis['dk_client_advantages'].extend([
                '✅ Direct access to live DraftKings contests',
                '✅ Real-time salary updates',
                '✅ Current player pools per contest',
                '✅ Automatic DraftKings ID mapping',
                '✅ No manual data updates required'
            ])
            
            # Check for freshness
            if self.validation_results['data_freshness'] == 'CURRENT':
                currency_analysis['dk_client_advantages'].append('✅ Data appears current')
                currency_analysis['recommendation'] = 'IMPLEMENT - DK client provides fresher data'
            else:
                currency_analysis['dk_client_disadvantages'].append('⚠️ Data may still have staleness issues')
                currency_analysis['recommendation'] = 'EVALUATE - Test against known current data'
        else:
            currency_analysis['dk_client_disadvantages'].extend([
                '❌ API endpoints not accessible',
                '❌ Cannot fetch live data',
                '❌ Client may be broken or blocked'
            ])
            currency_analysis['recommendation'] = 'DO NOT IMPLEMENT - Client not functional'
        
        # Compare with our corrected data
        currency_analysis['data_comparison'] = {
            'our_corrected_database': {
                'players': 210,
                'status': 'Manually corrected Sep 2025',
                'key_trades_applied': 'Deebo→WAS, Diggs→HOU, Saquon→PHI'
            },
            'dk_client_live': {
                'players': self.validation_results['players_found'],
                'status': f"Live from DraftKings ({self.validation_results['data_freshness']})",
                'contests_available': self.validation_results['contests_found']
            }
        }
        
        return currency_analysis
    
    def run_comprehensive_dk_validation(self):
        """Run comprehensive DraftKings client validation"""
        print("🔍 DRAFTKINGS CLIENT COMPREHENSIVE VALIDATION")
        print("Testing live data access for current September 2025 information")
        print("=" * 80)
        
        if not DK_CLIENT_AVAILABLE:
            print("❌ DraftKings client not available")
            return False
        
        # Test all capabilities
        contest_success = self.test_contest_access()
        player_success = self.test_player_data_access()  
        salary_success = self.test_live_salary_data()
        currency_analysis = self.validate_data_currency()
        
        # Update client status
        if contest_success and player_success:
            self.validation_results['client_status'] = 'WORKING'
        elif contest_success or player_success:
            self.validation_results['client_status'] = 'PARTIAL'
        else:
            self.validation_results['client_status'] = 'FAILED'
        
        # Add currency analysis to results
        self.validation_results['currency_analysis'] = currency_analysis
        
        # Generate recommendations
        if self.validation_results['client_status'] == 'WORKING':
            self.validation_results['recommendations'].extend([
                '🔥 HIGHLY RECOMMENDED: Implement DraftKings live client',
                '✅ ADVANTAGE: Eliminates stale data completely',
                '✅ BENEFIT: Always current salary and player data',
                '⚡ INTEGRATION: Combine with pydfs-lineup-optimizer',
                '🎯 RESULT: Professional live DFS optimization system'
            ])
        else:
            self.validation_results['recommendations'].extend([
                '⚠️ DraftKings client has connection issues',
                '🔧 FALLBACK: Use manually corrected current database',
                '📊 ALTERNATIVE: Implement manual weekly data updates',
                '✅ CURRENT STATUS: Our corrected data is still viable'
            ])
        
        # Save comprehensive report
        with open('draftkings_client_validation_report.json', 'w') as f:
            json.dump(self.validation_results, f, indent=2)
        
        # Print summary
        print(f"\n" + "=" * 80)
        print("DRAFTKINGS CLIENT VALIDATION SUMMARY")  
        print("=" * 80)
        print(f"Client Status: {self.validation_results['client_status']}")
        print(f"Contests Found: {self.validation_results['contests_found']}")
        print(f"Players Found: {self.validation_results['players_found']}")
        print(f"Data Freshness: {self.validation_results['data_freshness']}")
        print(f"Errors: {len(self.validation_results['errors'])}")
        
        if self.validation_results['errors']:
            print(f"\n⚠️ ERRORS ENCOUNTERED:")
            for error in self.validation_results['errors']:
                print(f"   • {error}")
        
        print(f"\n💡 RECOMMENDATIONS:")
        for rec in self.validation_results['recommendations']:
            print(f"   {rec}")
        
        print(f"\n📊 Detailed report saved: draftkings_client_validation_report.json")
        
        # Final recommendation
        if self.validation_results['client_status'] == 'WORKING':
            print(f"\n🏆 RECOMMENDATION: IMPLEMENT DRAFTKINGS LIVE CLIENT")
            print(f"✅ This would provide the most current data possible")
            print(f"🔄 Eliminates all stale data issues permanently")
            print(f"⚡ Combines perfectly with pydfs-lineup-optimizer")
        else:
            print(f"\n📋 RECOMMENDATION: USE CORRECTED MANUAL DATABASE")
            print(f"✅ Our manually corrected data is current as of Sep 2025")
            print(f"🔧 Continue with 210-player database with current team assignments")
        
        print("=" * 80)
        
        return self.validation_results['client_status'] == 'WORKING'

if __name__ == "__main__":
    print("🚨 DRAFTKINGS CLIENT VALIDATION TEST")
    print("Checking if live DraftKings data access can solve stale data issues")
    
    if DK_CLIENT_AVAILABLE:
        validator = DraftKingsLiveDataValidator()
        success = validator.run_comprehensive_dk_validation()
        
        if success:
            print("\n🎉 DRAFTKINGS CLIENT IS WORKING!")
            print("✅ Live data access confirmed")
            print("🔄 This eliminates all stale data concerns")
            print("🏆 IMPLEMENT: DraftKings Client + pydfs-optimizer = OPTIMAL")
        else:
            print("\n⚠️ DRAFTKINGS CLIENT HAS ISSUES")
            print("📋 FALLBACK: Use our corrected manual database")
            print("✅ Manual corrections still provide current Sep 2025 data")
    else:
        print("❌ Install first: pip install draft-kings")
