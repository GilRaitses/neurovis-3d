import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { TrajectoryDataService } from '../services/trajectory-data.service';

declare var Chart: any;

@Component({
  selector: 'app-slide-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    FormsModule
  ],
  template: `
    <div class="analytics-dashboard" [class.mobile-dashboard]="isMobile" [class.landscape-dashboard]="isLandscape">
      
      <!-- Chart Visualization - Maximum Space -->
      <div class="chart-section">
        <div class="chart-header" [class.mobile-header]="isMobile" [class.landscape-header]="isLandscape">
          <h1 *ngIf="!isMobile || !isLandscape">Mechanosensation Dynamics</h1>
          <h1 *ngIf="isMobile && isLandscape" class="compact-title">Dynamics</h1>
          <div class="chart-legend" [class.mobile-legend]="isMobile" [class.landscape-legend]="isLandscape">
            <div class="legend-item led-stimulus">■ LED</div>
            <div class="legend-item upper-envelope">■ Upper</div>
            <div class="legend-item mean-response">■ Mean</div>
            <div class="legend-item lower-envelope">■ Lower</div>
          </div>
        </div>
        
        <div class="chart-container" [class.mobile-chart]="isMobile" [class.landscape-chart]="isLandscape">
          <canvas #envelopeChart id="envelopeChart"></canvas>
          
          <!-- Debug Info Overlay -->
          <div class="debug-overlay" *ngIf="showDebug">
            <div>Chart Loaded: {{chart ? 'Yes' : 'No'}}</div>
            <div>Data Ready: {{experimentalData?.envelope?.mean?.length || 0}} points</div>
            <div>Playing: {{isPlaying ? 'Yes' : 'No'}}</div>
            <div>Current Track: {{currentTrackDisplay}} / 53</div>
            <div>Animation Frame: {{animationFrame ? 'Active' : 'Inactive'}}</div>
          </div>
        </div>
      </div>

      <!-- Modern Integrated Console -->
      <div class="console-panel" [class.mobile-console]="isMobile" [class.landscape-console]="isLandscape">
        
        <!-- Debug Toggle -->
        <div class="debug-controls" *ngIf="!isMobile">
          <button class="debug-button" (click)="toggleDebug()">
            Debug: {{showDebug ? 'ON' : 'OFF'}}
          </button>
        </div>

        <!-- Scrub Slider -->
        <div class="scrub-section" [class.mobile-scrub]="isMobile">
          <label class="scrub-label">Track Selector:</label>
          <input 
            type="range" 
            class="scrub-slider"
            [min]="1" 
            [max]="53" 
            [step]="1"
            [(ngModel)]="currentTrackDisplay"
            (input)="onTrackScrub($event)"
            [disabled]="isPlaying">
          <span class="scrub-time">Track {{currentTrackDisplay}} / 53</span>
        </div>
        
        <!-- Main Control Console -->
        <div class="console-main">
          <!-- Play Control -->
          <div class="play-section">
            <button 
              class="play-button" 
              [class.playing]="isPlaying"
              [class.mobile-play]="isMobile"
              (click)="togglePlayback()">
              <mat-icon class="play-icon">{{isPlaying ? 'pause' : 'play_arrow'}}</mat-icon>
              <span class="play-text" *ngIf="!isMobile || !isLandscape">{{isPlaying ? 'PAUSE' : 'PLAY'}}</span>
            </button>
            
            <!-- Test Button -->
            <button class="test-button" (click)="testAnimation()" *ngIf="showDebug">
              Test Anim
            </button>
          </div>

          <!-- Integrated Stats Console -->
          <div class="stats-console" [class.mobile-stats-console]="isMobile" [class.landscape-stats-console]="isLandscape">
            <!-- Core Stats -->
            <div class="stat-group primary-stats">
              <div class="stat-display">
                <span class="stat-value">53</span>
                <span class="stat-label">tracks</span>
              </div>
              <div class="stat-display">
                <span class="stat-value">{{peakResponse.toFixed(1)}}</span>
                <span class="stat-label">peak</span>
              </div>
              <div class="stat-display">
                <span class="stat-value">{{stimulusEfficacy.toFixed(1)}}x</span>
                <span class="stat-label">efficacy</span>
              </div>
            </div>

            <!-- Live Stats (When Playing) -->
            <div class="stat-group live-stats" *ngIf="isPlaying">
              <div class="stat-display live-indicator">
                <span class="stat-value">{{currentTrackDisplay}}</span>
                <span class="stat-label">track</span>
              </div>
              <div class="stat-display live-indicator">
                <span class="stat-value">{{currentTurnRate.toFixed(2)}}</span>
                <span class="stat-label">rate</span>
              </div>
              <div class="stat-display live-indicator">
                <span class="stat-value">{{viewMode}}</span>
                <span class="stat-label">view</span>
              </div>
            </div>

            <!-- Secondary Stats (Desktop/Portrait only, when not playing) -->
            <div class="stat-group secondary-stats" *ngIf="(!isLandscape || !isMobile) && !isPlaying">
              <div class="stat-display">
                <span class="stat-value">{{responseLatency.toFixed(1)}}s</span>
                <span class="stat-label">latency</span>
              </div>
              <div class="stat-display">
                <span class="stat-value">0.043</span>
                <span class="stat-label">freq</span>
              </div>
              <div class="stat-display">
                <span class="stat-value">20s</span>
                <span class="stat-label">cycle</span>
              </div>
            </div>
          </div>

          <!-- Control Settings -->
          <div class="settings-console" [class.mobile-settings]="isMobile" *ngIf="!isLandscape || !isMobile">
            <div class="setting-item">
              <span class="setting-label">Speed</span>
              <select class="setting-select" [(ngModel)]="playbackSpeed" (change)="updateSpeed()">
                <option value="2000">Slow</option>
                <option value="1000">Normal</option>
                <option value="500">Fast</option>
              </select>
            </div>
            <div class="setting-item">
              <span class="setting-label">View</span>
              <select class="setting-select" [(ngModel)]="viewMode" (change)="updateView()">
                <option value="envelope">Envelope</option>
                <option value="individual">Individual</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Console Status Bar (Landscape Mobile) -->
        <div class="console-status" *ngIf="isMobile && isLandscape">
          <div class="status-item">
            <span class="status-label">Speed:</span>
            <span class="status-value">{{playbackSpeed === 500 ? 'Fast' : playbackSpeed === 2000 ? 'Slow' : 'Normal'}}</span>
          </div>
          <div class="status-item">
            <span class="status-label">View:</span>
            <span class="status-value">{{viewMode}}</span>
          </div>
        </div>
      </div>
      
    </div>
  `,
  styles: [`
    /* Modern Analytics Dashboard */
    .analytics-dashboard {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 120px);
      background: #000;
      color: #fff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      gap: 0;
      margin: 0;
      padding: 0;
    }

    /* Chart Section - Primary Focus */
    .chart-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px 10px;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 20, 147, 0.08) 50%,
        rgba(50, 205, 50, 0.06) 100%
      );
      border-radius: 12px 12px 0 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .chart-header h1 {
      font-size: 1.8em;
      font-weight: 300;
      margin: 0;
      background: linear-gradient(45deg, #ff1493, #32cd32);
      background-size: 200% 100%;
      animation: gradientShift 6s ease-in-out infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .chart-legend {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .legend-item {
      font-size: 0.9em;
      font-weight: 500;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-item.led-stimulus { color: rgba(255, 0, 0, 0.9); }
    .legend-item.upper-envelope { color: rgba(78, 205, 196, 0.7); }
    .legend-item.mean-response { color: rgba(78, 205, 196, 1); }
    .legend-item.lower-envelope { color: rgba(78, 205, 196, 0.5); }

    /* Chart Container - Maximum Space */
    .chart-container {
      flex: 1;
      margin: 0;
      padding: 20px;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.02) 0%,
        rgba(255, 20, 147, 0.05) 30%,
        rgba(50, 205, 50, 0.03) 70%,
        rgba(255, 255, 255, 0.02) 100%
      );
      border-radius: 0 0 12px 12px;
      position: relative;
      min-height: 400px;
    }

    .chart-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 20%, rgba(255, 20, 147, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(50, 205, 50, 0.08) 0%, transparent 50%);
      border-radius: 0 0 12px 12px;
      pointer-events: none;
    }

    /* Debug Overlay */
    .debug-overlay {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      padding: 10px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.8em;
      border: 1px solid #00ff00;
      z-index: 1000;
    }

    .debug-overlay div {
      margin-bottom: 4px;
    }

    /* Debug Controls */
    .debug-controls {
      margin-bottom: 10px;
    }

    .debug-button {
      background: rgba(0, 255, 0, 0.2);
      border: 1px solid #00ff00;
      color: #00ff00;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8em;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .debug-button:hover {
      background: rgba(0, 255, 0, 0.3);
    }

    /* Scrub Controls */
    .scrub-section {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.1);
      padding: 10px 15px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-bottom: 15px;
    }

    .scrub-label {
      font-size: 0.8em;
      color: #4ecdc4;
      font-weight: 600;
      white-space: nowrap;
    }

    .scrub-slider {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      outline: none;
      -webkit-appearance: none;
    }

    .scrub-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      background: linear-gradient(45deg, #ff1493, #32cd32);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(255, 20, 147, 0.4);
    }

    .scrub-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: linear-gradient(45deg, #ff1493, #32cd32);
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(255, 20, 147, 0.4);
    }

    .scrub-slider:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .scrub-time {
      font-size: 0.8em;
      color: #fff;
      font-weight: bold;
      min-width: 80px;
      text-align: right;
    }

    .mobile-scrub {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding: 8px 12px;
    }

    .mobile-scrub .scrub-label {
      text-align: center;
    }

    .mobile-scrub .scrub-time {
      text-align: center;
      min-width: unset;
    }

    /* Test Button */
    .test-button {
      background: rgba(255, 165, 0, 0.2);
      border: 1px solid #ffa500;
      color: #ffa500;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.7em;
      cursor: pointer;
      margin-left: 10px;
    }

    .test-button:hover {
      background: rgba(255, 165, 0, 0.3);
    }

    /* Console Panel - Modern Integrated */
    .console-panel {
      background: linear-gradient(
        90deg,
        rgba(44, 62, 80, 0.9) 0%,
        rgba(255, 20, 147, 0.1) 50%,
        rgba(44, 62, 80, 0.9) 100%
      );
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 15px 20px;
      border-radius: 0 0 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .console-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .play-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .play-button {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(45deg, #ff1493, #32cd32);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 0.9em;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 20, 147, 0.4);
    }

    .play-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 20, 147, 0.6);
    }

    .play-button.playing {
      background: linear-gradient(45deg, #32cd32, #ff1493);
      box-shadow: 0 4px 15px rgba(50, 205, 50, 0.4);
    }

    .play-icon {
      font-size: 1.5em;
    }

    .play-text {
      font-size: 0.9em;
    }

    .stats-console {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .stat-group {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .primary-stats {
      flex: 1;
      justify-content: space-around;
    }

    .stat-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      min-width: 60px;
      transition: transform 0.3s ease;
    }

    .stat-display:hover {
      transform: translateY(-2px);
      background: rgba(255, 255, 255, 0.15);
    }

    .stat-display .stat-value {
      font-size: 1.1em;
      font-weight: bold;
      color: #4ecdc4;
      margin-bottom: 2px;
    }

    .stat-display .stat-label {
      font-size: 0.7em;
      opacity: 0.9;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .secondary-stats {
      flex: 1;
      justify-content: space-around;
    }

    .live-stats {
      flex: 1;
      justify-content: space-around;
      animation: livePulse 2s ease-in-out infinite;
    }

    .live-indicator {
      background: rgba(255, 215, 0, 0.15) !important;
      border: 1px solid rgba(255, 215, 0, 0.3) !important;
      animation: liveGlow 1.5s ease-in-out infinite alternate;
    }

    .live-indicator .stat-value {
      color: #ffd700 !important;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
    }

    .live-indicator .stat-label {
      color: #ffd700 !important;
      text-transform: uppercase;
      font-weight: bold;
    }

    @keyframes livePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    @keyframes liveGlow {
      0% { 
        box-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
        background: rgba(255, 215, 0, 0.1);
      }
      100% { 
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
        background: rgba(255, 215, 0, 0.2);
      }
    }

    .settings-console {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .setting-item {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.1);
      padding: 8px 15px;
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .setting-label {
      font-size: 0.8em;
      color: #4ecdc4;
      font-weight: 600;
      white-space: nowrap;
    }

    .setting-select {
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 0.8em;
      min-width: 80px;
    }

    .console-status {
      display: flex;
      justify-content: space-around;
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 15px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-label {
      font-size: 0.8em;
      color: #4ecdc4;
      font-weight: 600;
    }

    .status-value {
      font-size: 0.9em;
      color: #fff;
      font-weight: bold;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .chart-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        padding: 15px 20px;
      }

      .chart-legend {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 768px) {
      .analytics-dashboard {
        height: calc(100vh - 160px);
      }

      .chart-header {
        padding: 10px 15px;
      }

      .chart-header h1 {
        font-size: 1.5em;
      }

      .chart-container {
        padding: 15px;
        min-height: 300px;
      }

      .console-panel {
        padding: 15px;
      }

      .console-main {
        flex-direction: column;
        align-items: stretch;
        gap: 15px;
      }

      .play-section {
        justify-content: center;
        width: 100%;
      }

      .stats-console {
        justify-content: center;
        gap: 10px;
      }

      .setting-item {
        flex: 1;
        justify-content: center;
      }

      .console-status {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        padding: 10px;
      }
    }

    @media (max-width: 480px) {
      .analytics-dashboard {
        height: calc(100vh - 180px);
      }

      .chart-header h1 {
        font-size: 1.3em;
      }

      .chart-container {
        padding: 10px;
        min-height: 250px;
      }

      .chart-legend {
        gap: 10px;
      }

      .legend-item {
        font-size: 0.8em;
      }

      .console-panel {
        padding: 10px;
      }

      .console-main {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }

      .play-section {
        width: 100%;
      }

      .stats-console {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        width: 100%;
      }

      .stat-group {
        gap: 8px;
      }

      .primary-stats {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .secondary-stats {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }

      .setting-item {
        flex: 1;
        justify-content: center;
      }

      .setting-select {
        font-size: 0.7em;
        padding: 4px 6px;
        min-width: 60px;
      }

      .console-status {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        width: 100%;
      }

      .status-item {
        flex-direction: column;
        align-items: center;
      }

      .status-label {
        font-size: 0.7em;
      }

      .status-value {
        font-size: 0.8em;
      }
    }

    /* Mobile Optimizations */
    .mobile-dashboard {
      height: calc(100vh - 120px);
    }

    .mobile-dashboard.landscape-dashboard {
      height: calc(100vh - 100px);
    }

    .mobile-header {
      flex-direction: column;
      align-items: center;
      padding: 8px 12px;
      gap: 8px;
    }

    .compact-title {
      font-size: 1.1em !important;
    }

    .mobile-legend {
      gap: 8px;
      justify-content: center;
      width: 100%;
    }

    .mobile-legend .legend-item {
      font-size: 0.7em;
    }

    .mobile-chart {
      padding: 8px;
      min-height: 200px;
    }

    .landscape-chart {
      min-height: 150px;
    }

    /* Landscape Header Optimization */
    .landscape-header {
      padding: 2px 8px;
    }

    .landscape-legend {
      gap: 6px;
      font-size: 0.6em;
    }

    /* Mobile Console Optimizations */
    .mobile-console {
      padding: 6px 8px;
      gap: 8px;
    }

    .mobile-console .console-main {
      flex-direction: column;
      gap: 8px;
    }

    .mobile-console .play-section {
      justify-content: center;
      margin-bottom: 8px;
    }

    .mobile-console .stats-console {
      flex-direction: column;
      gap: 8px;
    }

    .mobile-console .stat-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
    }

    .mobile-console .stat-display {
      padding: 6px 8px;
      min-width: unset;
    }

    .mobile-console .stat-display .stat-value {
      font-size: 1em;
    }

    .mobile-console .stat-display .stat-label {
      font-size: 0.6em;
    }

    .mobile-console .settings-console {
      flex-direction: column;
      gap: 6px;
    }

    .mobile-console .setting-item {
      padding: 6px 8px;
      justify-content: space-between;
    }

    /* Landscape Console Optimizations */
    .landscape-console {
      padding: 3px 6px;
      gap: 6px;
    }

    .landscape-console .console-main {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
    }

    .landscape-console .play-section {
      margin-right: 10px;
    }

    .landscape-console .stats-console {
      flex: 1;
      justify-content: center;
      gap: 8px;
    }

    .landscape-console .stat-group {
      gap: 8px;
    }

    .landscape-console .stat-display {
      padding: 4px 6px;
      min-width: 50px;
    }

    .landscape-console .stat-display .stat-value {
      font-size: 0.9em;
    }

    .landscape-console .stat-display .stat-label {
      font-size: 0.5em;
    }

    .landscape-console .console-status {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      padding: 4px 8px;
      margin-top: 6px;
    }

    .landscape-console .status-item {
      flex-direction: row;
      gap: 4px;
    }

    .landscape-console .status-label {
      font-size: 0.6em;
    }

    .landscape-console .status-value {
      font-size: 0.7em;
    }

    /* Touch-friendly adjustments */
    @media (pointer: coarse) {
      .play-button,
      .setting-select {
        min-height: 44px;
      }

      .mobile-play {
        min-height: 40px;
      }

      .mobile-control select {
        min-height: 36px;
      }
    }

    /* Orientation-specific optimizations */
    @media (orientation: landscape) and (max-height: 500px) {
      .mobile-dashboard.landscape-dashboard {
        height: calc(100vh - 80px);
      }

      .mobile-header {
        padding: 4px 8px;
      }

      .compact-title {
        font-size: 1em !important;
      }

      .landscape-chart {
        min-height: 120px;
        padding: 6px;
      }

      .landscape-console {
        padding: 4px 8px;
      }

      .mobile-control {
        padding: 4px 6px;
      }

      .mobile-stat {
        padding: 4px 6px;
      }
    }
  `]
})
export class SlideViewerComponent implements OnInit, OnDestroy {
  @ViewChild('envelopeChart', { static: true }) chartCanvas!: ElementRef;

  // Visualization state
  isPlaying = false;
  cycleTime = 0;
  currentTrack = 0;
  currentTurnRate = 0;

  // Controls
  playbackSpeed = 1000;
  viewMode = 'both';
  binResolution = 40;

  // Statistics
  peakResponse = 6.2;
  stimulusEfficacy = 2.8;
  responseLatency = 1.4;

  // Chart and experimental data
  chart: any;
  experimentalData: any = {}; // Real experimental data, not simulated
  trajectoryData: any = {}; // Real trajectory coordinates from HDF5
  animationFrame: any;
  
  // Trajectory visualization
  trajectoryTracks: any[] = [];
  selectedTracks: Set<number> = new Set();
  isTrajectoryPlaying = false;
  trajectoryTime = 0;
  maxTrajectoryTime = 20; // 20 seconds
  animationSpeed = 1.0;
  showTrajectoryPaths = true;
  showReorientations = true;

  // Mobile/Landscape properties
  @Input() isMobile: boolean = false;
  @Input() isLandscape: boolean = false;

  showDebug = false;
  currentTrackDisplay = 1;

  constructor(private trajectoryDataService: TrajectoryDataService) {}

  ngOnInit() {
    this.loadChartLibrary().then(() => {
      this.loadExperimentalData();
      this.currentTrackDisplay = this.currentTrack + 1;
    });
  }

  loadExperimentalData() {
    console.log('Loading real experimental data...');
    
    // Load the real experimental data
    fetch('./assets/data/mechanosensation_experimental_data.json')
      .then(response => response.json())
      .then(data => {
        console.log('Experimental data loaded:', data.metadata);
        this.convertExperimentalData(data);
        this.loadTrajectoryData(); // Load trajectory coordinates
        this.initChart();
        console.log('Chart initialized with real data');
      })
      .catch(error => {
        console.error('Error loading experimental data:', error);
        // No fallback - require real data
        throw new Error('Real experimental data is required');
      });
  }

  async loadTrajectoryData() {
    console.log('Loading trajectory coordinate data...');
    
    try {
      this.trajectoryData = await this.trajectoryDataService.loadTrajectoryData();
      this.trajectoryTracks = this.trajectoryData.tracks;
      console.log('🎯 Trajectory data loaded:', this.trajectoryData.metadata);
      console.log('📊 Available tracks:', this.trajectoryTracks.length);
      
      // Initialize trajectory visualization
      this.initializeTrajectoryBox();
      
    } catch (error) {
      console.error('Error loading trajectory data:', error);
      // Create minimal placeholder structure
      this.trajectoryData = {
        tracks: [],
        metadata: {
          total_tracks: 53,
          coordinate_types: ['x_coordinates', 'y_coordinates', 'time_points']
        }
      };
      this.trajectoryTracks = [];
    }
  }

  initializeTrajectoryBox() {
    console.log('🎮 Initializing trajectory visualization');
    
    // Create or update trajectory canvas
    const trajectoryContainer = document.querySelector('.trajectory-container');
    if (!trajectoryContainer) {
      console.warn('Trajectory container not found');
      return;
    }

    // Clear existing canvas
    let canvas = trajectoryContainer.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      canvas.style.border = '2px solid #ddd';
      canvas.style.borderRadius = '8px';
      canvas.style.background = '#f8f9fa';
      trajectoryContainer.appendChild(canvas);
    }

    this.drawTrajectoryFrame();
  }

  drawTrajectoryFrame() {
    const canvas = document.querySelector('.trajectory-container canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trajectory bounds
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    this.drawGrid(ctx, canvas.width, canvas.height);

    // Draw tracks
    this.drawTracks(ctx);

    // Draw time indicator
    this.drawTimeIndicator(ctx, canvas.width);
  }

  drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical lines
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  drawTracks(ctx: CanvasRenderingContext2D) {
    if (!this.trajectoryTracks || this.trajectoryTracks.length === 0) return;

    this.trajectoryTracks.forEach((track, index) => {
      const isSelected = this.selectedTracks.has(track.track_id);
      const trackColor = this.getTrackColor(track.track_id);
      
      // Draw trajectory path if enabled
      if (this.showTrajectoryPaths) {
        this.drawTrajectoryPath(ctx, track, trackColor, isSelected);
      }

      // Draw current position
      this.drawCurrentPosition(ctx, track, trackColor, isSelected);

      // Draw reorientations if enabled
      if (this.showReorientations && track.reorientation_times) {
        this.drawReorientations(ctx, track, trackColor);
      }
    });
  }

  drawTrajectoryPath(ctx: CanvasRenderingContext2D, track: any, color: string, isSelected: boolean) {
    if (track.x_coordinates.length < 2) return;

    ctx.strokeStyle = isSelected ? color : color + '80'; // Add transparency if not selected
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [3, 3]);

    ctx.beginPath();
    ctx.moveTo(track.x_coordinates[0], track.y_coordinates[0]);

    for (let i = 1; i < track.x_coordinates.length; i++) {
      ctx.lineTo(track.x_coordinates[i], track.y_coordinates[i]);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawCurrentPosition(ctx: CanvasRenderingContext2D, track: any, color: string, isSelected: boolean) {
    const coord = this.trajectoryDataService.getTrackCoordinatesAtTime(track.track_id, this.trajectoryTime);
    if (!coord) return;

    // Draw larva body (ellipse)
    ctx.fillStyle = color;
    ctx.strokeStyle = isSelected ? '#000' : color;
    ctx.lineWidth = isSelected ? 2 : 1;

    ctx.beginPath();
    ctx.ellipse(coord.x, coord.y, 8, 4, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw track ID if selected
    if (isSelected) {
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`T${track.track_id}`, coord.x, coord.y - 15);
    }
  }

  drawReorientations(ctx: CanvasRenderingContext2D, track: any, color: string) {
    if (!track.reorientation_times) return;

    track.reorientation_times.forEach((time: number) => {
      if (Math.abs(time - this.trajectoryTime) < 0.5) { // Show reorientations within 0.5s
        const coord = this.trajectoryDataService.getTrackCoordinatesAtTime(track.track_id, time);
        if (coord) {
          ctx.strokeStyle = '#ff6b6b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(coord.x, coord.y, 12, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    });
  }

  drawTimeIndicator(ctx: CanvasRenderingContext2D, width: number) {
    const progress = this.trajectoryTime / this.maxTrajectoryTime;
    
    // Draw time bar
    ctx.fillStyle = '#007bff';
    ctx.fillRect(10, 10, width * progress * 0.3, 6);
    
    // Draw time text
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${this.trajectoryTime.toFixed(1)}s`, 10, 35);
    
    // Draw selected track count
    ctx.fillText(`Selected: ${this.selectedTracks.size} tracks`, 10, 55);
  }

  getTrackColor(trackId: number): string {
    const colors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1',
      '#e83e8c', '#fd7e14', '#20c997', '#6c757d', '#343a40'
    ];
    return colors[trackId % colors.length];
  }

  // Simulation controls
  togglePlayback() {
    console.log('Toggle playback clicked. Current state:', this.isPlaying);
    
    if (this.isPlaying) {
      console.log('Stopping simulation...');
      this.stopAnimation();
    } else {
      console.log('Starting simulation...');
      console.log('Chart exists:', !!this.chart);
      console.log('Data ready:', this.experimentalData?.envelope?.mean?.length);
      console.log('Playback speed:', this.playbackSpeed);
      this.startAnimation();
    }
    
    console.log('New state:', this.isPlaying);
  }

  startAnimation() {
    console.log('🎮 Starting unified simulation - Chart + Trajectory');
    this.isPlaying = true;
    this.isTrajectoryPlaying = true;
    this.currentTrack = 0;
    this.currentTrackDisplay = 1;
    this.trajectoryTime = 0;
    
    // Clear any existing animation
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
    }
    
    // Start unified animation loop
    this.animationFrame = setInterval(() => {
      this.updateUnifiedSimulation();
    }, this.playbackSpeed);
    
    console.log('🚀 Unified animation started');
  }

  stopAnimation() {
    console.log('⏹️ Stopping unified simulation');
    this.isPlaying = false;
    this.isTrajectoryPlaying = false;
    
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
      this.animationFrame = null;
    }
  }

  updateUnifiedSimulation() {
    if (!this.isPlaying) return;

    // Step to next track
    this.currentTrack = (this.currentTrack + 1) % 53;
    this.currentTrackDisplay = this.currentTrack + 1;
    
    // Update simulation time for trajectory animation
    this.trajectoryTime += 0.2; // Increment time
    if (this.trajectoryTime >= this.maxTrajectoryTime) {
      this.trajectoryTime = 0;
    }

    // Update chart with current track and envelope
    this.updateChartWithTrackAndEnvelope();
    
    // Update trajectory visualization
    this.drawTrajectoryFrame();

    // Update turn rate based on current track's data
    if (this.experimentalData.tracks[this.currentTrack]) {
      const trackData = this.experimentalData.tracks[this.currentTrack];
      this.currentTurnRate = trackData.reduce((sum: number, val: number) => sum + val, 0) / trackData.length;
    }

    if (this.showDebug && this.currentTrack % 10 === 0) {
      console.log(`🔄 Track ${this.currentTrack + 1}/53 - Time: ${this.trajectoryTime.toFixed(1)}s`);
    }
  }

  updateChartWithTrackAndEnvelope() {
    if (!this.chart || !this.experimentalData.tracks[this.currentTrack]) return;

    const currentTrackData = this.experimentalData.tracks[this.currentTrack];
    
    // Always show envelope models + current track overlay
    this.chart.data.datasets = [
      // LED Stimulus
      {
        label: 'LED Stimulus',
        data: this.experimentalData.envelope.squareWave.map((val: number) => val * 15),
        borderColor: 'rgba(255, 0, 0, 0.9)',
        backgroundColor: 'rgba(255, 0, 0, 0.15)',
        borderWidth: 3,
        fill: false,
        stepped: true,
        yAxisID: 'y1',
        pointRadius: 0
      },
      // Upper Envelope
      {
        label: 'Upper Envelope',
        data: this.experimentalData.envelope.upper,
        borderColor: 'rgba(78, 205, 196, 0.4)',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        fill: '+1',
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 0,
        borderWidth: 1
      },
      // Mean Response (Population Envelope)
      {
        label: 'Population Mean',
        data: this.experimentalData.envelope.mean,
        borderColor: 'rgba(78, 205, 196, 1)',
        backgroundColor: 'rgba(78, 205, 196, 0.2)',
        borderWidth: 3,
        fill: '+1',
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 0
      },
      // Lower Envelope
      {
        label: 'Lower Envelope',
        data: this.experimentalData.envelope.lower,
        borderColor: 'rgba(78, 205, 196, 0.4)',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 0,
        borderWidth: 1
      },
      // Current Individual Track (Highlighted)
      {
        label: `Track ${this.currentTrack + 1}`,
        data: currentTrackData,
        borderColor: 'rgba(255, 215, 0, 1)',
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        borderWidth: 4,
        fill: false,
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(255, 215, 0, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
        pointBorderWidth: 2
      }
    ];

    // Update chart with smooth animation
    this.chart.update('none'); // No animation for smooth real-time updates
  }

  // Remove old duplicate methods and update other controls
  updateSpeed() {
    if (this.isPlaying) {
      this.stopAnimation();
      this.startAnimation();
    }
  }

  updateView() {
    this.updateChartWithTrackAndEnvelope();
  }

  updateBinResolution() {
    // Only regenerate chart with real data, no simulation
    this.initChart();
    if (this.isPlaying) {
      this.stopAnimation();
      this.startAnimation();
    }
  }

  toggleDebug() {
    this.showDebug = !this.showDebug;
    if (this.showDebug) {
      console.log('Debug mode ON');
    } else {
      console.log('Debug mode OFF');
    }
  }

  onTrackScrub(event: any) {
    const newTrack = parseInt(event.target.value) - 1;
    console.log('🎯 Scrubbing to track:', newTrack + 1);
    
    const wasPlaying = this.isPlaying;
    if (this.isPlaying) {
      this.stopAnimation();
    }
    
    this.currentTrack = newTrack;
    this.currentTrackDisplay = newTrack + 1;
    
    // Update display immediately
    if (this.experimentalData.tracks[this.currentTrack]) {
      const trackData = this.experimentalData.tracks[this.currentTrack];
      this.currentTurnRate = trackData.reduce((sum: number, val: number) => sum + val, 0) / trackData.length;
    }
    
    // Update both chart and simulation
    this.updateChartWithTrackAndEnvelope();
    this.drawTrajectoryFrame();
    
    if (wasPlaying) {
      this.startAnimation();
    }
  }

  testAnimation() {
    console.log('=== TESTING UNIFIED ANIMATION ===');
    console.log('Chart exists:', !!this.chart);
    console.log('Trajectory tracks:', this.trajectoryTracks.length);
    console.log('Data points:', this.experimentalData?.envelope?.mean?.length);
    console.log('Playback speed:', this.playbackSpeed);
    
    this.stopAnimation();
    this.currentTrack = 0;
    this.trajectoryTime = 0;
    
    console.log('🧪 Testing manual update...');
    this.updateUnifiedSimulation();
    
    console.log('🚀 Starting test animation...');
    this.startAnimation();
  }

  // Track interaction methods
  onTrackClick(event: MouseEvent) {
    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked track
    const clickedTrack = this.findTrackAtPosition(x, y);
    
    if (clickedTrack) {
      if (this.selectedTracks.has(clickedTrack.track_id)) {
        this.selectedTracks.delete(clickedTrack.track_id);
      } else {
        this.selectedTracks.add(clickedTrack.track_id);
      }
      
      this.drawTrajectoryFrame();
      console.log('🎯 Selected tracks:', Array.from(this.selectedTracks));
    }
  }

  findTrackAtPosition(x: number, y: number): any {
    for (const track of this.trajectoryTracks) {
      const coord = this.trajectoryDataService.getTrackCoordinatesAtTime(track.track_id, this.trajectoryTime);
      if (coord) {
        const distance = Math.sqrt((x - coord.x) ** 2 + (y - coord.y) ** 2);
        if (distance <= 12) { // Click tolerance
          return track;
        }
      }
    }
    return null;
  }

  selectAllTracks() {
    this.selectedTracks.clear();
    this.trajectoryTracks.forEach(track => {
      this.selectedTracks.add(track.track_id);
    });
    this.drawTrajectoryFrame();
  }

  clearSelection() {
    this.selectedTracks.clear();
    this.drawTrajectoryFrame();
  }

  convertExperimentalData(expData: any) {
    console.log('Converting experimental data to chart format...');
    
    // Initialize the data structure
    this.experimentalData = {
      envelope: {
        mean: [],
        upper: [],
        lower: [],
        squareWave: []
      },
      tracks: []
    };

    // Get experiment data
    const experiment = expData.experiments.Experiment_1;
    const trackKeys = Object.keys(experiment.tracks);
    
    console.log(`Found ${trackKeys.length} tracks in experimental data`);

    // Process each track
    trackKeys.forEach((trackKey: string, trackIndex: number) => {
      const trackData = experiment.tracks[trackKey];
      const trackArray: number[] = [];
      
      // Extract mean values for this track
      trackData.bins.forEach((bin: any) => {
        trackArray.push(bin.mean);
        
        // For the first track, also populate LED data (only LED1)
        if (trackIndex === 0) {
          this.experimentalData.envelope.squareWave.push(bin.led1);
        }
      });
      
      this.experimentalData.tracks.push(trackArray);
    });

    // Calculate envelope statistics from all tracks
    for (let binIndex = 0; binIndex < 40; binIndex++) {
      const binValues: number[] = this.experimentalData.tracks.map((track: number[]) => track[binIndex] || 0);
      
      const mean = binValues.reduce((sum: number, val: number) => sum + val, 0) / binValues.length;
      const sortedValues = binValues.sort((a: number, b: number) => a - b);
      const q75Index = Math.floor(sortedValues.length * 0.75);
      const q25Index = Math.floor(sortedValues.length * 0.25);
      
      this.experimentalData.envelope.mean.push(mean);
      this.experimentalData.envelope.upper.push(sortedValues[q75Index] || mean + 1.5);
      this.experimentalData.envelope.lower.push(sortedValues[q25Index] || Math.max(0.1, mean - 1.0));
    }

    // Update statistics from real data
    const firstTrack = experiment.tracks.track_1;
    if (firstTrack && firstTrack.bins.length > 0) {
      // Calculate real statistics
      const stimulusBins = firstTrack.bins.filter((bin: any) => bin.led1 === 1);
      const baselineBins = firstTrack.bins.filter((bin: any) => bin.led1 === 0);
      
      if (stimulusBins.length > 0 && baselineBins.length > 0) {
        const maxStimulus = Math.max(...stimulusBins.map((bin: any) => bin.mean));
        const avgBaseline = baselineBins.reduce((sum: number, bin: any) => sum + bin.mean, 0) / baselineBins.length;
        
        this.peakResponse = maxStimulus;
        this.stimulusEfficacy = maxStimulus / avgBaseline;
        
        console.log(`Real data stats - Peak: ${this.peakResponse.toFixed(1)}, Efficacy: ${this.stimulusEfficacy.toFixed(1)}x`);
      }
    }

    console.log('Experimental data conversion complete');
  }

  ngOnDestroy() {
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private loadChartLibrary(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof Chart !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  initChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    const labels = Array.from({length: this.binResolution}, (_, i) => 
      ((i / this.binResolution) * 20).toFixed(1)
    );

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'LED Stimulus',
            data: this.experimentalData.envelope.squareWave.map((val: number) => val * 15),
            borderColor: 'rgba(255, 0, 0, 0.8)',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderWidth: 3,
            fill: false,
            stepped: true,
            yAxisID: 'y1'
          },
          {
            label: 'Upper Envelope',
            data: this.experimentalData.envelope.upper,
            borderColor: 'rgba(78, 205, 196, 0.3)',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            fill: '+1',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Mean Response',
            data: this.experimentalData.envelope.mean,
            borderColor: 'rgba(78, 205, 196, 1)',
            backgroundColor: 'rgba(78, 205, 196, 0.2)',
            borderWidth: 3,
            fill: '+1',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Lower Envelope',
            data: this.experimentalData.envelope.lower,
            borderColor: 'rgba(78, 205, 196, 0.3)',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // We have our own legend
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time in Cycle (seconds)',
              color: 'white'
            },
            ticks: { color: 'white' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Turn Rate (min⁻¹)',
              color: 'white'
            },
            ticks: { color: 'white' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'LED Stimulus',
              color: 'rgba(255, 0, 0, 0.8)'
            },
            ticks: {
              color: 'rgba(255, 0, 0, 0.8)',
              stepSize: 5,
              max: 20
            },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }
} 