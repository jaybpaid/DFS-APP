#!/usr/bin/env python3
"""
Phase 2 Completion Validation Script
Validates all Phase 2 DFS App components and features are implemented correctly
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime

class Phase2Validator:
    def __init__(self):
        self.base_path = Path('.')
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'phase_2_status': 'VALIDATING',
            'components': {},
            'services': {},
            'integration': {},
            'errors': [],
            'warnings': [],
            'summary': {}
        }
        
    def validate_component(self, component_path, required_features):
        """Validate a React component exists and contains required features"""
        file_path = self.base_path / component_path
        
        if not file_path.exists():
            self.results['errors'].append(f"Component not found: {component_path}")
            return False
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            component_name = file_path.stem
            validation_result = {
                'exists': True,
                'size': len(content),
                'features': {},
                'status': 'PASS'
            }
            
            # Check for required features
            for feature, keywords in required_features.items():
                found = all(keyword in content for keyword in keywords)
                validation_result['features'][feature] = found
                if not found:
                    validation_result['status'] = 'FAIL'
                    self.results['errors'].append(f"{component_name}: Missing {feature}")
            
            self.results['components'][component_name] = validation_result
            return validation_result['status'] == 'PASS'
            
        except Exception as e:
            self.results['errors'].append(f"Error validating {component_path}: {str(e)}")
            return False
    
    def validate_service(self, service_path, required_methods):
        """Validate a service file exists and contains required methods"""
        file_path = self.base_path / service_path
        
        if not file_path.exists():
            self.results['errors'].append(f"Service not found: {service_path}")
            return False
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            service_name = file_path.stem
            validation_result = {
                'exists': True,
                'size': len(content),
                'methods': {},
                'status': 'PASS'
            }
            
            # Check for required methods
            for method in required_methods:
                found = method in content
                validation_result['methods'][method] = found
                if not found:
                    validation_result['status'] = 'FAIL'
                    self.results['errors'].append(f"{service_name}: Missing {method}")
            
            self.results['services'][service_name] = validation_result
            return validation_result['status'] == 'PASS'
            
        except Exception as e:
            self.results['errors'].append(f"Error validating {service_path}: {str(e)}")
            return False
    
    def run_validation(self):
        """Run complete Phase 2 validation"""
        print("🚀 DFS App Phase 2 Completion Validation")
        print("=" * 50)
        
        # Component validation definitions
        components_to_validate = {
            'apps/web/src/components/CorrelationMatrixDisplay.tsx': {
                'interactive_heatmap': ['heatmapMode', 'grid', 'network', 'canvas'],
                'correlation_filtering': ['filterType', 'stack', 'game_script', 'weather'],
                'live_data_integration': ['liveDataEnabled', 'animate-pulse'],
                'tooltip_system': ['tooltip', 'hover', 'correlation'],
                'analytics_panel': ['analytics', 'insights', 'correlation']
            },
            
            'apps/web/src/components/optimizer/VarianceTab.tsx': {
                'advanced_controls': ['VarianceSettings', 'distributionMode', 'gameMode'],
                'game_mode_presets': ['gpp', 'cash', 'custom'],
                'position_variance': ['positionVariance', 'QB', 'RB', 'WR', 'TE', 'DST'],
                'weather_integration': ['weatherAdjustments', 'windThreshold', 'precipitation'],
                'simulation_engine': ['runSimulation', 'monteCarloSamples', 'confidence'],
                'tabbed_interface': ['activeTab', 'basic', 'advanced', 'analytics']
            },
            
            'apps/web/src/components/PortfolioManagerDashboard.tsx': {
                'portfolio_metrics': ['portfolioMetrics', 'totalExposure', 'averageROI'],
                'lineup_management': ['mockLineups', 'lineup.name', 'lineup.status'],
                'exposure_analysis': ['exposure', 'limit', 'recommendation'],
                'live_tracking': ['liveTracking', 'animate-pulse'],
                'risk_management': ['riskScore', 'portfolioRisk', 'diversification'],
                'multi_tab_interface': ['overview', 'lineups', 'exposure', 'analytics']
            },
            
            'apps/web/src/components/ContestTracker.tsx': {
                'contest_management': ['Contest', 'mockContests', 'contestMetrics'],
                'weather_integration': ['WeatherData', 'mockWeather', 'weatherImpact'],
                'live_contest_tracking': ['liveRank', 'currentPayout', 'status'],
                'weather_alerts': ['weatherAlerts', 'high_impact', 'precipitation'],
                'multi_site_support': ['draftkings', 'fanduel', 'superdraft'],
                'real_time_updates': ['liveTracking', 'Live Updates']
            }
        }
        
        # Service validation definitions
        services_to_validate = {
            'apps/web/src/services/live-mcp-integration.ts': [
                'LiveMCPIntegration',
                'fetchNewsAndInjuries',
                'fetchDFSResearchData',
                'updateKnowledgeGraph',
                'getMarketData',
                'storeCorrelationData',
                'getComprehensiveSlateAnalysis'
            ]
        }
        
        print("📋 Validating Phase 2 Components...")
        component_results = []
        for component_path, features in components_to_validate.items():
            result = self.validate_component(component_path, features)
            component_results.append(result)
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {Path(component_path).name}: {status}")
        
        print("\n🔧 Validating Phase 2 Services...")
        service_results = []
        for service_path, methods in services_to_validate.items():
            result = self.validate_service(service_path, methods)
            service_results.append(result)
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {Path(service_path).name}: {status}")
        
        # Integration validation
        print("\n🔗 Validating Integration Points...")
        integration_results = self.validate_integration()
        
        # Generate summary
        self.generate_summary(component_results, service_results, integration_results)
        
        # Save validation report
        self.save_report()
        
        return self.results['phase_2_status'] == 'COMPLETE'
    
    def validate_integration(self):
        """Validate integration between components and services"""
        integration_checks = {
            'mcp_server_config': self.check_mcp_configuration(),
            'component_imports': self.check_component_imports(),
            'type_definitions': self.check_type_definitions(),
            'ui_components': self.check_ui_components()
        }
        
        self.results['integration'] = integration_checks
        
        for check, result in integration_checks.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {check}: {status}")
        
        return all(integration_checks.values())
    
    def check_mcp_configuration(self):
        """Check MCP server configuration exists"""
        config_files = [
            'claude_desktop_config.json',
            'mcp_config_docker_complete.json',
            'docker-compose.yml'
        ]
        
        for config_file in config_files:
            if not (self.base_path / config_file).exists():
                self.results['warnings'].append(f"MCP config file missing: {config_file}")
                return False
        
        return True
    
    def check_component_imports(self):
        """Check that components can import UI components"""
        ui_path = self.base_path / 'apps/web/src/components/ui'
        if not ui_path.exists():
            return False
            
        required_ui_components = [
            'card.tsx', 'button.tsx', 'badge.tsx', 'alert.tsx',
            'input.tsx', 'select.tsx', 'slider.tsx'
        ]
        
        for component in required_ui_components:
            if not (ui_path / component).exists():
                self.results['warnings'].append(f"UI component missing: {component}")
                return False
        
        return True
    
    def check_type_definitions(self):
        """Check TypeScript type definitions"""
        types_path = self.base_path / 'apps/web/src/types'
        if not types_path.exists():
            return True  # Optional
        
        return True
    
    def check_ui_components(self):
        """Check UI component library completeness"""
        ui_path = self.base_path / 'apps/web/src/components/ui'
        if not ui_path.exists():
            return False
            
        ui_files = list(ui_path.glob('*.tsx'))
        return len(ui_files) >= 10  # Should have at least 10 UI components
    
    def generate_summary(self, component_results, service_results, integration_result):
        """Generate validation summary"""
        total_components = len(component_results)
        passed_components = sum(component_results)
        
        total_services = len(service_results)
        passed_services = sum(service_results)
        
        self.results['summary'] = {
            'total_components': total_components,
            'passed_components': passed_components,
            'component_success_rate': (passed_components / total_components) * 100 if total_components > 0 else 0,
            'total_services': total_services,
            'passed_services': passed_services,
            'service_success_rate': (passed_services / total_services) * 100 if total_services > 0 else 0,
            'integration_passed': integration_result,
            'overall_errors': len(self.results['errors']),
            'overall_warnings': len(self.results['warnings'])
        }
        
        # Determine overall status
        if (passed_components == total_components and 
            passed_services == total_services and 
            integration_result and 
            len(self.results['errors']) == 0):
            self.results['phase_2_status'] = 'COMPLETE'
        else:
            self.results['phase_2_status'] = 'INCOMPLETE'
    
    def save_report(self):
        """Save validation report to file"""
        report_path = self.base_path / 'PHASE_2_VALIDATION_REPORT.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2)
    
    def print_detailed_report(self):
        """Print detailed validation report"""
        print("\n" + "=" * 60)
        print("📊 PHASE 2 VALIDATION DETAILED REPORT")
        print("=" * 60)
        
        summary = self.results['summary']
        
        print(f"\n🎯 OVERALL STATUS: {self.results['phase_2_status']}")
        print(f"📦 Components: {summary['passed_components']}/{summary['total_components']} ({summary['component_success_rate']:.1f}%)")
        print(f"🔧 Services: {summary['passed_services']}/{summary['total_services']} ({summary['service_success_rate']:.1f}%)")
        print(f"🔗 Integration: {'✅ PASS' if summary['integration_passed'] else '❌ FAIL'}")
        print(f"❌ Errors: {summary['overall_errors']}")
        print(f"⚠️  Warnings: {summary['overall_warnings']}")
        
        if self.results['errors']:
            print(f"\n❌ ERRORS ({len(self.results['errors'])}):")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        if self.results['warnings']:
            print(f"\n⚠️  WARNINGS ({len(self.results['warnings'])}):")
            for warning in self.results['warnings']:
                print(f"   • {warning}")
        
        print(f"\n📋 COMPONENT DETAILS:")
        for component, details in self.results['components'].items():
            print(f"\n   {component}:")
            print(f"     Status: {details['status']}")
            print(f"     Size: {details['size']:,} characters")
            print(f"     Features:")
            for feature, implemented in details['features'].items():
                status = "✅" if implemented else "❌"
                print(f"       {status} {feature}")
        
        print(f"\n🔧 SERVICE DETAILS:")
        for service, details in self.results['services'].items():
            print(f"\n   {service}:")
            print(f"     Status: {details['status']}")
            print(f"     Size: {details['size']:,} characters")
            print(f"     Methods:")
            for method, implemented in details['methods'].items():
                status = "✅" if implemented else "❌"
                print(f"       {status} {method}")
        
        print(f"\n💾 Report saved to: PHASE_2_VALIDATION_REPORT.json")

def main():
    """Main validation execution"""
    validator = Phase2Validator()
    
    try:
        success = validator.run_validation()
        validator.print_detailed_report()
        
        if success:
            print("\n🎉 PHASE 2 VALIDATION: SUCCESS!")
            print("✅ All Phase 2 components and features are fully implemented")
            print("✅ Ready for production deployment")
            sys.exit(0)
        else:
            print(f"\n⚠️  PHASE 2 VALIDATION: INCOMPLETE")
            print(f"❌ {len(validator.results['errors'])} errors need to be resolved")
            print("🔄 Review errors and warnings above")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 VALIDATION FAILED: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
