"""
Data Sources API Routes
Provides endpoints for managing comprehensive DFS data sources
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from lib.comprehensive_data_sources import (
    get_data_source_manager,
    DataSourceType,
    DataCategory,
    DataSource,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/data-sources", tags=["Data Sources"])

# Get the global data source manager
data_manager = get_data_source_manager()


@router.get("/", response_model=Dict[str, Any])
async def get_all_data_sources():
    """Get all available data sources"""
    try:
        sources = {}
        for source_id, source in data_manager.data_sources.items():
            sources[source_id] = source.to_dict()

        return {
            "sources": sources,
            "summary": data_manager.get_sources_summary(),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting data sources: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_sources_summary():
    """Get a summary of all data sources"""
    try:
        return data_manager.get_sources_summary()
    except Exception as e:
        logger.error(f"Error getting sources summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-category/{category}")
async def get_sources_by_category(category: str):
    """Get all sources for a specific category"""
    try:
        # Convert string to enum
        try:
            data_category = DataCategory(category)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category}")

        sources = data_manager.get_sources_by_category(data_category)

        return {
            "category": category,
            "sources": [source.to_dict() for source in sources],
            "count": len(sources),
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting sources by category {category}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-type/{source_type}")
async def get_sources_by_type(source_type: str):
    """Get all sources of a specific type"""
    try:
        # Convert string to enum
        try:
            data_source_type = DataSourceType(source_type)
        except ValueError:
            raise HTTPException(
                status_code=400, detail=f"Invalid source type: {source_type}"
            )

        sources = data_manager.get_sources_by_type(data_source_type)

        return {
            "source_type": source_type,
            "sources": [source.to_dict() for source in sources],
            "count": len(sources),
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting sources by type {source_type}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/free")
async def get_free_sources():
    """Get all free data sources"""
    try:
        sources = data_manager.get_free_sources()

        return {
            "sources": [source.to_dict() for source in sources],
            "count": len(sources),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting free sources: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/real-time")
async def get_real_time_sources():
    """Get all real-time data sources"""
    try:
        sources = data_manager.get_real_time_sources()

        return {
            "sources": [source.to_dict() for source in sources],
            "count": len(sources),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting real-time sources: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/high-priority")
async def get_high_priority_sources():
    """Get high priority sources (priority 1-2)"""
    try:
        sources = data_manager.get_high_priority_sources()

        return {
            "sources": [source.to_dict() for source in sources],
            "count": len(sources),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting high priority sources: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_sources(
    query: str = Query(
        ..., description="Search query for source names, descriptions, or tags"
    )
):
    """Search for data sources"""
    try:
        sources = data_manager.search_sources(query)

        return {
            "query": query,
            "sources": [source.to_dict() for source in sources],
            "count": len(sources),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error searching sources with query '{query}': {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/{strategy}")
async def get_recommended_sources(strategy: str):
    """Get recommended sources for a specific DFS strategy"""
    try:
        sources = data_manager.get_recommended_sources_for_strategy(strategy)

        if not sources:
            available_strategies = [
                "cash_games",
                "tournaments",
                "contrarian",
                "weather_plays",
                "late_swap",
            ]
            raise HTTPException(
                status_code=400,
                detail=f"Invalid strategy: {strategy}. Available strategies: {available_strategies}",
            )

        return {
            "strategy": strategy,
            "recommended_sources": [source.to_dict() for source in sources],
            "count": len(sources),
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendations for strategy {strategy}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{source_id}")
async def get_source_details(source_id: str):
    """Get details for a specific data source"""
    try:
        source = data_manager.get_source(source_id)

        if not source:
            raise HTTPException(
                status_code=404, detail=f"Data source '{source_id}' not found"
            )

        return {"source": source.to_dict(), "timestamp": datetime.now().isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting source details for {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{source_id}/status")
async def update_source_status(source_id: str, is_active: bool):
    """Update the active status of a data source"""
    try:
        source = data_manager.get_source(source_id)

        if not source:
            raise HTTPException(
                status_code=404, detail=f"Data source '{source_id}' not found"
            )

        data_manager.update_source_status(source_id, is_active)

        return {
            "message": f"Updated source '{source_id}' status to {'active' if is_active else 'inactive'}",
            "source_id": source_id,
            "is_active": is_active,
            "timestamp": datetime.now().isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating source status for {source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories/list")
async def get_available_categories():
    """Get all available data categories"""
    try:
        categories = [category.value for category in DataCategory]

        return {
            "categories": categories,
            "count": len(categories),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types/list")
async def get_available_types():
    """Get all available source types"""
    try:
        types = [source_type.value for source_type in DataSourceType]

        return {
            "types": types,
            "count": len(types),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting source types: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/config")
async def export_sources_config():
    """Export all sources configuration"""
    try:
        config = data_manager.export_sources_config()
        return config
    except Exception as e:
        logger.error(f"Error exporting sources config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/strategies/list")
async def get_available_strategies():
    """Get all available DFS strategies for recommendations"""
    try:
        strategies = {
            "cash_games": "Conservative plays for cash games - focus on projections, player data, and injury reports",
            "tournaments": "Tournament plays - focus on ownership data, analytics, and social sentiment",
            "contrarian": "Contrarian plays - focus on ownership data, social sentiment, and betting data",
            "weather_plays": "Weather-based plays - focus on weather data and game conditions",
            "late_swap": "Late swap opportunities - focus on injury reports, news content, and social sentiment",
        }

        return {
            "strategies": strategies,
            "count": len(strategies),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Error getting strategies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cost-analysis")
async def get_cost_analysis():
    """Get cost analysis of data sources"""
    try:
        all_sources = list(data_manager.data_sources.values())
        active_sources = [s for s in all_sources if s.is_active]

        cost_analysis = {
            "by_tier": {
                "free": {
                    "count": len([s for s in active_sources if s.cost_tier == "free"]),
                    "sources": [
                        s.name for s in active_sources if s.cost_tier == "free"
                    ],
                },
                "paid": {
                    "count": len([s for s in active_sources if s.cost_tier == "paid"]),
                    "sources": [
                        s.name for s in active_sources if s.cost_tier == "paid"
                    ],
                },
                "premium": {
                    "count": len(
                        [s for s in active_sources if s.cost_tier == "premium"]
                    ),
                    "sources": [
                        s.name for s in active_sources if s.cost_tier == "premium"
                    ],
                },
            },
            "api_key_required": {
                "count": len([s for s in active_sources if s.api_key_required]),
                "sources": [s.name for s in active_sources if s.api_key_required],
            },
            "no_api_key": {
                "count": len([s for s in active_sources if not s.api_key_required]),
                "sources": [s.name for s in active_sources if not s.api_key_required],
            },
            "total_active_sources": len(active_sources),
        }

        return {"cost_analysis": cost_analysis, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Error getting cost analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
