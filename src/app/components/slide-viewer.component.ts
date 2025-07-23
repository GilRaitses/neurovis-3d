import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

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
    <!-- Main Content -->
    <div class="mechanosensation-container">
      <!-- Minimal Header -->
      <div class="header">
        <h1>Mechanosensation Dynamics</h1>
      </div>

      <!-- Chart Display - Compact Size -->
      <div class="chart-container">
        <div class="chart-legend">
          <div class="legend-item led-stimulus">■ LED Stimulus</div>
          <div class="legend-item upper-envelope">■ Upper Envelope</div>
          <div class="legend-item mean-response">■ Mean Response</div>
          <div class="legend-item lower-envelope">■ Lower Envelope</div>
        </div>
        <canvas #envelopeChart id="envelopeChart"></canvas>
      </div>

      <!-- Compact Controls -->
      <div class="controls">
        <button 
          class="play-button" 
          [class.playing]="isPlaying"
          (click)="togglePlayback()">
          {{isPlaying ? 'PAUSE' : 'PLAY'}}
        </button>
        
        <div class="control-group">
          <label>Speed:</label>
          <select [(ngModel)]="playbackSpeed" (change)="updateSpeed()">
            <option value="2000">Slow</option>
            <option value="1000">Normal</option>
            <option value="500">Fast</option>
          </select>
        </div>
        
        <div class="control-group">
          <label>View:</label>
          <select [(ngModel)]="viewMode" (change)="updateView()">
            <option value="envelope">Envelope</option>
            <option value="individual">Individual</option>
            <option value="both">Both</option>
          </select>
        </div>
        
        <div class="control-group">
          <label>Resolution:</label>
          <select [(ngModel)]="binResolution" (change)="updateBinResolution()">
            <option value="20">20 Bins</option>
            <option value="40">40 Bins</option>
          </select>
        </div>
      </div>

      <!-- Compact Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="value">53</div>
          <div class="unit">tracks</div>
        </div>
        <div class="stat-card">
          <div class="value">{{peakResponse.toFixed(1)}}</div>
          <div class="unit">peak</div>
        </div>
        <div class="stat-card">
          <div class="value">{{stimulusEfficacy.toFixed(1)}}x</div>
          <div class="unit">efficacy</div>
        </div>
        <div class="stat-card">
          <div class="value">{{responseLatency.toFixed(1)}}s</div>
          <div class="unit">latency</div>
        </div>
        <div class="stat-card">
          <div class="value">0.043</div>
          <div class="unit">freq Hz</div>
        </div>
        <div class="stat-card">
          <div class="value">20s</div>
          <div class="unit">cycle</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Compact Container */
    .mechanosensation-container {
      background: #000;
      color: #fff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 10px;
      margin: 0;
    }

    /* Minimal Header */
    .header {
      text-align: center;
      margin: 5px 0;
      padding: 8px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header h1 {
      font-size: 1.5em;
      font-weight: 300;
      margin: 0;
      background: linear-gradient(
        45deg, 
        #ff1493 0%, 
        #32cd32 30%, 
        #ff1493 60%, 
        #32cd32 100%
      );
      background-size: 200% 100%;
      animation: subtleGlow 6s ease-in-out infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    @keyframes subtleGlow {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    /* Compact Chart Container */
    .chart-container {
      height: 300px;
      margin: 10px 0;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 20, 147, 0.03) 40%,
        rgba(50, 205, 50, 0.02) 70%,
        rgba(255, 255, 255, 0.05) 100%
      );
      border-radius: 8px;
      padding: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
    }

    .chart-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(
        circle at 25% 25%,
        rgba(255, 20, 147, 0.04) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 75% 75%,
        rgba(50, 205, 50, 0.03) 0%,
        transparent 50%
      );
      border-radius: 8px;
      pointer-events: none;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .legend-item {
      font-size: 11px;
      color: #fff;
    }

    .legend-item.led-stimulus { color: rgba(255, 0, 0, 0.8); }
    .legend-item.upper-envelope { color: rgba(78, 205, 196, 0.6); }
    .legend-item.mean-response { color: rgba(78, 205, 196, 1); }
    .legend-item.lower-envelope { color: rgba(78, 205, 196, 0.4); }

    /* Compact Controls */
    .controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin: 8px 0;
      flex-wrap: wrap;
    }

    .play-button {
      background: linear-gradient(
        45deg, 
        rgba(255, 20, 147, 0.8) 0%, 
        rgba(50, 205, 50, 0.6) 100%
      );
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 6px rgba(255, 20, 147, 0.3);
    }

    .play-button:hover {
      transform: scale(1.05);
      box-shadow: 0 3px 10px rgba(255, 20, 147, 0.5);
    }

    .play-button.playing {
      background: linear-gradient(
        45deg, 
        rgba(50, 205, 50, 0.8) 0%, 
        rgba(255, 20, 147, 0.6) 100%
      );
      box-shadow: 0 2px 6px rgba(50, 205, 50, 0.3);
    }

    .control-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      background: rgba(255, 255, 255, 0.1);
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      min-width: 80px;
    }

    .control-group label {
      font-size: 10px;
      color: #4ecdc4;
      font-weight: 500;
    }

    .control-group select {
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 10px;
    }

    /* Compact Statistics */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 8px;
      margin-top: 10px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 8px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card .value {
      font-size: 1.2em;
      font-weight: bold;
      color: #4ecdc4;
      margin-bottom: 2px;
    }

    .stat-card .unit {
      font-size: 0.7em;
      opacity: 0.8;
      color: #fff;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .mechanosensation-container {
        padding: 5px;
      }

      .header h1 {
        font-size: 1.3em;
      }

      .chart-container {
        height: 250px;
        padding: 8px;
      }

      .controls {
        flex-direction: column;
        gap: 8px;
      }

      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
    }

    @media (max-width: 480px) {
      .chart-container {
        height: 200px;
        padding: 6px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class SlideViewerComponent implements OnInit, OnDestroy {
  @ViewChild('envelopeChart', { static: true }) chartCanvas!: ElementRef;

  // Simulation state
  isPlaying = false;
  cycleTime = 0;
  currentTrack = 0;
  currentTurnRate = 0;

  // Controls
  playbackSpeed = 1000;
  viewMode = 'envelope';
  binResolution = 40;

  // Statistics
  peakResponse = 6.2;
  stimulusEfficacy = 2.8;
  responseLatency = 1.4;

  // Chart and simulation data
  chart: any;
  simulatedData: any = {};
  private animationFrame: any;

  ngOnInit() {
    this.loadChartLibrary().then(() => {
      this.generateSimulationData();
      this.initChart();
    });
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

  generateSimulationData() {
    const bins = this.binResolution;
    const tracks = 53;
    
    // Generate envelope data
    this.simulatedData = {
      envelope: {
        mean: [],
        upper: [],
        lower: [],
        squareWave: []
      },
      tracks: []
    };

    // Generate square wave (LED stimulus)
    for (let i = 0; i < bins; i++) {
      const time = (i / bins) * 20; // 20 second cycle
      this.simulatedData.envelope.squareWave.push(time >= 10 && time < 20 ? 1 : 0);
    }

    // Generate envelope response
    for (let i = 0; i < bins; i++) {
      const time = (i / bins) * 20;
      let baseValue = 2.0; // Baseline turn rate
      
      // Add stimulus response (10-20s period)
      if (time >= 10 && time < 20) {
        const stimulusPhase = (time - 10) / 10;
        baseValue += 2.5 * Math.sin(stimulusPhase * Math.PI) + 1.5;
      }
      
      // Add some noise and variation
      const noise = (Math.random() - 0.5) * 0.5;
      const meanValue = Math.max(0, baseValue + noise);
      
      this.simulatedData.envelope.mean.push(meanValue);
      this.simulatedData.envelope.upper.push(meanValue + 1.5 + Math.random() * 0.5);
      this.simulatedData.envelope.lower.push(Math.max(0, meanValue - 1.0 - Math.random() * 0.3));
    }

    // Generate individual tracks
    for (let track = 0; track < tracks; track++) {
      const trackData = [];
      const individualResponse = 0.5 + Math.random() * 2.0; // Individual variability
      
      for (let i = 0; i < bins; i++) {
        const time = (i / bins) * 20;
        let baseValue = 1.8 + Math.random() * 0.4; // Individual baseline
        
        // Add stimulus response
        if (time >= 10 && time < 20) {
          const stimulusPhase = (time - 10) / 10;
          baseValue += individualResponse * Math.sin(stimulusPhase * Math.PI * 2) * 2.0;
        }
        
        const noise = (Math.random() - 0.5) * 1.0;
        const finalValue = Math.max(0, baseValue + noise);
        trackData.push(finalValue);
      }
      this.simulatedData.tracks.push(trackData);
    }
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
            data: this.simulatedData.envelope.squareWave.map((val: number) => val * 15),
            borderColor: 'rgba(255, 0, 0, 0.8)',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderWidth: 3,
            fill: false,
            stepped: true,
            yAxisID: 'y1'
          },
          {
            label: 'Upper Envelope',
            data: this.simulatedData.envelope.upper,
            borderColor: 'rgba(78, 205, 196, 0.3)',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            fill: '+1',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Mean Response',
            data: this.simulatedData.envelope.mean,
            borderColor: 'rgba(78, 205, 196, 1)',
            backgroundColor: 'rgba(78, 205, 196, 0.2)',
            borderWidth: 3,
            fill: '+1',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Lower Envelope',
            data: this.simulatedData.envelope.lower,
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

  togglePlayback() {
    if (this.isPlaying) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  startSimulation() {
    this.isPlaying = true;
    this.cycleTime = 0;
    this.currentTrack = 0;
    
    this.animationFrame = setInterval(() => {
      this.updateSimulation();
    }, 100); // Update every 100ms for smooth animation
  }

  stopSimulation() {
    this.isPlaying = false;
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
      this.animationFrame = null;
    }
  }

  updateSimulation() {
    if (!this.isPlaying) return;

    // Update cycle time
    this.cycleTime += 0.1;
    if (this.cycleTime >= 20) {
      this.cycleTime = 0;
      this.currentTrack = (this.currentTrack + 1) % 53;
    }

    // Update turn rate based on current position in cycle
    const binIndex = Math.floor((this.cycleTime / 20) * this.binResolution);
    if (this.viewMode === 'individual' && this.simulatedData.tracks[this.currentTrack]) {
      this.currentTurnRate = this.simulatedData.tracks[this.currentTrack][binIndex] || 0;
    } else {
      this.currentTurnRate = this.simulatedData.envelope.mean[binIndex] || 0;
    }

    // Update chart if needed
    if (this.cycleTime % 2 < 0.1) { // Update chart every 2 seconds
      this.updateChart();
    }
  }

  updateChart() {
    if (this.viewMode === 'individual') {
      this.updateChartWithTrack(this.currentTrack);
    } else if (this.viewMode === 'both') {
      this.updateChartWithBoth(this.currentTrack);
    }
  }

  updateChartWithTrack(trackIndex: number) {
    if (!this.simulatedData.tracks[trackIndex]) return;

    const trackData = this.simulatedData.tracks[trackIndex];
    
    this.chart.data.datasets = [
      {
        label: 'LED Stimulus',
        data: this.simulatedData.envelope.squareWave.map((val: number) => val * 15),
        borderColor: 'rgba(255, 0, 0, 0.8)',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 3,
        fill: false,
        stepped: true,
        yAxisID: 'y1'
      },
      {
        label: `Track ${trackIndex + 1}`,
        data: trackData,
        borderColor: 'rgba(255, 107, 107, 1)',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: 'y'
      }
    ];

    this.chart.update('none');
  }

  updateChartWithBoth(trackIndex: number) {
    if (!this.simulatedData.tracks[trackIndex]) return;

    const trackData = this.simulatedData.tracks[trackIndex];
    
    this.chart.data.datasets = [
      {
        label: 'LED Stimulus',
        data: this.simulatedData.envelope.squareWave.map((val: number) => val * 15),
        borderColor: 'rgba(255, 0, 0, 0.8)',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 3,
        fill: false,
        stepped: true,
        yAxisID: 'y1'
      },
      {
        label: 'Upper Envelope',
        data: this.simulatedData.envelope.upper,
        borderColor: 'rgba(78, 205, 196, 0.3)',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        fill: '+1',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Mean Response',
        data: this.simulatedData.envelope.mean,
        borderColor: 'rgba(78, 205, 196, 1)',
        backgroundColor: 'rgba(78, 205, 196, 0.2)',
        borderWidth: 3,
        fill: '+1',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Lower Envelope',
        data: this.simulatedData.envelope.lower,
        borderColor: 'rgba(78, 205, 196, 0.3)',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: `Track ${trackIndex + 1}`,
        data: trackData,
        borderColor: 'rgba(255, 107, 107, 1)',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        yAxisID: 'y'
      }
    ];

    this.chart.update('none');
  }

  updateSpeed() {
    if (this.isPlaying) {
      this.stopSimulation();
      this.startSimulation();
    }
  }

  updateView() {
    this.generateSimulationData();
    this.initChart();
    if (this.isPlaying) {
      this.stopSimulation();
      this.startSimulation();
    }
  }

  updateBinResolution() {
    this.generateSimulationData();
    this.initChart();
    if (this.isPlaying) {
      this.stopSimulation();
      this.startSimulation();
    }
  }
} 