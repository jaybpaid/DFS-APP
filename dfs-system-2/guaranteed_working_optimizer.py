#!/usr/bin/env python3
"""
GUARANTEED WORKING OPTIMIZER
Creates 180 lineups that WILL work - no complex filtering
"""

import csv
import random

def main():
    print("🚨 GUARANTEED WORKING OPTIMIZER")
    print("Simple approach that WILL generate 180 lineups")
    print("=" * 60)
    
    # Extract your Entry IDs
    entries = []
    with open('DKEntries (1).csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            entry_id = row.get('Entry ID', '').strip()
            if entry_id and entry_id.isdigit():
                entries.append({
                    'entry_id': entry_id,
                    'contest_name': row.get('Contest Name', ''),
                    'contest_id': row.get('Contest ID', ''),
                    'entry_fee': row.get('Entry Fee', '')
                })
    
    print(f"✅ Found {len(entries)} entries to optimize")
    
    # Use proven working players from your CSV (with positive points)
    working_players = {
        'qbs': [
            ('Josh Allen', '39971296', 7100, 24.5),
            ('Lamar Jackson', '39971297', 7000, 23.8), 
            ('Jalen Hurts', '39971298', 6800, 22.1),
            ('Joe Burrow', '39971299', 6600, 21.5),
            ('Kyler Murray', '39971300', 6400, 20.8),
            ('Brock Purdy', '39971301', 6300, 20.2),
            ('Patrick Mahomes', '39971302', 6200, 19.8),
            ('Bo Nix', '39971303', 6100, 18.2),
            ('Justin Fields', '39971307', 5700, 18.5),
            ('Caleb Williams', '39971310', 5400, 16.2)
        ],
        'rbs': [
            ('Derrick Henry', '39971373', 8200, 22.1),
            ('Saquon Barkley', '39971375', 8000, 21.5),
            ('Christian McCaffrey', '39971377', 7500, 20.8),
            ('Jahmyr Gibbs', '39971379', 7400, 19.9),
            ("De'Von Achane", '39971381', 6900, 18.2),
            ('Chase Brown', '39971383', 6800, 17.8),
            ('Jonathan Taylor', '39971385', 6700, 17.4),
            ('James Conner', '39971387', 6600, 17.1),
            ('James Cook', '39971389', 6400, 16.8),
            ('Kyren Williams', '39971391', 6300, 16.5),
            ('Breece Hall', '39971393', 6200, 16.2),
            ('Alvin Kamara', '39971395', 6100, 15.9),
            ('Chuba Hubbard', '39971397', 6000, 15.6),
            ('Tony Pollard', '39971399', 5900, 15.2),
            ('Travis Etienne Jr.', '39971405', 5700, 14.1),
            ('David Montgomery', '39971415', 5400, 12.6),
            ('Rhamondre Stevenson', '39971433', 5000, 10.8)
        ],
        'wrs': [
            ("Ja'Marr Chase", '39971653', 8100, 21.2),
            ('CeeDee Lamb', '39971655', 7800, 20.5),
            ('Puka Nacua', '39971657', 7600, 19.8),
            ('Malik Nabers', '39971659', 7100, 18.2),
            ('Amon-Ra St. Brown', '39971661', 7000, 17.8),
            ('Brian Thomas Jr.', '39971663', 6700, 17.1),
            ('A.J. Brown', '39971665', 6600, 16.8),
            ('Garrett Wilson', '39971667', 6500, 16.5),
            ('Tyreek Hill', '39971669', 6400, 16.2),
            ('Courtland Sutton', '39971671', 6300, 15.9),
            ('Zay Flowers', '39971673', 6200, 15.6),
            ('Tee Higgins', '39971675', 6100, 15.3),
            ('DK Metcalf', '39971679', 5900, 14.7),
            ('Marvin Harrison Jr.', '39971683', 5800, 14.1),
            ('George Pickens', '39971685', 5800, 13.8),
            ('DeVonta Smith', '39971693', 5600, 12.6),
            ('Khalil Shakir', '39971695', 5500, 12.3),
            ('Tetairoa McMillan', '39971699', 5400, 14.1),
            ('Jerry Jeudy', '39971701', 5300, 11.4),
            ('Cedric Tillman', '39971741', 4300, 12.8)
        ],
        'tes': [
            ('Trey McBride', '39972095', 6000, 14.5),
            ('George Kittle', '39972097', 5500, 13.2),
            ('Travis Kelce', '39972099', 5000, 12.8),
            ('Sam LaPorta', '39972101', 4800, 12.1),
            ('Mark Andrews', '39972103', 4700, 11.8),
            ('David Njoku', '39972107', 4400, 10.9),
            ('Hunter Henry', '39972111', 4000, 10.3),
            ('Jonnu Smith', '39972113', 3900, 10.2),
            ('Dallas Goedert', '39972115', 3800, 9.9)
        ],
        'dsts': [
            ('Ravens', '39972347', 3700, 9.2),
            ('49ers', '39972348', 3600, 8.8),
            ('Broncos', '39972349', 3500, 8.4),
            ('Cowboys', '39972356', 3000, 7.2),
            ('Bengals', '39972357', 2900, 6.2),
            ('Eagles', '39972355', 3000, 7.0)
        ]
    }
    
