#!/usr/bin/env python3
"""
Test Alternative DraftKings Data Sources
Tests Fantasy Nerds, ESPN, and web scraping approaches
"""

import requests
import json
from datetime import datetime

print('🔍 TESTING ALTERNATIVE DRAFTKINGS DATA SOURCES')
print('=' * 60)

# Test Fantasy Nerds API for DraftKings data
print('\n1. Testing Fantasy Nerds API (DraftKings salaries)...')
try:
    # Test their free tier
    response = requests.get('https://api.fantasynerds.com/v1/nfl/draftkings', timeout=10)
    if response.status_code == 200:
        data = response.json()
        print(f'   ✅ Fantasy Nerds: Working - {len(data) if isinstance(data, list) else "Data received"}')
        if isinstance(data, list) and data:
            player = data[0]
            print(f'   📊 Sample: {player.get("name", "Unknown")} - ${player.get("salary", 0)}')
    else:
        print(f'   ❌ Fantasy Nerds: HTTP {response.status_code}')
except Exception as e:
    print(f'   ❌ Fantasy Nerds: {str(e)[:50]}...')

# Test ESPN for DraftKings-style data
print('\n2. Testing ESPN Scoreboard API...')
try:
    response = requests.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard', timeout=10)
    if response.status_code == 200:
        data = response.json()
        events = data.get('events', [])
        print(f'   ✅ ESPN: Working - {len(events)} NFL events')
        if events:
            event = events[0]
            print(f'   📅 {event["name"]} - {event.get("date", "TBD")}')
    else:
        print(f'   ❌ ESPN: HTTP {response.status_code}')
except Exception as e:
    print(f'   ❌ ESPN: {str(e)[:50]}...')

# Test web scraping approach for DraftKings
print('\n3. Testing DraftKings web scraping...')
try:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get('https://www.draftkings.com/lobby', headers=headers, timeout=15)
    if response.status_code == 200:
        content = response.text
        if 'NFL' in content:
            print(f'   ✅ DraftKings Lobby: Accessible')
            if 'contest' in content.lower():
                print(f'   📊 Contests found in HTML')
            else:
                print(f'   ℹ️  Page loaded but no contests visible')
        else:
            print(f'   ❌ DraftKings: NFL not found in response')
    else:
        print(f'   ❌ DraftKings: HTTP {response.status_code}')
except Exception as e:
    print(f'   ❌ DraftKings scraping: {str(e)[:50]}...')

# Test additional ESPN endpoints
print('\n4. Testing ESPN additional endpoints...')
espn_endpoints = [
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/athletes',
]

for endpoint in espn_endpoints:
    try:
        response = requests.get(endpoint, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'teams' in endpoint:
                teams = data.get('sports', [{}])[0].get('leagues', [{}])[0].get('teams', [])
                print(f'   ✅ ESPN Teams: {len(teams)} teams found')
            elif 'athletes' in endpoint:
                athletes = data.get('sports', [{}])[0].get('leagues', [{}])[0].get('athletes', [])
                print(f'   ✅ ESPN Athletes: {len(athletes)} athletes found')
        else:
            print(f'   ❌ ESPN {endpoint.split("/")[-1]}: HTTP {response.status_code}')
    except Exception as e:
        print(f'   ❌ ESPN {endpoint.split("/")[-1]}: {str(e)[:30]}...')

print('\n' + '=' * 60)
print('🎯 ALTERNATIVE SOURCES VERIFICATION COMPLETE')
