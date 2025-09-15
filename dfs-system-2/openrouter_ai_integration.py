#!/usr/bin/env python3
"""
OPENROUTER AI INTEGRATION
Multi-model AI system using free models: DeepSeek, GPT-4o-mini, Gemini Flash + Ollama
"""

import requests
import json
import os
from datetime import datetime
from typing import Dict, List, Any

class OpenRouterAISystem:
    def __init__(self):
        self.api_key = "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"
        self.base_url = "https://openrouter.ai/api/v1"
        self.available_models = self.setup_free_models()
        
    def setup_free_models(self):
        """Setup all free/cheap models available through OpenRouter"""
        models = {
            'deepseek_free': {
                'model_id': 'deepseek/deepseek-r1-distill-llama-70b',
                'cost': 'FREE',
                'strengths': ['Data analysis', 'Pattern recognition', 'Mathematical reasoning'],
                'use_case': 'Primary projection analysis and edge detection'
            },
            'gpt4o_mini': {
                'model_id': 'openai/gpt-4o-mini',
                'cost': 'VERY_CHEAP',
                'strengths': ['Real-time analysis', 'Quick decisions', 'Structured output'],
                'use_case': 'Real-time injury analysis and leverage detection'
            },
            'gemini_flash': {
                'model_id': 'google/gemini-flash-1.5',
                'cost': 'CHEAP',
                'strengths': ['Multi-modal analysis', 'Fast processing', 'Context retention'],
                'use_case': 'Weather and game environment analysis'
            },
            'claude_haiku': {
                'model_id': 'anthropic/claude-3-haiku',
                'cost': 'CHEAP', 
                'strengths': ['Structured reasoning', 'Analytical thinking', 'JSON output'],
                'use_case': 'Ownership and leverage calculation'
            }
        }
        
        print("🤖 AVAILABLE FREE/CHEAP AI MODELS:")
        for model_name, config in models.items():
            print(f"   ✅ {model_name}: {config['cost']} - {config['use_case']}")
        
        return models

    def create_ai_agent_prompts(self):
        """Create specialized prompts for each AI agent"""
        print("\n🧠 AI AGENT PROMPT SYSTEM:")
        
        agent_prompts = {
            'projection_analyst': {
                'model': 'deepseek_free',
                'system_prompt': """You are a DFS projection analyst. Analyze multi-source player projections and detect edges.

INPUTS: Player projections from multiple sources (RotoWire, DraftKings, FantasyPros, Stokastic)
OUTPUT FORMAT: JSON with edge_ratio, leverage_score, confidence, recommendation

RULES:
- Edge ratio >= 2.0 = HIGH LEVERAGE  
- Edge ratio >= 5.0 = EXTREME LEVERAGE
- Consider ownership, ceiling, game environment
- Flag projection discrepancies >50% between sources
- Weight by source historical accuracy""",
                'sample_input': {
                    'player': 'A.J. Brown',
                    'projections': {'rotowire': 18.9, 'draftkings': 1.8, 'fantasypros': 14.2},
                    'ownership': 8.4,
                    'ceiling': 32.1,
                    'game_total': 54.5
                }
            },
            'injury_monitor': {
                'model': 'gpt4o_mini',
                'system_prompt': """You are a real-time DFS injury monitor. Process breaking injury news and calculate impacts.

INPUTS: Injury reports, practice participation, insider tweets
OUTPUT FORMAT: JSON with status, impact_level, affected_players, recommendations

RULES:
- OUT = Remove player + boost teammates
- DOUBTFUL = 75% projection penalty
- QUESTIONABLE = 25% projection penalty  
- Calculate replacement player boost percentages
- Identify leverage opportunities from injuries""",
                'response_time': 'Under 60 seconds'
            },
            'leverage_hunter': {
                'model': 'claude_haiku',
                'system_prompt': """You are an extreme leverage detector. Find tournament-winning opportunities.

INPUTS: Multi-source data (projections, ownership, game environment)
OUTPUT FORMAT: JSON with leverage_score, reasoning, confidence, recommendation

LEVERAGE FORMULA: (ceiling_projection / ownership_percentage) * game_environment_multiplier

THRESHOLDS:
- Score >= 25 = EXTREME LEVERAGE (tournament winner potential)
- Score >= 15 = HIGH LEVERAGE (strong GPP play)
- Score >= 10 = MEDIUM LEVERAGE (consider)""",
                'specialization': 'Tournament leverage optimization'
            },
            'weather_analyst': {
                'model': 'gemini_flash',
                'system_prompt': """You are a weather impact analyst for DFS. Analyze stadium conditions.

INPUTS: Weather data, stadium info, game time forecasts
OUTPUT FORMAT: JSON with impact_scores, affected_players, recommendations

IMPACT RULES:
- Wind >15 mph = -2 pts passing, +1 pt rushing
- Rain/Snow = -3 pts passing, +2 pts rushing
- Temperature <32°F = -1 pt all players
- Dome games = No weather impact""",
                'precision': 'Stadium-level microclimate analysis'
            }
        }
        
        for agent_name, config in agent_prompts.items():
            print(f"   🎯 {agent_name} ({config['model']}):")
            print(f"      Specialization: {config.get('specialization', 'General analysis')}")
            print(f"      Response Time: {config.get('response_time', 'Standard')}")
        
        return agent_prompts

    def create_openrouter_client(self):
        """Create OpenRouter API client for multi-model access"""
        print("\n🔑 OPENROUTER API CLIENT SETUP:")
        
        client_code = """
import openai
import os

class OpenRouterClient:
    def __init__(self):
        self.client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv('OPENROUTER_API_KEY', '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')
        )
        
    def analyze_projections(self, player_data):
        response = self.client.chat.completions.create(
            model="deepseek/deepseek-r1-distill-llama-70b",  # FREE
            messages=[
                {"role": "system", "content": "DFS projection analyst"},
                {"role": "user", "content": f"Analyze: {json.dumps(player_data)}"}
            ],
            temperature=0.1
        )
        return json.loads(response.choices[0].message.content)
    
    def monitor_injuries(self, injury_data):
        response = self.client.chat.completions.create(
            model="openai/gpt-4o-mini",  # VERY CHEAP
            messages=[
                {"role": "system", "content": "Real-time DFS injury monitor"},
                {"role": "user", "content": f"Process: {json.dumps(injury_data)}"}
            ],
            temperature=0.1
        )
        return json.loads(response.choices[0].message.content)
    
    def detect_leverage(self, market_data):
        response = self.client.chat.completions.create(
            model="google/gemini-flash-1.5",  # CHEAP
            messages=[
                {"role": "system", "content": "Extreme leverage detector"},
                {"role": "user", "content": f"Find leverage: {json.dumps(market_data)}"}
            ],
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)
"""
        
        # Save the client code
        with open('openrouter_client.py', 'w') as f:
            f.write(client_code)
        
        print("✅ OpenRouter client created: openrouter_client.py")
        return client_code

    def update_docker_configuration(self):
        """Update Docker configuration for complete AI integration"""
        print("\n🐳 UPDATING DOCKER CONFIGURATION:")
        
        # Enhanced Dockerfile with AI models + MCPs
        enhanced_dockerfile = """FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    curl \\
    git \\
    nodejs \\
    npm \\
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install additional AI dependencies
RUN pip install --no-cache-dir \\
    openai \\
    ollama \\
    anthropic \\
    google-generativeai \\
    langchain \\
    langchain-openai

# Install MCP servers
RUN npm install -g \\
    @modelcontextprotocol/server-brave-search \\
    @modelcontextprotocol/server-filesystem \\
    @modelcontextprotocol/server-memory \\
    @modelcontextprotocol/server-sequential-thinking \\
    @hisma/server-puppeteer

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p /app/data /app/logs /app/uploads

# Set environment variables
ENV OPENROUTER_API_KEY=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
ENV PYTHONPATH=/app
ENV NODE_PATH=/usr/local/lib/node_modules

# Expose ports
EXPOSE 8000 3000 11434

# Initialize Ollama and download models
RUN ollama serve & \\
    sleep 10 && \\
    ollama pull llama3.2:1b && \\
    ollama pull phi3:mini && \\
    ollama pull qwen2:0.5b

# Start script
COPY start_all_services.sh /app/
RUN chmod +x /app/start_all_services.sh

CMD ["./start_all_services.sh"]
"""
        
        # Enhanced docker-compose with all services
        docker_compose = """version: '3.8'

services:
  dfs-optimizer:
    build: .
    ports:
      - "8000:8000"    # Main API
      - "3000:3000"    # Dashboard
      - "11434:11434"  # Ollama
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    environment:
      - OPENROUTER_API_KEY=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
      - NODE_ENV=production
      - PYTHONPATH=/app
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ROTOWIRE_LIVE_WEEKLY_DASHBOARD.html:/usr/share/nginx/html/index.html
    depends_on:
      - dfs-optimizer
    restart: unless-stopped

volumes:
  dfs_data:
  dfs_logs:
"""

        # Startup script for all services
        startup_script = """#!/bin/bash
echo "🚀 Starting Complete DFS Platform with AI..."

# Start Ollama in background
ollama serve &
OLLAMA_PID=$!
echo "🤖 Ollama started (PID: $OLLAMA_PID)"

# Wait for Ollama to be ready
sleep 5

# Start MCP servers
echo "🔗 Starting MCP servers..."
npx @modelcontextprotocol/server-brave-search &
npx @modelcontextprotocol/server-memory &
npx @hisma/server-puppeteer &

# Start main DFS backend
echo "🔧 Starting DFS backend..."
python3 complete_backend_integration.py &
BACKEND_PID=$!

# Start dashboard server
echo "🖥️  Starting dashboard..."
python3 -m http.server 3000 &

echo "✅ Complete DFS Platform with AI is running!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔧 API: http://localhost:8000"
echo "🤖 Ollama: http://localhost:11434"

# Keep all services running
wait
"""
        
        # Save all Docker files
        with open('Dockerfile', 'w') as f:
            f.write(enhanced_dockerfile)
        
        with open('docker-compose.yml', 'w') as f:
            f.write(docker_compose)
            
        with open('start_all_services.sh', 'w') as f:
            f.write(startup_script)
        
        # Make startup script executable
        os.chmod('start_all_services.sh', 0o755)
        
        print("✅ Enhanced Docker configuration created:")
        print("   📦 Dockerfile - With Ollama + MCPs + AI models")
        print("   🐳 docker-compose.yml - Complete service orchestration")
        print("   🚀 start_all_services.sh - Multi-service startup")

    def create_multi_model_ai_engine(self):
        """Create multi-model AI engine for DFS analysis"""
        print("\n🧠 MULTI-MODEL AI ENGINE:")
        
        ai_engine_code = """
import openai
import ollama
import json
from concurrent.futures import ThreadPoolExecutor
import asyncio

class MultiModelDFSEngine:
    def __init__(self):
        self.openrouter_client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv('OPENROUTER_API_KEY')
        )
        self.models = {
            'projection_analyst': 'deepseek/deepseek-r1-distill-llama-70b',  # FREE
            'injury_monitor': 'openai/gpt-4o-mini',                          # VERY CHEAP
            'leverage_hunter': 'anthropic/claude-3-haiku',                   # CHEAP
            'weather_analyst': 'google/gemini-flash-1.5',                    # CHEAP
            'local_backup': 'llama3.2:1b'                                    # LOCAL OLLAMA
        }
    
    async def analyze_player_projections(self, player_data):
        '''DeepSeek FREE - Projection analysis'''
        prompt = f'''
        Analyze DFS projections for extreme leverage:
        
        Player Data: {json.dumps(player_data)}
        
        Calculate:
        1. Projection edge ratio (highest/lowest source)
        2. Leverage score (ceiling/ownership * game_total/50)  
        3. Confidence level based on source agreement
        4. Tournament recommendation
        
        Return JSON with edge_ratio, leverage_score, confidence, recommendation
        '''
        
        response = await self.openrouter_client.chat.completions.create(
            model=self.models['projection_analyst'],
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=500
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def monitor_injury_impact(self, injury_data):
        '''GPT-4o-mini VERY CHEAP - Injury analysis'''
        prompt = f'''
        Analyze injury impact for DFS:
        
        Injury Data: {json.dumps(injury_data)}
        
        Determine:
        1. Player status certainty
        2. Teammate boost percentages
        3. Leverage opportunities created
        4. Immediate lineup adjustments needed
        
        Return JSON with status, teammate_boosts, leverage_created, actions
        '''
        
        response = await self.openrouter_client.chat.completions.create(
            model=self.models['injury_monitor'],
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=400
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def detect_extreme_leverage(self, market_data):
        '''Claude Haiku CHEAP - Leverage detection'''
        prompt = f'''
        Hunt for extreme DFS leverage opportunities:
        
        Market Data: {json.dumps(market_data)}
        
        Find players with:
        1. Low ownership (<10%) + High ceiling (>25 pts)
        2. Projection edges >2x between sources
        3. Game environment boost (high totals, pace)
        4. Injury-created opportunities
        
        Return JSON with extreme_leverage_plays, reasoning, confidence_scores
        '''
        
        response = await self.openrouter_client.chat.completions.create(
            model=self.models['leverage_hunter'],
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=600
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def analyze_weather_impact(self, weather_data):
        '''Gemini Flash CHEAP - Weather analysis'''
        prompt = f'''
        Analyze weather impact on DFS players:
        
        Weather Data: {json.dumps(weather_data)}
        
        Calculate impact adjustments:
        1. Wind effect on passing/kicking
        2. Precipitation effect on game script
        3. Temperature impact on player performance
        4. Stadium-specific factors
        
        Return JSON with player_adjustments, game_script_changes, confidence
        '''
        
        response = await self.openrouter_client.chat.completions.create(
            model=self.models['weather_analyst'], 
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=400
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def local_ollama_backup(self, data, analysis_type):
        '''Local Ollama model for offline backup'''
        try:
            response = ollama.chat(
                model='llama3.2:1b',
                messages=[{
                    'role': 'user', 
                    'content': f'Analyze {analysis_type}: {json.dumps(data)}'
                }]
            )
            return response['message']['content']
        except Exception as e:
            return {"error": f"Ollama backup failed: {e}"}
    
    async def run_complete_analysis(self, slate_data):
        '''Run complete multi-model analysis'''
        print("🧠 Running multi-model DFS analysis...")
        
        # Parallel analysis using all models
        with ThreadPoolExecutor(max_workers=4) as executor:
            tasks = [
                self.analyze_player_projections(slate_data.get('projections', {})),
                self.monitor_injury_impact(slate_data.get('injuries', {})),
                self.detect_extreme_leverage(slate_data.get('market_data', {})),
                self.analyze_weather_impact(slate_data.get('weather', {}))
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            'projection_analysis': results[0],
            'injury_analysis': results[1], 
            'leverage_analysis': results[2],
            'weather_analysis': results[3],
            'analysis_timestamp': datetime.now().isoformat()
        }

# Usage example
async def main():
    engine = MultiModelDFSEngine()
    
    sample_data = {
        'projections': {'A.J. Brown': {'rw': 18.9, 'dk': 1.8, 'own': 8.4}},
        'injuries': {'Travis Kelce': {'status': 'OUT', 'game': 'KC@PHI'}},
        'market_data': {'total': 54.5, 'ownership_trends': {}},
        'weather': {'stadium': 'Lincoln Financial', 'conditions': 'Dome'}
    }
    
    results = await engine.run_complete_analysis(sample_data)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
"""
        
        with open('multi_model_ai_engine.py', 'w') as f:
            f.write(ai_engine_code)
        
        print("✅ Multi-model AI engine created: multi_model_ai_engine.py")
        return ai_engine_code

    def create_requirements_txt(self):
        """Create comprehensive requirements.txt for Docker"""
        requirements = """# Core DFS Platform
flask==2.3.3
flask-cors==4.0.0
requests==2.31.0
pandas==2.0.3
numpy==1.25.2
scipy==1.11.2

# AI Integration  
openai==1.3.5
ollama==0.1.7
anthropic==0.7.7
google-generativeai==0.3.1
langchain==0.0.335
langchain-openai==0.0.2

# DFS Optimization
pydfs-lineup-optimizer==3.14.0
pulp==2.7.0
ortools==9.7.2996

# Data Processing
beautifulsoup4==4.12.2
selenium==4.15.2
lxml==4.9.3
python-dateutil==2.8.2

# Web Scraping & APIs
aiohttp==3.8.6
asyncio-throttle==1.0.2
fake-useragent==1.4.0

# Database & Storage
sqlite3
redis==5.0.1
pymongo==4.5.0

# Development & Testing
pytest==7.4.3
pytest-asyncio==0.21.1
black==23.9.1
flake8==6.1.0

# Docker & Deployment
gunicorn==21.2.0
uvicorn==0.24.0
fastapi==0.104.1

# MCP Integration
websockets==11.0.3
jsonschema==4.19.2
typing-extensions==4.8.0
"""
        
        with open('requirements.txt', 'w') as f:
            f.write(requirements)
        
        print("✅ Enhanced requirements.txt created with AI dependencies")

def main():
    print("🤖 OPENROUTER AI INTEGRATION")
    print("Multi-model AI system with free models + Docker + MCPs")
    print("=" * 60)
    
    # Initialize OpenRouter system
    ai_system = OpenRouterAISystem()
    
    # Create agent prompts
    prompts = ai_system.create_ai_agent_prompts()
    
    # Create OpenRouter client
    client = ai_system.create_openrouter_client()
    
    # Update Docker configuration
    ai_system.update_docker_configuration()
    
    # Create requirements
    ai_system.create_requirements_txt()
    
    print(f"\n🎊 OPENROUTER AI INTEGRATION COMPLETE!")
    print(f"✅ Multi-model system: DeepSeek (FREE) + GPT-4o-mini + Gemini Flash + Claude Haiku")
    print(f"✅ Docker container: Enhanced with Ollama + MCPs + AI models")
    print(f"✅ API integration: OpenRouter client with your key")
    print(f"✅ Local backup: Ollama models for offline operation")
    print(f"✅ MCP servers: All installed in container")
    
    print(f"\n🐳 DOCKER DEPLOYMENT:")
    print(f"   docker-compose up --build")
    print(f"   → Starts complete platform with AI models")
    print(f"   → Dashboard: http://localhost:3000")
    print(f"   → API: http://localhost:8000") 
    print(f"   → Ollama: http://localhost:11434")
    
    print(f"\n🤖 AI MODELS READY:")
    print(f"   🆓 DeepSeek (FREE) - Projection analysis")
    print(f"   💰 GPT-4o-mini (VERY CHEAP) - Injury monitoring") 
    print(f"   💰 Gemini Flash (CHEAP) - Weather analysis")
    print(f"   💰 Claude Haiku (CHEAP) - Leverage detection")
    print(f"   📱 Ollama Local - Offline backup models")
    
    return True

if __name__ == "__main__":
    main()
