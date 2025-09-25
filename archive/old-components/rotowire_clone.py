#!/usr/bin/env python3
"""
Simple RotoWire-style DFS Optimizer Clone
Clean, functional interface focused on usability
"""

from flask import Flask, render_template, request, jsonify
import pandas as pd
import json
from datetime import datetime

app = Flask(__name__)

# Sample player data - replace with your real data
SAMPLE_PLAYERS = [
    {
        'name': 'Josh Allen',
        'position': 'QB',
        'team': 'BUF',
        'opponent': 'vs MIA',
        'salary': 8400,
        'projection': 26.8,
        'value': 3.19,
        'ownership': 18.5
    },
    {
        'name': 'Christian McCaffrey',
        'position': 'RB', 
        'team': 'SF',
        'opponent': '@ NYG',
        'salary': 8800,
        'projection': 22.1,
        'value': 2.51,
        'ownership': 15.2
    },
    {
        'name': 'Tyreek Hill',
        'position': 'WR',
        'team': 'MIA', 
        'opponent': '@ BUF',
        'salary': 8200,
        'projection': 21.3,
        'value': 2.60,
        'ownership': 22.8
    },
    {
        'name': 'Travis Kelce',
        'position': 'TE',
        'team': 'KC',
        'opponent': 'vs DEN',
        'salary': 6800,
        'projection': 16.4,
        'value': 2.41,
        'ownership': 12.3
    },
    {
        'name': 'Bills DST',
        'position': 'DST',
        'team': 'BUF',
        'opponent': 'vs MIA', 
        'salary': 2800,
        'projection': 9.2,
        'value': 3.29,
        'ownership': 8.7
    }
]

@app.route('/')
def index():
    """Main optimizer page - clean and simple like RotoWire"""
    return render_template('optimizer.html', players=SAMPLE_PLAYERS)

@app.route('/api/optimize', methods=['POST'])
def optimize_lineups():
    """Generate optimal lineups"""
    data = request.get_json()
    
    # Simple optimization logic - replace with your actual optimizer
    selected_players = data.get('selected_players', [])
    num_lineups = data.get('num_lineups', 20)
    
    # Mock lineup generation
    lineups = []
    for i in range(min(num_lineups, 5)):  # Limit for demo
        lineup = {
            'id': i + 1,
            'players': SAMPLE_PLAYERS[:8],  # Mock lineup
            'total_salary': sum(p['salary'] for p in SAMPLE_PLAYERS[:8]),
            'projected_points': sum(p['projection'] for p in SAMPLE_PLAYERS[:8]),
            'ownership': sum(p['ownership'] for p in SAMPLE_PLAYERS[:8]) / 8
        }
        lineups.append(lineup)
    
    return jsonify({
        'success': True,
        'lineups': lineups,
        'count': len(lineups)
    })

@app.route('/api/players')
def get_players():
    """Get player data"""
    return jsonify(SAMPLE_PLAYERS)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
