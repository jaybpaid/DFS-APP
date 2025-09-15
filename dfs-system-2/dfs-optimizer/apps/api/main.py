"""
DFS Optimizer API
FastAPI application providing all endpoints for the web interface
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ...packages.shared.types import Player, Game, Slate, Contest, Lineup, Ruleset, Site, Sport
from ...services.ingest.data_merger import merge_slate_data
from ...services.sim.optimizer import optimize_lineups, OptimizationResult
from ...services.sim.model import simulate_lineups, MonteCarloSimulator, calculate_overall_score

logger = logging.getLogger(__name__)

app = FastAPI(
    title="DFS Optimizer API",
    description="Professional DFS lineup optimization and simulation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (in production, use database)
slates_cache: Dict[str, Slate] = {}
lineups_cache: Dict[str, List[Lineup]] = {}
simulation_cache: Dict[str, Dict] = {}

# Pydantic models for API
class SlateRequest(BaseModel):
    sport: str
    slate_id: Optional[str] = None

class OptimizationRequest(BaseModel):
    slate_id: str
    ruleset: Dict[str, Any]
    num_lineups: int = 20
    engine: str = "sim-guided"
    objective: str = "projection"
    randomness: float = 0.1
    contest: Optional[Dict[str, Any]] = None

class SimulationRequest(BaseModel):
    lineup_ids: List[str]
    contest: Dict[str, Any]
    n_simulations: int = 1000

class ContestModel(BaseModel):
    contest_id: str
    site: str
    name: str
    entries: int
    max_entries: int
    entry_fee: float
    payout_curve: List[Dict[str, Any]]

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "DFS Optimizer API",
        "version": "1.0.0",
        "endpoints": [
            "/slates/{slate_id}/players",
            "/contests/{contest_id}/payouts",
            "/optimize",
            "/simulate",
            "/health"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/slates/{slate_id}/players")
async def get_slate_players(slate_id: str) -> List[Dict]:
    """Get players for a specific slate"""
    try:
        # Check cache first
        if slate_id in slates_cache:
            slate = slates_cache[slate_id]
            return [player.__dict__ for player in slate.players]

        # Try to load from data merger
        sport = "NFL" if "nfl" in slate_id.lower() else "NBA"
        slate = await merge_slate_data(sport, slate_id)

        if slate:
            slates_cache[slate_id] = slate
            return [player.__dict__ for player in slate.players]

        # Return mock data if no real data available
        mock_players = _generate_mock_players(slate_id)
        return mock_players

    except Exception as e:
        logger.error(f"Failed to get players for slate {slate_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/contests/{contest_id}/payouts")
async def get_contest_payouts(contest_id: str) -> Dict:
    """Get contest payout structure"""
    try:
        # Mock contest data - in production, fetch from database
        mock_contest = {
            "contest_id": contest_id,
            "site": "draftkings",
            "name": "NFL $5 Double Up",
            "entries": 10000,
            "max_entries": 15000,
            "entry_fee": 5.0,
            "payout_curve": [
                {"place": 1, "pct": 0.5},
                {"place": 2, "pct": 0.3},
                {"place": 3, "pct": 0.2}
            ]
        }

        return mock_contest

    except Exception as e:
        logger.error(f"Failed to get contest {contest_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize")
async def optimize(request: OptimizationRequest, background_tasks: BackgroundTasks) -> Dict:
    """Optimize lineups based on rules and constraints"""
    try:
        # Get players for the slate
        players_data = await get_slate_players(request.slate_id)
        players = [Player(**p) for p in players_data]

        if not players:
            raise HTTPException(status_code=404, detail="No players found for slate")

        # Convert ruleset
        ruleset = Ruleset(**request.ruleset)

        # Convert contest if provided
        contest = None
        if request.contest:
            contest = Contest(**request.contest)

        # Run optimization
        result = await optimize_lineups(
            players=players,
            ruleset=ruleset,
            num_lineups=request.num_lineups,
            engine=request.engine,
            objective=request.objective,
            randomness=request.randomness,
            contest=contest
        )

        # Cache lineups
        lineups_cache[request.slate_id] = result.lineups

        return {
            "success": True,
            "lineups": [lineup.__dict__ for lineup in result.lineups],
            "total_lineups": result.total_lineups,
            "generation_time": result.generation_time,
            "engine_used": result.engine_used,
            "constraints_satisfied": result.constraints_satisfied
        }

    except Exception as e:
        logger.error(f"Optimization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate")
async def simulate(request: SimulationRequest) -> Dict:
    """Run Monte Carlo simulation on lineups"""
    try:
        # Get lineups
        lineup_ids = request.lineup_ids
        lineups = []

        # Find lineups in cache (simplified - in production, use database)
        for slate_lineups in lineups_cache.values():
            for lineup in slate_lineups:
                if lineup.lineupId in lineup_ids:
                    lineups.append(lineup)

        if not lineups:
            raise HTTPException(status_code=404, detail="No lineups found")

        # Get players (simplified - assume from first lineup's slate)
        players_data = await get_slate_players(lineups[0].slateId)
        players = [Player(**p) for p in players_data]

        # Convert contest
        contest = Contest(**request.contest)

        # Run simulation
        sim_results = await simulate_lineups(
            lineups=lineups,
            players=players,
            contest=contest,
            n_simulations=request.n_simulations
        )

        # Calculate overall scores
        results_with_scores = {}
        for lineup_id, sim_result in sim_results.items():
            overall_score = calculate_overall_score(sim_result)
            results_with_scores[lineup_id] = {
                "simulation_results": sim_result.__dict__,
                "overall_score": overall_score
            }

        # Cache results
        simulation_cache[f"sim_{datetime.now().isoformat()}"] = results_with_scores

        return {
            "success": True,
            "simulation_results": results_with_scores,
            "summary": {
                "total_lineups": len(lineups),
                "iterations_per_lineup": request.n_simulations,
                "avg_overall_score": sum(r["overall_score"] for r in results_with_scores.values()) / len(results_with_scores)
            }
        }

    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/slates")
async def list_slates(sport: Optional[str] = None) -> List[Dict]:
    """List available slates"""
    try:
        # Mock slates - in production, fetch from database
        mock_slates = [
            {
                "slate_id": "dk_nfl_main",
                "name": "NFL Main Slate",
                "sport": "NFL",
                "start_time": "2025-09-14T20:15:00Z",
                "games": 16,
                "total_players": 150
            },
            {
                "slate_id": "dk_nba_main",
                "name": "NBA Main Slate",
                "sport": "NBA",
                "start_time": "2025-09-14T19:30:00Z",
                "games": 10,
                "total_players": 120
            }
        ]

        if sport:
            mock_slates = [s for s in mock_slates if s["sport"].lower() == sport.lower()]

        return mock_slates

    except Exception as e:
        logger.error(f"Failed to list slates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/lineups/{slate_id}")
async def get_lineups(slate_id: str) -> List[Dict]:
    """Get optimized lineups for a slate"""
    try:
        if slate_id in lineups_cache:
            return [lineup.__dict__ for lineup in lineups_cache[slate_id]]

        return []

    except Exception as e:
        logger.error(f"Failed to get lineups for slate {slate_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _generate_mock_players(slate_id: str) -> List[Dict]:
    """Generate mock player data for testing"""
    sport = "NFL" if "nfl" in slate_id.lower() else "NBA"

    if sport == "NFL":
        players_data = [
            {
                "playerId": "mock_josh_allen",
                "name": "Josh Allen",
                "team": "BUF",
                "opp": "MIA",
                "pos": ["QB"],
                "site": "DK",
                "sport": "NFL",
                "slateId": slate_id,
                "salary": 8500,
                "projection": 24.5,
                "ownership": 0.225,
                "value": 2.88,
                "leverage": 1.8,
                "boom": 0.28,
                "status": "ACTIVE"
            },
            {
                "playerId": "mock_christian_mccaffrey",
                "name": "Christian McCaffrey",
                "team": "SF",
                "opp": "NYG",
                "pos": ["RB"],
                "site": "DK",
                "sport": "NFL",
                "slateId": slate_id,
                "salary": 9200,
                "projection": 22.1,
                "ownership": 0.35,
                "value": 2.4,
                "leverage": 1.6,
                "boom": 0.22,
                "status": "ACTIVE"
            },
            {
                "playerId": "mock_travis_kelce",
                "name": "Travis Kelce",
                "team": "KC",
                "opp": "LAC",
                "pos": ["TE"],
                "site": "DK",
                "sport": "NFL",
                "slateId": slate_id,
                "salary": 6200,
                "projection": 14.3,
                "ownership": 0.187,
                "value": 2.31,
                "leverage": 2.1,
                "boom": 0.25,
                "status": "ACTIVE"
            }
        ]
    else:  # NBA
        players_data = [
            {
                "playerId": "mock_luka_doncic",
                "name": "Luka Doncic",
                "team": "DAL",
                "opp": "LAL",
                "pos": ["PG"],
                "site": "DK",
                "sport": "NBA",
                "slateId": slate_id,
                "salary": 10800,
                "projection": 55.2,
                "ownership": 0.4,
                "value": 5.11,
                "leverage": 1.9,
                "boom": 0.35,
                "status": "ACTIVE"
            }
        ]

    return players_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
