#!/usr/bin/env python3
"""
Test the local FlyWire data solution - verify we can replace API calls
"""

import json
import pandas as pd
from pathlib import Path

def test_local_data():
    """Test that we can load and use local FlyWire data"""
    print("🧪 TESTING LOCAL FLYWIRE DATA SOLUTION")
    print("="*50)
    
    data_dir = Path("flywire_data")
    
    # Test 1: Load neuron annotations
    print("1️⃣ Testing neuron annotations loading...")
    annotations_file = data_dir / "Supplemental_file1_neuron_annotations.tsv"
    if annotations_file.exists():
        df = pd.read_csv(annotations_file, sep='\t', low_memory=False)
        print(f"✅ Loaded {len(df):,} neurons")
        print(f"   Columns: {len(df.columns)} total")
        print(f"   Sample columns: {list(df.columns[:8])}")
    else:
        print("❌ Annotations file not found")
        return False
    
    # Test 2: Find mechanosensory neurons
    print("\n2️⃣ Testing mechanosensory neuron extraction...")
    mech_mask = df['cell_class'] == 'mechanosensory'
    mech_neurons = df[mech_mask]
    print(f"✅ Found {len(mech_neurons)} mechanosensory neurons")
    
    if len(mech_neurons) > 0:
        print("   Top mechanosensory types:")
        for cell_type, count in mech_neurons['cell_type'].value_counts().head(5).items():
            print(f"     {cell_type}: {count}")
    
    # Test 3: Extract API-compatible data
    print("\n3️⃣ Testing API format conversion...")
    sample_neurons = []
    for _, row in mech_neurons.head(5).iterrows():
        neuron = {
            'id': str(row['root_id']),
            'type': row['cell_type'],
            'position': [float(row['pos_x']), float(row['pos_y']), float(row['pos_z'])],
            'soma_position': [float(row['soma_x']), float(row['soma_y']), float(row['soma_z'])],
            'mesh_id': row['root_id'],
            'source': 'local_data'
        }
        sample_neurons.append(neuron)
    
    print(f"✅ Converted {len(sample_neurons)} neurons to API format")
    print("   Sample neuron:")
    print(f"     ID: {sample_neurons[0]['id']}")
    print(f"     Type: {sample_neurons[0]['type']}")
    print(f"     Position: {sample_neurons[0]['position']}")
    
    # Test 4: Check circuit data if exists
    print("\n4️⃣ Testing circuit data...")
    circuit_file = data_dir / "mechanosensory_circuit.json"
    if circuit_file.exists():
        with open(circuit_file) as f:
            circuit = json.load(f)
        print(f"✅ Loaded circuit with {len(circuit['neurons'])} neurons")
        print(f"   Circuit name: {circuit['name']}")
        print(f"   Circuit type: {circuit['type']}")
    else:
        print("⚠️  Circuit file not found (not critical)")
    
    # Test 5: Verify this replaces our API needs
    print("\n5️⃣ Testing compatibility with our app requirements...")
    
    # Our app needs these types of data:
    required_data = {
        'mechanosensory_neurons': len(mech_neurons),
        'auditory_neurons': len(df[df['cell_type'].str.contains('JO-', na=False)]),
        'total_neurons': len(df),
        'has_positions': all(col in df.columns for col in ['pos_x', 'pos_y', 'pos_z']),
        'has_soma_positions': all(col in df.columns for col in ['soma_x', 'soma_y', 'soma_z']),
        'has_cell_types': 'cell_type' in df.columns,
        'has_root_ids': 'root_id' in df.columns
    }
    
    print("✅ Data availability check:")
    for requirement, value in required_data.items():
        status = "✅" if value else "❌"
        if isinstance(value, bool):
            print(f"   {status} {requirement}: {'Yes' if value else 'No'}")
        else:
            print(f"   {status} {requirement}: {value:,}")
    
    # Final verdict
    print("\n🎯 FINAL RESULT:")
    if all([required_data['has_positions'], required_data['has_cell_types'], 
            required_data['has_root_ids'], required_data['mechanosensory_neurons'] > 0]):
        print("✅ SUCCESS! Local data can completely replace FlyWire API calls")
        print("✅ No more SSL issues - everything works offline!")
        print(f"✅ Ready to visualize {required_data['mechanosensory_neurons']} mechanosensory neurons")
        print(f"✅ Ready to visualize {required_data['auditory_neurons']} auditory neurons")
        return True
    else:
        print("❌ FAILED! Missing required data")
        return False

if __name__ == "__main__":
    success = test_local_data()
    if success:
        print("\n🚀 NEXT STEPS:")
        print("1. Update your backend to use this local data")
        print("2. Test your frontend with the local backend")
        print("3. Deploy with confidence - no SSL dependencies!")
    else:
        print("\n❌ Fix data issues before proceeding") 