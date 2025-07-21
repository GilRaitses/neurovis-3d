import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HttpClientModule } from '@angular/common/http';
import { BehavioralArenaComponent } from './components/behavioral-arena.component';
import { PythonNeuroglancerViewerComponent } from './components/python-neuroglancer-viewer.component';
import { FemDataLoaderComponent } from './components/fem-data-loader.component';
import { HealthComponent } from './components/health.component';
import { MechanosensoryData, FlyWireCircuit } from './services/flywire-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    HttpClientModule,
    BehavioralArenaComponent,
    PythonNeuroglancerViewerComponent,
    FemDataLoaderComponent,
    HealthComponent
  ],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>biotech</mat-icon>
      <span>NeuroVis-3D</span>
      <span style="flex: 1;"></span>
      <span class="subtitle">🔴 CHRIMSON Phantom Mechanosensation</span>
    </mat-toolbar>

    <div class="app-container">
      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Left Panel: Behavioral Arena -->
        <div class="left-panel">
          <app-behavioral-arena 
            [femData]="mechanosensoryData">
          </app-behavioral-arena>
        </div>

        <!-- Right Panel: Python Neuroglancer -->
        <div class="right-panel">
          <app-python-neuroglancer-viewer 
            [femData]="mechanosensoryData">
          </app-python-neuroglancer-viewer>
        </div>
      </div>

      <!-- Bottom Panel: Data Loading and Health -->
      <div class="bottom-panel">
        <div class="bottom-grid">
          <app-fem-data-loader 
            (dataLoaded)="onFemDataLoaded($event)">
          </app-fem-data-loader>
          
          <app-health></app-health>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      padding: 20px;
      min-height: calc(100vh - 64px);
      background: #f5f5f5;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }

    .left-panel, .right-panel {
      min-height: 600px;
    }

    .bottom-panel {
      width: 100%;
    }

    .bottom-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }

    .subtitle {
      font-size: 14px;
      font-weight: 400;
      color: #ffcdd2;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
      
      .bottom-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AppComponent {
  title = 'neurovis-3d';
  mechanosensoryData: MechanosensoryData[] = [];

  constructor() {
    console.log('🚀 NeuroVis-3D Starting...');
    console.log('🔴 CHRIMSON: Red Light → Phantom Mechanosensation');
    console.log('🧠 Dual Visualization: Three.js + Python Neuroglancer');
  }

  onFemDataLoaded(data: any) {
    // Handle both old and new event formats
    if (Array.isArray(data)) {
      // New format: just MechanosensoryData[]
      this.mechanosensoryData = data;
      console.log('📊 FEM Data loaded:', data.length, 'samples');
    } else if (data.femData) {
      // Old format: {femData: MechanosensoryData[], circuits: FlyWireCircuit[]}
      this.mechanosensoryData = data.femData;
      console.log('📊 FEM Data loaded:', data.femData.length, 'samples');
      console.log('🧠 Circuits loaded:', data.circuits?.length || 0, 'circuits');
    }
    
    // Log CHRIMSON-relevant data
    const chrimsonStimuli = this.mechanosensoryData.filter(d => d.optogeneticStimulus);
    if (chrimsonStimuli.length > 0) {
      console.log('🔴 CHRIMSON stimuli detected:', chrimsonStimuli.length, 'frames');
    }
  }
} 