import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlyWireCircuit, FlyWireNeuron } from '../services/flywire-api.service';

// Neuroglancer imports using correct ES module paths
import { Viewer } from 'neuroglancer/unstable/viewer.js';
import { DisplayContext } from 'neuroglancer/unstable/display_context.js';
import { StatusMessage } from 'neuroglancer/unstable/status.js';

@Component({
  selector: 'app-neuroglancer-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-card class="neuroglancer-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>account_tree</mat-icon>
          Larval Neural Circuits
        </mat-card-title>
        <mat-card-subtitle>
          FlyWire Connectome - 2nd Instar Larvae (NO WINGS)
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="circuit-controls" *ngIf="circuits.length > 0">
          <div class="circuit-info">
            <span class="label">Circuits:</span>
            <span class="value">{{circuits.length}}</span>
          </div>
          <div class="neuron-info">
            <span class="label">Total Neurons:</span>
            <span class="value">{{getTotalNeurons()}}</span>
          </div>
          <div class="activity-info" *ngIf="hasActivity()">
            <span class="label">Active Neurons:</span>
            <span class="value">{{getActiveNeurons()}}</span>
          </div>
        </div>
        
        <div class="neuroglancer-container" 
             [style.height]="containerHeight"
             [style.width]="containerWidth">
          <div #neuroglancerContainer 
               class="neuroglancer-viewer"
               [style.height]="'100%'"
               [style.width]="'100%'"></div>
          
          <div class="loading-overlay" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
            <span class="loading-text">Loading neural circuits...</span>
          </div>
          
          <div class="error-overlay" *ngIf="errorMessage">
            <mat-icon color="warn">error</mat-icon>
            <span class="error-text">{{errorMessage}}</span>
          </div>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-button 
                (click)="resetView()" 
                [disabled]="isLoading || !viewer">
          <mat-icon>center_focus_strong</mat-icon>
          Reset View
        </button>
        
        <button mat-button 
                (click)="toggleCircuitVisibility()" 
                [disabled]="isLoading || circuits.length === 0">
          <mat-icon>{{circuitsVisible ? 'visibility_off' : 'visibility'}}</mat-icon>
          {{circuitsVisible ? 'Hide' : 'Show'}} Circuits
        </button>
        
        <button mat-button 
                (click)="exportView()" 
                [disabled]="isLoading || !viewer">
          <mat-icon>download</mat-icon>
          Export State
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .neuroglancer-card {
      margin: 20px 0;
      height: fit-content;
    }
    
    .circuit-controls {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .circuit-info, .neuron-info, .activity-info {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
    
    .value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    
    .neuroglancer-container {
      position: relative;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      background: #000;
    }
    
    .neuroglancer-viewer {
      position: relative;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .loading-text {
      color: white;
      margin-top: 16px;
      font-size: 14px;
    }
    
    .error-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(244, 67, 54, 0.1);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .error-text {
      color: #c62828;
      margin-top: 8px;
      font-size: 14px;
      text-align: center;
      padding: 0 20px;
    }
    
    mat-card-actions {
      display: flex;
      gap: 8px;
    }
  `]
})
export class NeuroglancerViewerComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('neuroglancerContainer', { static: true }) 
  containerRef!: ElementRef<HTMLDivElement>;

  @Input() circuits: FlyWireCircuit[] = [];
  @Input() containerHeight: string = '500px';
  @Input() containerWidth: string = '100%';
  @Input() caveToken: string = '';

  viewer: Viewer | null = null;
  displayContext: DisplayContext | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  circuitsVisible: boolean = true;

  ngOnInit() {
    this.initializeNeuroglancer();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['circuits'] && !changes['circuits'].firstChange) {
      this.updateCircuits();
    }
  }

  private async initializeNeuroglancer() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Initialize display context
      this.displayContext = new DisplayContext(this.containerRef.nativeElement);
      
      // Create viewer instance
      this.viewer = new Viewer(this.displayContext);
      
      // Configure viewer for FlyWire data
      await this.configureViewer();
      
      // Load initial circuits if available
      if (this.circuits.length > 0) {
        await this.updateCircuits();
      }
      
      this.isLoading = false;
    } catch (error) {
      console.error('Neuroglancer initialization failed:', error);
      this.errorMessage = 'Failed to initialize 3D viewer: ' + (error as Error).message;
      this.isLoading = false;
    }
  }

  private async configureViewer() {
    if (!this.viewer) return;

    try {
      // Set up coordinate space for FlyWire FAFB dataset
      const coordinateSpace = {
        "dimensions": {
          "x": [1e-9, "m"],
          "y": [1e-9, "m"], 
          "z": [1e-9, "m"]
        },
        "units": ["nm", "nm", "nm"]
      };

      // Configure layers for FlyWire data
      const state = {
        "coordinateSpace": coordinateSpace,
        "position": [0, 0, 0],
        "crossSectionScale": 1,
        "projectionScale": 256,
        "layers": [],
        "layout": "4panel",
        "selectedLayer": {
          "visible": true
        }
      };

      // Apply initial state
      this.viewer.state.restoreState(state);
      
      // Configure for larval data if CAVE token available
      if (this.caveToken) {
        await this.setupFlyWireDataSource();
      }
      
    } catch (error) {
      console.error('Viewer configuration failed:', error);
      throw new Error('Viewer configuration failed: ' + (error as Error).message);
    }
  }

  private async setupFlyWireDataSource() {
    if (!this.viewer || !this.caveToken) return;

    try {
      // FlyWire FAFB precomputed data source
      const flywireSource = `precomputed://https://bossdb-open-data.s3.amazonaws.com/flywire/fafb_v14.1`;
      
      // Add FlyWire base layer
      const baseLayer = {
        "type": "image",
        "source": flywireSource,
        "name": "FAFB_v14.1"
      };

      // Add segmentation layer for neurons
      const segmentationLayer = {
        "type": "segmentation", 
        "source": `${flywireSource}_segmentation`,
        "name": "FlyWire_Segmentation"
      };

      // Update viewer state with FlyWire layers
      const currentState = this.viewer.state.toJSON();
      currentState.layers = [baseLayer, segmentationLayer];
      this.viewer.state.restoreState(currentState);
      
    } catch (error) {
      console.error('FlyWire data source setup failed:', error);
      // Continue without FlyWire base - we can still show our circuit data
    }
  }

  private async updateCircuits() {
    if (!this.viewer || !this.circuits.length) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Clear existing circuit layers
      this.clearCircuitLayers();
      
      // Add each circuit as a separate layer
      for (const circuit of this.circuits) {
        await this.addCircuitLayer(circuit);
      }
      
      // Fit view to show all circuits
      this.fitViewToCircuits();
      
      this.isLoading = false;
    } catch (error) {
      console.error('Circuit update failed:', error);
      this.errorMessage = 'Failed to load circuits: ' + (error as Error).message;
      this.isLoading = false;
    }
  }

  private clearCircuitLayers() {
    if (!this.viewer) return;

    const state = this.viewer.state.toJSON();
    state.layers = state.layers.filter((layer: any) => 
      !layer.name?.startsWith('Circuit_')
    );
    this.viewer.state.restoreState(state);
  }

  private async addCircuitLayer(circuit: FlyWireCircuit) {
    if (!this.viewer) return;

    try {
      // Create annotation layer for circuit neurons
      const annotations = circuit.neurons.map(neuron => ({
        "point": neuron.position,
        "type": "point",
        "id": neuron.id,
        "description": `${circuit.name}: ${neuron.type}`,
        "properties": {
          "activity": neuron.activity || 0,
          "type": neuron.type
        }
      }));

      const circuitLayer = {
        "type": "annotation",
        "name": `Circuit_${circuit.name}`,
        "annotations": annotations,
        "annotationColor": this.getCircuitColor(circuit),
        "visible": this.circuitsVisible
      };

      // Add to current state
      const currentState = this.viewer.state.toJSON();
      currentState.layers.push(circuitLayer);
      this.viewer.state.restoreState(currentState);
      
    } catch (error) {
      console.error(`Failed to add circuit layer ${circuit.name}:`, error);
    }
  }

  private getCircuitColor(circuit: FlyWireCircuit): string {
    // Color circuits based on their type and activity
    const avgActivity = this.getCircuitActivity(circuit);
    
    if (circuit.name.includes('Photoreceptor')) {
      return avgActivity > 0.5 ? '#FF4081' : '#E91E63'; // Pink for photoreceptor-DN
    } else if (circuit.name.includes('CO2')) {
      return avgActivity > 0.5 ? '#4CAF50' : '#66BB6A'; // Green for CO2
    } else if (circuit.name.includes('Touch')) {
      return avgActivity > 0.5 ? '#2196F3' : '#42A5F5'; // Blue for touch
    } else if (circuit.name.includes('Proprioceptive')) {
      return avgActivity > 0.5 ? '#FF9800' : '#FFA726'; // Orange for proprioception
    }
    
    return '#9E9E9E'; // Gray default
  }

  private getCircuitActivity(circuit: FlyWireCircuit): number {
    if (!circuit.neurons.length) return 0;
    return circuit.neurons.reduce((sum, n) => sum + (n.activity || 0), 0) / circuit.neurons.length;
  }

  private fitViewToCircuits() {
    if (!this.viewer || !this.circuits.length) return;

    try {
      // Calculate bounding box of all circuits
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

      for (const circuit of this.circuits) {
        for (const neuron of circuit.neurons) {
          const [x, y, z] = neuron.position;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          minZ = Math.min(minZ, z);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          maxZ = Math.max(maxZ, z);
        }
      }

      // Set viewer position to center of bounding box
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2; 
      const centerZ = (minZ + maxZ) / 2;

      const state = this.viewer.state.toJSON();
      state.position = [centerX, centerY, centerZ];
      
      // Adjust scale based on data extent
      const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
      state.crossSectionScale = extent / 100;
      state.projectionScale = extent / 4;
      
      this.viewer.state.restoreState(state);
      
    } catch (error) {
      console.error('Failed to fit view to circuits:', error);
    }
  }

  private cleanup() {
    if (this.viewer) {
      this.viewer.dispose();
      this.viewer = null;
    }
    if (this.displayContext) {
      this.displayContext.dispose();
      this.displayContext = null;
    }
  }

  // Public methods for template
  resetView() {
    this.fitViewToCircuits();
  }

  toggleCircuitVisibility() {
    this.circuitsVisible = !this.circuitsVisible;
    this.updateCircuitVisibility();
  }

  private updateCircuitVisibility() {
    if (!this.viewer) return;

    const state = this.viewer.state.toJSON();
    state.layers = state.layers.map((layer: any) => {
      if (layer.name?.startsWith('Circuit_')) {
        layer.visible = this.circuitsVisible;
      }
      return layer;
    });
    this.viewer.state.restoreState(state);
  }

  exportView() {
    if (!this.viewer) return;
    
    const state = this.viewer.state.toJSON();
    const stateString = JSON.stringify(state, null, 2);
    
    const blob = new Blob([stateString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neuroglancer_larval_circuits.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  getTotalNeurons(): number {
    return this.circuits.reduce((sum, circuit) => sum + circuit.neurons.length, 0);
  }

  hasActivity(): boolean {
    return this.circuits.some(circuit => 
      circuit.neurons.some(neuron => (neuron.activity || 0) > 0)
    );
  }

  getActiveNeurons(): number {
    return this.circuits.reduce((sum, circuit) => 
      sum + circuit.neurons.filter(neuron => (neuron.activity || 0) > 0.1).length, 0
    );
  }
} 