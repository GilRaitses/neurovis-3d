import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface AnalyticsData {
  experiment: {
    id: string;
    date: string;
    pipeline_version: string;
    status: string;
  };
  tracks: {
    total: number;
    processed: number;
    quality_distribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
  reorientations: {
    total: number;
    mean_per_track: number;
    frequency_mean: number;
    frequency_std: number;
  };
  temporal: {
    mean_duration: number;
    mean_frequency: number;
    methodology: string;
  };
  data_quality: {
    detection_confidence: number;
    track_completeness: number;
    pipeline_validation: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsDataService {
  private analyticsDataSubject = new BehaviorSubject<AnalyticsData | null>(null);
  public analyticsData$ = this.analyticsDataSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('[AnalyticsDataService] Service initialized');
  }

  loadAnalyticsData(): Observable<AnalyticsData> {
    console.log('[AnalyticsDataService] Starting to load mechanosensation analytics data');
    console.log('[AnalyticsDataService] Base URL:', window.location.origin);
    
    const dataFiles = [
      'assets/data/final_pipeline_summary.json',
      'assets/data/population_statistics.json', 
      'assets/data/temporal_features.json',
      'assets/data/fem_data_inventory.json'
    ];
    
    console.log('[AnalyticsDataService] Will attempt to load files:', dataFiles);
    
    return forkJoin({
      pipelineSummary: this.http.get<any>('assets/data/final_pipeline_summary.json').pipe(
        catchError(error => {
          console.error('[AnalyticsDataService] Failed to load pipeline summary:', error);
          return of(null);
        })
      ),
      populationStats: this.http.get<any>('assets/data/population_statistics.json').pipe(
        catchError(error => {
          console.error('[AnalyticsDataService] Failed to load population stats:', error);
          return of(null);
        })
      ),
      temporalFeatures: this.http.get<any[]>('assets/data/temporal_features.json').pipe(
        catchError(error => {
          console.error('[AnalyticsDataService] Failed to load temporal features:', error);
          return of([]);
        })
      ),
      femInventory: this.http.get<any>('assets/data/fem_data_inventory.json').pipe(
        catchError(error => {
          console.error('[AnalyticsDataService] Failed to load FEM inventory:', error);
          return of(null);
        })
      )
    }).pipe(
      map(({ pipelineSummary, populationStats, temporalFeatures, femInventory }) => {
        console.log('[AnalyticsDataService] Processing loaded data');
        console.log('[AnalyticsDataService] Pipeline summary loaded:', !!pipelineSummary);
        console.log('[AnalyticsDataService] Population stats loaded:', !!populationStats);
        console.log('[AnalyticsDataService] Temporal features loaded:', !!temporalFeatures);
        console.log('[AnalyticsDataService] Temporal features count:', temporalFeatures?.length || 0);
        console.log('[AnalyticsDataService] FEM inventory loaded:', !!femInventory);
        
        if (pipelineSummary) {
          console.log('[AnalyticsDataService] Pipeline summary keys:', Object.keys(pipelineSummary));
        }
        if (populationStats) {
          console.log('[AnalyticsDataService] Population stats keys:', Object.keys(populationStats));
        }
        
        // Use ONLY real data - no fallbacks for research tool
        const analyticsData: AnalyticsData = {
          experiment: {
            id: pipelineSummary?.pipeline_execution?.timestamp || 'Unknown',
            date: pipelineSummary?.pipeline_execution?.date || 'Unknown',
            pipeline_version: pipelineSummary?.pipeline_execution?.version || 'Unknown',
            status: pipelineSummary?.pipeline_execution?.status || 'Unknown'
          },
          tracks: {
            total: pipelineSummary?.data_summary?.total_trajectories || 0,
            processed: temporalFeatures?.length || 0,
            quality_distribution: this.calculateQualityDistribution(temporalFeatures || [])
          },
          reorientations: {
            total: populationStats?.reorientation_statistics?.total || 0,
            mean_per_track: populationStats?.reorientation_statistics?.mean || 0,
            frequency_mean: populationStats?.frequency_statistics?.mean || 0,
            frequency_std: populationStats?.frequency_statistics?.std || 0
          },
          temporal: {
            mean_duration: this.calculateMeanDuration(temporalFeatures || []),
            mean_frequency: populationStats?.frequency_statistics?.mean || 0,
            methodology: pipelineSummary?.data_summary?.methodology || 'Unknown'
          },
          data_quality: {
            detection_confidence: 0,
            track_completeness: this.calculateTrackCompleteness(temporalFeatures || []),
            pipeline_validation: (pipelineSummary?.pipeline_execution?.status || '') === 'COMPLETE'
          }
        };

        console.log('[AnalyticsDataService] Analytics data processed successfully');
        console.log('[AnalyticsDataService] Final analytics data:', analyticsData);
        this.analyticsDataSubject.next(analyticsData);
        return analyticsData;
      }),
      catchError(error => {
        console.error('[AnalyticsDataService] Critical error in data processing:', error);
        throw error; // Throw error for proper debugging - no fallback data in research tool
      })
    );
  }

  private calculateQualityDistribution(temporalFeatures: any[]): any {
    console.log('[AnalyticsDataService] Calculating quality distribution for', temporalFeatures.length, 'tracks');
    
    if (!temporalFeatures || temporalFeatures.length === 0) {
      console.log('[AnalyticsDataService] No temporal features available');
      return { excellent: 0, good: 0, fair: 0, poor: 0 };
    }
    
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    
    temporalFeatures.forEach(track => {
      const duration = track.duration || 0;
      const reorientations = track.reorientation_count || 0;
      
      if (duration > 1000 && reorientations > 40) {
        distribution.excellent++;
      } else if (duration > 800 && reorientations > 25) {
        distribution.good++;
      } else if (duration > 400) {
        distribution.fair++;
      } else {
        distribution.poor++;
      }
    });
    
    console.log('[AnalyticsDataService] Quality distribution calculated:', distribution);
    return distribution;
  }

  private calculateMeanDuration(temporalFeatures: any[]): number {
    if (!temporalFeatures || temporalFeatures.length === 0) {
      console.log('[AnalyticsDataService] No temporal features for duration calculation');
      return 0;
    }
    
    const durations = temporalFeatures.map(track => track.duration || 0);
    const mean = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    console.log('[AnalyticsDataService] Mean duration calculated:', mean, 'from', durations.length, 'tracks');
    return mean;
  }

  private calculateTrackCompleteness(temporalFeatures: any[]): number {
    if (!temporalFeatures || temporalFeatures.length === 0) {
      console.log('[AnalyticsDataService] No temporal features for completeness calculation');
      return 0;
    }
    
    const completenessList = temporalFeatures.map(track => {
      const duration = track.duration || 0;
      const reorientations = track.reorientation_count || 0;
      
      if (duration > 0 && reorientations > 0) {
        return Math.min(100, (duration / 1200) * 100);
      }
      return 0;
    });
    
    const completeness = completenessList.reduce((sum, comp) => sum + comp, 0) / completenessList.length;
    console.log('[AnalyticsDataService] Track completeness calculated:', completeness, 'from', completenessList.length, 'tracks');
    return completeness;
  }
} 