#!/usr/bin/env python3
"""
Docker-Enhanced Data Updater for Embedded DFS Dashboard
Reads all JSON data sources and updates embedded data in HTML file
"""

import json
import os
import re
from datetime import datetime
from typing import Dict, List, Any

class DockerDataUpdater:
    def __init__(self):
        self.data_sources = [
            'public/data/nfl_players_live.json',
            'data/current_player_pool.json',
            'data/monorepo_player_pool.json',
            'data/available_slates.json',
            'data/live_projections.json',
            'data/weather_data.json',
            'data/ownership_data.json',
            'data/injury_news.json',
            'data/sync_log.json'
        ]
        self.html_file = 'EMBEDDED_DATA_DASHBOARD.html'
        
    def load_all_data_sources(self) -> Dict[str, Any]:
        """Load data from all available JSON sources"""
        print("🔄 Loading data from all sources...")
        
        combined_data = {
            'players': [],
            'slates': [],
            'system_status': {},
            'last_updated': datetime.now().isoformat()
        }
        
        # Load player data from multiple sources
        player_sources = [
            'public/data/nfl_players_live.json',
            'data/current_player_pool.json',
            'data/monorepo_player_pool.json'
        ]
        
        for source in player_sources:
            try:
                if os.path.exists(source):
                    with open(source, 'r') as f:
                        data = json.load(f)
                        
                    # Handle different data formats
                    if isinstance(data, dict) and 'players' in data:
                        players = data['players']
                    elif isinstance(data, list):
                        players = data
                    else:
                        players = []
                    
                    if players:
                        combined_data['players'].extend(players)
                        print(f"✅ Loaded {len(players)} players from {source}")
                        break  # Use first successful source
                        
            except Exception as e:
                print(f"⚠️ Failed to load {source}: {e}")
        
        # Load slate data
        try:
            if os.path.exists('data/available_slates.json'):
                with open('data/available_slates.json', 'r') as f:
                    slate_data = json.load(f)
                    combined_data['slates'] = slate_data.get('slates', [])
                    combined_data['active_slates'] = slate_data.get('active_slates', 0)
                    print(f"✅ Loaded slate data")
        except Exception as e:
            print(f"⚠️ Failed to load slate data: {e}")
        
        # Load system status
        try:
            if os.path.exists('data/sync_log.json'):
                with open('data/sync_log.json', 'r') as f:
                    sync_data = json.load(f)
                    combined_data['system_status'] = sync_data
                    print(f"✅ Loaded system status")
        except Exception as e:
            print(f"⚠️ Failed to load system status: {e}")
        
        return combined_data
    
    def prepare_embedded_data(self, combined_data: Dict[str, Any]) -> str:
        """Prepare JavaScript data for embedding"""
        
        # Get top players by position for embedding
        players = combined_data['players'][:35]  # Limit for performance
        
        # Ensure required fields exist
        for player in players:
            if 'leverage_score' not in player:
                player['leverage_score'] = (player.get('projection', 0) / max(player.get('salary', 1), 1) * 1000) * 2
            if 'opponent' not in player:
                player['opponent'] = 'TBD'
        
        embedded_js = f"""
        // EMBEDDED DATA - Updated by Docker container
        // DATA_EMBED_START
        const EMBEDDED_PLAYER_DATA = {json.dumps(players, indent=8)};

        const EMBEDDED_SLATE_DATA = {{
            "active_slates": {combined_data.get('active_slates', 1)},
            "slates": {json.dumps(combined_data.get('slates', []), indent=8)}
        }};

        const EMBEDDED_SYSTEM_STATUS = {{
            "last_update": "{combined_data['last_updated']}",
            "total_players": {len(players)},
            "data_sources_active": {len([s for s in self.data_sources if os.path.exists(s)])}
        }};
        // DATA_EMBED_END
        """
        
        return embedded_js
    
    def update_html_file(self, embedded_js: str) -> bool:
        """Update HTML file with new embedded data"""
        try:
            # Read current HTML file
            with open(self.html_file, 'r') as f:
                html_content = f.read()
            
            # Find and replace embedded data section
            pattern = r'// DATA_EMBED_START.*?// DATA_EMBED_END'
            
            if re.search(pattern, html_content, re.DOTALL):
                # Replace existing embedded data
                updated_html = re.sub(pattern, embedded_js.strip(), html_content, flags=re.DOTALL)
                
                # Write updated file
                with open(self.html_file, 'w') as f:
                    f.write(updated_html)
                
                print(f"✅ Updated {self.html_file} with fresh embedded data")
                return True
            else:
                print(f"❌ Could not find DATA_EMBED section in {self.html_file}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to update HTML file: {e}")
            return False
    
    def run_update_cycle(self):
        """Run complete data update cycle"""
        print("🚀 DOCKER DATA UPDATER - Starting Update Cycle")
        print("=" * 60)
        
        # Load all data sources
        combined_data = self.load_all_data_sources()
        
        if not combined_data['players']:
            print("❌ No player data found - cannot update dashboard")
            return False
        
        # Prepare embedded JavaScript
        embedded_js = self.prepare_embedded_data(combined_data)
        
        # Update HTML file
        success = self.update_html_file(embedded_js)
        
        if success:
            print(f"\n✅ DASHBOARD UPDATE COMPLETE")
            print(f"📊 Players: {len(combined_data['players'])}")
            print(f"🎯 Slates: {combined_data.get('active_slates', 0)}")
            print(f"⏰ Updated: {combined_data['last_updated']}")
            print(f"🔗 Dashboard ready at: {self.html_file}")
        else:
            print(f"\n❌ DASHBOARD UPDATE FAILED")
        
        return success

def main():
    """Main execution function"""
    updater = DockerDataUpdater()
    
    # Run update cycle
    success = updater.run_update_cycle()
    
    if success:
        print(f"\n🎉 SUCCESS: Dashboard updated with live data")
        print(f"📱 Open {updater.html_file} to see instant-loading dashboard")
    else:
        print(f"\n💥 FAILED: Dashboard update unsuccessful")
        exit(1)

if __name__ == "__main__":
    main()
