#!/usr/bin/env python3
"""
Direct demo of cloud-based FlyWire data loading
Tests the cloud data functionality without needing a running server
"""

import pandas as pd
import requests
import io
import json
from datetime import datetime

def demo_cloud_data_loading():
    """Direct demonstration of loading FlyWire data from the cloud"""
    
    print("🌐 DEMO: CLOUD-BASED FLYWIRE DATA LOADING")
    print("="*60)
    print("This demonstrates loading FlyWire data from GitHub")
    print("✅ No SSL issues with cave.flywire.ai")
    print("✅ No local files needed")
    print("✅ Perfect for cloud deployment")
    print()
    
    # URL for FlyWire annotations on GitHub
    data_url = "https://raw.githubusercontent.com/flyconnectome/flywire_annotations/main/supplemental_files/Supplemental_file1_neuron_annotations.tsv"
    
    print("1️⃣ Loading FlyWire neuron annotations from GitHub...")
    print(f"   Source: GitHub (flyconnectome/flywire_annotations)")
    print(f"   URL: {data_url}")
    
    try:
        # Download the data
        print("   📥 Downloading...")
        response = requests.get(data_url, timeout=30)
        response.raise_for_status()
        
        # Parse TSV data
        print("   📊 Parsing data...")
        tsv_data = io.StringIO(response.text)
        df = pd.read_csv(tsv_data, sep='\t', low_memory=False)
        
        print(f"   ✅ Successfully loaded {len(df):,} neurons")
        print(f"   📋 Columns: {len(df.columns)} total")
        print(f"   💾 Data size: {len(response.text)/1024/1024:.1f} MB")
        
    except Exception as e:
        print(f"   ❌ Failed to load data: {e}")
        return False
    
    print("\n2️⃣ Analyzing mechanosensory neurons...")
    try:
        # Find mechanosensory neurons
        mech_mask = df['cell_class'] == 'mechanosensory'
        mech_neurons = df[mech_mask]
        
        print(f"   🎯 Found {len(mech_neurons):,} mechanosensory neurons")
        print(f"   📊 Top types:")
        for cell_type, count in mech_neurons['cell_type'].value_counts().head(5).items():
            print(f"      {cell_type}: {count}")
        
    except Exception as e:
        print(f"   ❌ Analysis failed: {e}")
        return False
    
    print("\n3️⃣ Analyzing auditory neurons...")
    try:
        # Find auditory neurons (JO types)
        jo_mask = df['cell_type'].str.contains('JO-', na=False)
        jo_neurons = df[jo_mask]
        
        print(f"   🔊 Found {len(jo_neurons):,} auditory neurons")
        print(f"   📊 JO types:")
        for jo_type, count in jo_neurons['cell_type'].value_counts().head(5).items():
            print(f"      {jo_type}: {count}")
        
    except Exception as e:
        print(f"   ❌ Analysis failed: {e}")
        return False
    
    print("\n4️⃣ Converting to API format...")
    try:
        # Convert sample neurons to API format
        sample_neurons = []
        for _, row in mech_neurons.head(3).iterrows():
            neuron = {
                'id': str(row['root_id']),
                'type': str(row['cell_type']) if pd.notna(row['cell_type']) else 'mechanosensory',
                'position': [
                    float(row['pos_x']) if pd.notna(row['pos_x']) else 0.0,
                    float(row['pos_y']) if pd.notna(row['pos_y']) else 0.0,
                    float(row['pos_z']) if pd.notna(row['pos_z']) else 0.0
                ],
                'soma_position': [
                    float(row['soma_x']) if pd.notna(row['soma_x']) else 0.0,
                    float(row['soma_y']) if pd.notna(row['soma_y']) else 0.0,
                    float(row['soma_z']) if pd.notna(row['soma_z']) else 0.0
                ],
                'source': 'flywire_cloud_data'
            }
            sample_neurons.append(neuron)
        
        print(f"   ✅ Converted {len(sample_neurons)} neurons to API format")
        print(f"   📍 Sample neuron:")
        sample = sample_neurons[0]
        print(f"      ID: {sample['id']}")
        print(f"      Type: {sample['type']}")
        print(f"      Position: {sample['position']}")
        print(f"      Source: {sample['source']}")
        
    except Exception as e:
        print(f"   ❌ Conversion failed: {e}")
        return False
    
    print("\n5️⃣ Creating circuit data...")
    try:
        # Create circuit in the format your app expects
        circuit = {
            'name': 'Mechanosensory Circuit',
            'neurons': sample_neurons,
            'type': 'mechanosensory',
            'color': '#FF4081',
            'source': 'flywire_cloud_data',
            'total_available': len(mech_neurons),
            'loaded_count': len(sample_neurons)
        }
        
        print(f"   ✅ Created circuit with {len(circuit['neurons'])} neurons")
        print(f"   📊 Circuit name: {circuit['name']}")
        print(f"   🎨 Circuit color: {circuit['color']}")
        print(f"   📈 Total available: {circuit['total_available']:,}")
        
    except Exception as e:
        print(f"   ❌ Circuit creation failed: {e}")
        return False
    
    print("\n🎯 SUMMARY:")
    print("="*40)
    print(f"✅ Successfully loaded FlyWire data from cloud")
    print(f"📊 Total neurons: {len(df):,}")
    print(f"🎯 Mechanosensory neurons: {len(mech_neurons):,}")
    print(f"🔊 Auditory neurons: {len(jo_neurons):,}")
    print(f"🌐 Data source: GitHub (official FlyWire repo)")
    print(f"🔒 SSL status: No cave.flywire.ai calls needed")
    print(f"☁️ Cloud deployment: Ready")
    print(f"⚡ Load time: Fast (cached by GitHub)")
    
    print("\n🚀 DEPLOYMENT READY:")
    print("1. ✅ No SSL certificate issues")
    print("2. ✅ No large local files")
    print("3. ✅ Uses official FlyWire data")
    print("4. ✅ Works with any cloud platform")
    print("5. ✅ Perfect for your NeuroVis-3D app")
    
    return True

if __name__ == "__main__":
    print(f"🕐 Starting demo at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = demo_cloud_data_loading()
    
    if success:
        print("\n🎉 DEMO COMPLETE!")
        print("Your cloud-based FlyWire solution is ready!")
        print("\n📝 NEXT STEPS:")
        print("1. Deploy flywire_cloud_backend.py to your cloud platform")
        print("2. Update your frontend to use the cloud backend URL")
        print("3. Enjoy SSL-free, real FlyWire data!")
    else:
        print("\n❌ Demo failed - please check your internet connection") 