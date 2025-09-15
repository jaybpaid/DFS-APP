#!/usr/bin/env python3
"""
Test script for LLM integration with enhanced error handling.
This script tests the LLM integration with mock data to ensure it handles
various error scenarios properly.
"""

import asyncio
import os
from src.ai.llm_integration import LLMIntegration

async def test_llm_integration():
    """Test the LLM integration with mock player data"""
    print("Testing LLM Integration...")
    
    # Create LLM integration instance
    llm = LLMIntegration()
    
    # Check available providers
    available_providers = llm.get_available_providers()
    print(f"Available AI Providers: {available_providers}")
    
    # Mock player data for testing
    mock_players = [
        {"name": "Patrick Mahomes", "position": "QB", "team": "KC", "salary": 7500, "projection": 25.5, "value": 3.4},
        {"name": "Travis Kelce", "position": "TE", "team": "KC", "salary": 7000, "projection": 18.2, "value": 2.6},
        {"name": "Tyreek Hill", "position": "WR", "team": "MIA", "salary": 8500, "projection": 22.8, "value": 2.7},
        {"name": "Christian McCaffrey", "position": "RB", "team": "SF", "salary": 9000, "projection": 24.3, "value": 2.7},
        {"name": "Justin Jefferson", "position": "WR", "team": "MIN", "salary": 8200, "projection": 20.1, "value": 2.45}
    ]
    
    slate_info = {
        "salary_cap": 50000,
        "sport": "NFL",
        "slate_type": "main"
    }
    
    print("\n1. Testing Player Pool Analysis...")
    try:
        analysis = await llm.analyze_player_pool(mock_players, "NFL", slate_info)
        print(f"Analysis Provider: {analysis.get('provider', 'unknown')}")
        print(f"Player Count: {analysis.get('player_count', 0)}")
        print("Analysis completed successfully")
        if analysis.get('provider') == 'fallback':
            print("Using fallback analysis (no AI providers available)")
    except Exception as e:
        print(f"Error in player pool analysis: {e}")
    
    print("\n2. Testing Player Insights...")
    try:
        insights = await llm.get_player_insights("Patrick Mahomes", "NFL")
        print(f"Insights Provider: {insights.get('provider', 'unknown')}")
        if 'error' in insights:
            print(f"Error: {insights['error']}")
        else:
            print("Player insights completed successfully")
    except Exception as e:
        print(f"Error in player insights: {e}")
    
    print("\n3. Testing Optimization Strategy...")
    try:
        constraints = {
            "max_lineups": 20,
            "exposure_limits": {"Patrick Mahomes": 0.3, "Travis Kelce": 0.4},
            "stack_rules": ["QB-WR", "QB-TE"]
        }
        strategy = await llm.optimize_with_ai(mock_players, constraints, "NFL")
        print(f"Strategy Provider: {strategy.get('provider', 'unknown')}")
        if 'error' in strategy:
            print(f"Error: {strategy['error']}")
        else:
            print("Optimization strategy completed successfully")
    except Exception as e:
        print(f"Error in optimization strategy: {e}")
    
    print("\n4. Testing Provider Status...")
    status = llm.check_provider_status()
    print("Provider Status:")
    for provider, enabled in status.items():
        print(f"  {provider}: {'Enabled' if enabled else 'Disabled'}")
    
    print("\nTest completed.")

if __name__ == "__main__":
    # Load environment variables from .env file
    from dotenv import load_dotenv
    load_dotenv()
    
    asyncio.run(test_llm_integration())
