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
      <!-- Compact Header -->
      <div class="header">
        <h1>[DNA] Mechanosensation <span class="dynamics">Dynamics</span></h1>
        <p>Real-time simulation of Drosophila larval behavioral response profiles</p>
      </div>

      <!-- Functional Response Envelope - Primary Focus -->
      <div class="envelope-container">
        <div class="envelope-header">
          <h2>Functional Response Envelope</h2>
          <p>Dynamic visualization with individual track variability</p>
        </div>

        <!-- Chart Display - Primary Element -->
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
            {{isPlaying ? '[PAUSE]' : '[PLAY]'}}
          </button>
          
          <div class="control-group">
            <label>Speed:</label>
            <select [(ngModel)]="playbackSpeed" (change)="updateSpeed()">
              <option value="2000">Slow (2s)</option>
              <option value="1000">Normal (1s)</option>
              <option value="500">Fast (0.5s)</option>
              <option value="250">Very Fast (0.25s)</option>
            </select>
          </div>
          
          <div class="control-group">
            <label>View:</label>
            <select [(ngModel)]="viewMode" (change)="updateView()">
              <option value="envelope">Envelope Only</option>
              <option value="individual">Individual Tracks</option>
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
            <h3>Total Tracks</h3>
            <div class="value">53</div>
            <div class="unit">larvae</div>
          </div>
          <div class="stat-card">
            <h3>Cycle Duration</h3>
            <div class="value">20</div>
            <div class="unit">seconds</div>
          </div>
          <div class="stat-card">
            <h3>Peak Response</h3>
            <div class="value">{{peakResponse.toFixed(1)}}</div>
            <div class="unit">turns/min</div>
          </div>
          <div class="stat-card">
            <h3>Stimulus Efficacy</h3>
            <div class="value">{{stimulusEfficacy.toFixed(1)}}x</div>
            <div class="unit">baseline</div>
          </div>
          <div class="stat-card">
            <h3>Response Latency</h3>
            <div class="value">{{responseLatency.toFixed(1)}}</div>
            <div class="unit">seconds</div>
          </div>
          <div class="stat-card">
            <h3>Mean Frequency</h3>
            <div class="value">0.043</div>
            <div class="unit">Hz</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Main Container - Optimized for chart display */
    .mechanosensation-container {
      background: #000;
      color: #fff;
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      position: relative;
      overflow-x: hidden;
      padding: 0;
      margin: 0;
    }

    /* Compact Header */
    .header {
      text-align: center;
      margin: 10px 0; /* Minimal spacing */
      padding: 15px; /* Reduced padding */
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 15px; /* Smaller radius */
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3); /* Smaller shadow */
    }

    .header h1 {
      font-size: 2.5em; /* Smaller title */
      font-weight: 300;
      margin-bottom: 5px; /* Minimal spacing */
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header h1 .dynamics {
      color: #4ecdc4;
    }

    .header p {
      font-size: 1.1em; /* Smaller subtitle */
      opacity: 0.9;
      margin: 0;
      line-height: 1.4;
    }

    /* Envelope Container - Focus on chart */
    .envelope-container {
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(15px);
      border-radius: 20px;
      padding: 20px; /* Reduced padding */
      margin: 10px; /* Minimal margin */
      border: 2px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
    }

    .envelope-header {
      text-align: center;
      margin-bottom: 15px; /* Minimal spacing */
    }

    .envelope-header h2 {
      font-size: 2em; /* Smaller section title */
      margin-bottom: 8px; /* Minimal spacing */
      color: #4ecdc4;
    }

    .envelope-header p {
      font-size: 1em; /* Smaller description */
      opacity: 0.8;
      margin: 0;
    }

    /* Chart Container - Primary Element */
    .chart-container {
      position: relative;
      height: 500px; /* Larger chart area */
      margin: 20px 0;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 15px;
      padding: 15px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 10px; /* Minimal spacing */
      flex-wrap: wrap;
    }

    .legend-item {
      font-size: 13px; /* Slightly smaller */
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
      gap: 15px; /* Reduced gap */
      margin: 15px 0; /* Minimal margin */
      flex-wrap: wrap;
    }

    .play-button {
      background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
      color: white;
      border: none;
      padding: 12px 25px; /* Smaller button */
      border-radius: 20px;
      font-size: 16px; /* Smaller font */
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
      transition: all 0.3s ease;
    }

    .play-button:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 25px rgba(255, 107, 107, 0.6);
    }

    .play-button.playing {
      background: linear-gradient(45deg, #4ecdc4, #45b7d1);
      box-shadow: 0 6px 20px rgba(78, 205, 196, 0.4);
    }

    .control-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      background: rgba(255, 255, 255, 0.1);
      padding: 12px 15px; /* Smaller padding */
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      min-width: 100px; /* Smaller width */
    }

    .control-group label {
      font-weight: 500;
      color: #4ecdc4;
      font-size: 13px; /* Smaller labels */
    }

    .control-group select {
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      padding: 6px 10px; /* Smaller padding */
      font-size: 12px; /* Smaller font */
    }

    /* Compact Statistics Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Smaller cards */
      gap: 15px; /* Reduced gap */
      margin-top: 20px; /* Minimal spacing */
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 15px; /* Smaller padding */
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .stat-card:hover {
      transform: translateY(-3px); /* Smaller hover effect */
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }

    .stat-card h3 {
      font-size: 1.2em; /* Smaller title */
      margin-bottom: 8px;
      color: #45b7d1;
    }

    .stat-card .value {
      font-size: 2em; /* Smaller value */
      font-weight: bold;
      color: #4ecdc4;
      margin-bottom: 4px;
    }

    .stat-card .unit {
      font-size: 0.9em; /* Smaller unit */
      opacity: 0.8;
      color: #fff;
    }

    /* Responsive Design - Chart Priority */
    @media (max-width: 768px) {
      .header h1 {
        font-size: 2em;
      }

      .envelope-container {
        padding: 15px;
        margin: 5px;
      }

      .chart-container {
        height: 400px; /* Maintain substantial chart size on mobile */
      }

      .controls {
        flex-direction: column;
        gap: 10px;
      }

      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }
    }

    @media (max-width: 480px) {
      .header {
        padding: 10px;
        margin: 5px 0;
      }

      .header h1 {
        font-size: 1.8em;
      }

      .chart-container {
        height: 350px; /* Still prioritize chart on small screens */
        padding: 10px;
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