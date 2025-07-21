#!/usr/bin/env python3
"""
CHRIMSON Screenshot Analysis Script
Analyzes Cypress test screenshots to identify working features and issues
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CHRIMSONScreenshotAnalyzer:
    """Analyze Cypress screenshots to validate CHRIMSON system features"""
    
    def __init__(self):
        self.screenshot_dir = Path('cypress/screenshots')
        self.analysis_results = {}
        self.priority_fixes = []
        
    def analyze_all_screenshots(self) -> Dict[str, Any]:
        """Analyze all Cypress screenshots and generate priority fix list"""
        try:
            logger.info("🔍 Starting CHRIMSON screenshot analysis...")
            
            # Check if screenshots exist
            if not self.screenshot_dir.exists():
                logger.error("❌ No Cypress screenshots found! Run tests first.")
                return self._generate_no_screenshots_report()
            
            screenshots = list(self.screenshot_dir.glob('**/*.png'))
            logger.info(f"📸 Found {len(screenshots)} screenshots to analyze")
            
            # Analyze each test category
            self.analysis_results = {
                'frontend_loading': self._analyze_frontend_loading(),
                'backend_connection': self._analyze_backend_connection(),
                'fem_data_loading': self._analyze_fem_data_loading(),
                'circuit_search': self._analyze_circuit_search(),
                'neuroglancer_viz': self._analyze_neuroglancer_visualization(),
                'behavioral_arena': self._analyze_behavioral_arena(),
                'chrimson_activity': self._analyze_chrimson_activity(),
                'synchronization': self._analyze_synchronization(),
                'health_status': self._analyze_health_status(),
                'integration': self._analyze_integration()
            }
            
            # Generate priority fixes
            self._generate_priority_fixes()
            
            # Create comprehensive report
            return self._generate_analysis_report()
            
        except Exception as e:
            logger.error(f"❌ Analysis failed: {e}")
            return {'error': str(e), 'status': 'analysis_failed'}
    
    def _analyze_frontend_loading(self) -> Dict[str, Any]:
        """Analyze frontend loading screenshots"""
        screenshots = self._find_screenshots('01-frontend')
        
        if not screenshots:
            return {
                'status': 'MISSING',
                'issue': 'No frontend loading screenshots found',
                'priority': 'CRITICAL'
            }
        
        # Check for specific UI elements in screenshot names
        issues = []
        features = []
        
        for screenshot in screenshots:
            name = screenshot.name.lower()
            if 'loaded' in name:
                features.append('UI loaded successfully')
            elif 'loading' in name:
                features.append('Loading state captured')
            elif 'error' in name:
                issues.append('Frontend loading errors detected')
        
        return {
            'status': 'CAPTURED' if features else 'ISSUES',
            'features_working': features,
            'issues_found': issues,
            'priority': 'HIGH' if issues else 'LOW',
            'screenshot_count': len(screenshots)
        }
    
    def _analyze_backend_connection(self) -> Dict[str, Any]:
        """Analyze Python backend connection screenshots"""
        screenshots = self._find_screenshots('02-backend')
        
        if not screenshots:
            return {
                'status': 'MISSING',
                'issue': 'No backend connection screenshots found',
                'priority': 'CRITICAL'
            }
        
        issues = []
        features = []
        
        for screenshot in screenshots:
            name = screenshot.name.lower()
            if 'connected' in name:
                features.append('Backend connection successful')
            elif 'disconnected' in name:
                issues.append('Backend connection failed')
            elif 'attempt' in name:
                features.append('Connection attempt made')
        
        # Backend connection is critical for real FlyWire data
        priority = 'CRITICAL' if issues else 'LOW'
        
        return {
            'status': 'CONNECTED' if any('connected' in f for f in features) else 'DISCONNECTED',
            'features_working': features,
            'issues_found': issues,
            'priority': priority,
            'screenshot_count': len(screenshots)
        }
    
    def _analyze_fem_data_loading(self) -> Dict[str, Any]:
        """Analyze FEM data loading screenshots"""
        screenshots = self._find_screenshots('03-fem-data')
        
        if not screenshots:
            return {
                'status': 'MISSING',
                'issue': 'No FEM data loading screenshots found',
                'priority': 'HIGH'
            }
        
        issues = []
        features = []
        
        for screenshot in screenshots:
            name = screenshot.name.lower()
            if 'loaded' in name:
                features.append('FEM data loaded successfully')
            elif 'loading' in name:
                features.append('FEM data loading process captured')
            elif 'error' in name:
                issues.append('FEM data loading errors')
        
        return {
            'status': 'WORKING' if features else 'ISSUES',
            'features_working': features,
            'issues_found': issues,
            'priority': 'MEDIUM',
            'screenshot_count': len(screenshots)
        }
    
    def _analyze_circuit_search(self) -> Dict[str, Any]:
        """Analyze REAL circuit search screenshots"""
        screenshots = self._find_screenshots('04-circuit')
        
        if not screenshots:
            return {
                'status': 'MISSING',
                'issue': 'No circuit search screenshots found',
                'priority': 'CRITICAL'
            }
        
        issues = []
        features = []
        
        for screenshot in screenshots:
            name = screenshot.name.lower()
            if 'results' in name:
                features.append('Circuit search results obtained')
            elif 'found' in name:
                features.append('Circuit types found')
            elif 'started' in name:
                features.append('Circuit search initiated')
            elif 'error' in name or 'failed' in name:
                issues.append('Circuit search failed')
        
        # Circuit search is critical for REAL data requirement
        priority = 'CRITICAL' if issues or not features else 'LOW'
        
        return {
            'status': 'WORKING' if features and not issues else 'FAILED',
            'features_working': features,
            'issues_found': issues,
            'priority': priority,
            'screenshot_count': len(screenshots)
        }
    
    def _analyze_neuroglancer_visualization(self) -> Dict[str, Any]:
        """Analyze Neuroglancer 3D visualization screenshots"""
        screenshots = self._find_screenshots('05-neuroglancer')
        
        if not screenshots:
            return {
                'status': 'MISSING',
                'issue': 'No Neuroglancer visualization screenshots found',
                'priority': 'CRITICAL'
            }
        
        issues = []
        features = []
        
        for screenshot in screenshots:
            name = screenshot.name.lower()
            if 'iframe-loaded' in name:
                features.append('Neuroglancer iframe loaded')
            elif 'controls' in name:
                features.append('Neuroglancer controls visible')
            elif 'started' in name:
                features.append('Neuroglancer creation initiated')
            elif 'error' in name or 'failed' in name:
                issues.append('Neuroglancer visualization failed')
        
        # Neuroglancer is core feature
        priority = 'CRITICAL' if issues or not features else 'LOW'
        
        return {
            'status': 'WORKING' if features and not issues else 'FAILED',
            'features_working': features,
            'issues_found': issues,
            'priority': priority,
            'screenshot_count': len(screenshots)
        }
    
    def _analyze_behavioral_arena(self) -> Dict[str, Any]:
        """Analyze Three.js behavioral arena screenshots"""
        screenshots = self._find_screenshots('06-behavioral')
        
        if not screenshots:
            return {
                'status': 'MISSING',
                'issue': 'No behavioral arena screenshots found',
                'priority': 'HIGH'
            }
        
        issues = []
        features = []
        
        for screenshot in screenshots:
            name = screenshot.name.lower()
            if 'canvas' in name:
                features.append('Three.js canvas rendered')
            elif 'controls' in name:
                features.append('Simulation controls visible')
            elif 'loaded' in name:
                features.append('Behavioral arena loaded')
            elif 'error' in name:
                issues.append('Behavioral arena errors')
        
        return {
            'status': 'WORKING' if features else 'ISSUES',
            'features_working': features,
            'issues_found': issues,
            'priority': 'MEDIUM',
            'screenshot_count': len(screenshots)
        }
    
    def _analyze_chrimson_activity(self) -> Dict[str, Any]:
        """Analyze CHRIMSON red light activity screenshots"""
        screenshots = self._find_screenshots('07-chrimson')
        
        if not screenshots:
            return {
                'status': 'MISSING',
                'issue': 'No CHRIMSON activity screenshots found',
                'priority': 'CRITICAL'
            }
        
        issues = []
        features = []
        
        for screenshot in screenshots:
            name = screenshot.name.lower()
            if 'red-light' in name:
                features.append('Red light activation captured')
            elif 'simulation-active' in name:
                features.append('CHRIMSON simulation running')
            elif 'enabled' in name:
                features.append('Optogenetic stimulus enabled')
            elif 'error' in name:
                issues.append('CHRIMSON activity errors')
        
        # CHRIMSON is the core feature
        priority = 'CRITICAL' if issues or not features else 'LOW'
        
        return {
            'status': 'WORKING' if features and not issues else 'FAILED',
            'features_working': features,
            'issues_found': issues,
            'priority': priority,
            'screenshot_count': len(screenshots)
        }
    
    def _analyze_synchronization(self) -> Dict[str, Any]:
        """Analyze real-time synchronization screenshots"""
        screenshots = self._find_screenshots('08-')
        
        if not screenshots:
            return {
                'status': 'MISSING',
                'issue': 'No synchronization screenshots found',
                'priority': 'HIGH'
            }
        
        issues = []
        features = []
        
        for screenshot in screenshots:
            name = screenshot.name.lower()
            if 'sync' in name:
                features.append('Timeline synchronization working')
            elif 'activity-updates' in name:
                features.append('Activity updates synchronized')
            elif 'full-system-active' in name:
                features.append('Full system synchronization')
            elif 'error' in name:
                issues.append('Synchronization errors')
        
        return {
            'status': 'WORKING' if features else 'ISSUES',
            'features_working': features,
            'issues_found': issues,
            'priority': 'HIGH' if issues else 'MEDIUM',
            'screenshot_count': len(screenshots)
        }
    
    def _analyze_health_status(self) -> Dict[str, Any]:
        """Analyze system health screenshots"""
        screenshots = self._find_screenshots('09-health')
        
        if not screenshots:
            return {
                'status': 'MISSING',
                'issue': 'No health status screenshots found',
                'priority': 'MEDIUM'
            }
        
        issues = []
        features = []
        
        for screenshot in screenshots:
            name = screenshot.name.lower()
            if 'status' in name:
                features.append('Health status displayed')
            elif 'component' in name:
                features.append('Health component loaded')
            elif 'error-handling' in name:
                features.append('Error handling visible')
        
        return {
            'status': 'WORKING' if features else 'MISSING',
            'features_working': features,
            'issues_found': issues,
            'priority': 'LOW',
            'screenshot_count': len(screenshots)
        }
    
    def _analyze_integration(self) -> Dict[str, Any]:
        """Analyze full integration test screenshots"""
        screenshots = self._find_screenshots('10-')
        
        if not screenshots:
            return {
                'status': 'MISSING',
                'issue': 'No integration test screenshots found',
                'priority': 'CRITICAL'
            }
        
        issues = []
        features = []
        step_count = 0
        
        for screenshot in screenshots:
            name = screenshot.name.lower()
            if 'step' in name:
                step_count += 1
                features.append(f'Integration step {step_count} completed')
            elif 'complete' in name:
                features.append('Full integration completed')
            elif 'error' in name or 'failed' in name:
                issues.append('Integration test failed')
        
        # Full integration is critical
        priority = 'CRITICAL' if issues or step_count < 5 else 'LOW'
        
        return {
            'status': 'COMPLETE' if step_count >= 5 and not issues else 'INCOMPLETE',
            'features_working': features,
            'issues_found': issues,
            'priority': priority,
            'screenshot_count': len(screenshots),
            'integration_steps': step_count
        }
    
    def _find_screenshots(self, pattern: str) -> List[Path]:
        """Find screenshots matching a pattern"""
        screenshots = []
        for screenshot in self.screenshot_dir.glob('**/*.png'):
            if pattern in screenshot.name.lower():
                screenshots.append(screenshot)
        return screenshots
    
    def _generate_priority_fixes(self):
        """Generate prioritized list of fixes needed"""
        self.priority_fixes = []
        
        for feature, analysis in self.analysis_results.items():
            if analysis.get('priority') == 'CRITICAL':
                self.priority_fixes.append({
                    'feature': feature,
                    'priority': 'CRITICAL',
                    'status': analysis.get('status'),
                    'issues': analysis.get('issues_found', []),
                    'action_needed': self._get_fix_action(feature, analysis)
                })
        
        # Add HIGH priority fixes
        for feature, analysis in self.analysis_results.items():
            if analysis.get('priority') == 'HIGH':
                self.priority_fixes.append({
                    'feature': feature,
                    'priority': 'HIGH',
                    'status': analysis.get('status'),
                    'issues': analysis.get('issues_found', []),
                    'action_needed': self._get_fix_action(feature, analysis)
                })
        
        # Sort by priority
        priority_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        self.priority_fixes.sort(key=lambda x: priority_order.get(x['priority'], 3))
    
    def _get_fix_action(self, feature: str, analysis: Dict[str, Any]) -> str:
        """Get recommended fix action for a feature"""
        status = analysis.get('status', 'UNKNOWN')
        
        action_map = {
            'backend_connection': {
                'DISCONNECTED': 'Start Python backend with real FlyWire connection',
                'MISSING': 'Implement backend connection validation'
            },
            'circuit_search': {
                'FAILED': 'Fix REAL FlyWire CAVE API queries',
                'MISSING': 'Implement circuit search functionality'
            },
            'neuroglancer_viz': {
                'FAILED': 'Fix Neuroglancer iframe integration',
                'MISSING': 'Implement Neuroglancer visualization'
            },
            'chrimson_activity': {
                'FAILED': 'Fix CHRIMSON red light simulation',
                'MISSING': 'Implement CHRIMSON activity system'
            },
            'integration': {
                'INCOMPLETE': 'Fix full system integration workflow',
                'MISSING': 'Implement end-to-end integration'
            }
        }
        
        return action_map.get(feature, {}).get(status, f'Review {feature} implementation')
    
    def _generate_analysis_report(self) -> Dict[str, Any]:
        """Generate comprehensive analysis report"""
        working_features = []
        broken_features = []
        missing_features = []
        
        for feature, analysis in self.analysis_results.items():
            status = analysis.get('status', 'UNKNOWN')
            if status in ['WORKING', 'COMPLETE', 'CONNECTED']:
                working_features.append(feature)
            elif status in ['FAILED', 'DISCONNECTED', 'ISSUES']:
                broken_features.append(feature)
            elif status in ['MISSING', 'INCOMPLETE']:
                missing_features.append(feature)
        
        return {
            'analysis_complete': True,
            'total_features': len(self.analysis_results),
            'working_features': working_features,
            'broken_features': broken_features,
            'missing_features': missing_features,
            'priority_fixes': self.priority_fixes,
            'detailed_analysis': self.analysis_results,
            'recommendations': self._generate_recommendations()
        }
    
    def _generate_recommendations(self) -> List[str]:
        """Generate implementation recommendations"""
        recommendations = []
        
        critical_count = len([f for f in self.priority_fixes if f['priority'] == 'CRITICAL'])
        
        if critical_count > 0:
            recommendations.append(f"🚨 {critical_count} CRITICAL issues must be fixed before deployment")
        
        recommendations.extend([
            "1. Fix backend connection to ensure REAL FlyWire data access",
            "2. Implement robust error handling for CAVE API failures", 
            "3. Test Neuroglancer iframe integration thoroughly",
            "4. Validate CHRIMSON red light simulation accuracy",
            "5. Ensure full system synchronization works end-to-end"
        ])
        
        return recommendations
    
    def _generate_no_screenshots_report(self) -> Dict[str, Any]:
        """Generate report when no screenshots are found"""
        return {
            'analysis_complete': False,
            'error': 'No Cypress screenshots found',
            'action_needed': 'Run Cypress tests first: npx cypress run',
            'priority_fixes': [
                {
                    'feature': 'cypress_tests',
                    'priority': 'CRITICAL',
                    'status': 'NOT_RUN',
                    'action_needed': 'Execute Cypress test suite to generate validation screenshots'
                }
            ]
        }

def main():
    """Main analysis function"""
    print("🔍 CHRIMSON Screenshot Analysis")
    print("🔴 Analyzing system validation screenshots...")
    print()
    
    analyzer = CHRIMSONScreenshotAnalyzer()
    results = analyzer.analyze_all_screenshots()
    
    # Print results
    print("📊 ANALYSIS RESULTS:")
    print("=" * 50)
    
    if results.get('analysis_complete'):
        print(f"✅ Working Features: {len(results['working_features'])}")
        print(f"❌ Broken Features: {len(results['broken_features'])}")
        print(f"⚠️ Missing Features: {len(results['missing_features'])}")
        print()
        
        print("🚨 PRIORITY FIXES:")
        for i, fix in enumerate(results['priority_fixes'], 1):
            print(f"{i}. [{fix['priority']}] {fix['feature']}")
            print(f"   Status: {fix['status']}")
            print(f"   Action: {fix['action_needed']}")
            print()
        
        print("💡 RECOMMENDATIONS:")
        for rec in results['recommendations']:
            print(f"   {rec}")
    else:
        print(f"❌ Analysis failed: {results.get('error')}")
        print(f"🔧 Action needed: {results.get('action_needed')}")
    
    # Save detailed results
    with open('chrimson-analysis-results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print()
    print("💾 Detailed results saved to: chrimson-analysis-results.json")

if __name__ == '__main__':
    main() 