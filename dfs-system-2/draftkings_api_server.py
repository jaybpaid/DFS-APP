#!/usr/bin/env python3
"""
DraftKings API Proxy Server
Handles CORS issues and provides live DFS player data to the HTML dashboard
"""

import asyncio
import aiohttp
import json
from aiohttp import web
from aiohttp.web import Application, Response, Request
from aiohttp_cors import setup as cors_setup, ResourceOptions
import logging
from datetime import datetime
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DraftKingsAPIProxy:
    """Proxy server for DraftKings API calls"""
    
    def __init__(self):
        self.base_url = "https://api.draftkings.com"
        self.lobby_url = "https://www.draftkings.com"
        self.session = None
        
    async def create_session(self):
        """Create aiohttp session with proper headers"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
        
        connector = aiohttp.TCPConnector(limit=10, limit_per_host=5, ssl=False)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(
            headers=headers,
            connector=connector,
            timeout=timeout
        )
        
    async def fetch_contests(self, sport: str = "NFL") -> Dict[str, Any]:
        """Fetch available contests for a sport - using real DraftKings API"""
        try:
            sport_param = sport.lower()
            url = f"{self.lobby_url}/lobby/getcontests?sport={sport_param}"

            logger.info(f"Fetching contests from DraftKings: {url}")

            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    contests = data.get('Contests', [])
                    logger.info(f"✅ Found {len(contests)} contests from DraftKings API")
                    return {'contests': contests}
                else:
                    logger.error(f"Contests API failed with status: {response.status}")
                    return {"error": f"API returned status {response.status}"}

        except Exception as e:
            logger.error(f"Error fetching contests: {str(e)}")
            return {"error": str(e)}
    
    async def fetch_draftables(self, draft_group_id: str) -> Dict[str, Any]:
        """Fetch draftable players for a draft group - using real DraftKings API"""
        try:
            url = f"{self.base_url}/draftgroups/v1/draftgroups/{draft_group_id}/draftables"

            logger.info(f"Fetching draftables from DraftKings API: {url}")

            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    draftables = data.get('draftables', [])
                    logger.info(f"✅ Found {len(draftables)} draftables from DraftKings API")
                    return data
                else:
                    logger.error(f"Draftables API failed with status: {response.status}")
                    return {"error": f"API returned status {response.status}"}

        except Exception as e:
            logger.error(f"Error fetching draftables: {str(e)}")
            return {"error": str(e)}
    
    def extract_draft_group_ids(self, contests_data: Dict) -> List[str]:
        """Extract draft group IDs from contests data"""
        draft_group_ids = []

        try:
            contests = contests_data.get('contests', [])
            logger.info(f"Processing {len(contests)} contests for draft group IDs")

            for i, contest in enumerate(contests[:10]):  # Check first 10 contests
                # Look for draftGroupId in various locations
                if 'draftGroupId' in contest:
                    draft_group_ids.append(str(contest['draftGroupId']))
                    logger.info(f"Found draftGroupId: {contest['draftGroupId']}")
                elif 'DraftGroupId' in contest:
                    draft_group_ids.append(str(contest['DraftGroupId']))
                    logger.info(f"Found DraftGroupId: {contest['DraftGroupId']}")
                elif isinstance(contest.get('draftGroup'), dict):
                    dg_id = contest['draftGroup'].get('draftGroupId')
                    if dg_id:
                        draft_group_ids.append(str(dg_id))
                        logger.info(f"Found draftGroup.draftGroupId: {dg_id}")
                # Also check for 'dg' field (common in DraftKings API)
                elif 'dg' in contest:
                    draft_group_ids.append(str(contest['dg']))
                    logger.info(f"Found dg: {contest['dg']}")
                else:
                    # Debug: show what fields are available
                    if i == 0:  # Only log for first contest
                        logger.info(f"Contest keys: {list(contest.keys())}")

            # Remove duplicates and return first few
            unique_ids = list(set(draft_group_ids))[:5]  # Limit to avoid rate limiting
            logger.info(f"Extracted draft group IDs: {unique_ids}")
            return unique_ids

        except Exception as e:
            logger.error(f"Error extracting draft group IDs: {str(e)}")
            return []
    
    def process_draftables(self, draftables_data: Dict) -> List[Dict]:
        """Process draftables into simplified player format"""
        players = []
        
        try:
            draftables = draftables_data.get('draftables', [])
            
            for draftable in draftables:
                try:
                    # Extract basic player info
                    name = draftable.get('displayName', draftable.get('name', 'Unknown Player'))
                    salary = int(draftable.get('salary', 5000))
                    position = self.normalize_position(draftable.get('rosterSlotId', 'UTIL'))
                    team = self.extract_team(draftable)
                    
                    # Generate estimated metrics based on salary/position
                    projection = self.estimate_projection(position, salary)
                    ownership = self.estimate_ownership(salary, position)
                    boom_pct = self.estimate_boom_percentage(projection, position)
                    
                    player = {
                        'name': name,
                        'pos': position,
                        'team': team,
                        'salary': salary,
                        'projection': projection,
                        'ownership': ownership,
                        'leverage': round((projection / salary * 1000) / (ownership / 100), 2),
                        'boom_pct': boom_pct,
                        'ace_score': round((boom_pct * 0.8) + (projection * 3)),
                        'floor': round(projection * 0.7, 1),
                        'ceiling': round(projection * 1.4, 1),
                        'correlation': round(0.5 + (hash(name) % 100) / 300, 2),
                        'volatility': round(0.2 + ((hash(name + position) % 100) / 1000), 3),
                        'injury_status': 'Available',
                        'minExp': 0,
                        'maxExp': 100
                    }
                    
                    players.append(player)
                    
                except Exception as e:
                    logger.warning(f"Error processing draftable: {str(e)}")
                    continue
                    
            logger.info(f"Processed {len(players)} players")
            return players
            
        except Exception as e:
            logger.error(f"Error processing draftables: {str(e)}")
            return []
    
    def normalize_position(self, position) -> str:
        """Normalize position codes - handles both strings and DraftKings numeric codes"""
        position = str(position).upper().strip()

        # DraftKings roster slot ID mappings (based on their API)
        dk_position_map = {
            '66': 'QB',    # Quarterback
            '67': 'RB',    # Running Back
            '68': 'WR',    # Wide Receiver
            '69': 'TE',    # Tight End
            '70': 'FLEX',  # FLEX (can be RB/WR/TE)
            '71': 'DST',   # Defense/Special Teams
            '72': 'K'      # Kicker (if present)
        }

        # First try DraftKings numeric codes
        if position in dk_position_map:
            return dk_position_map[position]

        # Then try string mappings
        position_map = {
            'QB': 'QB', 'RB': 'RB', 'WR': 'WR', 'TE': 'TE',
            'DST': 'DST', 'K': 'K', 'FLEX': 'FLEX', 'UTIL': 'FLEX'
        }
        return position_map.get(position, position)
    
    def extract_team(self, draftable: Dict) -> str:
        """Extract team abbreviation from draftable"""
        if 'teamAbbreviation' in draftable:
            return draftable['teamAbbreviation'].upper()
        if 'team' in draftable:
            return str(draftable['team']).upper()
        if 'competition' in draftable and isinstance(draftable['competition'], dict):
            comp_name = draftable['competition'].get('name', '')
            # Parse "LAL@GSW" or similar formats
            import re
            match = re.search(r'([A-Z]{2,4})', comp_name)
            if match:
                return match.group(1)
        return 'UNK'
    
    def estimate_projection(self, position: str, salary: int) -> float:
        """Estimate fantasy projection based on salary and position"""
        projection_map = {
            'QB': salary * 0.0026 + 5,
            'RB': salary * 0.0023 + 3,
            'WR': salary * 0.0021 + 2,
            'TE': salary * 0.0019 + 2,
            'DST': salary * 0.003 + 2,
            'K': salary * 0.0025 + 3
        }
        base = projection_map.get(position, salary * 0.002 + 3)
        return round(base, 1)
    
    def estimate_ownership(self, salary: int, position: str) -> float:
        """Estimate field ownership based on salary and position"""
        base_ownership = min(45, (salary / 10000) * 30 + 5)
        
        # Position adjustments
        if position in ['QB', 'RB']:
            base_ownership += 5
        elif position in ['DST', 'K']:
            base_ownership -= 8
        
        return max(1, round(base_ownership, 1))
    
    def estimate_boom_percentage(self, projection: float, position: str) -> int:
        """Estimate boom percentage based on projection and position"""
        base_boom = min(95, projection * 3.5 + 20)
        
        # Position adjustments
        if position in ['WR', 'RB']:
            base_boom += 5
        elif position == 'DST':
            base_boom -= 10
        
        return max(5, round(base_boom))

# Global API proxy instance
api_proxy = DraftKingsAPIProxy()

async def handle_get_players(request: Request) -> Response:
    """Endpoint to get live player data"""
    try:
        sport = request.query.get('sport', 'NFL').upper()
        logger.info(f"Getting players for sport: {sport}")
        
        # Ensure session exists
        if not api_proxy.session:
            await api_proxy.create_session()
        
        # Step 1: Get contests
        contests_data = await api_proxy.fetch_contests(sport)
        
        if 'error' in contests_data:
            return web.json_response({
                'success': False,
                'error': contests_data['error'],
                'players': []
            }, status=400)
        
        # Step 2: Extract draft group IDs
        draft_group_ids = api_proxy.extract_draft_group_ids(contests_data)
        
        if not draft_group_ids:
            return web.json_response({
                'success': False,
                'error': 'No draft groups found',
                'players': []
            }, status=400)
        
        # Step 3: Get players from first draft group
        draftables_data = await api_proxy.fetch_draftables(draft_group_ids[0])
        
        if 'error' in draftables_data:
            return web.json_response({
                'success': False,
                'error': draftables_data['error'],
                'players': []
            }, status=400)
        
        # Step 4: Process players
        players = api_proxy.process_draftables(draftables_data)
        
        return web.json_response({
            'success': True,
            'sport': sport,
            'draft_group_id': draft_group_ids[0],
            'total_contests': len(contests_data.get('contests', [])),
            'players': players,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in handle_get_players: {str(e)}")
        return web.json_response({
            'success': False,
            'error': str(e),
            'players': []
        }, status=500)

async def handle_get_contests(request: Request) -> Response:
    """Endpoint to get available contests"""
    try:
        sport = request.query.get('sport', 'NFL').upper()
        
        if not api_proxy.session:
            await api_proxy.create_session()
        
        contests_data = await api_proxy.fetch_contests(sport)
        
        return web.json_response({
            'success': True,
            'sport': sport,
            'contests': contests_data.get('contests', []),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in handle_get_contests: {str(e)}")
        return web.json_response({
            'success': False,
            'error': str(e),
            'contests': []
        }, status=500)

async def init_app() -> Application:
    """Initialize the web application with CORS support"""
    app = web.Application()
    
    # Setup CORS to allow requests from our HTML file
    cors = cors_setup(app, defaults={
        "*": ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
            allow_methods="*"
        )
    })
    
    # Add routes
    app.router.add_get('/api/players', handle_get_players)
    app.router.add_get('/api/contests', handle_get_contests)
    
    # Add CORS to all routes
    for route in list(app.router.routes()):
        cors.add(route)
    
    # Health check endpoint
    async def health_check(request):
        return web.json_response({'status': 'healthy', 'timestamp': datetime.now().isoformat()})
    
    app.router.add_get('/health', health_check)
    cors.add(app.router._resources[-1])
    
    return app

async def cleanup(app):
    """Cleanup function to close aiohttp session"""
    if api_proxy.session:
        await api_proxy.session.close()

if __name__ == '__main__':
    # Create and run the server
    async def run_server():
        app = await init_app()
        app.on_cleanup.append(cleanup)
        
        # Create session for API proxy
        await api_proxy.create_session()
        
        # Start the server
        runner = web.AppRunner(app)
        await runner.setup()
        
        site = web.TCPSite(runner, '0.0.0.0', 8765)
        await site.start()
        
        print("🚀 DraftKings API Proxy Server started!")
        print("📡 Server running at: http://localhost:8765")
        print("🏈 Test endpoints:")
        print("   • NFL Players: http://localhost:8765/api/players?sport=NFL")
        print("   • NBA Players: http://localhost:8765/api/players?sport=NBA")
        print("   • Contests: http://localhost:8765/api/contests?sport=NFL")
        print("   • Health: http://localhost:8765/health")
        print("\n✅ Ready to serve live DFS data to your dashboard!")
        
        # Keep the server running
        try:
            while True:
                await asyncio.sleep(3600)  # Sleep for 1 hour
        except KeyboardInterrupt:
            print("\n🛑 Server shutting down...")
        finally:
            await runner.cleanup()
            if api_proxy.session:
                await api_proxy.session.close()
    
    # Run the server
    try:
        asyncio.run(run_server())
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
