#!/usr/bin/env python3
"""
HDF5-based MATLAB Data Extraction
Extracts trajectory data from MATLAB v7.3 files using h5py
Creates comprehensive HTML summary and JSON index
"""

import h5py
import numpy as np
import json
import os
from pathlib import Path
from datetime import datetime
import traceback

def analyze_hdf5_structure(h5file, name="root", max_depth=5, current_depth=0):
    """Recursively analyze HDF5 file structure"""
    
    if current_depth > max_depth:
        return {
            'name': name,
            'type': 'truncated',
            'description': f'Max depth {max_depth} reached'
        }
    
    analysis = {
        'name': name,
        'type': 'unknown',
        'description': '',
        'children': [],
        'extractable': False,
        'coordinate_potential': False
    }
    
    try:
        if isinstance(h5file, h5py.Group):
            analysis['type'] = 'group'
            analysis['description'] = f'HDF5 Group with {len(h5file.keys())} items'
            
            # Check group attributes
            attrs = dict(h5file.attrs)
            if attrs:
                analysis['attributes'] = {k: str(v) for k, v in attrs.items()}
            
            # Analyze children
            for key in h5file.keys():
                child_analysis = analyze_hdf5_structure(
                    h5file[key], 
                    key, 
                    max_depth, 
                    current_depth + 1
                )
                analysis['children'].append(child_analysis)
                
        elif isinstance(h5file, h5py.Dataset):
            analysis['type'] = 'dataset'
            analysis['extractable'] = True
            analysis['shape'] = h5file.shape
            analysis['dtype'] = str(h5file.dtype)
            
            # Check for coordinate potential
            coord_keywords = ['x', 'y', 'head', 'tail', 'center', 'spine', 'contour', 'coord', 'position']
            if any(keyword in name.lower() for keyword in coord_keywords):
                analysis['coordinate_potential'] = True
            
            # Dataset description
            if h5file.size <= 10:
                try:
                    data = h5file[()]
                    analysis['description'] = f'Dataset: {data}'
                except:
                    analysis['description'] = f'Dataset: shape={h5file.shape}, dtype={h5file.dtype}'
            else:
                analysis['description'] = f'Dataset: shape={h5file.shape}, dtype={h5file.dtype}'
                
                # Get basic statistics for numeric data
                try:
                    if h5file.dtype.kind in ['f', 'i']:  # float or int
                        data = h5file[()]
                        if np.isscalar(data):
                            analysis['description'] += f', value={data}'
                        else:
                            analysis['description'] += f', min={np.min(data):.3f}, max={np.max(data):.3f}, mean={np.mean(data):.3f}'
                except:
                    pass
            
            # Check dataset attributes
            attrs = dict(h5file.attrs)
            if attrs:
                analysis['attributes'] = {k: str(v) for k, v in attrs.items()}
                
    except Exception as e:
        analysis['description'] = f'Error analyzing: {str(e)}'
    
    return analysis

def extract_coordinates_from_hdf5(h5file, path=""):
    """Extract coordinate-like data from HDF5 structure"""
    coordinates = {}
    
    def search_coordinates(obj, current_path=""):
        try:
            if isinstance(obj, h5py.Group):
                for key in obj.keys():
                    new_path = f"{current_path}/{key}" if current_path else key
                    search_coordinates(obj[key], new_path)
                    
            elif isinstance(obj, h5py.Dataset):
                # Check if this looks like coordinate data
                coord_keywords = ['x', 'y', 'head', 'tail', 'center', 'centroid', 
                                 'spine', 'contour', 'coord', 'position', 'location']
                
                is_coordinate = any(keyword in current_path.lower() for keyword in coord_keywords)
                
                if is_coordinate and obj.size > 0:
                    try:
                        data = obj[()]
                        coordinates[current_path] = {
                            'data': data,
                            'shape': obj.shape,
                            'dtype': str(obj.dtype),
                            'description': f"Coordinate data from: {current_path}"
                        }
                        print(f"      📍 Found coordinates: {current_path} (shape: {obj.shape})")
                    except Exception as e:
                        print(f"      ⚠️  Could not read coordinate data {current_path}: {str(e)}")
                        
        except Exception as e:
            print(f"      ⚠️  Error processing {current_path}: {str(e)}")
    
    search_coordinates(h5file, path)
    return coordinates

def extract_trajectory_data(h5file, path=""):
    """Extract trajectory-related data from HDF5 structure"""
    trajectory_data = {}
    
    def search_trajectory(obj, current_path=""):
        try:
            if isinstance(obj, h5py.Group):
                # Check if group name suggests trajectory data
                traj_keywords = ['track', 'trajectory', 'experiment', 'data', 'results']
                is_trajectory = any(keyword in current_path.lower() for keyword in traj_keywords)
                
                if is_trajectory:
                    print(f"      🎯 Found trajectory group: {current_path}")
                    
                for key in obj.keys():
                    new_path = f"{current_path}/{key}" if current_path else key
                    search_trajectory(obj[key], new_path)
                    
            elif isinstance(obj, h5py.Dataset):
                # Check if dataset contains trajectory information
                traj_keywords = ['track', 'trajectory', 'time', 'frame', 'led']
                timing_keywords = ['time', 'frame', 'elapsed', 'duration']
                
                is_trajectory = any(keyword in current_path.lower() for keyword in traj_keywords)
                is_timing = any(keyword in current_path.lower() for keyword in timing_keywords)
                
                if is_trajectory or is_timing:
                    try:
                        data = obj[()]
                        trajectory_data[current_path] = {
                            'data': data,
                            'shape': obj.shape,
                            'dtype': str(obj.dtype),
                            'description': f"Trajectory data from: {current_path}",
                            'type': 'timing' if is_timing else 'trajectory'
                        }
                        print(f"      🎯 Found trajectory data: {current_path} (shape: {obj.shape})")
                    except Exception as e:
                        print(f"      ⚠️  Could not read trajectory data {current_path}: {str(e)}")
                        
        except Exception as e:
            print(f"      ⚠️  Error processing {current_path}: {str(e)}")
    
    search_trajectory(h5file, path)
    return trajectory_data

def process_hdf5_mat_file(filepath):
    """Process a single HDF5-based .mat file"""
    print(f"\n🔍 Processing: {filepath}")
    
    try:
        with h5py.File(filepath, 'r') as h5file:
            # Analyze structure
            analysis = analyze_hdf5_structure(h5file, f"MAT:{os.path.basename(filepath)}")
            
            # Extract coordinate data
            coordinates = extract_coordinates_from_hdf5(h5file)
            
            # Extract trajectory data
            trajectory_data = extract_trajectory_data(h5file)
            
            print(f"   📊 Structure analyzed: {len(analysis.get('children', []))} top-level groups")
            print(f"   📍 Coordinates found: {len(coordinates)} coordinate fields")
            print(f"   🎯 Trajectory data: {len(trajectory_data)} trajectory fields")
            
            return {
                'filepath': filepath,
                'analysis': analysis,
                'coordinates': coordinates,
                'trajectory_data': trajectory_data,
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
            'success': False,
            'error': str(e)
        }

def export_to_combined_hdf5(processed_files, output_path):
    """Export all extracted data to a combined HDF5 file"""
    print(f"\n💾 Exporting to combined HDF5: {output_path}")
    
    with h5py.File(output_path, 'w') as h5file:
        # Create metadata
        metadata_group = h5file.create_group('metadata')
        metadata_group.attrs['extraction_date'] = datetime.now().isoformat()
        metadata_group.attrs['source_files'] = [f['filepath'] for f in processed_files if f['success']]
        metadata_group.attrs['total_files'] = len(processed_files)
        metadata_group.attrs['successful_files'] = sum(1 for f in processed_files if f['success'])
        metadata_group.attrs['extraction_method'] = 'h5py direct read from MATLAB v7.3 files'
        
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
                        # Clean up the coordinate name for HDF5
                        clean_name = coord_name.replace('/', '_').replace(' ', '_')
                        dataset = coord_group.create_dataset(clean_name, data=coord_data['data'])
                        dataset.attrs['description'] = coord_data['description']
                        dataset.attrs['original_path'] = coord_name
                        dataset.attrs['shape'] = coord_data['shape']
                        dataset.attrs['dtype'] = coord_data['dtype']
                    except Exception as e:
                        print(f"     ⚠️  Could not export coordinate {coord_name}: {str(e)}")
            
            # Export trajectory data
            if file_data['trajectory_data']:
                traj_group = file_group.create_group('trajectory_data')
                for traj_name, traj_data in file_data['trajectory_data'].items():
                    try:
                        clean_name = traj_name.replace('/', '_').replace(' ', '_')
                        dataset = traj_group.create_dataset(clean_name, data=traj_data['data'])
                        dataset.attrs['description'] = traj_data['description']
                        dataset.attrs['original_path'] = traj_name
                        dataset.attrs['data_type'] = traj_data['type']
                    except Exception as e:
                        print(f"     ⚠️  Could not export trajectory data {traj_name}: {str(e)}")
        
        print(f"   ✅ Combined HDF5 export completed")

def generate_comprehensive_html(processed_files, output_path):
    """Generate comprehensive HTML summary with interactive features"""
    print(f"\n📄 Generating comprehensive HTML: {output_path}")
    
    # Calculate summary statistics
    total_files = len(processed_files)
    successful_files = sum(1 for f in processed_files if f['success'])
    total_coordinates = sum(len(f['coordinates']) for f in processed_files if f['success'])
    total_trajectory = sum(len(f['trajectory_data']) for f in processed_files if f['success'])
    
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HDF5 MATLAB Trajectory Data Extraction</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #f5f7fa; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }}
        .container {{ max-width: 1400px; margin: 0 auto; padding: 20px; }}
        .summary-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }}
        .stat-card {{ background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; border-left: 4px solid #667eea; }}
        .stat-value {{ font-size: 2.5em; font-weight: bold; color: #667eea; margin-bottom: 10px; }}
        .stat-label {{ color: #6c757d; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }}
        .file-section {{ background: white; margin: 20px 0; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; }}
        .file-header {{ padding: 20px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; }}
        .file-content {{ padding: 20px; }}
        .success-file {{ border-left: 5px solid #28a745; }}
        .error-file {{ border-left: 5px solid #dc3545; }}
        .data-tree {{ background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }}
        .tree-node {{ margin: 5px 0; padding: 8px; background: white; border-radius: 6px; border-left: 3px solid #dee2e6; }}
        .coordinate-node {{ border-left-color: #ffc107; background: #fff9e6; }}
        .trajectory-node {{ border-left-color: #007bff; background: #e6f2ff; }}
        .extractable-node {{ border-left-color: #28a745; background: #e6f7e6; }}
        .collapsible {{ cursor: pointer; user-select: none; }}
        .collapsible:hover {{ background: #e9ecef; }}
        .tree-children {{ margin-left: 20px; display: none; }}
        .tree-children.show {{ display: block; }}
        code {{ background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.9em; }}
        .badge {{ display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }}
        .badge-coordinate {{ background: #fff3cd; color: #856404; }}
        .badge-trajectory {{ background: #cce5ff; color: #004085; }}
        .badge-extractable {{ background: #d1ecf1; color: #0c5460; }}
        .error-message {{ background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin: 10px 0; }}
    </style>
    <script>
        function toggleCollapse(element) {{
            const children = element.nextElementSibling;
            if (children && children.classList.contains('tree-children')) {{
                children.classList.toggle('show');
                const indicator = element.querySelector('.collapse-indicator');
                if (indicator) {{
                    indicator.textContent = children.classList.contains('show') ? '▼' : '▶';
                }}
            }}
        }}
        
        document.addEventListener('DOMContentLoaded', function() {{
            // Auto-expand first level
            document.querySelectorAll('.tree-children').forEach((child, index) => {{
                if (index < 3) child.classList.add('show');
            }});
        }});
    </script>
</head>
<body>
    <div class="header">
        <h1>🎯 HDF5 MATLAB Trajectory Data Extraction</h1>
        <p>Comprehensive analysis of MATLAB v7.3 files using h5py</p>
        <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
    
    <div class="container">
        <div class="summary-grid">
            <div class="stat-card">
                <div class="stat-value">{total_files}</div>
                <div class="stat-label">Total Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{successful_files}</div>
                <div class="stat-label">Successfully Processed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{total_coordinates}</div>
                <div class="stat-label">Coordinate Fields</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">{total_trajectory}</div>
                <div class="stat-label">Trajectory Fields</div>
            </div>
        </div>
"""
    
    # Add file details
    for file_data in processed_files:
        filename = os.path.basename(file_data['filepath'])
        file_class = "success-file" if file_data['success'] else "error-file"
        status_icon = "✅" if file_data['success'] else "❌"
        
        html_content += f"""
        <div class="file-section {file_class}">
            <div class="file-header">
                <h2>{status_icon} {filename}</h2>
                <p><code>{file_data['filepath']}</code></p>
        """
        
        if file_data['success']:
            html_content += f"""
                <div style="margin-top: 10px;">
                    <span class="badge badge-coordinate">{len(file_data['coordinates'])} Coordinates</span>
                    <span class="badge badge-trajectory">{len(file_data['trajectory_data'])} Trajectory Fields</span>
                </div>
            """
        
        html_content += """
            </div>
            <div class="file-content">
        """
        
        if file_data['success']:
            # Add structure tree
            html_content += "<h3>📋 HDF5 Structure</h3>\n"
            html_content += generate_interactive_tree_html(file_data['analysis'])
            
            # Add coordinates section
            if file_data['coordinates']:
                html_content += f"<h3>📍 Coordinate Data ({len(file_data['coordinates'])} fields)</h3>\n"
                html_content += '<div class="data-tree">\n'
                for coord_name, coord_data in file_data['coordinates'].items():
                    html_content += f"""
                    <div class="tree-node coordinate-node">
                        <strong>{coord_name}</strong><br>
                        <code>Shape: {coord_data['shape']}, Type: {coord_data['dtype']}</code><br>
                        <em>{coord_data['description']}</em>
                    </div>
                    """
                html_content += '</div>\n'
            
            # Add trajectory data section
            if file_data['trajectory_data']:
                html_content += f"<h3>🎯 Trajectory Data ({len(file_data['trajectory_data'])} fields)</h3>\n"
                html_content += '<div class="data-tree">\n'
                for traj_name, traj_data in file_data['trajectory_data'].items():
                    html_content += f"""
                    <div class="tree-node trajectory-node">
                        <strong>{traj_name}</strong> 
                        <span class="badge badge-trajectory">{traj_data['type']}</span><br>
                        <code>Shape: {traj_data['shape']}, Type: {traj_data['dtype']}</code><br>
                        <em>{traj_data['description']}</em>
                    </div>
                    """
                html_content += '</div>\n'
        else:
            html_content += f'<div class="error-message"><strong>Error:</strong> {file_data["error"]}</div>\n'
        
        html_content += """
            </div>
        </div>
        """
    
    html_content += """
    </div>
</body>
</html>
    """
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"   ✅ Interactive HTML summary generated")

def generate_interactive_tree_html(analysis, depth=0):
    """Generate interactive HTML tree for data structure"""
    if not analysis or depth > 3:  # Limit depth for readability
        return ""
    
    indent = "  " * depth
    has_children = analysis.get('children', [])
    
    # Determine node class
    node_classes = ["tree-node"]
    if analysis.get('coordinate_potential'):
        node_classes.append("coordinate-node")
    elif analysis.get('extractable'):
        node_classes.append("extractable-node")
    
    # Create collapsible header if has children
    if has_children:
        html = f"{indent}<div class=\"{'collapsible' if has_children else ''} {' '.join(node_classes)}\" onclick=\"toggleCollapse(this)\">\n"
        html += f"{indent}  <span class=\"collapse-indicator\">▶</span> "
    else:
        html = f"{indent}<div class=\"{' '.join(node_classes)}\">\n"
    
    # Node content
    html += f"{indent}  <strong>{analysis['name']}</strong> ({analysis['type']})\n"
    if analysis.get('description'):
        html += f"{indent}  <br><em>{analysis['description']}</em>\n"
    if analysis.get('shape'):
        html += f"{indent}  <br><code>Shape: {analysis['shape']}</code>\n"
    
    # Add badges
    badges = []
    if analysis.get('coordinate_potential'):
        badges.append('<span class="badge badge-coordinate">Coordinate</span>')
    if analysis.get('extractable'):
        badges.append('<span class="badge badge-extractable">Extractable</span>')
    
    if badges:
        html += f"{indent}  <br>{''.join(badges)}\n"
    
    html += f"{indent}</div>\n"
    
    # Add children if they exist
    if has_children:
        html += f"{indent}<div class=\"tree-children\">\n"
        for child in has_children[:10]:  # Limit children for performance
            html += generate_interactive_tree_html(child, depth + 1)
        if len(has_children) > 10:
            html += f"{indent}  <div class=\"tree-node\"><em>... and {len(has_children) - 10} more items</em></div>\n"
        html += f"{indent}</div>\n"
    
    return html

def main():
    """Main HDF5 extraction workflow"""
    print("🔍 HDF5 MATLAB DATA EXTRACTION")
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
        result = process_hdf5_mat_file(str(mat_file))
        processed_files.append(result)
    
    # Export to combined HDF5
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    h5_output = output_dir / f"trajectory_hdf5_extracted_{timestamp}.h5"
    export_to_combined_hdf5(processed_files, str(h5_output))
    
    # Generate comprehensive HTML
    html_output = output_dir / f"trajectory_hdf5_summary_{timestamp}.html"
    generate_comprehensive_html(processed_files, str(html_output))
    
    # Generate JSON summary
    json_output = output_dir / f"trajectory_hdf5_index_{timestamp}.json"
    json_summary = {
        'extraction_date': datetime.now().isoformat(),
        'extraction_method': 'h5py direct read from MATLAB v7.3 files',
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
    
    print("\n🎉 HDF5 EXTRACTION COMPLETE!")
    print("=" * 50)
    print(f"📊 Files processed: {len(processed_files)}")
    print(f"✅ Successful: {sum(1 for f in processed_files if f['success'])}")
    print(f"📍 Coordinate fields: {sum(len(f['coordinates']) for f in processed_files if f['success'])}")
    print(f"🎯 Trajectory fields: {sum(len(f['trajectory_data']) for f in processed_files if f['success'])}")
    print(f"\n📁 Output files:")
    print(f"   HDF5: {h5_output}")
    print(f"   HTML: {html_output}")
    print(f"   JSON: {json_output}")
    print(f"\n🌐 Open the HTML file in your browser to explore the extracted data!")

if __name__ == "__main__":
    main() 