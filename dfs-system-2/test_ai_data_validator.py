#!/usr/bin/env python3
"""
Test script for AI Data Validator - Validates all data sources and scores players
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from ai.data_validator import get_data_validator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_test_players():
    """Load test player data for scoring"""
    return [
        {
            'id': 'test_player_1',
            'name': 'Josh Allen',
            'position': 'QB',
            'team': 'BUF',
            'salary': 8500,
            'projection': 24.5,
            'ownership': 22.5,
            'consensus_projection': 24.8,
            'rg_ownership': 23.1,
            'leverage_score': 2.1,
            'boom_pct': 28,
            'floor': 18.2,
            'ceiling': 31.4,
            'correlation_score': 0.7,
            'volatility': 0.15,
            'sources_count': 7
        },
        {
            'id': 'test_player_2',
            'name': 'Christian McCaffrey',
            'position': 'RB',
            'team': 'SF',
            'salary': 9200,
            'projection': 22.1,
            'ownership': 35.2,
            'consensus_projection': 22.4,
            'rg_ownership': 34.8,
            'leverage_score': 1.8,
            'boom_pct': 22,
            'floor': 16.8,
            'ceiling': 27.9,
            'correlation_score': 0.8,
            'volatility': 0.12,
            'sources_count': 6
        },
        {
            'id': 'test_player_3',
            'name': 'Tyreek Hill',
            'position': 'WR',
            'team': 'MIA',
            'salary': 7800,
            'projection': 18.7,
            'ownership': 28.4,
            'consensus_projection': 19.1,
            'rg_ownership': 27.9,
            'leverage_score': 2.3,
            'boom_pct': 32,
            'floor': 13.2,
            'ceiling': 25.8,
            'correlation_score': 0.6,
            'volatility': 0.18,
            'sources_count': 8
        },
        {
            'id': 'test_player_4',
            'name': 'Travis Kelce',
            'position': 'TE',
            'team': 'KC',
            'salary': 6200,
            'projection': 14.3,
            'ownership': 18.7,
            'consensus_projection': 14.8,
            'rg_ownership': 19.2,
            'leverage_score': 1.9,
            'boom_pct': 25,
            'floor': 10.1,
            'ceiling': 19.2,
            'correlation_score': 0.5,
            'volatility': 0.14,
            'sources_count': 5
        },
        {
            'id': 'test_player_5',
            'name': 'Buffalo Bills',
            'position': 'DST',
            'team': 'BUF',
            'salary': 3800,
            'projection': 11.2,
            'ownership': 12.3,
            'consensus_projection': 11.8,
            'rg_ownership': 13.1,
            'leverage_score': 2.4,
            'boom_pct': 35,
            'floor': 7.8,
            'ceiling': 15.6,
            'correlation_score': 0.4,
            'volatility': 0.22,
            'sources_count': 4
        }
    ]

async def test_data_source_validation():
    """Test data source validation"""
    logger.info("🧪 Testing Data Source Validation...")

    # Load API keys from environment
    api_keys = {
        'fantasynerds': os.getenv('FANTASYNERDS_API_KEY', ''),
        'sportsdataio': os.getenv('SPORTSDATAIO_API_KEY', ''),
        'the_odds_api': os.getenv('THE_ODDS_API_KEY', ''),
        'openweather': os.getenv('OPENWEATHER_API_KEY', ''),
        'weatherapi': os.getenv('WEATHERAPI_KEY', ''),
    }

    # Initialize validator
    validator = get_data_validator(api_keys)

    try:
        # Validate all sources
        logger.info("🔍 Validating all data sources...")
        source_scores = await validator.validate_all_sources()

        # Print results
        print("\n" + "="*80)
        print("📊 DATA SOURCE VALIDATION RESULTS")
        print("="*80)

        total_sources = len(source_scores)
        healthy_sources = sum(1 for score in source_scores.values() if score.overall_score >= 70)

        print(f"📈 Total Sources: {total_sources}")
        print(f"✅ Healthy Sources: {healthy_sources}")
        print(f"📊 Average Score: {(sum(score.overall_score for score in source_scores.values()) / total_sources):.1f}")
        print(f"⚡ Average Response Time: {(sum(score.response_time for score in source_scores.values()) / total_sources):.2f}s")

        print("\n" + "-"*80)
        print("📋 INDIVIDUAL SOURCE SCORES")
        print("-"*80)

        for source_name, score in source_scores.items():
            status_icon = "✅" if score.overall_score >= 70 else "❌" if score.overall_score < 50 else "⚠️"
            print("6.1f"
                  "2.2f"
                  f"  📊 {score.data_points} points")

        # Get health report
        health_report = validator.get_source_health_report()
        print(f"\n🏆 Top Performing Sources: {len(validator.get_top_performing_sources(3))}")

        return source_scores

    except Exception as e:
        logger.error(f"❌ Data source validation failed: {e}")
        return {}

async def test_player_scoring(source_scores):
    """Test AI player scoring"""
    logger.info("🤖 Testing AI Player Scoring...")

    # Load test players
    test_players = load_test_players()

    # Get validator
    api_keys = {
        'fantasynerds': os.getenv('FANTASYNERDS_API_KEY', ''),
        'sportsdataio': os.getenv('SPORTSDATAIO_API_KEY', ''),
        'the_odds_api': os.getenv('THE_ODDS_API_KEY', ''),
        'openweather': os.getenv('OPENWEATHER_API_KEY', ''),
        'weatherapi': os.getenv('WEATHERAPI_KEY', ''),
    }
    validator = get_data_validator(api_keys)

    try:
        # Score players
        logger.info(f"🎯 Scoring {len(test_players)} test players...")
        player_scores = await validator.score_players_good_day(test_players, 'NFL')

        # Print results
        print("\n" + "="*80)
        print("🎯 AI PLAYER SCORING RESULTS")
        print("="*80)

        # Get summary
        summary = validator.get_player_score_summary()
        print(f"📈 Total Players Scored: {summary['total_players']}")
        print(f"📊 Average Score: {summary.get('avg_score', 0):.1f}")
        print(f"🎯 High Confidence Predictions: {summary['high_confidence']}")
        print(f"📈 High Confidence Rate: {summary.get('high_confidence_rate', 0):.1f}%")

        print("\n" + "-"*80)
        print("🏆 TOP AI RECOMMENDATIONS")
        print("-"*80)

        sorted_scores = sorted(player_scores.values(), key=lambda x: x.good_day_score, reverse=True)
        for i, score in enumerate(sorted_scores[:5], 1):
            confidence_icon = "🎯" if score.confidence_level == "High" else "⚠️" if score.confidence_level == "Medium" else "❓"
            trend_icon = "📈" if score.trend_direction == "Up" else "📉" if score.trend_direction == "Down" else "➡️"
            print(f"{i}. {score.player_name}")
            print(".1f"
                  f"   {confidence_icon} {score.confidence_level} confidence")
            print(f"   {trend_icon} Trend: {score.trend_direction}")
            print(f"   🎲 Volatility: {score.volatility_score:.1f}/100")
            print(f"   📊 Sources used: {score.data_sources_used}")
            if score.key_factors:
                print(f"   ✅ Key factors: {', '.join(score.key_factors[:2])}")
            if score.risk_factors:
                print(f"   ⚠️  Risk factors: {', '.join(score.risk_factors[:2])}")
            print()

        print("-"*80)
        print("📋 ALL PLAYER SCORES")
        print("-"*80)

        for score in sorted_scores:
            confidence_color = "🟢" if score.confidence_level == "High" else "🟡" if score.confidence_level == "Medium" else "🔴"
            print("6.1f"
                  f"  {confidence_color} {score.confidence_level}")

        return player_scores

    except Exception as e:
        logger.error(f"❌ Player scoring failed: {e}")
        return {}

async def test_ai_insights_api():
    """Test AI insights API endpoint"""
    logger.info("🔗 Testing AI Insights API...")

    try:
        # Test health endpoint
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:8001/health') as response:
                if response.status == 200:
                    health_data = await response.json()
                    print("\n✅ AI Validator API Health Check:")
                    print(f"   Status: {health_data['status']}")
                    print(f"   Initialized: {health_data['validator_initialized']}")
                    print(f"   API Keys Configured: {health_data['api_keys_configured']}")
                else:
                    print(f"❌ API health check failed: HTTP {response.status}")

        # Test source health endpoint
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:8001/source-health') as response:
                if response.status == 200:
                    health_data = await response.json()
                    print("\n✅ Source Health API:")
                    print(f"   Total Sources: {health_data['health_report']['total_sources']}")
                    print(f"   Healthy Sources: {health_data['health_report']['healthy_sources']}")
                    print(f"   Health Rate: {health_data['health_report'].get('health_rate', 0):.1f}%")
                else:
                    print(f"❌ Source health API failed: HTTP {response.status}")

    except Exception as e:
        print(f"❌ API testing failed: {e}")

async def main():
    """Main test function"""
    print("🚀 AI Data Validator Comprehensive Test")
    print("="*50)

    # Test 1: Data Source Validation
    source_scores = await test_data_source_validation()

    if not source_scores:
        print("❌ Data source validation failed, skipping player scoring...")
        return

    # Test 2: Player Scoring
    player_scores = await test_player_scoring(source_scores)

    if not player_scores:
        print("❌ Player scoring failed...")
        return

    # Test 3: API Endpoints
    await test_ai_insights_api()

    # Final Summary
    print("\n" + "="*80)
    print("🎉 AI DATA VALIDATOR TEST COMPLETE")
    print("="*80)

    total_sources = len(source_scores)
    healthy_sources = sum(1 for score in source_scores.values() if score.overall_score >= 70)
    total_players = len(player_scores)
    high_conf_players = sum(1 for score in player_scores.values() if score.confidence_level == 'High')

    print("📊 FINAL RESULTS:")
    print(f"   • Data Sources: {healthy_sources}/{total_sources} healthy ({(healthy_sources/total_sources*100):.1f}%)")
    print(f"   • Player Scoring: {total_players} players scored")
    print(f"   • High Confidence: {high_conf_players}/{total_players} predictions ({(high_conf_players/total_players*100):.1f}%)")

    if healthy_sources >= total_sources * 0.6 and high_conf_players >= total_players * 0.4:
        print("\n🎯 STATUS: ✅ AI VALIDATOR FULLY OPERATIONAL")
        print("   Ready for production use with comprehensive data validation and AI scoring!")
    else:
        print("\n⚠️  STATUS: PARTIAL SUCCESS")
        print("   AI validator is working but may need API key configuration for full functionality.")

    print(f"\n⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    # Run the test
    asyncio.run(main())
