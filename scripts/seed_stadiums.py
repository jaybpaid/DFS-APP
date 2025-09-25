#!/usr/bin/env python3
"""
Stadium seeding script to create stadiums.json with weather.gov grid coordinates.
Maps each NFL stadium to {office, gridX, gridY} for weather API calls.
"""

import json
import logging

logger = logging.getLogger(__name__)

# NFL Stadium data mapped to National Weather Service grid coordinates
# Format: {stadium_name: {city, state, office, gridX, gridY, lat, lng}}
NFL_STADIUMS = {
    "Allegiant Stadium": {
        "city": "Las Vegas",
        "state": "NV", 
        "team": "Raiders",
        "office": "VEF",
        "gridX": 115,
        "gridY": 95,
        "lat": 36.0909,
        "lng": -115.1833
    },
    "Arrowhead Stadium": {
        "city": "Kansas City", 
        "state": "MO",
        "team": "Chiefs",
        "office": "EAX",
        "gridX": 39,
        "gridY": 102,
        "lat": 39.0489,
        "lng": -94.4839
    },
    "AT&T Stadium": {
        "city": "Arlington",
        "state": "TX", 
        "team": "Cowboys",
        "office": "FWD",
        "gridX": 78,
        "gridY": 118,
        "lat": 32.7473,
        "lng": -97.0945
    },
    "Bank of America Stadium": {
        "city": "Charlotte",
        "state": "NC",
        "team": "Panthers", 
        "office": "GSP",
        "gridX": 68,
        "gridY": 51,
        "lat": 35.2271,
        "lng": -80.8531
    },
    "Bills Stadium": {
        "city": "Orchard Park",
        "state": "NY",
        "team": "Bills",
        "office": "BUF", 
        "gridX": 61,
        "gridY": 68,
        "lat": 42.7738,
        "lng": -78.7870
    },
    "Caesars Superdome": {
        "city": "New Orleans",
        "state": "LA",
        "team": "Saints",
        "office": "LIX",
        "gridX": 85,
        "gridY": 39,
        "lat": 29.9511,
        "lng": -90.0812
    },
    "Cleveland Browns Stadium": {
        "city": "Cleveland", 
        "state": "OH",
        "team": "Browns",
        "office": "CLE",
        "gridX": 83,
        "gridY": 65,
        "lat": 41.5061,
        "lng": -81.6995
    },
    "Empower Field at Mile High": {
        "city": "Denver",
        "state": "CO",
        "team": "Broncos", 
        "office": "BOU",
        "gridX": 62,
        "gridY": 61,
        "lat": 39.7439,
        "lng": -105.0201
    },
    "FedExField": {
        "city": "Landover",
        "state": "MD",
        "team": "Commanders",
        "office": "LWX",
        "gridX": 97,
        "gridY": 71,
        "lat": 38.9076,
        "lng": -76.8645
    },
    "Ford Field": {
        "city": "Detroit",
        "state": "MI", 
        "team": "Lions",
        "office": "DTX",
        "gridX": 65,
        "gridY": 33,
        "lat": 42.3400,
        "lng": -83.0456
    },
    "Gillette Stadium": {
        "city": "Foxborough",
        "state": "MA",
        "team": "Patriots",
        "office": "BOX",
        "gridX": 71,
        "gridY": 76,
        "lat": 42.0909,
        "lng": -71.2643
    },
    "Hard Rock Stadium": {
        "city": "Miami Gardens", 
        "state": "FL",
        "team": "Dolphins",
        "office": "MFL",
        "gridX": 110,
        "gridY": 50,
        "lat": 25.9580,
        "lng": -80.2389
    },
    "Heinz Field": {
        "city": "Pittsburgh",
        "state": "PA",
        "team": "Steelers",
        "office": "PBZ",
        "gridX": 77,
        "gridY": 65,
        "lat": 40.4468,
        "lng": -80.0158
    },
    "GEHA Field at Arrowhead Stadium": {
        "city": "Kansas City",
        "state": "MO", 
        "team": "Chiefs",
        "office": "EAX",
        "gridX": 39,
        "gridY": 102,
        "lat": 39.0489,
        "lng": -94.4839
    },
    "Lambeau Field": {
        "city": "Green Bay",
        "state": "WI",
        "team": "Packers",
        "office": "GRB",
        "gridX": 86,
        "gridY": 64,
        "lat": 44.5013,
        "lng": -88.0622
    },
    "Lincoln Financial Field": {
        "city": "Philadelphia",
        "state": "PA",
        "team": "Eagles", 
        "office": "PHI",
        "gridX": 49,
        "gridY": 75,
        "lat": 39.9008,
        "lng": -75.1675
    },
    "Lumen Field": {
        "city": "Seattle",
        "state": "WA",
        "team": "Seahawks",
        "office": "SEW",
        "gridX": 124,
        "gridY": 67,
        "lat": 47.5951,
        "lng": -122.3316
    },
    "M&T Bank Stadium": {
        "city": "Baltimore", 
        "state": "MD",
        "team": "Ravens",
        "office": "LWX",
        "gridX": 97,
        "gridY": 64,
        "lat": 39.2780,
        "lng": -76.6227
    },
    "Mercedes-Benz Stadium": {
        "city": "Atlanta",
        "state": "GA",
        "team": "Falcons",
        "office": "FFC",
        "gridX": 48,
        "gridY": 34,
        "lat": 33.7553,
        "lng": -84.4006
    },
    "MetLife Stadium": {
        "city": "East Rutherford",
        "state": "NJ", 
        "team": "Giants/Jets",
        "office": "OKX",
        "gridX": 33,
        "gridY": 37,
        "lat": 40.8135,
        "lng": -74.0745
    },
    "NRG Stadium": {
        "city": "Houston",
        "state": "TX",
        "team": "Texans",
        "office": "HGX", 
        "gridX": 67,
        "gridY": 92,
        "lat": 29.6847,
        "lng": -95.4107
    },
    "Nissan Stadium": {
        "city": "Nashville",
        "state": "TN",
        "team": "Titans",
        "office": "OHX",
        "gridX": 51,
        "gridY": 67,
        "lat": 36.1665,
        "lng": -86.7714
    },
    "Paycor Stadium": {
        "city": "Cincinnati",
        "state": "OH", 
        "team": "Bengals",
        "office": "ILN",
        "gridX": 83,
        "gridY": 69,
        "lat": 39.0955,
        "lng": -84.5160
    },
    "Raymond James Stadium": {
        "city": "Tampa",
        "state": "FL",
        "team": "Buccaneers",
        "office": "TBW",
        "gridX": 42,
        "gridY": 67,
        "lat": 27.9759,
        "lng": -82.5033
    },
    "SoFi Stadium": {
        "city": "Los Angeles",
        "state": "CA", 
        "team": "Rams/Chargers",
        "office": "LOX",
        "gridX": 154,
        "gridY": 52,
        "lat": 33.9535,
        "lng": -118.3392
    },
    "Soldier Field": {
        "city": "Chicago",
        "state": "IL",
        "team": "Bears",
        "office": "LOT",
        "gridX": 70,
        "gridY": 75,
        "lat": 41.8623,
        "lng": -87.6167
    },
    "State Farm Stadium": {
        "city": "Glendale",
        "state": "AZ",
        "team": "Cardinals", 
        "office": "PSR",
        "gridX": 161,
        "gridY": 98,
        "lat": 33.5276,
        "lng": -112.2626
    },
    "TIAA Bank Field": {
        "city": "Jacksonville",
        "state": "FL", 
        "team": "Jaguars",
        "office": "JAX",
        "gridX": 65,
        "gridY": 69,
        "lat": 30.3240,
        "lng": -81.6374
    },
    "U.S. Bank Stadium": {
        "city": "Minneapolis",
        "state": "MN",
        "team": "Vikings",
        "office": "MPX",
        "gridX": 106,
        "gridY": 71,
        "lat": 44.9739,
        "lng": -93.2581
    },
    "Lucas Oil Stadium": {
        "city": "Indianapolis",
        "state": "IN",
        "team": "Colts", 
        "office": "IND",
        "gridX": 58,
        "gridY": 44,
        "lat": 39.7601,
        "lng": -86.1639
    },
    "Acrisure Stadium": {
        "city": "Pittsburgh",
        "state": "PA",
        "team": "Steelers",
        "office": "PBZ",
        "gridX": 77,
        "gridY": 65,
        "lat": 40.4468,
        "lng": -80.0158
    }
}

def create_stadiums_json(output_path: str = "stadiums.json"):
    """
    Creates stadiums.json file with all NFL stadium data.
    """
    try:
        # Add unique stadium IDs and normalize data
        stadiums_with_ids = {}
        for idx, (name, data) in enumerate(NFL_STADIUMS.items(), 1):
            stadium_id = f"nfl_stadium_{idx:02d}"
            stadiums_with_ids[stadium_id] = {
                "id": stadium_id,
                "name": name,
                "city": data["city"],
                "state": data["state"],
                "team": data["team"],
                "weather_grid": {
                    "office": data["office"],
                    "gridX": data["gridX"], 
                    "gridY": data["gridY"]
                },
                "coordinates": {
                    "lat": data["lat"],
                    "lng": data["lng"]
                }
            }
        
        # Write to JSON file
        with open(output_path, 'w') as f:
            json.dump({
                "version": "1.0",
                "generated_at": "2025-09-19T12:34:00Z",
                "description": "NFL Stadium data with Weather.gov grid coordinates",
                "stadiums": stadiums_with_ids
            }, f, indent=2)
        
        logger.info(f"Successfully created {output_path} with {len(stadiums_with_ids)} stadiums")
        return True
        
    except Exception as e:
        logger.error(f"Failed to create stadiums.json: {e}")
        return False

def get_stadium_by_team(team_name: str) -> dict:
    """
    Get stadium data by team name.
    """
    for stadium_id, data in NFL_STADIUMS.items():
        if team_name.lower() in data["team"].lower():
            return data
    return None

def get_weather_grid(stadium_name: str) -> dict:
    """
    Get weather.gov grid coordinates for a stadium.
    """
    if stadium_name in NFL_STADIUMS:
        stadium = NFL_STADIUMS[stadium_name]
        return {
            "office": stadium["office"],
            "gridX": stadium["gridX"],
            "gridY": stadium["gridY"]
        }
    return None

if __name__ == "__main__":
    import sys
    
    logging.basicConfig(level=logging.INFO)
    
    output_file = sys.argv[1] if len(sys.argv) > 1 else "stadiums.json"
    
    if create_stadiums_json(output_file):
        print(f"✅ Successfully created {output_file}")
        print(f"📊 Total stadiums: {len(NFL_STADIUMS)}")
        
        # Test a few lookups
        print("\n🧪 Testing stadium lookups:")
        test_teams = ["Chiefs", "Bills", "Cowboys"]
        for team in test_teams:
            stadium = get_stadium_by_team(team)
            if stadium:
                print(f"  {team}: {stadium['office']}/{stadium['gridX']},{stadium['gridY']}")
    else:
        print("❌ Failed to create stadiums.json")
        sys.exit(1)
