#!/usr/bin/env python3
"""
Test script for LLM Integration
"""
import asyncio
import os
import sys # Import sys module
from dotenv import load_dotenv
from src.ai.llm_integration import LLMIntegration

# Load environment variables from .env file
load_dotenv()

async def test_llm():
    """Test the LLM integration"""
    llm = LLMIntegration()

    print("Available providers:", llm.get_available_providers())
    sys.stdout.flush() # Flush output
    print("Provider status:", llm.check_provider_status())
    sys.stdout.flush() # Flush output

    # Test with sample players
    sample_players = [
        {"name": "Josh Allen", "position": "QB", "team": "BUF", "salary": 8000, "projection": 20.5, "value": 3.2},
        {"name": "Christian McCaffrey", "position": "RB", "team": "SF", "salary": 9500, "projection": 18.0, "value": 1.9},
        {"name": "CeeDee Lamb", "position": "WR", "team": "DAL", "salary": 8500, "projection": 16.5, "value": 1.9},
        {"name": "Stefon Diggs", "position": "WR", "team": "BUF", "salary": 7500, "projection": 14.0, "value": 1.9},
        {"name": "George Kittle", "position": "TE", "team": "SF", "salary": 6000, "projection": 12.0, "value": 2.0}
    ]

    slate_info = {
        "salary_cap": 50000,
        "sport": "NFL"
    }

    print("\nTesting AI analysis...")
    sys.stdout.flush() # Flush output
    try:
        analysis = await llm.analyze_player_pool(sample_players, "NFL", slate_info)
        print("Analysis result:")
        sys.stdout.flush() # Flush output
        print("Provider:", analysis.get("provider", "fallback"))
        sys.stdout.flush() # Flush output
        print("Sport:", analysis.get("sport", "unknown"))
        sys.stdout.flush() # Flush output
        print("Player count:", analysis.get("player_count", 0))
        sys.stdout.flush() # Flush output
        print("Analysis preview:", analysis.get("analysis", "No analysis")[:200] + "...")
        sys.stdout.flush() # Flush output
    except Exception as e:
        print(f"Analysis failed: {e}")
        sys.stdout.flush() # Flush output
        sys.exit(1) # Exit with error code

    print("\nTesting player insights...")
    sys.stdout.flush() # Flush output
    try:
        insights = await llm.get_player_insights("Josh Allen", "NFL")
        print("Insights result:")
        sys.stdout.flush() # Flush output
        print("Provider:", insights.get("provider", "fallback"))
        sys.stdout.flush() # Flush output
        print("Player:", insights.get("player", "unknown"))
        sys.stdout.flush() # Flush output
        if "insights" in insights:
            print("Insights preview:", insights["insights"][:100] + "...")
            sys.stdout.flush() # Flush output
        else:
            print("No insights:", insights)
            sys.stdout.flush() # Flush output
    except Exception as e:
        print(f"Insights failed: {e}")
        sys.stdout.flush() # Flush output
        sys.exit(1) # Exit with error code

    sys.exit(0) # Exit successfully

if __name__ == "__main__":
    asyncio.run(test_llm())
