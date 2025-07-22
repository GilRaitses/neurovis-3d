#!/usr/bin/env python3
"""
Systematic SSL Debugging for FlyWire CAVE API
Comprehensive diagnosis of SSL connection issues
"""

import ssl
import socket
import requests
import urllib3
import certifi
import sys
import traceback
from datetime import datetime
import subprocess
import json
import os

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_result(test_name, success, details=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    Details: {details}")

class SSLDebugger:
    def __init__(self):
        self.target_host = "cave.flywire.ai"
        self.target_port = 443
        self.results = {}
        
    def test_basic_connectivity(self):
        """Test basic network connectivity"""
        print_section("BASIC CONNECTIVITY")
        
        try:
            # DNS Resolution
            import socket
            ip = socket.gethostbyname(self.target_host)
            print_result("DNS Resolution", True, f"{self.target_host} -> {ip}")
            self.results['dns'] = ip
        except Exception as e:
            print_result("DNS Resolution", False, str(e))
            self.results['dns'] = None
            return False
            
        try:
            # TCP Connection
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            result = sock.connect_ex((self.target_host, self.target_port))
            sock.close()
            
            if result == 0:
                print_result("TCP Connection", True, f"Port {self.target_port} is open")
                self.results['tcp'] = True
                return True
            else:
                print_result("TCP Connection", False, f"Port {self.target_port} connection failed")
                self.results['tcp'] = False
                return False
        except Exception as e:
            print_result("TCP Connection", False, str(e))
            self.results['tcp'] = False
            return False
    
    def test_ssl_certificate_info(self):
        """Get detailed SSL certificate information"""
        print_section("SSL CERTIFICATE ANALYSIS")
        
        try:
            # Get certificate using openssl command
            cmd = f"openssl s_client -connect {self.target_host}:{self.target_port} -servername {self.target_host} < /dev/null 2>/dev/null | openssl x509 -text -noout"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print_result("OpenSSL Certificate Retrieval", True)
                cert_info = result.stdout
                
                # Extract key information
                lines = cert_info.split('\n')
                for line in lines:
                    line = line.strip()
                    if 'Not Before:' in line or 'Not After:' in line:
                        print(f"    {line}")
                    elif 'Subject:' in line:
                        print(f"    {line}")
                    elif 'Issuer:' in line:
                        print(f"    {line}")
                    elif 'DNS:' in line:
                        print(f"    SAN: {line}")
                        
                self.results['cert_info'] = True
            else:
                print_result("OpenSSL Certificate Retrieval", False, result.stderr)
                self.results['cert_info'] = False
                
        except Exception as e:
            print_result("OpenSSL Certificate Retrieval", False, str(e))
            self.results['cert_info'] = False
    
    def test_ssl_handshake_versions(self):
        """Test SSL/TLS handshake with different protocol versions"""
        print_section("SSL/TLS PROTOCOL TESTING")
        
        protocols = [
            ('TLS 1.0', ssl.PROTOCOL_TLSv1),
            ('TLS 1.1', ssl.PROTOCOL_TLSv1_1), 
            ('TLS 1.2', ssl.PROTOCOL_TLSv1_2),
        ]
        
        # Add TLS 1.3 if available
        if hasattr(ssl, 'PROTOCOL_TLSv1_3'):
            protocols.append(('TLS 1.3', ssl.PROTOCOL_TLSv1_3))
        
        for proto_name, proto_version in protocols:
            try:
                context = ssl.SSLContext(proto_version)
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                
                with socket.create_connection((self.target_host, self.target_port), timeout=10) as sock:
                    with context.wrap_socket(sock, server_hostname=self.target_host) as ssock:
                        print_result(f"{proto_name} Handshake", True, f"Connected with {ssock.version()}")
                        
            except Exception as e:
                print_result(f"{proto_name} Handshake", False, str(e))
    
    def test_ssl_context_variations(self):
        """Test different SSL context configurations"""
        print_section("SSL CONTEXT CONFIGURATIONS")
        
        test_configs = [
            {
                'name': 'Default SSL Context',
                'config': lambda: ssl.create_default_context()
            },
            {
                'name': 'Unverified SSL Context',
                'config': lambda: ssl._create_unverified_context()
            },
            {
                'name': 'Custom Permissive Context',
                'config': lambda: self._create_permissive_context()
            },
            {
                'name': 'System Default Context',
                'config': lambda: ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            }
        ]
        
        for config in test_configs:
            try:
                context = config['config']()
                
                with socket.create_connection((self.target_host, self.target_port), timeout=10) as sock:
                    with context.wrap_socket(sock, server_hostname=self.target_host) as ssock:
                        cipher = ssock.cipher()
                        print_result(config['name'], True, f"Cipher: {cipher[0] if cipher else 'Unknown'}")
                        
            except Exception as e:
                print_result(config['name'], False, str(e))
    
    def _create_permissive_context(self):
        """Create a very permissive SSL context"""
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        context.set_ciphers('ALL:@SECLEVEL=0')
        context.options &= ~ssl.OP_NO_SSLv2
        context.options &= ~ssl.OP_NO_SSLv3
        return context
    
    def test_requests_library(self):
        """Test using requests library with different configurations"""
        print_section("REQUESTS LIBRARY TESTING")
        
        test_configs = [
            {
                'name': 'Default Requests',
                'kwargs': {}
            },
            {
                'name': 'Verify Disabled',
                'kwargs': {'verify': False}
            },
            {
                'name': 'Custom CA Bundle',
                'kwargs': {'verify': certifi.where()}
            },
            {
                'name': 'Requests + urllib3 disable warnings',
                'kwargs': {'verify': False},
                'setup': lambda: urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            }
        ]
        
        for config in test_configs:
            try:
                if 'setup' in config:
                    config['setup']()
                
                response = requests.get(
                    f"https://{self.target_host}/",
                    timeout=10,
                    **config['kwargs']
                )
                
                print_result(config['name'], True, f"Status: {response.status_code}")
                
            except Exception as e:
                print_result(config['name'], False, str(e))
    
    def test_caveclient_specific(self):
        """Test CAVEclient specific connection patterns"""
        print_section("CAVECLIENT SPECIFIC TESTING")
        
        try:
            # Test if caveclient is available
            from caveclient import CAVEclient
            print_result("CAVEclient Import", True)
            
            # Test different CAVEclient configurations
            configs = [
                {
                    'name': 'Default CAVEclient',
                    'kwargs': {}
                },
                {
                    'name': 'CAVEclient with custom session',
                    'kwargs': {'session': self._create_custom_session()}
                }
            ]
            
            for config in configs:
                try:
                    client = CAVEclient(
                        'flywire_fafb_production',
                        **config['kwargs']
                    )
                    
                    # Try a simple operation
                    info = client.info.get_datastack_info()
                    print_result(config['name'], True, f"Datastack: {info.get('datastack', 'Unknown')}")
                    
                except Exception as e:
                    print_result(config['name'], False, str(e))
                    
        except ImportError:
            print_result("CAVEclient Import", False, "CAVEclient not installed")
    
    def _create_custom_session(self):
        """Create a custom requests session with SSL debugging"""
        session = requests.Session()
        
        # Custom adapter with SSL debugging
        adapter = requests.adapters.HTTPAdapter()
        session.mount('https://', adapter)
        session.verify = False
        
        return session
    
    def test_openssl_s_client(self):
        """Test direct OpenSSL s_client connection"""
        print_section("OPENSSL S_CLIENT TESTING")
        
        commands = [
            {
                'name': 'Basic s_client',
                'cmd': f"timeout 10 openssl s_client -connect {self.target_host}:{self.target_port} -servername {self.target_host}"
            },
            {
                'name': 's_client with TLS1.2',
                'cmd': f"timeout 10 openssl s_client -connect {self.target_host}:{self.target_port} -servername {self.target_host} -tls1_2"
            },
            {
                'name': 's_client with TLS1.3',
                'cmd': f"timeout 10 openssl s_client -connect {self.target_host}:{self.target_port} -servername {self.target_host} -tls1_3"
            },
            {
                'name': 's_client verify disabled',
                'cmd': f"timeout 10 openssl s_client -connect {self.target_host}:{self.target_port} -servername {self.target_host} -verify_return_error"
            }
        ]
        
        for cmd_config in commands:
            try:
                result = subprocess.run(
                    cmd_config['cmd'] + " < /dev/null", 
                    shell=True, 
                    capture_output=True, 
                    text=True,
                    timeout=15
                )
                
                if result.returncode == 0:
                    # Look for successful handshake indicators
                    output = result.stdout + result.stderr
                    if "Verify return code: 0" in output or "SSL handshake" in output:
                        print_result(cmd_config['name'], True, "Handshake successful")
                    else:
                        print_result(cmd_config['name'], False, "Handshake issues in output")
                else:
                    print_result(cmd_config['name'], False, f"Exit code: {result.returncode}")
                    
            except Exception as e:
                print_result(cmd_config['name'], False, str(e))
    
    def test_curl_requests(self):
        """Test using curl for comparison"""
        print_section("CURL TESTING")
        
        curl_commands = [
            {
                'name': 'Basic curl',
                'cmd': f"curl -I https://{self.target_host}/ --max-time 10"
            },
            {
                'name': 'curl insecure',
                'cmd': f"curl -I -k https://{self.target_host}/ --max-time 10"
            },
            {
                'name': 'curl with TLS1.2',
                'cmd': f"curl -I --tlsv1.2 https://{self.target_host}/ --max-time 10"
            },
            {
                'name': 'curl verbose',
                'cmd': f"curl -I -v https://{self.target_host}/ --max-time 10"
            }
        ]
        
        for cmd_config in curl_commands:
            try:
                result = subprocess.run(
                    cmd_config['cmd'],
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=15
                )
                
                if result.returncode == 0:
                    print_result(cmd_config['name'], True, "HTTP request successful")
                else:
                    print_result(cmd_config['name'], False, f"Exit code: {result.returncode}")
                    if result.stderr:
                        print(f"        Error: {result.stderr.strip()}")
                        
            except Exception as e:
                print_result(cmd_config['name'], False, str(e))
    
    def run_full_diagnosis(self):
        """Run complete SSL diagnosis"""
        print(f"\n🔍 SSL DEBUGGING REPORT")
        print(f"Target: {self.target_host}:{self.target_port}")
        print(f"Time: {datetime.now().isoformat()}")
        print(f"Python: {sys.version}")
        print(f"OpenSSL: {ssl.OPENSSL_VERSION}")
        
        # Run all tests
        if self.test_basic_connectivity():
            self.test_ssl_certificate_info()
            self.test_ssl_handshake_versions()
            self.test_ssl_context_variations()
            self.test_requests_library()
            self.test_caveclient_specific()
            self.test_openssl_s_client()
            self.test_curl_requests()
        else:
            print("\n❌ Basic connectivity failed. Skipping SSL tests.")
        
        # Summary
        print_section("DIAGNOSIS SUMMARY")
        print("Key findings will help determine the root cause of SSL issues.")
        
        return self.results

if __name__ == "__main__":
    debugger = SSLDebugger()
    results = debugger.run_full_diagnosis()
    
    # Save results to file
    with open('ssl_debug_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📊 Results saved to ssl_debug_results.json") 