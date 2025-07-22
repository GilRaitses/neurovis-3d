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
import { BehavioralArenaComponent } from './components/behavioral-arena.component';
import { TrackIdManagerComponent } from './components/track-id-manager.component';
import { AnalyticsDataService, AnalyticsData } from './services/analytics-data.service';

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
    BehavioralArenaComponent,
    TrackIdManagerComponent
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
            
            <!-- Analytics Summary -->
            <div *ngIf="selectedTab === 0" class="content-panel" data-cy="analytics-summary">
              <div class="panel-header">
                <h1>Analytics</h1>
                <p class="panel-subtitle" data-cy="experiment-date">Mechanosensation analysis pipeline results from {{(analyticsData?.experiment?.date) || 'July 11, 2025'}}</p>
              </div>
              
              <div class="stats-grid" *ngIf="analyticsData" data-cy="analytics-data-loaded">
                <mat-card class="stat-card primary">
                  <mat-card-content>
                    <div class="stat-header">
                      <mat-icon>timeline</mat-icon>
                      <span>Total Tracks</span>
                    </div>
                    <div class="stat-value" data-cy="total-tracks">{{analyticsData.tracks.total}}</div>
                    <div class="stat-subtitle">Processed: {{analyticsData.tracks.processed}}</div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="stat-card accent">
                  <mat-card-content>
                    <div class="stat-header">
                      <mat-icon>rotate_right</mat-icon>
                      <span>Reorientations</span>
                    </div>
                    <div class="stat-value" data-cy="total-reorientations">{{analyticsData.reorientations.total}}</div>
                    <div class="stat-subtitle" data-cy="mean-reorientations">Mean: {{analyticsData.reorientations.mean_per_track | number:'1.1-1'}}</div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="stat-card warn">
                  <mat-card-content>
                    <div class="stat-header">
                      <mat-icon>access_time</mat-icon>
                      <span>Duration</span>
                    </div>
                    <div class="stat-value">{{analyticsData.temporal.mean_duration | number:'1.0-0'}}s</div>
                    <div class="stat-subtitle">Average per track</div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="stat-card success">
                  <mat-card-content>
                    <div class="stat-header">
                      <mat-icon>speed</mat-icon>
                      <span>Frequency</span>
                    </div>
                    <div class="stat-value">{{analyticsData.reorientations.frequency_mean | number:'1.3-3'}} Hz</div>
                    <div class="stat-subtitle">Mean reorientation rate</div>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Data Quality Metrics -->
              <div class="metrics-section" *ngIf="analyticsData" data-cy="metrics-section">
                <h2>Data Quality Metrics</h2>
                
                <div class="quality-metrics">
                  <mat-card class="metric-card">
                    <mat-card-content>
                      <div class="metric-header">
                        <span>Track Completeness</span>
                        <span class="metric-value">{{getTrackCompleteness() | number:'1.1-1'}}%</span>
                      </div>
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="getTrackCompleteness()" 
                        color="primary"
                        data-cy="track-completeness-bar">
                      </mat-progress-bar>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="metric-card">
                    <mat-card-content>
                      <div class="metric-header">
                        <span>Reorientation Rate</span>
                        <span class="metric-value">{{getReorientationProgress() | number:'1.1-1'}}%</span>
                      </div>
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="getReorientationProgress()" 
                        color="accent"
                        data-cy="reorientation-progress-bar">
                      </mat-progress-bar>
                    </mat-card-content>
                  </mat-card>

                  <mat-card class="metric-card">
                    <mat-card-content>
                      <div class="metric-header">
                        <span>Frequency Quality</span>
                        <span class="metric-value">{{getFrequencyProgress() | number:'1.1-1'}}%</span>
                      </div>
                      <mat-progress-bar 
                        mode="determinate" 
                        [value]="getFrequencyProgress()" 
                        color="warn"
                        data-cy="frequency-progress-bar">
                      </mat-progress-bar>
                    </mat-card-content>
                  </mat-card>
                </div>

                <!-- Quality Distribution -->
                <div class="quality-distribution" data-cy="quality-breakdown">
                  <h3>Track Quality Distribution</h3>
                  <div class="quality-chips">
                    <mat-chip-set>
                      <mat-chip color="accent" data-cy="quality-excellent">
                        Excellent: {{analyticsData.tracks.quality_distribution.excellent}} 
                        ({{getQualityPercentage('excellent') | number:'1.0-0'}}%)
                      </mat-chip>
                      <mat-chip color="primary" data-cy="quality-good">
                        Good: {{analyticsData.tracks.quality_distribution.good}}
                        ({{getQualityPercentage('good') | number:'1.0-0'}}%)
                      </mat-chip>
                      <mat-chip color="warn" data-cy="quality-fair">
                        Fair: {{analyticsData.tracks.quality_distribution.fair}}
                        ({{getQualityPercentage('fair') | number:'1.0-0'}}%)
                      </mat-chip>
                      <mat-chip color="accent" data-cy="quality-poor">
                        Poor: {{analyticsData.tracks.quality_distribution.poor}}
                        ({{getQualityPercentage('poor') | number:'1.0-0'}}%)
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </div>

                <!-- Pipeline Information -->
                <div class="pipeline-info" data-cy="pipeline-info">
                  <h3>Pipeline Execution Details</h3>
                  <div class="pipeline-details">
                    <div class="detail-item">
                      <span class="label">Experiment ID:</span>
                      <span class="value" data-cy="experiment-id">{{analyticsData.experiment.id}}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Pipeline Version:</span>
                      <span class="value" data-cy="pipeline-version">{{analyticsData.experiment.pipeline_version}}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Status:</span>
                      <span class="value status-complete" data-cy="pipeline-status">{{analyticsData.experiment.status}}</span>
                    </div>
                    <div class="detail-item" data-cy="methodology-info">
                      <span class="label">Methodology:</span>
                      <span class="value" data-cy="methodology">{{analyticsData.temporal.methodology}}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Loading state -->
              <div class="loading-state" *ngIf="!analyticsData" data-cy="loading-state">
                <mat-card>
                  <mat-card-content>
                    <div class="loading-content">
                      <mat-icon>hourglass_empty</mat-icon>
                      <span>Loading mechanosensation analytics data...</span>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
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
                <p class="panel-subtitle">Connectome integration and circuit modeling</p>
              </div>
              
              <mat-card class="coming-soon-card" data-cy="neuroglancer-integration">
                <mat-card-content>
                  <mat-icon class="large-icon">device_hub</mat-icon>
                  <h2>Neuroglancer Integration</h2>
                  <p>Advanced connectome visualization and circuit analysis tools are being integrated.</p>
                  <button mat-raised-button color="primary">
                    <mat-icon>notifications</mat-icon>
                    Notify When Ready
                  </button>
                </mat-card-content>
              </mat-card>
            </div>

          </mat-sidenav-content>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
    }

    .main-toolbar {
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
      background: linear-gradient(90deg, #1a237e 0%, #3949ab 100%) !important;
    }

    .toolbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: none;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .platform-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #fff;
    }

    .platform-title {
      font-size: 24px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.5px;
    }

    .beta-chip {
      background: rgba(255,255,255,0.2) !important;
      color: #fff !important;
      font-size: 12px;
      height: 24px;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .dashboard-container {
      height: calc(100vh - 64px);
      background: #f8fafc;
    }

    .sidenav-container {
      height: 100%;
    }

    .navigation-sidenav {
      width: 280px;
      background: #fff;
      box-shadow: 2px 0 20px rgba(0,0,0,0.05);
      border-right: none;
    }

    .nav-header {
      padding: 24px 20px 16px;
      border-bottom: 1px solid #e0e7ff;
    }

    .nav-header h3 {
      margin: 0;
      color: #1e293b;
      font-weight: 600;
      font-size: 16px;
    }

    .mat-mdc-list-item {
      margin: 4px 12px;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .mat-mdc-list-item:hover {
      background: #f1f5f9 !important;
    }

    .mat-mdc-list-item.active {
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%) !important;
      color: #1e293b;
    }

    .mat-mdc-list-item.active .mat-icon {
      color: #3949ab;
    }

    .nav-status {
      padding: 20px;
      margin-top: auto;
    }

    .nav-status h4 {
      margin: 0 0 16px 0;
      color: #64748b;
      font-size: 14px;
      font-weight: 600;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #64748b;
    }

    .status-icon.online {
      color: #10b981;
      font-size: 8px;
    }

    .status-icon.processing {
      color: #f59e0b;
      font-size: 8px;
    }

    .main-content {
      background: #f8fafc;
      overflow-y: auto;
    }

    .content-panel {
      padding: 32px 40px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .panel-header {
      margin-bottom: 32px;
    }

    .panel-header h1 {
      margin: 0 0 8px 0;
      color: #1e293b;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .panel-subtitle {
      margin: 0;
      color: #64748b;
      font-size: 18px;
      line-height: 1.6;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    .stat-card {
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
      overflow: hidden;
      position: relative;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .stat-card.excellent {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-left: 4px solid #3b82f6;
    }

    .stat-card.good {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-left: 4px solid #10b981;
    }

    .stat-card.premium {
      background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
      border-left: 4px solid #f59e0b;
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .stat-header mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #374151;
    }

    .stat-label {
      font-weight: 600;
      color: #1f2937;
      font-size: 16px;
    }

    .stat-number {
      font-size: 36px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 8px;
      line-height: 1;
    }

    .stat-description {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .mat-mdc-progress-bar {
      border-radius: 4px;
      height: 6px;
    }

    .metrics-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .metrics-card, .quality-distribution-card {
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .metric-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .metric-label {
      min-width: 140px;
      font-weight: 500;
      color: #374151;
    }

    .metric-value {
      min-width: 60px;
      font-weight: 600;
      color: #1f2937;
    }

    .quality-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .quality-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      background: #f8fafc;
    }

    .quality-item.excellent {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    }

    .quality-item.good {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    }

    .quality-item.fair {
      background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
    }

    .quality-item.poor {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    }

    .quality-count {
      font-size: 24px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 4px;
    }

    .quality-label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .poor-progress .mdc-linear-progress__bar-inner {
      background: #ef4444;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #64748b;
    }

    .loading-content mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .coming-soon-card {
      text-align: center;
      padding: 60px 40px;
      border-radius: 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .large-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #64748b;
      margin-bottom: 24px;
    }

    .coming-soon-card h2 {
      margin: 0 0 16px 0;
      color: #1e293b;
      font-size: 28px;
      font-weight: 600;
    }

    .coming-soon-card p {
      color: #64748b;
      font-size: 16px;
      margin-bottom: 32px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .navigation-sidenav {
        width: 100%;
      }
      
      .content-panel {
        padding: 20px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .metrics-section {
        grid-template-columns: 1fr;
      }
      
      .panel-header h1 {
        font-size: 28px;
      }
      
      .panel-subtitle {
        font-size: 16px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .app-container {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      }
      
      .main-content {
        background: #0f172a;
      }
      
      .navigation-sidenav {
        background: #1e293b;
        color: #e2e8f0;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'NeuroCircuit.Science';
  selectedTab = 0;
  analyticsData: AnalyticsData | null = null;

  constructor(private analyticsDataService: AnalyticsDataService) {}

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
} 