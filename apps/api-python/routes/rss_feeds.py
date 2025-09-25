"""
RSS Feed API Routes
Provides endpoints for managing and accessing RSS feed content
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from lib.rss_feed_parser import (
    RSSFeedManager,
    create_default_feed_manager,
    RSSEpisode,
    RSSFeedInfo,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rss", tags=["RSS Feeds"])

# Global feed manager instance
feed_manager = create_default_feed_manager()


@router.get("/feeds", response_model=Dict[str, Any])
async def get_feed_status():
    """Get status of all registered RSS feeds"""
    try:
        return feed_manager.get_feed_status()
    except Exception as e:
        logger.error(f"Error getting feed status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feeds/{feed_name}/refresh")
async def refresh_feed(feed_name: str):
    """Refresh a specific RSS feed"""
    try:
        result = feed_manager.update_feed(feed_name)

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        # Convert dataclass objects to dictionaries for JSON serialization
        serialized_result = {
            "feed_info": {
                "title": result["feed_info"].title,
                "description": result["feed_info"].description,
                "link": result["feed_info"].link,
                "language": result["feed_info"].language,
                "last_build_date": (
                    result["feed_info"].last_build_date.isoformat()
                    if result["feed_info"].last_build_date
                    else None
                ),
                "image_url": result["feed_info"].image_url,
                "author": result["feed_info"].author,
            },
            "total_episodes": len(result["all_episodes"]),
            "fantasy_episodes_count": len(result["fantasy_episodes"]),
            "recent_episodes_count": len(result["recent_episodes"]),
            "last_updated": datetime.now().isoformat(),
        }

        return serialized_result

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error refreshing feed {feed_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feeds/{feed_name}/episodes")
async def get_feed_episodes(
    feed_name: str,
    fantasy_only: bool = Query(
        True, description="Return only fantasy football related episodes"
    ),
    recent_days: Optional[int] = Query(
        None, description="Return episodes from last N days"
    ),
    limit: Optional[int] = Query(
        10, description="Maximum number of episodes to return"
    ),
):
    """Get episodes from a specific RSS feed"""
    try:
        result = feed_manager.update_feed(feed_name)

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        # Choose which episodes to return
        if recent_days:
            episodes = feed_manager.parser.get_recent_episodes(
                feed_manager.feeds[feed_name]["url"], days=recent_days
            )
            if fantasy_only:
                episodes = feed_manager.parser.filter_fantasy_content(episodes)
        elif fantasy_only:
            episodes = result["fantasy_episodes"]
        else:
            episodes = result["all_episodes"]

        # Apply limit
        if limit:
            episodes = episodes[:limit]

        # Serialize episodes
        serialized_episodes = []
        for episode in episodes:
            player_mentions = feed_manager.parser.extract_player_mentions(episode)

            serialized_episodes.append(
                {
                    "title": episode.title,
                    "description": episode.description,
                    "published_date": episode.published_date.isoformat(),
                    "link": episode.link,
                    "guid": episode.guid,
                    "duration": episode.duration,
                    "author": episode.author,
                    "categories": episode.categories,
                    "enclosure_url": episode.enclosure_url,
                    "player_mentions": player_mentions,
                }
            )

        return {
            "feed_name": feed_name,
            "episodes": serialized_episodes,
            "total_count": len(serialized_episodes),
            "filters_applied": {
                "fantasy_only": fantasy_only,
                "recent_days": recent_days,
                "limit": limit,
            },
            "timestamp": datetime.now().isoformat(),
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting episodes for feed {feed_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feeds/add")
async def add_feed(name: str, url: str, description: str = ""):
    """Add a new RSS feed to monitor"""
    try:
        feed_manager.add_feed(name, url, description)

        # Test the feed by trying to parse it
        try:
            result = feed_manager.update_feed(name)
            return {
                "message": f"Successfully added feed: {name}",
                "feed_name": name,
                "url": url,
                "description": description,
                "test_result": {
                    "total_episodes": len(result["all_episodes"]),
                    "fantasy_episodes": len(result["fantasy_episodes"]),
                },
            }
        except Exception as e:
            # Remove the feed if it fails to parse
            del feed_manager.feeds[name]
            raise HTTPException(
                status_code=400, detail=f"Feed added but failed to parse: {str(e)}"
            )

    except Exception as e:
        logger.error(f"Error adding feed {name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
