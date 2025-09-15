"""
Data API Server with Automatic Failover
Provides REST API endpoints for DFS data with automatic source failover
"""

import asyncio
import json
import logging
import sys
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.data_source_manager import DataSourceManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for web interface

# Initialize data source manager
data_manager = DataSourceManager(sources_config_path=os.path.join(os.path.dirname(__file__), '..', 'config', 'sources.json'))

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    from datetime import datetime
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'DFS Data API Server with Automatic Failover is running',
        'data_sources_loaded': len(data_manager.sources) if hasattr(data_manager, 'sources') else 0
    })

@app.route('/api/slates/<sport>', methods=['GET'])
async def get_slates(sport):
    """Get all available slates for a sport, organized by site"""
    try:
        slates_by_site = await data_manager.get_available_slates(sport.upper())

        # Format response for frontend dropdown
        response = {
            'sport': sport.upper(),
            'sites': {}
        }

        for site, slates in slates_by_site.items():
            response['sites'][site] = [
                {
                    'id': slate['id'],
                    'name': slate['name'],
                    'entry_fee': slate['entry_fee'],
                    'total_entries': slate['total_entries'],
                    'start_time': slate['start_time'],
                    'source': slate['source']
                } for slate in slates
            ]

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error getting slates for {sport}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/slates/<sport>/<site>', methods=['GET'])
async def get_slates_by_site(sport, site):
    """Get slates for a specific site"""
    try:
        slates_by_site = await data_manager.get_available_slates(sport.upper())

        if site not in slates_by_site:
            return jsonify({'error': f'No slates found for {site}'}), 404

        slates = slates_by_site[site]
        response = {
            'sport': sport.upper(),
            'site': site,
            'slates': [
                {
                    'id': slate['id'],
                    'name': slate['name'],
                    'entry_fee': slate['entry_fee'],
                    'total_entries': slate['total_entries'],
                    'start_time': slate['start_time'],
                    'source': slate['source']
                } for slate in slates
            ]
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error getting slates for {sport}/{site}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/players/<slate_id>', methods=['GET'])
async def get_players(slate_id):
    """Get players for a specific slate"""
    try:
        site = request.args.get('site', 'DraftKings')
        sport = request.args.get('sport', 'NFL')

        players = await data_manager.get_slate_players(slate_id, site, sport.upper())

        if not players:
            return jsonify({'error': 'No players found for this slate'}), 404

        response = {
            'slate_id': slate_id,
            'site': site,
            'sport': sport.upper(),
            'player_count': len(players),
            'players': players
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error getting players for slate {slate_id}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sources/status', methods=['GET'])
def get_sources_status():
    """Get status of all data sources"""
    try:
        status = data_manager.get_health_status()
        return jsonify(status)
    except Exception as e:
        logger.error(f"Error getting sources status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/dk/lobby/getcontests', methods=['GET'])
async def draftkings_fallback():
    """Fallback endpoint for DraftKings API calls"""
    try:
        sport = request.args.get('sport', 'nfl')

        # Try to get slates from working sources
        slates_by_site = await data_manager.get_available_slates(sport.upper())

        # Format as DraftKings-style response
        dk_slates = []
        for site, slates in slates_by_site.items():
            for slate in slates[:10]:  # Limit results
                dk_slates.append({
                    'id': slate['id'],
                    'name': slate['name'],
                    'entryFee': slate['entry_fee'],
                    'maxEntries': slate['total_entries'],
                    'startTime': slate['start_time'],
                    'source': slate['source']
                })

        response = {
            'Contests': dk_slates,
            'source': 'fallback_system',
            'fallback_active': True
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"DraftKings fallback error: {e}")
        return jsonify({
            'error': 'All data sources failed',
            'Contests': [],
            'fallback_active': True
        }), 503

@app.route('/api/ai/analyze', methods=['POST'])
async def ai_analysis():
    """AI-powered analysis endpoint"""
    try:
        from ai.advanced_ai_analyzer import AdvancedAIAnalyzer

        data = request.get_json()
        players = data.get('players', [])
        sport = data.get('sport', 'NFL')
        slate_info = data.get('slate_info', {})

        analyzer = AdvancedAIAnalyzer()
        analysis = await analyzer.analyze_player_pool_comprehensive(players, sport, slate_info)

        return jsonify(analysis)

    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting DFS Data API Server with Automatic Failover")
    print("📊 Available endpoints:")
    print("  GET  /api/health - Health check")
    print("  GET  /api/slates/<sport> - Get all slates by site")
    print("  GET  /api/slates/<sport>/<site> - Get slates for specific site")
    print("  GET  /api/players/<slate_id> - Get players for slate")
    print("  GET  /api/sources/status - Data sources status")
    print("  GET  /dk/lobby/getcontests - DK API fallback")
    print("  POST /api/ai/analyze - AI-powered analysis")
    print("\n🌐 Server running on http://localhost:5000")

    app.run(host='0.0.0.0', port=5002, debug=True)
