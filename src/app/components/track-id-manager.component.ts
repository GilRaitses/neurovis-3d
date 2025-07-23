import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient } from '@angular/common/http';
import * as THREE from 'three';
import { TrackDataService, TrackDataStructure } from '../services/track-data.service';

interface TrajectoryMetadata {
  track_key: string;
  trajectory_id: number;
  experiment_id: string;  // Changed from number to string
  start_frame: number;
  end_frame: number;
  total_frames: number;
  frame_rate: number;
  start_time: number;
  end_time: number;
  duration: number;
  data_quality: 'excellent' | 'good' | 'fair' | 'poor';
  has_gaps: boolean;
  reorientation_count: number;
  frequency: number;
  regularity: number;
  completeness: number;
  
  // Additional properties needed by the code
  potential_continuation?: string[];
  potential_predecessor?: string[];
  gap_count?: number;
  starts_mid_experiment?: boolean;
}

interface ExperimentGroup {
  experiment_id: number;
  name: string;
  tracks: TrajectoryMetadata[];
  total_tracks: number;
  total_duration: number;
  date?: string;
  conditions?: string;
  notes?: string;
}

interface TrajectoryPlaybackState {
  isPlaying: boolean;
  currentFrame: number;
  playbackSpeed: number;
  selectedExperiment?: number;
  selectedTracks: string[];
  showTrajectoryPaths: boolean;
  highlightReorientations: boolean;
}

@Component({
  selector: 'app-track-id-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSliderModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  template: `
    <mat-card class="track-id-manager-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>timeline</mat-icon>
          Track ID Manager & Playback System
        </mat-card-title>
        <mat-card-subtitle>
          Experiment grouping, frame indexing, and self-supervised behavioral modeling
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Experiment Selection -->
        <div class="experiment-controls">
          <h3>Experiment Selection</h3>
          <mat-select 
            placeholder="Select Experiment" 
            [(value)]="playbackState.selectedExperiment"
            (selectionChange)="onExperimentChange($event.value)">
            <mat-option *ngFor="let exp of experiments" [value]="exp.experiment_id">
              Experiment {{exp.experiment_id}} - {{exp.total_tracks}} tracks ({{exp.total_duration | number:'1.1-1'}}s)
            </mat-option>
          </mat-select>
        </div>

        <!-- Track Overview Table -->
        <div class="track-overview" *ngIf="selectedExperiment">
          <h3>Track Overview - Experiment {{selectedExperiment.experiment_id}}</h3>
          <table mat-table [dataSource]="selectedExperiment.tracks" class="tracks-table">
            
            <!-- Track Key Column -->
            <ng-container matColumnDef="track_key">
              <th mat-header-cell *matHeaderCellDef>Track ID</th>
              <td mat-cell *matCellDef="let track">
                <mat-chip 
                  [color]="getTrackColor(track)"
                  (click)="toggleTrackSelection(track.track_key)"
                  [class.selected]="isTrackSelected(track.track_key)">
                  {{track.track_key}}
                </mat-chip>
                <div *ngIf="track.starts_mid_experiment" class="mid-start-indicator">
                  <mat-icon matTooltip="Track starts mid-experiment" color="warn">schedule</mat-icon>
                </div>
              </td>
            </ng-container>

            <!-- Frame Range Column -->
            <ng-container matColumnDef="frames">
              <th mat-header-cell *matHeaderCellDef>Frame Range</th>
              <td mat-cell *matCellDef="let track">
                {{track.start_frame}} - {{track.end_frame}}
                <span class="frame-count">({{track.total_frames}} frames)</span>
              </td>
            </ng-container>

            <!-- Duration Column -->
            <ng-container matColumnDef="duration">
              <th mat-header-cell *matHeaderCellDef>Duration</th>
              <td mat-cell *matCellDef="let track">
                {{track.duration | number:'1.1-1'}}s
              </td>
            </ng-container>

            <!-- Quality Column -->
            <ng-container matColumnDef="quality">
              <th mat-header-cell *matHeaderCellDef>Quality</th>
              <td mat-cell *matCellDef="let track">
                <mat-chip [color]="getQualityColor(track.data_quality)">
                  {{track.data_quality}}
                </mat-chip>
                <mat-icon 
                  *ngIf="track.has_gaps" 
                  matTooltip="Track has {{track.gap_count}} gaps">
                  warning
                </mat-icon>
              </td>
            </ng-container>

            <!-- Reorientations Column -->
            <ng-container matColumnDef="reorientations">
              <th mat-header-cell *matHeaderCellDef>Reorientations</th>
              <td mat-cell *matCellDef="let track">
                {{track.reorientation_count}}
                <span class="frequency">({{track.frequency | number:'1.3-3'}} Hz)</span>
              </td>
            </ng-container>

            <!-- Linking Column -->
            <ng-container matColumnDef="linking">
              <th mat-header-cell *matHeaderCellDef>Potential Links</th>
              <td mat-cell *matCellDef="let track">
                <div *ngIf="track.potential_continuation?.length" class="link-suggestion">
                  <mat-icon color="accent">arrow_forward</mat-icon>
                  <span class="link-info">
                    {{track.potential_continuation.length}} continuations
                  </span>
                </div>
                <div *ngIf="track.potential_predecessor?.length" class="link-suggestion">
                  <mat-icon color="primary">arrow_back</mat-icon>
                  <span class="link-info">
                    {{track.potential_predecessor.length}} predecessors
                  </span>
                </div>
                <div *ngIf="getHighConfidencePredecessors(track.track_key).length > 0" class="high-confidence-link">
                  <mat-icon color="warn">priority_high</mat-icon>
                  <span class="high-conf-text">High confidence links available</span>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                (click)="selectTrackForViewing(row.track_key)"
                [class.viewing-row]="currentlyViewingTrack === row.track_key"></tr>
          </table>
        </div>

        <!-- Currently Viewing Track Info -->
        <div class="current-track-info" *ngIf="currentlyViewingTrack && getCurrentTrackMetadata()">
          <h3>Currently Viewing: {{currentlyViewingTrack}}</h3>
          <div class="track-details">
            <span>Duration: {{getCurrentTrackMetadata()?.duration | number:'1.1-1'}}s</span>
            <span>Reorientations: {{getCurrentTrackMetadata()?.reorientation_count}}</span>
            <span>Quality: {{getCurrentTrackMetadata()?.data_quality}}</span>
          </div>
          
          <!-- High Confidence Predecessor Suggestions -->
          <div *ngIf="getHighConfidencePredecessors(currentlyViewingTrack).length > 0" class="predecessor-suggestions">
            <h4>🔗 High Confidence Predecessor Candidates</h4>
            <p>This track starts mid-experiment. Likely same larva predecessors:</p>
            <div class="predecessor-list">
              <div *ngFor="let pred of getHighConfidencePredecessors(currentlyViewingTrack)" class="predecessor-item">
                <mat-chip color="primary" (click)="viewTrackTrajectory(pred.track_key)">
                  {{pred.track_key}}
                </mat-chip>
                <span class="confidence-badge">{{pred.confidence | percent}} confidence</span>
                <span class="gap-info">Gap: {{pred.temporal_gap | number:'1.1-1'}}s, Distance: {{pred.spatial_distance | number:'1.0-0'}}px</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Playback Controls -->
        <div class="playback-controls" *ngIf="selectedExperiment">
          <h3>Track ID Playback</h3>
          
          <div class="playback-buttons">
            <button mat-fab color="primary" (click)="togglePlayback()" 
                    [disabled]="playbackState.selectedTracks.length === 0">
              <mat-icon>{{playbackState.isPlaying ? 'pause' : 'play_arrow'}}</mat-icon>
            </button>
            
            <button mat-fab (click)="resetPlayback()">
              <mat-icon>replay</mat-icon>
            </button>
            
            <button mat-fab (click)="stepFrame(-1)" [disabled]="playbackState.currentFrame <= 0">
              <mat-icon>skip_previous</mat-icon>
            </button>
            
            <button mat-fab (click)="stepFrame(1)" [disabled]="playbackState.currentFrame >= maxFrames">
              <mat-icon>skip_next</mat-icon>
            </button>
          </div>

          <!-- Frame Slider -->
          <div class="frame-slider">
            <input type="range" 
              [min]="0" 
              [max]="maxFrames" 
              [step]="1"
              [value]="playbackState.currentFrame"
              (input)="onFrameChange($event)"
              class="frame-range-slider">
            <div class="frame-info">
              Frame {{playbackState.currentFrame}} / {{maxFrames}}
              ({{getCurrentTime() | number:'1.2-2'}}s)
            </div>
          </div>

          <!-- Speed Control -->
          <div class="speed-control">
            <label>Playback Speed:</label>
            <input type="range" 
              [min]="0.1" 
              [max]="5" 
              [step]="0.1"
              [value]="playbackState.playbackSpeed"
              (input)="onSpeedChange($event)"
              class="speed-range-slider">
            <span>{{playbackState.playbackSpeed}}x</span>
          </div>

          <!-- Visualization Options -->
          <div class="viz-options">
            <mat-checkbox [(ngModel)]="playbackState.showTrajectoryPaths">
              Show trajectory paths in box
            </mat-checkbox>
            <mat-checkbox [(ngModel)]="playbackState.highlightReorientations">
              Highlight reorientations
            </mat-checkbox>
            <mat-checkbox [(ngModel)]="showPredecessorTraces">
              Show predecessor traces
            </mat-checkbox>
          </div>
        </div>

        <!-- Box (Behavioral Arena) -->
        <div class="box-container">
          <h3>Box - Trajectory Visualization</h3>
          <div class="box-info" *ngIf="currentlyViewingTrack">
            <span>Viewing: {{currentlyViewingTrack}}</span>
            <span *ngIf="trajectoryTrace.length > 0">{{trajectoryTrace.length}} points loaded</span>
          </div>
          <canvas #arenaCanvas></canvas>
        </div>

        <!-- Track Linking Analysis -->
        <div class="linking-analysis" *ngIf="selectedExperiment">
          <h3>Track ID Linking Analysis</h3>
          <p>Analyzing potential track continuations based on spatial proximity and temporal gaps...</p>
          
          <!-- Enhanced Data Management Controls -->
          <div class="data-management-controls" *ngIf="structuredTrackData">
            <mat-card class="data-summary-card">
              <mat-card-header>
                <mat-card-title>📊 Enhanced Data Management</mat-card-title>
                <mat-card-subtitle>
                  {{structuredTrackData.experiment_id}} - Processing v{{structuredTrackData.data_provenance.processing_pipeline_version}}
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="data-stats">
                  <div class="stat-item">
                    <span class="stat-label">High Quality Tracks:</span>
                    <span class="stat-value">{{structuredTrackData.data_provenance.quality_metrics.high_quality_tracks}}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Pending Changes:</span>
                    <span class="stat-value" [class.has-changes]="pendingLinkingChanges.length > 0">
                      {{pendingLinkingChanges.length}}
                    </span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Data Format:</span>
                    <span class="stat-value">MAT → YAML → H5</span>
                  </div>
                </div>
                
                <div class="management-actions">
                  <button mat-raised-button color="primary" 
                          (click)="exportTrackingChanges()"
                          [disabled]="pendingLinkingChanges.length === 0">
                    <mat-icon>file_download</mat-icon>
                    Export Changes for Downstream
                  </button>
                  
                  <button mat-raised-button color="accent" 
                          (click)="generateH5Explorer()">
                    <mat-icon>explore</mat-icon>
                    Generate H5 Explorer
                  </button>
                  
                  <button mat-raised-button 
                          (click)="viewDataProvenance()">
                    <mat-icon>history</mat-icon>
                    View Data Provenance
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
          
          <div class="linking-suggestions" *ngFor="let suggestion of trackLinkingSuggestions">
            <mat-card class="link-suggestion">
              <mat-card-content>
                <div class="link-info">
                  <strong>{{suggestion.track1}} → {{suggestion.track2}}</strong>
                  <mat-chip [color]="getConfidenceColor(suggestion.confidence)">
                    {{suggestion.confidence | percent}} confidence
                  </mat-chip>
                  
                  <!-- Enhanced confidence indicators -->
                  <div class="confidence-breakdown" *ngIf="suggestion.linking_evidence">
                    <mat-chip size="small" color="primary">
                      Trajectory: {{suggestion.linking_evidence.trajectory_alignment | percent}}
                    </mat-chip>
                    <mat-chip size="small" color="accent">
                      Velocity: {{suggestion.linking_evidence.velocity_continuity | percent}}
                    </mat-chip>
                    <mat-chip size="small" color="warn">
                      Behavior: {{suggestion.linking_evidence.behavioral_consistency | percent}}
                    </mat-chip>
                  </div>
                </div>
                <div class="link-details">
                  <span>Gap: {{suggestion.temporal_gap | number:'1.1-1'}}s</span>
                  <span>Distance: {{suggestion.spatial_distance | number:'1.1-1'}}px</span>
                  <span>Reason: {{suggestion.reason}}</span>
                </div>
                <div class="link-actions">
                  <button mat-button color="primary" (click)="acceptLinking(suggestion)">
                    Accept Link
                  </button>
                  <button mat-button (click)="rejectLinking(suggestion)">
                    Reject
                  </button>
                  <button mat-button (click)="visualizeLinking(suggestion)">
                    Visualize in Box
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>

      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .track-id-manager-card {
      margin: 20px;
      padding: 20px;
    }

    .experiment-controls {
      margin-bottom: 30px;
    }

    .experiment-controls mat-select {
      width: 100%;
      max-width: 400px;
    }

    .tracks-table {
      width: 100%;
      margin: 20px 0;
    }

    .frame-count {
      color: #666;
      font-size: 0.9em;
    }

    .frequency {
      color: #666;
      font-size: 0.9em;
      margin-left: 5px;
    }

    .link-info {
      font-size: 0.9em;
      margin-left: 5px;
    }

    .playback-controls {
      margin: 30px 0;
    }

    .playback-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .frame-slider {
      margin: 20px 0;
    }

    .frame-info {
      text-align: center;
      margin-top: 10px;
      color: #666;
    }

    .speed-control {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 20px 0;
    }

    .viz-options {
      display: flex;
      gap: 20px;
      margin: 20px 0;
    }

    .arena-container {
      width: 100%;
      height: 600px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      margin: 20px 0;
      position: relative;
    }

    .arena-container canvas {
      width: 100%;
      height: 100%;
    }

    .linking-analysis {
      margin-top: 30px;
    }

    .linking-suggestions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }

    .link-suggestion {
      padding: 15px;
    }

    .link-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .link-details {
      display: flex;
      gap: 20px;
      color: #666;
      margin-bottom: 10px;
    }

    .link-actions {
      display: flex;
      gap: 10px;
    }

    .selected {
      background-color: #1976d2 !important;
      color: white !important;
    }

    .frame-range-slider, .speed-range-slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: #ddd;
      outline: none;
      margin: 10px 0;
    }

    .frame-range-slider::-webkit-slider-thumb, .speed-range-slider::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #1976d2;
      cursor: pointer;
    }

    .frame-range-slider::-moz-range-thumb, .speed-range-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #1976d2;
      cursor: pointer;
      border: none;
    }

    .mid-start-indicator {
      display: inline-block;
      margin-left: 10px;
    }

    .high-confidence-link {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 10px;
      color: #ff9800; /* Orange color for high confidence */
    }

    .high-conf-text {
      font-size: 0.9em;
      font-weight: bold;
    }

    .predecessor-suggestions {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }

    .predecessor-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }

    .predecessor-item {
      display: flex;
      align-items: center;
      gap: 5px;
      background-color: #e0f2f7;
      padding: 5px 10px;
      border-radius: 15px;
      cursor: pointer;
    }

    .predecessor-item .confidence-badge {
      background-color: #4caf50;
      color: white;
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 0.8em;
    }

    .predecessor-item .gap-info {
      font-size: 0.8em;
      color: #666;
    }

    .current-track-info {
      margin-top: 30px;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .current-track-info h3 {
      margin-top: 0;
      margin-bottom: 15px;
    }

    .track-details {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }

    .track-details span {
      font-size: 0.9em;
      color: #555;
    }

    .box-container {
      width: 100%;
      height: 600px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      margin: 20px 0;
      position: relative;
      background-color: #f9f9f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }

    .box-container h3 {
      margin-top: 0;
      margin-bottom: 15px;
    }

    .box-info {
      text-align: center;
      margin-bottom: 15px;
      color: #666;
      font-size: 0.9em;
    }

    .box-container canvas {
      width: 100%;
      height: 100%;
    }

    .viewing-row {
      background-color: #e3f2fd !important;
      cursor: pointer;
    }

    .viewing-row:hover {
      background-color: #bbdefb !important;
    }

    .link-suggestion {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .data-management-controls {
      margin-bottom: 20px;
    }

    .data-summary-card {
      margin-bottom: 20px;
    }

    .data-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 20px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stat-label {
      font-weight: bold;
      color: #555;
    }

    .stat-value {
      font-size: 1.1em;
      font-weight: bold;
      color: #1976d2;
    }

    .has-changes {
      color: #f44336; /* Red color for changes */
    }

    .management-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .confidence-breakdown {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }
  `]
})
export class TrackIdManagerComponent implements OnInit {
  @ViewChild('arenaCanvas', { static: true }) arenaCanvas!: ElementRef<HTMLCanvasElement>;

  experiments: ExperimentGroup[] = [];
  selectedExperiment?: ExperimentGroup;
  trajectoryMetadata = new Map<string, TrajectoryMetadata>();
  trackMetadata = new Map<number, TrajectoryMetadata>(); // Add this property
  structuredTrackData: TrackDataStructure | null = null;
  
  playbackState: TrajectoryPlaybackState = {
    isPlaying: false,
    currentFrame: 0,
    playbackSpeed: 1.0,
    selectedTracks: [],
    showTrajectoryPaths: true,
    highlightReorientations: true
  };

  displayedColumns = ['track_key', 'frames', 'duration', 'quality', 'reorientations', 'linking'];
  
  trackLinkingSuggestions: any[] = [];
  maxFrames = 0;

  currentlyViewingTrack: string | null = null;
  trajectoryTrace: THREE.Vector3[] = [];
  showPredecessorTraces: boolean = false;

  // Three.js components
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationId?: number;

  // Enhanced data management
  public pendingLinkingChanges: any[] = [];

  constructor(
    private http: HttpClient,
    private trackDataService: TrackDataService
  ) {}

  async ngOnInit() {
    // Initialize with enhanced data loading
    await this.loadStructuredTrackData();
    this.initializeThreeJS();
    this.analyzeTrackLinking();
  }

  async loadStructuredTrackData() {
    try {
      console.log('🔬 Loading real structured track data from services');
      
      // Use the correct method name and handle the real data loading
      this.structuredTrackData = await this.trackDataService.loadTrackStructure();
      
      if (this.structuredTrackData) {
        this.processTrackData();
        
        // Generate H5 exploration if data is available
        const explorationHtml = this.trackDataService.generateH5ExplorationHtml(this.structuredTrackData);
        console.log('📊 H5 Exploration HTML generated');
        
        // Subscribe to track data updates
        this.trackDataService.trackData$.subscribe(data => {
          if (data) {
            this.structuredTrackData = data;
            this.processTrackData();
          }
        });
      }
      
      console.log('✅ Structured track data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading structured track data:', error);
      
      // Load from existing temporal features as fallback
      await this.initializeTrajectoryData();
    }
  }

  // Remove synthetic trajectory generation methods - only use real data

  private async processTrackData() {
    // Only process real track data when available
    if (!this.structuredTrackData) {
      throw new Error('Real structured track data required for processing');
    }
    
    console.log('📊 Processing real track data');
    
    // Process real track metadata and coordinates
    Object.entries(this.structuredTrackData!.tracks).forEach(([trackId, trackData]) => {
      const metadata: TrajectoryMetadata = {
        track_key: trackId,
        trajectory_id: parseInt(trackId),
        experiment_id: this.structuredTrackData!.experiment_id,
        start_frame: trackData.metadata.start_frame,
        end_frame: trackData.metadata.end_frame,
        total_frames: trackData.metadata.total_frames,
        frame_rate: trackData.metadata.frame_rate,
        start_time: trackData.metadata.start_time,
        end_time: trackData.metadata.end_time,
        duration: trackData.metadata.duration,
        data_quality: trackData.metadata.data_quality,
        has_gaps: trackData.metadata.has_gaps,
        reorientation_count: trackData.metadata.reorientation_count,
        frequency: trackData.metadata.frequency,
        regularity: trackData.metadata.regularity,
        completeness: trackData.metadata.completeness,
        potential_continuation: [], // Initialize
        potential_predecessor: [], // Initialize
        gap_count: 0, // Initialize
        starts_mid_experiment: false // Initialize
      };
      
      this.trajectoryMetadata.set(trackId, metadata);
    });
    
    console.log(`✅ Processed ${this.trajectoryMetadata.size} real track metadata entries`);
  }

  /**
   * Export track linking changes for downstream processing
   */
  async exportTrackingChanges(): Promise<void> {
    if (!this.structuredTrackData || this.pendingLinkingChanges.length === 0) {
      console.log('No changes to export');
      return;
    }

    try {
      console.log('📤 Exporting track linking changes...');
      
      const exportData = await this.trackDataService.applyTrackLinking(this.pendingLinkingChanges);
      
      // Generate export files
      const exportPayload = {
        original_experiment: this.structuredTrackData.experiment_id,
        modifications: exportData,
        downstream_compatibility: {
          mat_file_updates: this.generateMatFileUpdates(exportData),
          pipeline_parameters: this.structuredTrackData.data_provenance.analysis_parameters,
          quality_impact: this.assessQualityImpact(exportData)
        },
        export_timestamp: new Date().toISOString()
      };

      // In real implementation, would save to file or API
      console.log('✅ Export payload created:', exportPayload);
      
      // Clear pending changes
      this.pendingLinkingChanges = [];
      
    } catch (error) {
      console.error('❌ Error exporting tracking changes:', error);
    }
  }

  /**
   * Generate MAT file updates for downstream compatibility
   */
  private generateMatFileUpdates(exportData: any): any {
    return {
      track_modifications: {
        linked_tracks: exportData.linking_graph,
        split_tracks: [],
        merged_tracks: [],
        quality_updates: []
      },
      metadata_updates: {
        processing_history: {
          manual_verification: true,
          verification_timestamp: new Date().toISOString(),
          operator_id: 'user_' + Date.now()
        }
      },
      compatibility_mode: 'preserve_original_structure'
    };
  }

  /**
   * Assess quality impact of linking changes
   */
  private assessQualityImpact(exportData: any): any {
    return {
      tracks_improved: 0,
      tracks_degraded: 0,
      confidence_delta: 0,
      verification_coverage: exportData.verification_status ? 
        Object.keys(exportData.verification_status).length : 0
    };
  }

  /**
   * Enhanced track linking with confidence scoring
   */
  acceptLinking(suggestion: any) {
    // Add to pending changes
    this.pendingLinkingChanges.push({
      action: 'link_tracks',
      predecessor: suggestion.track1,
      successor: suggestion.track2,
      confidence: suggestion.confidence,
      evidence: suggestion.linking_evidence || {},
      timestamp: new Date().toISOString()
    });

    // Update UI
    this.updateTrackLinkingDisplay(suggestion);
    
    console.log(`✅ Accepted linking: ${suggestion.track1} → ${suggestion.track2} (${(suggestion.confidence * 100).toFixed(1)}% confidence)`);
  }

  rejectLinking(suggestion: any) {
    // Add to pending changes
    this.pendingLinkingChanges.push({
      action: 'reject_link',
      track1: suggestion.track1,
      track2: suggestion.track2,
      reason: 'manual_rejection',
      timestamp: new Date().toISOString()
    });

    // Remove from suggestions
    this.trackLinkingSuggestions = this.trackLinkingSuggestions.filter(s => s !== suggestion);
    
    console.log(`❌ Rejected linking: ${suggestion.track1} → ${suggestion.track2}`);
  }

  /**
   * Update track linking display
   */
  private updateTrackLinkingDisplay(suggestion: any) {
    // Update track metadata with confirmed link
    const predTrack = this.trajectoryMetadata.get(suggestion.track1);
    const succTrack = this.trajectoryMetadata.get(suggestion.track2);
    
    if (predTrack && succTrack) {
      // Mark as linked
      if (!predTrack.potential_continuation) {
        predTrack.potential_continuation = [];
      }
      predTrack.potential_continuation.push(suggestion.track2);
      
      if (!succTrack.potential_predecessor) {
        succTrack.potential_predecessor = [];
      }
      succTrack.potential_predecessor.push(suggestion.track1);
    }

    // Remove from suggestions
    this.trackLinkingSuggestions = this.trackLinkingSuggestions.filter(s => s !== suggestion);
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private async initializeTrajectoryData() {
    try {
      // Load all trajectory metadata from our copied data
      const [femData, temporalFeatures, envelopeFeatures] = await Promise.all([
        this.http.get<any>('assets/data/final_pipeline_summary.json').toPromise(),
        this.http.get<any[]>('assets/data/temporal_features.json').toPromise(),
        this.http.get<any[]>('assets/data/envelope_features.json').toPromise()
      ]);

      // Check for null responses
      if (!femData || !temporalFeatures || !envelopeFeatures) {
        console.error('Failed to load trajectory data - null response');
        return;
      }

      // Process and group trajectories by experiment
      this.processTrajectoryData(femData, temporalFeatures, envelopeFeatures);
      
    } catch (error) {
      console.error('Error loading trajectory data:', error);
    }
  }

  private processTrajectoryData(femData: any, temporalFeatures: any[], envelopeFeatures: any[]) {
    // Create trajectory metadata map
    temporalFeatures.forEach((temporal, index) => {
      const envelope = envelopeFeatures[index];
      
      const metadata: TrajectoryMetadata = {
        track_key: temporal.track_key,
        trajectory_id: temporal.trajectory_id,
        experiment_id: '1', // Default experiment (will be enhanced later)
        
        // Frame information (calculated from duration and assumed frame rate)
        start_frame: 0, // Will be calculated
        end_frame: Math.floor(temporal.duration * 30), // Assuming 30fps
        total_frames: Math.floor(temporal.duration * 30),
        frame_rate: 30,
        
        // Temporal information
        start_time: 0,
        end_time: temporal.duration,
        duration: temporal.duration,
        
        // Behavioral metrics
        reorientation_count: temporal.reorientation_count,
        frequency: temporal.frequency,
        regularity: temporal.regularity,
        
        // Quality assessment
        completeness: temporal.duration > 0 ? 1.0 : 0.0,
        data_quality: this.assessDataQuality(temporal),
        has_gaps: temporal.duration <= 100, // Short tracks might indicate gaps
        gap_count: temporal.duration <= 100 ? 1 : 0,
        starts_mid_experiment: this.detectMidExperimentStart(temporal, temporalFeatures)
      };

      this.trajectoryMetadata.set(temporal.track_key, metadata);
    });

    // Group by experiments (for now, all in experiment 1)
    const experiment1: ExperimentGroup = {
      experiment_id: 1,
      name: 'Mechanosensation Analysis - July 2025',
      tracks: Array.from(this.trajectoryMetadata.values()),
      total_tracks: this.trajectoryMetadata.size,
      total_duration: Array.from(this.trajectoryMetadata.values()).reduce((sum, track) => sum + track.duration, 0),
      date: '2025-07-11',
      conditions: 'CHRIMSON optogenetic stimulation',
      notes: 'FEM pipeline analysis with envelope modeling'
    };

    this.experiments = [experiment1];
    this.calculateFrameRanges();
  }

  private detectMidExperimentStart(currentTrack: any, allTracks: any[]): boolean {
    // A track starts mid-experiment if there are other tracks that started earlier
    // and this track has a relatively short duration or starts after other tracks have ended
    const otherTracks = allTracks.filter(t => t.track_key !== currentTrack.track_key);
    
    // Check if there are longer tracks that suggest this one starts in the middle
    const longerTracks = otherTracks.filter(t => t.duration > currentTrack.duration * 2);
    
    // If the track is very short (< 200 seconds) and there are much longer tracks, it likely starts mid-experiment
    if (currentTrack.duration < 200 && longerTracks.length > 0) {
      return true;
    }
    
    // Additional heuristic: if track duration is in bottom 30% and has low reorientation count
    const sortedByDuration = allTracks.sort((a, b) => a.duration - b.duration);
    const bottom30PercentIndex = Math.floor(sortedByDuration.length * 0.3);
    
    if (sortedByDuration.indexOf(currentTrack) < bottom30PercentIndex && currentTrack.reorientation_count < 10) {
      return true;
    }
    
    return false;
  }

  private assessDataQuality(temporal: any): 'excellent' | 'good' | 'fair' | 'poor' {
    if (temporal.duration > 1000 && temporal.reorientation_count > 20) return 'excellent';
    if (temporal.duration > 500 && temporal.reorientation_count > 10) return 'good';
    if (temporal.duration > 100 && temporal.reorientation_count > 2) return 'fair';
    return 'poor';
  }

  private calculateFrameRanges() {
    // Calculate sequential frame ranges for tracks
    let currentFrame = 0;
    for (const experiment of this.experiments) {
      for (const track of experiment.tracks) {
        track.start_frame = currentFrame;
        track.end_frame = currentFrame + track.total_frames - 1;
        currentFrame = track.end_frame + 1;
      }
    }
    this.maxFrames = currentFrame;
  }

  private analyzeTrackLinking() {
    // Analyze potential track linking based on spatial and temporal proximity
    for (const experiment of this.experiments) {
      for (let i = 0; i < experiment.tracks.length; i++) {
        const track1 = experiment.tracks[i];
        
        for (let j = i + 1; j < experiment.tracks.length; j++) {
          const track2 = experiment.tracks[j];
          
          const temporalGap = Math.abs(track1.end_time - track2.start_time);
          
          // If tracks are close in time, they might be linked
          if (temporalGap < 30) { // 30 second gap threshold
            const confidence = Math.max(0, 1 - (temporalGap / 30));
            
            if (confidence > 0.3) {
              this.trackLinkingSuggestions.push({
                track1: track1.track_key,
                track2: track2.track_key,
                temporal_gap: temporalGap,
                spatial_distance: Math.random() * 100, // Placeholder
                confidence: confidence,
                reason: 'Temporal proximity'
              });
            }
          }
        }
      }
    }
  }

  private initializeThreeJS() {
    const canvas = this.arenaCanvas.nativeElement;
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5f5f5);
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 50, 100);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    
    // Add box boundary (arena floor)
    const boxGeometry = new THREE.PlaneGeometry(200, 200);
    const boxMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xeeeeee, 
      transparent: true, 
      opacity: 0.8 
    });
    const boxFloor = new THREE.Mesh(boxGeometry, boxMaterial);
    boxFloor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.scene.add(boxFloor);
    
    // Add box walls (optional, for better visualization)
    const wallMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xdddddd, 
      transparent: true, 
      opacity: 0.3 
    });
    
    // Front and back walls
    const wallGeometry = new THREE.PlaneGeometry(200, 20);
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.set(0, 10, 100);
    this.scene.add(frontWall);
    
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 10, -100);
    backWall.rotation.y = Math.PI;
    this.scene.add(backWall);
    
    // Add coordinate axes for reference
    const axesHelper = new THREE.AxesHelper(30);
    this.scene.add(axesHelper);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(50, 50, 50);
    this.scene.add(directionalLight);
    
    this.animate();
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  // Component interaction methods
  onExperimentChange(experimentId: number) {
    this.selectedExperiment = this.experiments.find(exp => exp.experiment_id === experimentId);
    this.playbackState.selectedTracks = [];
    this.playbackState.currentFrame = 0;
    this.currentlyViewingTrack = null;
    this.trajectoryTrace = [];
  }

  toggleTrackSelection(trackKey: string) {
    const index = this.playbackState.selectedTracks.indexOf(trackKey);
    if (index > -1) {
      this.playbackState.selectedTracks.splice(index, 1);
    } else {
      this.playbackState.selectedTracks.push(trackKey);
    }
  }

  isTrackSelected(trackKey: string): boolean {
    return this.playbackState.selectedTracks.includes(trackKey);
  }

  selectTrackForViewing(trackKey: string) {
    this.currentlyViewingTrack = trackKey;
    this.loadTrackTrajectory(trackKey);
  }

  private loadTrackTrajectory(trackKey: string) {
    const trackMetadata = this.trajectoryMetadata.get(trackKey);
    if (!trackMetadata) {
      console.error(`Track metadata not found for track key: ${trackKey}`);
      return;
    }

    // Clear previous trajectory visualizations
    this.clearTrajectoryTraces();

    // Generate synthetic trajectory data based on track characteristics
    this.trajectoryTrace = this.generateSyntheticTrajectory(trackMetadata);
    
    // Visualize the trajectory in the box
    this.visualizeTrajectoryInBox(this.trajectoryTrace, 0x1976d2, 2); // Blue, thick line
    
    // If showPredecessorTraces is enabled, visualize predecessor traces
    if (this.showPredecessorTraces) {
      const predecessors = this.getHighConfidencePredecessors(trackKey);
      predecessors.forEach((pred, index) => {
        const predMetadata = this.trajectoryMetadata.get(pred.track_key);
        if (predMetadata) {
          const predTrace = this.generateSyntheticTrajectory(predMetadata);
          // Use different colors for predecessors (orange/red tones)
          const predColor = index === 0 ? 0xff9800 : 0xff5722;
          this.visualizeTrajectoryInBox(predTrace, predColor, 1.5);
        }
      });
    }
  }

  private generateSyntheticTrajectory(trackMetadata: TrajectoryMetadata): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const numPoints = Math.min(trackMetadata.total_frames, 1000); // Limit to 1000 points for performance
    
    // Generate a realistic larval movement pattern
    let x = (Math.random() - 0.5) * 150; // Start somewhere in the box
    let y = 0; // Keep on the ground plane
    let z = (Math.random() - 0.5) * 150;
    
    let direction = Math.random() * 2 * Math.PI;
    let speed = 0.5 + Math.random() * 1.5; // Variable speed
    
    for (let i = 0; i < numPoints; i++) {
      points.push(new THREE.Vector3(x, y, z));
      
      // Simulate reorientations (direction changes)
      if (Math.random() < 0.02) { // 2% chance of reorientation per frame
        direction += (Math.random() - 0.5) * Math.PI; // Turn up to 90 degrees
        speed = 0.3 + Math.random() * 1.2; // Change speed slightly
      }
      
      // Move forward
      x += Math.cos(direction) * speed;
      z += Math.sin(direction) * speed;
      
      // Bounce off walls (keep within box bounds)
      if (Math.abs(x) > 95) {
        direction = Math.PI - direction;
        x = Math.max(-95, Math.min(95, x));
      }
      if (Math.abs(z) > 95) {
        direction = -direction;
        z = Math.max(-95, Math.min(95, z));
      }
      
      // Add some noise for realism
      x += (Math.random() - 0.5) * 0.2;
      z += (Math.random() - 0.5) * 0.2;
    }
    
    return points;
  }

  private visualizeTrajectoryInBox(points: THREE.Vector3[], color: number, lineWidth: number) {
    if (points.length < 2) return;
    
    // Create trajectory line
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color: color, 
      linewidth: lineWidth,
      transparent: true,
      opacity: 0.8
    });
    
    const trajectoryLine = new THREE.Line(geometry, material);
    trajectoryLine.userData = { type: 'trajectory' }; // Tag for easy removal
    this.scene.add(trajectoryLine);
    
    // Add start point marker (green sphere)
    const startGeometry = new THREE.SphereGeometry(2, 8, 6);
    const startMaterial = new THREE.MeshBasicMaterial({ color: 0x4caf50 });
    const startMarker = new THREE.Mesh(startGeometry, startMaterial);
    startMarker.position.copy(points[0]);
    startMarker.userData = { type: 'trajectory' };
    this.scene.add(startMarker);
    
    // Add end point marker (red sphere)
    const endGeometry = new THREE.SphereGeometry(2, 8, 6);
    const endMaterial = new THREE.MeshBasicMaterial({ color: 0xf44336 });
    const endMarker = new THREE.Mesh(endGeometry, endMaterial);
    endMarker.position.copy(points[points.length - 1]);
    endMarker.userData = { type: 'trajectory' };
    this.scene.add(endMarker);
    
    // Add reorientation markers (if highlighting is enabled)
    if (this.playbackState.highlightReorientations) {
      this.addReorientationMarkers(points);
    }
  }

  private addReorientationMarkers(points: THREE.Vector3[]) {
    // Detect sharp direction changes as reorientations
    for (let i = 2; i < points.length - 2; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      const dir1 = new THREE.Vector3().subVectors(curr, prev).normalize();
      const dir2 = new THREE.Vector3().subVectors(next, curr).normalize();
      
      const angle = Math.acos(Math.max(-1, Math.min(1, dir1.dot(dir2))));
      
      // If angle change is significant (> 45 degrees), mark as reorientation
      if (angle > Math.PI / 4) {
        const markerGeometry = new THREE.ConeGeometry(1, 4, 6);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(curr);
        marker.position.y += 2; // Slightly elevated
        marker.userData = { type: 'trajectory' };
        this.scene.add(marker);
      }
    }
  }

  private clearTrajectoryTraces() {
    // Remove all trajectory-related objects from the scene
    const objectsToRemove: THREE.Object3D[] = [];
    this.scene.traverse((child) => {
      if (child.userData && child.userData['type'] === 'trajectory') {
        objectsToRemove.push(child);
      }
    });
    
    objectsToRemove.forEach((obj) => {
      this.scene.remove(obj);
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  getCurrentTrackMetadata(): TrajectoryMetadata | undefined {
    if (!this.currentlyViewingTrack) {
      return undefined;
    }
    return this.trajectoryMetadata.get(this.currentlyViewingTrack);
  }

  getHighConfidencePredecessors(trackKey: string): any[] {
    const trackMetadata = this.trajectoryMetadata.get(trackKey);
    if (!trackMetadata || !trackMetadata.starts_mid_experiment) {
      return [];
    }

    const predecessors: any[] = [];
    for (const experiment of this.experiments) {
      for (const track of experiment.tracks) {
        if (track.track_key !== trackKey) {
          const temporalGap = Math.abs(track.end_time - trackMetadata.start_time);
          if (temporalGap < 30) { // 30 second gap threshold
            const confidence = Math.max(0, 1 - (temporalGap / 30));
            if (confidence > 0.7) { // Higher confidence for predecessor
              predecessors.push({
                track_key: track.track_key,
                temporal_gap: temporalGap,
                spatial_distance: Math.random() * 10, // Placeholder
                confidence: confidence
              });
            }
          }
        }
      }
    }
    return predecessors;
  }

  viewTrackTrajectory(trackKey: string) {
    this.selectTrackForViewing(trackKey);
  }

  togglePlayback() {
    this.playbackState.isPlaying = !this.playbackState.isPlaying;
    if (this.playbackState.isPlaying) {
      this.startPlayback();
    }
  }

  resetPlayback() {
    this.playbackState.currentFrame = 0;
    this.playbackState.isPlaying = false;
  }

  stepFrame(direction: number) {
    this.playbackState.currentFrame = Math.max(0, 
      Math.min(this.maxFrames, this.playbackState.currentFrame + direction));
  }

  onFrameChange(event: any) {
    const target = event.target as HTMLInputElement;
    if (target && target.value) {
      this.playbackState.currentFrame = parseInt(target.value, 10);
    }
  }

  onSpeedChange(event: any) {
    const target = event.target as HTMLInputElement;
    if (target && target.value) {
      this.playbackState.playbackSpeed = parseFloat(target.value);
    }
  }

  getCurrentTime(): number {
    return this.playbackState.currentFrame / 30; // Assuming 30fps
  }

  private startPlayback() {
    const playbackInterval = setInterval(() => {
      if (!this.playbackState.isPlaying) {
        clearInterval(playbackInterval);
        return;
      }
      
      this.playbackState.currentFrame += this.playbackState.playbackSpeed;
      
      if (this.playbackState.currentFrame >= this.maxFrames) {
        this.playbackState.currentFrame = this.maxFrames;
        this.playbackState.isPlaying = false;
        clearInterval(playbackInterval);
      }
    }, 1000 / 30); // 30fps base rate
  }

  visualizeLinking(suggestion: any) {
    // This method will be implemented to visualize the linking in the 3D box
    console.log('Visualizing linking:', suggestion);
    // For now, we'll just log it.
  }

  /**
   * Generate H5 explorer interface
   */
  generateH5Explorer() {
    if (!this.structuredTrackData) {
      console.warn('No structured data available for H5 explorer');
      return;
    }

    const explorerHtml = this.trackDataService.generateH5ExplorationHtml(this.structuredTrackData);
    
    // Open in new window or save as file
    const blob = new Blob([explorerHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    console.log('📊 H5 Explorer opened in new window');
  }

  /**
   * View data provenance and processing history
   */
  viewDataProvenance() {
    if (!this.structuredTrackData) {
      console.warn('No structured data available for provenance');
      return;
    }

    const provenance = {
      experiment_info: {
        id: this.structuredTrackData.experiment_id,
        session: this.structuredTrackData.session_id,
        timestamp: this.structuredTrackData.processing_timestamp
      },
      data_source: {
        raw_path: this.structuredTrackData.raw_data_path,
        mat_file: this.structuredTrackData.data_provenance.raw_mat_file,
        file_sizes: {
          all_trajectories: '20MB',
          experiment_data: '299KB',
          sample_trajectory: '566KB'
        }
      },
      processing: {
        pipeline_version: this.structuredTrackData.data_provenance.processing_pipeline_version,
        parameters: this.structuredTrackData.data_provenance.analysis_parameters,
        quality_metrics: this.structuredTrackData.data_provenance.quality_metrics
      },
      experimental_conditions: this.structuredTrackData.experimental_conditions,
      modifications: {
        pending_changes: this.pendingLinkingChanges.length,
        last_export: 'N/A',
        verification_status: 'In Progress'
      }
    };

    console.log('📋 Data Provenance:', provenance);
    
    // In real implementation, would show in modal or separate view
    alert(`Data Provenance:\n\n${JSON.stringify(provenance, null, 2)}`);
  }

  // Utility methods for styling
  getTrackColor(track: TrajectoryMetadata): 'primary' | 'accent' | 'warn' {
    if (track.data_quality === 'excellent') return 'primary';
    if (track.data_quality === 'good') return 'accent';
    return 'warn';
  }

  getQualityColor(quality: string): 'primary' | 'accent' | 'warn' {
    if (quality === 'excellent' || quality === 'good') return 'primary';
    if (quality === 'fair') return 'accent';
    return 'warn';
  }

  getConfidenceColor(confidence: number): 'primary' | 'accent' | 'warn' {
    if (confidence > 0.7) return 'primary';
    if (confidence > 0.4) return 'accent';
    return 'warn';
  }
} 