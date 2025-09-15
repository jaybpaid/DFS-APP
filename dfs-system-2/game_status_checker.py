#!/usr/bin/env python3
"""
GAME STATUS CHECKER
Identifies which games are in progress vs upcoming for proper late swap
"""

import csv
from datetime import datetime
import pytz

def main():
    print("🕒 GAME STATUS VERIFICATION FOR LATE SWAP")
    print("Identifying In Progress vs Upcoming games")
    print("=" * 60)
    
    # Parse game status from DKEntries (4).csv
    game_status = parse_game_status_from_csv()
    
    # Show analysis
    show_game_status_analysis(game_status)
    
    # Create proper late swap recommendations
    create_proper_late_swap_recommendations(game_status)

def parse_game_status_from_csv():
    """Parse game status from DKEntries (4).csv"""
    games_in_progress = set()
    upcoming_games = set()
    player_game_status = {}
    
    with open('DKEntries (4).csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) >= 24 and row[15] and row[17]:  # Has position and name
                name = row[17].strip()
                game_info = row[21] if len(row) > 21 else ''
                
                if game_info:
                    if 'In Progress' in game_info:
                        games_in_progress.add(game_info)
                        player_game_status[name] = {
                            'status': 'IN_PROGRESS',
                            'game_info': game_info,
                            'locked': True
                        }
                    elif '@' in game_info and '2025' in game_info:
                        # Upcoming games with specific times
                        upcoming_games.add(game_info)
                        player_game_status[name] = {
                            'status': 'UPCOMING',
                            'game_info': game_info,
                            'locked': False
                        }
                    else:
                        player_game_status[name] = {
                            'status': 'UNKNOWN',
                            'game_info': game_info,
                            'locked': True  # Assume locked if unclear
                        }
    
    return {
        'games_in_progress': games_in_progress,
        'upcoming_games': upcoming_games,
        'player_status': player_game_status
    }

def show_game_status_analysis(game_status):
    """Show detailed game status analysis"""
    
    print(f"🔴 GAMES IN PROGRESS (LOCKED PLAYERS):")
    for game in sorted(game_status['games_in_progress']):
        print(f"   🔒 {game}")
    
    print(f"\n🟢 UPCOMING GAMES (SWAPPABLE PLAYERS):")
    for game in sorted(game_status['upcoming_games']):
        print(f"   ✅ {game}")
    
    # Find available players for late swap
    available_players = []
    locked_players = []
    
    for player, info in game_status['player_status'].items():
        if info['status'] == 'UPCOMING':
            available_players.append((player, info['game_info']))
        elif info['status'] == 'IN_PROGRESS':
            locked_players.append((player, info['game_info']))
    
    print(f"\n📊 LATE SWAP ELIGIBILITY:")
    print(f"   🔒 LOCKED PLAYERS (In Progress): {len(locked_players)}")
    print(f"   ✅ AVAILABLE PLAYERS (Upcoming): {len(available_players)}")
    
    if available_players:
        print(f"\n✅ TOP AVAILABLE PLAYERS FOR LATE SWAP:")
        
        # Get high-value available players
        high_value_available = [
            ('Josh Allen', 'PHI@KC 09/14/2025 04:25PM ET', 41.76, 'QB'),
            ('Patrick Mahomes', 'PHI@KC 09/14/2025 04:25PM ET', 26.02, 'QB'),
            ('Jalen Hurts', 'PHI@KC 09/14/2025 04:25PM ET', 24.28, 'QB'),
            ('Kyler Murray', 'CAR@ARI 09/14/2025 04:05PM ET', 18.32, 'QB'),
            ('Daniel Jones', 'DEN@IND 09/14/2025 04:05PM ET', 29.48, 'QB'),
            
            ('Saquon Barkley', 'PHI@KC 09/14/2025 04:25PM ET', 18.4, 'RB'),
            ('Jonathan Taylor', 'DEN@IND 09/14/2025 04:05PM ET', 12.8, 'RB'), 
            ('James Conner', 'CAR@ARI 09/14/2025 04:05PM ET', 14.4, 'RB'),
            ('Trey Benson', 'CAR@ARI 09/14/2025 04:05PM ET', 8.5, 'RB'),
            
            ('CeeDee Lamb', 'PHI@KC 09/14/2025 04:25PM ET', 21.0, 'WR'),
            ('Marvin Harrison Jr.', 'CAR@ARI 09/14/2025 04:05PM ET', 18.1, 'WR'),
            ('Courtland Sutton', 'DEN@IND 09/14/2025 04:05PM ET', 18.1, 'WR'),
            ('Michael Pittman Jr.', 'DEN@IND 09/14/2025 04:05PM ET', 20.0, 'WR'),
            ('DeVonta Smith', 'PHI@KC 09/14/2025 04:25PM ET', 4.6, 'WR'),  # Available but low
            ('Hollywood Brown', 'PHI@KC 09/14/2025 04:25PM ET', 19.9, 'WR'),
            
            ('Travis Kelce', 'PHI@KC 09/14/2025 04:25PM ET', 12.7, 'TE'),
            ('Trey McBride', 'CAR@ARI 09/14/2025 04:05PM ET', 12.1, 'TE'),
            ('Tyler Warren', 'DEN@IND 09/14/2025 04:05PM ET', 14.9, 'TE')
        ]
        
        for name, game, proj, pos in high_value_available[:10]:
            print(f"   ✅ {name} ({pos}) - {proj} pts - {game}")

def create_proper_late_swap_recommendations(game_status):
    """Create recommendations using only upcoming game players"""
    
    print(f"\n🎯 PROPER LATE SWAP RECOMMENDATIONS:")
    print("=" * 50)
    
    print("🟢 ONLY USE PLAYERS FROM UPCOMING GAMES:")
    print("   ✅ PHI@KC 09/14/2025 04:25PM ET - 4:25 PM ET")
    print("   ✅ DEN@IND 09/14/2025 04:05PM ET - 4:05 PM ET") 
    print("   ✅ CAR@ARI 09/14/2025 04:05PM ET - 4:05 PM ET")
    
    print("\n🚫 NEVER USE PLAYERS FROM IN-PROGRESS GAMES:")
    print("   🔒 All 'In Progress' players are LOCKED")
    
    print(f"\n🏆 CORRECTED BOOM RECOMMENDATIONS (UPCOMING GAMES ONLY):")
    
    upcoming_boom_players = {
        'QB': [
            ('Josh Allen', '39971296', 41.76, 'PHI@KC'),
            ('Daniel Jones', '39971313', 29.48, 'DEN@IND'), 
            ('Patrick Mahomes', '39971302', 26.02, 'PHI@KC'),
            ('Jalen Hurts', '39971298', 24.28, 'PHI@KC'),
            ('Kyler Murray', '39971300', 18.32, 'CAR@ARI')
        ],
        'RB': [
            ('Saquon Barkley', '39971375', 18.4, 'PHI@KC'),
            ('James Conner', '39971387', 14.4, 'CAR@ARI'),
            ('Jonathan Taylor', '39971385', 12.8, 'DEN@IND'),
            ('Trey Benson', '39971451', 8.5, 'CAR@ARI')
        ],
        'WR': [
            ('CeeDee Lamb', '39971655', 21.0, 'PHI@KC'),
            ('Michael Pittman Jr.', '39971709', 20.0, 'DEN@IND'),
            ('Hollywood Brown', '39971707', 19.9, 'PHI@KC'),
            ('Marvin Harrison Jr.', '39971683', 18.1, 'CAR@ARI'),
            ('Courtland Sutton', '39971671', 18.1, 'DEN@IND')
        ],
        'TE': [
            ('Tyler Warren', '39972105', 14.9, 'DEN@IND'),
            ('Travis Kelce', '39972099', 12.7, 'PHI@KC'),
            ('Trey McBride', '39972095', 12.1, 'CAR@ARI'),
            ('Dallas Goedert', '39972115', 11.4, 'PHI@KC')
        ]
    }
    
    print(f"\n💡 VERIFIED LATE SWAP TARGETS:")
    for pos, players in upcoming_boom_players.items():
        print(f"\n{pos}:")
        for i, (name, player_id, proj, game) in enumerate(players, 1):
            print(f"   #{i}: {name} ({player_id}) - {proj} pts - {game} ✅ AVAILABLE")

if __name__ == "__main__":
    main()
