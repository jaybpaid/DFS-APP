from pydantic import BaseModel
from typing import List, Optional

class Player(BaseModel):
    id: int
    name: str
    position: str
    team: str
    salary: float
    projection: float
    injury_status: Optional[str] = None

class Game(BaseModel):
    id: int
    home_team: str
    away_team: str
    slate_date: str
    slate_time: str

class Team(BaseModel):
    name: str
    players: List[Player]

class Slate(BaseModel):
    date: str
    games: List[Game]

class Projection(BaseModel):
    player_id: int
    projected_points: float

class Injury(BaseModel):
    player_id: int
    status: str
    update_time: str

class Weather(BaseModel):
    game_id: int
    condition: str
    temperature: float

class Odds(BaseModel):
    game_id: int
    home_team_odds: float
    away_team_odds: float
    over_under: float