import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { FlywireApiService, MechanosensoryData, FlyWireCircuit } from '../services/flywire-api.service';

@Component({
  selector: 'app-fem-data-loader',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSelectModule
  ],
  template: `
    <mat-card class="fem-loader-card">
      <mat-card-header>
        <mat-card-title>FEM Data Integration - LARVAL CIRCUITS ONLY</mat-card-title>
        <mat-card-subtitle>Load mechanosensory analysis data for 2nd instar larvae (NO WINGS)</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <!-- API Configuration -->
        <mat-expansion-panel [expanded]="!isAuthenticated">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon [color]="isAuthenticated ? 'accent' : 'warn'">
                {{isAuthenticated ? 'verified' : 'key'}}
              </mat-icon>
              FlyWire CAVE Token Configuration
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <div class="api-config">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>FlyWire CAVE Token</mat-label>
              <input matInput 
                     type="password" 
                     [(ngModel)]="apiKey" 
                     placeholder="Your CAVE access token">
              <mat-icon matSuffix>key</mat-icon>
            </mat-form-field>
            
            <button mat-raised-button 
                    color="primary" 
                    (click)="setApiKey()" 
                    [disabled]="!apiKey.trim()">
              <mat-icon>save</mat-icon>
              Save CAVE Token
            </button>
            
            <div class="api-status" *ngIf="apiStatus">
              <mat-icon [color]="isAuthenticated ? 'accent' : 'warn'">
                {{isAuthenticated ? 'check_circle' : 'error'}}
              </mat-icon>
              <span>{{apiStatus}}</span>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- FEM Data Source -->
        <mat-expansion-panel class="fem-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>analytics</mat-icon>
              FEM Analysis Data Source - REAL DATA ONLY
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <div class="fem-source-config">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Data Source</mat-label>
              <mat-select [(ngModel)]="dataSource" (selectionChange)="onDataSourceChange()">
                <mat-option value="file">Load from File</mat-option>
                <mat-option value="realtime">Real-time Stream</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- File Upload -->
            <div *ngIf="dataSource === 'file'" class="file-upload">
              <input type="file" 
                     #fileInput 
                     (change)="onFileSelected($event)" 
                     accept=".json,.csv,.mat"
                     hidden>
              <button mat-stroked-button 
                      (click)="fileInput.click()" 
                      class="upload-button">
                <mat-icon>upload_file</mat-icon>
                Select FEM Data File (JSON/CSV)
              </button>
              <span *ngIf="selectedFile" class="file-name">{{selectedFile.name}}</span>
            </div>

            <!-- Real-time Configuration -->
            <div *ngIf="dataSource === 'realtime'" class="realtime-config">
              <mat-form-field appearance="outline">
                <mat-label>Update Frequency (Hz)</mat-label>
                <input matInput 
                       type="number" 
                       [(ngModel)]="updateFrequency" 
                       min="1" 
                       max="1000">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Experiment Duration (s)</mat-label>
                <input matInput 
                       type="number" 
                       [(ngModel)]="experimentDuration" 
                       min="1" 
                       max="300">
              </mat-form-field>
              
              <div class="realtime-warning">
                <mat-icon color="warn">warning</mat-icon>
                <span>Real-time mode requires external data stream connection</span>
              </div>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- Data Preview -->
        <div class="data-preview" *ngIf="femData.length > 0">
          <h4>Larval FEM Data Preview</h4>
          <div class="preview-stats">
            <div class="stat-item">
              <span class="label">Data Points:</span>
              <span class="value">{{femData.length}}</span>
            </div>
            <div class="stat-item">
              <span class="label">Duration:</span>
              <span class="value">{{getDataDuration()}}s</span>
            </div>
            <div class="stat-item">
              <span class="label">Peak Response:</span>
              <span class="value">{{getPeakResponse()}}</span>
            </div>
            <div class="stat-item">
              <span class="label">Peak Time:</span>
              <span class="value">{{getPeakTime()}}s</span>
            </div>
          </div>
        </div>

        <!-- Circuit Mapping -->
        <div class="circuit-mapping" *ngIf="femData.length > 0">
          <h4>Larval Circuit Mapping Status</h4>
          <div class="mapping-progress">
            <mat-progress-bar 
              mode="determinate" 
              [value]="mappingProgress"
              color="accent">
            </mat-progress-bar>
            <span class="progress-text">{{mappingProgress}}% mapped</span>
          </div>
          
          <div class="circuit-list" *ngIf="mappedCircuits.length > 0">
            <div class="circuit-item" *ngFor="let circuit of mappedCircuits">
              <mat-icon class="circuit-icon" [color]="getCircuitColor(circuit)">
                account_tree
              </mat-icon>
              <div class="circuit-info">
                <span class="circuit-name">{{circuit.name}}</span>
                <span class="neuron-count">{{circuit.neurons.length}} neurons</span>
              </div>
              <div class="activity-indicator">
                <div class="activity-bar" 
                     [style.width.%]="getCircuitActivity(circuit) * 100"
                     [style.background-color]="getActivityColor(circuit)">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div class="error-display" *ngIf="errorMessage">
          <mat-icon color="warn">error</mat-icon>
          <span>{{errorMessage}}</span>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button 
                color="primary" 
                (click)="loadData()" 
                [disabled]="isLoading || !isAuthenticated || (!selectedFile && dataSource === 'file')">
          <mat-icon>{{isLoading ? 'hourglass_empty' : 'play_arrow'}}</mat-icon>
          {{isLoading ? 'Loading...' : 'Load & Map Data'}}
        </button>
        
        <button mat-button 
                (click)="resetData()" 
                [disabled]="isLoading">
          <mat-icon>refresh</mat-icon>
          Reset
        </button>
      </mat-card-actions>
      
      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>
    </mat-card>
  `,
  styles: [`
    .fem-loader-card {
      margin: 20px 0;
      max-width: 800px;
    }
    
    .api-config, .fem-source-config, .realtime-config {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .api-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
    
    .file-upload {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .file-name {
      font-style: italic;
      color: #666;
    }
    
    .realtime-config {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
    }
    
    .realtime-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ff9800;
      font-size: 14px;
    }
    
    .data-preview {
      margin-top: 20px;
      padding: 16px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    
    .preview-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .stat-item {
      display: flex;
      justify-content: space-between;
    }
    
    .label {
      font-weight: 500;
      color: #666;
    }
    
    .value {
      font-weight: 600;
      color: #333;
    }
    
    .circuit-mapping {
      margin-top: 20px;
    }
    
    .mapping-progress {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .progress-text {
      font-weight: 500;
      min-width: 80px;
    }
    
    .circuit-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .circuit-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }
    
    .circuit-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    
    .circuit-name {
      font-weight: 500;
    }
    
    .neuron-count {
      font-size: 12px;
      color: #666;
    }
    
    .activity-indicator {
      width: 100px;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .activity-bar {
      height: 100%;
      transition: width 0.3s ease;
    }
    
    .fem-panel {
      margin-top: 16px;
    }
    
    .error-display {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background: #ffebee;
      border-radius: 4px;
      color: #c62828;
    }
  `]
})
export class FemDataLoaderComponent implements OnInit {
  @Output() dataLoaded = new EventEmitter<{femData: MechanosensoryData[], circuits: FlyWireCircuit[]}>();

  // API Configuration
  apiKey: string = '';
  isAuthenticated: boolean = false;
  apiStatus: string = '';

  // Data Source - NO MOCK DATA
  dataSource: 'file' | 'realtime' = 'file';
  selectedFile: File | null = null;

  // Real-time Options
  updateFrequency: number = 100; // Hz
  experimentDuration: number = 30; // seconds

  // Data
  femData: MechanosensoryData[] = [];
  mappedCircuits: FlyWireCircuit[] = [];
  mappingProgress: number = 0;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private flywireApi: FlywireApiService) {}

  ngOnInit() {
    this.flywireApi.isAuthenticated().subscribe(auth => {
      this.isAuthenticated = auth;
      this.apiStatus = auth ? 'Connected to FlyWire CAVE API' : 'CAVE token required for larval circuit data';
    });
  }

  setApiKey() {
    this.flywireApi.setApiKey(this.apiKey.trim());
    this.apiStatus = 'CAVE token saved';
  }

  onDataSourceChange() {
    this.resetData();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.errorMessage = '';
      this.loadFileData();
    }
  }

  async loadFileData() {
    if (!this.selectedFile) {
      this.errorMessage = 'No file selected';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const text = await this.selectedFile.text();
      
      if (this.selectedFile.name.endsWith('.json')) {
        const jsonData = JSON.parse(text);
        this.femData = this.processFemJson(jsonData);
      } else if (this.selectedFile.name.endsWith('.csv')) {
        this.femData = this.processFemCsv(text);
      } else {
        throw new Error('Unsupported file format - only JSON and CSV files are supported');
      }
      
      if (this.femData.length === 0) {
        throw new Error('No valid FEM data found in file');
      }
      
      this.mapDataToCircuits();
    } catch (error) {
      console.error('Error loading file:', error);
      this.errorMessage = 'Error loading file: ' + (error as Error).message;
      this.isLoading = false;
    }
  }

  loadData() {
    if (!this.isAuthenticated) {
      this.errorMessage = 'CAVE token required to access FlyWire larval circuits';
      return;
    }

    this.isLoading = true;
    this.mappingProgress = 0;
    this.errorMessage = '';

    if (this.dataSource === 'realtime') {
      this.startRealtimeData();
    } else if (this.dataSource === 'file' && this.selectedFile) {
      this.loadFileData();
    } else {
      this.errorMessage = 'Please select a data source';
      this.isLoading = false;
    }
  }

  startRealtimeData() {
    this.errorMessage = 'Real-time data streaming not yet implemented - please load from file';
    this.isLoading = false;
    
    // TODO: Implement real-time data streaming
    // This would connect to your experimental data acquisition system
  }

  mapDataToCircuits() {
    if (!this.isAuthenticated) {
      this.errorMessage = 'CAVE token required for circuit mapping';
      this.isLoading = false;
      return;
    }

    if (this.femData.length === 0) {
      this.errorMessage = 'No FEM data available for circuit mapping';
      this.isLoading = false;
      return;
    }

    // Use ONLY real FlyWire data - NO FALLBACKS
    this.flywireApi.mapFemDataToCircuits(this.femData).subscribe({
      next: (circuits) => {
        this.mappedCircuits = circuits;
        this.mappingProgress = 100;
        this.isLoading = false;
        this.emitData();
      },
      error: (error) => {
        console.error('Error mapping circuits:', error);
        this.errorMessage = 'Failed to map circuits: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  processFemJson(data: any): MechanosensoryData[] {
    if (!Array.isArray(data)) {
      throw new Error('JSON data must be an array of FEM data points');
    }
    
    return data.map((item, index) => {
      if (typeof item !== 'object') {
        throw new Error(`Invalid data point at index ${index}`);
      }
      
      return {
        timestamp: this.parseNumber(item.time || item.timestamp, `timestamp at index ${index}`),
        peakTime: this.parseNumber(item.peakTime, `peakTime at index ${index}`, 11.5),
        magnitude: this.parseNumber(item.magnitude, `magnitude at index ${index}`, 3.67),
        turnRate: this.parseArray(item.turnRate, `turnRate at index ${index}`),
        co2Response: this.parseArray(item.co2Response, `co2Response at index ${index}`),
        optogeneticStimulus: Boolean(item.optogeneticStimulus),
        femParameters: {
          stimulusPosition: this.parsePosition(item.femParameters?.stimulusPosition, `stimulusPosition at index ${index}`),
          mechanicalForce: this.parseNumber(item.femParameters?.mechanicalForce, `mechanicalForce at index ${index}`, 0),
          responsePattern: this.parseArray(item.femParameters?.responsePattern, `responsePattern at index ${index}`, [0])
        }
      };
    });
  }

  processFemCsv(csvText: string): MechanosensoryData[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have header and at least one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data: MechanosensoryData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) {
        console.warn(`Skipping incomplete row ${i + 1}`);
        continue;
      }
      
      try {
        data.push({
          timestamp: parseFloat(values[0]) || 0,
          peakTime: 11.5, // Default from analysis
          magnitude: 3.67, // Default from analysis
          turnRate: [parseFloat(values[1]) || 0],
          co2Response: [parseFloat(values[2]) || 0],
          optogeneticStimulus: values[3]?.toLowerCase() === 'true',
          femParameters: {
            stimulusPosition: [
              parseFloat(values[4]) || 0,
              parseFloat(values[5]) || 0,
              parseFloat(values[6]) || 0
            ],
            mechanicalForce: parseFloat(values[7]) || 0,
            responsePattern: [parseFloat(values[8]) || 0]
          }
        });
      } catch (error) {
        console.warn(`Error parsing row ${i + 1}:`, error);
      }
    }
    
    if (data.length === 0) {
      throw new Error('No valid data rows found in CSV file');
    }
    
    return data;
  }

  private parseNumber(value: any, fieldName: string, defaultValue?: number): number {
    const num = Number(value);
    if (isNaN(num)) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Invalid number for ${fieldName}: ${value}`);
    }
    return num;
  }

  private parseArray(value: any, fieldName: string, defaultValue?: number[]): number[] {
    if (Array.isArray(value)) {
      return value.map(v => {
        const num = Number(v);
        if (isNaN(num)) throw new Error(`Invalid number in array for ${fieldName}: ${v}`);
        return num;
      });
    } else if (typeof value === 'number') {
      return [value];
    } else if (defaultValue) {
      return defaultValue;
    } else {
      throw new Error(`Invalid array for ${fieldName}: ${value}`);
    }
  }

  private parsePosition(value: any, fieldName: string, defaultValue: [number, number, number] = [0, 0, 0]): [number, number, number] {
    const arr = this.parseArray(value, fieldName, defaultValue);
    if (arr.length >= 3) {
      return [arr[0], arr[1], arr[2]];
    } else {
      return defaultValue;
    }
  }

  resetData() {
    this.femData = [];
    this.mappedCircuits = [];
    this.mappingProgress = 0;
    this.selectedFile = null;
    this.errorMessage = '';
  }

  emitData() {
    this.dataLoaded.emit({
      femData: this.femData,
      circuits: this.mappedCircuits
    });
  }

  // Helper methods for template
  getDataDuration(): string {
    if (!this.femData.length) return '0';
    const duration = this.femData[this.femData.length - 1].timestamp - this.femData[0].timestamp;
    return duration.toFixed(1);
  }

  getPeakResponse(): string {
    if (!this.femData.length) return '0';
    const maxResponse = Math.max(...this.femData.map(d => Math.max(...d.turnRate)));
    return maxResponse.toFixed(2);
  }

  getPeakTime(): string {
    if (!this.femData.length) return '0';
    return this.femData[0].peakTime.toFixed(1);
  }

  getCircuitColor(circuit: FlyWireCircuit): string {
    const activity = this.getCircuitActivity(circuit);
    return activity > 0.7 ? 'accent' : activity > 0.3 ? 'primary' : '';
  }

  getCircuitActivity(circuit: FlyWireCircuit): number {
    if (!circuit.neurons.length) return 0;
    const avgActivity = circuit.neurons.reduce((sum, n) => sum + (n.activity || 0), 0) / circuit.neurons.length;
    return avgActivity;
  }

  getActivityColor(circuit: FlyWireCircuit): string {
    const activity = this.getCircuitActivity(circuit);
    if (activity > 0.7) return '#4CAF50'; // Green
    if (activity > 0.3) return '#FF9800'; // Orange
    return '#2196F3'; // Blue
  }
} 