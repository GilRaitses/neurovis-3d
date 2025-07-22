#!/usr/bin/env python3
"""
Download FlyWire datasets for offline use
Replaces API calls with local data files
"""

import requests
import pandas as pd
import json
import os
from pathlib import Path
import zipfile
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FlyWireDataDownloader:
    def __init__(self, data_dir="flywire_data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # GitHub repository for annotations
        self.github_base = "https://raw.githubusercontent.com/flyconnectome/flywire_annotations/main"
        
        # Zenodo URLs for connectivity data
        self.zenodo_synapses = "https://zenodo.org/api/records/10676866"
        self.zenodo_skeletons = "https://zenodo.org/api/records/10877326"
        
    def download_all_datasets(self):
        """Download all essential FlyWire datasets"""
        logger.info("🚀 Starting FlyWire dataset download...")
        
        try:
            # 1. Download neuron annotations
            self.download_neuron_annotations()
            
            # 2. Download connectivity data info
            self.get_connectivity_download_info()
            
            # 3. Create data loading functions
            self.create_data_loaders()
            
            logger.info("✅ All datasets downloaded successfully!")
            self.print_summary()
            
        except Exception as e:
            logger.error(f"❌ Download failed: {e}")
            raise
    
    def download_neuron_annotations(self):
        """Download neuron annotation files from GitHub"""
        logger.info("📥 Downloading neuron annotations...")
        
        annotation_files = [
            "supplemental_files/Supplemental_file1_neuron_annotations.tsv",
            "supplemental_files/Supplemental_file2_non_neuron_annotations.tsv", 
            "supplemental_files/Supplemental_file4_summary_with_ngl_links.csv"
        ]
        
        for file_path in annotation_files:
            url = f"{self.github_base}/{file_path}"
            local_path = self.data_dir / Path(file_path).name
            
            logger.info(f"  📋 Downloading {Path(file_path).name}...")
            response = requests.get(url)
            response.raise_for_status()
            
            with open(local_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"  ✅ Saved to {local_path}")
        
        # Load and analyze the main annotations file
        self.analyze_neuron_annotations()
    
    def analyze_neuron_annotations(self):
        """Analyze downloaded neuron annotations to find our target neurons"""
        logger.info("🔍 Analyzing neuron annotations...")
        
        # Load main annotations file
        annotations_file = self.data_dir / "Supplemental_file1_neuron_annotations.tsv"
        df = pd.read_csv(annotations_file, sep='\t')
        
        logger.info(f"  📊 Total neurons in dataset: {len(df):,}")
        
        # Find mechanosensory neurons
        mechanosensory_patterns = [
            'mechanosensory', 'touch', 'stretch', 'campaniform', 
            'proprioceptor', 'nociceptor', 'chordotonal'
        ]
        
        mechanosensory_mask = df['cell_type'].str.contains(
            '|'.join(mechanosensory_patterns), 
            case=False, 
            na=False
        )
        mechanosensory_df = df[mechanosensory_mask]
        
        logger.info(f"  🎯 Mechanosensory neurons found: {len(mechanosensory_df)}")
        
        # Find larval neurons
        larval_mask = df['cell_type'].str.contains('larval|L1|L2|L3', case=False, na=False)
        larval_df = df[larval_mask]
        
        logger.info(f"  🐛 Larval neurons found: {len(larval_df)}")
        
        # Find CHRIMSON-related neurons (might be in different annotation)
        chrimson_mask = df['cell_type'].str.contains('CHRIMSON|chrimson|optogenetic', case=False, na=False)
        chrimson_df = df[chrimson_mask]
        
        logger.info(f"  🔬 CHRIMSON neurons found: {len(chrimson_df)}")
        
        # Save filtered datasets
        mechanosensory_df.to_csv(self.data_dir / "mechanosensory_neurons.csv", index=False)
        larval_df.to_csv(self.data_dir / "larval_neurons.csv", index=False)
        
        if len(chrimson_df) > 0:
            chrimson_df.to_csv(self.data_dir / "chrimson_neurons.csv", index=False)
        
        # Show unique cell types
        logger.info(f"  📋 Unique cell types: {df['cell_type'].nunique():,}")
        logger.info(f"  🏷️  Top cell types:")
        for cell_type, count in df['cell_type'].value_counts().head(10).items():
            logger.info(f"     {cell_type}: {count}")
    
    def get_connectivity_download_info(self):
        """Get download links for connectivity data from Zenodo"""
        logger.info("🔗 Getting connectivity data download info...")
        
        # Get synapses data info
        response = requests.get(self.zenodo_synapses)
        synapses_info = response.json()
        
        # Get skeletons data info  
        response = requests.get(self.zenodo_skeletons)
        skeletons_info = response.json()
        
        # Save download instructions
        download_info = {
            "synapses_and_connectivity": {
                "description": "Synapses table and edge list from Dorkenwald et al.",
                "doi": "10.5281/zenodo.10676866",
                "files": []
            },
            "skeletons_and_nblast": {
                "description": "Skeletons and NBLAST scores from Schlegel et al.",  
                "doi": "10.5281/zenodo.10877326",
                "files": []
            }
        }
        
        # Extract file download URLs
        for file_info in synapses_info.get('files', []):
            download_info["synapses_and_connectivity"]["files"].append({
                "filename": file_info['key'],
                "size_mb": round(file_info['size'] / (1024*1024), 2),
                "download_url": file_info['links']['self']
            })
        
        for file_info in skeletons_info.get('files', []):
            download_info["skeletons_and_nblast"]["files"].append({
                "filename": file_info['key'],
                "size_mb": round(file_info['size'] / (1024*1024), 2), 
                "download_url": file_info['links']['self']
            })
        
        # Save download info
        with open(self.data_dir / "download_info.json", 'w') as f:
            json.dump(download_info, f, indent=2)
        
        logger.info("  💾 Saved download_info.json with Zenodo URLs")
        
        # Show download sizes
        total_synapses_size = sum(f['size_mb'] for f in download_info["synapses_and_connectivity"]["files"])
        total_skeletons_size = sum(f['size_mb'] for f in download_info["skeletons_and_nblast"]["files"])
        
        logger.info(f"  📦 Synapses data total size: {total_synapses_size:,.1f} MB")
        logger.info(f"  📦 Skeletons data total size: {total_skeletons_size:,.1f} MB")
    
    def create_data_loaders(self):
        """Create Python functions to load and use the downloaded data"""
        logger.info("🛠️  Creating data loader functions...")
        
        loader_code = '''#!/usr/bin/env python3
"""
FlyWire Data Loaders - Use downloaded datasets instead of API calls
"""

import pandas as pd
import json
from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class FlyWireDataLoader:
    """Load FlyWire data from downloaded files instead of API calls"""
    
    def __init__(self, data_dir="flywire_data"):
        self.data_dir = Path(data_dir)
        self._neuron_annotations = None
        self._mechanosensory_neurons = None
        self._larval_neurons = None
    
    @property 
    def neuron_annotations(self):
        """Lazy load main neuron annotations"""
        if self._neuron_annotations is None:
            file_path = self.data_dir / "Supplemental_file1_neuron_annotations.tsv"
            self._neuron_annotations = pd.read_csv(file_path, sep='\\t')
        return self._neuron_annotations
    
    @property
    def mechanosensory_neurons(self):
        """Lazy load mechanosensory neurons"""
        if self._mechanosensory_neurons is None:
            file_path = self.data_dir / "mechanosensory_neurons.csv"
            if file_path.exists():
                self._mechanosensory_neurons = pd.read_csv(file_path)
            else:
                logger.warning("Mechanosensory neurons file not found")
                return pd.DataFrame()
        return self._mechanosensory_neurons
    
    def search_larval_mechanosensory_neurons(self, limit=20) -> List[Dict[str, Any]]:
        """
        Replace the API call with local data search
        Returns neurons in the same format as the API
        """
        try:
            # Get mechanosensory neurons
            mech_df = self.mechanosensory_neurons
            
            if len(mech_df) == 0:
                logger.warning("No mechanosensory neurons found in local data")
                return []
            
            # Convert to API format
            neurons = []
            for _, row in mech_df.head(limit).iterrows():
                neuron = {
                    'id': str(row.get('root_id', row.get('pt_root_id', 'unknown'))),
                    'type': row.get('cell_type', 'mechanosensory'),
                    'position': [0.0, 0.0, 0.0],  # Would need position data
                    'activity': 0.0,
                    'mesh_id': row.get('root_id', row.get('pt_root_id')),
                    'confidence': 1.0,
                    'source': 'local_data'
                }
                neurons.append(neuron)
            
            logger.info(f"Found {len(neurons)} mechanosensory neurons in local data")
            return neurons
            
        except Exception as e:
            logger.error(f"Failed to load mechanosensory neurons: {e}")
            return []
    
    def get_circuits(self) -> List[Dict[str, Any]]:
        """Get circuit data from local files"""
        circuits = []
        
        # Mechanosensory circuit
        mech_neurons = self.search_larval_mechanosensory_neurons()
        if mech_neurons:
            circuits.append({
                'name': 'Mechanosensory Larval Circuit',
                'neurons': mech_neurons,
                'type': 'mechanosensory', 
                'color': '#FF4081',
                'source': 'local_data'
            })
        
        return circuits
    
    def get_download_instructions(self):
        """Get instructions for downloading additional data"""
        download_info_file = self.data_dir / "download_info.json"
        if download_info_file.exists():
            with open(download_info_file) as f:
                return json.load(f)
        return {}

# Usage example:
# loader = FlyWireDataLoader()
# circuits = loader.get_circuits()
# neurons = loader.search_larval_mechanosensory_neurons()
'''
        
        with open(self.data_dir / "flywire_data_loader.py", 'w') as f:
            f.write(loader_code)
        
        logger.info("  💾 Created flywire_data_loader.py")
    
    def print_summary(self):
        """Print download summary"""
        logger.info("\n📋 DOWNLOAD SUMMARY")
        logger.info("="*50)
        logger.info(f"📁 Data directory: {self.data_dir.absolute()}")
        
        files = list(self.data_dir.glob("*"))
        logger.info(f"📄 Files downloaded: {len(files)}")
        
        for file_path in sorted(files):
            size_mb = file_path.stat().st_size / (1024*1024)
            logger.info(f"   {file_path.name} ({size_mb:.2f} MB)")
        
        logger.info("\n🚀 NEXT STEPS:")
        logger.info("1. Use flywire_data_loader.py to access data locally")
        logger.info("2. Download connectivity data from Zenodo (see download_info.json)")
        logger.info("3. Update your backend to use FlyWireDataLoader instead of API calls")
        logger.info("\n✅ No more SSL issues - everything is local!")

if __name__ == "__main__":
    downloader = FlyWireDataDownloader()
    downloader.download_all_datasets() 