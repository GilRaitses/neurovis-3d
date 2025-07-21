import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlyWireApiService } from '../services/flywire-api.service';

@Component({
  selector: 'nv3d-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="health-container">
      <h2>System Health Check</h2>
      
      <div class="health-checks">
        <div class="health-item">
          <div class="health-label">Angular Application</div>
          <div class="health-status success">✅ Running</div>
        </div>
        
        <div class="health-item">
          <div class="health-label">FlyWire Codex API</div>
          <div class="health-status" [ngClass]="flyWireStatus">
            {{ flyWireMessage }}
          </div>
        </div>
        
        <div class="health-item">
          <div class="health-label">Three.js WebGL</div>
          <div class="health-status" [ngClass]="webglStatus">
            {{ webglMessage }}
          </div>
        </div>
      </div>
      
      <div class="actions">
        <button (click)="checkServices()" [disabled]="checking">
          {{ checking ? 'Checking...' : 'Refresh Health Check' }}
        </button>
      </div>
      
      <div class="info">
        <h3>Next Steps</h3>
        <ul>
          <li>✅ Basic Angular app is running</li>
          <li>🔄 Testing FlyWire API connectivity</li>
          <li>🔄 Verifying WebGL support for 3D rendering</li>
          <li>⏳ Ready for neural circuit visualization</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .health-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .health-checks {
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 2rem 0;
    }
    .health-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .health-item:last-child {
      border-bottom: none;
    }
    .health-label {
      font-weight: 500;
    }
    .health-status {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: bold;
    }
    .success {
      background: rgba(76, 175, 80, 0.2);
      color: #4CAF50;
    }
    .error {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }
    .checking {
      background: rgba(255, 193, 7, 0.2);
      color: #FFC107;
    }
    .actions {
      text-align: center;
      margin: 2rem 0;
    }
    button {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 1rem 2rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    button:hover:not(:disabled) {
      background: rgba(255,255,255,0.3);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .info {
      background: rgba(255,255,255,0.05);
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
    }
    .info ul {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }
    .info li {
      margin: 0.5rem 0;
    }
  `]
})
export class HealthComponent implements OnInit {
  flyWireStatus = 'checking';
  flyWireMessage = '🔄 Checking...';
  webglStatus = 'checking';
  webglMessage = '🔄 Checking...';
  checking = false;

  constructor(private flyWireApi: FlyWireApiService) {}

  ngOnInit() {
    this.checkServices();
  }

  async checkServices() {
    this.checking = true;
    
    // Check FlyWire API
    try {
      await this.flyWireApi.checkConnection().toPromise();
      this.flyWireStatus = 'success';
      this.flyWireMessage = '✅ Connected';
    } catch (error) {
      this.flyWireStatus = 'error';
      this.flyWireMessage = '❌ Connection Failed';
    }
    
    // Check WebGL
    this.checkWebGL();
    
    this.checking = false;
  }

  private checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        this.webglStatus = 'success';
        this.webglMessage = '✅ WebGL Supported';
      } else {
        this.webglStatus = 'error';
        this.webglMessage = '❌ WebGL Not Available';
      }
    } catch (error) {
      this.webglStatus = 'error';
      this.webglMessage = '❌ WebGL Check Failed';
    }
  }
} 