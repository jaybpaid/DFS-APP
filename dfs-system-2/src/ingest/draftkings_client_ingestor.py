#!/usr/bin/env python3
"""
DraftKings Client Ingestor
Uses the official jaebradley/draftkings_client for accessing DraftKings data
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from draft_kings import Client, Sport

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DraftKingsClientIngestor:
    """Ingestor for DraftKings data using official client"""

    def __init__(self):
        self.client = Client()
        self.sport = Sport.NFL

    def get_contests(self) -> List[Dict]:
        """Get all available DraftKings contests"""
        try:
            logger.info("Fetching DraftKings contests...")
            contests_response = self.client.contests(sport=self.sport)

            contests = []
            for contest in contests_response.contests:
                # Debug: print available attributes
                print(f"Contest attributes: {dir(contest)}")
                print(f"Contest: {contest}")

                entries_details = getattr(contest, 'entries_details', None)
                contest_data = {
                    'id': str(getattr(contest, 'contest_id', 'unknown')),
                    'name': getattr(contest, 'name', 'Unknown Contest'),
                    'site': 'DraftKings',
                    'sport': 'NFL',
                    'entry_fee': float(getattr(entries_details, 'fee', 0)) if entries_details else 0,
                    'total_entries': getattr(entries_details, 'total', 0) if entries_details else 0,
                    'max_entries': getattr(entries_details, 'maximum', 0) if entries_details else 0,
                    'start_time': getattr(contest, 'starts_at', None),
                    'source': 'draftkings_client',
                    'game_type': getattr(contest, 'game_type', None),
                    'total_prizes': float(getattr(contest, 'payout', 0)),
                    'draft_group_id': getattr(contest, 'draft_group_id', None)
                }
                contests.append(contest_data)

            logger.info(f"Found {len(contests)} DraftKings contests")
            return contests

        except Exception as e:
            logger.error(f"Error fetching DraftKings contests: {e}")
            return []

    def get_contest_players(self, contest_id: str) -> List[Dict]:
        """Get players for a specific contest"""
        try:
            logger.info(f"Fetching players for contest {contest_id}...")

            # Get contest info to find draft_group_id
            contests = self.get_contests()
            contest_info = next((c for c in contests if c['id'] == contest_id), None)

            if not contest_info:
                logger.error(f"Contest {contest_id} not found")
                return []

            # Extract draft_group_id from contest data
            draft_group_id = contest_info.get('draft_group_id')
            if not draft_group_id:
                logger.error(f"No draft_group_id found for contest {contest_id}")
                return []

            logger.info(f"Using draft_group_id: {draft_group_id}")

            # Get draftables for this draft group
            draftables_response = self.client.draftables(draft_group_id=int(draft_group_id))

            # Debug: print the actual structure
            print(f"Draftables response type: {type(draftables_response)}")
            print(f"Draftables response attributes: {dir(draftables_response)}")

            players = []

            # Try different ways to access the player data
            if hasattr(draftables_response, 'draftables'):
                player_list = draftables_response.draftables
            elif hasattr(draftables_response, 'players'):
                player_list = draftables_response.players
            elif hasattr(draftables_response, '__dict__'):
                # Check if it's a dict-like object
                player_list = getattr(draftables_response, 'draftables', [])
                if not player_list:
                    player_list = getattr(draftables_response, 'players', [])
            else:
                # Try to iterate directly if it's a list
                try:
                    player_list = list(draftables_response)
                except:
                    player_list = []

            print(f"Found {len(player_list)} players in response")

            for player in player_list:
                player_data = {
                    'id': str(getattr(player, 'id', 'unknown')),
                    'name': getattr(player, 'name', 'Unknown Player'),
                    'first_name': getattr(player, 'first_name', ''),
                    'last_name': getattr(player, 'last_name', ''),
                    'position': getattr(player, 'position', {}).get('name', None) if hasattr(player, 'position') and player.position else None,
                    'team': getattr(player, 'team', {}).get('name', None) if hasattr(player, 'team') and player.team else None,
                    'salary': float(getattr(player, 'salary', 0)),
                    'fantasy_points_per_game': float(getattr(player, 'fantasy_points_per_game', 0.0)),
                    'ownership_percentage': float(getattr(player, 'ownership_percentage', 0.0)),
                    'is_disabled': getattr(player, 'is_disabled', False),
                    'source': 'draftkings_client'
                }
                players.append(player_data)

            logger.info(f"Found {len(players)} players for contest {contest_id}")
            return players

        except Exception as e:
            logger.error(f"Error fetching players for contest {contest_id}: {e}")
            return []

    def get_current_week_contests(self) -> List[Dict]:
        """Get contests for the current week"""
        try:
            all_contests = self.get_contests()

            # Filter for current week (next 7 days)
            now = datetime.now()
            week_from_now = now + timedelta(days=7)

            current_week_contests = []
            for contest in all_contests:
                if contest.get('start_time'):
                    try:
                        start_time = datetime.fromisoformat(contest['start_time'].replace('Z', '+00:00'))
                        if now <= start_time <= week_from_now:
                            current_week_contests.append(contest)
                    except:
                        continue

            logger.info(f"Found {len(current_week_contests)} contests for current week")
            return current_week_contests

        except Exception as e:
            logger.error(f"Error fetching current week contests: {e}")
            return []

    def get_september_14_2025_contests(self) -> List[Dict]:
        """Specifically get contests for September 14, 2025 (main NFL slate)"""
        try:
            all_contests = self.get_contests()

            sept14_contests = []
            target_date = datetime(2025, 9, 14)

            for contest in all_contests:
                if contest.get('start_time'):
                    try:
                        start_time = datetime.fromisoformat(contest['start_time'].replace('Z', '+00:00'))
                        # Check if contest starts on September 14, 2025
                        if (start_time.year == 2025 and
                            start_time.month == 9 and
                            start_time.day == 14):
                            sept14_contests.append(contest)
                    except:
                        continue

            logger.info(f"Found {len(sept14_contests)} contests for September 14, 2025")
            return sept14_contests

        except Exception as e:
            logger.error(f"Error fetching September 14, 2025 contests: {e}")
            return []

def test_draftkings_client():
    """Test the DraftKings client ingestor"""
    ingestor = DraftKingsClientIngestor()

    print("🔍 TESTING DRAFTKINGS CLIENT INGESTOR")
    print("=" * 50)

    # Test getting contests
    print("\n1. Fetching all contests...")
    contests = ingestor.get_contests()
    print(f"✅ Found {len(contests)} total contests")

    if contests:
        print(f"📅 Sample contest: {contests[0]['name']} - ${contests[0]['entry_fee']}")

    # Test current week contests
    print("\n2. Fetching current week contests...")
    current_week = ingestor.get_current_week_contests()
    print(f"✅ Found {len(current_week)} current week contests")

    # Test September 14, 2025 contests
    print("\n3. Fetching September 14, 2025 contests...")
    sept14 = ingestor.get_september_14_2025_contests()
    print(f"✅ Found {len(sept14)} September 14, 2025 contests")

    if sept14:
        print("🎯 SUCCESS: September 14, 2025 DraftKings data accessible!")
        for contest in sept14[:3]:  # Show first 3
            print(f"   - {contest['name']} (${contest['entry_fee']})")

    # Test getting players for first contest
    if contests:
        print(f"\n4. Fetching players for contest: {contests[0]['name']}")
        players = ingestor.get_contest_players(contests[0]['id'])
        print(f"✅ Found {len(players)} players")

        if players:
            sample_player = players[0]
            print(f"📊 Sample player: {sample_player['name']} ({sample_player['position']}) - ${sample_player['salary']}")

    print("\n" + "=" * 50)
    print("🎯 DRAFTKINGS CLIENT TEST COMPLETE")

if __name__ == "__main__":
    test_draftkings_client()
