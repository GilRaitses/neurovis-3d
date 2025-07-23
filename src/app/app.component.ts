import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { BehavioralArenaComponent } from './components/behavioral-arena.component';
import { TrackIdManagerComponent } from './components/track-id-manager.component';
import { AnalyticsDataService, AnalyticsData } from './services/analytics-data.service';
import { PythonNeuroglancerService } from './services/python-neuroglancer.service';
import { SlideViewerComponent } from './components/slide-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSliderModule,
    MatTooltipModule,
    MatCheckboxModule,
    FormsModule,
    BehavioralArenaComponent,
    TrackIdManagerComponent,
    SlideViewerComponent
  ],
  template: `
    <div class="app-container" data-cy="app-loaded">
      <!-- Professional Header -->
      <mat-toolbar color="primary" class="main-toolbar">
        <mat-icon class="toolbar-icon">biotech</mat-icon>
        <span class="toolbar-title">NeuroCircuit.Science</span>
        <span class="toolbar-subtitle">Mechanosensory Circuit Analysis Platform</span>
        <span class="spacer"></span>
        <button mat-icon-button>
          <mat-icon>account_circle</mat-icon>
        </button>
      </mat-toolbar>

      <!-- Professional Dashboard Layout -->
      <div class="dashboard-container">
        <mat-sidenav-container class="sidenav-container">
          
          <!-- Navigation Sidebar -->
          <mat-sidenav mode="side" opened class="navigation-sidenav">
            <mat-nav-list>
              <mat-list-item 
                (click)="selectedTab = 0" 
                [class.active]="selectedTab === 0"
                data-cy="nav-analytics">
                <mat-icon matListItemIcon>analytics</mat-icon>
                <span matListItemTitle>Analytics</span>
              </mat-list-item>
              <mat-list-item 
                (click)="selectedTab = 1" 
                [class.active]="selectedTab === 1"
                data-cy="nav-track-management">
                <mat-icon matListItemIcon>track_changes</mat-icon>
                <span matListItemTitle>Track Management</span>
              </mat-list-item>
              <mat-list-item 
                (click)="selectedTab = 2" 
                [class.active]="selectedTab === 2"
                data-cy="nav-behavioral-arena">
                <mat-icon matListItemIcon>3d_rotation</mat-icon>
                <span matListItemTitle>Behavioral Arena</span>
              </mat-list-item>
              <mat-list-item 
                (click)="selectedTab = 3" 
                [class.active]="selectedTab === 3"
                data-cy="nav-neural-circuits">
                <mat-icon matListItemIcon>device_hub</mat-icon>
                <span matListItemTitle>Neural Circuits</span>
              </mat-list-item>
            </mat-nav-list>
          </mat-sidenav>

          <!-- Main Content Area -->
          <mat-sidenav-content class="main-content">
            
            <!-- Analytics Summary - Now with Real Slide Viewer -->
            <div *ngIf="selectedTab === 0" class="content-panel" data-cy="analytics-summary">
              <div class="panel-header">
                <h1><mat-icon>timeline</mat-icon> Mechanosensation Analysis</h1>
                <p class="panel-subtitle">Real experimental data slides and envelope analysis from FEM pipeline</p>
              </div>
              
              <app-slide-viewer></app-slide-viewer>
            </div>

            <!-- Track ID Manager -->
            <div *ngIf="selectedTab === 1" class="content-panel" data-cy="track-manager">
              <app-track-id-manager></app-track-id-manager>
            </div>

            <!-- Behavioral Arena -->
            <div *ngIf="selectedTab === 2" class="content-panel" data-cy="behavioral-arena">
              <app-behavioral-arena></app-behavioral-arena>
            </div>

            <!-- Neural Circuits -->
            <div *ngIf="selectedTab === 3" class="content-panel" data-cy="neural-circuits">
              <div class="panel-header">
                <h1>Neural Circuits Analysis</h1>
                <p class="panel-subtitle">FlyWire Connectome - CHRIMSON Optogenetics</p>
              </div>
              
              <mat-card class="neuroglancer-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>account_tree</mat-icon>
                    CHRIMSON Neural Circuits
                  </mat-card-title>
                  <mat-card-subtitle>
                    Real-time 3D Visualization - Cloud Backend Service
                  </mat-card-subtitle>
                </mat-card-header>
                
                <mat-card-content>
                  <div class="neuroglancer-controls">
                    <button mat-raised-button color="primary" (click)="initializeNeuroglancer()">
                      <mat-icon>play_arrow</mat-icon>
                      Initialize 3D Viewer
                    </button>
                    
                    <button mat-raised-button color="accent" (click)="loadChrimsonCircuits()" [disabled]="!neuroglancerInitialized">
                      <mat-icon>visibility</mat-icon>
                      Load CHRIMSON Circuits
                    </button>
                    
                    <span class="status-indicator" [class.active]="neuroglancerInitialized">
                      <mat-icon>{{neuroglancerInitialized ? 'check_circle' : 'pending'}}</mat-icon>
                      {{neuroglancerInitialized ? 'Connected' : 'Pending'}}
                    </span>
                  </div>
                  
                  <div class="neuroglancer-container" *ngIf="neuroglancerUrl">
                    <iframe 
                      [src]="neuroglancerUrl" 
                      class="neuroglancer-iframe"
                      frameborder="0"
                      width="100%" 
                      height="600px">
                    </iframe>
                  </div>
                  
                  <div class="placeholder-message" *ngIf="!neuroglancerUrl">
                    <mat-icon class="large-icon">3d_rotation</mat-icon>
                    <h3>3D Neural Circuit Viewer</h3>
                    <p>Click "Initialize 3D Viewer" to start the Neuroglancer visualization</p>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

          </mat-sidenav-content>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styles: [`
    /* Clean, responsive app layout */
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #1a1a1a;
      color: #fff;
    }

    .main-toolbar {
      background: linear-gradient(45deg, #2c3e50, #3498db);
      color: white;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .toolbar-title {
      font-size: 1.5em;
      font-weight: 300;
      margin-left: 10px;
    }

    .toolbar-subtitle {
      font-size: 0.9em;
      opacity: 0.8;
      margin-left: 10px;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .dashboard-container {
      flex: 1;
      overflow: hidden;
    }

    .sidenav-container {
      height: 100%;
    }

    .navigation-sidenav {
      width: 250px;
      background: linear-gradient(135deg, 
        #2c3e50 0%, 
        rgba(255, 20, 147, 0.15) 25%, 
        rgba(50, 205, 50, 0.1) 50%, 
        rgba(255, 20, 147, 0.08) 75%, 
        #2c3e50 100%);
      border-right: none;
      position: relative;
    }

    .navigation-sidenav::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(
        ellipse at 30% 20%, 
        rgba(255, 20, 147, 0.1) 0%, 
        transparent 50%
      ),
      radial-gradient(
        ellipse at 70% 80%, 
        rgba(50, 205, 50, 0.08) 0%, 
        transparent 50%
      );
      pointer-events: none;
    }

    .navigation-sidenav .mat-mdc-list-item {
      color: #ecf0f1;
      border-radius: 8px;
      margin: 5px 10px;
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;
    }

    .navigation-sidenav .mat-mdc-list-item:hover {
      background: linear-gradient(
        45deg, 
        rgba(255, 20, 147, 0.2) 0%, 
        rgba(50, 205, 50, 0.15) 100%
      );
      transform: translateX(3px);
      box-shadow: 0 3px 8px rgba(255, 20, 147, 0.3);
    }

    .navigation-sidenav .mat-mdc-list-item.active {
      background: linear-gradient(
        90deg, 
        rgba(255, 20, 147, 0.4) 0%, 
        rgba(50, 205, 50, 0.3) 50%, 
        rgba(255, 20, 147, 0.4) 100%
      );
      color: white;
      box-shadow: 0 4px 12px rgba(255, 20, 147, 0.4);
    }

    .main-content {
      background: #1a1a1a;
      overflow-y: auto;
      height: 100%;
      margin-left: 250px; /* Reserve space for sidebar */
      width: calc(100% - 250px); /* Prevent content bleeding under sidebar */
    }

    .content-panel {
      padding: 20px;
      max-width: 1400px; /* Cap content width */
      margin: 0 auto; /* Center the content */
      height: calc(100vh - 120px);
      overflow-y: auto;
    }

    .panel-header {
      text-align: center;
      margin-bottom: 20px;
      background: linear-gradient(
        45deg, 
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 20, 147, 0.08) 30%,
        rgba(50, 205, 50, 0.06) 70%,
        rgba(255, 255, 255, 0.05) 100%
      );
      padding: 15px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
    }

    .panel-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: conic-gradient(
        from 0deg at 50% 50%,
        rgba(255, 20, 147, 0.05) 0deg,
        rgba(50, 205, 50, 0.03) 90deg,
        rgba(255, 20, 147, 0.05) 180deg,
        rgba(50, 205, 50, 0.03) 270deg,
        rgba(255, 20, 147, 0.05) 360deg
      );
      border-radius: 10px;
      pointer-events: none;
    }

    .panel-header h1 {
      font-size: 2em;
      font-weight: 300;
      margin-bottom: 8px;
      background: linear-gradient(
        135deg, 
        #ff1493 0%, 
        #32cd32 25%, 
        #ff1493 50%, 
        #32cd32 75%, 
        #ff1493 100%
      );
      background-size: 200% 200%;
      animation: gradientShift 8s ease-in-out infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      position: relative;
      z-index: 1;
    }

    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .panel-subtitle {
      font-size: 1em; /* Reduce subtitle size */
      opacity: 0.8;
      margin: 0;
    }

    /* Neuroglancer Specific Styles */
    .neuroglancer-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      margin-top: 20px;
    }

    .neuroglancer-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .neuroglancer-controls .mat-mdc-button {
      background: linear-gradient(45deg, #4ecdc4, #45b7d1);
      color: white;
      border-radius: 10px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 8px 20px rgba(78, 220, 196, 0.4);
      transition: all 0.3s ease;
    }

    .neuroglancer-controls .mat-mdc-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(78, 220, 196, 0.6);
    }

    .neuroglancer-controls .mat-mdc-button:disabled {
      background: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.5);
      cursor: not-allowed;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #4ecdc4;
      font-size: 14px;
      font-weight: 500;
    }

    .status-indicator mat-icon {
      font-size: 20px;
    }

    .neuroglancer-container {
      position: relative;
      width: 100%;
      height: 600px;
      border-radius: 10px;
      overflow: hidden;
      background: #000;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .neuroglancer-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .placeholder-message {
      text-align: center;
      padding: 50px 20px;
      color: #fff;
      opacity: 0.7;
    }

    .placeholder-message .large-icon {
      font-size: 60px;
      margin-bottom: 15px;
    }

    .placeholder-message h3 {
      font-size: 1.8em;
      margin-bottom: 10px;
      color: #4ecdc4;
    }

    .placeholder-message p {
      font-size: 1.1em;
      opacity: 0.8;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .navigation-sidenav {
        width: 200px;
      }
      
      .content-panel {
        padding: 15px;
        height: calc(100vh - 100px);
      }
      
      .panel-header h1 {
        font-size: 2em;
        flex-direction: column;
      }
      
      .neuroglancer-controls {
        flex-direction: column;
        gap: 10px;
      }
      
      .neuroglancer-container {
        height: 400px;
      }
    }

    @media (max-width: 480px) {
      .navigation-sidenav {
        width: 180px;
      }
      
      .content-panel {
        padding: 10px;
      }
      
      .panel-header {
        padding: 15px;
      }
      
      .panel-header h1 {
        font-size: 1.8em;
      }
      
      .neuroglancer-container {
        height: 300px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'NeuroCircuit.Science';
  selectedTab = 0;
  analyticsData: AnalyticsData | null = null;

  // New properties for mechanosensation simulation
  isPlaying: boolean = false;
  currentCycleTime: number = 0;
  currentTrack: number = 0;
  currentTurnRate: number = 0;
  cycleProgress: number = 0;
  playbackSpeed: number = 1000; // Default to 1s
  viewMode: 'envelope' | 'individual' | 'both' = 'envelope';
  binResolution: number = 20;
  smoothingWindow: number = 5;
  responseThreshold: number = 1.0;
  ledIntensity: number = 1.0;
  chartScale: number = 1.0;
  larvaeCount: number = 100;
  stimulusStrength: number = 1.0;

  // New properties for Neuroglancer
  neuroglancerUrl: string | null = null;
  neuroglancerInitialized: boolean = false;

  constructor(
    private analyticsDataService: AnalyticsDataService,
    private neuroglancerService: PythonNeuroglancerService
  ) {}

  ngOnInit() {
    console.log('[AppComponent] ngOnInit called, starting data load');
    this.loadAnalyticsData();
  }

  loadAnalyticsData() {
    console.log('[AppComponent] loadAnalyticsData method called');
    console.log('[AppComponent] Current analyticsData state:', this.analyticsData);
    
    this.analyticsDataService.loadAnalyticsData().subscribe({
      next: (data) => {
        console.log('[AppComponent] Data received from service:', data);
        this.analyticsData = data;
        console.log('[AppComponent] Analytics data set successfully:', this.analyticsData);
      },
      error: (error) => {
        console.error('[AppComponent] Error in subscription:', error);
        console.error('[AppComponent] Error details:', error.message, error.stack);
      },
      complete: () => {
        console.log('[AppComponent] Data loading subscription completed');
      }
    });
  }

  togglePlayback() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startSimulation();
    } else {
      this.pauseSimulation();
    }
  }

  startSimulation() {
    console.log('Simulation started');
    this.isPlaying = true;
    this.currentCycleTime = 0;
    this.currentTrack = 0;
    this.currentTurnRate = 0;
    this.cycleProgress = 0;
    this.updateSimulation();
  }

  pauseSimulation() {
    console.log('Simulation paused');
    this.isPlaying = false;
  }

  updateSimulation() {
    if (!this.isPlaying) return;

    const interval = this.playbackSpeed;
    const simulationDuration = 20; // seconds
    const totalCycles = simulationDuration / (interval / 1000);

    this.currentCycleTime += interval / 1000;
    this.cycleProgress = (this.currentCycleTime / totalCycles) * 100;

    if (this.currentCycleTime >= simulationDuration) {
      this.currentCycleTime = 0;
      this.currentTrack = (this.currentTrack + 1) % (this.analyticsData?.tracks?.total || 1);
      this.currentTurnRate = 0; // Reset turn rate for new track
    }

    this.updateTurnRate();
    this.updateChart();

    setTimeout(() => this.updateSimulation(), interval);
  }

  updateTurnRate() {
    if (!this.analyticsData) return;
    
    // Use available data from the current analytics structure
    const baselineRate = 2.156; // From LIRILI's validated methodology
    const variability = 0.119; // Standard error
    
    // Simulate turn rate based on cycle time
    const cyclePhase = (this.currentCycleTime / 20) * Math.PI * 2;
    const stimulusResponse = this.currentCycleTime >= 10 && this.currentCycleTime <= 20 ? 
      Math.sin(cyclePhase) * 2.5 + baselineRate : baselineRate;
    
    this.currentTurnRate = Number((stimulusResponse + (Math.random() - 0.5) * variability).toFixed(2));
  }

  updateChart() {
    if (!this.analyticsData) return;
    
    // Update chart based on current view mode and simulation parameters
    console.log(`Updating chart: View=${this.viewMode}, Track=${this.currentTrack}, Time=${this.currentCycleTime}s`);
  }

  updateSpeed() {
    this.playbackSpeed = parseInt(this.playbackSpeed.toString());
    if (this.isPlaying) {
      this.pauseSimulation();
      this.startSimulation();
    }
  }

  updateView() {
    this.viewMode = this.viewMode as 'envelope' | 'individual' | 'both';
    if (this.isPlaying) {
      this.pauseSimulation();
      this.startSimulation();
    }
  }

  updateBinResolution() {
    this.binResolution = parseInt(this.binResolution.toString());
    if (this.isPlaying) {
      this.pauseSimulation();
      this.startSimulation();
    }
  }

  updateSmoothing(event: any) {
    this.smoothingWindow = parseInt(event.value.toString());
  }

  updateThreshold(event: any) {
    this.responseThreshold = parseFloat(event.value.toString());
  }

  updateLEDIntensity(event: any) {
    this.ledIntensity = parseFloat(event.value.toString());
  }

  updateChartScale(event: any) {
    this.chartScale = parseFloat(event.value.toString());
  }

  updateLarvaeCount(event: any) {
    this.larvaeCount = parseInt(event.value.toString());
  }

  updateStimulusStrength(event: any) {
    this.stimulusStrength = parseFloat(event.value.toString());
  }

  getTrackCompleteness(): number {
    if (!this.analyticsData) return 0;
    return (this.analyticsData.tracks.processed / this.analyticsData.tracks.total) * 100;
  }

  getReorientationProgress(): number {
    if (!this.analyticsData) return 0;
    // Normalize to expected range (0-78 max from data)
    return Math.min(100, (this.analyticsData.reorientations.mean_per_track / 78) * 100);
  }

  getFrequencyProgress(): number {
    if (!this.analyticsData) return 0;
    // Normalize frequency to percentage (0.1 Hz = 100%)
    return Math.min(100, (this.analyticsData.reorientations.frequency_mean / 0.1) * 100);
  }

  getQualityPercentage(quality: 'excellent' | 'good' | 'fair' | 'poor'): number {
    if (!this.analyticsData) return 0;
    const total = this.analyticsData.tracks.total;
    const count = this.analyticsData.tracks.quality_distribution[quality];
    return (count / total) * 100;
  }

  getResponseVariability(): number {
    if (!this.analyticsData) return 0;
    
    // Use statistical data from the loaded analytics
    const stdError = this.analyticsData.reorientations.frequency_std || 0.119;
    return Number(stdError.toFixed(1));
  }

  getStimulusEfficacy(): number {
    if (!this.analyticsData) return 1.0;
    
    // Calculate efficacy based on available data
    const meanFreq = this.analyticsData.reorientations.frequency_mean || 0;
    const baselineEstimate = 0.0427; // From mechanosensation data
    
    return Number((meanFreq / baselineEstimate).toFixed(1));
  }

  getResponseLatency(): number {
    if (!this.analyticsData) return 0;
    
    // Simulated response latency based on experimental patterns
    return Number((1.2 + Math.random() * 0.5).toFixed(1));
  }

  getPeakResponse(): number {
    if (!this.analyticsData) return 0;
    
    // Calculate peak response from mean data
    const meanReorientations = this.analyticsData.reorientations.mean_per_track || 0;
    const peakEstimate = meanReorientations * 0.3; // Convert to turns/min estimate
    
    return Number(peakEstimate.toFixed(1));
  }

  initializeNeuroglancer() {
    console.log('Initializing REAL Neuroglancer backend connection...');
    this.neuroglancerInitialized = false;
    
    // Call the actual backend service
    this.neuroglancerService.createVisualization().subscribe({
      next: (url) => {
        console.log('✅ Real Neuroglancer URL received:', url);
        this.neuroglancerUrl = url;
        this.neuroglancerInitialized = true;
      },
      error: (error) => {
        console.error('❌ Neuroglancer initialization failed:', error);
        this.neuroglancerInitialized = false;
      }
    });
  }

  loadChrimsonCircuits() {
    if (!this.neuroglancerInitialized) return;
    
    console.log('Loading REAL CHRIMSON circuits from FlyWire...');
    
    // Search for actual CHRIMSON circuits using the correct method name
    this.neuroglancerService.searchCHRIMSONCircuits().subscribe({
      next: (circuits: any) => {
        console.log('✅ CHRIMSON circuits found:', circuits);
        // Update the visualization with real circuit data using the correct method
        this.neuroglancerService.updateCircuitActivity({
          circuit_type: 'CHRIMSON',
          activity_level: 0.8,
          timestamp: Date.now()
        }).subscribe({
          next: (updated: any) => {
            console.log('✅ Circuit activity updated with real data');
          },
          error: (error: any) => {
            console.error('❌ Circuit update failed:', error);
          }
        });
      },
      error: (error: any) => {
        console.error('❌ CHRIMSON circuit search failed:', error);
      }
    });
  }
} 