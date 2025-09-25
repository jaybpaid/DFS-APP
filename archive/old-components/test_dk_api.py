#!/usr/bin/env python3
"""
Test DraftKings API endpoints
"""
import requests
import json
import sys
from datetime import datetime

def test_draftkings_endpoints():
    """Test DraftKings API endpoints"""
    endpoints = {
        "contests_nfl": "https://www.draftkings.com/lobby/getcontests?sport=NFL",
        "contests_nba": "https://www.draftkings.com/lobby/getcontests?sport=NBA",
        "draftables_example": "https://api.draftkings.com/draftgroups/v1/draftgroups/46589/draftables",
        "gametypes": "https://api.draftkings.com/lineups/v1/gametypes/1/rules"
    }
    
    results = {}
    
    print("Testing DraftKings API endpoints...")
    print("=" * 50)
    
    for name, url in endpoints.items():
        print(f"\nTesting {name}: {url}")
        try:
            start_time = datetime.now()
            response = requests.get(url, timeout=10)
            elapsed = (datetime.now() - start_time).total_seconds()
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    results[name] = {
                        "status": "success",
                        "status_code": response.status_code,
                        "response_time": elapsed,
                        "data_type": type(data).__name__,
                        "sample_data": str(data)[:200] + "..." if len(str(data)) > 200 else str(data)
                    }
                    print(f"  ✓ Success ({elapsed:.2f}s): {len(str(data))} chars")
                except json.JSONDecodeError:
                    results[name] = {
                        "status": "error",
                        "status_code": response.status_code,
                        "response_time": elapsed,
                        "error": "Invalid JSON response"
                    }
                    print(f"  ✗ Invalid JSON response")
            else:
                results[name] = {
                    "status": "error",
                    "status_code": response.status_code,
                    "response_time": elapsed,
                    "error": f"HTTP {response.status_code}"
                }
                print(f"  ✗ HTTP {response.status_code}")
                
        except requests.exceptions.Timeout:
            results[name] = {
                "status": "timeout",
                "error": "Request timed out"
            }
            print(f"  ✗ Timeout")
        except Exception as e:
            results[name] = {
                "status": "error",
                "error": str(e)
            }
            print(f"  ✗ Error: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("SUMMARY:")
    success_count = sum(1 for r in results.values() if r['status'] == 'success')
    print(f"Total endpoints tested: {len(results)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {len(results) - success_count}")
    
    return results

if __name__ == "__main__":
    results = test_draftkings_endpoints()
    print("\nDetailed results:")
    for name, result in results.items():
        print(f"\n{name}:")
        for key, value in result.items():
            print(f"  {key}: {value}")
