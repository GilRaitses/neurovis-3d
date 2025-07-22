import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

// Track data interfaces
export interface TrackDataStructure {
  experiment_id: string;
  session_id: string;
  raw_data_path: string;
  processing_timestamp: string;
  
  // Experiment metadata
  experimental_conditions: {
    stimulus_type: string;
    optogenetic_protocol?: string;
    environmental_conditions: any;
  };
  
  // Track hierarchy
  tracks: {
    [track_id: string]: {
      metadata: TrackMetadata;
      coordinates: TrackCoordinates;
      features: TrackFeatures;
      linking: TrackLinking;
    };
  };
  
  // Data provenance
  data_provenance: {
    raw_mat_file: string;
    processing_pipeline_version: string;
    analysis_parameters: any;
    quality_metrics: any;
  };
}

export interface TrackMetadata {
  track_key: string;
  trajectory_id: number;
  experiment_id: string;
  local_track_id: number;
  pulse_id?: number;
  
  // Temporal information
  start_frame: number;
  end_frame: number;
  total_frames: number;
  frame_rate: number;
  start_time: number;
  end_time: number;
  duration: number;
  
  // Quality assessment
  data_quality: 'excellent' | 'good' | 'fair' | 'poor';
  completeness: number;
  has_gaps: boolean;
  gap_frames?: number[];
  interpolated_frames?: number[];
  
  // Behavioral characteristics
  reorientation_count: number;
  frequency: number;
  regularity: number;
  
  // Spatial characteristics
  total_distance: number;
  displacement: number;
  velocity_stats: {
    mean: number;
    std: number;
    max: number;
    percentiles: number[];
  };
  
  // Detection metadata
  detection_confidence: number;
  starts_mid_experiment: boolean;
  ends_prematurely: boolean;
}

export interface TrackCoordinates {
  x: number[];
  y: number[];
  z?: number[];
  timestamps: number[];
  confidence_scores?: number[];
}

export interface TrackFeatures {
  temporal: {
    reorientation_events: number[];
    speed_profile: number[];
    acceleration_profile: number[];
    turning_angles: number[];
  };
  
  envelope: {
    envelope_signal: number[];
    envelope_frequency: number;
    envelope_amplitude: number[];
    phase_coherence: number[];
  };
  
  behavioral: {
    exploration_pattern: string;
    preference_zones: any[];
    interaction_events: any[];
  };
}

export interface TrackLinking {
  potential_predecessors: {
    track_key: string;
    confidence: number;
    temporal_gap: number;
    spatial_distance: number;
    linking_evidence: {
      trajectory_alignment: number;
      velocity_continuity: number;
      behavioral_consistency: number;
    };
  }[];
  
  potential_successors: {
    track_key: string;
    confidence: number;
    temporal_gap: number;
    spatial_distance: number;
  }[];
  
  confirmed_links: {
    predecessor_track?: string;
    successor_track?: string;
    link_confidence: number;
    manual_verification: boolean;
    verification_timestamp?: string;
  };
  
  rejected_links: {
    track_key: string;
    rejection_reason: string;
    rejection_timestamp: string;
  }[];
}

export interface H5FileStructure {
  // Root groups
  experiments: {
    [experiment_id: string]: {
      metadata: any;
      tracks: {
        [track_id: string]: {
          coordinates: any;
          features: any;
          metadata: any;
        };
      };
      linking: {
        graph: any;
        confidence_matrix: any;
        verified_links: any;
      };
    };
  };
  
  // Global datasets
  processing_log: any[];
  data_versions: any[];
  schema_version: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackDataService {
  private trackDataSubject = new BehaviorSubject<TrackDataStructure | null>(null);
  public trackData$ = this.trackDataSubject.asObservable();
  
  private h5FileStructure: H5FileStructure | null = null;
  private currentExperimentId: string | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Load and process MAT files into structured track data
   */
  async loadMatFiles(): Promise<TrackDataStructure> {
    try {
      // Load all MAT file data (simulated - in real implementation would use MAT reader)
      const [allTrajectories, experimentData, sampleTrajectory] = await Promise.all([
        this.loadMatFileData('assets/data/trajectories/all_trajectories.mat'),
        this.loadMatFileData('assets/data/trajectories/experiment_data.mat'),
        this.loadMatFileData('assets/data/trajectories/trajectory_001.mat')
      ]);

      // Load existing JSON metadata
      const [temporalFeatures, envelopeFeatures, femResults] = await Promise.all([
        this.http.get<any[]>('assets/data/temporal_features.json').toPromise(),
        this.http.get<any[]>('assets/data/envelope_features.json').toPromise(),
        this.http.get<any>('assets/data/fem_analysis_results.json').toPromise()
      ]);

      // Process and structure the data
      const structuredData = await this.processRawMatData(
        { allTrajectories, experimentData, sampleTrajectory },
        { temporalFeatures, envelopeFeatures, femResults }
      );

      // Generate YAML representation
      await this.generateYamlConfiguration(structuredData);

      // Create H5 file structure
      await this.createH5FileStructure(structuredData);

      this.trackDataSubject.next(structuredData);
      return structuredData;

    } catch (error) {
      console.error('Error loading MAT files:', error);
      throw error;
    }
  }

  /**
   * Load MAT file data (placeholder - would use actual MAT reader in production)
   */
  private async loadMatFileData(filePath: string): Promise<any> {
    // In a real implementation, this would use a MAT file reader library
    // For now, we'll return a structure that simulates MAT file contents
    console.log(`Loading MAT file: ${filePath}`);
    
    // Simulate MAT file structure
    return {
      metadata: {
        experiment_id: 'EXP_001',
        recording_date: '2025-07-11',
        frame_rate: 30,
        total_frames: 10000
      },
      tracks: {
        // Simulated track data structure
        coordinates: new Float32Array(1000), // x, y coordinates
        timestamps: new Float32Array(500),
        track_ids: new Int32Array(50),
        confidence_scores: new Float32Array(500)
      }
    };
  }

  /**
   * Process raw MAT data into structured format
   */
  private async processRawMatData(
    matData: any,
    jsonData: any
  ): Promise<TrackDataStructure> {
    const structuredData: TrackDataStructure = {
      experiment_id: 'EXP_MECH_2025_001',
      session_id: 'SESSION_' + Date.now(),
      raw_data_path: 'assets/data/trajectories/',
      processing_timestamp: new Date().toISOString(),
      
      experimental_conditions: {
        stimulus_type: 'CHRIMSON_optogenetic',
        optogenetic_protocol: 'pulse_train_633nm',
        environmental_conditions: {
          temperature: 22,
          humidity: 65,
          arena_dimensions: { width: 200, height: 200, depth: 20 }
        }
      },
      
      tracks: {},
      
      data_provenance: {
        raw_mat_file: 'all_trajectories.mat',
        processing_pipeline_version: '2.1.0',
        analysis_parameters: {
          detection_threshold: 0.7,
          linking_max_gap: 30,
          quality_filter: true
        },
        quality_metrics: {
          total_tracks: jsonData.temporalFeatures?.length || 0,
          high_quality_tracks: 0,
          linking_success_rate: 0
        }
      }
    };

    // Process each track from temporal features
    if (jsonData.temporalFeatures) {
      for (let i = 0; i < jsonData.temporalFeatures.length; i++) {
        const temporal = jsonData.temporalFeatures[i];
        const envelope = jsonData.envelopeFeatures?.[i];
        
        const trackId = temporal.track_key;
        
        // Generate synthetic coordinate data (in real implementation, extract from MAT)
        const coordinates = this.generateSyntheticCoordinates(temporal);
        
        structuredData.tracks[trackId] = {
          metadata: this.createTrackMetadata(temporal, envelope),
          coordinates: coordinates,
          features: this.extractTrackFeatures(temporal, envelope),
          linking: this.initializeTrackLinking(trackId, jsonData.temporalFeatures)
        };
      }
    }

    // Calculate quality metrics
    const trackValues = Object.values(structuredData.tracks);
    structuredData.data_provenance.quality_metrics.high_quality_tracks = 
      trackValues.filter(t => ['excellent', 'good'].includes(t.metadata.data_quality)).length;

    return structuredData;
  }

  /**
   * Create track metadata from temporal and envelope features
   */
  private createTrackMetadata(temporal: any, envelope: any): TrackMetadata {
    return {
      track_key: temporal.track_key,
      trajectory_id: temporal.trajectory_id,
      experiment_id: 'EXP_MECH_2025_001',
      local_track_id: temporal.trajectory_id,
      
      start_frame: 0,
      end_frame: Math.floor(temporal.duration * 30),
      total_frames: Math.floor(temporal.duration * 30),
      frame_rate: 30,
      start_time: 0,
      end_time: temporal.duration,
      duration: temporal.duration,
      
      data_quality: this.assessDataQuality(temporal),
      completeness: temporal.duration > 0 ? 1.0 : 0.0,
      has_gaps: temporal.duration < 100,
      
      reorientation_count: temporal.reorientation_count,
      frequency: temporal.frequency,
      regularity: temporal.regularity,
      
      total_distance: temporal.duration * 1.5, // Estimated
      displacement: temporal.duration * 0.8, // Estimated
      velocity_stats: {
        mean: 1.2,
        std: 0.4,
        max: 3.5,
        percentiles: [0.5, 1.0, 1.5, 2.0, 2.5]
      },
      
      detection_confidence: 0.85 + Math.random() * 0.15,
      starts_mid_experiment: this.detectMidExperimentStart(temporal),
      ends_prematurely: temporal.duration < 200
    };
  }

  /**
   * Generate synthetic coordinates (in real implementation, extract from MAT)
   */
  private generateSyntheticCoordinates(temporal: any): TrackCoordinates {
    const numPoints = Math.floor(temporal.duration * 30); // 30fps
    const x: number[] = [];
    const y: number[] = [];
    const timestamps: number[] = [];
    
    let currentX = (Math.random() - 0.5) * 150;
    let currentY = (Math.random() - 0.5) * 150;
    
    for (let i = 0; i < numPoints; i++) {
      timestamps.push(i / 30.0);
      x.push(currentX);
      y.push(currentY);
      
      // Random walk
      currentX += (Math.random() - 0.5) * 2;
      currentY += (Math.random() - 0.5) * 2;
      
      // Keep within bounds
      currentX = Math.max(-100, Math.min(100, currentX));
      currentY = Math.max(-100, Math.min(100, currentY));
    }
    
    return { x, y, timestamps };
  }

  /**
   * Extract track features from temporal and envelope data
   */
  private extractTrackFeatures(temporal: any, envelope: any): TrackFeatures {
    return {
      temporal: {
        reorientation_events: [], // Would extract from analysis
        speed_profile: [],
        acceleration_profile: [],
        turning_angles: []
      },
      envelope: {
        envelope_signal: envelope?.signal || [],
        envelope_frequency: envelope?.frequency || 0,
        envelope_amplitude: envelope?.amplitude || [],
        phase_coherence: envelope?.coherence || []
      },
      behavioral: {
        exploration_pattern: 'random_walk',
        preference_zones: [],
        interaction_events: []
      }
    };
  }

  /**
   * Initialize track linking analysis
   */
  private initializeTrackLinking(trackId: string, allTracks: any[]): TrackLinking {
    return {
      potential_predecessors: [],
      potential_successors: [],
      confirmed_links: {
        predecessor_track: undefined,
        successor_track: undefined,
        link_confidence: 0,
        manual_verification: false,
        verification_timestamp: undefined
      },
      rejected_links: []
    };
  }

  /**
   * Generate YAML configuration file from structured data
   */
  private async generateYamlConfiguration(data: TrackDataStructure): Promise<string> {
    const yamlConfig = {
      experiment_config: {
        experiment_id: data.experiment_id,
        session_id: data.session_id,
        conditions: data.experimental_conditions
      },
      data_structure: {
        tracks_count: Object.keys(data.tracks).length,
        frame_rate: 30,
        duration_range: this.calculateDurationRange(data.tracks)
      },
      processing_pipeline: {
        version: data.data_provenance.processing_pipeline_version,
        parameters: data.data_provenance.analysis_parameters
      },
      quality_summary: data.data_provenance.quality_metrics
    };

    // In real implementation, would use YAML library to generate file
    const yamlString = JSON.stringify(yamlConfig, null, 2);
    console.log('Generated YAML config:', yamlString);
    
    return yamlString;
  }

  /**
   * Create H5 file structure for efficient data access
   */
  private async createH5FileStructure(data: TrackDataStructure): Promise<void> {
    this.h5FileStructure = {
      experiments: {
        [data.experiment_id]: {
          metadata: {
            conditions: data.experimental_conditions,
            provenance: data.data_provenance
          },
          tracks: {},
          linking: {
            graph: {},
            confidence_matrix: {},
            verified_links: {}
          }
        }
      },
      processing_log: [],
      data_versions: [],
      schema_version: '1.0.0'
    };

    // Add tracks to H5 structure
    Object.entries(data.tracks).forEach(([trackId, trackData]) => {
      this.h5FileStructure!.experiments[data.experiment_id].tracks[trackId] = {
        coordinates: {
          x: trackData.coordinates.x,
          y: trackData.coordinates.y,
          timestamps: trackData.coordinates.timestamps
        },
        features: trackData.features,
        metadata: trackData.metadata
      };
    });

    console.log('Created H5 file structure');
  }

  /**
   * Apply track linking changes and export for downstream processing
   */
  async applyTrackLinking(linkingChanges: any[]): Promise<any> {
    if (!this.h5FileStructure || !this.currentExperimentId) {
      throw new Error('No data loaded or experiment selected');
    }

    const experiment = this.h5FileStructure.experiments[this.currentExperimentId];
    
    // Apply each linking change
    linkingChanges.forEach(change => {
      switch (change.action) {
        case 'link_tracks':
          this.linkTracks(change.predecessor, change.successor, change.confidence);
          break;
        case 'reject_link':
          this.rejectTrackLink(change.track1, change.track2, change.reason);
          break;
        case 'split_track':
          this.splitTrack(change.trackId, change.splitFrame);
          break;
        case 'merge_tracks':
          this.mergeTracks(change.trackIds);
          break;
      }
    });

    // Generate export data for downstream processing
    const exportData = {
      modified_tracks: this.getModifiedTracks(),
      linking_graph: experiment.linking.graph,
      verification_status: this.getVerificationStatus(),
      export_timestamp: new Date().toISOString()
    };

    console.log('Applied track linking changes:', exportData);
    return exportData;
  }

  /**
   * Generate HTML summary for H5 file exploration
   */
  generateH5ExplorationHtml(data: TrackDataStructure): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Track Data Explorer - ${data.experiment_id}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; }
            .track-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
            .track-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .quality-excellent { border-left: 5px solid #4caf50; }
            .quality-good { border-left: 5px solid #2196f3; }
            .quality-fair { border-left: 5px solid #ff9800; }
            .quality-poor { border-left: 5px solid #f44336; }
        </style>
    </head>
    <body>
        <h1>Track Data Explorer</h1>
        
        <div class="summary">
            <h2>Experiment Summary</h2>
            <p><strong>ID:</strong> ${data.experiment_id}</p>
            <p><strong>Total Tracks:</strong> ${Object.keys(data.tracks).length}</p>
            <p><strong>Processing Date:</strong> ${data.processing_timestamp}</p>
            <p><strong>High Quality Tracks:</strong> ${data.data_provenance.quality_metrics.high_quality_tracks}</p>
        </div>

        <h2>Track Overview</h2>
        <div class="track-list">
            ${Object.entries(data.tracks).map(([trackId, track]) => `
                <div class="track-card quality-${track.metadata.data_quality}">
                    <h3>${trackId}</h3>
                    <p><strong>Duration:</strong> ${track.metadata.duration.toFixed(1)}s</p>
                    <p><strong>Quality:</strong> ${track.metadata.data_quality}</p>
                    <p><strong>Reorientations:</strong> ${track.metadata.reorientation_count}</p>
                    <p><strong>Frames:</strong> ${track.metadata.total_frames}</p>
                    ${track.metadata.starts_mid_experiment ? '<p><em>Starts mid-experiment</em></p>' : ''}
                </div>
            `).join('')}
        </div>
    </body>
    </html>
    `;
  }

  // Helper methods
  private assessDataQuality(temporal: any): 'excellent' | 'good' | 'fair' | 'poor' {
    if (temporal.duration > 300 && temporal.reorientation_count > 20) return 'excellent';
    if (temporal.duration > 200 && temporal.reorientation_count > 10) return 'good';
    if (temporal.duration > 100) return 'fair';
    return 'poor';
  }

  private detectMidExperimentStart(temporal: any): boolean {
    return temporal.duration < 200;
  }

  private calculateDurationRange(tracks: any): { min: number; max: number; mean: number } {
    const durations = Object.values(tracks).map((t: any) => t.metadata.duration);
    return {
      min: Math.min(...durations),
      max: Math.max(...durations),
      mean: durations.reduce((a, b) => a + b, 0) / durations.length
    };
  }

  private linkTracks(pred: string, succ: string, confidence: number): void {
    // Implementation for linking tracks
  }

  private rejectTrackLink(track1: string, track2: string, reason: string): void {
    // Implementation for rejecting track links
  }

  private splitTrack(trackId: string, splitFrame: number): void {
    // Implementation for splitting tracks
  }

  private mergeTracks(trackIds: string[]): void {
    // Implementation for merging tracks
  }

  private getModifiedTracks(): any {
    // Return list of tracks that have been modified
    return {};
  }

  private getVerificationStatus(): any {
    // Return verification status of all links
    return {};
  }
} 