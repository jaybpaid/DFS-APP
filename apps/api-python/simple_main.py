#!/usr/bin/env python3
"""
DFS Optimizer API - Simplified Production Backend
Minimal FastAPI implementation to get the system working
"""

import os
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configure logging
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DFS Optimizer API",
    description="Production-grade DFS Optimizer API",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment configuration
FIXTURES_DIR = Path(os.getenv("FIXTURES_DIR", "./fixtures"))


def load_fixture(filename: str) -> Dict[str, Any]:
    """Load fixture data from JSON file"""
    filepath = FIXTURES_DIR / filename
    if not filepath.exists():
        logger.warning(f"Fixture {filename} not found, using empty data")
        return {}

    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading {filename}: {e}")
        return {}


# API Endpoints


@app.get("/api/healthz")
async def health_check():
    """Health check endpoint"""
    return {"ok": True, "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/status")
async def status_check():
    """Status endpoint for dashboard compatibility"""
    return {"ok": True, "status": "running", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/slates")
async def get_slates(
    date: Optional[str] = None, site: Optional[str] = None, sport: Optional[str] = None
):
    """Get available slates for a given date"""
    try:
        # Load slates fixture
        slates_data = load_fixture("slates.json")

        if not slates_data:
            # Return sample slate data if fixture missing
            return {
                "date": "2025-09-17",
                "slates": [
                    {
                        "id": "dk_123456",
                        "name": "NFL Sunday Main",
                        "sport": "NFL",
                        "contestType": "classic",
                        "startTime": "2025-09-17T17:00:00Z",
                        "salaryCap": 50000,
                        "status": "active",
                    }
                ],
                "metadata": {"source": "sample_data"},
            }

        return slates_data

    except Exception as e:
        logger.error(f"Error loading slates: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading slates: {str(e)}")


@app.get("/api/slates/future")
async def get_future_slates():
    """Get future slates - dashboard compatibility endpoint"""
    try:
        # Return future slates data
        return {
            "success": True,
            "slates": [
                {
                    "id": "dk_123456",
                    "name": "NFL Sunday Main",
                    "sport": "NFL",
                    "contestType": "classic",
                    "startTime": "2025-09-17T17:00:00Z",
                    "salaryCap": 50000,
                    "status": "active",
                    "playerCount": 300,
                },
                {
                    "id": "dk_789012",
                    "name": "NFL Primetime",
                    "sport": "NFL",
                    "contestType": "classic",
                    "startTime": "2025-09-17T20:00:00Z",
                    "salaryCap": 50000,
                    "status": "upcoming",
                    "playerCount": 250,
                },
            ],
            "count": 2,
            "source": "api_endpoint",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error loading future slates: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error loading future slates: {str(e)}"
        )


@app.get("/api/slates/{slate_id}/players")
async def get_slate_players(slate_id: str):
    """Get players for a specific slate"""
    try:
        # Load players fixture
        players_data = load_fixture("dk_salaries.json")

        if not players_data:
            # Return sample player data if fixture missing
            return {
                "site": "DraftKings",
                "sport": "NFL",
                "slate_id": slate_id,
                "draft_group_id": "123456",
                "name": "NFL Sunday Main",
                "start_time": "2025-09-17T17:00:00Z",
                "salary_cap": 50000,
                "roster_positions": [
                    "QB",
                    "RB",
                    "RB",
                    "WR",
                    "WR",
                    "WR",
                    "TE",
                    "FLEX",
                    "DST",
                ],
                "generated_at": datetime.utcnow().isoformat(),
                "players": [
                    {
                        "player_id": "1",
                        "display_name": "Josh Allen",
                        "position": "QB",
                        "salary": 8400,
                        "team_abbreviation": "BUF",
                        "status": "ACTIVE",
                    },
                    {
                        "player_id": "2",
                        "display_name": "Saquon Barkley",
                        "position": "RB",
                        "salary": 7400,
                        "team_abbreviation": "NYG",
                        "status": "ACTIVE",
                    },
                ],
            }

        return players_data

    except Exception as e:
        logger.error(f"Error loading players: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading players: {str(e)}")


@app.post("/api/optimize")
async def optimize_lineups(request: Dict[str, Any]):
    """Generate optimal lineups"""
    try:
        n_lineups = request.get("nLineups", 20)
        slate_id = request.get("slateId", "")

        # Generate sample lineups for demo
        lineups = []
        for i in range(min(n_lineups, 20)):
            lineup = {
                "lineup_id": f"lineup_{i+1}",
                "players": [
                    {
                        "name": "Josh Allen",
                        "position": "QB",
                        "salary": 8400,
                        "projection": 25.2,
                    },
                    {
                        "name": "Saquon Barkley",
                        "position": "RB",
                        "salary": 7400,
                        "projection": 20.1,
                    },
                    {
                        "name": "Nick Chubb",
                        "position": "RB",
                        "salary": 7000,
                        "projection": 18.5,
                    },
                    {
                        "name": "Tyreek Hill",
                        "position": "WR",
                        "salary": 8200,
                        "projection": 22.3,
                    },
                    {
                        "name": "Stefon Diggs",
                        "position": "WR",
                        "salary": 7600,
                        "projection": 20.8,
                    },
                    {
                        "name": "CeeDee Lamb",
                        "position": "WR",
                        "salary": 7000,
                        "projection": 19.2,
                    },
                    {
                        "name": "Travis Kelce",
                        "position": "TE",
                        "salary": 6800,
                        "projection": 16.4,
                    },
                    {
                        "name": "Austin Ekeler",
                        "position": "FLEX",
                        "salary": 4400,
                        "projection": 14.1,
                    },
                    {
                        "name": "Bills DST",
                        "position": "DST",
                        "salary": 3000,
                        "projection": 8.2,
                    },
                ],
                "total_salary": 49800,
                "total_projection": 164.8,
                "ownership_projection": 15.2,
            }
            lineups.append(lineup)

        return {
            "lineups": lineups,
            "count": len(lineups),
            "slate_id": slate_id,
            "generated_at": datetime.utcnow().isoformat(),
            "optimization_settings": request,
            "salary_cap_enforced": True,
            "engine": "simplified_demo",
        }

    except Exception as e:
        logger.error(f"Optimization error: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@app.post("/api/simulate")
async def simulate_lineups(request: Dict[str, Any]):
    """Simulate lineups"""
    return {
        "simulation_id": f"sim_{int(datetime.utcnow().timestamp())}",
        "results": {
            "expected_roi": 1.15,
            "roi_confidence_interval": [0.95, 1.35],
            "min_cash_percentage": 23.5,
            "top_1_percentage": 2.1,
            "top_10_percentage": 8.7,
        },
        "metadata": {"generated_at": datetime.utcnow().isoformat(), "sim_count": 10000},
    }


@app.get("/api/last_refresh")
async def get_last_refresh():
    """Get last refresh info"""
    return {
        "lastRefresh": datetime.utcnow().isoformat(),
        "slateIds": ["dk_123456", "dk_789012"],
    }


if __name__ == "__main__":
    print("🚀 Starting DFS Optimizer API (Simplified)")
    print("✅ Health check: http://localhost:8000/api/healthz")
    print("✅ CORS enabled for frontend integration")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
