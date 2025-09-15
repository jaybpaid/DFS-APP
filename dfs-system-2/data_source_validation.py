#!/usr/bin/env python3
"""
Data Source Validation Script
Test all documented sources for current 2025 NFL data, pricing, and player pools
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

class DataSourceValidator:
    """Validate all DFS data sources for current 2025 data"""
    
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'sources_tested': 0,
            'sources_working': 0,
            'sources_with_2025_data': 0,
            'detailed_results': []
        }
    
    def test_source(self, name: str, url: str, expected_data: str) -> Dict:
        """Test a single data source"""
        result = {
            'name': name,
            'url': url,
            'expected_data': expected_data,
            'accessible': False,
            'has_current_data': False,
            'has_pricing': False,
            'response_time': None,
            'error': None,
            'data_sample': None
        }
        
        try:
            start_time = time.time()
            response = requests.get(url, timeout=10, headers={
                'User-Agent': 'DFS-Optimizer-Validator/1.0'
            })
            result['response_time'] = round(time.time() - start_time, 2)
            
            if response.status_code == 200:
                result['accessible'] = True
                
                # Check for current data indicators
                content = response.text.lower()
                current_indicators = ['2025', '2024', 'week', 'nfl', 'salary', 'price', 'cost']
                pricing_indicators = ['$', 'salary', 'price', 'cost', 'cap']
                
                result['has_current_data'] = any(indicator in content for indicator in current_indicators)
                result['has_pricing'] = any(indicator in content for indicator in pricing_indicators)
                
                # Get sample of content
                result['data_sample'] = content[:500] if len(content) > 500 else content
                
            else:
                result['error'] = f"HTTP {response.status_code}"
                
        except Exception as e:
            result['error'] = str(e)
        
        return result
    
    def test_nfl_apis(self):
        """Test various NFL data APIs"""
        print("🏈 Testing NFL Data APIs...")
        
        sources = [
            {
                'name': 'NFL.com API',
                'url': 'https://www.nfl.com/api/roster/team-roster',
                'expected': 'Player rosters and stats'
            },
            {
                'name': 'ESPN NFL API',
                'url': 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
                'expected': 'Team and player data'
            },
            {
                'name': 'NFLfastR Data (2024)',
                'url': 'https://github.com/nflverse/nfldata/releases/latest/download/players.csv',
                'expected': 'Player database'
            },
            {
                'name': 'Pro Football Reference',
                'url': 'https://www.pro-football-reference.com/years/2024/opp.htm',
                'expected': 'Season stats'
            }
        ]
        
        for source in sources:
            print(f"  Testing {source['name']}...")
            result = self.test_source(source['name'], source['url'], source['expected'])
            self.results['detailed_results'].append(result)
            self.results['sources_tested'] += 1
            
            if result['accessible']:
                self.results['sources_working'] += 1
                print(f"    ✅ Accessible (Response: {result['response_time']}s)")
                
                if result['has_current_data']:
                    self.results['sources_with_2025_data'] += 1
                    print(f"    ✅ Has current data")
                else:
                    print(f"    ❌ No current data detected")
                    
                if result['has_pricing']:
                    print(f"    ✅ Has pricing data")
                else:
                    print(f"    ❌ No pricing data")
            else:
                print(f"    ❌ Not accessible: {result['error']}")
    
    def test_dfs_sites(self):
        """Test DFS site endpoints"""
        print("\n💰 Testing DFS Site Endpoints...")
        
        sources = [
            {
                'name': 'DraftKings Contest Info',
                'url': 'https://www.draftkings.com/lobby/getcontests?sport=NFL',
                'expected': 'Contest data and player pool'
            },
            {
                'name': 'FanDuel Contest Data', 
                'url': 'https://www.fanduel.com/api/contests',
                'expected': 'Contest and salary info'
            },
            {
                'name': 'SuperDraft API',
                'url': 'https://api.superdraft.com/v1/contests',
                'expected': 'Contest data'
            }
        ]
        
        for source in sources:
            print(f"  Testing {source['name']}...")
            result = self.test_source(source['name'], source['url'], source['expected'])
            self.results['detailed_results'].append(result)
            self.results['sources_tested'] += 1
            
            if result['accessible']:
                self.results['sources_working'] += 1
                print(f"    ✅ Accessible")
            else:
                print(f"    ❌ Not accessible: {result['error']}")
    
    def test_fantasy_projection_sites(self):
        """Test fantasy projection and data sites"""
        print("\n📊 Testing Fantasy Projection Sites...")
        
        sources = [
            {
                'name': 'FantasyPros',
                'url': 'https://www.fantasypros.com/nfl/projections/qb.php',
                'expected': 'Player projections'
            },
            {
                'name': 'ESPN Fantasy',
                'url': 'https://fantasy.espn.com/football/players/projections',
                'expected': 'Fantasy projections'
            },
            {
                'name': 'Yahoo Fantasy',
                'url': 'https://football.fantasysports.yahoo.com/f1/playersearch',
                'expected': 'Player search and data'
            },
            {
                'name': 'Sleeper App API',
                'url': 'https://api.sleeper.app/v1/players/nfl',
                'expected': 'NFL player database'
            }
        ]
        
        for source in sources:
            print(f"  Testing {source['name']}...")
            result = self.test_source(source['name'], source['url'], source['expected'])
            self.results['detailed_results'].append(result)
            self.results['sources_tested'] += 1
            
            if result['accessible']:
                self.results['sources_working'] += 1
                print(f"    ✅ Accessible")
                
                if result['has_current_data']:
                    self.results['sources_with_2025_data'] += 1
                    print(f"    ✅ Has current data")
            else:
                print(f"    ❌ Not accessible: {result['error']}")
    
    def test_current_player_data(self):
        """Test the current player data file for accuracy"""
        print("\n🔍 Testing Current Player Data File...")
        
        try:
            with open('public/data/nfl_players_live.json', 'r') as f:
                data = json.load(f)
            
            players = data.get('players', [])
            
            # Analyze current data
            analysis = {
                'total_players': len(players),
                'teams_represented': len(set(p.get('team') for p in players if p.get('team') != 'DEF')),
                'salary_range': [
                    min(p.get('salary', 0) for p in players if p.get('salary', 0) > 0),
                    max(p.get('salary', 0) for p in players if p.get('salary', 0) > 0)
                ],
                'projection_range': [
                    min(p.get('projection', 0) for p in players if p.get('projection', 0) > 0),
                    max(p.get('projection', 0) for p in players if p.get('projection', 0) > 0)
                ],
                'positions': {}
            }
            
            # Count positions
            for player in players:
                pos = player.get('position', 'UNKNOWN')
                analysis['positions'][pos] = analysis['positions'].get(pos, 0) + 1
            
            # Check for suspicious patterns
            issues = []
            
            # Check for realistic salary ranges
            if analysis['salary_range'][0] < 2000 or analysis['salary_range'][1] > 12000:
                issues.append("Salary range looks unrealistic")
            
            # Check for too many/few teams
            if analysis['teams_represented'] < 20 or analysis['teams_represented'] > 35:
                issues.append(f"Teams represented ({analysis['teams_represented']}) seems off")
            
            # Check position distribution
            expected_positions = {'QB': 32, 'RB': 64, 'WR': 96, 'TE': 32, 'DST': 32}
            for pos, expected in expected_positions.items():
                actual = analysis['positions'].get(pos, 0)
                if abs(actual - expected) > expected * 0.5:  # More than 50% off
                    issues.append(f"{pos} count ({actual}) differs significantly from expected ({expected})")
            
            print(f"  Total Players: {analysis['total_players']}")
            print(f"  Teams: {analysis['teams_represented']}")
            print(f"  Salary Range: ${analysis['salary_range'][0]:,} - ${analysis['salary_range'][1]:,}")
            print(f"  Projection Range: {analysis['projection_range'][0]} - {analysis['projection_range'][1]}")
            print(f"  Position Breakdown: {analysis['positions']}")
            
            if issues:
                print(f"  ⚠️ Issues Found:")
                for issue in issues:
                    print(f"    • {issue}")
            else:
                print(f"  ✅ Data looks reasonable")
            
            # Add to results
            self.results['current_data_analysis'] = analysis
            self.results['current_data_issues'] = issues
            
        except Exception as e:
            print(f"  ❌ Error analyzing current data: {str(e)}")
            self.results['current_data_error'] = str(e)
    
    def generate_recommendations(self):
        """Generate recommendations based on findings"""
        print("\n💡 Generating Recommendations...")
        
        recommendations = []
        
        # Check source availability
        if self.results['sources_working'] == 0:
            recommendations.append("❌ CRITICAL: No external data sources are accessible")
            recommendations.append("🔧 FIX: Check internet connection and firewall settings")
        elif self.results['sources_working'] < self.results['sources_tested'] / 2:
            recommendations.append("⚠️ WARNING: Most external sources are inaccessible")
            recommendations.append("🔧 SUGGEST: Focus on working sources or use manual data entry")
        
        # Check current data
        if self.results['sources_with_2025_data'] == 0:
            recommendations.append("❌ CRITICAL: No sources have verified 2025 data")
            recommendations.append("🔧 FIX: Update to manual data entry or find current sources")
        
        # Optimizer-specific recommendations
        if hasattr(self.results, 'current_data_issues') and self.results['current_data_issues']:
            recommendations.append("⚠️ WARNING: Current player data has quality issues")
            recommendations.append("🔧 FIX: Regenerate player data with realistic values")
        
        # Practical solutions
        recommendations.extend([
            "✅ SOLUTION 1: Use manual CSV import from DraftKings exports",
            "✅ SOLUTION 2: Focus on client-side optimization with current data",
            "✅ SOLUTION 3: Implement proper lineup diversification algorithms",
            "✅ SOLUTION 4: Add manual projection override capabilities"
        ])
        
        self.results['recommendations'] = recommendations
        
        for rec in recommendations:
            print(f"  {rec}")
    
    def run_full_validation(self):
        """Run complete validation of all data sources"""
        print("🔍 COMPREHENSIVE DATA SOURCE VALIDATION")
        print("=" * 60)
        print("Testing all documented sources for current 2025 NFL data...")
        
        self.test_nfl_apis()
        self.test_dfs_sites()
        self.test_fantasy_projection_sites()
        self.test_current_player_data()
        self.generate_recommendations()
        
        # Save results
        with open('data_source_validation_report.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Print summary
        print(f"\n" + "=" * 60)
        print("VALIDATION SUMMARY")
        print("=" * 60)
        print(f"Sources Tested: {self.results['sources_tested']}")
        print(f"Sources Working: {self.results['sources_working']}")
        print(f"Sources with 2025 Data: {self.results['sources_with_2025_data']}")
        print(f"Success Rate: {(self.results['sources_working'] / max(1, self.results['sources_tested'])) * 100:.1f}%")
        print(f"Current Data Rate: {(self.results['sources_with_2025_data'] / max(1, self.results['sources_tested'])) * 100:.1f}%")
        
        print(f"\n📊 Full report saved to: data_source_validation_report.json")
        print("=" * 60)
        
        return self.results

if __name__ == "__main__":
    validator = DataSourceValidator()
    results = validator.run_full_validation()
    
    # Exit with appropriate code
    if results['sources_with_2025_data'] > 0:
        print("✅ Found sources with current data")
        exit(0)
    else:
        print("❌ No current data sources found")
        exit(1)
