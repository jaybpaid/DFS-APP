#!/usr/bin/env python3
"""
LATE SWAP ANALYSIS - Compare original vs optimized lineups
Shows exact swaps made respecting LOCKED constraints
"""

import csv

def main():
    print("📊 LATE SWAP ANALYSIS")
    print("Comparing original vs optimized lineups")
    print("=" * 60)
    
    # Load original and optimized data
    original_entries = load_original_entries()
    optimized_entries = load_optimized_entries()
    
    print(f"Original entries: {len(original_entries)}")
    print(f"Optimized entries: {len(optimized_entries)}")
    
    # Analyze top performers by slate
    analyze_top_performers_by_slate(original_entries, optimized_entries)
    
    # Create final upload CSV
    create_upload_csv(optimized_entries)

def load_original_entries():
    """Load original DKEntries (3).csv"""
    entries = {}
    
    with open('DKEntries (3).csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) >= 13 and row[0] and row[1] and not row[0].lower().startswith('position'):
                entry_id = row[0].strip()
                if entry_id:
                    entries[entry_id] = {
                        'entry_id': entry_id,
                        'contest_name': row[1].strip(),
                        'contest_id': row[2].strip(),
                        'entry_fee': row[3].strip(),
                        'lineup': parse_lineup_positions(row[4:13])
                    }
    
    return entries

def load_optimized_entries():
    """Load optimized results"""
    entries = {}
    
    with open('DKEntries_HIGHEST_WINRATE_NO_DUPLICATES.csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if len(row) >= 13 and row[0]:
                entry_id = row[0].strip()
                if entry_id:
                    # Extract win rate and metrics from instructions
                    instructions = row[14] if len(row) > 14 else ''
                    win_rate = extract_win_rate(instructions)
                    
                    entries[entry_id] = {
                        'entry_id': entry_id,
                        'contest_name': row[1].strip(),
                        'contest_id': row[2].strip(),
                        'entry_fee': row[3].strip(),
                        'lineup': parse_lineup_positions(row[4:13]),
                        'win_rate': win_rate,
                        'instructions': instructions
                    }
    
    return entries

def parse_lineup_positions(lineup_data):
    """Parse lineup data into position dictionary"""
    positions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST']
    lineup = {}
    
    for i, pos_data in enumerate(lineup_data):
        pos_name = positions[i]
        if pos_data and pos_data.strip():
            is_locked = '(LOCKED)' in pos_data
            clean_data = pos_data.replace(' (LOCKED)', '').strip()
            
            # Parse player name and ID
            if '(' in clean_data and ')' in clean_data:
                name = clean_data.split('(')[0].strip()
                player_id = clean_data.split('(')[1].split(')')[0].strip()
            else:
                name = clean_data
                player_id = ''
            
            lineup[pos_name] = {
                'name': name,
                'id': player_id,
                'locked': is_locked
            }
        else:
            lineup[pos_name] = {'name': '', 'id': '', 'locked': False}
    
    return lineup

def extract_win_rate(instructions):
    """Extract win rate from instructions string"""
    if 'Win:' in instructions:
        try:
            win_part = instructions.split('Win:')[1].split('%')[0].strip()
            return float(win_part)
        except:
            return 0.0
    return 0.0

def analyze_top_performers_by_slate(original_entries, optimized_entries):
    """Analyze top performers by slate with swap details"""
    
    # Group by contest type
    slates = {
        'cash': [],
        'large_gpp': [],
        'mid_gpp': [],
        'small_gpp': []
    }
    
    for entry_id, opt_entry in optimized_entries.items():
        if entry_id in original_entries:
            orig_entry = original_entries[entry_id]
            
            # Get swaps made
            swaps = compare_lineups(orig_entry['lineup'], opt_entry['lineup'])
            
            entry_data = {
                'entry_id': entry_id,
                'contest_name': opt_entry['contest_name'],
                'win_rate': opt_entry['win_rate'],
                'instructions': opt_entry['instructions'],
                'swaps': swaps,
                'original': orig_entry['lineup'],
                'optimized': opt_entry['lineup']
            }
            
            # Categorize by contest
            if 'Play-Action [20' in opt_entry['contest_name']:
                slates['cash'].append(entry_data)
            elif 'Millionaire' in opt_entry['contest_name']:
                slates['large_gpp'].append(entry_data)
            elif 'Flea Flicker' in opt_entry['contest_name']:
                slates['mid_gpp'].append(entry_data)
            else:
                slates['small_gpp'].append(entry_data)
    
    # Print top 3 per slate
    print_top_performers(slates)

def compare_lineups(original, optimized):
    """Compare lineups and return swaps made"""
    swaps = []
    
    for pos in original:
        orig_player = original[pos]
        opt_player = optimized[pos]
        
        # Only count as swap if player changed and original wasn't locked
        if (orig_player['name'] != opt_player['name'] and 
            orig_player['name'] and opt_player['name'] and
            not orig_player['locked']):
            swaps.append({
                'position': pos,
                'from': orig_player['name'],
                'to': opt_player['name'],
                'to_id': opt_player['id']
            })
    
    return swaps

def print_top_performers(slates):
    """Print top 3 performers per slate with swap details"""
    
    slate_names = {
        'cash': '💰 CASH GAMES (Play-Action [20 Entry Max])',
        'large_gpp': '🎰 LARGE GPP (Millionaire [$1M to 1st])',
        'mid_gpp': '⚡ MID GPP (Flea Flicker [$50K to 1st])',
        'small_gpp': '🚀 SMALL GPP (Mini-MAX [150 Entry Max])'
    }
    
    for slate_type, entries in slates.items():
        if not entries:
            continue
            
        # Sort by win rate
        entries.sort(key=lambda x: x['win_rate'], reverse=True)
        
        print(f"\n{slate_names[slate_type]}:")
        print("=" * 65)
        
        # Show top 3
        for i, entry in enumerate(entries[:3], 1):
            print(f"\n🏆 #{i} HIGHEST WIN%: Entry {entry['entry_id']}")
            print(f"   📈 {entry['instructions']}")
            print(f"   🔄 SWAPS MADE ({len(entry['swaps'])} total):")
            
            if entry['swaps']:
                for swap in entry['swaps']:
                    print(f"      {swap['position']}: {swap['from']} → {swap['to']} ({swap['to_id']})")
            else:
                print("      No swaps needed - original lineup was optimal")
            
            print(f"   ✅ FINAL LINEUP:")
            for pos in ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'DST']:
                player = entry['optimized'][pos]
                locked_status = " (LOCKED)" if entry['original'][pos]['locked'] else ""
                print(f"      {pos}: {player['name']} ({player['id']}){locked_status}")

def create_upload_csv(optimized_entries):
    """Create final upload-ready CSV"""
    print("\n📄 CREATING UPLOAD-READY CSV")
    
    with open('DKEntries_UPLOAD_READY.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Entry ID', 'Contest Name', 'Contest ID', 'Entry Fee',
                        'QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'DST', '', 'Instructions'])
        
        for entry_id, entry in optimized_entries.items():
            lineup = entry['lineup']
            writer.writerow([
                entry_id, entry['contest_name'], entry['contest_id'], entry['entry_fee'],
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
                f"1. Column A lists all of your contest entries for this draftgroup"
            ])
    
    print("✅ Upload file created: DKEntries_UPLOAD_READY.csv")
    print("📤 Ready for DraftKings import")

if __name__ == "__main__":
    main()
