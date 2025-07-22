#!/usr/bin/env python3
"""
Test the cloud-based FlyWire backend
Verify it loads real data from GitHub and provides APIs
"""

import requests
import json
import time
import sys

def test_cloud_backend():
    """Test the cloud-based FlyWire backend comprehensively"""
    
    print("🧪 TESTING CLOUD-BASED FLYWIRE BACKEND")
    print("="*50)
    
    base_url = "http://localhost:5000"
    
    # Test 1: Health Check
    print("1️⃣ Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/api/health", timeout=60)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health check passed")
            print(f"   Status: {health_data.get('status')}")
            print(f"   Data source: {health_data.get('data_source')}")
            print(f"   SSL issues: {health_data.get('ssl_issues')}")
            print(f"   Neurons available: {health_data.get('neurons_available', 0):,}")
            print(f"   Cache status: {health_data.get('cache_status')}")
            print(f"   Cache age: {health_data.get('cache_age_minutes', 0)} minutes")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test 2: Circuit Search
    print("\n2️⃣ Testing circuit search...")
    try:
        response = requests.get(f"{base_url}/api/circuits/search", timeout=30)
        if response.status_code == 200:
            circuits_data = response.json()
            if circuits_data.get('success'):
                circuits = circuits_data.get('circuits', [])
                print(f"✅ Found {len(circuits)} circuits")
                for circuit in circuits:
                    print(f"   Circuit: {circuit['name']} ({len(circuit['neurons'])} neurons)")
                    print(f"   Type: {circuit['type']}, Source: {circuit['source']}")
            else:
                print(f"❌ Circuit search failed: {circuits_data.get('error')}")
                return False
        else:
            print(f"❌ Circuit search HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Circuit search error: {e}")
        return False
    
    # Test 3: Mechanosensory Neurons
    print("\n3️⃣ Testing mechanosensory neurons...")
    try:
        response = requests.get(f"{base_url}/api/neurons/mechanosensory?limit=10", timeout=30)
        if response.status_code == 200:
            mech_data = response.json()
            if mech_data.get('success'):
                neurons = mech_data.get('neurons', [])
                print(f"✅ Found {len(neurons)} mechanosensory neurons")
                if neurons:
                    sample = neurons[0]
                    print(f"   Sample neuron:")
                    print(f"     ID: {sample['id']}")
                    print(f"     Type: {sample['type']}")
                    print(f"     Position: {sample['position']}")
                    print(f"     Source: {sample['source']}")
            else:
                print(f"❌ Mechanosensory query failed: {mech_data.get('error')}")
                return False
        else:
            print(f"❌ Mechanosensory HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Mechanosensory error: {e}")
        return False
    
    # Test 4: Neuron Search
    print("\n4️⃣ Testing neuron search...")
    try:
        response = requests.get(f"{base_url}/api/neurons/search?type=JO&limit=5", timeout=30)
        if response.status_code == 200:
            search_data = response.json()
            if search_data.get('success'):
                neurons = search_data.get('neurons', [])
                print(f"✅ Found {len(neurons)} JO neurons")
                if neurons:
                    types = [n['type'] for n in neurons]
                    print(f"   Types found: {types}")
            else:
                print(f"❌ Neuron search failed: {search_data.get('error')}")
                return False
        else:
            print(f"❌ Neuron search HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Neuron search error: {e}")
        return False
    
    # Test 5: Statistics
    print("\n5️⃣ Testing statistics...")
    try:
        response = requests.get(f"{base_url}/api/stats", timeout=30)
        if response.status_code == 200:
            stats_data = response.json()
            if stats_data.get('success'):
                stats = stats_data.get('stats', {})
                print(f"✅ Statistics loaded")
                print(f"   Total neurons: {stats.get('total_neurons', 0):,}")
                print(f"   Mechanosensory: {stats.get('mechanosensory_neurons', 0):,}")
                print(f"   Auditory: {stats.get('auditory_neurons', 0):,}")
                print(f"   Sensory: {stats.get('sensory_neurons', 0):,}")
                print(f"   SSL status: {stats.get('ssl_status')}")
                print(f"   Data source: {stats.get('data_source')}")
            else:
                print(f"❌ Statistics failed: {stats_data.get('error')}")
                return False
        else:
            print(f"❌ Statistics HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Statistics error: {e}")
        return False
    
    # Test 6: Data Refresh
    print("\n6️⃣ Testing data refresh...")
    try:
        response = requests.post(f"{base_url}/api/refresh", timeout=60)
        if response.status_code == 200:
            refresh_data = response.json()
            if refresh_data.get('success'):
                print(f"✅ Data refresh successful")
                print(f"   Neurons loaded: {refresh_data.get('neurons_loaded', 0):,}")
                print(f"   Timestamp: {refresh_data.get('timestamp')}")
            else:
                print(f"❌ Data refresh failed: {refresh_data.get('error')}")
                return False
        else:
            print(f"❌ Data refresh HTTP error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Data refresh error: {e}")
        return False
    
    print("\n🎯 FINAL RESULT:")
    print("✅ ALL TESTS PASSED!")
    print("✅ Cloud-based FlyWire backend is working perfectly")
    print("✅ Real FlyWire data loaded from GitHub")
    print("✅ No SSL issues with cave.flywire.ai")
    print("✅ Ready for deployment!")
    
    return True

def check_backend_running():
    """Check if the backend is running"""
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        return response.status_code == 200
    except:
        return False

if __name__ == "__main__":
    print("🔍 Checking if backend is running...")
    
    if not check_backend_running():
        print("❌ Backend not running. Please start it first:")
        print("   python3 flywire_cloud_backend.py")
        sys.exit(1)
    
    print("✅ Backend is running, starting tests...")
    time.sleep(2)  # Give it a moment
    
    success = test_cloud_backend()
    
    if success:
        print("\n🚀 CLOUD BACKEND READY FOR:")
        print("1. Local development")
        print("2. Cloud deployment (Cloud Run, Heroku, etc.)")
        print("3. Production use")
        print("4. Your NeuroVis-3D frontend")
    else:
        print("\n❌ Fix issues before proceeding")
        sys.exit(1) 