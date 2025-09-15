#!/usr/bin/env python3
"""
Advanced AI Analysis Demo
Showcases AI-powered optimization, ROI analysis, boom/bust identification, breakout detection, and contrarian plays
"""

import asyncio
import json
from datetime import datetime
from src.ai.advanced_ai_analyzer import AdvancedAIAnalyzer
from src.ai.llm_integration import LLMIntegration

# Sample NFL player data for demonstration
SAMPLE_NFL_PLAYERS = [
    {
        "name": "Josh Allen",
        "position": "QB",
        "team": "BUF",
        "salary": 8500,
        "projection": 24.5,
        "value": 0.35,
        "ownership": 28.5,
        "volatility": 0.25,
        "matchup_rating": 8,
        "recent_form": 0.8,
        "usage_trend": "increasing",
        "leverage": 0.7
    },
    {
        "name": "Patrick Mahomes",
        "position": "QB",
        "team": "KC",
        "salary": 8200,
        "projection": 23.8,
        "value": 0.32,
        "ownership": 32.1,
        "volatility": 0.22,
        "matchup_rating": 7,
        "recent_form": 0.6,
        "usage_trend": "stable",
        "leverage": 0.6
    },
    {
        "name": "Christian McCaffrey",
        "position": "RB",
        "team": "SF",
        "salary": 9500,
        "projection": 18.2,
        "value": 0.28,
        "ownership": 35.2,
        "volatility": 0.18,
        "matchup_rating": 6,
        "recent_form": 0.4,
        "usage_trend": "stable",
        "leverage": 0.5
    },
    {
        "name": "Austin Ekeler",
        "position": "RB",
        "team": "LAC",
        "salary": 7800,
        "projection": 16.8,
        "value": 0.31,
        "ownership": 22.3,
        "volatility": 0.28,
        "matchup_rating": 9,
        "recent_form": 0.9,
        "usage_trend": "increasing",
        "leverage": 0.8
    },
    {
        "name": "Davante Adams",
        "position": "WR",
        "team": "LV",
        "salary": 8200,
        "projection": 15.6,
        "value": 0.29,
        "ownership": 18.7,
        "volatility": 0.32,
        "matchup_rating": 8,
        "recent_form": 0.7,
        "usage_trend": "increasing",
        "leverage": 0.9
    },
    {
        "name": "Tyreek Hill",
        "position": "WR",
        "team": "MIA",
        "salary": 7900,
        "projection": 15.2,
        "value": 0.30,
        "ownership": 25.4,
        "volatility": 0.35,
        "matchup_rating": 7,
        "recent_form": 0.5,
        "usage_trend": "stable",
        "leverage": 0.7
    },
    {
        "name": "Stefon Diggs",
        "position": "WR",
        "team": "BUF",
        "salary": 7500,
        "projection": 14.8,
        "value": 0.32,
        "ownership": 15.2,
        "volatility": 0.30,
        "matchup_rating": 8,
        "recent_form": 0.8,
        "usage_trend": "increasing",
        "leverage": 0.8
    },
    {
        "name": "Travis Kelce",
        "position": "TE",
        "team": "KC",
        "salary": 6800,
        "projection": 12.4,
        "value": 0.34,
        "ownership": 30.1,
        "volatility": 0.20,
        "matchup_rating": 7,
        "recent_form": 0.6,
        "usage_trend": "stable",
        "leverage": 0.6
    },
    {
        "name": "Dalton Schultz",
        "position": "TE",
        "team": "HOU",
        "salary": 4500,
        "projection": 9.2,
        "value": 0.42,
        "ownership": 8.3,
        "volatility": 0.40,
        "matchup_rating": 6,
        "recent_form": 0.3,
        "usage_trend": "increasing",
        "leverage": 0.9
    },
    {
        "name": "Justin Tucker",
        "position": "K",
        "team": "BAL",
        "salary": 4800,
        "projection": 8.8,
        "value": 0.38,
        "ownership": 12.1,
        "volatility": 0.15,
        "matchup_rating": 5,
        "recent_form": 0.4,
        "usage_trend": "stable",
        "leverage": 0.4
    }
]

# Sample NBA player data
SAMPLE_NBA_PLAYERS = [
    {
        "name": "Nikola Jokic",
        "position": "C",
        "team": "DEN",
        "salary": 11900,
        "projection": 55.2,
        "value": 0.32,
        "ownership": 28.5,
        "volatility": 0.22,
        "matchup_rating": 8,
        "recent_form": 0.9,
        "usage_trend": "increasing",
        "leverage": 0.7
    },
    {
        "name": "Luka Doncic",
        "position": "PG",
        "team": "DAL",
        "salary": 11500,
        "projection": 52.8,
        "value": 0.31,
        "ownership": 32.1,
        "volatility": 0.25,
        "matchup_rating": 7,
        "recent_form": 0.7,
        "usage_trend": "stable",
        "leverage": 0.6
    },
    {
        "name": "Giannis Antetokounmpo",
        "position": "PF",
        "team": "MIL",
        "salary": 11200,
        "projection": 51.4,
        "value": 0.33,
        "ownership": 35.2,
        "volatility": 0.20,
        "matchup_rating": 9,
        "recent_form": 0.8,
        "usage_trend": "increasing",
        "leverage": 0.8
    }
]

async def demo_ai_capabilities():
    """Demonstrate all AI capabilities requested by user"""

    print("🚀 Advanced AI-Powered DFS Analysis Demo")
    print("=" * 60)

    # Initialize AI analyzers
    advanced_analyzer = AdvancedAIAnalyzer()
    llm_integration = LLMIntegration()

    # Test with NFL data
    print("\n🏈 NFL ANALYSIS DEMO")
    print("-" * 30)

    slate_info = {
        "sport": "NFL",
        "salary_cap": 50000,
        "contest_type": "GPP",
        "entry_fee": 10,
        "total_entries": 100000
    }

    # Run comprehensive analysis
    print("🔍 Running comprehensive AI analysis...")
    analysis_results = await advanced_analyzer.analyze_player_pool_comprehensive(
        SAMPLE_NFL_PLAYERS, "NFL", slate_info
    )

    # Display results
    display_ai_analysis_results(analysis_results, "NFL")

    # Test LLM integration
    print("\n🤖 Testing LLM Integration...")
    llm_status = llm_integration.check_provider_status()
    print(f"Available AI providers: {list(llm_status.keys())}")
    print(f"Active providers: {[k for k, v in llm_status.items() if v]}")

    # Get AI insights for specific players
    print("\n🎯 Getting AI insights for top players...")
    for player in SAMPLE_NFL_PLAYERS[:3]:
        insights = await llm_integration.get_player_insights(
            player["name"], "NFL",
            {"projection": player["projection"], "ownership": player["ownership"]}
        )
        if "error" not in insights:
            print(f"\n{player['name']} AI Insights:")
            print(f"  {insights.get('insights', 'No insights available')[:100]}...")

    # Test NBA analysis
    print("\n\n🏀 NBA ANALYSIS DEMO")
    print("-" * 30)

    nba_slate_info = {
        "sport": "NBA",
        "salary_cap": 60000,
        "contest_type": "GPP",
        "entry_fee": 20,
        "total_entries": 50000
    }

    nba_analysis = await advanced_analyzer.analyze_player_pool_comprehensive(
        SAMPLE_NBA_PLAYERS, "NBA", nba_slate_info
    )

    display_ai_analysis_results(nba_analysis, "NBA")

    print("\n✅ AI Analysis Demo Complete!")
    print("\nKey Features Demonstrated:")
    print("• ✅ AI-powered optimization strategy")
    print("• ✅ ROI analysis with risk assessment")
    print("• ✅ Boom/bust probability identification")
    print("• ✅ Breakout player detection")
    print("• ✅ Contrarian play discovery")
    print("• ✅ Low-owned high-upside recommendations")

def display_ai_analysis_results(results: Dict, sport: str):
    """Display formatted AI analysis results"""

    analyses = results.get("analyses", {})

    # Optimization Strategy
    if "optimization" in analyses:
        opt = analyses["optimization"]
        print("
🎯 OPTIMIZATION STRATEGY:"        print(f"  Core Players: {', '.join(opt['optimal_lineup']['core_players'])}")
        print(f"  Value Plays: {', '.join(opt['optimal_lineup']['value_plays'])}")
        print(".2f"        print(f"  AI Insights: {opt['ai_insights']['strategy_recommendation']}")

    # ROI Analysis
    if "roi" in analyses:
        roi = analyses["roi"]
        print("
💰 ROI ANALYSIS:"        print(".1f"        print(".1f"        print(".1f"        print(".1f"        print(f"  Bankroll Allocation: {roi['recommended_bankroll_allocation']['total_recommended']*100:.1f}% per entry")

    # Boom/Bust Analysis
    if "boom_bust" in analyses:
        bb = analyses["boom_bust"]
        print("
📈 BOOM/BUST ANALYSIS:"        print("  Top Boom Candidates:")
        for player in bb["boom_candidates"][:3]:
            print(f"    • {player['name']} ({player['position']}) - {player['boom_pct']:.0f}% boom, {player['ownership']:.1f}% owned")
            print(f"      Ceiling: {player['ceiling']:.1f} pts - {player['reasoning']}")

        print("
  Bust Risks:"        for player in bb["bust_risks"][:2]:
            print(f"    • {player['name']} ({player['position']}) - {player['bust_pct']:.0f}% bust risk")
            print(f"      {player['reasoning']}")

    # Breakout Analysis
    if "breakout" in analyses:
        breakout = analyses["breakout"]
        print("
🎪 BREAKOUT IDENTIFICATION:"        print("  Primed for Breakout:")
        for player in breakout["primed_players"]:
            print(f"    • {player['name']} ({player['position']}) - Score: {player['breakout_score']:.2f}")
            print(f"      Factors: {', '.join(player['factors'][:2])}")

    # Contrarian Analysis
    if "contrarian" in analyses:
        contrarian = analyses["contrarian"]
        print("
🎭 CONTRARIAN PLAYS:"        print("  Low-Owned High-Upside:")
        for play in contrarian["low_owned_high_upside"][:3]:
            print(f"    • {play['name']} ({play['position']}) - {play['ownership']:.1f}% owned, Upside: {play['upside_potential']:.2f}")
            print(f"      {play['reasoning']}")

        print("
  Over-Owned to Fade:"        for play in contrarian["over_owned_to_fade"][:2]:
            print(f"    • {play['name']} ({play['position']}) - {play['ownership']:.1f}% owned, Fade Score: {play['fade_score']:.2f}")

        slate_break = contrarian["slate_breaking_potential"]
        print(f"\n  Slate Breaking Potential: {slate_break['slate_breaking_candidates']} high-upside contrarian plays")

async def run_live_ai_analysis():
    """Run AI analysis with live data integration"""
    print("\n🔴 LIVE DATA INTEGRATION TEST")
    print("-" * 40)

    try:
        # This would integrate with live data sources
        print("📡 Attempting to fetch live DraftKings data...")

        # For demo purposes, we'll use sample data
        print("📊 Using sample data for demonstration")
        await demo_ai_capabilities()

    except Exception as e:
        print(f"❌ Live data integration error: {e}")
        print("🔄 Falling back to sample data demo...")
        await demo_ai_capabilities()

def main():
    """Main entry point"""
    print("🤖 Advanced DFS AI Analysis System")
    print("==================================")

    try:
        # Check if running live analysis
        import sys
        if len(sys.argv) > 1 and sys.argv[1] == "--live":
            print("🔴 Running with live data integration...")
            asyncio.run(run_live_ai_analysis())
        else:
            print("📊 Running demo with sample data...")
            asyncio.run(demo_ai_capabilities())

    except KeyboardInterrupt:
        print("\n⏹️  Analysis interrupted by user")
    except Exception as e:
        print(f"\n❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
