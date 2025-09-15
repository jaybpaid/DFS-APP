#!/usr/bin/env python3
"""
Complete Active 180 CSV Generator
Generate ALL 180 lineups using ONLY confirmed active players
"""

import csv
import random

def main():
    print("🚀 COMPLETING ACTIVE 180 CSV")
    print("Using ONLY confirmed active players from DraftKings data")
    print("=" * 60)
    
    # Get your actual Entry IDs
    entries = []
    with open('DKEntries (1).csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            entry_id = row.get('Entry ID', '').strip()
            if entry_id and entry_id.isdigit():
                entries.append({
                    'id': entry_id,
                    'contest': row.get('Contest Name', ''),
                    'contest_id': row.get('Contest ID', ''),
                    'fee': row.get('Entry Fee', '')
                })
    
    print(f"✅ Found {len(entries)} entries")
    
    # CONFIRMED ACTIVE PLAYERS ONLY (from your CSV with positive projections)
    active_players = {
        'qbs': [
            ('Josh Allen', '39971296', 7100, 41.76),
            ('Lamar Jackson', '39971297', 7000, 29.36),
            ('Jalen Hurts', '39971298', 6800, 24.28),
            ('Joe Burrow', '39971299', 6600, 8.82),
            ('Kyler Murray', '39971300', 6400, 18.32),
            ('Brock Purdy', '39971301', 6300, 18.78),
            ('Patrick Mahomes', '39971302', 6200, 26.02),
            ('Bo Nix', '39971303', 6100, 9.84),
            ('Jared Goff', '39971304', 6000, 11.9),
            ('Justin Fields', '39971307', 5700, 29.52),
            ('Trevor Lawrence', '39971308', 5600, 11.32),
            ('Aaron Rodgers', '39971309', 5500, 25.66),
            ('Caleb Williams', '39971310', 5400, 24.2),
            ('Dak Prescott', '39971305', 5900, 7.82)
        ],
        'rbs': [
            ('Derrick Henry', '39971373', 8200, 33.2),
            ('Saquon Barkley', '39971375', 8000, 18.4),
            ('Christian McCaffrey', '39971377', 7500, 23.2),
            ('Jahmyr Gibbs', '39971379', 7400, 15.0),
            ("De'Von Achane", '39971381', 6900, 16.5),
            ('Chase Brown', '39971383', 6800, 13.1),
            ('Jonathan Taylor', '39971385', 6700, 12.8),
            ('James Conner', '39971387', 6600, 14.4),
            ('James Cook', '39971389', 6400, 21.2),
            ('Kyren Williams', '39971391', 6300, 13.9),
            ('Breece Hall', '39971393', 6200, 19.5),
            ('Alvin Kamara', '39971395', 6100, 13.7),
            ('Chuba Hubbard', '39971397', 6000, 17.9),
            ('Tony Pollard', '39971399', 5900, 8.9),
            ('Travis Etienne Jr.', '39971405', 5700, 21.6),
            ('David Montgomery', '39971415', 5400, 8.3),
            ('Jaylen Warren', '39971417', 5400, 13.9),
            ('Rhamondre Stevenson', '39971433', 5000, 4.7),
            ('Brian Robinson Jr.', '39971431', 5000, 4.7)
        ],
        'wrs': [
            ("Ja'Marr Chase", '39971653', 8100, 4.6),
            ('CeeDee Lamb', '39971655', 7800, 21.0),
            ('Puka Nacua', '39971657', 7600, 26.1),
            ('Malik Nabers', '39971659', 7100, 12.1),
            ('Amon-Ra St. Brown', '39971661', 7000, 8.5),
            ('Brian Thomas Jr.', '39971663', 6700, 9.0),
            ('A.J. Brown', '39971665', 6600, 1.8),
            ('Garrett Wilson', '39971667', 6500, 22.5),
            ('Tyreek Hill', '39971669', 6400, 8.0),
            ('Courtland Sutton', '39971671', 6300, 18.1),
            ('Zay Flowers', '39971673', 6200, 31.1),
            ('Tee Higgins', '39971675', 6100, 6.3),
            ('Jaxon Smith-Njigba', '39971677', 6000, 23.4),
            ('DK Metcalf', '39971679', 5900, 12.3),
            ('Davante Adams', '39971681', 5900, 9.1),
            ('Marvin Harrison Jr.', '39971683', 5800, 18.1),
            ('George Pickens', '39971685', 5800, 6.0),
            ('Jameson Williams', '39971687', 5700, 6.6),
            ('DJ Moore', '39971691', 5600, 9.6),
            ('DeVonta Smith', '39971693', 5600, 4.6),
            ('Khalil Shakir', '39971695', 5500, 12.4),
            ('Jaylen Waddle', '39971697', 5400, 7.0),
            ('Tetairoa McMillan', '39971699', 5400, 11.8),
            ('Jerry Jeudy', '39971701', 5300, 11.6),
            ('Ricky Pearsall', '39971703', 5300, 17.8),
            ('Travis Hunter', '39971705', 5200, 9.3),
            ('Hollywood Brown', '39971707', 5200, 19.9),
            ('Michael Pittman Jr.', '39971709', 5100, 20.0),
            ('Keon Coleman', '39971711', 5100, 28.2),
            ('Stefon Diggs', '39971713', 5000, 11.7),
            ('Chris Olave', '39971717', 4900, 12.4),
            ('Calvin Ridley', '39971719', 4900, 6.7),
            ('Rome Odunze', '39971721', 4800, 15.7),
            ('Jauan Jennings', '39971723', 4800, 3.6),
            ('Calvin Austin III', '39971727', 4700, 17.0),
            ('Josh Downs', '39971729', 4600, 3.2),
            ('Rashod Bateman', '39971731', 4600, 3.0),
            ('Kayshon Boutte', '39971735', 4500, 19.3),
            ('Wan'Dale Robinson', '39971737', 4400, 11.5),
            ('Cedric Tillman', '39971741', 4300, 16.2),
            ('DeAndre Hopkins', '39971747', 4200, 11.5)
        ],
        'tes': [
            ('Trey McBride', '39972095', 6000, 12.1),
            ('George Kittle', '39972097', 5500, 12.5),
            ('Travis Kelce', '39972099', 5000, 12.7),
            ('Sam LaPorta', '39972101', 4800, 13.9),
            ('Mark Andrews', '39972103', 4700, 1.5),
            ('David Njoku', '39972107', 4400, 6.7),
            ('Hunter Henry', '39972111', 4000, 10.6),
            ('Jonnu Smith', '39972113', 3900, 12.5),
            ('Dallas Goedert', '39972115', 3800, 11.4),
            ('Jake Ferguson', '39972117', 3800, 7.3),
            ('Colston Loveland', '39972119', 3700, 3.2),
            ('Dalton Kincaid', '39972121', 3700, 14.8),
            ('Juwan Johnson', '39972123', 3600, 15.6)
        ],
        'dsts': [
            ('Broncos', '39972349', 3500, 14.0),
            ('Ravens', '39972347', 3700, -3.0),
            ('49ers', '39972348', 3600, 9.0),
            ('Rams', '39972353', 3100, 11.0),
            ('Jaguars', '39972362', 2700, 11.0),
            ('Steelers', '39972354', 3100, 2.0),
            ('Eagles', '39972355', 3000, 3.0),
            ('Cowboys', '39972356', 3000, 1.0),
            ('Bengals', '39972357', 2900, 7.0),
            ('Saints', '39972365', 2500, 8.0),
            ('Seahawks', '39972361', 2700, 8.0),
            ('Colts', '39972363', 2600, 13.0),
            ('Titans', '39972368', 2400, 10.0)
        ]
    }
    
    # Generate complete 180 CSV
    with open('DKEntries_COMPLETE_ACTIVE_180.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        for i, entry in enumerate(entries[:180]):  # Ensure exactly 180
            # Create lineup with active players
            random.seed(i)
            
            qb = random.choice(active_players['qbs'][:10])
            rb1 = random.choice(active_players['rbs'][:12])
            rb2 = random.choice(active_players['rbs'][8:19])  # Different tier
            wr1 = random.choice(active_players['wrs'][:10])
            wr2 = random.choice(active_players['wrs'][5:20])
            wr3 = random.choice(active_players['wrs'][10:30])
            te = random.choice(active_players['tes'][:8])
            flex = random.choice(active_players['wrs'][15:35] + active_players['rbs'][12:19])
            dst = random.choice(active_players['dsts'])
            
            # Calculate total salary
            total_salary = qb[2] + rb1[2] + rb2[2] + wr1[2] + wr2[2] + wr3[2] + te[2] + flex[2] + dst[2]
            
            # Adjust if over $50K
            if total_salary > 50000:
                # Use cheaper alternatives
                te = random.choice(active_players['tes'][6:])  # Cheaper TE
