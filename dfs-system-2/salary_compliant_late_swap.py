#!/usr/bin/env python3
"""
SALARY COMPLIANT LATE SWAP OPTIMIZER
Creates lineups under $50K respecting LOCKED constraints
"""

import csv

def main():
    print("🔄 SALARY COMPLIANT LATE SWAP OPTIMIZER")
    print("Creating lineups under $50K with LOCKED constraints")
    print("=" * 60)
    
    # Load original entries
    entries = load_original_entries_with_locks()
    player_salaries = create_salary_database()
    
    print(f"📊 Loaded {len(entries)} entries")
    
    # Create salary-compliant optimized lineups
    create_salary_compliant_csv(entries, player_salaries)

def load_original_entries_with_locks():
    """Load original entries with LOCKED status"""
    entries = []
    
    with open('DKEntries (3).csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) >= 13 and row[0] and row[1] and not row[0].lower().startswith('position'):
                entry_id = row[0].strip()
                contest_name = row[1].strip()
                
                if entry_id and contest_name:
                    lineup = {}
                    positions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST']
                    
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
                        else:
                            lineup[pos] = {'name': '', 'id': '', 'locked': False}
                    
                    entries.append({
                        'entry_id': entry_id,
                        'contest_name': contest_name,
                        'contest_id': row[2].strip(),
                        'entry_fee': row[3].strip(),
                        'lineup': lineup
                    })
    
    return entries

def create_salary_database():
    """Create accurate salary database"""
    return {
        # QBs
        'Justin Fields': 5700, 'Bo Nix': 6100, 'Tua Tagovailoa': 5300, 'Drake Maye': 5200,
        'Dak Prescott': 5900, 'Josh Allen': 7100, 'Lamar Jackson': 7000, 'Patrick Mahomes': 6200,
        'Aaron Rodgers': 5500, 'Jalen Hurts': 6800, 'Daniel Jones': 5200, 'Caleb Williams': 5400,
        'Joe Burrow': 6600, 'Kyler Murray': 6400, 'Brock Purdy': 6300, 'Trevor Lawrence': 5600,
        
        # RBs  
        'Chuba Hubbard': 6000, 'James Cook': 6400, 'Breece Hall': 6200, 'Tony Pollard': 5900,
        'Alvin Kamara': 6100, 'Jonathan Taylor': 6700, 'Kyren Williams': 6300, 'Chase Brown': 6800,
        'Kenneth Walker III': 5600, 'Travis Etienne Jr.': 5700, 'David Montgomery': 5400,
        'Rhamondre Stevenson': 5000, 'Saquon Barkley': 8000, 'Derrick Henry': 8200,
        'Christian McCaffrey': 7500, 'James Conner': 6600, 'J.K. Dobbins': 5600,
        'Trey Benson': 4600, 'Isiah Pacheco': 5500, 'Jaylen Warren': 5400,
        
        # WRs
        'Tetairoa McMillan': 5400, 'Zay Flowers': 6200, 'George Pickens': 5800, 'DeVonta Smith': 5600,
        'Tee Higgins': 6100, 'DK Metcalf': 5900, 'Garrett Wilson': 6500, 'Jerry Jeudy': 5300,
        'Khalil Shakir': 5500, 'Courtland Sutton': 6300, 'Marvin Harrison Jr.': 5800,
        'Brian Thomas Jr.': 6700, 'Cedric Tillman': 4300, 'CeeDee Lamb': 7800, 'Jaylen Waddle': 5400,
        'Michael Pittman Jr.': 5100, 'Hollywood Brown': 5200, 'Keon Coleman': 5100,
        'Jaxon Smith-Njigba': 6000, 'Puka Nacua': 7600, 'Xavier Worthy': 5700,
        
        # TEs
        'Jonnu Smith': 3900, 'Juwan Johnson': 3600, 'David Njoku': 4400, 'Hunter Henry': 4000,
        'Mark Andrews': 4700, 'Jake Tonges': 3200, 'Travis Kelce': 5000, 'George Kittle': 5500,
        'Trey McBride': 6000, 'Sam LaPorta': 4800, 'Tyler Warren': 4500,
        
        # DSTs
        'Cowboys': 3000, 'Bengals': 2900, 'Patriots': 2800, 'Dolphins': 2900, 'Eagles': 3000,
        'Colts': 2600, 'Cardinals': 3400, 'Chiefs': 2800, 'Jaguars': 2700, 'Broncos': 3500
    }

def create_salary_compliant_csv(entries, salaries):
    """Create salary-compliant optimized lineups"""
    print("⚡ CREATING SALARY COMPLIANT LINEUPS")
    
    successful_lineups = 0
    
    with open('DKEntries_SALARY_COMPLIANT_UPLOAD.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        for entry in entries:
            # Create salary-compliant lineup
            optimized_lineup = optimize_within_salary_cap(entry, salaries)
            
            if optimized_lineup:
                total_salary = optimized_lineup['total_salary']
                
                if total_salary <= 50000:
                    writer.writerow([
                        entry['entry_id'], entry['contest_name'], entry['contest_id'], entry['entry_fee'],
                        f"{optimized_lineup['QB']['name']} ({optimized_lineup['QB']['id']})",
                        f"{optimized_lineup['RB1']['name']} ({optimized_lineup['RB1']['id']})",
                        f"{optimized_lineup['RB2']['name']} ({optimized_lineup['RB2']['id']})",
                        f"{optimized_lineup['WR1']['name']} ({optimized_lineup['WR1']['id']})",
                        f"{optimized_lineup['WR2']['name']} ({optimized_lineup['WR2']['id']})",
                        f"{optimized_lineup['WR3']['name']} ({optimized_lineup['WR3']['id']})",
                        f"{optimized_lineup['TE']['name']} ({optimized_lineup['TE']['id']})",
                        f"{optimized_lineup['FLEX']['name']} ({optimized_lineup['FLEX']['id']})",
                        f"{optimized_lineup['DST']['name']} ({optimized_lineup['DST']['id']})",
                        '',
                        f"1. Column A lists all of your contest entries for this draftgroup"
                    ])
                    successful_lineups += 1
    
    print(f"✅ Created {successful_lineups} salary-compliant lineups")
    print(f"📄 File: DKEntries_SALARY_COMPLIANT_UPLOAD.csv")

def optimize_within_salary_cap(entry, salaries):
    """Optimize lineup within salary cap respecting locks"""
    lineup = {}
    total_salary = 0
    
    # Start with locked players
    for pos, player in entry['lineup'].items():
        if player['locked'] and player['name']:
            lineup[pos] = player.copy()
            total_salary += salaries.get(player['name'], 4000)
        else:
            lineup[pos] = player.copy()
            if player['name']:
                total_salary += salaries.get(player['name'], 4000)
    
    # If over salary cap, make budget-conscious swaps for NON-LOCKED players
    if total_salary > 50000:
        # Define budget alternatives for each position
        budget_swaps = {
            'QB': [
                {'name': 'Drake Maye', 'id': '39971312', 'salary': 5200},
                {'name': 'Daniel Jones', 'id': '39971313', 'salary': 5200},
                {'name': 'Tua Tagovailoa', 'id': '39971311', 'salary': 5300},
                {'name': 'Caleb Williams', 'id': '39971310', 'salary': 5400}
            ],
            'RB1': [
                {'name': 'Travis Etienne Jr.', 'id': '39971405', 'salary': 5700},
                {'name': 'J.K. Dobbins', 'id': '39971409', 'salary': 5600},
                {'name': 'Chuba Hubbard', 'id': '39971397', 'salary': 6000},
                {'name': 'James Cook', 'id': '39971389', 'salary': 6400}
            ],
            'RB2': [
                {'name': 'J.K. Dobbins', 'id': '39971409', 'salary': 5600},
                {'name': 'Travis Etienne Jr.', 'id': '39971405', 'salary': 5700},
                {'name': 'David Montgomery', 'id': '39971415', 'salary': 5400},
                {'name': 'Trey Benson', 'id': '39971451', 'salary': 4600}
            ],
            'WR1': [
                {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100},
                {'name': 'Hollywood Brown', 'id': '39971707', 'salary': 5200},
                {'name': 'Keon Coleman', 'id': '39971711', 'salary': 5100},
                {'name': 'Jerry Jeudy', 'id': '39971701', 'salary': 5300}
            ],
            'WR2': [
                {'name': 'Hollywood Brown', 'id': '39971707', 'salary': 5200},
                {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100},
                {'name': 'Jerry Jeudy', 'id': '39971701', 'salary': 5300},
                {'name': 'Khalil Shakir', 'id': '39971695', 'salary': 5500}
            ],
            'WR3': [
                {'name': 'Cedric Tillman', 'id': '39971741', 'salary': 4300},
                {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100},
                {'name': 'Jerry Jeudy', 'id': '39971701', 'salary': 5300},
                {'name': 'Keon Coleman', 'id': '39971711', 'salary': 5100}
            ],
            'TE': [
                {'name': 'Jonnu Smith', 'id': '39972113', 'salary': 3900},
                {'name': 'Juwan Johnson', 'id': '39972123', 'salary': 3600},
                {'name': 'Hunter Henry', 'id': '39972111', 'salary': 4000},
                {'name': 'Jake Ferguson', 'id': '39972117', 'salary': 3800}
            ],
            'FLEX': [
                {'name': 'Michael Pittman Jr.', 'id': '39971709', 'salary': 5100},
                {'name': 'Travis Etienne Jr.', 'id': '39971405', 'salary': 5700},
                {'name': 'J.K. Dobbins', 'id': '39971409', 'salary': 5600},
                {'name': 'Jerry Jeudy', 'id': '39971701', 'salary': 5300}
            ],
            'DST': [
                {'name': 'Colts', 'id': '39972363', 'salary': 2600},
                {'name': 'Panthers', 'id': '39972369', 'salary': 2300},
                {'name': 'Jets', 'id': '39972367', 'salary': 2400},
                {'name': 'Patriots', 'id': '39972359', 'salary': 2800}
            ]
        }
        
        # Try budget swaps for NON-LOCKED positions
        for pos, player in lineup.items():
            if not player['locked'] and pos in budget_swaps:
                current_salary = salaries.get(player['name'], 4000)
                
                # Find cheaper alternatives
                for budget_option in budget_swaps[pos]:
                    if budget_option['salary'] < current_salary:
                        # Calculate salary savings
                        savings = current_salary - budget_option['salary']
                        if total_salary - savings <= 50000:
                            # Make the swap
                            lineup[pos] = budget_option.copy()
                            total_salary = total_salary - savings
                            break
                
                if total_salary <= 50000:
                    break
    
    return {
        **lineup,
        'total_salary': total_salary
    }

def get_player_salary(name, salaries):
    """Get player salary from database"""
    return salaries.get(name, 4000)

if __name__ == "__main__":
    main()
