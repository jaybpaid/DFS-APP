#!/usr/bin/env python3
"""
Comprehensive live data fetcher for DFS Optimizer
Fetches data from all enabled sources and updates the system with live data
"""

import os
import json
import requests
import pandas as pd
from datetime import datetime
from pathlib import Path
import time
from typing import Dict, Any, List
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load configuration
CONFIG_PATH = Path("src/config/sources.json")
ENV_PATH = Path(".env")
DATA_DIR = Path("public/data")

def load_config():
    """Load data sources configuration"""
    try:
        with open(CONFIG_PATH, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        return {}

def load_env():
    """Load environment variables"""
    env_vars = {}
    if ENV_PATH.exists():
        with open(ENV_PATH, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars

def fetch_draftkings_data(sport: str):
    """Fetch DraftKings data using the existing JavaScript script"""
    try:
        import subprocess
        result = subprocess.run(['node', 'scripts/prefetch-dk.js'], 
                              capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            logger.info(f"DraftKings {sport} data fetched successfully")
            return True
        else:
            logger.warning(f"DraftKings fetch failed: {result.stderr}")
            return False
    except Exception as e:
        logger.error(f"DraftKings fetch error: {e}")
        return False

def fetch_nflfastr_data():
    """Fetch NFL data from nflfastR"""
    try:
        current_year = datetime.now().year
        url = f"https://github.com/nflverse/nfldata/releases/latest/download/play_by_play_{current_year}.parquet"
        
        logger.info(f"Fetching nflfastR data: {url}")
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            # Save the parquet file
            output_path = DATA_DIR / f"nflfastr_{current_year}.parquet"
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Saved nflfastR data to {output_path}")
            return True
        else:
            logger.warning(f"nflfastR fetch failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"nflfastR fetch error: {e}")
        return False

def fetch_odds_data(sport: str, env_vars: Dict[str, str]):
    """Fetch betting odds data"""
    try:
        api_key = env_vars.get('THE_ODDS_API_KEY')
        if not api_key or api_key == 'your_odds_api_key_here':
            logger.warning("THE_ODDS_API_KEY not configured")
            return False
        
        sport_mapping = {
            'NFL': 'americanfootball_nfl',
            'NBA': 'basketball_nba'
        }
        
        sport_key = sport_mapping.get(sport)
        if not sport_key:
            logger.warning(f"Unknown sport for odds: {sport}")
            return False
        
        url = f"https://api.the-odds-api.com/v4/sports/{sport_key}/odds"
        params = {
            'apiKey': api_key,
            'regions': 'us',
            'markets': 'h2h,spreads,totals',
            'oddsFormat': 'american'
        }
        
        logger.info(f"Fetching odds data for {sport}")
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            output_path = DATA_DIR / f"odds_{sport.lower()}_{datetime.now().strftime('%Y%m%d')}.json"
            
            with open(output_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Saved odds data to {output_path}")
            return True
        else:
            logger.warning(f"Odds API fetch failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Odds fetch error: {e}")
        return False

def fetch_sportsblaze_data(sport: str, env_vars: Dict[str, str]):
    """Fetch NFL data from SportsBlaze API"""
    try:
        api_key = env_vars.get('SPORTSBLAZE_API_KEY')
        if not api_key:
            logger.warning("SPORTSBLAZE_API_KEY not configured")
            return False
        
        if sport != 'NFL':
            logger.info(f"SportsBlaze only supports NFL, skipping {sport}")
            return False
        
        # Get today's date for boxscore data
        today = datetime.now().strftime('%Y-%m-%d')
        url = f"https://api.sportsblaze.com/nfl/v1/boxscores/daily/{today}.json"
        params = {'key': api_key}
        
        logger.info(f"Fetching NFL data from SportsBlaze for {today}")
        response = requests.get(url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            output_path = DATA_DIR / f"sportsblaze_nfl_{today}.json"
            
            with open(output_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info(f"Saved SportsBlaze NFL data to {output_path}")
            return True
        else:
            logger.warning(f"SportsBlaze fetch failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"SportsBlaze fetch error: {e}")
        return False

def fetch_weather_data(env_vars: Dict[str, str]):
    """Fetch weather data using OpenWeather API or fallback to NOAA"""
    try:
        api_key = env_vars.get('OPENWEATHER_API_KEY')
        
        # Try OpenWeather API first if configured
        if api_key and api_key != 'your_openweather_api_key_here':
            logger.info("Using OpenWeather API")
            return fetch_openweather_data(api_key)
        else:
            logger.warning("OPENWEATHER_API_KEY not configured, falling back to NOAA")
            return fetch_noaa_weather_data()
            
    except Exception as e:
        logger.error(f"Weather fetch error: {e}")
        return False

def fetch_openweather_data(api_key: str):
    """Fetch weather data using OpenWeather API"""
    try:
        # For demo purposes, we'll fetch weather for major NFL cities
        cities = [
            ('New York', 'NY', 40.7128, -74.0060),
            ('Los Angeles', 'CA', 34.0522, -118.2437),
            ('Chicago', 'IL', 41.8781, -87.6298),
            ('Miami', 'FL', 25.7617, -80.1918),
            ('Dallas', 'TX', 32.7767, -96.7970)
        ]
        
        weather_data = []
        
        for city, state, lat, lon in cities:
            url = f"https://api.openweathermap.org/data/2.5/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': api_key,
                'units': 'imperial'
            }
            
            logger.info(f"Fetching OpenWeather data for {city}, {state}")
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                weather_data.append({
                    'city': city,
                    'state': state,
                    'weather': data,
                    'source': 'openweather'
                })
                time.sleep(1)  # Rate limiting
            else:
                logger.warning(f"OpenWeather fetch failed for {city}: HTTP {response.status_code}")
        
        if weather_data:
            output_path = DATA_DIR / f"weather_{datetime.now().strftime('%Y%m%d')}.json"
            with open(output_path, 'w') as f:
                json.dump(weather_data, f, indent=2)
            
            logger.info(f"Saved OpenWeather data to {output_path}")
            return True
        else:
            return False
            
    except Exception as e:
        logger.error(f"OpenWeather fetch error: {e}")
        return False

def fetch_noaa_weather_data():
    """Fetch weather data using NOAA Weather Service API (no API key required)"""
    try:
        # Major NFL stadium locations with coordinates
        stadiums = [
            ('MetLife Stadium', 'East Rutherford', 'NJ', 40.8135, -74.0745),
            ('SoFi Stadium', 'Inglewood', 'CA', 33.9535, -118.3391),
            ('Soldier Field', 'Chicago', 'IL', 41.8623, -87.6167),
            ('Hard Rock Stadium', 'Miami Gardens', 'FL', 25.9580, -80.2389),
            ('AT&T Stadium', 'Arlington', 'TX', 32.7473, -97.0945)
        ]
        
        weather_data = []
        
        for stadium, city, state, lat, lon in stadiums:
            try:
                # First get the forecast grid endpoint
                points_url = f"https://api.weather.gov/points/{lat},{lon}"
                logger.info(f"Fetching NOAA forecast for {stadium} ({city}, {state})")
                
                points_response = requests.get(points_url, timeout=30, headers={
                    'User-Agent': 'DFS-Optimizer/1.0 (contact: admin@dfs-optimizer.com)'
                })
                
                if points_response.status_code == 200:
                    points_data = points_response.json()
                    forecast_url = points_data['properties']['forecast']
                    
                    # Get the actual forecast
                    forecast_response = requests.get(forecast_url, timeout=30, headers={
                        'User-Agent': 'DFS-Optimizer/1.0 (contact: admin@dfs-optimizer.com)'
                    })
                    
                    if forecast_response.status_code == 200:
                        forecast_data = forecast_response.json()
                        current_period = forecast_data['properties']['periods'][0] if forecast_data['properties']['periods'] else {}
                        
                        weather_data.append({
                            'stadium': stadium,
                            'city': city,
                            'state': state,
                            'weather': {
                                'temperature': current_period.get('temperature', 'N/A'),
                                'temperatureUnit': current_period.get('temperatureUnit', 'F'),
                                'windSpeed': current_period.get('windSpeed', 'N/A'),
                                'windDirection': current_period.get('windDirection', 'N/A'),
                                'shortForecast': current_period.get('shortForecast', 'N/A'),
                                'detailedForecast': current_period.get('detailedForecast', 'N/A')
                            },
                            'source': 'noaa'
                        })
                        time.sleep(0.5)  # Respectful rate limiting
                    else:
                        logger.warning(f"NOAA forecast fetch failed for {stadium}: HTTP {forecast_response.status_code}")
                else:
                    logger.warning(f"NOAA points fetch failed for {stadium}: HTTP {points_response.status_code}")
                    
            except Exception as e:
                logger.error(f"NOAA fetch error for {stadium}: {e}")
                continue
        
        if weather_data:
            output_path = DATA_DIR / f"weather_{datetime.now().strftime('%Y%m%d')}.json"
            with open(output_path, 'w') as f:
                json.dump(weather_data, f, indent=2)
            
            logger.info(f"Saved NOAA weather data to {output_path}")
            return True
        else:
            logger.warning("No NOAA weather data fetched successfully")
            return False
            
    except Exception as e:
        logger.error(f"NOAA weather fetch error: {e}")
        return False

def update_env_file():
    """Update .env file with placeholder API keys if missing"""
    try:
        env_vars = load_env()
        updated = False
        
        # Check for missing API keys
        missing_keys = []
        if env_vars.get('THE_ODDS_API_KEY') in [None, 'your_odds_api_key_here']:
            missing_keys.append('THE_ODDS_API_KEY')
        if env_vars.get('OPENWEATHER_API_KEY') in [None, 'your_openweather_api_key_here']:
            missing_keys.append('OPENWEATHER_API_KEY')
        
        if missing_keys:
            logger.warning(f"Missing API keys: {', '.join(missing_keys)}")
            
            # Read current content
            lines = []
            if ENV_PATH.exists():
                with open(ENV_PATH, 'r') as f:
                    lines = f.readlines()
            
            # Add missing keys
            for key in missing_keys:
                lines.append(f"{key}=your_{key.lower()}_here\n")
                logger.info(f"Added placeholder for {key}")
            
            # Write back
            with open(ENV_PATH, 'w') as f:
                f.writelines(lines)
            
            updated = True
        
        return updated
        
    except Exception as e:
        logger.error(f"Env file update error: {e}")
        return False

def main():
    """Main execution"""
    logger.info("🚀 Starting comprehensive live data fetch...")
    
    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Update environment file
    env_updated = update_env_file()
    if env_updated:
        logger.info("Updated .env file with placeholder API keys")
    
    # Load configuration and environment
    config = load_config()
    env_vars = load_env()
    
    results = {
        'timestamp': datetime.now().isoformat(),
        'sources': {}
    }
    
    # Fetch data for each sport
    for sport in ['NFL', 'NBA']:
        logger.info(f"\n📊 Processing {sport}...")
        sport_results = {}
        
        # DraftKings data
        sport_results['draftkings'] = fetch_draftkings_data(sport)
        
        # Core data sources
        if sport == 'NFL':
            sport_results['nflfastr'] = fetch_nflfastr_data()
        
        # SportsBlaze data (NFL only)
        sport_results['sportsblaze'] = fetch_sportsblaze_data(sport, env_vars)
        
        # Odds data
        sport_results['odds'] = fetch_odds_data(sport, env_vars)
        
        # Weather data (for NFL)
        if sport == 'NFL':
            sport_results['weather'] = fetch_weather_data(env_vars)
        
        results['sources'][sport] = sport_results
    
    # Generate report
    report_path = DATA_DIR / "live_data_report.json"
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"\n📋 Live data fetch completed!")
    logger.info(f"Report saved to: {report_path}")
    
    # Summary
    total_sources = sum(len(sources) for sources in results['sources'].values())
    successful_sources = sum(sum(1 for result in sources.values() if result) 
                           for sources in results['sources'].values())
    
    logger.info(f"Successful sources: {successful_sources}/{total_sources}")
    
    if successful_sources == 0:
        logger.warning("⚠️ No live data sources succeeded - using demo data")
    else:
        logger.info("✅ Live data integration complete!")

if __name__ == "__main__":
    main()
