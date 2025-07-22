#!/usr/bin/env python3
"""
Comprehensive SSL Debugging for FlyWire CAVE API
Based on literature review and systematic debugging approaches
"""

import ssl
import socket
import requests
import urllib3
import certifi
import sys
import traceback
import subprocess
import json
import os
import time
from datetime import datetime

# Try alternative HTTP libraries
try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False

def print_section(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")

def print_result(test_name, success, details=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    Details: {details}")

class ComprehensiveSSLDebugger:
    def __init__(self):
        self.target_host = "cave.flywire.ai"
        self.target_port = 443
        self.base_url = f"https://{self.target_host}"
        self.results = {}
        
    def test_1_environment_info(self):
        """Test 1: Gather environment information"""
        print_section("ENVIRONMENT INFORMATION")
        
        try:
            print(f"Python Version: {sys.version}")
            print(f"OpenSSL Version: {ssl.OPENSSL_VERSION}")
            print(f"Requests Version: {requests.__version__}")
            print(f"urllib3 Version: {urllib3.__version__}")
            print(f"Certifi Version: {certifi.__version__}")
            
            if HTTPX_AVAILABLE:
                import httpx
                print(f"httpx Version: {httpx.__version__}")
            else:
                print("httpx: Not available")
                
            if AIOHTTP_AVAILABLE:
                import aiohttp
                print(f"aiohttp Version: {aiohttp.__version__}")
            else:
                print("aiohttp: Not available")
                
        except Exception as e:
            print(f"Error gathering environment info: {e}")

    def test_2_basic_connectivity(self):
        """Test 2: Basic network connectivity"""
        print_section("BASIC NETWORK CONNECTIVITY")
        
        try:
            # DNS Resolution
            import socket
            ip_addresses = socket.gethostbyname_ex(self.target_host)[2]
            print_result("DNS Resolution", True, f"IPs: {ip_addresses}")
            
            # TCP Connection
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            result = sock.connect_ex((self.target_host, self.target_port))
            sock.close()
            print_result("TCP Connection", result == 0, f"Port {self.target_port}")
            
        except Exception as e:
            print_result("Basic Connectivity", False, str(e))

    def test_3_ssl_contexts(self):
        """Test 3: Different SSL contexts"""
        print_section("SSL CONTEXT TESTING")
        
        contexts = [
            ("Default", ssl.create_default_context()),
            ("Unverified", ssl._create_unverified_context()),
            ("TLS 1.2", ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)),
        ]
        
        for name, context in contexts:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(10)
                
                with context.wrap_socket(sock, server_hostname=self.target_host) as ssock:
                    ssock.connect((self.target_host, self.target_port))
                    cert = ssock.getpeercert()
                    print_result(f"SSL Context ({name})", True, f"Cert CN: {cert.get('subject', [[['', 'Unknown']]])[0][0][1]}")
                    
            except Exception as e:
                print_result(f"SSL Context ({name})", False, str(e))

    def test_4_requests_variations(self):
        """Test 4: Different requests configurations"""
        print_section("REQUESTS LIBRARY VARIATIONS")
        
        test_url = f"{self.base_url}/api/v2"
        
        # Standard requests
        try:
            response = requests.get(test_url, timeout=10)
            print_result("Standard requests", True, f"Status: {response.status_code}")
        except Exception as e:
            print_result("Standard requests", False, str(e))

        # Disable SSL verification
        try:
            response = requests.get(test_url, verify=False, timeout=10)
            print_result("No SSL verification", True, f"Status: {response.status_code}")
        except Exception as e:
            print_result("No SSL verification", False, str(e))

        # Custom CA bundle
        try:
            response = requests.get(test_url, verify=certifi.where(), timeout=10)
            print_result("Custom CA bundle", True, f"Status: {response.status_code}")
        except Exception as e:
            print_result("Custom CA bundle", False, str(e))

        # Legacy TLS
        try:
            session = requests.Session()
            session.mount('https://', requests.adapters.HTTPAdapter(
                socket_options=[(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)]
            ))
            response = session.get(test_url, timeout=10)
            print_result("Legacy TLS Session", True, f"Status: {response.status_code}")
        except Exception as e:
            print_result("Legacy TLS Session", False, str(e))

    def test_5_httpx_alternative(self):
        """Test 5: httpx as alternative (from literature)"""
        print_section("HTTPX ALTERNATIVE TESTING")
        
        if not HTTPX_AVAILABLE:
            print_result("httpx Library", False, "Not installed")
            return
            
        test_url = f"{self.base_url}/api/v2"
        
        try:
            import httpx
            response = httpx.get(test_url, timeout=10)
            print_result("httpx Standard", True, f"Status: {response.status_code}")
        except Exception as e:
            print_result("httpx Standard", False, str(e))

        try:
            import httpx
            response = httpx.get(test_url, verify=False, timeout=10)
            print_result("httpx No Verify", True, f"Status: {response.status_code}")
        except Exception as e:
            print_result("httpx No Verify", False, str(e))

    def test_6_caveclient_specific(self):
        """Test 6: CAVEclient specific testing"""
        print_section("CAVECLIENT SPECIFIC TESTING")
        
        try:
            # Check if caveclient is available
            import caveclient
            print_result("CAVEclient Import", True, f"Version: {caveclient.__version__}")
            
            # Test basic client creation
            client = caveclient.CAVEclient(
                server_address="https://cave.flywire.ai",
                dataset_name="flywire_fafb_production"
            )
            print_result("CAVEclient Creation", True, "Client created successfully")
            
        except ImportError:
            print_result("CAVEclient Import", False, "Package not installed")
        except Exception as e:
            print_result("CAVEclient Creation", False, str(e))

    def test_7_alternative_endpoints(self):
        """Test 7: Alternative endpoints and protocols"""
        print_section("ALTERNATIVE ENDPOINTS")
        
        endpoints = [
            ("HTTPS Root", "https://cave.flywire.ai/"),
            ("HTTP (if available)", "http://cave.flywire.ai/"),
            ("Codex API", "https://codex.flywire.ai/api"),
            ("Different Port", "https://cave.flywire.ai:8443/"),
        ]
        
        for name, url in endpoints:
            try:
                response = requests.get(url, timeout=10, verify=False)
                print_result(name, True, f"Status: {response.status_code}")
            except Exception as e:
                print_result(name, False, str(e))

    def test_8_system_tools(self):
        """Test 8: System-level SSL tools"""
        print_section("SYSTEM SSL TOOLS")
        
        commands = [
            ("OpenSSL s_client", ["openssl", "s_client", "-connect", f"{self.target_host}:443", "-servername", self.target_host]),
            ("Curl test", ["curl", "-I", "--max-time", "10", f"https://{self.target_host}/"]),
            ("Curl no verify", ["curl", "-I", "--max-time", "10", "-k", f"https://{self.target_host}/"]),
        ]
        
        for name, cmd in commands:
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=15, input="\n")
                success = result.returncode == 0
                details = f"Return code: {result.returncode}"
                if not success and result.stderr:
                    details += f" | Error: {result.stderr[:100]}"
                print_result(name, success, details)
            except subprocess.TimeoutExpired:
                print_result(name, False, "Command timed out")
            except Exception as e:
                print_result(name, False, str(e))

    def test_9_workaround_strategies(self):
        """Test 9: Known workaround strategies from literature"""
        print_section("WORKAROUND STRATEGIES")
        
        # Strategy 1: Downgrade urllib3
        try:
            import urllib3
            print(f"Current urllib3 version: {urllib3.__version__}")
            print("💡 Workaround: Try downgrading urllib3 to < 1.26.0")
        except Exception as e:
            print(f"urllib3 info error: {e}")

        # Strategy 2: Environment variables
        env_vars = [
            ("PYTHONHTTPSVERIFY", "Disable Python HTTPS verification"),
            ("REQUESTS_CA_BUNDLE", "Custom CA bundle path"),
            ("CURL_CA_BUNDLE", "Custom CA bundle for curl"),
        ]
        
        for var, desc in env_vars:
            value = os.environ.get(var, "Not set")
            print(f"💡 {var}: {value} ({desc})")

        # Strategy 3: Alternative CA approaches
        print("💡 Alternative CA bundle locations:")
        ca_locations = [
            "/etc/ssl/certs/ca-certificates.crt",
            "/etc/pki/tls/certs/ca-bundle.crt",
            "/usr/local/share/ca-certificates/",
            certifi.where(),
        ]
        
        for ca_path in ca_locations:
            exists = os.path.exists(ca_path) if ca_path else False
            print(f"   {ca_path}: {'✅' if exists else '❌'}")

    def generate_solutions_report(self):
        """Generate a comprehensive solutions report"""
        print_section("RECOMMENDED SOLUTIONS")
        
        solutions = [
            "🔧 **Primary Solutions (from literature)**:",
            "   1. Use httpx instead of requests library",
            "   2. Downgrade urllib3 to version < 1.26.0",
            "   3. Use CAVEclient official library instead of direct requests",
            "",
            "🔧 **SSL Configuration Solutions**:",
            "   4. Set PYTHONHTTPSVERIFY=0 (development only)",
            "   5. Use custom SSL context with legacy protocols",
            "   6. Configure client certificates if required",
            "",
            "🔧 **Network-level Solutions**:",
            "   7. Check for corporate firewall/proxy interference",
            "   8. Try from different network (mobile hotspot test)",
            "   9. Use VPN to bypass regional SSL filtering",
            "",
            "🔧 **Server-specific Solutions**:",
            "   10. Contact FlyWire support for SSL configuration",
            "   11. Check if authentication token is required",
            "   12. Verify if client certificates are needed",
        ]
        
        for solution in solutions:
            print(solution)

    def run_all_tests(self):
        """Run all SSL debugging tests"""
        print("🔍 Comprehensive SSL Debugging for FlyWire CAVE API")
        print(f"Target: {self.target_host}")
        print(f"Time: {datetime.now().isoformat()}")
        
        test_methods = [
            self.test_1_environment_info,
            self.test_2_basic_connectivity,
            self.test_3_ssl_contexts,
            self.test_4_requests_variations,
            self.test_5_httpx_alternative,
            self.test_6_caveclient_specific,
            self.test_7_alternative_endpoints,
            self.test_8_system_tools,
            self.test_9_workaround_strategies,
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ Test {test_method.__name__} failed: {e}")
                traceback.print_exc()
        
        self.generate_solutions_report()

if __name__ == "__main__":
    debugger = ComprehensiveSSLDebugger()
    debugger.run_all_tests() 