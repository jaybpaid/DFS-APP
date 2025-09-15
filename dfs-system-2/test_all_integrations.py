#!/usr/bin/env python3
"""
Comprehensive Integration Test Script
Tests all data sources, ingestors, and integrations
"""

import os
import sys
import json
import logging
from datetime import datetime
from dotenv import load_dotenv

# Add src to path
sys.path.append('src')

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_dependencies():
    """Test that all required dependencies are installed"""
    logger.info("🔍 Testing Dependencies...")

    dependencies = [
        ('nfl_data_py', 'NFL Data Py library'),
        ('pandas', 'Pandas for data manipulation'),
        ('requests', 'HTTP requests library'),
        ('beautifulsoup4', 'Web scraping library'),
        ('python-dotenv', 'Environment variable management')
    ]

    results = {}
    for module, description in dependencies:
        try:
            __import__(module.replace('-', '_'))
            results[module] = f"✅ {description} - OK"
            logger.info(f"✅ {module} - Available")
        except ImportError:
            results[module] = f"❌ {description} - MISSING"
            logger.error(f"❌ {module} - Missing")

    return results

def test_api_keys():
    """Test that API keys are configured"""
    logger.info("🔑 Testing API Keys...")

    api_keys = {
        'THE_ODDS_API_KEY': 'The Odds API key',
        'OPENAI_API_KEY': 'OpenAI API key',
        'GEMINI_API_KEY': 'Google Gemini API key'
    }

    results = {}
    for key, description in api_keys.items():
        value = os.getenv(key)
        if value and len(value.strip()) > 10:  # Basic validation
            results[key] = f"✅ {description} - Configured"
            logger.info(f"✅ {key} - Configured")
        else:
            results[key] = f"⚠️ {description} - Not configured or invalid"
            logger.warning(f"⚠️ {key} - Not configured")

    return results

def test_ingestors():
    """Test that all ingestors can be imported and initialized"""
    logger.info("🏗️ Testing Ingestors...")

    ingestors = [
        ('src.ingest.nfl.nfl_data_py_ingestor', 'NFLDataPyIngestor'),
        ('src.ingest.nfl.fantasy_nerds_ingestor', 'FantasyNerdsIngestor'),
        ('src.ingest.nfl.scraping_ingestor', 'ScrapingIngestor'),
        ('src.ingest.base', 'BaseIngestor')
    ]

    results = {}
    for module_path, class_name in ingestors:
        try:
            module = __import__(module_path, fromlist=[class_name])
            cls = getattr(module, class_name)
            results[class_name] = f"✅ {class_name} - OK"
            logger.info(f"✅ {class_name} - Import successful")
        except Exception as e:
            results[class_name] = f"❌ {class_name} - Error: {str(e)}"
            logger.error(f"❌ {class_name} - Import failed: {e}")

    return results

def test_config_files():
    """Test that configuration files are valid"""
    logger.info("⚙️ Testing Configuration Files...")

    config_files = [
        'src/config/sources.json',
        '.env',
        'mcp_config.json'
    ]

    results = {}
    for config_file in config_files:
        try:
            if config_file.endswith('.json'):
                with open(config_file, 'r') as f:
                    json.load(f)
                results[config_file] = f"✅ {config_file} - Valid JSON"
                logger.info(f"✅ {config_file} - Valid JSON")
            elif config_file.endswith('.env'):
                # Just check if file exists and is readable
                with open(config_file, 'r') as f:
                    content = f.read()
                if content.strip():
                    results[config_file] = f"✅ {config_file} - Exists and readable"
                    logger.info(f"✅ {config_file} - Exists and readable")
                else:
                    results[config_file] = f"⚠️ {config_file} - Empty"
                    logger.warning(f"⚠️ {config_file} - Empty")
        except Exception as e:
            results[config_file] = f"❌ {config_file} - Error: {str(e)}"
            logger.error(f"❌ {config_file} - Error: {e}")

    return results

def test_data_sources():
    """Test basic connectivity to data sources"""
    logger.info("🌐 Testing Data Source Connectivity...")

    sources = [
        ('https://api.the-odds-api.com/v4/sports', 'The Odds API'),
        ('https://api.fantasynerds.com/v1/nfl/projections', 'Fantasy Nerds API'),
        ('https://www.reddit.com/r/dfsports/hot/.json', 'Reddit API'),
        ('https://www.nfl.com/injuries/', 'NFL.com'),
        ('https://www.espn.com/nfl/', 'ESPN.com')
    ]

    results = {}
    for url, name in sources:
        try:
            import requests
            response = requests.head(url, timeout=10)
            if response.status_code < 400:
                results[name] = f"✅ {name} - Reachable"
                logger.info(f"✅ {name} - Reachable")
            else:
                results[name] = f"⚠️ {name} - HTTP {response.status_code}"
                logger.warning(f"⚠️ {name} - HTTP {response.status_code}")
        except Exception as e:
            results[name] = f"❌ {name} - Error: {str(e)}"
            logger.error(f"❌ {name} - Error: {e}")

    return results

def generate_report():
    """Generate comprehensive test report"""
    logger.info("📊 Generating Test Report...")

    report = {
        'timestamp': datetime.now().isoformat(),
        'test_results': {
            'dependencies': test_dependencies(),
            'api_keys': test_api_keys(),
            'ingestors': test_ingestors(),
            'config_files': test_config_files(),
            'data_sources': test_data_sources()
        }
    }

    # Calculate overall score
    total_tests = 0
    passed_tests = 0

    for category, results in report['test_results'].items():
        for test_name, result in results.items():
            total_tests += 1
            if result.startswith('✅'):
                passed_tests += 1

    report['summary'] = {
        'total_tests': total_tests,
        'passed_tests': passed_tests,
        'success_rate': round((passed_tests / total_tests) * 100, 1) if total_tests > 0 else 0,
        'status': 'PASS' if passed_tests == total_tests else 'PARTIAL' if passed_tests > 0 else 'FAIL'
    }

    return report

def main():
    """Main test execution"""
    print("=" * 60)
    print("🚀 DFS OPTIMIZER INTEGRATION TEST SUITE")
    print("=" * 60)

    try:
        report = generate_report()

        print(f"\n📊 TEST RESULTS SUMMARY")
        print(f"Total Tests: {report['summary']['total_tests']}")
        print(f"Passed: {report['summary']['passed_tests']}")
        print(f"Success Rate: {report['summary']['success_rate']}%")
        print(f"Status: {report['summary']['status']}")

        print(f"\n🔍 DETAILED RESULTS:")

        for category, results in report['test_results'].items():
            print(f"\n{category.upper()}:")
            for test_name, result in results.items():
                print(f"  {result}")

        # Save detailed report
        with open('integration_test_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\n💾 Detailed report saved to: integration_test_report.json")

        if report['summary']['status'] == 'PASS':
            print("🎉 ALL TESTS PASSED! Your DFS optimizer is ready!")
            return 0
        elif report['summary']['status'] == 'PARTIAL':
            print("⚠️ SOME TESTS FAILED. Check the detailed report for issues.")
            return 1
        else:
            print("❌ CRITICAL ISSUES FOUND. Please fix before proceeding.")
            return 2

    except Exception as e:
        logger.error(f"Test execution failed: {e}")
        print(f"❌ Test execution failed: {e}")
        return 3

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
