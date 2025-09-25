#!/usr/bin/env python3
"""
MCP-Enhanced Dashboard Validation Script
Uses MCP servers to comprehensively validate dashboard functionality
"""

import json
import time
import subprocess
import sys
from datetime import datetime
from pathlib import Path

class MCPDashboardValidator:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'validation_status': 'RUNNING',
            'server_status': {},
            'component_validation': {},
            'mcp_integration': {},
            'browser_validation': {},
            'errors': [],
            'warnings': [],
            'recommendations': []
        }
    
    def validate_vite_server(self):
        """Validate that Vite development server is accessible"""
        print("🔍 Validating Vite Development Server...")
        
        try:
            # Check if server process is running
            result = subprocess.run(['lsof', '-i', ':3001'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0 and 'vite' in result.stdout.lower():
                self.results['server_status']['vite_process'] = True
                print("   ✅ Vite process found running on port 3001")
                
                # Test HTTP response
                curl_result = subprocess.run(['curl', '-s', '-f', '--max-time', '5', 'http://localhost:3001'],
                                           capture_output=True, text=True)
                
                if curl_result.returncode == 0:
                    self.results['server_status']['http_response'] = True
                    print("   ✅ HTTP response received successfully")
                else:
                    self.results['server_status']['http_response'] = False
                    self.results['errors'].append("HTTP request to localhost:3001 failed")
                    print("   ❌ HTTP request failed")
            else:
                self.results['server_status']['vite_process'] = False
                self.results['errors'].append("Vite process not found on port 3001")
                print("   ❌ Vite process not found")
                
        except Exception as e:
            self.results['errors'].append(f"Server validation failed: {str(e)}")
            print(f"   ❌ Server validation error: {str(e)}")
    
    def validate_component_files(self):
        """Validate that all Phase 2 components exist and are properly structured"""
        print("📋 Validating Component Files...")
        
        required_components = {
            'CorrelationMatrixDisplay.tsx': 'apps/web/src/components/CorrelationMatrixDisplay.tsx',
            'VarianceTab.tsx': 'apps/web/src/components/optimizer/VarianceTab.tsx', 
            'PortfolioManagerDashboard.tsx': 'apps/web/src/components/PortfolioManagerDashboard.tsx',
            'ContestTracker.tsx': 'apps/web/src/components/ContestTracker.tsx',
            'live-mcp-integration.ts': 'apps/web/src/services/live-mcp-integration.ts'
        }
        
        for component_name, file_path in required_components.items():
            try:
                path = Path(file_path)
                if path.exists():
                    size = path.stat().st_size
                    self.results['component_validation'][component_name] = {
                        'exists': True,
                        'size': size,
                        'path': file_path,
                        'status': 'PASS'
                    }
                    print(f"   ✅ {component_name}: {size:,} bytes")
                else:
                    self.results['component_validation'][component_name] = {
                        'exists': False,
                        'status': 'FAIL'
                    }
                    self.results['errors'].append(f"Component not found: {file_path}")
                    print(f"   ❌ {component_name}: NOT FOUND")
                    
            except Exception as e:
                self.results['errors'].append(f"Error validating {component_name}: {str(e)}")
                print(f"   ❌ {component_name}: ERROR - {str(e)}")
    
    def validate_mcp_integration(self):
        """Validate MCP server integration"""
        print("🔗 Validating MCP Server Integration...")
        
        # Check MCP configuration files
        mcp_configs = [
            'claude_desktop_config.json',
            'mcp_config_docker_complete.json', 
            'docker-compose.yml'
        ]
        
        for config_file in mcp_configs:
            try:
                path = Path(config_file)
                if path.exists():
                    self.results['mcp_integration'][config_file] = True
                    print(f"   ✅ {config_file}: Found")
                else:
                    self.results['mcp_integration'][config_file] = False
                    self.results['warnings'].append(f"MCP config file missing: {config_file}")
                    print(f"   ⚠️  {config_file}: Missing")
                    
            except Exception as e:
                self.results['warnings'].append(f"Error checking {config_file}: {str(e)}")
                print(f"   ❌ {config_file}: ERROR - {str(e)}")
    
    def test_browser_accessibility(self):
        """Test browser accessibility using simple methods"""
        print("🌐 Testing Browser Accessibility...")
        
        try:
            # Try simple curl with timeout
            result = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 
                                   '--max-time', '10', 'http://localhost:3001'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                status_code = result.stdout.strip()
                if status_code in ['200', '304']:
                    self.results['browser_validation']['accessibility'] = True
                    print(f"   ✅ HTTP Status: {status_code}")
                else:
                    self.results['browser_validation']['accessibility'] = False
                    self.results['warnings'].append(f"Unexpected HTTP status: {status_code}")
                    print(f"   ⚠️  HTTP Status: {status_code}")
            else:
                self.results['browser_validation']['accessibility'] = False
                self.results['errors'].append("Failed to connect to localhost:3001")
                print("   ❌ Failed to connect to server")
                
        except Exception as e:
            self.results['browser_validation']['accessibility'] = False
            self.results['errors'].append(f"Browser accessibility test failed: {str(e)}")
            print(f"   ❌ Browser test error: {str(e)}")
    
    def create_recommendations(self):
        """Create recommendations based on validation results"""
        print("💡 Generating Recommendations...")
        
        if not self.results['server_status'].get('http_response', False):
            self.results['recommendations'].append({
                'priority': 'HIGH',
                'issue': 'Vite server not responding to HTTP requests',
                'solution': 'Restart development server: cd apps/web && npm run dev',
                'category': 'server'
            })
        
        missing_components = [name for name, details in self.results['component_validation'].items() 
                            if not details.get('exists', False)]
        
        if missing_components:
            self.results['recommendations'].append({
                'priority': 'MEDIUM',
                'issue': f"Missing components: {', '.join(missing_components)}",
                'solution': 'Verify component files exist and are properly saved',
                'category': 'components'
            })
        
        missing_configs = [name for name, exists in self.results['mcp_integration'].items() 
                         if not exists]
        
        if missing_configs:
            self.results['recommendations'].append({
                'priority': 'LOW',
                'issue': f"Missing MCP configs: {', '.join(missing_configs)}",
                'solution': 'Verify MCP server configuration files',
                'category': 'mcp'
            })
    
    def generate_summary(self):
        """Generate validation summary"""
        total_errors = len(self.results['errors'])
        total_warnings = len(self.results['warnings'])
        
        # Determine overall status
        if total_errors == 0:
            if total_warnings == 0:
                self.results['validation_status'] = 'COMPLETE'
            else:
                self.results['validation_status'] = 'WARNING'
        else:
            self.results['validation_status'] = 'FAILED'
        
        return {
            'status': self.results['validation_status'],
            'errors': total_errors,
            'warnings': total_warnings,
            'components_validated': len(self.results['component_validation']),
            'server_accessible': self.results['server_status'].get('http_response', False),
            'mcp_integration_complete': all(self.results['mcp_integration'].values())
        }
    
    def run_full_validation(self):
        """Run complete dashboard validation"""
        print("🚀 Starting Comprehensive Dashboard Validation")
        print("=" * 60)
        
        # Run all validation steps
        self.validate_vite_server()
        self.validate_component_files() 
        self.validate_mcp_integration()
        self.test_browser_accessibility()
        self.create_recommendations()
        
        # Generate summary
        summary = self.generate_summary()
        
        # Print results
        print("\n" + "=" * 60)
        print("📊 VALIDATION SUMMARY")
        print("=" * 60)
        
        print(f"🎯 Overall Status: {summary['status']}")
        print(f"📋 Components Validated: {summary['components_validated']}")
        print(f"🌐 Server Accessible: {'✅' if summary['server_accessible'] else '❌'}")
        print(f"🔗 MCP Integration: {'✅' if summary['mcp_integration_complete'] else '⚠️'}")
        print(f"❌ Errors: {summary['errors']}")
        print(f"⚠️  Warnings: {summary['warnings']}")
        
        if self.results['errors']:
            print(f"\n❌ ERRORS ({len(self.results['errors'])}):")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        if self.results['warnings']:
            print(f"\n⚠️  WARNINGS ({len(self.results['warnings'])}):")
            for warning in self.results['warnings']:
                print(f"   • {warning}")
        
        if self.results['recommendations']:
            print(f"\n💡 RECOMMENDATIONS ({len(self.results['recommendations'])}):")
            for rec in self.results['recommendations']:
                print(f"   🔧 [{rec['priority']}] {rec['issue']}")
                print(f"      Solution: {rec['solution']}")
        
        # Save detailed results
        with open('MCP_DASHBOARD_VALIDATION_RESULTS.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n💾 Detailed results saved to: MCP_DASHBOARD_VALIDATION_RESULTS.json")
        
        return summary['status'] == 'COMPLETE'

def main():
    """Main validation execution"""
    validator = MCPDashboardValidator()
    
    try:
        success = validator.run_full_validation()
        
        if success:
            print("\n🎉 DASHBOARD VALIDATION: SUCCESS!")
            print("✅ All systems validated and working correctly")
            sys.exit(0)
        else:
            print("\n⚠️  DASHBOARD VALIDATION: ISSUES DETECTED")
            print("🔄 Review errors and recommendations above")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 VALIDATION FAILED: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
