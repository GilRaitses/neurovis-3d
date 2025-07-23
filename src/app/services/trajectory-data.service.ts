import { Injectable } from '@angular/core';

export interface TrajectoryCoordinate {
  x: number;
  y: number;
  frame_id: number;
  time: number;
}

export interface TrackData {
  track_id: number;
  experiment_id: number;
  original_track_id: number;
  x_coordinates: number[];
  y_coordinates: number[];
  time_points: number[];
  duration_seconds: number;
  start_time: number;
  end_time: number;
  num_points: number;
  reorientation_times?: number[];
  reorientation_dtheta?: number[];
  turn_rate?: number;
  total_reorientations?: number;
}

export interface TrajectoryDataset {
  tracks: TrackData[];
  metadata: {
    total_tracks: number;
    extraction_date: string;
    coordinate_types: string[];
    source_files: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class TrajectoryDataService {
  private trajectoryData: TrajectoryDataset | null = null;

  constructor() {}

  async loadTrajectoryData(): Promise<TrajectoryDataset> {
    try {
      // Load the visualization-ready trajectories that have real coordinates
      console.log('📊 Loading visualization-ready trajectory data');
      
      const [indexResponse, trajectoryResponse] = await Promise.all([
        fetch('./assets/data/trajectory_hdf5_index_2025-07-23_14-18-53.json'),
        fetch('./assets/data/visualization_ready_trajectories.json')
      ]);
      
      const indexData = await indexResponse.json();
      const trajectoryData = await trajectoryResponse.json();
      
      console.log('✅ Real trajectory data loaded:', {
        index: indexData,
        trajectories: Object.keys(trajectoryData).length
      });
      
      // Convert to our format
      const tracks: TrackData[] = [];
      
      Object.entries(trajectoryData).forEach(([trackKey, trackData]: [string, any]) => {
        if (trackData.coordinates && trackData.coordinates.x && trackData.coordinates.y) {
          const track: TrackData = {
            track_id: parseInt(trackKey.replace('track_', '')),
            experiment_id: 1,
            original_track_id: parseInt(trackKey.replace('track_', '')),
            x_coordinates: trackData.coordinates.x,
            y_coordinates: trackData.coordinates.y,
            time_points: trackData.coordinates.timestamps || 
                        Array.from({length: trackData.coordinates.x.length}, (_, i) => i * 0.033), // 30fps
            duration_seconds: trackData.duration || (trackData.coordinates.x.length * 0.033),
            start_time: 0,
            end_time: trackData.duration || (trackData.coordinates.x.length * 0.033),
            num_points: trackData.coordinates.x.length,
            reorientation_times: trackData.reorientation_times || [],
            turn_rate: trackData.average_turn_rate || 0,
            total_reorientations: trackData.total_reorientations || 0
          };
          
          tracks.push(track);
        }
      });
      
      const dataset: TrajectoryDataset = {
        tracks,
        metadata: {
          total_tracks: tracks.length,
          extraction_date: indexData.extraction_date || new Date().toISOString(),
          coordinate_types: ['x_coordinates', 'y_coordinates', 'time_points'],
          source_files: indexData.file_details?.map((f: any) => f.filepath) || []
        }
      };
      
      this.trajectoryData = dataset;
      console.log('🎯 Trajectory dataset created with real coordinates:', {
        totalTracks: dataset.tracks.length,
        avgPointsPerTrack: dataset.tracks.reduce((sum, t) => sum + t.num_points, 0) / dataset.tracks.length
      });
      
      return dataset;
      
    } catch (error) {
      console.error('❌ Error loading trajectory data:', error);
      throw error;
    }
  }

  // Remove all synthetic generation methods - only use real data when available

  getTrackById(trackId: number): TrackData | null {
    if (!this.trajectoryData) return null;
    return this.trajectoryData.tracks.find(track => track.track_id === trackId) || null;
  }

  getTracksByExperiment(experimentId: number): TrackData[] {
    if (!this.trajectoryData) return [];
    return this.trajectoryData.tracks.filter(track => track.experiment_id === experimentId);
  }

  getAllTracks(): TrackData[] {
    return this.trajectoryData?.tracks || [];
  }

  getTrackCoordinatesAtTime(trackId: number, timeSeconds: number): TrajectoryCoordinate | null {
    const track = this.getTrackById(trackId);
    if (!track) return null;
    
    // Find the closest time point
    let closestIndex = 0;
    let minDiff = Math.abs(track.time_points[0] - timeSeconds);
    
    for (let i = 1; i < track.time_points.length; i++) {
      const diff = Math.abs(track.time_points[i] - timeSeconds);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    
    return {
      x: track.x_coordinates[closestIndex],
      y: track.y_coordinates[closestIndex],
      frame_id: closestIndex,
      time: track.time_points[closestIndex]
    };
  }

  getTrackSegment(trackId: number, startTime: number, endTime: number): TrajectoryCoordinate[] {
    const track = this.getTrackById(trackId);
    if (!track) return [];
    
    const segment: TrajectoryCoordinate[] = [];
    
    for (let i = 0; i < track.time_points.length; i++) {
      const time = track.time_points[i];
      if (time >= startTime && time <= endTime) {
        segment.push({
          x: track.x_coordinates[i],
          y: track.y_coordinates[i],
          frame_id: i,
          time: time
        });
      }
    }
    
    return segment;
  }

  getVisualizationBounds(): { width: number, height: number } {
    return { width: 800, height: 600 };
  }

  getMetadata() {
    return this.trajectoryData?.metadata || null;
  }
} 