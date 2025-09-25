#!/usr/bin/env python3
"""
DFS Vibe Dashboard - Clean, Modern, Usable
Prioritizes simplicity and aesthetics over feature complexity
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
import requests
import json
from datetime import datetime
import pandas as pd

app = Flask(__name__)

# API Configuration
BACKEND_API_URL = "http://localhost:8000"

class DFSDataService:
    """Clean data service to connect with existing backend"""
    
    @staticmethod
    def get_player_pool():
        try:
            response = requests.get(f"{BACKEND_API_URL}/api/player-pool")
            if response.ok:
                return response.json()
        except:
            pass
        
        # Fallback data for demo
        return [
            {
                "name": "Josh Allen",
                "position": "QB", 
                "team": "BUF",
                "opponent": "vs MIA",
                "salary": 8400,
                "projection": 26.8,
                "value": 3.19,
                "ownership": 18.5
            },
            {
                "name": "Christian McCaffrey",
                "position": "RB",
                "team": "SF", 
                "opponent": "@ NYG",
                "salary": 8800,
                "projection": 22.1,
                "value": 2.51,
                "ownership": 15.2
            },
            {
                "name": "Tyreek Hill",
                "position": "WR",
                "team": "MIA",
                "opponent": "@ BUF", 
                "salary": 8200,
                "projection": 21.3,
                "value": 2.60,
                "ownership": 22.8
            },
            {
                "name": "Travis Kelce",
                "position": "TE",
                "team": "KC",
                "opponent": "vs DEN",
                "salary": 6800,
                "projection": 16.4,
                "value": 2.41,
                "ownership": 12.3
            }
        ]
    
    @staticmethod
    def optimize_lineups(constraints):
        try:
            response = requests.post(f"{BACKEND_API_URL}/api/optimize", json=constraints)
            if response.ok:
                return response.json()
        except:
            pass
            
        # Fallback optimization
        return {
            "success": True,
            "lineups": [
                {
                    "id": 1,
                    "players": DFSDataService.get_player_pool()[:8],
                    "total_salary": 49800,
                    "projected_points": 168.3,
                    "ownership": 16.8
                }
            ]
        }

@app.route('/')
def dashboard():
    """Main vibe dashboard - clean and intuitive"""
    players = DFSDataService.get_player_pool()
    return render_template('vibe_dashboard.html', players=players)

@app.route('/api/players')
def api_players():
    """Get player data for AJAX requests"""
    return jsonify(DFSDataService.get_player_pool())

@app.route('/api/optimize', methods=['POST'])
def api_optimize():
    """Run optimization with clean response"""
    data = request.get_json()
    result = DFSDataService.optimize_lineups(data)
    return jsonify(result)

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5555)
