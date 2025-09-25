#!/usr/bin/env python3
"""
Simple API Server for DFS Dashboard
Provides basic endpoints for the redesigned dashboard
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from datetime import datetime, timedelta

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/healthz")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "mcp_servers": {
            "sequential_thinking": "connected",
            "memory": "connected", 
            "fetch": "connected",
            "docker_gateway": "connected"
        }
    }

@app.get("/api/slates")
async def get_slates():
    return {
        "slates": [
            {
                "id": "nfl_main",
                "name": "NFL Week 3 - Main Slate",
                "sport": "NFL",
                "startTime": (datetime.now() + timedelta(hours=2)).isoformat(),
                "salaryCap": 50000,
                "playerCount": 247,
                "status": "active"
            }
        ]
    }

@app.get("/api/slates/{slate_id}/players")
async def get_players(slate_id: str):
    return {
        "players": [
            {
                "player_id": "josh_allen",
                "display_name": "Josh Allen",
                "position": "QB",
                "salary": 8400,
                "team_abbreviation": "BUF",
                "opponent": "MIA",
                "projection": 26.2,
                "ownership": 0.28,
                "boom_rate": 0.15,
                "bust_rate": 0.08,
                "status": "ACTIVE"
            },
            {
                "player_id": "tyreek_hill",
                "display_name": "Tyreek Hill",
                "position": "WR", 
                "salary": 8200,
                "team_abbreviation": "MIA",
                "opponent": "BUF",
                "projection": 21.3,
                "ownership": 0.32,
                "boom_rate": 0.22,
                "bust_rate": 0.12,
                "status": "ACTIVE"
            }
        ] * 20  # Multiply to get more players
    }

@app.post("/api/optimize/advanced")
async def optimize_advanced(request: dict):
    return {
        "success": True,
        "lineups": [
            {
                "lineupId": f"lineup_{i}",
                "players": [
                    {"playerName": "Josh Allen", "position": "QB", "projectedPoints": 26.2},
                    {"playerName": "Tyreek Hill", "position": "WR", "projectedPoints": 21.3}
                ],
                "totalSalary": 49800,
                "projectedScore": 142.5,
                "roi": 125 + i*5
            }
            for i in range(10)
        ]
    }

if __name__ == "__main__":
    print("🚀 Starting Simple DFS API Server...")
    print("🔧 Access: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
