#!/usr/bin/env python3
"""
Analyze All DraftKings Entries
Count total entries and generate complete 180 optimized lineups
"""

import csv
import random
from datetime import datetime

def analyze_full_csv():
    """Analyze the complete CSV to count all entries"""
    print("🔍 ANALYZING COMPLETE DRAFTKINGS CSV")
    print("=" * 60)
    
    contest_counts = {}
    total_entries = 0
    all_entries = []
    
    with open('DKEntries (1).csv', 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            entry_id = row.get('Entry ID', '').strip()
            contest_name = row.get('Contest Name', '').strip()
            
            # Count valid entries (non-empty entry IDs)
            if entry_id and contest_name and entry_id != 'Entry ID':
                all_entries.append({
                    'entry_id': entry_id,
                    'contest_name': contest_name,
                    'contest_id': row.get('Contest ID', ''),
                    'entry_fee': row.get('Entry Fee', '')
                })
                
                if contest_name not in contest_counts:
                    contest_counts[contest_name] = 0
                contest_counts[contest_name] += 1
                total_entries += 1
    
    print(f"📊 COMPLETE ENTRY BREAKDOWN:")
    for contest, count in contest_counts.items():
        print(f"   • {contest}: {count} entries")
    
    print(f"\n✅ TOTAL ENTRIES FOUND: {total_entries}")
    
    if total_entries != 180:
        print(f"⚠️ Expected 180, found {total_entries}")
        print(f"🔧 Will generate {total_entries} optimized lineups")
    
    return all_entries, contest_counts

def get_complete_player_pool():
    """Get complete player pool from your CSV"""
    players = {}
    
    # Extract all players from your CSV data provided earlier
    live_players = {
        # QBs with live 9/14/25 salaries
        '39971296': {'name': 'Josh Allen', 'position': 'QB', 'salary': 7100, 'projection': 24.5, 'team': 'BUF'},
        '39971297': {'name': 'Lamar Jackson', 'position': 'QB', 'salary': 7000, 'projection': 23.8, 'team': 'BAL'},
        '39971298': {'name': 'Jalen Hurts', 'position': 'QB', 'salary': 6800, 'projection': 22.1, 'team': 'PHI'},
        '39971299': {'name': 'Joe Burrow', 'position': 'QB', 'salary': 6600, 'projection': 21.5, 'team': 'CIN'},
        '39971300': {'name': 'Kyler Murray', 'position': 'QB', 'salary': 6400, 'projection': 20.8, 'team': 'ARI'},
        '39971301': {'name': 'Brock Purdy', 'position': 'QB', 'salary': 6300, 'projection': 20.2, 'team': 'SF'},
        '39971302': {'name': 'Patrick Mahomes', 'position': 'QB', 'salary': 6200, 'projection': 19.8, 'team': 'KC'},
        '39971303': {'name': 'Bo Nix', 'position': 'QB', 'salary': 6100, 'projection': 18.2, 'team': 'DEN'},
        '39971304': {'name': 'Jared Goff', 'position': 'QB', 'salary': 6000, 'projection': 17.9, 'team': 'DET'},
        '39971307': {'name': 'Justin Fields', 'position': 'QB', 'salary': 5700, 'projection': 18.5, 'team': 'NYJ'},
        '39971308': {'name': 'Trevor Lawrence', 'position': 'QB', 'salary': 5600, 'projection': 16.8, 'team': 'JAX'},
        '39971311': {'name': 'Tua Tagovailoa', 'position': 'QB', 'salary': 5300, 'projection': 16.2, 'team': 'MIA'},
        
        # RBs with live salaries
        '39971373': {'name': 'Derrick Henry', 'position': 'RB', 'salary': 8200, 'projection': 22.1, 'team': 'BAL'},
        '39971375': {'name': 'Saquon Barkley', 'position': 'RB', 'salary': 8000, 'projection': 21.5, 'team': 'PHI'},
        '39971377': {'name': 'Christian McCaffrey', 'position': 'RB', 'salary': 7500, 'projection': 20.8, 'team': 'SF'},
        '39971379': {'name': 'Jahmyr Gibbs', 'position': 'RB', 'salary': 7400, 'projection': 19.9, 'team': 'DET'},
        '39971381': {'name': "De'Von Achane", 'position': 'RB', 'salary': 6900, 'projection': 18.2, 'team': 'MIA'},
        '39971383': {'name': 'Chase Brown', 'position': 'RB', 'salary': 6800, 'projection': 17.8, 'team': 'CIN'},
        '39971385': {'name': 'Jonathan Taylor', 'position': 'RB', 'salary': 6700, 'projection': 17.4, 'team': 'IND'},
        '39971387': {'name': 'James Conner', 'position': 'RB', 'salary': 6600, 'projection': 17.1, 'team': 'ARI'},
        '39971389': {'name': 'James Cook', 'position': 'RB', 'salary': 6400, 'projection': 16.8, 'team': 'BUF'},
        '39971391': {'name': 'Kyren Williams', 'position': 'RB', 'salary': 6300, 'projection': 16.5, 'team': 'LAR'},
        '39971393': {'name': 'Breece Hall', 'position': 'RB', 'salary': 6200, 'projection': 16.2, 'team': 'NYJ'},
        '39971395': {'name': 'Alvin Kamara', 'position': 'RB', 'salary': 6100, 'projection': 15.9, 'team': 'NO'},
        '39971397': {'name': 'Chuba Hubbard', 'position': 'RB', 'salary': 6000, 'projection': 15.6, 'team': 'CAR'},
        '39971399': {'name': 'Tony Pollard', 'position': 'RB', 'salary': 5900, 'projection': 15.2, 'team': 'TEN'},
        '39971401': {'name': 'Javonte Williams', 'position': 'RB', 'salary': 5800, 'projection': 14.8, 'team': 'DEN'},
        '39971403': {'name': "D'Andre Swift", 'position': 'RB', 'salary': 5700, 'projection': 14.4, 'team': 'CHI'},
        '39971405': {'name': 'Travis Etienne Jr.', 'position': 'RB', 'salary': 5700, 'projection': 14.1, 'team': 'JAX'},
        '39971407': {'name': 'Kenneth Walker III', 'position': 'RB', 'salary': 5600, 'projection': 13.8, 'team': 'SEA'},
        '39971409': {'name': 'J.K. Dobbins', 'position': 'RB', 'salary': 5600, 'projection': 13.5, 'team': 'LAC'},
        '39971411': {'name': 'Isiah Pacheco', 'position': 'RB', 'salary': 5500, 'projection': 13.2, 'team': 'KC'},
        '39971413': {'name': 'TreVeyon Henderson', 'position': 'RB', 'salary': 5500, 'projection': 12.9, 'team': 'MIA'},
        '39971415': {'name': 'David Montgomery', 'position': 'RB', 'salary': 5400, 'projection': 12.6, 'team': 'DET'},
        '39971417': {'name': 'Jaylen Warren', 'position': 'RB', 'salary': 5400, 'projection': 12.3, 'team': 'PIT'},
        '39971431': {'name': 'Brian Robinson Jr.', 'position': 'RB', 'salary': 5000, 'projection': 11.1, 'team': 'WAS'},
        '39971433': {'name': 'Rhamondre Stevenson', 'position': 'RB', 'salary': 5000, 'projection': 10.8, 'team': 'NE'},
        
        # WRs with live salaries
        '39971653': {'name': "Ja'Marr Chase", 'position': 'WR', 'salary': 8100, 'projection': 21.2, 'team': 'CIN'},
        '39971655': {'name': 'CeeDee Lamb', 'position': 'WR', 'salary': 7800, 'projection': 20.5, 'team': 'DAL'},
        '39971657': {'name': 'Puka Nacua', 'position': 'WR', 'salary': 7600, 'projection': 19.8, 'team': 'LAR'},
        '39971659': {'name': 'Malik Nabers', 'position': 'WR', 'salary': 7100, 'projection': 18.2, 'team': 'NYG'},
        '39971661': {'name': 'Amon-Ra St. Brown', 'position': 'WR', 'salary': 7000, 'projection': 17.8, 'team': 'DET'},
        '39971663': {'name': 'Brian Thomas Jr.', 'position': 'WR', 'salary': 6700, 'projection': 17.1, 'team': 'JAX'},
        '39971665': {'name': 'A.J. Brown', 'position': 'WR', 'salary': 6600, 'projection': 16.8, 'team': 'PHI'},
        '39971667': {'name': 'Garrett Wilson', 'position': 'WR', 'salary': 6500, 'projection': 16.5, 'team': 'NYJ'},
        '39971669': {'name': 'Tyreek Hill', 'position': 'WR', 'salary': 6400, 'projection': 16.2, 'team': 'MIA'},
        '39971671': {'name': 'Courtland Sutton', 'position': 'WR', 'salary': 6300, 'projection': 15.9, 'team': 'DEN'},
        '39971673': {'name': 'Zay Flowers', 'position': 'WR', 'salary': 6200, 'projection': 15.6, 'team': 'BAL'},
        '39971675': {'name': 'Tee Higgins', 'position': 'WR', 'salary': 6100, 'projection': 15.3, 'team': 'CIN'},
        '39971677': {'name': 'Jaxon Smith-Njigba', 'position': 'WR', 'salary': 6000, 'projection': 15.0, 'team': 'SEA'},
        '39971679': {'name': 'DK Metcalf', 'position': 'WR', 'salary': 5900, 'projection': 14.7, 'team': 'SEA'},
        '39971681': {'name': 'Davante Adams', 'position': 'WR', 'salary': 5900, 'projection': 14.4, 'team': 'LV'},
        '39971683': {'name': 'Marvin Harrison Jr.', 'position': 'WR', 'salary': 5800, 'projection': 14.1, 'team': 'ARI'},
        '39971685': {'name': 'George Pickens', 'position': 'WR', 'salary': 5800, 'projection': 13.8, 'team': 'PIT'},
        '39971687': {'name': 'Jameson Williams', 'position': 'WR', 'salary': 5700, 'projection': 13.5, 'team': 'DET'},
        '39971689': {'name': 'Xavier Worthy', 'position': 'WR', 'salary': 5700, 'projection': 13.2, 'team': 'KC'},
        '39971691': {'name': 'DJ Moore', 'position': 'WR', 'salary': 5600, 'projection': 12.9, 'team': 'CHI'},
        '39971693': {'name': 'DeVonta Smith', 'position': 'WR', 'salary': 5600, 'projection': 12.6, 'team': 'PHI'},
        '39971695': {'name': 'Khalil Shakir', 'position': 'WR', 'salary': 5500, 'projection': 12.3, 'team': 'BUF'},
        '39971697': {'name': 'Jaylen Waddle', 'position': 'WR', 'salary': 5400, 'projection': 12.0, 'team': 'MIA'},
        '39971699': {'name': 'Tetairoa McMillan', 'position': 'WR', 'salary': 5400, 'projection': 14.1, 'team': 'ARI'},
        '39971701': {'name': 'Jerry Jeudy', 'position': 'WR', 'salary': 5300, 'projection': 11.4, 'team': 'CLE'},
        '39971703': {'name': 'Ricky Pearsall', 'position': 'WR', 'salary': 5300, 'projection': 11.1, 'team': 'SF'},
        '39971705': {'name': 'Travis Hunter', 'position': 'WR', 'salary': 5200, 'projection': 10.8, 'team': 'JAX'},
        '39971707': {'name': 'Hollywood Brown', 'position': 'WR', 'salary': 5200, 'projection': 10.5, 'team': 'KC'},
        '39971709': {'name': 'Michael Pittman Jr.', 'position': 'WR', 'salary': 5100, 'projection': 10.2, 'team': 'IND'},
        '39971711': {'name': 'Keon Coleman', 'position': 'WR', 'salary': 5100, 'projection': 9.9, 'team': 'BUF'},
        '39971713': {'name': 'Stefon Diggs', 'position': 'WR', 'salary': 5000, 'projection': 9.6, 'team': 'HOU'},
        '39971715': {'name': 'Cooper Kupp', 'position': 'WR', 'salary': 5000, 'projection': 9.3, 'team': 'LAR'},
        '39971717': {'name': 'Chris Olave', 'position': 'WR', 'salary': 4900, 'projection': 9.0, 'team': 'NO'},
        '39971719': {'name': 'Calvin Ridley', 'position': 'WR', 'salary': 4900, 'projection': 8.7, 'team': 'TEN'},
        '39971721': {'name': 'Rome Odunze', 'position': 'WR', 'salary': 4800, 'projection': 8.4, 'team': 'CHI'},
        '39971723': {'name': 'Jauan Jennings', 'position': 'WR', 'salary': 4800, 'projection': 8.1, 'team': 'SF'},
        '39971725': {'name': 'Luther Burden III', 'position': 'WR', 'salary': 4700, 'projection': 7.8, 'team': 'CHI'},
        '39971727': {'name': 'Calvin Austin III', 'position': 'WR', 'salary': 4700, 'projection': 7.5, 'team': 'PIT'},
        '39971729': {'name': 'Josh Downs', 'position': 'WR', 'salary': 4600, 'projection': 7.2, 'team': 'IND'},
        '39971731': {'name': 'Rashod Bateman', 'position': 'WR', 'salary': 4600, 'projection': 6.9, 'team': 'BAL'},
        '39971733': {'name': 'Rashid Shaheed', 'position': 'WR', 'salary': 4500, 'projection': 6.6, 'team': 'NO'},
        '39971735': {'name': 'Kayshon Boutte', 'position': 'WR', 'salary': 4500, 'projection': 6.3, 'team': 'NE'},
        '39971737': {'name': "Wan'Dale Robinson", 'position': 'WR', 'salary': 4400, 'projection': 6.0, 'team': 'NYG'},
        '39971739': {'name': 'Joshua Palmer', 'position': 'WR', 'salary': 4400, 'projection': 5.7, 'team': 'LAC'},
        '39971741': {'name': 'Cedric Tillman', 'position': 'WR', 'salary': 4300, 'projection': 12.8, 'team': 'CLE'},
        '39971743': {'name': 'DeMario Douglas', 'position': 'WR', 'salary': 4300, 'projection': 5.1, 'team': 'NE'},
        
        # TEs with live salaries
        '39972095': {'name': 'Trey McBride', 'position': 'TE', 'salary': 6000, 'projection': 14.5, 'team': 'ARI'},
        '39972097': {'name': 'George Kittle', 'position': 'TE', 'salary': 5500, 'projection': 13.2, 'team': 'SF'},
        '39972099': {'name': 'Travis Kelce', 'position': 'TE', 'salary': 5000, 'projection': 12.8, 'team': 'KC'},
        '39972101': {'name': 'Sam LaPorta', 'position': 'TE', 'salary': 4800, 'projection': 12.1, 'team': 'DET'},
        '39972103': {'name': 'Mark Andrews', 'position': 'TE', 'salary': 4700, 'projection': 11.8, 'team': 'BAL'},
        '39972105': {'name': 'Tyler Warren', 'position': 'TE', 'salary': 4500, 'projection': 11.2, 'team': 'PSU'},
        '39972107': {'name': 'David Njoku', 'position': 'TE', 'salary': 4400, 'projection': 10.9, 'team': 'CLE'},
        '39972109': {'name': 'Evan Engram', 'position': 'TE', 'salary': 4200, 'projection': 10.6, 'team': 'JAX'},
        '39972111': {'name': 'Hunter Henry', 'position': 'TE', 'salary': 4000, 'projection': 10.3, 'team': 'NE'},
        '39972113': {'name': 'Jonnu Smith', 'position': 'TE', 'salary': 3900, 'projection': 10.2, 'team': 'PIT'},
        '39972115': {'name': 'Dallas Goedert', 'position': 'TE', 'salary': 3800, 'projection': 9.9, 'team': 'PHI'},
        '39972117': {'name': 'Jake Ferguson', 'position': 'TE', 'salary': 3800, 'projection': 9.6, 'team': 'DAL'},
        '39972119': {'name': 'Colston Loveland', 'position': 'TE', 'salary': 3700, 'projection': 9.3, 'team': 'CHI'},
        '39972121': {'name': 'Dalton Kincaid', 'position': 'TE', 'salary': 3700, 'projection': 9.0, 'team': 'BUF'},
        
        # DSTs
        '39972347': {'name': 'Ravens', 'position': 'DST', 'salary': 3700, 'projection': 9.2, 'team': 'BAL'},
        '39972348': {'name': '49ers', 'position': 'DST', 'salary': 3600, 'projection': 8.8, 'team': 'SF'},
        '39972349': {'name': 'Broncos', 'position': 'DST', 'salary': 3500, 'projection': 8.4, 'team': 'DEN'},
        '39972351': {'name': 'Bills', 'position': 'DST', 'salary': 3300, 'projection': 7.8, 'team': 'BUF'},
        '39972354': {'name': 'Steelers', 'position': 'DST', 'salary': 3100, 'projection': 7.4, 'team': 'PIT'},
        '39972355': {'name': 'Eagles', 'position': 'DST', 'salary': 3000, 'projection': 7.0, 'team': 'PHI'},
        '39972356': {'name': 'Cowboys', 'position': 'DST', 'salary': 3000, 'projection': 6.6, 'team': 'DAL'},
        '39972357': {'name': 'Bengals', 'position': 'DST', 'salary': 2900, 'projection': 6.2, 'team': 'CIN'},
        '39972358': {'name': 'Dolphins', 'position': 'DST', 'salary': 2900, 'projection': 5.8, 'team': 'MIA'},
        '39972359': {'name': 'Patriots', 'position': 'DST', 'salary': 2800, 'projection': 5.4, 'team': 'NE'},
        '39972360': {'name': 'Chiefs', 'position': 'DST', 'salary': 2800, 'projection': 5.0, 'team': 'KC'},
        '39972361': {'name': 'Seahawks', 'position': 'DST', 'salary': 2700, 'projection': 4.6, 'team': 'SEA'},
        '39972362': {'name': 'Jaguars', 'position': 'DST', 'salary': 2700, 'projection': 4.2, 'team': 'JAX'}
    }
    
    print(f"✅ Complete player pool: {len(live_players)} players")
    
    return live_players

def generate_all_180_lineups(all_entries, players):
    """Generate the complete 180 optimized lineups"""
    print(f"\n⚡ GENERATING ALL {len(all_entries)} OPTIMIZED LINEUPS")
    print("=" * 60)
    
    contest_field_sizes = {
        'NFL $888K Play-Action [20 Entry Max]': 20,
        'NFL $3.5M Fantasy Football Millionaire [$1M to 1st]': 1000000,
        'NFL $300K Flea Flicker [$50K to 1st]': 50000,
        'NFL $150K mini-MAX [150 Entry Max]': 150
    }
    
    optimized_lineups = []
    used_combinations = set()
    
    for i, entry in enumerate(all_entries):
        contest_name = entry['contest_name']
        field_size = contest_field_sizes.get(contest_name, 100000)
        
        # Generate unique lineup
        attempts = 0
        while attempts < 20:  # Try up to 20 times
            lineup, salary = create_diverse_lineup(players, used_combinations, attempts)
            
            if lineup and len(lineup) >= 8 and salary <= 50000:
                # Create signature
                signature = tuple(sorted(p['name'] for p in lineup))
                
                if signature not in used_combinations or len(used_combinations) >= 150:
                    # Run simulation
                    sim = run_advanced_simulation(lineup, field_size)
                    
                    lineup_data = {
                        'entry_id': entry['entry_id'],
                        'contest_name': contest_name,
                        'contest_id': entry['contest_id'],
                        'entry_fee': entry['entry_fee'],
                        'lineup': lineup,
                        'salary': salary,
                        'simulation': sim
                    }
                    
                    optimized_lineups.append(lineup_data)
                    used_combinations.add(signature)
                    
                    if (i + 1) % 20 == 0:
                        print(f"   ✅ Generated {i+1}/{len(all_entries)} lineups...")
                    
                    break
            attempts += 1
    
    print(f"✅ GENERATED {len(optimized_lineups)} TOTAL OPTIMIZED LINEUPS")
    return optimized_lineups

def create_diverse_lineup(players, used_combinations, iteration):
    """Create diverse lineup with randomization"""
    available = list(players.values())
    
    # Add randomization based on iteration
    random.shuffle(available)
    
    # Weight by value but add randomness
    for player in available:
        player['weighted_value'] = (player['projection'] / (player['salary'] / 1000)) + random.uniform(-1, 2)
    
    available.sort(key=lambda x: x['weighted_value'], reverse=True)
    
    lineup = []
    salary = 0
    
    # Fill positions with some randomness
    positions_needed = {
        'QB': 1, 'RB': 2, 'WR': 3, 'TE': 1, 'DST': 1
    }
    
    for position, count in positions_needed.items():
        pos_players = [p for p in available if p['position'] == position]
        
        for _ in range(count):
            # Add randomness to selection
            candidate_pool = pos_players[:min(8, len(pos_players))]
            
            for player in candidate_pool:
                if (salary + player['salary'] <= 45000 and  # Leave room for remaining positions
                    player not in lineup):
                    lineup.append(player)
                    salary += player['salary']
                    pos_players.remove(player)
                    break
    
    # Fill FLEX
    if len(lineup) < 9:
        flex_options = [p for p in available 
                       if p['position'] in ['RB', 'WR', 'TE'] 
                       and p not in lineup 
                       and salary + p['salary'] <= 50000]
        
        if flex_options:
            # Pick from top options with some randomness
            flex_candidates = flex_options[:min(6, len(flex_options))]
            flex = random.choice(flex_candidates)
            lineup.append(flex)
            salary += flex['salary']
    
    return lineup, salary

def run_advanced_simulation(lineup, field_size):
    """Run advanced Monte Carlo simulation"""
    scores = []
    
    # Run 5000 simulations for accuracy
    for _ in range(5000):
        total_score = 0
        for player in lineup:
            # Realistic variance model
            base_proj = player['projection']
            std_dev = max(base_proj * 0.25, 2.0)  # At least 2 point std dev
            score = max(0, random.gauss(base_proj, std_dev))
            total_score += score
        scores.append(total_score)
    
    # Calculate comprehensive statistics
    avg_score = sum(scores) / len(scores)
    scores.sort()
    
    floor = scores[int(len(scores) * 0.1)]
    ceiling = scores[int(len(scores) * 0.9)]
    median = scores[int(len(scores) * 0.5)]
    
    # Field-specific win rate calculation
    if field_size <= 20:
        # Cash games - need top 50%
        win_threshold = 145
        payout_multiplier = 1.8
    elif field_size <= 150:
        # Small GPP - need top 10%
        win_threshold = 160
        payout_multiplier = 15
    elif field_size <= 50000:
        # Mid GPP - need top 1%
        win_threshold = 170
        payout_multiplier = 100
    else:
        # Large GPP - need top 0.1%
        win_threshold = 180
        payout_multiplier = 1000
    
    wins
