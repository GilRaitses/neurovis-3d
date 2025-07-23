#!/usr/bin/env node

/**
 * TRAJECTORY DATA EXTRACTION PROBE
 * Comprehensive analysis of all available data files
 * Shows exactly what we can extract from each source
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('🔍 TRAJECTORY DATA EXTRACTION PROBE');
console.log('='.repeat(80));

const dataDir = './src/assets/data';
const trajDir = './src/assets/data/trajectories';

// Probe results storage
const extractionResults = {
    timestamp: new Date().toISOString(),
    files_analyzed: [],
    extraction_summary: {},
    extracted_data: {}
};

/**
 * PROBE 1: JSON Files Analysis
 */
async function probeJSONFiles() {
    console.log('\n📊 PROBE 1: JSON DATA FILES');
    console.log('-'.repeat(50));
    
    const jsonFiles = [
        'mechanosensation_experimental_data.json',
        'fem_data_inventory.json', 
        'final_pipeline_summary.json',
        'population_statistics.json',
        'temporal_features.json',
        'envelope_features.json',
        'fem_analysis_results.json',
        'sample_data.json'
    ];
    
    for (const filename of jsonFiles) {
        const filepath = path.join(dataDir, filename);
        
        if (fs.existsSync(filepath)) {
            console.log(`\n🔎 Analyzing: ${filename}`);
            
            try {
                const rawData = fs.readFileSync(filepath, 'utf8');
                const jsonData = JSON.parse(rawData);
                
                const analysis = analyzeJSONStructure(jsonData, filename);
                extractionResults.files_analyzed.push(filename);
                extractionResults.extracted_data[filename] = analysis;
                
                console.log(`   ✅ Size: ${(rawData.length / 1024).toFixed(1)}KB`);
                console.log(`   📋 Structure: ${analysis.structure_type}`);
                console.log(`   🎯 Contains: ${analysis.data_types.join(', ')}`);
                
                if (analysis.trajectory_potential) {
                    console.log(`   🚀 TRAJECTORY POTENTIAL: ${analysis.trajectory_potential}`);
                }
                
                if (analysis.coordinate_fields.length > 0) {
                    console.log(`   📍 Coordinate Fields: ${analysis.coordinate_fields.join(', ')}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error reading ${filename}: ${error.message}`);
            }
        } else {
            console.log(`   ⚠️  File not found: ${filename}`);
        }
    }
}

/**
 * PROBE 2: Binary Files Analysis  
 */
async function probeBinaryFiles() {
    console.log('\n\n📦 PROBE 2: BINARY DATA FILES');
    console.log('-'.repeat(50));
    
    const binaryFiles = [
        'trajectory_coordinates_2025-07-23_13-54-06.h5',
        'trajectories/trajectory_001.mat',
        'trajectories/experiment_data.mat', 
        'trajectories/all_trajectories.mat'
    ];
    
    for (const filename of binaryFiles) {
        const filepath = path.join(dataDir, filename);
        
        if (fs.existsSync(filepath)) {
            console.log(`\n🔎 Analyzing: ${filename}`);
            
            const stats = fs.statSync(filepath);
            const buffer = fs.readFileSync(filepath);
            
            const analysis = analyzeBinaryFile(buffer, filename);
            extractionResults.files_analyzed.push(filename);
            extractionResults.extracted_data[filename] = analysis;
            
            console.log(`   ✅ Size: ${(stats.size / 1024).toFixed(1)}KB`);
            console.log(`   📋 Format: ${analysis.format_detected}`);
            console.log(`   🔧 Header Info: ${analysis.header_info}`);
            
            if (analysis.extractable_content.length > 0) {
                console.log(`   📤 Extractable: ${analysis.extractable_content.join(', ')}`);
            }
            
        } else {
            console.log(`   ⚠️  File not found: ${filename}`);
        }
    }
}

/**
 * PROBE 3: Extract Actual Trajectory Data
 */
async function extractTrajectoryData() {
    console.log('\n\n🎯 PROBE 3: ACTUAL DATA EXTRACTION');
    console.log('-'.repeat(50));
    
    // Extract from mechanosensation_experimental_data.json
    const expDataPath = path.join(dataDir, 'mechanosensation_experimental_data.json');
    
    if (fs.existsSync(expDataPath)) {
        console.log('\n📊 EXTRACTING: Mechanosensation Experimental Data');
        
        const expData = JSON.parse(fs.readFileSync(expDataPath, 'utf8'));
        
        // Extract track coordinates and timing info
        const extractedTracks = extractTracksFromExperimentalData(expData);
        
        console.log(`   ✅ Extracted ${extractedTracks.length} tracks`);
        console.log(`   📏 Bins per track: ${extractedTracks[0]?.bins?.length || 0}`);
        console.log(`   ⏱️  Time range: ${extractedTracks[0]?.time_range || 'unknown'}`);
        console.log(`   📊 Data fields: ${Object.keys(extractedTracks[0]?.bins?.[0] || {}).join(', ')}`);
        
        // Create interpolated trajectory coordinates
        const trajectoryCoords = generateTrajectoryCoordinates(extractedTracks);
        
        console.log(`   🎯 Generated ${trajectoryCoords.length} trajectory points`);
        console.log(`   📍 Coordinate types: ${Object.keys(trajectoryCoords[0]?.coordinates || {}).join(', ')}`);
        
        extractionResults.extraction_summary.tracks_extracted = extractedTracks.length;
        extractionResults.extraction_summary.trajectory_points = trajectoryCoords.length;
        extractionResults.extracted_data.trajectory_coordinates = trajectoryCoords.slice(0, 3); // Sample
        
        // Save extracted trajectory data
        const outputPath = path.join(dataDir, 'extracted_trajectory_coordinates.json');
        fs.writeFileSync(outputPath, JSON.stringify({
            metadata: {
                extracted_at: new Date().toISOString(),
                source: 'mechanosensation_experimental_data.json',
                total_tracks: extractedTracks.length,
                coordinate_types: ['center', 'interpolated_head', 'interpolated_tail'],
                data_type: 'trajectory_coordinates'
            },
            tracks: trajectoryCoords
        }, null, 2));
        
        console.log(`   💾 Saved to: extracted_trajectory_coordinates.json`);
    }
}

/**
 * PROBE 4: Generate Visualization Data
 */
async function generateVisualizationData() {
    console.log('\n\n📈 PROBE 4: VISUALIZATION DATA GENERATION');
    console.log('-'.repeat(50));
    
    const extractedPath = path.join(dataDir, 'extracted_trajectory_coordinates.json');
    
    if (fs.existsSync(extractedPath)) {
        const trajectoryData = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));
        
        console.log('\n🎨 GENERATING: Visualization-Ready Data');
        
        // Create path data for each track
        const trackPaths = trajectoryData.tracks.map((track, index) => {
            const path = track.coordinates.center.map((point, frameIndex) => ({
                x: point.x,
                y: point.y,
                frame: frameIndex,
                time: frameIndex * 0.5, // 0.5s per bin
                track_id: index
            }));
            
            return {
                track_id: index,
                path: path,
                metadata: track.metadata
            };
        });
        
        console.log(`   ✅ Generated ${trackPaths.length} track paths`);
        console.log(`   📏 Points per path: ~${trackPaths[0]?.path?.length || 0}`);
        
        // Create frame-by-frame data
        const frameData = generateFrameData(trajectoryData);
        
        console.log(`   🎬 Generated ${frameData.length} frames`);
        console.log(`   📊 Tracks per frame: ${frameData[0]?.tracks?.length || 0}`);
        
        // Save visualization data
        const vizData = {
            metadata: {
                generated_at: new Date().toISOString(),
                total_tracks: trackPaths.length,
                total_frames: frameData.length,
                coordinate_system: 'pixels',
                time_step: 0.5
            },
            track_paths: trackPaths,
            frame_data: frameData.slice(0, 5) // Sample frames
        };
        
        const vizPath = path.join(dataDir, 'visualization_ready_trajectories.json');
        fs.writeFileSync(vizPath, JSON.stringify(vizData, null, 2));
        
        console.log(`   💾 Saved to: visualization_ready_trajectories.json`);
        
        extractionResults.extraction_summary.visualization_tracks = trackPaths.length;
        extractionResults.extraction_summary.visualization_frames = frameData.length;
    }
}

/**
 * Analysis Functions
 */
function analyzeJSONStructure(data, filename) {
    const analysis = {
        structure_type: typeof data,
        data_types: [],
        coordinate_fields: [],
        trajectory_potential: null
    };
    
    if (typeof data === 'object' && data !== null) {
        analysis.structure_type = Array.isArray(data) ? 'array' : 'object';
        
        // Deep scan for data types and coordinate fields
        const fields = getAllKeys(data);
        
        // Check for coordinate-like fields
        const coordPattern = /(x|y|head|tail|center|spine|contour|position|coord)/i;
        analysis.coordinate_fields = fields.filter(field => coordPattern.test(field));
        
        // Check for trajectory potential
        if (filename.includes('mechanosensation')) {
            analysis.trajectory_potential = 'HIGH - Contains binned track data with timing';
        } else if (analysis.coordinate_fields.length > 0) {
            analysis.trajectory_potential = 'MEDIUM - Contains coordinate fields';
        }
        
        // Identify data types
        if (fields.includes('tracks') || fields.includes('track')) {
            analysis.data_types.push('tracks');
        }
        if (fields.includes('experiments') || fields.includes('experiment')) {
            analysis.data_types.push('experiments');
        }
        if (fields.includes('bins') || fields.includes('time')) {
            analysis.data_types.push('temporal');
        }
        if (analysis.coordinate_fields.length > 0) {
            analysis.data_types.push('coordinates');
        }
        if (fields.includes('led') || fields.includes('stimulus')) {
            analysis.data_types.push('stimulus');
        }
    }
    
    return analysis;
}

function analyzeBinaryFile(buffer, filename) {
    const analysis = {
        format_detected: 'unknown',
        header_info: '',
        extractable_content: []
    };
    
    // Check file signature
    const header = buffer.slice(0, 20);
    
    if (filename.endsWith('.h5')) {
        analysis.format_detected = 'HDF5';
        if (buffer.length < 1000) {
            analysis.header_info = 'Placeholder/Empty file';
            analysis.extractable_content = ['none - awaiting real data'];
        } else {
            analysis.header_info = 'HDF5 binary format detected';
            analysis.extractable_content = ['requires HDF5 reader'];
        }
    }
    
    if (filename.endsWith('.mat')) {
        analysis.format_detected = 'MATLAB';
        
        // Check for v7.3 (HDF5-based) vs older formats
        const headerStr = header.toString('ascii', 0, 10);
        if (headerStr.includes('MATLAB')) {
            analysis.header_info = 'MATLAB v7+ format';
            analysis.extractable_content = ['requires MAT reader', 'potentially HDF5-based'];
        } else {
            analysis.header_info = 'Binary MATLAB format';
            analysis.extractable_content = ['requires specialized parser'];
        }
    }
    
    return analysis;
}

function getAllKeys(obj, prefix = '') {
    let keys = [];
    
    if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            keys.push(fullKey);
            
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                keys = keys.concat(getAllKeys(obj[key], fullKey));
            }
        });
    }
    
    return keys;
}

function extractTracksFromExperimentalData(expData) {
    const tracks = [];
    
    if (expData.experiments && expData.experiments.Experiment_1) {
        const experiment = expData.experiments.Experiment_1;
        
        Object.keys(experiment.tracks).forEach(trackKey => {
            const trackData = experiment.tracks[trackKey];
            
            tracks.push({
                track_id: trackKey,
                bins: trackData.bins,
                time_range: `${trackData.bins[0]?.time || 0}s - ${trackData.bins[trackData.bins.length - 1]?.time || 0}s`,
                metadata: {
                    bin_count: trackData.bins.length,
                    has_led_data: trackData.bins[0]?.led1 !== undefined,
                    has_coordinates: false // These are binned, not coordinate data
                }
            });
        });
    }
    
    return tracks;
}

function generateTrajectoryCoordinates(tracks) {
    const trajectoryData = [];
    
    tracks.forEach((track, trackIndex) => {
        const coordinates = {
            center: [],
            interpolated_head: [],
            interpolated_tail: []
        };
        
        // Generate synthetic coordinates from the bin data
        // This simulates what real trajectory extraction would provide
        track.bins.forEach((bin, binIndex) => {
            const time = bin.time || (binIndex * 0.5);
            
            // Create synthetic movement based on turn rate
            const baseX = 500 + trackIndex * 10; // Spread tracks spatially
            const baseY = 300;
            
            // Add movement based on mean turn rate
            const movement = bin.mean * 20; // Scale factor
            const angle = (time * 0.1) + (trackIndex * 0.2); // Circular-ish motion
            
            const centerX = baseX + Math.cos(angle) * movement;
            const centerY = baseY + Math.sin(angle) * movement;
            
            coordinates.center.push({
                x: centerX,
                y: centerY,
                frame: binIndex,
                time: time,
                turn_rate: bin.mean,
                led_stimulus: bin.led1
            });
            
            // Generate head/tail relative to center
            const headOffset = 15;
            coordinates.interpolated_head.push({
                x: centerX + Math.cos(angle + 0.1) * headOffset,
                y: centerY + Math.sin(angle + 0.1) * headOffset,
                frame: binIndex,
                time: time
            });
            
            coordinates.interpolated_tail.push({
                x: centerX - Math.cos(angle + 0.1) * headOffset,
                y: centerY - Math.sin(angle + 0.1) * headOffset,
                frame: binIndex,
                time: time
            });
        });
        
        trajectoryData.push({
            track_id: trackIndex,
            metadata: {
                global_track_id: trackIndex,
                experiment_id: 'Experiment_1',
                frame_count: coordinates.center.length,
                duration: coordinates.center[coordinates.center.length - 1]?.time || 0,
                extracted_fields: ['center', 'interpolated_head', 'interpolated_tail']
            },
            coordinates: coordinates
        });
    });
    
    return trajectoryData;
}

function generateFrameData(trajectoryData) {
    const frames = [];
    const maxFrames = Math.max(...trajectoryData.tracks.map(t => t.coordinates.center.length));
    
    for (let frameIndex = 0; frameIndex < maxFrames; frameIndex++) {
        const frameData = {
            frame_id: frameIndex,
            time: frameIndex * 0.5,
            tracks: []
        };
        
        trajectoryData.tracks.forEach(track => {
            if (track.coordinates.center[frameIndex]) {
                const centerPoint = track.coordinates.center[frameIndex];
                const headPoint = track.coordinates.interpolated_head[frameIndex];
                const tailPoint = track.coordinates.interpolated_tail[frameIndex];
                
                frameData.tracks.push({
                    track_id: track.track_id,
                    center: centerPoint,
                    head: headPoint,
                    tail: tailPoint,
                    turn_rate: centerPoint.turn_rate,
                    led_stimulus: centerPoint.led_stimulus
                });
            }
        });
        
        frames.push(frameData);
    }
    
    return frames;
}

/**
 * SUMMARY REPORT
 */
function generateSummaryReport() {
    console.log('\n\n📋 EXTRACTION SUMMARY REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n🕐 Analysis completed: ${extractionResults.timestamp}`);
    console.log(`📁 Files analyzed: ${extractionResults.files_analyzed.length}`);
    
    console.log('\n🎯 EXTRACTION CAPABILITIES:');
    console.log(`   ✅ Can extract ${extractionResults.extraction_summary.tracks_extracted || 0} tracks from JSON data`);
    console.log(`   📍 Can generate ${extractionResults.extraction_summary.trajectory_points || 0} trajectory points`);
    console.log(`   🎬 Can create ${extractionResults.extraction_summary.visualization_frames || 0} animation frames`);
    console.log(`   📊 Can produce ${extractionResults.extraction_summary.visualization_tracks || 0} visualization tracks`);
    
    console.log('\n🚀 WHAT WE CAN DO RIGHT NOW:');
    console.log('   ✅ Extract turn rate data from existing JSON');
    console.log('   ✅ Generate synthetic trajectory coordinates');
    console.log('   ✅ Create frame-by-frame animation data');
    console.log('   ✅ Sync with LED stimulus timing');
    console.log('   ✅ Export visualization-ready JSON');
    
    console.log('\n⚠️  WHAT WE NEED MATLAB FOR:');
    console.log('   🔧 Extract real head/tail/spine coordinates from MAT files');
    console.log('   🔧 Access contour data for body shape analysis');
    console.log('   🔧 Get pixel-perfect coordinate positioning');
    console.log('   🔧 Extract complete frame timing data');
    
    console.log('\n💡 RECOMMENDATION:');
    console.log('   Use current extraction for immediate visualization demo');
    console.log('   Request MATLAB extraction for high-fidelity coordinate data');
    console.log('   Both approaches can coexist in the dashboard');
    
    // Save comprehensive report
    const reportPath = path.join(dataDir, 'data_extraction_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(extractionResults, null, 2));
    console.log(`\n💾 Full report saved: ${reportPath}`);
}

/**
 * MAIN EXECUTION
 */
async function runProbe() {
    try {
        await probeJSONFiles();
        await probeBinaryFiles();
        await extractTrajectoryData();
        await generateVisualizationData();
        generateSummaryReport();
        
        console.log('\n🎉 PROBE COMPLETE! Check the generated files for extracted data.');
        
    } catch (error) {
        console.error('\n❌ Probe failed:', error.message);
        console.error(error.stack);
    }
}

// Run the probe
runProbe(); 