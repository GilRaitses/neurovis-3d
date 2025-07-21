import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlywireApiService } from '../services/flywire-api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <mat-card class="health-card">
      <mat-card-header>
        <mat-card-title>System Health Status</mat-card-title>
        <mat-card-subtitle>FlyWire API and Service Connectivity</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="status-grid">
          <div class="status-item">
            <mat-icon [color]="flywireStatus.connected ? 'accent' : 'warn'">
              {{flywireStatus.connected ? 'check_circle' : 'error'}}
            </mat-icon>
            <div class="status-details">
              <span class="status-label">FlyWire API</span>
              <span class="status-value">{{flywireStatus.message}}</span>
            </div>
          </div>
          
          <div class="status-item">
            <mat-icon [color]="authStatus.authenticated ? 'accent' : 'warn'">
              {{authStatus.authenticated ? 'verified_user' : 'person_off'}}
            </mat-icon>
            <div class="status-details">
              <span class="status-label">Authentication</span>
              <span class="status-value">{{authStatus.message}}</span>
            </div>
          </div>
          
          <div class="status-item">
            <mat-icon [color]="apiStatus.available ? 'accent' : 'warn'">
              {{apiStatus.available ? 'api' : 'api_off'}}
            </mat-icon>
            <div class="status-details">
              <span class="status-label">API Endpoints</span>
              <span class="status-value">{{apiStatus.message}}</span>
            </div>
          </div>
          
          <div class="status-item">
            <mat-icon [color]="dataStatus.ready ? 'accent' : 'warn'">
              {{dataStatus.ready ? 'dataset' : 'dataset_off'}}
            </mat-icon>
            <div class="status-details">
              <span class="status-label">Data Access</span>
              <span class="status-value">{{dataStatus.message}}</span>
            </div>
          </div>
        </div>
        
        <mat-progress-bar 
          *ngIf="isChecking" 
          mode="indeterminate"
          color="accent">
        </mat-progress-bar>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button 
                color="primary" 
                (click)="checkHealth()" 
                [disabled]="isChecking">
          <mat-icon>refresh</mat-icon>
          Check Health
        </button>
        
        <button mat-button 
                (click)="resetConnection()" 
                [disabled]="isChecking">
          <mat-icon>restore</mat-icon>
          Reset Connection
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .health-card {
      margin: 20px 0;
      max-width: 600px;
    }
    
    .status-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: #fafafa;
    }
    
    .status-details {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    
    .status-label {
      font-weight: 500;
      font-size: 14px;
    }
    
    .status-value {
      font-size: 12px;
      color: #666;
    }
    
    mat-progress-bar {
      margin-top: 16px;
    }
  `]
})
export class HealthComponent implements OnInit {
  isChecking = false;
  
  flywireStatus = {
    connected: false,
    message: 'Checking...'
  };
  
  authStatus = {
    authenticated: false,
    message: 'Checking...'
  };
  
  apiStatus = {
    available: false,
    message: 'Checking...'
  };
  
  dataStatus = {
    ready: false,
    message: 'Checking...'
  };

  constructor(private flyWireApi: FlywireApiService) {}

  ngOnInit() {
    // Only auto-check health in browser environment, not during build
    if (typeof window !== 'undefined' && window.location) {
      this.checkHealth();
    }
  }

  async checkHealth() {
    this.isChecking = true;
    
    try {
      // Check authentication status
      this.flyWireApi.isAuthenticated().subscribe(isAuth => {
        this.authStatus.authenticated = isAuth;
        this.authStatus.message = isAuth ? 'CAVE token active' : 'No CAVE token';
      });
      
      // If authenticated, test API connectivity
      if (this.authStatus.authenticated) {
        this.testApiConnectivity();
      } else {
        this.setDisconnectedStatus();
      }
      
    } catch (error) {
      console.error('Health check failed:', error);
      this.setErrorStatus();
    } finally {
      this.isChecking = false;
    }
  }
  
  private testApiConnectivity() {
    // Test with a simple neuron search
    this.flyWireApi.searchLarvalMechanosensoryNeurons().subscribe({
      next: (neurons) => {
        this.flywireStatus.connected = true;
        this.flywireStatus.message = 'Connected to FlyWire CAVE';
        
        this.apiStatus.available = true;
        this.apiStatus.message = 'All endpoints accessible';
        
        this.dataStatus.ready = true;
        this.dataStatus.message = `Found ${neurons.length} larval neurons`;
      },
      error: (error) => {
        this.flywireStatus.connected = false;
        this.flywireStatus.message = 'Connection failed';
        
        this.apiStatus.available = false;
        this.apiStatus.message = error.message;
        
        this.dataStatus.ready = false;
        this.dataStatus.message = 'Data unavailable';
      }
    });
  }
  
  private setDisconnectedStatus() {
    this.flywireStatus.connected = false;
    this.flywireStatus.message = 'Authentication required';
    
    this.apiStatus.available = false;
    this.apiStatus.message = 'CAVE token needed';
    
    this.dataStatus.ready = false;
    this.dataStatus.message = 'Cannot access data';
  }
  
  private setErrorStatus() {
    this.flywireStatus.connected = false;
    this.flywireStatus.message = 'Health check error';
    
    this.apiStatus.available = false;
    this.apiStatus.message = 'Unknown status';
    
    this.dataStatus.ready = false;
    this.dataStatus.message = 'Unknown status';
  }
  
  resetConnection() {
    // Clear authentication and reset status
    localStorage.removeItem('flywire_cave_token');
    
    this.authStatus.authenticated = false;
    this.authStatus.message = 'Token cleared';
    
    this.setDisconnectedStatus();
  }
} 