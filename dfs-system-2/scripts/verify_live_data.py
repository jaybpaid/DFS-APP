#!/usr/bin/env python3
"""
Live Data Integration Verification Script
Tests that live data sources are properly configured and integrated
"""

import json
import os
from pathlib import Path
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DATA_DIR = Path("public/data")

def verify_demo_data():
    """Verify demo data exists and is valid"""
    logger.info("🔍 Verifying demo data...")
    
    demo_files = [
        "dk_nfl_latest.json",
        "dk_nba_latest.json"
    ]
    
    results = {}
    
    for filename in demo_files:
        filepath = DATA_DIR / filename
        if filepath.exists():
            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)
                
                # Basic validation
                is_valid = (
                    'players' in data and 
                    len(data['players']) > 0 and
                    'sport' in data and
                    'timestamp' in data
                )
                
                results[filename] = {
                    'exists': True,
                    'valid': is_valid,
                    'player_count': len(data.get('players', [])),
                    'sport': data.get('sport'),
                    'timestamp': data.get('timestamp')
                }
                
                logger.info(f"✅ {filename}: {len(data['players'])} {data['sport']} players")
                
            except Exception as e:
                results[filename] = {
                    'exists': True,
                    'valid': False,
                    'error': str(e)
                }
                logger.error(f"❌ {filename}: Invalid - {e}")
        else:
            results[filename] = {
                'exists': False,
                'valid': False
            }
            logger.error(f"❌ {filename}: Missing")
    
    return results

def verify_env_config():
    """Verify environment configuration"""
    logger.info("🔍 Verifying environment configuration...")
    
    env_path = Path(".env")
    results = {}
    
    if env_path.exists():
        try:
            with open(env_path, 'r') as f:
                content = f.read()
            
            # Check for required API keys
            required_keys = [
                'THE_ODDS_API_KEY',
                'OPENWEATHER_API_KEY'
            ]
            
            for key in required_keys:
                if f"{key}=" in content:
                    # Check if it's a placeholder
                    line = next((line for line in content.split('\n') if line.startswith(f"{key}=")), "")
                    if line and 'your_' in line and '_here' in line:
                        results[key] = {
                            'configured': True,
                            'status': 'placeholder'
                        }
                        logger.warning(f"⚠️ {key}: Configured but using placeholder")
                    else:
                        results[key] = {
                            'configured': True,
                            'status': 'configured'
                        }
                        logger.info(f"✅ {key}: Properly configured")
                else:
                    results[key] = {
                        'configured': False,
                        'status': 'missing'
                    }
                    logger.error(f"❌ {key}: Missing from .env")
            
        except Exception as e:
            logger.error(f"❌ Failed to read .env: {e}")
            return {'error': str(e)}
    else:
        logger.error("❌ .env file does not exist")
        return {'error': '.env file missing'}
    
    return results

def verify_data_integration():
    """Verify data integration with optimizer"""
    logger.info("🔍 Verifying data integration...")
    
    integration_points = [
        "src/web/dashboard.py",
        "src/io/json_importer.py", 
        "src/advanced_optimizer/next_level_features.py"
    ]
    
    results = {}
    
    for filepath in integration_points:
        path = Path(filepath)
        if path.exists():
            try:
                with open(path, 'r') as f:
                    content = f.read()
                
                # Check for data loading patterns
                patterns = [
                    'load_prefetched_data',
                    'public/data',
                    'dk_.*_latest.json'
                ]
                
                matches = []
                for pattern in patterns:
                    if pattern in content:
                        matches.append(pattern)
                
                results[filepath] = {
                    'exists': True,
                    'integration_points': matches,
                    'status': 'integrated' if matches else 'no_integration'
                }
                
                if matches:
                    logger.info(f"✅ {filepath}: Integrated with {len(matches)} data patterns")
                else:
                    logger.warning(f"⚠️ {filepath}: No data integration patterns found")
                    
            except Exception as e:
                results[filepath] = {
                    'exists': True,
                    'error': str(e),
                    'status': 'error'
                }
                logger.error(f"❌ {filepath}: Error reading - {e}")
        else:
            results[filepath] = {
                'exists': False,
                'status': 'missing'
            }
            logger.warning(f"⚠️ {filepath}: File not found")
    
    return results

def main():
    """Main verification routine"""
    logger.info("🚀 Starting Live Data Integration Verification...")
    
    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    results = {
        'timestamp': datetime.now().isoformat(),
        'demo_data': verify_demo_data(),
        'env_config': verify_env_config(),
        'integration': verify_data_integration(),
        'summary': {}
    }
    
    # Generate summary
    demo_valid = all(result['valid'] for result in results['demo_data'].values() if 'valid' in result)
    env_configured = all(
        config.get('configured', False) 
        for config in results['env_config'].values() 
        if isinstance(config, dict)
    )
    integration_ok = any(
        integration.get('status') == 'integrated'
        for integration in results['integration'].values()
        if isinstance(integration, dict)
    )
    
    results['summary'] = {
        'demo_data_available': demo_valid,
        'env_properly_configured': env_configured,
        'data_integration_working': integration_ok,
        'overall_status': 'READY' if demo_valid and integration_ok else 'NEEDS_CONFIGURATION'
    }
    
    # Save report
    report_path = DATA_DIR / "verification_report.json"
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"\n📋 VERIFICATION COMPLETE!")
    logger.info(f"Report saved to: {report_path}")
    
    # Display summary
    logger.info(f"\n📊 SUMMARY:")
    logger.info(f"Demo Data Available: {'✅' if demo_valid else '❌'}")
    logger.info(f"Environment Configured: {'✅' if env_configured else '❌'}")
    logger.info(f"Data Integration Working: {'✅' if integration_ok else '❌'}")
    logger.info(f"Overall Status: {results['summary']['overall_status']}")
    
    if results['summary']['overall_status'] == 'READY':
        logger.info("\n🎉 System is ready for live data integration!")
        logger.info("When live contests are available, run: python scripts/fetch_live_data.py")
    else:
        logger.info("\n⚠️ System needs configuration:")
        if not env_configured:
            logger.info("  - Configure API keys in .env file")
        if not integration_ok:
            logger.info("  - Check data integration points")
    
    return results

if __name__ == "__main__":
    main()
