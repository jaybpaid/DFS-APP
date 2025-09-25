"""
Production Database Integration for DFS Optimizer
Handles PostgreSQL connections, lineup storage, and user data management
"""

import os
import asyncio
import asyncpg
import redis
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json
import logging
from dataclasses import dataclass, asdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class LineupRecord:
    id: str
    user_id: str
    slate_id: str
    players: List[Dict[str, Any]]
    total_salary: int
    projected_score: float
    ownership: float
    leverage: float
    stack_info: str
    uniqueness: float
    created_at: datetime
    contest_type: str = "gpp"
    exported: bool = False
    export_format: Optional[str] = None


@dataclass
class UserSession:
    user_id: str
    session_id: str
    created_at: datetime
    last_active: datetime
    preferences: Dict[str, Any]


class DatabaseManager:
    """Manages PostgreSQL and Redis connections for production"""

    def __init__(self):
        self.pg_pool = None
        self.redis_client = None
        self.database_url = os.getenv("DATABASE_URL")
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

    async def initialize(self):
        """Initialize database connections"""
        try:
            # Initialize PostgreSQL connection pool
            self.pg_pool = await asyncpg.create_pool(
                self.database_url, min_size=5, max_size=20, command_timeout=60
            )

            # Initialize Redis connection
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )

            # Create tables if they don't exist
            await self.create_tables()

            logger.info("Database connections initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize database: {str(e)}")
            raise

    async def create_tables(self):
        """Create necessary database tables"""
        async with self.pg_pool.acquire() as conn:
            # Users table
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    subscription_tier VARCHAR(50) DEFAULT 'free',
                    created_at TIMESTAMP DEFAULT NOW(),
                    last_login TIMESTAMP,
                    preferences JSONB DEFAULT '{}'
                )
            """
            )

            # Lineups table
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS lineups (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    slate_id VARCHAR(100) NOT NULL,
                    players JSONB NOT NULL,
                    total_salary INTEGER NOT NULL,
                    projected_score DECIMAL(6,2) NOT NULL,
                    ownership DECIMAL(5,4) NOT NULL,
                    leverage DECIMAL(5,2) NOT NULL,
                    stack_info TEXT,
                    uniqueness DECIMAL(5,2) NOT NULL,
                    contest_type VARCHAR(20) DEFAULT 'gpp',
                    exported BOOLEAN DEFAULT FALSE,
                    export_format VARCHAR(20),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """
            )

            # Slates table
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS slates (
                    id VARCHAR(100) PRIMARY KEY,
                    sport VARCHAR(20) NOT NULL,
                    contest_type VARCHAR(20) NOT NULL,
                    start_time TIMESTAMP NOT NULL,
                    salary_cap INTEGER NOT NULL,
                    player_count INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    is_active BOOLEAN DEFAULT TRUE
                )
            """
            )

            # Player pool table
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS player_pools (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    slate_id VARCHAR(100) REFERENCES slates(id),
                    player_id VARCHAR(50) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    position VARCHAR(10) NOT NULL,
                    team VARCHAR(10) NOT NULL,
                    salary INTEGER NOT NULL,
                    projected_points DECIMAL(5,2) NOT NULL,
                    ownership DECIMAL(5,4) NOT NULL,
                    mcp_signals JSONB,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(slate_id, player_id)
                )
            """
            )

            # Optimization sessions table
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS optimization_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    slate_id VARCHAR(100) NOT NULL,
                    request_data JSONB NOT NULL,
                    response_data JSONB,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT NOW(),
                    completed_at TIMESTAMP,
                    error_message TEXT
                )
            """
            )

            # Create indexes for performance
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_lineups_user_id ON lineups(user_id)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_lineups_slate_id ON lineups(slate_id)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_lineups_created_at ON lineups(created_at)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_player_pools_slate_id ON player_pools(slate_id)"
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_optimization_sessions_user_id ON optimization_sessions(user_id)"
            )

            logger.info("Database tables created successfully")

    async def save_lineup(self, lineup_record: LineupRecord) -> str:
        """Save a lineup to the database"""
        async with self.pg_pool.acquire() as conn:
            lineup_id = await conn.fetchval(
                """
                INSERT INTO lineups (
                    user_id, slate_id, players, total_salary, projected_score,
                    ownership, leverage, stack_info, uniqueness, contest_type
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            """,
                lineup_record.user_id,
                lineup_record.slate_id,
                json.dumps(lineup_record.players),
                lineup_record.total_salary,
                lineup_record.projected_score,
                lineup_record.ownership,
                lineup_record.leverage,
                lineup_record.stack_info,
                lineup_record.uniqueness,
                lineup_record.contest_type,
            )

            return str(lineup_id)

    async def get_user_lineups(
        self, user_id: str, slate_id: Optional[str] = None, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get lineups for a user"""
        async with self.pg_pool.acquire() as conn:
            if slate_id:
                rows = await conn.fetch(
                    """
                    SELECT * FROM lineups 
                    WHERE user_id = $1 AND slate_id = $2 
                    ORDER BY created_at DESC 
                    LIMIT $3
                """,
                    user_id,
                    slate_id,
                    limit,
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT * FROM lineups 
                    WHERE user_id = $1 
                    ORDER BY created_at DESC 
                    LIMIT $2
                """,
                    user_id,
                    limit,
                )

            return [dict(row) for row in rows]

    async def save_player_pool(self, slate_id: str, players: List[Dict[str, Any]]):
        """Save player pool data for a slate"""
        async with self.pg_pool.acquire() as conn:
            # Clear existing player pool for this slate
            await conn.execute("DELETE FROM player_pools WHERE slate_id = $1", slate_id)

            # Insert new player pool
            for player in players:
                await conn.execute(
                    """
                    INSERT INTO player_pools (
                        slate_id, player_id, name, position, team, salary,
                        projected_points, ownership, mcp_signals
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (slate_id, player_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        position = EXCLUDED.position,
                        team = EXCLUDED.team,
                        salary = EXCLUDED.salary,
                        projected_points = EXCLUDED.projected_points,
                        ownership = EXCLUDED.ownership,
                        mcp_signals = EXCLUDED.mcp_signals
                """,
                    slate_id,
                    player["id"],
                    player["name"],
                    player["position"],
                    player["team"],
                    player["salary"],
                    player["projected_points"],
                    player["ownership"],
                    json.dumps(player.get("mcp_signals", {})),
                )

    async def get_player_pool(self, slate_id: str) -> List[Dict[str, Any]]:
        """Get player pool for a slate"""
        async with self.pg_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT player_id, name, position, team, salary, 
                       projected_points, ownership, mcp_signals
                FROM player_pools 
                WHERE slate_id = $1
                ORDER BY position, salary DESC
            """,
                slate_id,
            )

            players = []
            for row in rows:
                player = dict(row)
                player["id"] = player.pop("player_id")
                if player["mcp_signals"]:
                    player["mcp_signals"] = json.loads(player["mcp_signals"])
                players.append(player)

            return players

    async def save_optimization_session(
        self, user_id: str, slate_id: str, request_data: Dict[str, Any]
    ) -> str:
        """Save optimization session"""
        async with self.pg_pool.acquire() as conn:
            session_id = await conn.fetchval(
                """
                INSERT INTO optimization_sessions (user_id, slate_id, request_data)
                VALUES ($1, $2, $3)
                RETURNING id
            """,
                user_id,
                slate_id,
                json.dumps(request_data),
            )

            return str(session_id)

    async def update_optimization_session(
        self,
        session_id: str,
        response_data: Dict[str, Any],
        status: str = "completed",
        error_message: Optional[str] = None,
    ):
        """Update optimization session with results"""
        async with self.pg_pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE optimization_sessions 
                SET response_data = $1, status = $2, completed_at = NOW(), error_message = $3
                WHERE id = $4
            """,
                json.dumps(response_data),
                status,
                error_message,
                session_id,
            )

    # Redis caching methods
    async def cache_set(self, key: str, value: Any, ttl: int = 300):
        """Set cache value with TTL"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            self.redis_client.setex(key, ttl, value)
        except Exception as e:
            logger.warning(f"Cache set failed for key {key}: {str(e)}")

    async def cache_get(self, key: str) -> Optional[Any]:
        """Get cache value"""
        try:
            value = self.redis_client.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.warning(f"Cache get failed for key {key}: {str(e)}")
            return None

    async def cache_delete(self, key: str):
        """Delete cache key"""
        try:
            self.redis_client.delete(key)
        except Exception as e:
            logger.warning(f"Cache delete failed for key {key}: {str(e)}")

    async def get_lineup_history(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get lineup history analytics for a user"""
        async with self.pg_pool.acquire() as conn:
            since_date = datetime.now() - timedelta(days=days)

            # Get basic stats
            stats = await conn.fetchrow(
                """
                SELECT 
                    COUNT(*) as total_lineups,
                    AVG(projected_score) as avg_projected_score,
                    AVG(ownership) as avg_ownership,
                    AVG(leverage) as avg_leverage,
                    COUNT(DISTINCT slate_id) as unique_slates
                FROM lineups 
                WHERE user_id = $1 AND created_at >= $2
            """,
                user_id,
                since_date,
            )

            # Get contest type breakdown
            contest_breakdown = await conn.fetch(
                """
                SELECT contest_type, COUNT(*) as count
                FROM lineups 
                WHERE user_id = $1 AND created_at >= $2
                GROUP BY contest_type
            """,
                user_id,
                since_date,
            )

            # Get daily activity
            daily_activity = await conn.fetch(
                """
                SELECT DATE(created_at) as date, COUNT(*) as lineups_created
                FROM lineups 
                WHERE user_id = $1 AND created_at >= $2
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            """,
                user_id,
                since_date,
            )

            return {
                "stats": dict(stats) if stats else {},
                "contest_breakdown": [dict(row) for row in contest_breakdown],
                "daily_activity": [dict(row) for row in daily_activity],
            }

    async def cleanup_old_data(self, days: int = 90):
        """Clean up old data to maintain performance"""
        async with self.pg_pool.acquire() as conn:
            cutoff_date = datetime.now() - timedelta(days=days)

            # Clean up old optimization sessions
            deleted_sessions = await conn.fetchval(
                """
                DELETE FROM optimization_sessions 
                WHERE created_at < $1 AND status = 'completed'
                RETURNING COUNT(*)
            """,
                cutoff_date,
            )

            # Clean up old lineups (keep user data but remove detailed lineup info)
            await conn.execute(
                """
                UPDATE lineups 
                SET players = '[]'::jsonb 
                WHERE created_at < $1 AND players != '[]'::jsonb
            """,
                cutoff_date,
            )

            logger.info(f"Cleaned up {deleted_sessions} old optimization sessions")

    async def close(self):
        """Close database connections"""
        if self.pg_pool:
            await self.pg_pool.close()
        if self.redis_client:
            self.redis_client.close()


# Global database manager instance
db_manager = DatabaseManager()


async def get_db():
    """Get database manager instance"""
    if not db_manager.pg_pool:
        await db_manager.initialize()
    return db_manager


# Utility functions for common operations
async def save_optimization_result(
    user_id: str,
    slate_id: str,
    request_data: Dict[str, Any],
    response_data: Dict[str, Any],
):
    """Save complete optimization result"""
    db = await get_db()

    # Save optimization session
    session_id = await db.save_optimization_session(user_id, slate_id, request_data)
    await db.update_optimization_session(session_id, response_data)

    # Save individual lineups
    lineup_ids = []
    for lineup in response_data.get("lineups", []):
        lineup_record = LineupRecord(
            id="",  # Will be generated
            user_id=user_id,
            slate_id=slate_id,
            players=lineup["players"],
            total_salary=lineup["total_salary"],
            projected_score=lineup["projected_score"],
            ownership=lineup["ownership"],
            leverage=lineup["leverage"],
            stack_info=lineup["stack_info"],
            uniqueness=lineup["uniqueness"],
            created_at=datetime.now(),
        )
        lineup_id = await db.save_lineup(lineup_record)
        lineup_ids.append(lineup_id)

    return {"session_id": session_id, "lineup_ids": lineup_ids}


async def get_cached_player_pool(slate_id: str) -> Optional[List[Dict[str, Any]]]:
    """Get player pool with caching"""
    db = await get_db()

    # Try cache first
    cache_key = f"player_pool:{slate_id}"
    cached_data = await db.cache_get(cache_key)

    if cached_data:
        return cached_data

    # Get from database
    players = await db.get_player_pool(slate_id)

    # Cache for 5 minutes
    if players:
        await db.cache_set(cache_key, players, ttl=300)

    return players


if __name__ == "__main__":
    # Test database connection
    async def test_db():
        db = await get_db()
        logger.info("Database connection test successful")
        await db.close()

    asyncio.run(test_db())
