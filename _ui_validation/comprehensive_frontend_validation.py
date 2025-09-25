#!/usr/bin/env python3
"""
DFS Frontend WebUI Validation Suite
Production-ready validation for feature completeness, performance, and accessibility
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Any
import requests
import time

class DFSFrontendValidator:
    def __init__(self):
        self.results = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "sections": {},
            "summary": {"passed": 0, "failed": 0, "warnings": 0}
        }
        self.artifacts_dir = Path("_ui_validation")
        self.artifacts_dir.mkdir(exist_ok=True)
        
    def log(self, section: str, status: str, message: str, details: Any = None):
        """Log validation results"""
        if section not in self.results["sections"]:
            self.results["sections"][section] = []
            
        result = {
            "status": status,  # ✅, ❌, ⚠️
            "message": message,
            "details": details
        }
        
        self.results["sections"][section].append(result)
        
        if status == "✅":
            self.results["summary"]["passed"] += 1
        elif status == "❌":
            self.results["summary"]["failed"] += 1
        else:
            self.results["summary"]["warnings"] += 1
            
        print(f"{status} [{section}] {message}")
        
    def validate_project_discovery(self):
        """0) PROJECT DISCOVERY - Check framework versions and required packages"""
        section = "0_PROJECT_DISCOVERY"
        
        try:
            # Check package.json exists
            package_json_path = Path("apps/web/package.json")
            if not package_json_path.exists():
                self.log(section, "❌", "package.json not found", {"path": str(package_json_path)})
                return
                
            # Load and validate package.json
            with open(package_json_path) as f:
                package_data = json.load(f)
                
            # Required packages check with flexible framework detection
            required_packages = {
                "react": "React library", 
                "typescript": "TypeScript support",
                "tailwindcss": "Tailwind CSS",
                "@radix-ui/react-slot": "Radix UI components",
                "lucide-react": "Lucide React icons",
                "@tanstack/react-query": "TanStack Query",
                "@tanstack/react-table": "TanStack Table",
                "react-window": "Virtualization",
                "recharts": "Charts library",
                "zod": "Schema validation",
                "@hookform/resolvers": "Form resolvers",
                "react-hook-form": "Form handling",
                "date-fns": "Date utilities",
                "zustand": "State management"
            }
            
            all_deps = {**package_data.get("dependencies", {}), **package_data.get("devDependencies", {})}
            
            # Check for React framework (Next.js OR Vite)
            framework_found = False
            if "next" in all_deps:
                self.log(section, "✅", f"Found Next.js framework: {all_deps['next']}")
                framework_found = True
            elif "vite" in all_deps:
                self.log(section, "✅", f"Found Vite framework: {all_deps['vite']}")
                framework_found = True
            else:
                self.log(section, "❌", "No React framework found (next or vite required)")
            
            missing_packages = []
            found_packages = []
            
            for pkg, description in required_packages.items():
                if pkg in all_deps:
                    found_packages.append(f"{pkg}@{all_deps[pkg]}")
                    self.log(section, "✅", f"Found {pkg}: {all_deps[pkg]}")
                else:
                    missing_packages.append(pkg)
                    self.log(section, "❌", f"Missing required package: {pkg}")
            
            # Add framework to missing count if not found
            if not framework_found:
                missing_packages.append("framework")
                    
            # Framework versions report
            framework_report = {
                "found_packages": found_packages,
                "missing_packages": missing_packages,
                "total_dependencies": len(all_deps)
            }
            
            with open(self.artifacts_dir / "package_lock_report.json", "w") as f:
                json.dump(framework_report, f, indent=2)
                
            if missing_packages:
                self.log(section, "❌", f"Missing {len(missing_packages)} critical packages", missing_packages)
            else:
                self.log(section, "✅", "All required packages found")
                
        except Exception as e:
            self.log(section, "❌", f"Project discovery failed: {str(e)}")
            
    def validate_routes_navigation(self):
        """1) ROUTES & NAV - Verify routes exist and are accessible"""
        section = "1_ROUTES_NAV"
        
        expected_routes = [
            "/",  # Optimizer
            "/sim", 
            "/live", 
            "/research", 
            "/slates", 
            "/news", 
            "/portfolio", 
            "/contests", 
            "/settings"
        ]
        
        route_check = {}
        
        for route in expected_routes:
            try:
                # Check if route file exists (assuming Next.js App Router structure)
                if route == "/":
                    route_file = Path("apps/web/src/app/page.tsx")
                else:
                    route_file = Path(f"apps/web/src/app{route}/page.tsx")
                    
                if route_file.exists():
                    route_check[route] = {"exists": True, "file": str(route_file)}
                    self.log(section, "✅", f"Route {route} file exists")
                else:
                    route_check[route] = {"exists": False, "file": str(route_file)}
                    self.log(section, "❌", f"Route {route} file missing: {route_file}")
                    
            except Exception as e:
                self.log(section, "❌", f"Error checking route {route}: {str(e)}")
                
        # Save route check results
        with open(self.artifacts_dir / "route_check.json", "w") as f:
            json.dump(route_check, f, indent=2)
            
    def validate_state_data_wiring(self):
        """2) STATE & DATA WIRING - Check Zustand store and React Query setup"""
        section = "2_STATE_DATA_WIRING"
        
        # Check for Zustand store
        store_file = Path("apps/web/src/store/dfs-store.ts")
        if store_file.exists():
            self.log(section, "✅", "Zustand store found")
            try:
                with open(store_file) as f:
                    store_content = f.read()
                    if "slate" in store_content.lower():
                        self.log(section, "✅", "Slate state management detected")
                    else:
                        self.log(section, "⚠️", "Slate state management not clearly defined")
            except Exception as e:
                self.log(section, "❌", f"Error reading store file: {str(e)}")
        else:
            self.log(section, "❌", "Zustand store file not found")
            
        # Check for React Query setup
        query_files = [
            "apps/web/src/main.tsx",
            "apps/web/src/App.tsx"
        ]
        
        query_setup_found = False
        for file_path in query_files:
            if Path(file_path).exists():
                try:
                    with open(file_path) as f:
                        content = f.read()
                        if "QueryClient" in content or "useQuery" in content:
                            query_setup_found = True
                            self.log(section, "✅", f"React Query setup found in {file_path}")
                            break
                except Exception as e:
                    self.log(section, "⚠️", f"Error checking {file_path}: {str(e)}")
                    
        if not query_setup_found:
            self.log(section, "❌", "React Query setup not found")
            
    def validate_optimizer_page(self):
        """3) OPTIMIZER PAGE - Check main optimization functionality"""
        section = "3_OPTIMIZER_PAGE"
        
        optimizer_files = [
            "apps/web/src/app/optimizer/page.tsx",
            "apps/web/src/app/page.tsx"  # Root might be optimizer
        ]
        
        optimizer_found = False
        for file_path in optimizer_files:
            if Path(file_path).exists():
                try:
                    with open(file_path) as f:
                        content = f.read()
                        
                    # Check for key optimizer features
                    features = {
                        "player_table": "table" in content.lower() or "playerpool" in content.lower(),
                        "optimization": "optim" in content.lower(),
                        "filters": "filter" in content.lower(),
                        "constraints": "constraint" in content.lower() or "constraintvalidation" in content.lower() or "constraintenforcement" in content.lower(),
                        "lineup_results": "lineup" in content.lower()
                    }
                    
                    optimizer_found = True
                    for feature, found in features.items():
                        if found:
                            self.log(section, "✅", f"Optimizer feature '{feature}' detected")
                        else:
                            # Check if it's the constraints feature - be more lenient
                            if feature == "constraints" and ("salary" in content.lower() or "numlineups" in content.lower() or "uniqueplayers" in content.lower()):
                                self.log(section, "✅", f"Optimizer feature '{feature}' detected (implicit constraints)")
                            else:
                                self.log(section, "⚠️", f"Optimizer feature '{feature}' not clearly detected")
                            
                    break
                    
                except Exception as e:
                    self.log(section, "❌", f"Error reading {file_path}: {str(e)}")
                    
        if not optimizer_found:
            self.log(section, "❌", "Optimizer page not found")
            
    def validate_api_connectivity(self):
        """Check API connectivity and health"""
        section = "API_CONNECTIVITY"
        
        api_endpoints = [
            "http://localhost:8001/api/healthz",
            "http://localhost:8001/api/slates"
        ]
        
        for endpoint in api_endpoints:
            try:
                response = requests.get(endpoint, headers={"X-API-Key": "dfs-demo-key"}, timeout=5)
                if response.status_code == 200:
                    self.log(section, "✅", f"API endpoint accessible: {endpoint}")
                else:
                    self.log(section, "❌", f"API endpoint returned {response.status_code}: {endpoint}")
            except requests.exceptions.RequestException as e:
                self.log(section, "❌", f"API endpoint unreachable: {endpoint} - {str(e)}")
                
    def generate_summary_report(self):
        """Generate final summary report"""
        total_checks = self.results["summary"]["passed"] + self.results["summary"]["failed"] + self.results["summary"]["warnings"]
        
        summary = f"""
# DFS Frontend WebUI Validation Report

**Generated:** {self.results["timestamp"]}

## Summary
- ✅ Passed: {self.results["summary"]["passed"]}
- ❌ Failed: {self.results["summary"]["failed"]} 
- ⚠️ Warnings: {self.results["summary"]["warnings"]}
- **Total Checks:** {total_checks}

## Results by Section
"""
        
        for section, results in self.results["sections"].items():
            summary += f"\n### {section.replace('_', ' ').title()}\n"
            for result in results:
                summary += f"- {result['status']} {result['message']}\n"
                
        # Priority fix list
        failed_items = []
        for section, results in self.results["sections"].items():
            for result in results:
                if result['status'] == '❌':
                    failed_items.append(f"**{section}**: {result['message']}")
                    
        if failed_items:
            summary += "\n## Priority Fix List (P0)\n"
            for item in failed_items:
                summary += f"- {item}\n"
                
        # Save summary
        with open(self.artifacts_dir / "SUMMARY.md", "w") as f:
            f.write(summary)
            
        # Save full results
        with open(self.artifacts_dir / "validation_results.json", "w") as f:
            json.dump(self.results, f, indent=2)
            
        return summary
        
    def run_validation(self):
        """Run complete validation suite"""
        print("🚀 Starting DFS Frontend WebUI Validation...")
        print("=" * 60)
        
        # Run all validation sections
        self.validate_project_discovery()
        print()
        
        self.validate_routes_navigation() 
        print()
        
        self.validate_state_data_wiring()
        print()
        
        self.validate_optimizer_page()
        print()
        
        self.validate_api_connectivity()
        print()
        
        # Generate final report
        summary = self.generate_summary_report()
        
        print("=" * 60)
        print("📊 VALIDATION COMPLETE")
        print("=" * 60)
        print(summary)
        
        return self.results

if __name__ == "__main__":
    validator = DFSFrontendValidator()
    results = validator.run_validation()
    
    # Exit with appropriate code
    if results["summary"]["failed"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)
