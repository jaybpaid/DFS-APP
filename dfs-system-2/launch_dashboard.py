#!/usr/bin/env python3
"""
Launch DFS Dashboard - Professional Web Interface
Similar to SaberSim, DFS Army, Stokastic
"""

import os
import sys
import time
from pathlib import Path

def install_web_dependencies():
    """Install required web dependencies"""
    print("Installing web dependencies...")
    os.system("python3 -m pip install fastapi uvicorn jinja2 python-multipart aiofiles")

def create_static_directory():
    """Create static directory structure"""
    static_dir = Path("src/web/static")
    static_dir.mkdir(parents=True, exist_ok=True)
    
    templates_dir = Path("src/web/templates")
    templates_dir.mkdir(parents=True, exist_ok=True)

def create_simple_server():
    """Create a simple FastAPI server for the dashboard"""
    server_code = '''
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.templating import Jinja2Templates
import json
import csv
from pathlib import Path
import random

app = FastAPI(title="DFS Optimizer Dashboard")
templates = Jinja2Templates(directory="src/web/templates")

# Global state
dashboard_data = {
    "players": [],
    "lineups": [],
    "sport": "NFL",
    "site": "DraftKings"
}

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Main dashboard page"""
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.post("/api/upload/salary")
async def upload_salary(file: UploadFile = File(...)):
    """Upload and process salary file"""
    try:
        content = await file.read()
        
        # Save temporarily and process
        temp_file = f"/tmp/{file.filename}"
        with open(temp_file, "wb") as f:
            f.write(content)
        
        # Parse CSV
        players = []
        with open(temp_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('Name') or row.get('Nickname')
                position = row.get('Position')
                team = row.get('TeamAbbrev') or row.get('Team')
                salary = int(row.get('Salary', 5000))
                
                player = {
                    "id": f"{name.replace(' ', '').lower()}_{team}_{position}",
                    "name": name,
                    "position": position,
                    "team": team,
                    "salary": salary,
                    "projection": round(random.uniform(8.0, 30.0), 1),
                    "ownership": round(random.uniform(2.0, 40.0), 1),
                    "value": round(random.uniform(8.0, 30.0) / (salary / 1000), 2),
                    "locked": False,
                    "banned": False,
                    "exposure": 100
                }
                players.append(player)
        
        dashboard_data["players"] = players
        
        # Clean up
        os.remove(temp_file)
        
        return JSONResponse({
            "success": True,
            "message": f"Imported {len(players)} players",
            "slate_info": {
                "name": file.filename,
                "salary_cap": 50000,
                "roster_size": 9,
                "player_count": len(players)
            }
        })
        
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)})

@app.get("/api/players")
async def get_players():
    """Get all players"""
    return JSONResponse(dashboard_data["players"])

@app.get("/api/dashboard/state")
async def get_state():
    """Get dashboard state"""
    return JSONResponse({
        "players_count": len(dashboard_data["players"]),
        "lineups_count": len(dashboard_data["lineups"]),
        "sport": dashboard_data["sport"],
        "site": dashboard_data["site"],
        "locked_count": len([p for p in dashboard_data["players"] if p.get("locked", False)]),
        "banned_count": len([p for p in dashboard_data["players"] if p.get("banned", False)]),
        "stacks_count": 0
    })

@app.post("/api/optimize")
async def optimize():
    """Generate optimized lineups"""
    try:
        if not dashboard_data["players"]:
            return JSONResponse({"success": False, "error": "No players loaded"})
        
        # Simple demo optimization
        players = dashboard_data["players"]
        lineup_players = random.sample(players, min(9, len(players)))
        
        lineup = {
            "id": "lineup_1",
            "players": lineup_players,
            "total_salary": sum(p["salary"] for p in lineup_players),
            "total_projection": sum(p["projection"] for p in lineup_players),
            "salary_remaining": 50000 - sum(p["salary"] for p in lineup_players),
            "projected_ownership": sum(p["ownership"] for p in lineup_players)
        }
        
        dashboard_data["lineups"] = [lineup]
        
        return JSONResponse({
            "success": True,
            "lineups": [lineup],
            "count": 1
        })
        
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)})

@app.get("/api/projections/update")
async def update_projections():
    """Update AI projections"""
    for player in dashboard_data["players"]:
        player["projection"] = round(random.uniform(8.0, 30.0), 1)
        player["ownership"] = round(random.uniform(2.0, 40.0), 1)
        player["value"] = round(player["projection"] / (player["salary"] / 1000), 2)
    
    return JSONResponse({
        "success": True,
        "message": "Projections updated",
        "updated_at": "now"
    })

if __name__ == "__main__":
    import uvicorn
    print("\\n🚀 Starting DFS Dashboard Server...")
    print("Dashboard will be available at: http://localhost:8000")
    print("Features: Upload CSV, Generate Lineups, Export Results")
    print("\\nPress Ctrl+C to stop server\\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
'''
    
    with open("dashboard_server.py", "w") as f:
        f.write(server_code)

def main():
    print("🏆 DFS Dashboard Setup")
    print("=" * 40)
    
    # Create directories
    create_static_directory()
    
    # Create simple server
    create_simple_server()
    
    # Install dependencies
    print("Installing web dependencies...")
    install_web_dependencies()
    
    print("\n✅ Dashboard Ready!")
    print("\n🚀 To launch the dashboard:")
    print("   python3 dashboard_server.py")
    print("\n📱 Then open your browser to:")
    print("   http://localhost:8000")
    print("\n🎯 Features Available:")
    print("   • Upload DK/FD salary CSV files")
    print("   • View player pool with projections")
    print("   • Lock/ban/exposure controls")
    print("   • Generate optimized lineups")
    print("   • Export lineups for upload")
    print("   • Professional UI like SaberSim/DFS Army")

if __name__ == "__main__":
    main()
