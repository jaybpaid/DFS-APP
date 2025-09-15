from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class SportType(str, Enum):
    NFL = "NFL"
    NBA = "NBA"

class SiteType(str, Enum):
    DRAFTKINGS = "DraftKings"
    FANDUEL = "FanDuel"

class InjuryStatus(str, Enum):
    HEALTHY = "Healthy"
    QUESTIONABLE = "Questionable"
    DOUBTFUL = "Doubtful"
    OUT = "Out"
    IR = "IR"
    SUSPENDED = "Suspended"

class WeatherCondition(str, Enum):
    CLEAR = "Clear"
    CLOUDY = "Cloudy"
    RAIN = "Rain"
    SNOW = "Snow"
    WIND = "Wind"
    DOME = "Dome"

# Core Data Models
class Player(BaseModel):
    id: str = Field(..., description="Unique player identifier")
    name: str = Field(..., description="Player full name")
    position: str = Field(..., description="Player position")
    team: str = Field(..., description="Team abbreviation")
    salary: int = Field(..., ge=3000, le=15000, description="DFS salary")
    projected_ownership: Optional[float] = Field(None, ge=0, le=1, description="Projected ownership percentage")
    
    # DFS specific fields
    dk_position: Optional[str] = Field(None, description="DraftKings position eligibility")
    fd_position: Optional[str] = Field(None, description="FanDuel position eligibility")
    dk_salary: Optional[int] = Field(None, description="DraftKings salary")
    fd_salary: Optional[int] = Field(None, description="FanDuel salary")
    
    # Context fields
    game_id: Optional[str] = Field(None, description="Associated game ID")
    opponent: Optional[str] = Field(None, description="Opponent team")
    home_away: Optional[str] = Field(None, description="Home or Away")
    
    class Config:
        use_enum_values = True

class Game(BaseModel):
    id: str = Field(..., description="Unique game identifier")
    home_team: str = Field(..., description="Home team abbreviation")
    away_team: str = Field(..., description="Away team abbreviation")
    game_time: datetime = Field(..., description="Game start time")
    week: Optional[int] = Field(None, description="Week number (NFL)")
    season: int = Field(..., description="Season year")
    sport: SportType = Field(..., description="Sport type")
    
    # Vegas data
    home_spread: Optional[float] = Field(None, description="Home team spread")
    total: Optional[float] = Field(None, description="Game total over/under")
    home_ml: Optional[int] = Field(None, description="Home team moneyline")
    away_ml: Optional[int] = Field(None, description="Away team moneyline")
    
    class Config:
        use_enum_values = True

class Team(BaseModel):
    abbreviation: str = Field(..., description="Team abbreviation")
    name: str = Field(..., description="Team full name")
    conference: Optional[str] = Field(None, description="Conference")
    division: Optional[str] = Field(None, description="Division")
    
    # Stadium info
    stadium: Optional[str] = Field(None, description="Stadium name")
    dome: bool = Field(False, description="Is dome stadium")
    latitude: Optional[float] = Field(None, description="Stadium latitude")
    longitude: Optional[float] = Field(None, description="Stadium longitude")

class Slate(BaseModel):
    id: str = Field(..., description="Slate identifier")
    name: str = Field(..., description="Slate name")
    sport: SportType = Field(..., description="Sport type")
    site: SiteType = Field(..., description="DFS site")
    start_time: datetime = Field(..., description="Slate start time")
    games: List[Game] = Field(..., description="Games in slate")
    salary_cap: int = Field(..., description="Salary cap for slate")
    roster_size: int = Field(..., description="Roster size")

# Projection Models
class Projection(BaseModel):
    player_id: str = Field(..., description="Player identifier")
    sport: SportType = Field(..., description="Sport type")
    
    # Core projections
    mean: float = Field(..., description="Mean projected points")
    floor: float = Field(..., description="Floor projection (15th percentile)")
    ceiling: float = Field(..., description="Ceiling projection (85th percentile)")
    std: float = Field(..., description="Standard deviation")
    
    # Additional metrics
    median: Optional[float] = Field(None, description="Median projection")
    skewness: Optional[float] = Field(None, description="Distribution skewness")
    
    # Model attribution
    baseline_projection: Optional[float] = Field(None, description="Rules-based baseline")
    ml_projection: Optional[float] = Field(None, description="ML model projection")
    ensemble_weight: Optional[float] = Field(None, description="Final ensemble weight")
    
    # Context
    last_updated: datetime = Field(default_factory=datetime.now)
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Projection confidence")

class Injury(BaseModel):
    player_id: str = Field(..., description="Player identifier")
    status: InjuryStatus = Field(..., description="Injury status")
    description: Optional[str] = Field(None, description="Injury description")
    last_updated: datetime = Field(..., description="Last update time")
    source: str = Field(..., description="Data source")
    
    # Game-specific
    game_id: Optional[str] = Field(None, description="Game identifier")
    probable: Optional[bool] = Field(None, description="Probable to play?")

class Weather(BaseModel):
    game_id: str = Field(..., description="Game identifier")
    condition: WeatherCondition = Field(..., description="Weather condition")
    
    # Detailed weather
    temperature: Optional[float] = Field(None, description="Temperature in Fahrenheit")
    wind_speed: Optional[float] = Field(None, description="Wind speed in mph")
    wind_direction: Optional[str] = Field(None, description="Wind direction")
    humidity: Optional[float] = Field(None, ge=0, le=100, description="Humidity percentage")
    precipitation: Optional[float] = Field(None, description="Precipitation chance")
    
    # Impact factors
    dome: bool = Field(False, description="Is game in dome")
    weather_impact_score: Optional[float] = Field(None, description="Weather impact on game")
    
    last_updated: datetime = Field(default_factory=datetime.now)

class Odds(BaseModel):
    game_id: str = Field(..., description="Game identifier")
    source: str = Field(..., description="Odds source")
    
    # Game level odds
    home_spread: Optional[float] = Field(None, description="Home team spread")
    away_spread: Optional[float] = Field(None, description="Away team spread") 
    total: Optional[float] = Field(None, description="Total over/under")
    home_ml: Optional[int] = Field(None, description="Home moneyline")
    away_ml: Optional[int] = Field(None, description="Away moneyline")
    
    # Derived metrics
    home_implied_prob: Optional[float] = Field(None, description="Home win probability")
    away_implied_prob: Optional[float] = Field(None, description="Away win probability")
    total_implied_prob: Optional[float] = Field(None, description="Over implied probability")
    
    last_updated: datetime = Field(default_factory=datetime.now)

# Advanced Context Models
class TeamStats(BaseModel):
    team: str = Field(..., description="Team abbreviation")
    season: int = Field(..., description="Season year")
    sport: SportType = Field(..., description="Sport type")
    
    # Offensive stats
    points_per_game: Optional[float] = Field(None, description="Points per game")
    yards_per_game: Optional[float] = Field(None, description="Yards per game (NFL)")
    pass_yards_per_game: Optional[float] = Field(None, description="Pass yards per game")
    rush_yards_per_game: Optional[float] = Field(None, description="Rush yards per game")
    
    # Defensive stats  
    points_allowed_per_game: Optional[float] = Field(None, description="Points allowed per game")
    yards_allowed_per_game: Optional[float] = Field(None, description="Yards allowed per game")
    
    # Advanced metrics
    pace: Optional[float] = Field(None, description="Pace factor")
    pass_rate: Optional[float] = Field(None, description="Pass rate")
    red_zone_efficiency: Optional[float] = Field(None, description="Red zone efficiency")
    
    # NBA specific
    offensive_rating: Optional[float] = Field(None, description="Offensive rating")
    defensive_rating: Optional[float] = Field(None, description="Defensive rating")
    rebounds_per_game: Optional[float] = Field(None, description="Rebounds per game")

class PlayerStats(BaseModel):
    player_id: str = Field(..., description="Player identifier")
    season: int = Field(..., description="Season year")
    sport: SportType = Field(..., description="Sport type")
    
    # Basic stats
    games_played: int = Field(..., description="Games played")
    fantasy_points_per_game: Optional[float] = Field(None, description="Fantasy points per game")
    
    # NFL stats
    targets_per_game: Optional[float] = Field(None, description="Targets per game")
    carries_per_game: Optional[float] = Field(None, description="Carries per game")
    snap_share: Optional[float] = Field(None, description="Snap share percentage")
    air_yards_share: Optional[float] = Field(None, description="Air yards share")
    red_zone_targets: Optional[float] = Field(None, description="Red zone targets per game")
    
    # NBA stats
    minutes_per_game: Optional[float] = Field(None, description="Minutes per game")
    usage_rate: Optional[float] = Field(None, description="Usage rate")
    assist_rate: Optional[float] = Field(None, description="Assist rate")
    rebound_rate: Optional[float] = Field(None, description="Rebound rate")

# Optimization Models
class LineupPlayer(BaseModel):
    player_id: str = Field(..., description="Player identifier")
    roster_position: str = Field(..., description="Roster position (QB, RB, FLEX, etc.)")
    salary: int = Field(..., description="Player salary")
    projection: float = Field(..., description="Projected points")
    ownership: Optional[float] = Field(None, description="Projected ownership")

class Lineup(BaseModel):
    id: str = Field(..., description="Lineup identifier")
    players: List[LineupPlayer] = Field(..., description="Players in lineup")
    total_salary: int = Field(..., description="Total salary used")
    total_projection: float = Field(..., description="Total projected points")
    total_ownership: Optional[float] = Field(None, description="Total projected ownership")
    
    # Risk metrics
    ceiling: Optional[float] = Field(None, description="Lineup ceiling")
    floor: Optional[float] = Field(None, description="Lineup floor")
    std: Optional[float] = Field(None, description="Lineup standard deviation")
    
    # Stack info
    stack_type: Optional[str] = Field(None, description="Stack type (QB-WR, Game, etc.)")
    stack_teams: Optional[List[str]] = Field(None, description="Teams involved in stack")
    
    # Simulation results
    ev: Optional[float] = Field(None, description="Expected value from simulation")
    sharpe: Optional[float] = Field(None, description="Sharpe ratio")
    percentile_outcomes: Optional[Dict[str, float]] = Field(None, description="Percentile outcomes")

class OptimizationConfig(BaseModel):
    sport: SportType = Field(..., description="Sport type")
    site: SiteType = Field(..., description="DFS site")
    objective: str = Field("projection", description="Optimization objective")
    num_lineups: int = Field(1, description="Number of lineups to generate")
    
    # Constraints
    min_salary: Optional[int] = Field(None, description="Minimum salary to use")
    max_exposure: Optional[Dict[str, float]] = Field(None, description="Max exposure per player")
    locked_players: Optional[List[str]] = Field(None, description="Players to lock")
    banned_players: Optional[List[str]] = Field(None, description="Players to ban")
    
    # Stacking
    stack_config: Optional[Dict[str, Any]] = Field(None, description="Stacking configuration")
    max_overlap: Optional[float] = Field(None, description="Max lineup overlap")
    
    # Advanced
    randomness: float = Field(0.0, ge=0, le=1, description="Randomness factor")
    ownership_penalty: float = Field(0.0, description="Ownership penalty factor")

# Simulation Models  
class SimulationResult(BaseModel):
    lineup_id: str = Field(..., description="Lineup identifier")
    num_simulations: int = Field(..., description="Number of simulations run")
    
    # Distribution results
    mean: float = Field(..., description="Mean simulated score")
    std: float = Field(..., description="Standard deviation")
    min_score: float = Field(..., description="Minimum score")
    max_score: float = Field(..., description="Maximum score")
    
    # Percentiles
    p10: float = Field(..., description="10th percentile")
    p25: float = Field(..., description="25th percentile") 
    p50: float = Field(..., description="50th percentile (median)")
    p75: float = Field(..., description="75th percentile")
    p90: float = Field(..., description="90th percentile")
    
    # Win rates
    top1_percent: float = Field(..., description="Top 1% finish rate")
    top10_percent: float = Field(..., description="Top 10% finish rate")
    cash_rate: float = Field(..., description="Cash game finish rate")
    
    # Risk metrics
    sharpe_ratio: Optional[float] = Field(None, description="Sharpe ratio")
    downside_deviation: Optional[float] = Field(None, description="Downside deviation")

# Export Models
class ExportConfig(BaseModel):
    site: SiteType = Field(..., description="Export site")
    sport: SportType = Field(..., description="Sport type")
    include_projections: bool = Field(True, description="Include projections in export")
    include_ownership: bool = Field(True, description="Include ownership in export")
    include_metrics: bool = Field(False, description="Include advanced metrics")

class CSVExport(BaseModel):
    filename: str = Field(..., description="Export filename")
    lineups: List[Lineup] = Field(..., description="Lineups to export")
    config: ExportConfig = Field(..., description="Export configuration")
    created_at: datetime = Field(default_factory=datetime.now)

# Cache Models
class CacheEntry(BaseModel):
    key: str = Field(..., description="Cache key")
    data: Any = Field(..., description="Cached data")
    created_at: datetime = Field(default_factory=datetime.now)
    ttl_seconds: int = Field(..., description="TTL in seconds")
    source: str = Field(..., description="Data source")
    
    def is_expired(self) -> bool:
        """Check if cache entry is expired"""
        elapsed = (datetime.now() - self.created_at).total_seconds()
        return elapsed > self.ttl_seconds

# Error and Status Models
class DataIngestionStatus(BaseModel):
    source: str = Field(..., description="Data source name")
    status: str = Field(..., description="Status (success, error, warning)")
    records_processed: int = Field(0, description="Number of records processed")
    errors: List[str] = Field(default_factory=list, description="Error messages")
    warnings: List[str] = Field(default_factory=list, description="Warning messages")
    last_updated: datetime = Field(default_factory=datetime.now)
    execution_time_seconds: Optional[float] = Field(None, description="Execution time")

class PipelineStatus(BaseModel):
    sport: SportType = Field(..., description="Sport type") 
    stage: str = Field(..., description="Pipeline stage")
    status: str = Field(..., description="Overall status")
    ingestion_status: List[DataIngestionStatus] = Field(default_factory=list)
    projection_status: Optional[str] = Field(None, description="Projection status")
    optimization_status: Optional[str] = Field(None, description="Optimization status")
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = Field(None, description="Completion time")
