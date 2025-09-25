#!/usr/bin/env python3
"""
COMPREHENSIVE MCP SERVERS VALIDATION
Validates Docker MCP Gateway and all child servers with detailed reporting
"""

import json
import subprocess
import os
import sys
import time
from datetime import datetime
from pathlib import Path

class MCPServerValidator:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'gateway_status': {},
            'child_servers': {},
            'configuration_checks': {},
            'connectivity_tests': {},
            'recommendations': []
        }
        
    def check_gateway_status(self):
        """Check Docker MCP Gateway status"""
        print("🔍 CHECKING DOCKER MCP GATEWAY STATUS")
        print("=" * 60)
        
        gateway_status = {
            'process_running': False,
            'containers_running': False,
            'configuration_exists': False,
            'start_script_exists': False,
            'cline_configured': False
        }
        
        # Check if gateway process is running
        try:
            result = subprocess.run(['pgrep', '-f', 'gateway.js'], capture_output=True, text=True)
            if result.returncode == 0:
                gateway_status['process_running'] = True
                print("✅ Gateway process is running")
            else:
                print("❌ Gateway process not running")
        except Exception as e:
            print(f"⚠️ Error checking gateway process: {e}")
        
        # Check for Docker containers with gateway labels
        try:
            result = subprocess.run(['docker', 'ps', '-q', '--filter', 'label=mcp.gateway=true'], 
                                  capture_output=True, text=True)
            if result.stdout.strip():
                gateway_status['containers_running'] = True
                print("✅ Gateway containers found")
            else:
                print("❌ No gateway containers running")
        except Exception as e:
            print(f"⚠️ Error checking Docker containers: {e}")
        
        # Check gateway configuration
        gateway_config_path = Path.home() / '.mcp' / 'docker-gateway' / 'gateway.config.yaml'
        if gateway_config_path.exists():
            gateway_status['configuration_exists'] = True
            print(f"✅ Gateway config found: {gateway_config_path}")
        else:
            print(f"❌ Gateway config not found: {gateway_config_path}")
        
        # Check start script
        start_script_path = Path.home() / '.mcp' / 'docker-gateway' / 'start-gateway.sh'
        if start_script_path.exists():
            gateway_status['start_script_exists'] = True
            print(f"✅ Start script found: {start_script_path}")
        else:
            print(f"❌ Start script not found: {start_script_path}")
        
        # Check Cline configuration
        cline_config_path = Path.home() / 'Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'
        if cline_config_path.exists():
            try:
                with open(cline_config_path) as f:
                    cline_config = json.load(f)
                if 'docker-mcp-gateway' in cline_config.get('mcpServers', {}):
                    gateway_status['cline_configured'] = True
                    print("✅ Cline configured for Docker MCP Gateway")
                else:
                    print("❌ Cline not configured for Docker MCP Gateway")
            except Exception as e:
                print(f"⚠️ Error reading Cline config: {e}")
        else:
            print("❌ Cline configuration not found")
        
        self.results['gateway_status'] = gateway_status
        return gateway_status
    
    def check_gateway_configuration(self):
        """Check gateway configuration details"""
        print("\n📋 CHECKING GATEWAY CONFIGURATION")
        print("-" * 40)
        
        config_details = {
            'children_defined': 0,
            'enabled_children': 0,
            'disabled_children': 0,
            'children_with_env': 0,
            'missing_env_files': []
        }
        
        gateway_config_path = Path.home() / '.mcp' / 'docker-gateway' / 'gateway.config.yaml'
        
        if gateway_config_path.exists():
            try:
                import yaml
                with open(gateway_config_path) as f:
                    config = yaml.safe_load(f)
                
                children = config.get('children', [])
                config_details['children_defined'] = len(children)
                
                for child in children:
                    name = child.get('name', 'unnamed')
                    enabled = child.get('enabled', True)
                    
                    if enabled:
                        config_details['enabled_children'] += 1
                        print(f"   ✅ {name}: Enabled")
                    else:
                        config_details['disabled_children'] += 1
                        print(f"   ❌ {name}: Disabled")
                    
                    # Check for environment files
                    docker_config = child.get('docker', {})
                    env_file = docker_config.get('envFile')
                    if env_file:
                        config_details['children_with_env'] += 1
                        env_path = Path(env_file.replace('~', str(Path.home())))
                        if not env_path.exists():
                            config_details['missing_env_files'].append(str(env_path))
                            print(f"      ⚠️ Missing env file: {env_path}")
                        else:
                            print(f"      ✅ Env file exists: {env_path}")
                
                print(f"\n📊 Configuration Summary:")
                print(f"   Total children: {config_details['children_defined']}")
                print(f"   Enabled: {config_details['enabled_children']}")
                print(f"   Disabled: {config_details['disabled_children']}")
                print(f"   With env files: {config_details['children_with_env']}")
                
            except ImportError:
                print("❌ PyYAML not installed - cannot parse gateway config")
            except Exception as e:
                print(f"❌ Error reading gateway config: {e}")
        else:
            print("❌ Gateway configuration file not found")
        
        self.results['configuration_checks'] = config_details
        return config_details
    
    def check_api_keys(self):
        """Check API key availability"""
        print("\n🔑 CHECKING API KEY AVAILABILITY")
        print("-" * 40)
        
        env_dir = Path.home() / '.mcp' / 'docker-gateway' / '.env'
        api_keys_status = {
            'env_directory_exists': env_dir.exists(),
            'available_keys': [],
            'missing_keys': []
        }
        
        expected_env_files = [
            'brave-search.env',
            'github.env',
            'openai.env',
            'anthropic.env'
        ]
        
        if env_dir.exists():
            print(f"✅ Environment directory exists: {env_dir}")
            
            for env_file in expected_env_files:
                env_path = env_dir / env_file
                if env_path.exists():
                    api_keys_status['available_keys'].append(env_file)
                    print(f"   ✅ {env_file}: Available")
                else:
                    api_keys_status['missing_keys'].append(env_file)
                    print(f"   ❌ {env_file}: Missing")
        else:
            print(f"❌ Environment directory not found: {env_dir}")
            api_keys_status['missing_keys'] = expected_env_files
        
        self.results['api_keys_status'] = api_keys_status
        return api_keys_status
    
    def attempt_gateway_start(self):
        """Attempt to start the gateway"""
        print("\n🚀 ATTEMPTING GATEWAY START")
        print("-" * 40)
        
        start_result = {
            'attempted': False,
            'success': False,
            'error': None,
            'process_id': None
        }
        
        start_script = Path.home() / '.mcp' / 'docker-gateway' / 'start-gateway.sh'
        
        if not start_script.exists():
            print(f"❌ Start script not found: {start_script}")
            start_result['error'] = "Start script not found"
            self.results['gateway_start_attempt'] = start_result
            return start_result
        
        try:
            print(f"🔄 Starting gateway: {start_script}")
            start_result['attempted'] = True
            
            # Make script executable
            subprocess.run(['chmod', '+x', str(start_script)], check=True)
            
            # Start the gateway in background
            process = subprocess.Popen([str(start_script)], 
                                     stdout=subprocess.PIPE, 
                                     stderr=subprocess.PIPE)
            
            # Wait a moment for startup
            time.sleep(3)
            
            # Check if process is still running
            if process.poll() is None:
                start_result['success'] = True
                start_result['process_id'] = process.pid
                print(f"✅ Gateway started with PID: {process.pid}")
            else:
                stdout, stderr = process.communicate()
                start_result['error'] = f"Process exited: {stderr.decode()}"
                print(f"❌ Gateway failed to start: {stderr.decode()}")
                
        except Exception as e:
            start_result['error'] = str(e)
            print(f"❌ Error starting gateway: {e}")
        
        self.results['gateway_start_attempt'] = start_result
        return start_result
    
    def test_child_servers(self):
        """Test individual child servers"""
        print("\n🧪 TESTING CHILD SERVERS")
        print("-" * 40)
        
        child_tests = {}
        
        # Test key MCP servers that should be available
        test_servers = [
            {'name': 'filesystem', 'package': '@modelcontextprotocol/server-filesystem'},
            {'name': 'memory', 'package': '@modelcontextprotocol/server-memory'},
            {'name': 'sqlite', 'package': '@modelcontextprotocol/server-sqlite'},
            {'name': 'fetch', 'package': '@modelcontextprotocol/server-fetch'},
            {'name': 'calculator', 'package': 'calculator-mcp'},
            {'name': 'git', 'package': '@modelcontextprotocol/server-git'}
        ]
        
        for server in test_servers:
            name = server['name']
            package = server['package']
            
            test_result = {
                'package_available': False,
                'container_test': False,
                'error': None
            }
            
            try:
                print(f"   🧪 Testing {name} ({package})...")
                
                # Test package availability with npx
                result = subprocess.run(['npx', '--yes', package, '--help'], 
                                      capture_output=True, text=True, timeout=15)
                
                if result.returncode == 0:
                    test_result['package_available'] = True
                    print(f"      ✅ Package available")
                    
                    # Try a basic Docker test
                    docker_cmd = [
                        'docker', 'run', '--rm', '-i', 
                        '--cpus', '0.5', '--memory', '256m',
                        'node:20-alpine', 'sh', '-c',
                        f'npx --yes {package} --help'
                    ]
                    
                    docker_result = subprocess.run(docker_cmd, 
                                                 capture_output=True, text=True, timeout=30)
                    
                    if docker_result.returncode == 0:
                        test_result['container_test'] = True
                        print(f"      ✅ Docker container test passed")
                    else:
                        print(f"      ⚠️ Docker container test failed")
                        
                else:
                    print(f"      ❌ Package not available")
                    
            except subprocess.TimeoutExpired:
                test_result['error'] = "Test timed out"
                print(f"      ⏰ Test timed out")
            except Exception as e:
                test_result['error'] = str(e)
                print(f"      ❌ Test error: {e}")
            
            child_tests[name] = test_result
        
        self.results['child_servers'] = child_tests
        return child_tests
    
    def generate_recommendations(self):
        """Generate actionable recommendations"""
        recommendations = []
        
        # Gateway recommendations
        gateway_status = self.results.get('gateway_status', {})
        if not gateway_status.get('process_running'):
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Gateway',
                'issue': 'Gateway not running',
                'solution': 'Run: ~/.mcp/docker-gateway/start-gateway.sh',
                'command': '~/.mcp/docker-gateway/start-gateway.sh'
            })
        
        if not gateway_status.get('configuration_exists'):
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Configuration',
                'issue': 'Gateway configuration missing',
                'solution': 'Create gateway.config.yaml with child server definitions',
                'command': 'Configure ~/.mcp/docker-gateway/gateway.config.yaml'
            })
        
        # API key recommendations
        api_keys = self.results.get('api_keys_status', {})
        for missing_key in api_keys.get('missing_keys', []):
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'API Keys',
                'issue': f'Missing {missing_key}',
                'solution': f'Create ~/.mcp/docker-gateway/.env/{missing_key} with required API keys',
                'command': f'touch ~/.mcp/docker-gateway/.env/{missing_key}'
            })
        
        # Child server recommendations
        child_servers = self.results.get('child_servers', {})
        for name, status in child_servers.items():
            if not status.get('package_available'):
                recommendations.append({
                    'priority': 'MEDIUM',
                    'category': 'Child Servers',
                    'issue': f'{name} server package not available',
                    'solution': f'Install or verify {name} MCP server package',
                    'command': f'npx --yes @modelcontextprotocol/server-{name} --help'
                })
        
        self.results['recommendations'] = recommendations
        return recommendations
    
    def generate_report(self):
        """Generate comprehensive validation report"""
        print("\n📊 GENERATING VALIDATION REPORT")
        print("=" * 60)
        
        # Calculate summary statistics
        gateway_status = self.results.get('gateway_status', {})
        child_servers = self.results.get('child_servers', {})
        
        gateway_checks_passed = sum(1 for v in gateway_status.values() if v)
        total_gateway_checks = len(gateway_status)
        
        child_tests_passed = sum(1 for s in child_servers.values() 
                               if s.get('package_available'))
        total_child_tests = len(child_servers)
        
        summary = {
            'overall_status': 'HEALTHY' if gateway_checks_passed >= 3 and child_tests_passed >= 4 else 'NEEDS_ATTENTION',
            'gateway_health': f"{gateway_checks_passed}/{total_gateway_checks}",
            'child_server_health': f"{child_tests_passed}/{total_child_tests}",
            'total_issues': len(self.results.get('recommendations', [])),
            'high_priority_issues': len([r for r in self.results.get('recommendations', []) 
                                       if r.get('priority') == 'HIGH'])
        }
        
        self.results['summary'] = summary
        
        # Save detailed report
        report_path = 'MCP_SERVERS_VALIDATION_REPORT.json'
        with open(report_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"✅ Detailed report saved: {report_path}")
        
        # Print summary
        print(f"\n📈 VALIDATION SUMMARY:")
        print(f"   Overall Status: {summary['overall_status']}")
        print(f"   Gateway Health: {summary['gateway_health']}")
        print(f"   Child Server Health: {summary['child_server_health']}")
        print(f"   Total Issues: {summary['total_issues']}")
        print(f"   High Priority: {summary['high_priority_issues']}")
        
        if self.results.get('recommendations'):
            print(f"\n🔧 TOP RECOMMENDATIONS:")
            for rec in self.results['recommendations'][:3]:
                print(f"   {rec['priority']}: {rec['issue']}")
                print(f"      → {rec['solution']}")
        
        return self.results

def main():
    print("🔍 MCP SERVERS COMPREHENSIVE VALIDATION")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    validator = MCPServerValidator()
    
    # Run validation steps
    validator.check_gateway_status()
    validator.check_gateway_configuration()
    validator.check_api_keys()
    validator.attempt_gateway_start()
    validator.test_child_servers()
    validator.generate_recommendations()
    
    # Generate final report
    results = validator.generate_report()
    
    # Exit with appropriate code
    summary = results.get('summary', {})
    if summary.get('overall_status') == 'HEALTHY':
        print(f"\n🎉 VALIDATION COMPLETE - System is healthy!")
        sys.exit(0)
    else:
        print(f"\n⚠️ VALIDATION COMPLETE - Issues found, check recommendations")
        sys.exit(1)

if __name__ == "__main__":
    main()
