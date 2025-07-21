#!/usr/bin/env python3
"""
FlyWire CHRIMSON Neuroglancer Backend
Cloud Run Compatible
"""

import neuroglancer
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from typing import List, Dict, Any
import json
import os
from dotenv import load_dotenv
from caveclient import CAVEclient
import pandas as pd

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS for Firebase frontend
CORS(app, origins=[
    'https://neurovis-3d.web.app',
    'https://neurovis-3d.firebaseapp.com', 
    'http://localhost:4200',
    'http://0.0.0.0:4200'
])

class FlyWireNeuroglancerService:
    """FlyWire larval circuit visualization service"""
    
    def __init__(self):
        self.viewer = None
        self.cave_client = None
        self.current_circuits = []
        self.cave_token = os.getenv('FLYWIRE_CAVE_TOKEN', 'b927b9cd93ba0a9b569ab9e32d231dbc')
        self.dataset = 'flywire_fafb_production'
        
        # Get Neuroglancer port from environment
        self.neuroglancer_port = int(os.getenv('NEUROGLANCER_PORT', '9997'))
        
        # CHRIMSON neuron types from FlyWire annotations
        self.chrimson_cell_types = [
            'mechanosensory',
            'touch_receptor', 
            'stretch_receptor',
            'campaniform_sensilla',
            'proprioceptor',
            'nociceptor',
            'chordotonal',
            'bristle'
        ]
        
        # Larval neuron annotation patterns
        self.larval_patterns = [
            'larval',
            'L1',
            'L2', 
            'L3',
            'instar'
        ]
        
        self.initialize_services()
    
    def initialize_services(self):
        """Initialize Neuroglancer and CAVE client"""
        try:
            # Initialize Neuroglancer for cloud environment
            neuroglancer.set_server_bind_address('0.0.0.0', self.neuroglancer_port)
            self.viewer = neuroglancer.Viewer()
            logger.info(f"✅ Neuroglancer viewer initialized on port {self.neuroglancer_port}")
            
            # Configure SSL context for CAVE client
            import ssl
            import urllib3
            from urllib3.util.ssl_ import create_urllib3_context
            
            # Create a more permissive SSL context for development
            ssl_context = create_urllib3_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            # Disable SSL warnings for development
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            
            # Initialize CAVE client with SSL configuration
            import requests
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry
            
            # Create session with retry strategy
            session = requests.Session()
            
            # Configure retry strategy
            retry_strategy = Retry(
                total=3,
                backoff_factor=1,
                status_forcelist=[429, 500, 502, 503, 504],
                allowed_methods=["HEAD", "GET", "OPTIONS"]
            )
            
            # Create adapter with SSL context
            class SSLAdapter(HTTPAdapter):
                def init_poolmanager(self, *args, **kwargs):
                    kwargs['ssl_context'] = ssl_context
                    return super().init_poolmanager(*args, **kwargs)
            
            adapter = SSLAdapter(max_retries=retry_strategy)
            session.mount("https://", adapter)
            session.mount("http://", adapter)
            
            # Try to initialize CAVE client with custom session
            try:
                self.cave_client = CAVEclient(
                    datastack_name=self.dataset,
                    server_address='https://cave.flywire.ai',
                    auth_token=self.cave_token
                )
                
                # Monkey patch the session to use our SSL configuration
                if hasattr(self.cave_client, '_info') and hasattr(self.cave_client._info, 'session'):
                    self.cave_client._info.session = session
                elif hasattr(self.cave_client, 'info') and hasattr(self.cave_client.info, 'session'):
                    self.cave_client.info.session = session
                
                logger.info("✅ FlyWire CAVE client initialized with SSL configuration")
                logger.info(f"📊 Dataset: {self.dataset}")
                
                # Test connection with timeout
                import signal
                
                def timeout_handler(signum, frame):
                    raise TimeoutError("Connection test timed out")
                
                signal.signal(signal.SIGALRM, timeout_handler)
                signal.alarm(30)  # 30 second timeout
                
                try:
                    info = self.cave_client.info.get_datastack_info()
                    logger.info(f"🔗 Successfully connected to FlyWire: {info['description']}")
                    signal.alarm(0)  # Disable alarm
                except TimeoutError:
                    logger.error("❌ Connection test timed out")
                    raise RuntimeError("FlyWire connection failed: timeout")
                except Exception as conn_error:
                    logger.error(f"❌ Connection test failed: {conn_error}")
                    raise RuntimeError(f"FlyWire connection failed: {conn_error}")
                finally:
                    signal.alarm(0)  # Disable alarm
                
            except Exception as cave_error:
                logger.error(f"❌ CAVE client initialization failed: {cave_error}")
                raise RuntimeError(f"Cannot proceed without FlyWire connection: {cave_error}")
            
        except Exception as e:
            logger.error(f"❌ FlyWire initialization failed: {e}")
            raise RuntimeError(f"Cannot proceed without FlyWire connection: {e}")
    
    def search_chrimson_circuits(self) -> List[Dict[str, Any]]:
        """Search for CHRIMSON-expressing larval neurons from FlyWire"""
        try:
            circuits = []
            
            # Query mechanosensory neurons from FlyWire
            mechanosensory_neurons = self._query_mechanosensory_neurons()
            if mechanosensory_neurons:
                circuits.append({
                    'name': 'Mechanosensory Larval Circuit',
                    'neurons': mechanosensory_neurons,
                    'type': 'mechanosensory',
                    'color': '#FF4081',  # Pink for mechanosensory
                    'source': 'flywire_cave'
                })
            
            # Query photoreceptor neurons
            photoreceptor_neurons = self._query_photoreceptor_neurons()
            if photoreceptor_neurons:
                circuits.append({
                    'name': 'Photoreceptor Circuit', 
                    'neurons': photoreceptor_neurons,
                    'type': 'photoreceptor',
                    'color': '#E91E63',  # Deep pink
                    'source': 'flywire_cave'
                })
            
            # Query larval-specific neurons
            larval_neurons = self._query_larval_neurons()
            if larval_neurons:
                circuits.append({
                    'name': 'Larval Specific Circuits',
                    'neurons': larval_neurons,
                    'type': 'larval',
                    'color': '#2196F3',  # Blue
                    'source': 'flywire_cave'
                })
            
            self.current_circuits = circuits
            logger.info(f"🔍 Found {len(circuits)} circuit types from FlyWire")
            total_neurons = sum(len(c['neurons']) for c in circuits)
            logger.info(f"🧠 Total neurons: {total_neurons}")
            
            return circuits
            
        except Exception as e:
            logger.error(f"❌ Circuit search failed: {e}")
            raise RuntimeError(f"Failed to get FlyWire data: {e}")
    
    def _query_mechanosensory_neurons(self) -> List[Dict[str, Any]]:
        """Query mechanosensory neurons from FlyWire CAVE"""
        try:
            logger.info("🔍 Querying mechanosensory neurons from FlyWire...")
            
            # Get cell type table from CAVE
            cell_types_table = self.cave_client.materialize.get_table_metadata()
            logger.info(f"📊 Available tables: {list(cell_types_table.keys())}")
            
            # Query for mechanosensory cell types
            try:
                # Try to get cell type annotations
                cell_df = self.cave_client.materialize.query_table('cell_type_local')
                logger.info(f"📊 Retrieved {len(cell_df)} cell type annotations")
                
                # Filter for mechanosensory types
                mechanosensory_mask = cell_df['cell_type'].str.contains(
                    '|'.join(self.chrimson_cell_types), 
                    case=False, 
                    na=False
                )
                mechanosensory_df = cell_df[mechanosensory_mask]
                
                logger.info(f"🔍 Found {len(mechanosensory_df)} mechanosensory neurons")
                
                neurons = []
                for _, row in mechanosensory_df.head(20).iterrows():  # Limit to 20 for demo
                    # Get neuron position and mesh data
                    neuron_id = row['pt_root_id']
                    
                    # Get soma position
                    soma_position = self._get_neuron_soma_position(neuron_id)
                    
                    neuron = {
                        'id': str(neuron_id),
                        'type': row['cell_type'],
                        'position': soma_position,
                        'activity': 0.0,
                        'mesh_id': neuron_id,  # For mesh loading
                        'confidence': row.get('confidence', 1.0),
                        'source': 'flywire'
                    }
                    neurons.append(neuron)
                
                logger.info(f"✅ Processed {len(neurons)} mechanosensory neurons")
                return neurons
                
            except Exception as table_error:
                logger.error(f"❌ Cell type table query failed: {table_error}")
                raise RuntimeError(f"Cannot get mechanosensory data: {table_error}")
                
        except Exception as e:
            logger.error(f"❌ Mechanosensory query failed: {e}")
            raise RuntimeError(f"Cannot get mechanosensory data: {e}")
    
    def _get_neuron_soma_position(self, neuron_id: int) -> List[float]:
        """Get soma position for a neuron from FlyWire"""
        try:
            # Query neuron's soma location using CAVE
            soma_df = self.cave_client.materialize.query_table(
                'nucleus_detection_v0',
                filter_equal_dict={'pt_root_id': neuron_id}
            )
            
            if len(soma_df) > 0:
                # Use the detected nucleus position
                soma_row = soma_df.iloc[0]
                position = [
                    float(soma_row['pt_position_x']),
                    float(soma_row['pt_position_y']),
                    float(soma_row['pt_position_z'])
                ]
                logger.debug(f"🎯 Soma position for {neuron_id}: {position}")
                return position
            else:
                raise RuntimeError(f"No soma position found for neuron {neuron_id}")
                
        except Exception as e:
            logger.error(f"❌ Soma position query failed for {neuron_id}: {e}")
            raise RuntimeError(f"Cannot get soma position for neuron {neuron_id}: {e}")
    
    def _query_photoreceptor_neurons(self) -> List[Dict[str, Any]]:
        """Query photoreceptor neurons from FlyWire"""
        try:
            logger.info("🔍 Querying photoreceptor neurons...")
            
            # Query from cell type annotations
            cell_df = self.cave_client.materialize.query_table('cell_type_local')
            
            # Filter for photoreceptor types
            photoreceptor_mask = cell_df['cell_type'].str.contains(
                'photoreceptor|R1|R2|R3|R4|R5|R6|R7|R8', 
                case=False, 
                na=False
            )
            photoreceptor_df = cell_df[photoreceptor_mask]
            
            neurons = []
            for _, row in photoreceptor_df.head(10).iterrows():
                neuron_id = row['pt_root_id']
                soma_position = self._get_neuron_soma_position(neuron_id)
                
                neuron = {
                    'id': str(neuron_id),
                    'type': row['cell_type'],
                    'position': soma_position,
                    'activity': 0.0,
                    'mesh_id': neuron_id,
                    'confidence': row.get('confidence', 1.0),
                    'source': 'flywire_photoreceptor'
                }
                neurons.append(neuron)
            
            logger.info(f"✅ Retrieved {len(neurons)} photoreceptor neurons")
            return neurons
            
        except Exception as e:
            logger.error(f"❌ Photoreceptor query failed: {e}")
            raise RuntimeError(f"Cannot get photoreceptor data: {e}")
    
    def _query_larval_neurons(self) -> List[Dict[str, Any]]:
        """Query larval-specific neurons from FlyWire"""
        try:
            logger.info("🔍 Querying larval neurons...")
            
            # Query from cell type annotations
            cell_df = self.cave_client.materialize.query_table('cell_type_local')
            
            # Filter for larval patterns
            larval_mask = cell_df['cell_type'].str.contains(
                '|'.join(self.larval_patterns), 
                case=False, 
                na=False
            )
            larval_df = cell_df[larval_mask]
            
            neurons = []
            for _, row in larval_df.head(10).iterrows():
                neuron_id = row['pt_root_id']
                soma_position = self._get_neuron_soma_position(neuron_id)
                
                neuron = {
                    'id': str(neuron_id),
                    'type': row['cell_type'],
                    'position': soma_position,
                    'activity': 0.0,
                    'mesh_id': neuron_id,
                    'confidence': row.get('confidence', 1.0),
                    'source': 'flywire_larval'
                }
                neurons.append(neuron)
            
            logger.info(f"✅ Retrieved {len(neurons)} larval neurons")
            return neurons
            
        except Exception as e:
            logger.error(f"❌ Larval query failed: {e}")
            raise RuntimeError(f"Cannot get larval data: {e}")
    
    def create_neuroglancer_visualization(self) -> str:
        """Create Neuroglancer visualization with FlyWire meshes"""
        try:
            # Clear existing layers
            with self.viewer.txn() as s:
                s.layers.clear()
                
                # Set FlyWire coordinate space
                s.dimensions = neuroglancer.CoordinateSpace(
                    names=['x', 'y', 'z'],
                    units=['nm', 'nm', 'nm'],
                    scales=[1, 1, 1]
                )
                
                # Add FlyWire image layer
                s.layers['FAFB'] = neuroglancer.ImageLayer(
                    source='precomputed://https://flywire-daf-20230503.s3.amazonaws.com/align_em'
                )
                
                # Add circuit layers with meshes
                for circuit in self.current_circuits:
                    self._add_circuit_layer(s, circuit)
                
                # Set view to larval brain region
                s.position = [50000, 30000, 20000]  # Larval brain center
                s.cross_section_scale = 50
                s.projection_scale = 500
                s.layout = '4panel'
            
            url = str(self.viewer)
            logger.info(f"🎯 Neuroglancer URL: {url}")
            return url
            
        except Exception as e:
            logger.error(f"❌ Visualization creation failed: {e}")
            raise RuntimeError(f"Cannot create visualization: {e}")
    
    def _add_circuit_layer(self, state, circuit: Dict[str, Any]):
        """Add circuit with meshes to Neuroglancer"""
        try:
            # Add segmentation layer for neuron meshes
            mesh_source = f'precomputed://https://flywire-daf-20230503.s3.amazonaws.com/segmentation'
            
            # Create segmentation layer with neuron meshes
            layer = neuroglancer.SegmentationLayer(
                source=mesh_source,
                segments=[neuron['mesh_id'] for neuron in circuit['neurons']]
            )
            
            # Set circuit-specific visualization properties
            layer.segment_colors = {
                neuron['mesh_id']: circuit['color'] 
                for neuron in circuit['neurons']
            }
            
            layer.visible = True
            state.layers[f"{circuit['name']}_meshes"] = layer
            
            # Add annotation layer for soma positions
            annotations = []
            for neuron in circuit['neurons']:
                point = neuroglancer.PointAnnotation(
                    point=neuron['position'],
                    id=neuron['id'],
                    description=f"{circuit['name']}: {neuron['type']}\n"
                               f"Activity: {neuron.get('activity', 0):.2f}\n"
                               f"Confidence: {neuron.get('confidence', 1.0):.2f}\n"
                               f"Source: {neuron.get('source', 'unknown')}"
                )
                annotations.append(point)
            
            # Create annotation layer
            annotation_layer = neuroglancer.LocalAnnotationLayer(
                dimensions=state.dimensions,
                annotations=annotations
            )
            
            annotation_layer.annotation_color = circuit['color']
            annotation_layer.visible = True
            
            state.layers[f"{circuit['name']}_annotations"] = annotation_layer
            
            logger.info(f"➕ Added layer: {circuit['name']} ({len(circuit['neurons'])} neurons)")
            
        except Exception as e:
            logger.error(f"❌ Failed to add circuit layer {circuit['name']}: {e}")
            raise RuntimeError(f"Cannot add circuit layer {circuit['name']}: {e}")
    
    def update_circuit_activity(self, fem_data: Dict[str, Any]):
        """Update circuit activity based on FEM data"""
        try:
            optogenetic_stimulus = fem_data.get('optogeneticStimulus', False)
            mechanical_force = fem_data.get('femParameters', {}).get('mechanicalForce', 0)
            timestamp = fem_data.get('timestamp', 0)
            peak_time = fem_data.get('peakTime', 11.5)
            
            # Calculate temporal factor
            time_factor = np.exp(-abs(timestamp - peak_time) / 5.0)
            
            for circuit in self.current_circuits:
                for neuron in circuit['neurons']:
                    if 'mechanosensory' in neuron['type'] or 'touch' in neuron['type']:
                        # CHRIMSON response
                        base_activity = 0.9 if optogenetic_stimulus else 0.05
                        mechanical_boost = mechanical_force * 0.2
                        neuron['activity'] = min(1.0, (base_activity + mechanical_boost) * time_factor)
                    
                    elif 'photoreceptor' in neuron['type']:
                        # Photoreceptor response
                        base_activity = 0.8 if optogenetic_stimulus else 0.1
                        neuron['activity'] = base_activity * time_factor
                    
                    else:
                        # Other neurons
                        base_activity = mechanical_force * 0.15
                        neuron['activity'] = base_activity * time_factor
            
            # Update visualization
            self._update_visualization()
            logger.info(f"🔄 Updated activity for {len(self.current_circuits)} circuits")
            
        except Exception as e:
            logger.error(f"❌ Activity update failed: {e}")
            raise RuntimeError(f"Cannot update activity: {e}")
    
    def _update_visualization(self):
        """Update Neuroglancer visualization"""
        try:
            # Recreate layers with updated activity
            with self.viewer.txn() as s:
                # Update segment colors based on activity
                for circuit in self.current_circuits:
                    layer_name = f"{circuit['name']}_meshes"
                    if layer_name in s.layers:
                        layer = s.layers[layer_name]
                        
                        # Update colors based on activity
                        new_colors = {}
                        for neuron in circuit['neurons']:
                            activity = neuron.get('activity', 0)
                            # Interpolate between base color and bright color based on activity
                            base_color = int(circuit['color'].replace('#', ''), 16)
                            bright_factor = activity
                            new_colors[neuron['mesh_id']] = f"#{base_color:06x}"
                        
                        layer.segment_colors = new_colors
            
        except Exception as e:
            logger.error(f"❌ Visualization update failed: {e}")
            raise RuntimeError(f"Cannot update visualization: {e}")

# Global service instance
try:
    flywire_service = FlyWireNeuroglancerService()
except Exception as init_error:
    logger.error(f"❌ FlyWire service initialization failed: {init_error}")
    flywire_service = None

# Flask API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    if flywire_service is None:
        return jsonify({
            'status': 'error',
            'error': 'FlyWire service not initialized',
            'flywire_connected': False,
            'environment': 'cloud_run' if os.getenv('K_SERVICE') else 'local'
        }), 500
    
    try:
        # Test FlyWire connection
        info = flywire_service.cave_client.info.get_datastack_info()
        
        return jsonify({
            'status': 'healthy',
            'neuroglancer_url': str(flywire_service.viewer) if flywire_service.viewer else None,
            'flywire_connected': True,
            'dataset': flywire_service.dataset,
            'dataset_info': info['description'],
            'environment': 'cloud_run' if os.getenv('K_SERVICE') else 'local',
            'port': os.getenv('PORT', '8080')
        })
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'flywire_connected': False,
            'environment': 'cloud_run' if os.getenv('K_SERVICE') else 'local'
        }), 500

@app.route('/api/circuits/search', methods=['GET'])
def search_circuits():
    """Search for CHRIMSON circuits from FlyWire"""
    if flywire_service is None:
        return jsonify({
            'success': False, 
            'error': 'FlyWire service not initialized',
            'data_source': 'flywire'
        }), 500
    
    try:
        circuits = flywire_service.search_chrimson_circuits()
        return jsonify({
            'success': True,
            'circuits': circuits,
            'count': len(circuits),
            'total_neurons': sum(len(c['neurons']) for c in circuits),
            'data_source': 'flywire'
        })
    except Exception as e:
        logger.error(f"❌ Circuit search failed: {e}")
        return jsonify({
            'success': False, 
            'error': str(e),
            'data_source': 'flywire'
        }), 500

@app.route('/api/visualization/create', methods=['POST'])
def create_visualization():
    """Create Neuroglancer visualization with meshes"""
    if flywire_service is None:
        return jsonify({
            'success': False, 
            'error': 'FlyWire service not initialized',
            'data_source': 'flywire'
        }), 500
    
    try:
        url = flywire_service.create_neuroglancer_visualization()
        return jsonify({
            'success': True,
            'neuroglancer_url': url,
            'features': ['meshes', 'flywire_image', 'coordinates'],
            'data_source': 'flywire'
        })
    except Exception as e:
        logger.error(f"❌ Visualization creation failed: {e}")
        return jsonify({
            'success': False, 
            'error': str(e),
            'data_source': 'flywire'
        }), 500

@app.route('/api/activity/update', methods=['POST'])
def update_activity():
    """Update circuit activity from FEM data"""
    if flywire_service is None:
        return jsonify({
            'success': False, 
            'error': 'FlyWire service not initialized',
            'data_source': 'flywire'
        }), 500
    
    try:
        fem_data = request.get_json()
        flywire_service.update_circuit_activity(fem_data)
        return jsonify({
            'success': True,
            'data_source': 'flywire'
        })
    except Exception as e:
        logger.error(f"❌ Activity update failed: {e}")
        return jsonify({
            'success': False, 
            'error': str(e),
            'data_source': 'flywire'
        }), 500

@app.route('/api/circuits/current', methods=['GET'])
def get_circuits():
    """Get current circuit data"""
    if flywire_service is None:
        return jsonify({
            'success': False, 
            'error': 'FlyWire service not initialized',
            'data_source': 'flywire'
        }), 500
    
    return jsonify({
        'success': True,
        'circuits': flywire_service.current_circuits,
        'data_source': 'flywire'
    })

if __name__ == '__main__':
    if flywire_service is None:
        logger.error("❌ Cannot start - FlyWire service not initialized")
        exit(1)
    
    # Get port from environment (Cloud Run uses PORT env var)
    port = int(os.getenv('PORT', '8080'))
    
    logger.info("🚀 Starting FlyWire CHRIMSON Backend...")
    logger.info("🔴 CHRIMSON Red Light → Phantom Mechanosensation")
    logger.info("🧠 FlyWire Data Integration")
    logger.info(f"🎯 Neuroglancer: http://0.0.0.0:{flywire_service.neuroglancer_port}")
    logger.info(f"🔌 API: http://0.0.0.0:{port}/api/health")
    logger.info(f"🌐 Environment: {'Cloud Run' if os.getenv('K_SERVICE') else 'Local'}")
    
    try:
        app.run(
            host='0.0.0.0',
            port=port,
            debug=False,  # Disable debug in production
            threaded=True
        )
    except Exception as e:
        logger.error(f"❌ Backend failed to start: {e}")
        raise 