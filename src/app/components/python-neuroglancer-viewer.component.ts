import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PythonNeuroglancerService, PythonCircuit } from '../services/python-neuroglancer.service';
import { MechanosensoryData } from '../services/flywire-api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-python-neuroglancer-viewer',
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
          🔴 CHRIMSON Neural Circuits (Python)
        </mat-card-title>
        <mat-card-subtitle>
          Real FlyWire Connectome • Red Light → Phantom Mechanosensation
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Connection Status -->
        <div class="connection-status" [class.connected]="isConnected">
          <mat-icon [color]="isConnected ? 'accent' : 'warn'">
            {{isConnected ? 'check_circle' : 'error'}}
          </mat-icon>
          <span>Python Backend: {{isConnected ? 'Connected' : 'Disconnected'}}</span>
        </div>

        <!-- Circuit Summary -->
        <div class="circuit-summary" *ngIf="circuits.length > 0">
          <div class="summary-item" *ngFor="let circuit of circuits">
            <div class="circuit-indicator" [style.background-color]="circuit.color"></div>
            <span class="circuit-name">{{circuit.name}}</span>
            <span class="neuron-count">({{circuit.neurons.length}} neurons)</span>
          </div>
        </div>
        
        <!-- Neuroglancer Iframe -->
        <div class="neuroglancer-container" *ngIf="neuroglancerUrl; else noVisualization">
          <iframe 
            [src]="neuroglancerUrl"
            class="neuroglancer-iframe"
            frameborder="0"
            allowfullscreen>
          </iframe>
          
          <div class="overlay-controls">
            <button mat-mini-fab color="primary" (click)="refreshVisualization()" matTooltip="Refresh">
              <mat-icon>refresh</mat-icon>
            </button>
            <button mat-mini-fab color="accent" (click)="openInNewTab()" matTooltip="Open in New Tab">
              <mat-icon>open_in_new</mat-icon>
            </button>
          </div>
        </div>

        <ng-template #noVisualization>
          <div class="no-visualization">
            <mat-icon>visibility_off</mat-icon>
            <p>No Neuroglancer visualization available</p>
            <button mat-raised-button color="primary" (click)="initializeVisualization()" 
                    [disabled]="isLoading || !isConnected">
              <mat-icon>play_arrow</mat-icon>
              Create Visualization
            </button>
          </div>
        </ng-template>

        <div class="loading-overlay" *ngIf="isLoading">
          <mat-spinner diameter="40"></mat-spinner>
          <span class="loading-text">{{loadingMessage}}</span>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-button (click)="searchCircuits()" [disabled]="isLoading || !isConnected">
          <mat-icon>search</mat-icon>
          Search CHRIMSON Circuits
        </button>
        
        <button mat-button (click)="initializeVisualization()" 
                [disabled]="isLoading || !isConnected || circuits.length === 0">
          <mat-icon>3d_rotation</mat-icon>
          Create 3D View
        </button>
        
        <button mat-button (click)="checkBackendConnection()">
          <mat-icon>sync</mat-icon>
          Check Connection
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .neuroglancer-card {
      margin: 20px 0;
      height: fit-content;
    }
    
    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 8px 12px;
      border-radius: 4px;
      background: #ffebee;
      color: #c62828;
    }
    
    .connection-status.connected {
      background: #e8f5e8;
      color: #2e7d32;
    }
    
    .circuit-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .summary-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .circuit-indicator {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }
    
    .circuit-name {
      font-weight: 500;
      flex: 1;
    }
    
    .neuron-count {
      font-size: 12px;
      color: #666;
    }
    
    .neuroglancer-container {
      position: relative;
      width: 100%;
      height: 500px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      background: #000;
    }
    
    .neuroglancer-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    .overlay-controls {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 10;
    }
    
    .no-visualization {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: #666;
      text-align: center;
    }
    
    .no-visualization mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #ccc;
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
      z-index: 20;
    }
    
    .loading-text {
      color: white;
      margin-top: 16px;
      font-size: 14px;
    }
    
    mat-card-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  `]
})
export class PythonNeuroglancerViewerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() femData: MechanosensoryData[] = [];

  circuits: PythonCircuit[] = [];
  neuroglancerUrl: SafeResourceUrl | null = null;
  isConnected: boolean = false;
  isLoading: boolean = false;
  loadingMessage: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private pythonService: PythonNeuroglancerService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.subscribeToServices();
    this.checkBackendConnection();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['femData'] && !changes['femData'].firstChange && this.femData.length > 0) {
      this.updateCircuitActivity();
    }
  }

  private subscribeToServices() {
    // Subscribe to connection status
    const connectionSub = this.pythonService.getConnectionStatus().subscribe((connected: boolean) => {
      this.isConnected = connected;
      if (connected) {
        console.log('✅ Python backend connected');
      } else {
        console.log('❌ Python backend disconnected');
      }
    });

    // Subscribe to Neuroglancer URL changes
    const urlSub = this.pythonService.getNeuroglancerUrl().subscribe(url => {
      if (url) {
        this.neuroglancerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        console.log('🎯 Neuroglancer URL updated:', url);
      } else {
        this.neuroglancerUrl = null;
      }
    });

    this.subscriptions.push(connectionSub, urlSub);
  }

  checkBackendConnection() {
    this.isLoading = true;
    this.loadingMessage = 'Checking Python backend...';

    this.pythonService.checkConnection().subscribe({
      next: (connected) => {
        this.isLoading = false;
        if (connected) {
          console.log('🐍 Python Neuroglancer backend is ready!');
        } else {
          console.log('⚠️ Python backend not available');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Backend connection check failed:', error);
      }
    });
  }

  searchCircuits() {
    this.isLoading = true;
    this.loadingMessage = 'Searching for CHRIMSON circuits...';

    this.pythonService.searchCHRIMSONCircuits().subscribe({
      next: (circuits) => {
        this.circuits = circuits;
        this.isLoading = false;
        
        const chrimsonCircuits = circuits.filter(c => c.type === 'chrimson');
        console.log(`🔴 Found ${chrimsonCircuits.length} CHRIMSON circuits!`);
        
        // Auto-create visualization if circuits found
        if (circuits.length > 0) {
          this.initializeVisualization();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Circuit search failed:', error);
      }
    });
  }

  initializeVisualization() {
    if (this.circuits.length === 0) {
      console.log('⚠️ No circuits available - searching first...');
      this.searchCircuits();
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Creating Neuroglancer visualization...';

    this.pythonService.createVisualization().subscribe({
      next: (url) => {
        this.isLoading = false;
        console.log('🎯 Neuroglancer visualization created!');
        console.log('🔴 CHRIMSON Red Light → Phantom Mechanosensation');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Visualization creation failed:', error);
      }
    });
  }

  updateCircuitActivity() {
    if (!this.isConnected || this.femData.length === 0) {
      return;
    }

    const latestData = this.femData[this.femData.length - 1];
    
    this.pythonService.updateCircuitActivity(latestData).subscribe({
      next: (success) => {
        if (success) {
          console.log('🔄 Circuit activity updated with FEM data');
          if (latestData.optogeneticStimulus) {
            console.log('🔴 Red light ON → CHRIMSON phantom mechanosensation!');
          }
        }
      },
      error: (error) => {
        console.error('❌ Activity update failed:', error);
      }
    });
  }

  refreshVisualization() {
    this.initializeVisualization();
  }

  openInNewTab() {
    this.pythonService.getNeuroglancerUrl().subscribe(currentUrl => {
      if (currentUrl) {
        window.open(currentUrl, '_blank');
      }
    });
  }
} 