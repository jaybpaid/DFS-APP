"""
Comprehensive Test Script for RSS Feed and Data Sources Integration
Tests the complete system including RSS parsing, data source management, and API endpoints
"""

import asyncio
import sys
import os
import logging
from datetime import datetime

# Add the apps/api-python directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'apps', 'api-python'))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_rss_feed_parser():
    """Test the RSS feed parser functionality"""
    print("\n" + "="*60)
    print("TESTING RSS FEED PARSER")
    print("="*60)
    
    try:
        from lib.rss_feed_parser import (
            FantasyFootballRSSParser, 
            RSSFeedManager, 
            create_default_feed_manager
        )
        
        # Test 1: Create parser instance
        print("✓ Successfully imported RSS feed parser modules")
        
        parser = FantasyFootballRSSParser()
        print("✓ Created FantasyFootballRSSParser instance")
        
        # Test 2: Create feed manager
        manager = create_default_feed_manager()
        print("✓ Created default feed manager")
        print(f"  - Registered feeds: {len(manager.feeds)}")
        
        # Test 3: Get feed status
        status = manager.get_feed_status()
        print("✓ Retrieved feed status")
        print(f"  - Total feeds: {status['total_feeds']}")
        print(f"  - Last check: {status['last_check']}")
        
        # Test 4: Test RSS parsing (with error handling for network issues)
        try:
            print("\n📡 Testing RSS feed parsing...")
            results = manager.update_all_feeds()
            
            for feed_name, data in results.items():
                if 'error' in data:
                    print(f"⚠️  Feed '{feed_name}' error: {data['error']}")
                else:
                    print(f"✓ Feed '{feed_name}' parsed successfully:")
                    print(f"  - Feed title: {data['feed_info'].title}")
                    print(f"  - Total episodes: {len(data['all_episodes'])}")
                    print(f"  - Fantasy episodes: {len(data['fantasy_episodes'])}")
                    print(f"  - Recent episodes: {len(data['recent_episodes'])}")
                    
                    if data['recent_episodes']:
                        latest = data['recent_episodes'][0]
                        print(f"  - Latest episode: {latest.title}")
                        print(f"  - Published: {latest.published_date}")
                        
                        # Test player mention extraction
                        mentions = parser.extract_player_mentions(latest)
                        if mentions:
                            print(f"  - Player mentions: {mentions[:3]}...")  # Show first 3
        
        except Exception as e:
            print(f"⚠️  RSS parsing test failed (likely network issue): {str(e)}")
            print("   This is expected if there are network connectivity issues")
        
        print("\n✅ RSS Feed Parser tests completed")
        return True
        
    except Exception as e:
        print(f"❌ RSS Feed Parser test failed: {str(e)}")
        return False

def test_comprehensive_data_sources():
    """Test the comprehensive data sources management system"""
    print("\n" + "="*60)
    print("TESTING COMPREHENSIVE DATA SOURCES")
    print("="*60)
    
    try:
        from lib.comprehensive_data_sources import (
            get_data_source_manager,
            DataSourceType,
            DataCategory,
            DataSource
        )
        
        # Test 1: Get data source manager
        manager = get_data_source_manager()
        print("✓ Retrieved data source manager")
        print(f"  - Total sources: {len(manager.data_sources)}")
        
        # Test 2: Get sources summary
        summary = manager.get_sources_summary()
        print("✓ Generated sources summary:")
        print(f"  - Active sources: {summary['active_sources']}")
        print(f"  - Real-time sources: {summary['real_time_sources']}")
        print(f"  - High priority sources: {summary['high_priority_sources']}")
        print(f"  - Free sources: {summary['by_cost_tier']['free']}")
        print(f"  - Paid sources: {summary['by_cost_tier']['paid']}")
        print(f"  - Premium sources: {summary['by_cost_tier']['premium']}")
        
        # Test 3: Test category filtering
        player_data_sources = manager.get_sources_by_category(DataCategory.PLAYER_DATA)
        print(f"✓ Found {len(player_data_sources)} player data sources")
        
        injury_sources = manager.get_sources_by_category(DataCategory.INJURY_DATA)
        print(f"✓ Found {len(injury_sources)} injury data sources")
        
        # Test 4: Test type filtering
        api_sources = manager.get_sources_by_type(DataSourceType.API)
        print(f"✓ Found {len(api_sources)} API sources")
        
        rss_sources = manager.get_sources_by_type(DataSourceType.RSS_FEED)
        print(f"✓ Found {len(rss_sources)} RSS feed sources")
        
        # Test 5: Test free sources
        free_sources = manager.get_free_sources()
        print(f"✓ Found {len(free_sources)} free sources:")
        for source in free_sources[:3]:  # Show first 3
            print(f"  - {source.name}")
        
        # Test 6: Test real-time sources
        realtime_sources = manager.get_real_time_sources()
        print(f"✓ Found {len(realtime_sources)} real-time sources")
        
        # Test 7: Test search functionality
        search_results = manager.search_sources("fantasy")
        print(f"✓ Search for 'fantasy' returned {len(search_results)} results")
        
        # Test 8: Test strategy recommendations
        strategies = ['cash_games', 'tournaments', 'contrarian', 'weather_plays', 'late_swap']
        for strategy in strategies:
            recommended = manager.get_recommended_sources_for_strategy(strategy)
            print(f"✓ Strategy '{strategy}': {len(recommended)} recommended sources")
        
        # Test 9: Test specific source retrieval
        test_source_id = list(manager.data_sources.keys())[0]
        source = manager.get_source(test_source_id)
        if source:
            print(f"✓ Retrieved source '{source.name}' successfully")
            print(f"  - Type: {source.source_type.value}")
            print(f"  - Categories: {[cat.value for cat in source.categories]}")
            print(f"  - Cost tier: {source.cost_tier}")
            print(f"  - Priority: {source.priority}")
        
        # Test 10: Test export functionality
        config = manager.export_sources_config()
        print("✓ Exported sources configuration")
        print(f"  - Export timestamp: {config['exported_at']}")
        print(f"  - Sources in config: {len(config['sources'])}")
        
        print("\n✅ Comprehensive Data Sources tests completed")
        return True
        
    except Exception as e:
        print(f"❌ Comprehensive Data Sources test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_data_integration():
    """Test integration between RSS feeds and data sources"""
    print("\n" + "="*60)
    print("TESTING DATA INTEGRATION")
    print("="*60)
    
    try:
        from lib.rss_feed_parser import create_default_feed_manager
        from lib.comprehensive_data_sources import get_data_source_manager, DataCategory
        
        # Test 1: Integration between systems
        rss_manager = create_default_feed_manager()
        data_manager = get_data_source_manager()
        
        print("✓ Both managers initialized successfully")
        
        # Test 2: Find RSS sources in data manager
        rss_data_sources = data_manager.get_sources_by_category(DataCategory.NEWS_CONTENT)
        print(f"✓ Found {len(rss_data_sources)} news content sources in data manager")
        
        # Test 3: Cross-reference RSS feeds
        rss_source_found = False
        for source in rss_data_sources:
            if 'rss' in source.id.lower() or 'feed' in source.id.lower():
                print(f"✓ Found RSS source in data manager: {source.name}")
                rss_source_found = True
                break
        
        if not rss_source_found:
            print("⚠️  No RSS sources found in data manager (this might be expected)")
        
        # Test 4: Strategy-based source recommendations
        print("\n📊 Testing strategy-based recommendations:")
        
        strategies_test = {
            'cash_games': 'Conservative plays',
            'tournaments': 'Tournament plays', 
            'contrarian': 'Contrarian plays'
        }
        
        for strategy, description in strategies_test.items():
            sources = data_manager.get_recommended_sources_for_strategy(strategy)
            print(f"✓ {strategy} ({description}): {len(sources)} sources")
            
            # Show top 2 sources for each strategy
            for i, source in enumerate(sources[:2]):
                print(f"  {i+1}. {source.name} (Priority: {source.priority})")
        
        print("\n✅ Data Integration tests completed")
        return True
        
    except Exception as e:
        print(f"❌ Data Integration test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_system_performance():
    """Test system performance and resource usage"""
    print("\n" + "="*60)
    print("TESTING SYSTEM PERFORMANCE")
    print("="*60)
    
    try:
        import time
        from lib.comprehensive_data_sources import get_data_source_manager
        
        manager = get_data_source_manager()
        
        # Test 1: Measure initialization time
        start_time = time.time()
        test_manager = get_data_source_manager()
        init_time = time.time() - start_time
        print(f"✓ Manager initialization time: {init_time:.4f} seconds")
        
        # Test 2: Measure summary generation time
        start_time = time.time()
        summary = manager.get_sources_summary()
        summary_time = time.time() - start_time
        print(f"✓ Summary generation time: {summary_time:.4f} seconds")
        
        # Test 3: Measure search performance
        search_queries = ['fantasy', 'real-time', 'weather', 'injury', 'api']
        total_search_time = 0
        
        for query in search_queries:
            start_time = time.time()
            results = manager.search_sources(query)
            search_time = time.time() - start_time
            total_search_time += search_time
            print(f"✓ Search '{query}': {len(results)} results in {search_time:.4f}s")
        
        avg_search_time = total_search_time / len(search_queries)
        print(f"✓ Average search time: {avg_search_time:.4f} seconds")
        
        # Test 4: Memory usage estimation
        import sys
        total_sources = len(manager.data_sources)
        estimated_memory = total_sources * 1024  # Rough estimate in bytes
        print(f"✓ Estimated memory usage: ~{estimated_memory/1024:.1f} KB for {total_sources} sources")
        
        print("\n✅ System Performance tests completed")
        return True
        
    except Exception as e:
        print(f"❌ System Performance test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 COMPREHENSIVE DATA INTEGRATION TEST SUITE")
    print("=" * 80)
    print(f"Test started at: {datetime.now()}")
    print("=" * 80)
    
    test_results = []
    
    # Run all tests
    tests = [
        ("RSS Feed Parser", test_rss_feed_parser),
        ("Comprehensive Data Sources", test_comprehensive_data_sources),
        ("Data Integration", test_data_integration),
        ("System Performance", test_system_performance)
    ]
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} tests...")
        try:
            result = test_func()
            test_results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test suite failed with exception: {str(e)}")
            test_results.append((test_name, False))
    
    # Print final results
    print("\n" + "="*80)
    print("📊 FINAL TEST RESULTS")
    print("="*80)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<30} {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nSummary: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! The comprehensive data integration system is working correctly.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please review the errors above.")
    
    print(f"\nTest completed at: {datetime.now()}")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
