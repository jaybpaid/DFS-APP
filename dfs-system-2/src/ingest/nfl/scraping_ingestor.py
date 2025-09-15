"""
Web Scraping Ingestor - Free data from websites
Scrapes data from Daily Fantasy Fuel, RotoWire, Stokastic, and other free sources

This ingestor provides access to:
- Daily Fantasy Fuel projections and optimizer
- RotoWire lineup optimizer and value analysis
- Stokastic boom/bust probability tools
- Reddit community insights
- Weather data from Weather.com
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Optional, Any
import os
import sys
import requests
from bs4 import BeautifulSoup
import json
import re
import time

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from ..base import BaseIngestor

class ScrapingIngestor(BaseIngestor):
    """Ingestor for web scraping data sources"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.source_name = "scraping"

        # Set up headers to mimic browser
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

    def fetch_data(self) -> Dict[str, pd.DataFrame]:
        """Implement abstract method - fetch all scraping data"""
        return self.fetch_all_scraping_data()

    def scrape_daily_fantasy_fuel(self) -> pd.DataFrame:
        """Scrape projections from Daily Fantasy Fuel"""
        self.logger.info("Scraping Daily Fantasy Fuel projections")

        try:
            url = "https://www.dailyfantasyfuel.com/nfl/"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            projections = []

            # Try multiple selector strategies for Daily Fantasy Fuel
            # Strategy 1: Look for player projection tables
            projection_tables = soup.find_all(['table', 'div'], class_=re.compile(r'(projection|player|lineup|optimize)'))

            for table in projection_tables:
                rows = table.find_all(['tr', 'div'])
                for row in rows:
                    # Extract player data using various methods
                    player_name = None
                    position = None
                    projection = 0
                    salary = 0

                    # Try different extraction methods
                    name_elem = row.find(['td', 'div', 'span'], class_=re.compile(r'(name|player|athlete)'))
                    if name_elem:
                        player_name = name_elem.text.strip()

                    pos_elem = row.find(['td', 'div', 'span'], class_=re.compile(r'(position|pos)'))
                    if pos_elem:
                        position = pos_elem.text.strip()

                    proj_elem = row.find(['td', 'div', 'span'], class_=re.compile(r'(projection|points|fantasy)'))
                    if proj_elem:
                        try:
                            projection = float(re.sub(r'[^\d.]', '', proj_elem.text.strip()))
                        except:
                            projection = 0

                    salary_elem = row.find(['td', 'div', 'span'], class_=re.compile(r'(salary|cost|price)'))
                    if salary_elem:
                        try:
                            salary = int(re.sub(r'[^\d]', '', salary_elem.text.strip()))
                        except:
                            salary = 0

                    if player_name and position:
                        projections.append({
                            'player_name': player_name,
                            'position': position,
                            'projection': projection,
                            'salary': salary,
                            'source': 'daily_fantasy_fuel'
                        })

            # Strategy 2: If no tables found, try JSON data in scripts
            if not projections:
                scripts = soup.find_all('script', type='application/json')
                for script in scripts:
                    try:
                        data = json.loads(script.string)
                        # Look for player data in JSON
                        if isinstance(data, dict):
                            players = data.get('players', data.get('data', []))
                            if isinstance(players, list):
                                for player in players:
                                    if isinstance(player, dict):
                                        projections.append({
                                            'player_name': player.get('name', ''),
                                            'position': player.get('position', ''),
                                            'projection': float(player.get('projection', 0)),
                                            'salary': int(player.get('salary', 0)),
                                            'source': 'daily_fantasy_fuel'
                                        })
                    except:
                        continue

            df = pd.DataFrame(projections)
            self.logger.info(f"Scraped {len(df)} projections from Daily Fantasy Fuel")
            return df

        except Exception as e:
            self.logger.error(f"Error scraping Daily Fantasy Fuel: {e}")
            return pd.DataFrame()

    def scrape_rotowire_optimizer(self) -> pd.DataFrame:
        """Scrape data from RotoWire optimizer"""
        self.logger.info("Scraping RotoWire optimizer data")

        try:
            url = "https://www.rotowire.com/daily/nfl/optimizer.php"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Look for optimizer data
            optimizer_data = []

            # Find player data (customize based on actual structure)
            player_rows = soup.find_all('tr', class_=re.compile('player|projection'))

            for row in player_rows:
                cols = row.find_all('td')
                if len(cols) >= 5:
                    player_info = {
                        'player_name': cols[0].text.strip(),
                        'team': cols[1].text.strip(),
                        'position': cols[2].text.strip(),
                        'projection': float(cols[3].text.strip()) if cols[3].text.strip() else 0,
                        'value_score': float(cols[4].text.strip()) if cols[4].text.strip() else 0,
                        'source': 'rotowire'
                    }
                    optimizer_data.append(player_info)

            df = pd.DataFrame(optimizer_data)
            self.logger.info(f"Scraped {len(df)} players from RotoWire")
            return df

        except Exception as e:
            self.logger.error(f"Error scraping RotoWire: {e}")
            return pd.DataFrame()

    def scrape_stokastic(self) -> pd.DataFrame:
        """Scrape boom/bust data from Stokastic"""
        self.logger.info("Scraping Stokastic boom/bust data")

        try:
            url = "https://www.stokastic.com/nfl/"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Look for boom/bust probability data
            boom_bust_data = []

            # Find probability tables (customize based on actual structure)
            prob_tables = soup.find_all('table', class_=re.compile('probability|boom|bust'))

            for table in prob_tables:
                rows = table.find_all('tr')
                for row in rows[1:]:  # Skip header
                    cols = row.find_all('td')
                    if len(cols) >= 4:
                        prob_data = {
                            'player_name': cols[0].text.strip(),
                            'boom_probability': float(cols[1].text.strip().rstrip('%')) / 100 if cols[1].text.strip() else 0,
                            'bust_probability': float(cols[2].text.strip().rstrip('%')) / 100 if cols[2].text.strip() else 0,
                            'ownership_projection': float(cols[3].text.strip().rstrip('%')) / 100 if cols[3].text.strip() else 0,
                            'source': 'stokastic'
                        }
                        boom_bust_data.append(prob_data)

            df = pd.DataFrame(boom_bust_data)
            self.logger.info(f"Scraped {len(df)} boom/bust records from Stokastic")
            return df

        except Exception as e:
            self.logger.error(f"Error scraping Stokastic: {e}")
            return pd.DataFrame()

    def scrape_reddit_dfs(self, subreddit: str = "dfsports") -> pd.DataFrame:
        """Scrape recent posts from DFS subreddit"""
        self.logger.info(f"Scraping Reddit r/{subreddit}")

        try:
            url = f"https://www.reddit.com/r/{subreddit}/hot/.json?limit=25"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            data = response.json()

            posts = []
            for post in data['data']['children']:
                post_data = post['data']
                posts.append({
                    'title': post_data['title'],
                    'author': post_data['author'],
                    'score': post_data['score'],
                    'num_comments': post_data['num_comments'],
                    'created_utc': datetime.fromtimestamp(post_data['created_utc']),
                    'url': post_data['url'],
                    'selftext': post_data['selftext'][:500] if post_data['selftext'] else '',
                    'source': f'reddit_{subreddit}'
                })

            df = pd.DataFrame(posts)
            self.logger.info(f"Scraped {len(df)} posts from r/{subreddit}")
            return df

        except Exception as e:
            self.logger.error(f"Error scraping Reddit r/{subreddit}: {e}")
            return pd.DataFrame()

    def scrape_weather_data(self) -> pd.DataFrame:
        """Scrape weather data from Weather.com"""
        self.logger.info("Scraping weather data from Weather.com")

        try:
            # This is a simplified example - you'd need to target specific NFL cities
            cities = ['New York', 'Los Angeles', 'Chicago', 'Dallas', 'Miami']
            weather_data = []

            for city in cities:
                try:
                    # Weather.com search URL (this would need to be customized)
                    search_url = f"https://weather.com/weather/today/l/{city.replace(' ', '')}"
                    response = requests.get(search_url, headers=self.headers, timeout=15)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.content, 'html.parser')

                        # Extract weather information (customize based on actual structure)
                        temp_elem = soup.find('span', class_=re.compile('temp|temperature'))
                        condition_elem = soup.find('div', class_=re.compile('condition|weather'))

                        temperature = temp_elem.text.strip() if temp_elem else "N/A"
                        condition = condition_elem.text.strip() if condition_elem else "N/A"

                        weather_data.append({
                            'city': city,
                            'temperature': temperature,
                            'condition': condition,
                            'source': 'weather_com'
                        })

                    time.sleep(1)  # Be respectful to the server

                except Exception as e:
                    self.logger.warning(f"Error scraping weather for {city}: {e}")
                    continue

            df = pd.DataFrame(weather_data)
            self.logger.info(f"Scraped weather data for {len(df)} cities")
            return df

        except Exception as e:
            self.logger.error(f"Error scraping weather data: {e}")
            return pd.DataFrame()

    def scrape_nfl_injuries(self) -> pd.DataFrame:
        """Scrape injury reports from NFL.com"""
        self.logger.info("Scraping NFL injury reports")

        try:
            url = "https://www.nfl.com/injuries/"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            injuries = []

            # Find injury table (customize based on actual structure)
            injury_rows = soup.find_all('tr', class_=re.compile('injury|player'))

            for row in injury_rows:
                cols = row.find_all('td')
                if len(cols) >= 4:
                    injury_data = {
                        'player_name': cols[0].text.strip(),
                        'team': cols[1].text.strip(),
                        'injury': cols[2].text.strip(),
                        'status': cols[3].text.strip(),
                        'source': 'nfl_com'
                    }
                    injuries.append(injury_data)

            df = pd.DataFrame(injuries)
            self.logger.info(f"Scraped {len(df)} injury reports from NFL.com")
            return df

        except Exception as e:
            self.logger.error(f"Error scraping NFL injuries: {e}")
            return pd.DataFrame()

    def scrape_footballguys(self) -> pd.DataFrame:
        """Scrape projections and analysis from FootballGuys"""
        self.logger.info("Scraping FootballGuys projections and analysis")

        try:
            url = "https://www.footballguys.com/"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            fg_data = []

            # Look for projection data and analysis
            # FootballGuys has extensive player analysis and projections
            projection_tables = soup.find_all('table', class_=re.compile('projection|player|analysis'))

            for table in projection_tables:
                rows = table.find_all('tr')
                for row in rows[1:]:  # Skip header
                    cols = row.find_all('td')
                    if len(cols) >= 5:
                        player_data = {
                            'player_name': cols[0].text.strip(),
                            'position': cols[1].text.strip(),
                            'team': cols[2].text.strip(),
                            'projection': float(cols[3].text.strip()) if cols[3].text.strip() else 0,
                            'analysis_score': cols[4].text.strip(),
                            'source': 'footballguys'
                        }
                        fg_data.append(player_data)

            # Also scrape recent articles/analysis
            articles = soup.find_all('article', class_=re.compile('analysis|article'))
            for article in articles[:5]:  # Limit to recent articles
                title_elem = article.find('h2') or article.find('h3')
                link_elem = article.find('a')

                if title_elem and link_elem:
                    fg_data.append({
                        'title': title_elem.text.strip(),
                        'url': link_elem.get('href'),
                        'type': 'analysis',
                        'source': 'footballguys'
                    })

            df = pd.DataFrame(fg_data)
            self.logger.info(f"Scraped {len(df)} items from FootballGuys")
            return df

        except Exception as e:
            self.logger.error(f"Error scraping FootballGuys: {e}")
            return pd.DataFrame()

    def scrape_espn_news(self) -> pd.DataFrame:
        """Scrape player news from ESPN"""
        self.logger.info("Scraping ESPN player news")

        try:
            url = "https://www.espn.com/nfl/"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            news_items = []

            # Find news articles (customize based on actual structure)
            articles = soup.find_all('article', class_=re.compile('news|story'))

            for article in articles[:10]:  # Limit to recent articles
                title_elem = article.find('h2') or article.find('h3')
                link_elem = article.find('a')

                if title_elem and link_elem:
                    news_items.append({
                        'title': title_elem.text.strip(),
                        'url': link_elem.get('href'),
                        'source': 'espn'
                    })

            df = pd.DataFrame(news_items)
            self.logger.info(f"Scraped {len(df)} news items from ESPN")
            return df

        except Exception as e:
            self.logger.error(f"Error scraping ESPN news: {e}")
            return pd.DataFrame()

    def fetch_all_scraping_data(self) -> Dict[str, pd.DataFrame]:
        """Fetch data from all scraping sources"""
        self.logger.info("Starting comprehensive web scraping")

        data = {
            'daily_fantasy_fuel': self.scrape_daily_fantasy_fuel(),
            'rotowire_optimizer': self.scrape_rotowire_optimizer(),
            'stokastic_boom_bust': self.scrape_stokastic(),
            'footballguys': self.scrape_footballguys(),
            'reddit_dfsports': self.scrape_reddit_dfs('dfsports'),
            'reddit_fantasyfootball': self.scrape_reddit_dfs('fantasyfootball'),
            'weather_data': self.scrape_weather_data(),
            'nfl_injuries': self.scrape_nfl_injuries(),
            'espn_news': self.scrape_espn_news()
        }

        # Log summary
        total_records = sum(len(df) for df in data.values() if isinstance(df, pd.DataFrame))
        self.logger.info(f"Total records scraped: {total_records}")

        return data

    def _respectful_scraping_delay(self):
        """Add delay between requests to be respectful to servers"""
        time.sleep(2)  # 2 second delay between requests

    def get_data_quality_report(self, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Generate data quality report for scraped data"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'source': self.source_name,
            'scraping_status': 'completed',
            'data_types': {},
            'quality_metrics': {},
            'disclaimer': 'Scraped data quality may vary based on website changes'
        }

        for data_type, df in data.items():
            if isinstance(df, pd.DataFrame):
                report['data_types'][data_type] = {
                    'record_count': len(df),
                    'column_count': len(df.columns),
                    'columns': list(df.columns),
                    'null_percentage': (df.isnull().sum() / len(df) * 100).mean()
                }

        return report
