"""
AI Data Validator API - Provides AI-curated player scoring and data source validation
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os

# Import our AI validator
from src.ai.data_validator import get_data_validator, AIDataValidator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DFS AI Data Validator API",
    description="AI-powered data validation and player scoring for DFS optimization",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global validator instance
validator: Optional[AIDataValidator] = None

def get_api_keys() -> Dict[str, str]:
    """Load API keys from environment"""
    return {
        'fantasynerds': os.getenv('FANTASYNERDS_API_KEY', ''),
        'sportsdataio': os.getenv('SPORTSDATAIO_API_KEY', ''),
        'the_odds_api': os.getenv('THE_ODDS_API_KEY', ''),
        'openweather': os.getenv('OPENWEATHER_API_KEY', ''),
        'weatherapi': os.getenv('WEATHERAPI_KEY', ''),
    }

def get_validator() -> AIDataValidator:
    """Get or create validator instance"""
    global validator
    if validator is None:
        api_keys = get_api_keys()
        validator = get_data_validator(api_keys)
    return validator

# Pydantic models for API requests/responses
class ValidationRequest(BaseModel):
    sources: Optional[List[str]] = None  # Specific sources to validate, or all if None

class PlayerScoringRequest(BaseModel):
    players: List[Dict[str, Any]]
    sport: str = "NFL"

class ValidationResponse(BaseModel):
    status: str
    message: str
    results: Dict[str, Any]
    timestamp: datetime

class ScoringResponse(BaseModel):
    status: str
    message: str
    player_scores: Dict[str, Any]
    summary: Dict[str, Any]
    timestamp: datetime

class HealthResponse(BaseModel):
    status: str
    validator_initialized: bool
    api_keys_configured: int
    timestamp: datetime

@app.on_event("startup")
async def startup_event():
    """Initialize validator on startup"""
    try:
        global validator
        api_keys = get_api_keys()
        validator = get_data_validator(api_keys)
        logger.info("AI Data Validator initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize validator: {e}")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    api_keys = get_api_keys()
    configured_keys = sum(1 for key in api_keys.values() if key)

    return HealthResponse(
        status="healthy",
        validator_initialized=validator is not None,
        api_keys_configured=configured_keys,
        timestamp=datetime.now()
    )

@app.post("/validate-sources", response_model=ValidationResponse)
async def validate_data_sources(request: ValidationRequest, background_tasks: BackgroundTasks):
    """Validate data sources and return health scores"""
    try:
        validator_instance = get_validator()

        # Run validation in background for better performance
        background_tasks.add_task(validator_instance.validate_all_sources)

        # For immediate response, return current cached results
        current_scores = validator_instance.source_scores
        health_report = validator_instance.get_source_health_report()

        return ValidationResponse(
            status="success",
            message=f"Validated {len(current_scores)} data sources",
            results={
                "source_scores": {name: score.__dict__ for name, score in current_scores.items()},
                "health_report": health_report
            },
            timestamp=datetime.now()
        )

    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@app.post("/score-players", response_model=ScoringResponse)
async def score_players(request: PlayerScoringRequest):
    """AI-powered player scoring for good day likelihood"""
    try:
        validator_instance = get_validator()

        # Score players
        player_scores = await validator_instance.score_players_good_day(
            request.players,
            request.sport
        )

        # Get summary
        summary = validator_instance.get_player_score_summary()

        return ScoringResponse(
            status="success",
            message=f"Scored {len(player_scores)} players for {request.sport}",
            player_scores={pid: score.__dict__ for pid, score in player_scores.items()},
            summary=summary,
            timestamp=datetime.now()
        )

    except Exception as e:
        logger.error(f"Player scoring error: {e}")
        raise HTTPException(status_code=500, detail=f"Player scoring failed: {str(e)}")

@app.get("/source-health")
async def get_source_health():
    """Get current data source health status"""
    try:
        validator_instance = get_validator()
        health_report = validator_instance.get_source_health_report()

        return {
            "status": "success",
            "health_report": health_report,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Health report error: {e}")
        raise HTTPException(status_code=500, detail=f"Health report failed: {str(e)}")

@app.get("/player-scores")
async def get_player_scores():
    """Get current player scoring results"""
    try:
        validator_instance = get_validator()
        summary = validator_instance.get_player_score_summary()

        return {
            "status": "success",
            "summary": summary,
            "player_scores": {pid: score.__dict__ for pid, score in validator_instance.player_scores.items()},
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Player scores error: {e}")
        raise HTTPException(status_code=500, detail=f"Player scores retrieval failed: {str(e)}")

@app.get("/top-sources")
async def get_top_sources(limit: int = 5):
    """Get top performing data sources"""
    try:
        validator_instance = get_validator()
        top_sources = validator_instance.get_top_performing_sources(limit)

        return {
            "status": "success",
            "top_sources": [score.__dict__ for score in top_sources],
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Top sources error: {e}")
        raise HTTPException(status_code=500, detail=f"Top sources retrieval failed: {str(e)}")

@app.post("/refresh-validation")
async def refresh_validation():
    """Force refresh of all data source validations"""
    try:
        validator_instance = get_validator()

        # Clear cache and revalidate
        validator_instance.validation_cache.clear()
        await validator_instance.validate_all_sources()

        return {
            "status": "success",
            "message": "Data source validation refreshed",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Refresh validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Refresh validation failed: {str(e)}")

@app.get("/ai-insights/{player_id}")
async def get_player_insights(player_id: str):
    """Get detailed AI insights for a specific player"""
    try:
        validator_instance = get_validator()

        if player_id not in validator_instance.player_scores:
            raise HTTPException(status_code=404, detail=f"Player {player_id} not found in scoring results")

        score = validator_instance.player_scores[player_id]

        return {
            "status": "success",
            "player_id": player_id,
            "insights": {
                "good_day_score": score.good_day_score,
                "confidence_level": score.confidence_level,
                "key_factors": score.key_factors,
                "risk_factors": score.risk_factors,
                "trend_direction": score.trend_direction,
                "volatility_score": score.volatility_score,
                "data_sources_used": score.data_sources_used,
                "last_updated": score.last_updated.isoformat()
            },
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Player insights error: {e}")
        raise HTTPException(status_code=500, detail=f"Player insights retrieval failed: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    logger.info(f"Starting AI Data Validator API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
