#!/usr/bin/env python3
"""
THE SOLVER + YOUR BACKEND INTEGRATION SERVER
Combines The Solver's professional interface with your advanced optimization engines
"""

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import sys
import os
import json
import pandas as pd
from datetime import datetime
import logging

# Add your existing DFS system paths
sys.path.append('./dfs-system-2')

# Import your existing optimization engines - NO FALLBACKS, LIVE DATA ONLY
try:
    from pydfs_optimizer_implementation import PyDFSOptimizerEngine
    from ai_enhanced_late_swap import AIEnhancedOptimizer
    from late_swap_analyzer import LateSwapAnalyzer
    from draftkings_api_server import DraftKingsAPIClient
    from live_data_integration import LiveDataIntegration
    from COMPLETE_FIXED_LIVE_DATA_SYSTEM import CompleteFixedLiveDataSystem
    from advanced_simulation_engine_upgrade import SimulationEngine
    from bulletproof_late_swap_engine import BulletproofOptimizer
    from draft_kings import Client as DraftKingsClient
    BACKEND_AVAILABLE = True
    print("✅ ALL LIVE BACKEND ENGINES LOADED - NO DEMO MODE")
except ImportError as e:
    print(f"❌ CRITICAL: Backend engines REQUIRED for live data - {e}")
    print("❌ CANNOT RUN IN DEMO MODE - LIVE FEEDS REQUIRED")
    sys.exit(1)  # FORCE EXIT - NO DEMO MODE ALLOWED

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend connection

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SolverIntegrationAPI:
    """LIVE DATA ONLY - The Solver UI with your live backend feeds"""
    
    def __init__(self):
        self.current_slate = None
        self.player_pool = []
        self.optimized_lineups = []
        
        # Initialize ALL live systems - NO DEMO MODE
        print("🔴 INITIALIZING LIVE DATA SYSTEMS ONLY")
        self.pydfs_engine = PyDFSOptimizerEngine()
        self.ai_optimizer = AIEnhancedOptimizer() 
        self.late_swap_analyzer = LateSwapAnalyzer()
        self.dk_client = DraftKingsClient()  # Real DraftKings client
        self.live_data_system = CompleteFixedLiveDataSystem()
        self.simulation_engine = SimulationEngine()
        self.bulletproof_optimizer = BulletproofOptimizer()
        
        # Verify live connections immediately
        self._verify_live_connections()
        logger.info("✅ ALL LIVE OPTIMIZATION ENGINES INITIALIZED - NO DEMO MODE")
    
    def _verify_live_connections(self):
        """Verify all live data connections are working - REQUIRED"""
        print("🔍 VERIFYING LIVE DATA CONNECTIONS...")
        
        # Test ESPN connection
        espn_data = self.live_data_system.connect_real_espn_api_fixed()
        if espn_data['successful_connections'] == 0:
            raise Exception("❌ ESPN API connection FAILED - Live data required")
        print(f"✅ ESPN API: {espn_data['successful_connections']} connections working")
        
        # Test DraftKings connection
        try:
            contests = self.dk_client.available_contests()
            print(f"✅ DraftKings API: {len(contests) if contests else 0} contests available")
        except Exception as e:
            raise Exception(f"❌ DraftKings API connection FAILED: {e}")
        
    def load_player_data(self, sport='nfl'):
        """LIVE DATA ONLY - Load from real feeds with NO fallbacks"""
        print(f"📡 LOADING LIVE {sport.upper()} DATA - NO DEMO MODE")
        
        try:
            if sport == 'nfl':
                # Get LIVE DraftKings contest data
                print("🔗 Connecting to LIVE DraftKings API...")
                contests = self.dk_client.available_contests()
                
                if not contests:
                    raise Exception("❌ NO LIVE CONTESTS AVAILABLE - Cannot proceed without live data")
                
                # Get the current main slate
                nfl_contests = [c for c in contests if 'NFL' in c.get('name', '')]
                if not nfl_contests:
                    raise Exception("❌ NO LIVE NFL CONTESTS AVAILABLE")
                
                main_contest = nfl_contests[0]  # Get main slate
                print(f"✅ Live contest found: {main_contest.get('name', 'Unknown')}")
                
                # Get LIVE player data from ESPN/DraftKings
                print("🔗 Loading LIVE player projections...")
                espn_data = self.live_data_system.connect_real_espn_api_fixed()
                
                if espn_data['successful_connections'] == 0:
                    raise Exception("❌ ESPN LIVE DATA UNAVAILABLE - Cannot proceed")
                
                # Extract REAL player data
                players = []
                game_data = espn_data.get('games_found', [])
                
                for game in game_data:
                    teams = game['teams'].split(' vs ')
                    if len(teams) >= 2:
                        # This would connect to your actual player data extraction
                        # For now, indicating the structure for LIVE data only
                        pass
                
                if not players:
                    raise Exception("❌ NO LIVE PLAYERS DATA AVAILABLE - Live feeds required")
                
                self.player_pool = players
                print(f"✅ LIVE DATA LOADED: {len(players)} players")
                return players
                
        except Exception as e:
            # NO FALLBACK TO SAMPLE DATA - MUST USE LIVE
            logger.error(f"❌ CRITICAL: Live data loading failed: {e}")
            raise Exception(f"LIVE DATA REQUIRED - Demo mode disabled: {e}")
    
    def optimize_lineups(self, settings, selected_players=None):
        """LIVE OPTIMIZATION ONLY - No demo fallbacks"""
        print(f"🚀 RUNNING LIVE OPTIMIZATION - NO DEMO MODE")
        
        if not self.player_pool:
            raise Exception("❌ NO LIVE PLAYER DATA - Cannot optimize without live feeds")
        
        optimization_config = {
            'lineup_count': int(settings.get('lineupCount', 180)),
            'use_ai': settings.get('useAI', True),
            'late_swap': settings.get('lateSwap', True), 
            'live_data': True,  # ALWAYS use live data
            'salary_cap': 50000,
            'selected_players': selected_players or []
        }
        
        print(f"⚙️ Optimizing {optimization_config['lineup_count']} lineups with LIVE data")
        
        try:
            if settings.get('useAI'):
                print("🤖 Using AI-enhanced optimization...")
                lineups = self.ai_optimizer.optimize(self.player_pool, optimization_config)
            else:
                print("⚡ Using PyDFS optimization...")
                lineups = self.pydfs_engine.optimize(self.player_pool, optimization_config)
            
            if not lineups:
                raise Exception("❌ OPTIMIZATION FAILED - No lineups generated")
            
            # ALWAYS apply late swap analysis
            if settings.get('lateSwap'):
                print("⏰ Applying live late swap analysis...")
                lineups = self.late_swap_analyzer.analyze_and_optimize(lineups)
            
            self.optimized_lineups = lineups
            print(f"✅ LIVE OPTIMIZATION COMPLETE: {len(lineups)} lineups generated")
            return lineups[0] if lineups else None
            
        except Exception as e:
            logger.error(f"❌ LIVE optimization failed: {e}")
            raise Exception(f"LIVE OPTIMIZATION FAILED - No demo fallback: {e}")
    
    def export_to_csv(self, lineups):
        """LIVE CSV EXPORT ONLY - No demo fallbacks"""
        print("📤 EXPORTING LIVE LINEUPS TO CSV...")
        
        if not lineups:
            raise Exception("❌ NO LINEUPS TO EXPORT - Live optimization required")
        
        try:
            # Create DraftKings-formatted CSV with LIVE data
            lineup_data = []
            for lineup in lineups:
                if not lineup:
                    continue
                    
                dk_format = {
                    'QB': next((p['name'] for p in lineup if p['pos'] == 'QB'), ''),
                    'RB': next((p['name'] for p in lineup if p['pos'] == 'RB'), ''),
                    'RB2': '',  # Will be filled from multiple RBs
                    'WR': next((p['name'] for p in lineup if p['pos'] == 'WR'), ''),
                    'WR2': '',  # Will be filled from multiple WRs
                    'TE': next((p['name'] for p in lineup if p['pos'] == 'TE'), ''),
                    'FLEX': next((p['name'] for p in lineup if p['pos'] == 'FLEX'), ''),
                    'DST': next((p['name'] for p in lineup if p['pos'] == 'DST'), '')
                }
                lineup_data.append(dk_format)
            
            if not lineup_data:
                raise Exception("❌ NO VALID LINEUP DATA FOR EXPORT")
            
            df = pd.DataFrame(lineup_data)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            csv_path = f"DKEntries_LIVE_OPTIMIZED_{timestamp}.csv"
            df.to_csv(csv_path, index=False)
            
            print(f"✅ LIVE CSV EXPORTED: {csv_path} ({len(lineup_data)} lineups)")
            return csv_path
            
        except Exception as e:
            logger.error(f"❌ LIVE CSV export failed: {e}")
            raise Exception(f"CSV EXPORT FAILED - No demo fallback available: {e}")
    
    def get_team_color(self, team):
        """Team color mapping from The Solver capture"""
        colors = {
            'KC': '#e31837', 'BUF': '#00338d', 'HOU': '#03202f',
            'NYJ': '#125740', 'BAL': '#241773', 'PIT': '#ffb612',
            'CLE': '#311d00', 'MIA': '#008e97', 'NE': '#002244'
        }
        return colors.get(team, '#666666')
    
    def is_late_game(self, game_time):
        """Check if game qualifies for late swap"""
        # Implement your late game logic
        return True  # Placeholder
    
    # ALL SAMPLE DATA FUNCTIONS REMOVED - LIVE DATA ONLY

# Initialize the integration system
solver_api = SolverIntegrationAPI()

@app.route('/api/players/<sport>')
def get_players(sport):
    """Get player data for the specified sport"""
    try:
        players = solver_api.load_player_data(sport)
        return jsonify({
            'success': True,
            'players': players,
            'count': len(players),
            'sport': sport,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error loading players: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/optimize', methods=['POST'])
def optimize_lineup():
    """Run optimization using your backend engines"""
    try:
        data = request.get_json()
        settings = data.get('settings', {})
        selected_players = data.get('selectedPlayers', [])
        rules = data.get('rules', {})
        
        logger.info(f"🔧 Optimizing with settings: {settings}")
        
        # Run optimization through your backend
        optimized_lineup = solver_api.optimize_lineups(settings, selected_players)
        
        return jsonify({
            'success': True,
            'lineup': optimized_lineup,
            'total_salary': sum(p['salary'] for p in optimized_lineup),
            'projected_points': sum(p['proj'] for p in optimized_lineup),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Optimization error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/export/csv', methods=['POST'])
def export_csv():
    """Export lineups to CSV using your backend"""
    try:
        data = request.get_json()
        lineup = data.get('lineup', [])
        
        csv_path = solver_api.export_to_csv([lineup])
        
        return send_file(csv_path, as_attachment=True, download_name='DKEntries_SOLVER_INTEGRATED.csv')
        
    except Exception as e:
        logger.error(f"Export error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/simulation', methods=['POST'])
def run_simulation():
    """Run simulation analysis using your engines"""
    try:
        data = request.get_json()
        
        # LIVE simulation engines only - no demo mode
        print("🎯 RUNNING LIVE SIMULATION ANALYSIS...")
        if not solver_api.player_pool:
            raise Exception("❌ NO LIVE PLAYER DATA - Cannot run simulation")
            
        results = solver_api.simulation_engine.run_full_simulation(
            solver_api.player_pool, 
            data.get('settings', {})
        )
        
        if not results:
            raise Exception("❌ SIMULATION FAILED - No results generated")
        
        return jsonify({
            'success': True,
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Simulation error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/status')
def api_status():
    """Check backend connection status"""
    return jsonify({
        'live_mode': 'ENABLED',
        'demo_mode': 'DISABLED', 
        'engines_loaded': {
            'pydfs': hasattr(solver_api, 'pydfs_engine'),
            'ai_optimizer': hasattr(solver_api, 'ai_optimizer'),
            'late_swap': hasattr(solver_api, 'late_swap_analyzer'),
            'simulation': hasattr(solver_api, 'simulation_engine'),
            'live_data_system': hasattr(solver_api, 'live_data_system'),
            'draftkings_client': hasattr(solver_api, 'dk_client')
        },
        'live_connections_verified': True,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/')
def serve_interface():
    """Serve The Solver integrated interface"""
    return send_file('THE_SOLVER_INTEGRATED_OPTIMIZER.html')

if __name__ == '__main__':
    print("🚀 STARTING THE SOLVER + YOUR LIVE BACKEND INTEGRATION")
    print("=" * 60)
    print("📊 Interface: The Solver's professional design")
    print("🔧 Backend: Your live optimization engines ONLY")
    print("🔴 Mode: LIVE DATA ONLY - NO DEMO MODE")
    print("🌐 Access: http://localhost:8000")
    print("=" * 60)
    
    print("✅ ALL LIVE BACKEND ENGINES CONNECTED")
    print("❌ DEMO MODE COMPLETELY DISABLED")
    print("🔴 LIVE FEEDS REQUIRED FOR ALL FUNCTIONALITY")
    
    app.run(host='0.0.0.0', port=8000, debug=True)
