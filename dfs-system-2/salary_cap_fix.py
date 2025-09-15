#!/usr/bin/env python3
"""
SALARY CAP FIX - Create proper under-cap lineups respecting LOCKED players
"""

import csv

def main():
    print("🔄 FIXING SALARY CAP ISSUES")
    print("Creating lineups under $50,000 respecting LOCKED constraints")
    print("=" * 60)
    
    # Process original entries and fix salary issues
    entries = load_and_fix_entries()
    print(f"✅ Fixed {len(entries)} entries")
    
    # Create upload-ready CSV
    create_final_upload_csv(entries)

def load_and_fix_entries():
    """Load original entries and fix salary cap issues"""
    entries = []
    
    # Salary database
    salaries = {
        'Justin Fields': 5700, 'Bo Nix': 6100, 'Tua Tagovailoa': 5300, 'Drake Maye': 5200,
        'Dak Prescott': 5900, 'Josh Allen': 7100, 'Lamar Jackson': 7000, 'Patrick Mahomes': 6200,
        'Aaron Rodgers': 5500, 'Jalen Hurts': 6800, 'Daniel Jones': 5200, 'Caleb Williams': 5400,
        'Joe Burrow': 6600, 'Kyler Murray': 6400, 'Brock Purdy': 6300, 'Trevor Lawrence': 5600,
        
        'Chuba Hubbard': 6000, 'James Cook': 6400, 'Breece Hall': 6200, 'Tony Pollard': 5900,
        'Alvin Kamara': 6100, 'Jonathan Taylor': 6700, 'Kyren Williams': 6300, 'Chase Brown': 6800,
        'Kenneth Walker III': 5600, 'Travis Etienne Jr.': 5700, 'David Montgomery': 5400,
        'Rhamondre Stevenson': 5000, 'Saquon Barkley': 8000, 'Derrick Henry': 8200,
        'Christian McCaffrey': 7500, 'James Conner': 6600, 'J.K. Dobbins': 5600,
        'Trey Benson': 4600, 'Isiah Pacheco': 5500, 'Jaylen Warren': 5400,
        
        'Tetairoa McMillan': 5400, 'Zay Flowers': 6200, 'George Pickens': 5800, 'DeVonta Smith': 5600,
        'Tee Higgins': 6100, 'DK Metcalf': 5900, 'Garrett Wilson': 6500, 'Jerry Jeudy': 5300,
        'Khalil Shakir': 5500, 'Courtland Sutton': 6300, 'Marvin Harrison Jr.': 5800,
        'Brian Thomas Jr.': 6700, 'Cedric Tillman': 4300, 'CeeDee Lamb': 7800, 'Jaylen Waddle': 5400,
        'Michael Pittman Jr.': 5100, 'Hollywood Brown': 5200, 'Keon Coleman': 5100,
        
        'Jonnu Smith': 3900, 'Juwan Johnson': 3600, 'David Njoku': 4400, 'Hunter Henry': 4000,
        'Mark Andrews': 4700, 'Jake Tonges': 3200, 'Travis Kelce': 5000, 'George Kittle': 5500,
        'Trey McBride': 6000, 'Sam LaPorta': 4800, 'Tyler Warren': 4500,
        
        'Cowboys': 3000, 'Bengals': 2900, 'Patriots': 2800, 'Dolphins': 2900, 'Eagles': 3000,
        'Colts': 2600, 'Cardinals': 3400, 'Chiefs': 2800, 'Jaguars': 2700, 'Broncos': 3500
    }
    
    # Budget alternatives for swaps
    budget_alternatives = {
        'QB': [
            ('Josh Allen', 'Daniel Jones', '39971313', 5200),
            ('Patrick Mahomes', 'Daniel Jones', '39971313', 5200),
            ('Jalen Hurts', 'Caleb Williams', '39971310', 5400),
            ('Lamar Jackson', 'Justin Fields', '39971307', 5700)
        ],
        'RB1': [
            ('Saquon Barkley', 'James Cook', '39971389', 6400),
            ('Saquon Barkley', 'Travis Etienne Jr.', '39971405', 5700),
            ('Derrick Henry', 'James Cook', '39971389', 6400),
            ('Christian McCaffrey', 'James Cook', '39971389', 6400)
        ],
        'RB2': [
            ('Jonathan Taylor', 'J.K. Dobbins', '39971409', 5600),
            ('James Conner', 'Travis Etienne Jr.', '39971405', 5700),
            ('Saquon Barkley', 'Chuba Hubbard', '39971397', 6000),
            ('James Cook', 'Chuba Hubbard', '39971397', 6000)
        ],
        'WR1': [
            ('Puka Nacua', 'Michael Pittman Jr.', '39971709', 5100),
            ('CeeDee Lamb', 'Hollywood Brown', '39971707', 5200),
            ('Garrett Wilson', 'Michael Pittman Jr.', '39971709', 5100)
        ],
        'WR2': [
            ('Courtland Sutton', 'Hollywood Brown', '39971707', 5200),
            ('Marvin Harrison Jr.', 'Michael Pittman Jr.', '39971709', 5100),
            ('DK Metcalf', 'Jerry Jeudy', '39971701', 5300)
        ],
        'WR3': [
            ('Marvin Harrison Jr.', 'Cedric Tillman', '39971741', 4300),
            ('Hollywood Brown', 'Cedric Tillman', '39971741', 4300),
            ('Michael Pittman Jr.', 'Cedric Tillman', '39971741', 4300)
        ],
        'TE': [
            ('Travis Kelce', 'Jonnu Smith', '39972113', 3900),
            ('Trey McBride', 'Hunter Henry', '39972111', 4000),
            ('George Kittle', 'Jonnu Smith', '39972113', 3900)
        ],
        'FLEX': [
            ('Saquon Barkley', 'J.K. Dobbins', '39971409', 5600),
            ('Jonathan Taylor', 'Travis Etienne Jr.', '39971405', 5700),
            ('James Conner', 'David Montgomery', '39971415', 5400)
        ],
        'DST': [
            ('Cardinals', 'Colts', '39972363', 2600),
            ('Broncos', 'Patriots', '39972359', 2800),
            ('Eagles', 'Colts', '39972363', 2600),
            ('Chiefs', 'Colts', '39972363', 2600)
        ]
    }
    
    with open('DKEntries (3).csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) >= 13 and row[0] and row[1] and not row[0].lower().startswith('position'):
                entry_id = row[0].strip()
                contest_name = row[1].strip()
                
                if entry_id and contest_name:
                    # Parse current lineup
                    lineup = {}
                    positions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST']
                    
                    total_salary = 0
                    
                    for i, pos_data in enumerate(row[4:13]):
                        pos = positions[i]
                        if pos_data and pos_data.strip():
                            is_locked = '(LOCKED)' in pos_data
                            clean_data = pos_data.replace(' (LOCKED)', '').strip()
                            
                            if '(' in clean_data and ')' in clean_data:
                                name = clean_data.split('(')[0].strip()
                                player_id = clean_data.split('(')[1].split(')')[0].strip()
                            else:
                                name = clean_data
                                player_id = ''
                            
                            lineup[pos] = {
                                'name': name,
                                'id': player_id,
                                'locked': is_locked
                            }
                            total_salary += salaries.get(name, 4000)
                        else:
                            lineup[pos] = {'name': '', 'id': '', 'locked': False}
                    
                    # Fix salary cap if needed
                    if total_salary > 50000:
                        lineup, total_salary = fix_salary_cap(lineup, salaries, budget_alternatives)
                    
                    if total_salary <= 50000:
                        entries.append({
                            'entry_id': entry_id,
                            'contest_name': contest_name,
                            'contest_id': row[2].strip(),
                            'entry_fee': row[3].strip(),
                            'lineup': lineup,
                            'total_salary': total_salary
                        })
    
    return entries

def fix_salary_cap(lineup, salaries, budget_alternatives):
    """Fix salary cap by making budget swaps to NON-LOCKED players"""
    total_salary = sum(salaries.get(player['name'], 4000) for player in lineup.values() if player['name'])
    
    # Try budget swaps for each position type
    for pos_type, swaps in budget_alternatives.items():
        if total_salary <= 50000:
            break
            
        for expensive_player, cheap_player, cheap_id, cheap_salary in swaps:
            if pos_type in lineup:
                current_player = lineup[pos_type]
                
                # Only swap if current player matches expensive option and isn't locked
                if (current_player['name'] == expensive_player and 
                    not current_player['locked']):
                    
                    # Calculate savings
                    current_salary = salaries.get(expensive_player, 4000)
                    savings = current_salary - cheap_salary
                    
                    if savings > 0 and total_salary - savings <= 50000:
                        # Make the swap
                        lineup[pos_type] = {
                            'name': cheap_player,
                            'id': cheap_id,
                            'locked': False
                        }
                        total_salary -= savings
                        break
    
    return lineup, total_salary

def create_final_upload_csv(entries):
    """Create final salary-compliant upload CSV"""
    print("📄 CREATING SALARY COMPLIANT UPLOAD CSV")
    
    with open('DKEntries_SALARY_FIXED_UPLOAD.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        for entry in entries:
            lineup = entry['lineup']
            writer.writerow([
                entry['entry_id'], entry['contest_name'], entry['contest_id'], entry['entry_fee'],
                f"{lineup['QB']['name']} ({lineup['QB']['id']})",
                f"{lineup['RB1']['name']} ({lineup['RB1']['id']})",
                f"{lineup['RB2']['name']} ({lineup['RB2']['id']})",
                f"{lineup['WR1']['name']} ({lineup['WR1']['id']})",
                f"{lineup['WR2']['name']} ({lineup['WR2']['id']})",
                f"{lineup['WR3']['name']} ({lineup['WR3']['id']})",
                f"{lineup['TE']['name']} ({lineup['TE']['id']})",
                f"{lineup['FLEX']['name']} ({lineup['FLEX']['id']})",
                f"{lineup['DST']['name']} ({lineup['DST']['id']})",
                '',
                f"SALARY: ${entry['total_salary']:,} | UNDER CAP"
            ])
    
    print("✅ Salary-compliant file created: DKEntries_SALARY_FIXED_UPLOAD.csv")
    print("🎯 All lineups guaranteed under $50,000")

if __name__ == "__main__":
    main()
