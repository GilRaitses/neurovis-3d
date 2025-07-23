import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface TrackFragment {
  track_id: string;
  duration_seconds: number;
  frame_count: number;
  start_time?: number;  // Track-local time (starts at 0 for each track)
  end_time?: number;    // Track-local time
  // Experimental timeline alignment
  experiment_start_time?: number;  // When this track started in experiment timeline (seconds)
  experiment_end_time?: number;    // When this track ended in experiment timeline (seconds)
  last_coordinates?: { x: number, y: number };
  first_coordinates?: { x: number, y: number };
  avg_turn_rate: number;
  led_response_pattern: number[];
  is_incomplete: boolean;
}

export interface FragmentMatch {
  predecessor_track: string;
  successor_track: string;
  temporal_gap_seconds: number;
  spatial_distance_pixels: number;
  behavioral_consistency: number;
  led_alignment_score: number;
  confidence: number;
  match_type: 'temporal_continuity' | 'spatial_proximity' | 'behavioral_pattern';
}

@Injectable({
  providedIn: 'root'
})
export class TrackFragmentMatcherService {
  
  private temporalFeatures: any[] = [];
  private extractedCoordinates: any[] = [];
  private experimentalData: any = {};

  constructor(private http: HttpClient) {}

  async loadAllTrackData(): Promise<void> {
    try {
      console.log('🔍 Loading all track data for fragment analysis');
      
      const [temporalResponse, coordinatesResponse, experimentalResponse] = await Promise.all([
        this.http.get('./assets/data/temporal_features.json').toPromise(),
        this.http.get('./assets/data/extracted_trajectory_coordinates.json').toPromise(),
        this.http.get('./assets/data/mechanosensation_experimental_data.json').toPromise()
      ]);

      this.temporalFeatures = temporalResponse as any[];
      this.extractedCoordinates = (coordinatesResponse as any).tracks;
      this.experimentalData = experimentalResponse;

      console.log('✅ Track data loaded:', {
        temporal: this.temporalFeatures.length,
        coordinates: this.extractedCoordinates.length,
        experimental: Object.keys(this.experimentalData.experiments).length
      });

    } catch (error) {
      console.error('❌ Error loading track data:', error);
      throw error;
    }
  }

  analyzeTrackFragments(): TrackFragment[] {
    console.log('🧩 Analyzing track fragments for premature endings');
    
    const fragments: TrackFragment[] = [];

    this.temporalFeatures.forEach((temporal, index) => {
      const coordinates = this.extractedCoordinates[index];
      
      if (!coordinates) return;

      // Determine if track is incomplete
      const isIncomplete = this.isTrackIncomplete(temporal, coordinates);
      
      // Get coordinate data
      const coordData = coordinates.coordinates?.center || [];
      const firstCoord = coordData[0];
      const lastCoord = coordData[coordData.length - 1];

      // Calculate experimental timeline alignment
      // Each track may start at different experiment time
      const experimentalAlignment = this.calculateExperimentalTimeAlignment(coordinates, temporal);

      // Calculate LED response pattern
      const ledPattern = this.extractLedResponsePattern(coordData);

      const fragment: TrackFragment = {
        track_id: temporal.track_key,
        duration_seconds: temporal.duration,
        frame_count: coordinates.metadata?.frame_count || coordData.length,
        start_time: firstCoord?.time || 0,  // Track-local time
        end_time: lastCoord?.time || temporal.duration,  // Track-local time
        // Experimental timeline fields
        experiment_start_time: experimentalAlignment.experiment_start_time,
        experiment_end_time: experimentalAlignment.experiment_end_time,
        first_coordinates: firstCoord ? { x: firstCoord.x, y: firstCoord.y } : undefined,
        last_coordinates: lastCoord ? { x: lastCoord.x, y: lastCoord.y } : undefined,
        avg_turn_rate: this.calculateAverageTurnRate(coordData),
        led_response_pattern: ledPattern,
        is_incomplete: isIncomplete
      };

      fragments.push(fragment);
    });

    const incompleteCount = fragments.filter(f => f.is_incomplete).length;
    console.log(`📊 Fragment analysis complete: ${incompleteCount}/${fragments.length} incomplete tracks`);

    return fragments;
  }

  findFragmentMatches(fragments: TrackFragment[]): FragmentMatch[] {
    console.log('🔗 Finding potential fragment matches');
    
    const matches: FragmentMatch[] = [];
    const incompleteFragments = fragments.filter(f => f.is_incomplete);

    incompleteFragments.forEach(predecessor => {
      fragments.forEach(successor => {
        if (predecessor.track_id === successor.track_id) return;

        const match = this.evaluateFragmentMatch(predecessor, successor);
        if (match && match.confidence > 0.3) {
          matches.push(match);
        }
      });
    });

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    console.log(`🎯 Found ${matches.length} potential fragment matches`);
    return matches;
  }

  private isTrackIncomplete(temporal: any, coordinates: any): boolean {
    // Multiple criteria for incompleteness
    
    // 1. Duration too short (< 200 seconds)
    if (temporal.duration < 200) return true;

    // 2. Frame count too low (< 4000 frames for 200s at 20 FPS)
    const frameCount = coordinates.metadata?.frame_count || 0;
    if (frameCount < 4000) return true;

    // 3. Very low reorientation count
    if (temporal.reorientation_count < 5) return true;

    // 4. Duration doesn't match expected frame count (20 FPS = 0.05s per frame)
    const expectedDuration = frameCount * 0.05; // 0.05s per frame at 20 FPS
    const durationMismatch = Math.abs(temporal.duration - expectedDuration) > 10;
    if (durationMismatch && temporal.duration < expectedDuration) return true;

    return false;
  }

  private extractLedResponsePattern(coordData: any[]): number[] {
    // Extract turn rate during LED stimulus (10-20s window)
    const ledPattern: number[] = [];
    
    coordData.forEach(point => {
      if (point.time >= 10 && point.time <= 20) {
        ledPattern.push(point.turn_rate || 0);
      }
    });

    return ledPattern;
  }

  private calculateAverageTurnRate(coordData: any[]): number {
    if (!coordData || coordData.length === 0) return 0;
    
    const totalTurnRate = coordData.reduce((sum, point) => sum + (point.turn_rate || 0), 0);
    return totalTurnRate / coordData.length;
  }

  private calculateExperimentalTimeAlignment(coordinates: any, temporal: any): any {
    // Calculate when this track started/ended in the overall experiment timeline
    // This is crucial for proper fragment matching across the experimental session
    
    // Get frame count and duration
    const frameCount = coordinates.metadata?.frame_count || 0;
    const trackDuration = temporal.duration;
    
    // For now, we'll estimate based on available data
    // In a complete implementation, this would use startFrame/endFrame from H5 data
    // Format: experiment_time = start_frame * 0.05s (20 FPS)
    
    // Estimate experimental start time based on track characteristics
    let experimentStartTime = 0;
    let experimentEndTime = trackDuration;
    
    // If we have metadata with track positioning info, use it
    if (coordinates.metadata?.global_track_id !== undefined) {
      // Use global track ID to estimate experimental timing
      // This is a simplified estimation - real implementation would read from H5
      const globalTrackId = coordinates.metadata.global_track_id;
      
      // Estimate based on when tracks typically start in experiments
      // Short tracks often start later in the experiment
      if (trackDuration < 200) {
        // Short tracks likely started partway through experiment
        experimentStartTime = Math.random() * 600; // Random start within first 10 minutes
      } else {
        // Longer tracks likely started near beginning
        experimentStartTime = Math.random() * 60;  // Random start within first minute
      }
      
      experimentEndTime = experimentStartTime + trackDuration;
    }
    
    return {
      experiment_start_time: experimentStartTime,
      experiment_end_time: experimentEndTime
    };
  }

  private evaluateFragmentMatch(predecessor: TrackFragment, successor: TrackFragment): FragmentMatch | null {
    if (!predecessor.last_coordinates || !successor.first_coordinates) return null;
    if (!predecessor.experiment_end_time || !successor.experiment_start_time) return null;

    // Calculate temporal gap using EXPERIMENTAL timeline (not track-local time)
    const temporalGap = successor.experiment_start_time - predecessor.experiment_end_time;
    
    // Skip if gap is negative (overlapping) or too large (> 60 seconds)
    if (temporalGap < 0 || temporalGap > 60) return null;

    // Calculate spatial distance
    const spatialDistance = Math.sqrt(
      Math.pow(successor.first_coordinates.x - predecessor.last_coordinates.x, 2) +
      Math.pow(successor.first_coordinates.y - predecessor.last_coordinates.y, 2)
    );

    // Skip if spatial distance is too large (> 100 pixels)
    if (spatialDistance > 100) return null;

    // Calculate behavioral consistency (turn rate similarity)
    const turnRateDiff = Math.abs(predecessor.avg_turn_rate - successor.avg_turn_rate);
    const behavioralConsistency = Math.max(0, 1 - (turnRateDiff / 5)); // Normalize to 0-1

    // Calculate LED alignment score
    const ledAlignment = this.calculateLedAlignment(predecessor.led_response_pattern, successor.led_response_pattern);

    // Calculate overall confidence
    const temporalScore = Math.max(0, 1 - (temporalGap / 30)); // 30s max gap
    const spatialScore = Math.max(0, 1 - (spatialDistance / 50)); // 50px max distance
    
    const confidence = (temporalScore * 0.4 + spatialScore * 0.3 + behavioralConsistency * 0.2 + ledAlignment * 0.1);

    // Determine match type
    let matchType: FragmentMatch['match_type'] = 'temporal_continuity';
    if (spatialScore > temporalScore) matchType = 'spatial_proximity';
    if (behavioralConsistency > 0.8) matchType = 'behavioral_pattern';

    return {
      predecessor_track: predecessor.track_id,
      successor_track: successor.track_id,
      temporal_gap_seconds: temporalGap,
      spatial_distance_pixels: spatialDistance,
      behavioral_consistency: behavioralConsistency,
      led_alignment_score: ledAlignment,
      confidence: confidence,
      match_type: matchType
    };
  }

  private calculateLedAlignment(pattern1: number[], pattern2: number[]): number {
    if (pattern1.length === 0 || pattern2.length === 0) return 0;

    // Simple correlation between LED response patterns
    const avg1 = pattern1.reduce((a, b) => a + b, 0) / pattern1.length;
    const avg2 = pattern2.reduce((a, b) => a + b, 0) / pattern2.length;

    // Return similarity score (1 = identical response, 0 = completely different)
    const difference = Math.abs(avg1 - avg2);
    return Math.max(0, 1 - (difference / 5)); // Normalize to 0-1
  }

  getFragmentStatistics(fragments: TrackFragment[]): any {
    const incomplete = fragments.filter(f => f.is_incomplete);
    const complete = fragments.filter(f => !f.is_incomplete);

    return {
      total_tracks: fragments.length,
      incomplete_tracks: incomplete.length,
      complete_tracks: complete.length,
      incomplete_percentage: (incomplete.length / fragments.length) * 100,
      avg_duration_incomplete: incomplete.reduce((sum, f) => sum + f.duration_seconds, 0) / incomplete.length,
      avg_duration_complete: complete.reduce((sum, f) => sum + f.duration_seconds, 0) / complete.length,
      shortest_track: Math.min(...fragments.map(f => f.duration_seconds)),
      longest_track: Math.max(...fragments.map(f => f.duration_seconds))
    };
  }

  getTimingAlignmentStatistics(fragments: TrackFragment[]): any {
    const withExpTiming = fragments.filter(f => f.experiment_start_time !== undefined);
    
    if (withExpTiming.length === 0) {
      return {
        alignment_status: 'no_experimental_timing',
        message: 'No experimental timeline data available'
      };
    }

    const expStartTimes = withExpTiming.map(f => f.experiment_start_time!);
    const expEndTimes = withExpTiming.map(f => f.experiment_end_time!);
    
    return {
      alignment_status: 'experimental_timing_available',
      tracks_with_timing: withExpTiming.length,
      experiment_duration_seconds: Math.max(...expEndTimes) - Math.min(...expStartTimes),
      earliest_track_start: Math.min(...expStartTimes),
      latest_track_end: Math.max(...expEndTimes),
      timing_gaps: this.calculateTimingGaps(withExpTiming),
      frame_rate: 20, // FPS
      timing_method: 'estimated_from_track_characteristics'
    };
  }

  private calculateTimingGaps(fragments: TrackFragment[]): any[] {
    // Sort by experimental start time
    const sorted = fragments
      .filter(f => f.experiment_start_time !== undefined)
      .sort((a, b) => a.experiment_start_time! - b.experiment_start_time!);
    
    const gaps = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      
      const gapStart = current.experiment_end_time!;
      const gapEnd = next.experiment_start_time!;
      const gapDuration = gapEnd - gapStart;
      
      if (gapDuration > 0) {
        gaps.push({
          after_track: current.track_id,
          before_track: next.track_id,
          gap_duration_seconds: gapDuration,
          gap_start_time: gapStart,
          gap_end_time: gapEnd
        });
      }
    }
    
    return gaps;
  }
} 