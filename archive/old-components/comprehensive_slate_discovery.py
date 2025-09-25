#!/usr/bin/env python3
"""
COMPREHENSIVE SLATE DISCOVERY SYSTEM
Using all available MCP methods for maximum slate coverage
"""

import requests
import json
import ssl
import urllib3
from datetime import datetime
import time

# Fix SSL issues
urllib3.disable_warnings()
ssl._create_default_https_context = ssl._create_unverified_context

class ComprehensiveSlateDiscovery:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.draftkings.com/',
            'Origin': 'https://www.draftkings.com'
        }
        
    def method_1_dk_api_comprehensive(self):
        """Method 1: DK API with comprehensive parameters"""
        print("🔍 METHOD 1: DK API COMPREHENSIVE DISCOVERY")
        print("=" * 60)
        
        results = {'method': 'dk_api_comprehensive', 'timestamp': datetime.now().isoformat()}
        
        # Test all sports
        sports = ['NFL', 'NBA', 'MLB', 'NHL', 'PGA', 'WNBA', 'SOCCER']
        
        for sport in sports:
            try:
                url = f'https://www.draftkings.com/lobby/getcontests?sport={sport}'
                response = requests.get(url, headers=self.headers, verify=False, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    contests = data.get('Contests', [])
                    
                    # Extract unique draft groups
                    draft_groups = {}
                    for contest in contests[:100]:  # First 100 to analyze
                        dg_id = contest.get('dg')
                        if dg_id and dg_id not in draft_groups:
                            draft_groups[dg_id] = {
                                'name': contest.get('n', 'Unknown')[:50],
                                'entry': contest.get('a', 0),
                                'prizes': contest.get('po', 0),
                                'start': contest.get('sdstring', 'Unknown')
                            }
                    
                    results[sport] = {
                        'total_contests': len(contests),
                        'unique_slates': len(draft_groups),
                        'sample_slates': list(draft_groups.items())[:5]
                    }
                    
                    print(f"✅ {sport}: {len(contests)} contests, {len(draft_groups)} unique slates")
                else:
                    results[sport] = {'error': f'HTTP {response.status_code}'}
                    print(f"❌ {sport}: Status {response.status_code}")
                    
            except Exception as e:
                results[sport] = {'error': str(e)}
                print(f"❌ {sport}: {str(e)[:50]}...")
        
        return results
    
    def method_2_multi_site_discovery(self):
        """Method 2: Multi-site comprehensive discovery"""
        print("\n🌐 METHOD 2: MULTI-SITE COMPREHENSIVE DISCOVERY")  
        print("=" * 60)
        
        results = {'method': 'multi_site_comprehensive', 'timestamp': datetime.now().isoformat()}
        
        # Test multiple DFS sites
        sites = {
            'DraftKings': 'https://www.draftkings.com/lobby/getcontests?sport=NFL',
            'FanDuel': 'https://www.fanduel.com/api/contests?sport=NFL',  # May need different endpoint
            'SuperDraft': 'https://superdraft.com/api/contests?sport=NFL',  # May need different endpoint
        }
        
        for site_name, url in sites.items():
            try:
                print(f"Testing {site_name}...")
                response = requests.get(url, headers=self.headers, verify=False, timeout=15)
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if site_name == 'DraftKings':
                            contest_count = len(data.get('Contests', []))
                        else:
                            # Try to find contest count in different structures
                            contest_count = len(data) if isinstance(data, list) else len(data.get('contests', data.get('data', [])))
                        
                        results[site_name] = {
                            'status': 'SUCCESS',
                            'contest_count': contest_count,
                            'data_structure': list(data.keys()) if isinstance(data, dict) else 'array'
                        }
                        print(f"✅ {site_name}: {contest_count} contests")
                        
                    except json.JSONDecodeError:
                        results[site_name] = {'status': 'JSON_ERROR', 'response_length': len(response.text)}
                        print(f"❌ {site_name}: Invalid JSON")
                else:
                    results[site_name] = {'status': f'HTTP_{response.status_code}'}
                    print(f"❌ {site_name}: Status {response.status_code}")
                    
            except Exception as e:
                results[site_name] = {'status': 'ERROR', 'error': str(e)}
                print(f"❌ {site_name}: {str(e)[:50]}...")
        
        return results
    
    def method_3_comprehensive_aggregator(self):
        """Method 3: Create comprehensive slate aggregator"""
        print("\n🔄 METHOD 3: COMPREHENSIVE SLATE AGGREGATOR")
        print("=" * 60)
        
        results = {'method': 'comprehensive_aggregator', 'timestamp': datetime.now().isoformat()}
        
        # Combine all working sources
        all_slates = []
        total_contests = 0
        
        # Source 1: DraftKings comprehensive
        dk_results = self.method_1_dk_api_comprehensive()
        for sport, data in dk_results.items():
            if isinstance(data, dict) and 'total_contests' in data:
                total_contests += data['total_contests']
                
                # Convert to unified format
                for slate_id, slate_info in data.get('sample_slates', []):
                    unified_slate = {
                        'slate_id': f'dk_{slate_id}',
                        'source': 'DraftKings',
                        'sport': sport,
                        'name': slate_info['name'],
                        'entry_fee': slate_info['entry'],
                        'total_prizes': slate_info['prizes'],
                        'start_time': slate_info['start']
                    }
                    all_slates.append(unified_slate)
        
        results['aggregated_data'] = {
            'total_contests_analyzed': total_contests,
            'unique_slates_found': len(all_slates),
            'sources_integrated': ['DraftKings'],
            'sample_slates': all_slates[:10]
        }
        
        print(f"📊 AGGREGATION RESULTS:")
        print(f"   Total contests: {total_contests:,}")
        print(f"   Unique slates: {len(all_slates)}")
        
        # Save comprehensive results
        with open('comprehensive_slate_discovery.json', 'w') as f:
            json.dump({
                'dk_comprehensive': dk_results,
                'aggregated_results': results,
                'discovery_timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        return results
    
    def run_all_methods(self):
        """Run all comprehensive discovery methods"""
        print("🚀 COMPREHENSIVE SLATE DISCOVERY - ALL METHODS")
        print("=" * 80)
        
        all_results = {
            'discovery_session': datetime.now().isoformat(),
            'methods_tested': 3,
            'total_coverage': {}
        }
        
        # Method 1: DK API Comprehensive
        dk_results = self.method_1_dk_api_comprehensive()
        all_results['dk_comprehensive'] = dk_results
        
        # Method 2: Multi-site Discovery
        multi_site_results = self.method_2_multi_site_discovery()
        all_results['multi_site'] = multi_site_results
        
        # Method 3: Comprehensive Aggregator
        aggregator_results = self.method_3_comprehensive_aggregator()
        all_results['comprehensive_aggregator'] = aggregator_results
        
        print(f"\n📈 COMPREHENSIVE COVERAGE SUMMARY:")
        print("=" * 60)
        
        # Calculate total coverage
        total_contests = 0
        total_unique_slates = 0
        
        for method, data in all_results.items():
            if isinstance(data, dict):
                if 'NFL' in data and 'total_contests' in data['NFL']:
                    contests = data['NFL']['total_contests']
                    slates = data['NFL']['unique_slates']
                    total_contests += contests
                    total_unique_slates += slates
                    print(f"  {method}: {contests:,} contests, {slates} slates")
        
        print(f"\n🏆 TOTAL COMPREHENSIVE COVERAGE:")
        print(f"  📊 Total contests discovered: {total_contests:,}")
        print(f"  🎯 Unique slates identified: {total_unique_slates}")
        
        # Save complete results
        with open('COMPREHENSIVE_DISCOVERY_COMPLETE.json', 'w') as f:
            json.dump(all_results, f, indent=2)
        
        return all_results

if __name__ == "__main__":
    discovery = ComprehensiveSlateDiscovery()
    results = discovery.run_all_methods()
    print(f"\n✅ Results saved to COMPREHENSIVE_DISCOVERY_COMPLETE.json")
