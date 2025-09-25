"""
Analytics Models - Core Plays, Boom/Bust, News Feed
Pydantic v2 models with strict validation and bounds enforcement
"""

from __future__ import annotations
from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from typing_extensions import Annotated

# Common type annotations
FORBID_EXTRAS = ConfigDict(extra="forbid", populate_by_name=True, from_attributes=True)
NonEmptyStr = Annotated[str, Field(min_length=1)]
Prob = Annotated[float, Field(ge=0.0, le=1.0, description="Probability in [0,1]")]
Salary = Annotated[int, Field(ge=0, description="Non-negative salary")]

# =========================
# Core Plays Models
# =========================

CoreTier = Literal["Core Value", "Chalk Leverage", "Mid-Owned Leverage", "Sleeper"]

class CorePlay(BaseModel):
    model_config = FORBID_EXTRAS

    playerId: NonEmptyStr
    name: NonEmptyStr
    team: NonEmptyStr
    opp: Optional[str] = None
    gameId: Optional[str] = None
    kickoff: Optional[datetime] = None
    pos: List[str] = Field(min_length=1)
    salary: Salary
    proj: float
    own: Prob
    leverage: float = Field(description="Exposure minus field ownership; can be negative")
    value: Optional[float] = Field(default=None, description="Projection per $1K salary")
    tier: CoreTier
    tags: List[NonEmptyStr] = Field(default_factory=list)

class CorePlaysResponse(BaseModel):
    model_config = FORBID_EXTRAS

    slateId: NonEmptyStr
    generatedAt: datetime
    method: Literal["rules", "ml", "hybrid"]
    notes: Optional[str] = None
    players: List[CorePlay] = Field(min_length=1)

# =========================
# Boom/Bust Models  
# =========================

class BoomBustRow(BaseModel):
    model_config = FORBID_EXTRAS

    playerId: NonEmptyStr
    name: NonEmptyStr
    team: NonEmptyStr
    opp: Optional[str] = None
    gameId: Optional[str] = None
    pos: List[str] = Field(min_length=1)
    salary: Salary
    proj: float
    own: Prob
    boomProb: Prob
    bustProb: Prob
    ceiling: float = Field(description="High percentile (p90)")
    floor: float = Field(description="Low percentile (p10)")
    leverage: float
    notes: Optional[str] = None

class BoomBustResponse(BaseModel):
    model_config = FORBID_EXTRAS

    slateId: NonEmptyStr
    generatedAt: datetime
    players: List[BoomBustRow] = Field(min_length=1)

# =========================
# News Feed Models
# =========================

NewsTag = Literal[
    "injury", "status", "rest", "depth", "role", "trade",
    "weather", "vegas", "coach", "suspension", "other"
]

class NewsItem(BaseModel):
    model_config = FORBID_EXTRAS

    id: NonEmptyStr
    timestamp: datetime
    playerId: Optional[str] = None
    name: Optional[str] = None
    team: Optional[str] = None
    headline: NonEmptyStr
    body: Optional[str] = None
    source: NonEmptyStr
    link: Optional[HttpUrl] = None
    tags: List[NewsTag] = Field(default_factory=list)
    impactScore: Prob = Field(description="0=none, 1=massive slate impact")
    affects: List[str] = Field(default_factory=list, description="IDs of affected players")

class NewsItemsResponse(BaseModel):
    model_config = FORBID_EXTRAS

    slateId: NonEmptyStr
    generatedAt: datetime
    cursor: Optional[str] = Field(default=None, description="Pagination cursor")
    items: List[NewsItem] = Field(default_factory=list)

__all__ = [
    "CoreTier", "CorePlay", "CorePlaysResponse",
    "BoomBustRow", "BoomBustResponse", 
    "NewsTag", "NewsItem", "NewsItemsResponse"
]
