#!/usr/bin/env python3
"""
MATLAB Data Extraction and HDF5 Export
Extracts trajectory data from .mat files using scipy.io and exports to HDF5
Creates HTML directory of all extracted data layers
"""

import scipy.io
import h5py
import numpy as np
import json
import os
from pathlib import Path
from datetime import datetime
import traceback

def analyze_mat_structure(data, name="root", depth=0, max_depth=5):
    """Recursively analyze MATLAB data structure"""
    analysis = {
        'name': name,
        'type': str(type(data).__name__),
        'shape': None,
        'dtype': None,
        'children': [],
        'description': '',
        'extractable': False
    }
    
    if depth > max_depth:
        analysis['description'] = f"Max depth {max_depth} reached"
        return analysis
    
    try:
        if isinstance(data, np.ndarray):
            analysis['shape'] = data.shape
            analysis['dtype'] = str(data.dtype)
            analysis['extractable'] = True
            
            if data.size > 0:
                if data.dtype.kind in ['f', 'i']:  # float or int
                    if data.size <= 10:
                        analysis['description'] = f"Numeric array: {data.flatten()}"
                    else:
                        analysis['description'] = f"Numeric array: shape={data.shape}, min={np.min(data):.3f}, max={np.max(data):.3f}, mean={np.mean(data):.3f}"
                elif data.dtype.kind == 'U':  # Unicode string
                    analysis['description'] = f"String array: {data}"
                elif data.dtype.kind == 'O':  # Object array
                    analysis['description'] = f"Object array with {data.size} elements"
                    # Try to analyze first few elements
                    for i, item in enumerate(data.flat):
                        if i >= 3:  # Limit to first 3 items
                            break
                        child_analysis = analyze_mat_structure(item, f"{name}[{i}]", depth+1, max_depth)
                        analysis['children'].append(child_analysis)
            else:
                analysis['description'] = "Empty array"
                
        elif isinstance(data, dict):
            analysis['description'] = f"Dictionary with {len(data)} keys: {list(data.keys())}"
            for key, value in data.items():
                if not key.startswith('__'):  # Skip MATLAB metadata
                    child_analysis = analyze_mat_structure(value, key, depth+1, max_depth)
                    analysis['children'].append(child_analysis)
                    
        elif isinstance(data, (list, tuple)):
            analysis['description'] = f"{type(data).__name__} with {len(data)} elements"
            for i, item in enumerate(data):
                if i >= 5:  # Limit to first 5 items
                    break
                child_analysis = analyze_mat_structure(item, f"{name}[{i}]", depth+1, max_depth)
                analysis['children'].append(child_analysis)
                
        elif isinstance(data, (str, bytes)):
            analysis['description'] = f"String: {data}"
            analysis['extractable'] = True
            
        elif isinstance(data, (int, float, complex)):
            analysis['description'] = f"Scalar: {data}"
            analysis['extractable'] = True
            
        else:
            analysis['description'] = f"Unknown type: {type(data)}"
            
    except Exception as e:
        analysis['description'] = f"Error analyzing: {str(e)}"
    
    return analysis

def extract_coordinates_from_structure(data, path=""):
    """Extract coordinate-like data from MATLAB structures"""
    coordinates = {}
    
    def search_coordinates(obj, current_path=""):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if not key.startswith('__'):
                    new_path = f"{current_path}.{key}" if current_path else key
                    
                    # Check if this looks like coordinate data
                    if any(coord_name in key.lower() for coord_name in ['x', 'y', 'head', 'tail', 'center', 'spine', 'contour', 'coord']):
                        if isinstance(value, np.ndarray) and value.size > 0:
                            coordinates[new_path] = {
                                'data': value,
                                'shape': value.shape,
                                'dtype': str(value.dtype),
                                'description': f"Coordinate data: {key}"
                            }
                    
                    # Recurse into nested structures
                    search_coordinates(value, new_path)
                    
        elif isinstance(obj, np.ndarray) and obj.dtype == 'O':
            # Handle object arrays (common in MATLAB)
            for i, item in enumerate(obj.flat):
                search_coordinates(item, f"{current_path}[{i}]")
    
    search_coordinates(data, path)
    return coordinates

def process_mat_file(filepath):
    """Process a single .mat file and extract all data"""
    print(f"\n🔍 Processing: {filepath}")
    
    try:
        # Try to load the .mat file
        mat_data = scipy.io.loadmat(filepath, squeeze_me=False, struct_as_record=False)
        
        # Analyze structure
        analysis = analyze_mat_structure(mat_data, f"MAT:{os.path.basename(filepath)}")
        
        # Extract coordinate data
        coordinates = extract_coordinates_from_structure(mat_data)
        
        # Look for specific trajectory-related fields
        trajectory_data = {}
        
        # Common MATLAB trajectory field names
        trajectory_fields = ['tracks', 'track', 'experiment', 'data', 'results', 'trajectories']
        
        for field in trajectory_fields:
            if field in mat_data:
                print(f"   ✅ Found trajectory field: {field}")
                field_data = mat_data[field]
                trajectory_data[field] = {
                    'data': field_data,
                    'analysis': analyze_mat_structure(field_data, field)
                }
        
        print(f"   📊 Structure analyzed: {len(analysis.get('children', []))} top-level fields")
        print(f"   📍 Coordinates found: {len(coordinates)} coordinate fields")
        print(f"   🎯 Trajectory data: {len(trajectory_data)} trajectory fields")
        
        return {
            'filepath': filepath,
            'analysis': analysis,
            'coordinates': coordinates,
            'trajectory_data': trajectory_data,
            'raw_data': mat_data,
            'success': True,
            'error': None
        }
        
    except Exception as e:
        print(f"   ❌ Error processing {filepath}: {str(e)}")
        return {
            'filepath': filepath,
            'analysis': None,
            'coordinates': {},
            'trajectory_data': {},
            'raw_data': None,
            'success': False,
            'error': str(e)
        }

def export_to_hdf5(processed_files, output_path):
    """Export all extracted data to a single HDF5 file"""
    print(f"\n💾 Exporting to HDF5: {output_path}")
    
    with h5py.File(output_path, 'w') as h5file:
        # Create metadata
        metadata_group = h5file.create_group('metadata')
        metadata_group.attrs['extraction_date'] = datetime.now().isoformat()
        metadata_group.attrs['source_files'] = [f['filepath'] for f in processed_files if f['success']]
        metadata_group.attrs['total_files'] = len(processed_files)
        metadata_group.attrs['successful_files'] = sum(1 for f in processed_files if f['success'])
        
        # Process each file
        for i, file_data in enumerate(processed_files):
            if not file_data['success']:
                continue
                
            filename = os.path.basename(file_data['filepath']).replace('.mat', '')
            file_group = h5file.create_group(f'file_{i:02d}_{filename}')
            file_group.attrs['source_file'] = file_data['filepath']
            
            # Export coordinates
            if file_data['coordinates']:
                coord_group = file_group.create_group('coordinates')
                for coord_name, coord_data in file_data['coordinates'].items():
                    try:
                        dataset = coord_group.create_dataset(
                            coord_name.replace('.', '_').replace('[', '_').replace(']', ''),
                            data=coord_data['data']
                        )
                        dataset.attrs['description'] = coord_data['description']
                        dataset.attrs['original_shape'] = coord_data['shape']
                        dataset.attrs['dtype'] = coord_data['dtype']
                    except Exception as e:
                        print(f"     ⚠️  Could not export coordinate {coord_name}: {str(e)}")
            
            # Export trajectory data
            if file_data['trajectory_data']:
                traj_group = file_group.create_group('trajectory_data')
                for traj_name, traj_data in file_data['trajectory_data'].items():
                    try:
                        data = traj_data['data']
                        if isinstance(data, np.ndarray) and data.size > 0:
                            dataset = traj_group.create_dataset(traj_name, data=data)
                            dataset.attrs['description'] = f"Trajectory data from field: {traj_name}"
                    except Exception as e:
                        print(f"     ⚠️  Could not export trajectory data {traj_name}: {str(e)}")
        
        print(f"   ✅ HDF5 export completed")

def generate_html_summary(processed_files, output_path):
    """Generate HTML summary of all extracted data"""
    print(f"\n📄 Generating HTML summary: {output_path}")
    
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MATLAB Data Extraction Summary</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        h3 {{ color: #7f8c8d; }}
        .file-section {{ background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #3498db; }}
        .error-section {{ border-left-color: #e74c3c; background: #fdf2f2; }}
        .success-section {{ border-left-color: #27ae60; }}
        .tree {{ margin-left: 20px; }}
        .node {{ margin: 5px 0; padding: 5px; background: white; border-radius: 4px; border: 1px solid #bdc3c7; }}
        .extractable {{ background: #d5f4e6; border-color: #27ae60; }}
        .coordinates {{ background: #fff3cd; border-color: #ffc107; }}
        .trajectory {{ background: #cce5ff; border-color: #007bff; }}
        .summary-stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }}
        .stat-card {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; }}
        .stat-value {{ font-size: 2em; font-weight: bold; }}
        .stat-label {{ font-size: 0.9em; opacity: 0.9; }}
        code {{ background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }}
        .timestamp {{ color: #6c757d; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 MATLAB Data Extraction Summary</h1>
        <p class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-value">{len(processed_files)}</div>
                <div class="stat-label">Total Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{sum(1 for f in processed_files if f['success'])}</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{sum(len(f['coordinates']) for f in processed_files if f['success'])}</div>
                <div class="stat-label">Coordinate Fields</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{sum(len(f['trajectory_data']) for f in processed_files if f['success'])}</div>
                <div class="stat-label">Trajectory Fields</div>
            </div>
        </div>
"""
    
    # Add file details
    for file_data in processed_files:
        filename = os.path.basename(file_data['filepath'])
        section_class = "success-section" if file_data['success'] else "error-section"
        status_icon = "✅" if file_data['success'] else "❌"
        
        html_content += f"""
        <div class="file-section {section_class}">
            <h2>{status_icon} {filename}</h2>
            <p><strong>Path:</strong> <code>{file_data['filepath']}</code></p>
"""
        
        if file_data['success']:
            # Add structure tree
            html_content += "<h3>📋 Data Structure</h3>\n"
            html_content += generate_structure_html(file_data['analysis'])
            
            # Add coordinates
            if file_data['coordinates']:
                html_content += f"<h3>📍 Coordinate Data ({len(file_data['coordinates'])} fields)</h3>\n"
                for coord_name, coord_data in file_data['coordinates'].items():
                    html_content += f"""
                    <div class="node coordinates">
                        <strong>{coord_name}</strong>: {coord_data['description']}<br>
                        <code>Shape: {coord_data['shape']}, Type: {coord_data['dtype']}</code>
                    </div>
"""
            
            # Add trajectory data
            if file_data['trajectory_data']:
                html_content += f"<h3>🎯 Trajectory Data ({len(file_data['trajectory_data'])} fields)</h3>\n"
                for traj_name, traj_data in file_data['trajectory_data'].items():
                    html_content += f"""
                    <div class="node trajectory">
                        <strong>{traj_name}</strong>: Trajectory field<br>
                        <code>Type: {type(traj_data['data'])}</code>
                    </div>
"""
        else:
            html_content += f"<p><strong>Error:</strong> {file_data['error']}</p>\n"
        
        html_content += "</div>\n"
    
    html_content += """
    </div>
</body>
</html>
"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"   ✅ HTML summary generated")

def generate_structure_html(analysis, depth=0):
    """Generate HTML for data structure tree"""
    if not analysis:
        return ""
    
    indent = "  " * depth
    node_class = "extractable" if analysis.get('extractable', False) else "node"
    
    html = f"{indent}<div class=\"{node_class}\">\n"
    html += f"{indent}  <strong>{analysis['name']}</strong> ({analysis['type']})\n"
    if analysis['description']:
        html += f"{indent}  <br>{analysis['description']}\n"
    if analysis['shape']:
        html += f"{indent}  <br><code>Shape: {analysis['shape']}</code>\n"
    
    if analysis.get('children'):
        html += f"{indent}  <div class=\"tree\">\n"
        for child in analysis['children']:
            html += generate_structure_html(child, depth + 1)
        html += f"{indent}  </div>\n"
    
    html += f"{indent}</div>\n"
    return html

def main():
    """Main extraction workflow"""
    print("🔍 MATLAB DATA EXTRACTION TO HDF5")
    print("=" * 50)
    
    # Define paths
    data_dir = Path("src/assets/data/trajectories")
    output_dir = Path("src/assets/data")
    
    # Find all .mat files
    mat_files = list(data_dir.glob("*.mat"))
    
    if not mat_files:
        print("❌ No .mat files found in src/assets/data/trajectories/")
        return
    
    print(f"📁 Found {len(mat_files)} .mat files:")
    for f in mat_files:
        print(f"   - {f}")
    
    # Process all files
    processed_files = []
    for mat_file in mat_files:
        result = process_mat_file(str(mat_file))
        processed_files.append(result)
    
    # Export to HDF5
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    h5_output = output_dir / f"trajectory_data_extracted_{timestamp}.h5"
    export_to_hdf5(processed_files, str(h5_output))
    
    # Generate HTML summary
    html_output = output_dir / f"trajectory_data_summary_{timestamp}.html"
    generate_html_summary(processed_files, str(html_output))
    
    # Generate JSON summary for programmatic access
    json_output = output_dir / f"trajectory_data_index_{timestamp}.json"
    json_summary = {
        'extraction_date': datetime.now().isoformat(),
        'files_processed': len(processed_files),
        'successful_extractions': sum(1 for f in processed_files if f['success']),
        'coordinate_fields_found': sum(len(f['coordinates']) for f in processed_files if f['success']),
        'trajectory_fields_found': sum(len(f['trajectory_data']) for f in processed_files if f['success']),
        'output_files': {
            'hdf5': str(h5_output),
            'html_summary': str(html_output),
            'json_index': str(json_output)
        },
        'file_details': [
            {
                'filepath': f['filepath'],
                'success': f['success'],
                'error': f['error'],
                'coordinate_count': len(f['coordinates']) if f['success'] else 0,
                'trajectory_count': len(f['trajectory_data']) if f['success'] else 0
            }
            for f in processed_files
        ]
    }
    
    with open(json_output, 'w') as f:
        json.dump(json_summary, f, indent=2)
    
    print("\n🎉 EXTRACTION COMPLETE!")
    print("=" * 50)
    print(f"📊 Files processed: {len(processed_files)}")
    print(f"✅ Successful: {sum(1 for f in processed_files if f['success'])}")
    print(f"📍 Coordinate fields: {sum(len(f['coordinates']) for f in processed_files if f['success'])}")
    print(f"🎯 Trajectory fields: {sum(len(f['trajectory_data']) for f in processed_files if f['success'])}")
    print(f"\n📁 Output files:")
    print(f"   HDF5: {h5_output}")
    print(f"   HTML: {html_output}")
    print(f"   JSON: {json_output}")

if __name__ == "__main__":
    main() 