import { Component, ElementRef, OnInit, OnDestroy, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { MechanosensoryData } from '../services/flywire-api.service';
import * as THREE from 'three';

@Component({
  selector: 'app-behavioral-arena',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatCardModule,
    MatProgressBarModule,
    FormsModule
  ],
  template: `
    <mat-card class="arena-viewer-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>bug_report</mat-icon>
          3D Behavioral Arena
        </mat-card-title>
        <mat-card-subtitle>
          2nd Instar Larval Movement & Stimulus Visualization
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="viewer-container">
          <canvas #arenaCanvas class="arena-canvas"></canvas>
          
          <div class="controls-overlay">
            <div class="control-group">
              <button mat-mini-fab color="primary" (click)="resetView()" matTooltip="Reset View">
                <mat-icon>camera_alt</mat-icon>
              </button>
              <button mat-mini-fab color="accent" (click)="toggleAnimation()" matTooltip="Toggle Animation">
                <mat-icon>{{isAnimating ? 'pause' : 'play_arrow'}}</mat-icon>
              </button>
              <button mat-mini-fab (click)="toggleTrail()" matTooltip="Toggle Movement Trail">
                <mat-icon>timeline</mat-icon>
              </button>
              <button mat-mini-fab (click)="toggleStimuli()" matTooltip="Toggle Stimuli">
                <mat-icon>flash_on</mat-icon>
              </button>
            </div>
            
            <div class="slider-group">
              <label>Temporal Position (s)</label>
              <mat-slider min="0" [max]="maxTime" step="0.1">
                <input matSliderThumb [(ngModel)]="currentTime" (ngModelChange)="seekToTime($event)">
              </mat-slider>
            </div>
            
            <div class="slider-group">
              <label>Movement Speed</label>
              <mat-slider min="0.1" max="3" step="0.1">
                <input matSliderThumb [(ngModel)]="playbackSpeed" (ngModelChange)="updatePlaybackSpeed($event)">
              </mat-slider>
            </div>
          </div>
          
          <div class="stats-overlay" *ngIf="showStats">
            <div class="stat-item">
              <span class="stat-label">Time:</span>
              <span class="stat-value">{{currentTime.toFixed(1)}}s</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Turn Rate:</span>
              <span class="stat-value">{{getCurrentTurnRate().toFixed(2)}}°/s</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">CO2 Level:</span>
              <span class="stat-value">{{getCurrentCO2().toFixed(2)}}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Optogenetic:</span>
              <span class="stat-value">{{getCurrentOptogenetic() ? 'ON' : 'OFF'}}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">FPS:</span>
              <span class="stat-value">{{fps}}</span>
            </div>
          </div>
          
          <div class="fem-overlay" *ngIf="femData.length > 0">
            <div class="fem-info">
              <span class="fem-label">FEM Analysis:</span>
              <div class="fem-details">
                <span>Peak: {{getPeakTime()}}s ({{getPeakMagnitude()}})</span>
                <span>Force: {{getCurrentMechanicalForce().toFixed(2)}}</span>
              </div>
            </div>
          </div>
        </div>
        
        <mat-progress-bar *ngIf="isLoading" mode="indeterminate" color="accent"></mat-progress-bar>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .arena-viewer-card {
      width: 100%;
      height: 600px;
      margin: 20px 0;
    }
    
    .viewer-container {
      position: relative;
      width: 100%;
      height: 500px;
      background: #001122;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .arena-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    
    .controls-overlay {
      position: absolute;
      top: 16px;
      left: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      z-index: 10;
    }
    
    .control-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .slider-group {
      background: rgba(255, 255, 255, 0.95);
      padding: 12px;
      border-radius: 4px;
      min-width: 200px;
    }
    
    .slider-group label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #333;
    }
    
    .stats-overlay {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10;
    }
    
    .stat-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      min-width: 120px;
    }
    
    .stat-label {
      margin-right: 12px;
    }
    
    .stat-value {
      font-weight: bold;
      color: #4CAF50;
    }
    
    .fem-overlay {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: rgba(255, 152, 0, 0.9);
      color: white;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10;
    }
    
    .fem-label {
      font-weight: bold;
      display: block;
      margin-bottom: 4px;
    }
    
    .fem-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-family: monospace;
    }
  `]
})
export class BehavioralArenaComponent implements OnInit, OnDestroy {
  @ViewChild('arenaCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() femData: MechanosensoryData[] = [];
  @Input() showStats: boolean = true;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private arenaGroup!: THREE.Group;
  private larva!: THREE.Group;
  private stimulusGroup!: THREE.Group;
  private trailGroup!: THREE.Group;
  private animationId!: number;
  private clock = new THREE.Clock();

  // Control properties
  currentTime: number = 0;
  maxTime: number = 30;
  playbackSpeed: number = 1.0;
  isAnimating: boolean = true;
  isLoading: boolean = false;
  showTrail: boolean = true;
  showStimuli: boolean = true;
  
  // Stats
  fps: number = 0;
  private frameCount: number = 0;
  private lastTime: number = 0;

  // Larval movement data
  private larvaePositions: THREE.Vector3[] = [];
  private larvaeRotations: number[] = [];

  ngOnInit() {
    this.initThreeJS();
    this.createArenaEnvironment();
    this.createLarva();
    this.createStimuli();
    this.initMovementData();
    this.startRenderLoop();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThreeJS() {
    // Scene setup - darker background for behavioral arena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x001122);
    this.scene.fog = new THREE.Fog(0x001122, 5, 15);

    // Camera setup - overhead view for behavioral tracking
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.canvasRef.nativeElement.clientWidth / this.canvasRef.nativeElement.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 8, 8);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvasRef.nativeElement,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(
      this.canvasRef.nativeElement.clientWidth,
      this.canvasRef.nativeElement.clientHeight
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting for arena
    const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Add arena lighting
    const spotLight = new THREE.SpotLight(0x88ccff, 0.5);
    spotLight.position.set(0, 8, 0);
    spotLight.target.position.set(0, 0, 0);
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);
  }

  private createArenaEnvironment() {
    this.arenaGroup = new THREE.Group();
    
    // Arena floor (petri dish or experimental chamber)
    const floorGeometry = new THREE.CircleGeometry(4, 32);
    const floorMaterial = new THREE.MeshLambertMaterial({
      color: 0x333344,
      transparent: true,
      opacity: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.arenaGroup.add(floor);

    // Arena walls
    const wallGeometry = new THREE.CylinderGeometry(4, 4, 0.5, 32, 1, true);
    const wallMaterial = new THREE.MeshLambertMaterial({
      color: 0x666677,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = 0.25;
    this.arenaGroup.add(walls);

    // Grid markings for measurement
    this.createGridMarkings();
    
    this.scene.add(this.arenaGroup);
  }

  private createGridMarkings() {
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x445566,
      transparent: true,
      opacity: 0.3
    });

    // Concentric circles for distance measurement
    for (let radius = 1; radius <= 3; radius++) {
      const circleGeometry = new THREE.RingGeometry(radius - 0.01, radius + 0.01, 32);
      const circle = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({
        color: 0x445566,
        transparent: true,
        opacity: 0.2
      }));
      circle.rotation.x = -Math.PI / 2;
      circle.position.y = 0.01;
      this.arenaGroup.add(circle);
    }
  }

  private createLarva() {
    this.larva = new THREE.Group();
    
    // Larval body (2nd instar - small, segmented)
    const bodyGeometry = new THREE.CapsuleGeometry(0.02, 0.1, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0xffdd88,
      shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    this.larva.add(body);

    // Head (slightly larger)
    const headGeometry = new THREE.SphereGeometry(0.03, 8, 6);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0xffcc66,
      shininess: 50
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.z = 0.06;
    head.castShadow = true;
    this.larva.add(head);

    // Movement trail group
    this.trailGroup = new THREE.Group();
    this.scene.add(this.trailGroup);

    this.larva.position.set(0, 0.05, 0);
    this.scene.add(this.larva);
  }

  private createStimuli() {
    this.stimulusGroup = new THREE.Group();

    // CO2 stimulus source
    const co2Geometry = new THREE.SphereGeometry(0.1, 8, 6);
    const co2Material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8
    });
    const co2Source = new THREE.Mesh(co2Geometry, co2Material);
    co2Source.position.set(2, 0.1, 2);
    co2Source.userData = { type: 'co2' };
    this.stimulusGroup.add(co2Source);

    // Optogenetic light source
    const lightGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      transparent: true,
      opacity: 0.8
    });
    const lightSource = new THREE.Mesh(lightGeometry, lightMaterial);
    lightSource.position.set(-1.5, 0.5, -1.5);
    lightSource.rotation.x = Math.PI;
    lightSource.userData = { type: 'optogenetic' };
    this.stimulusGroup.add(lightSource);

    // Mechanical stimulus probe
    const probeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const probeMaterial = new THREE.MeshLambertMaterial({
      color: 0x888888
    });
    const probe = new THREE.Mesh(probeGeometry, probeMaterial);
    probe.position.set(0, 0.5, -2);
    probe.userData = { type: 'mechanical' };
    this.stimulusGroup.add(probe);

    this.scene.add(this.stimulusGroup);
  }

  private initMovementData() {
    if (this.femData.length > 0) {
      this.maxTime = Math.max(...this.femData.map(d => d.timestamp));
      this.generateLarvalTrajectory();
    } else {
      // Generate demo movement pattern
      this.generateDemoTrajectory();
    }
  }

  private generateLarvalTrajectory() {
    this.larvaePositions = [];
    this.larvaeRotations = [];

    for (const dataPoint of this.femData) {
      // Convert turn rate to position changes
      const turnRate = dataPoint.turnRate[dataPoint.turnRate.length - 1] || 0;
      const time = dataPoint.timestamp;
      
      // Simple integration of turn rate to position
      const radius = 1 + Math.sin(time * 0.5) * 0.5;
      const angle = time * 0.2 + turnRate * 0.01;
      
      const position = new THREE.Vector3(
        radius * Math.cos(angle),
        0.05,
        radius * Math.sin(angle)
      );
      
      this.larvaePositions.push(position);
      this.larvaeRotations.push(angle);
    }
  }

  private generateDemoTrajectory() {
    this.larvaePositions = [];
    this.larvaeRotations = [];
    
    const steps = 300;
    for (let i = 0; i < steps; i++) {
      const time = (i / steps) * this.maxTime;
      const radius = 1.5 + Math.sin(time * 0.3) * 0.8;
      const angle = time * 0.4 + Math.sin(time * 0.7) * 0.5;
      
      const position = new THREE.Vector3(
        radius * Math.cos(angle),
        0.05,
        radius * Math.sin(angle)
      );
      
      this.larvaePositions.push(position);
      this.larvaeRotations.push(angle);
    }
  }

  private startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      if (this.isAnimating) {
        this.updateAnimation();
      }
      
      this.updateStats();
      this.updateStimulusStates();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private updateAnimation() {
    const deltaTime = this.clock.getDelta();
    this.currentTime += deltaTime * this.playbackSpeed;
    
    if (this.currentTime > this.maxTime) {
      this.currentTime = 0; // Loop animation
    }
    
    this.updateLarvalPosition();
    this.updateMovementTrail();
  }

  private updateLarvalPosition() {
    if (this.larvaePositions.length === 0) return;
    
    const timeIndex = Math.floor((this.currentTime / this.maxTime) * this.larvaePositions.length);
    const clampedIndex = Math.min(timeIndex, this.larvaePositions.length - 1);
    
    if (this.larvaePositions[clampedIndex]) {
      this.larva.position.copy(this.larvaePositions[clampedIndex]);
      this.larva.rotation.y = this.larvaeRotations[clampedIndex] || 0;
    }
  }

  private updateMovementTrail() {
    if (!this.showTrail) return;
    
    // Add current position to trail
    const currentPos = this.larva.position.clone();
    currentPos.y = 0.02; // Slightly above ground
    
    // Create trail point
    const trailGeometry = new THREE.SphereGeometry(0.01, 4, 3);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.6
    });
    const trailPoint = new THREE.Mesh(trailGeometry, trailMaterial);
    trailPoint.position.copy(currentPos);
    
    this.trailGroup.add(trailPoint);
    
    // Remove old trail points
    if (this.trailGroup.children.length > 100) {
      const oldPoint = this.trailGroup.children[0];
      this.trailGroup.remove(oldPoint);
    }
  }

  private updateStimulusStates() {
    if (this.femData.length === 0) return;
    
    const currentData = this.getCurrentFemData();
    if (!currentData) return;
    
    // Update CO2 stimulus
    const co2Source = this.stimulusGroup.children.find(c => c.userData['type'] === 'co2') as THREE.Mesh;
    if (co2Source && co2Source.material instanceof THREE.MeshBasicMaterial) {
      const co2Level = this.getCurrentCO2();
      co2Source.material.color.setRGB(0, co2Level * 0.8, 0);
      co2Source.scale.setScalar(1 + co2Level * 0.3);
    }
    
    // Update optogenetic stimulus
    const lightSource = this.stimulusGroup.children.find(c => c.userData['type'] === 'optogenetic') as THREE.Mesh;
    if (lightSource && lightSource.material instanceof THREE.MeshBasicMaterial) {
      const isOn = currentData.optogeneticStimulus;
      lightSource.material.color.setRGB(0, 0, isOn ? 0.8 : 0.1);
      lightSource.material.opacity = isOn ? 1.0 : 0.3;
      lightSource.visible = this.showStimuli;
    }
  }

  private updateStats() {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  // Data access methods
  private getCurrentFemData(): MechanosensoryData | null {
    if (this.femData.length === 0) return null;
    
    // Find closest data point to current time
    let closest = this.femData[0];
    let minDiff = Math.abs(closest.timestamp - this.currentTime);
    
    for (const data of this.femData) {
      const diff = Math.abs(data.timestamp - this.currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = data;
      }
    }
    
    return closest;
  }

  getCurrentTurnRate(): number {
    const data = this.getCurrentFemData();
    return data ? (data.turnRate[data.turnRate.length - 1] || 0) : 0;
  }

  getCurrentCO2(): number {
    const data = this.getCurrentFemData();
    return data ? (data.co2Response[data.co2Response.length - 1] || 0) : 0;
  }

  getCurrentOptogenetic(): boolean {
    const data = this.getCurrentFemData();
    return data ? data.optogeneticStimulus : false;
  }

  getCurrentMechanicalForce(): number {
    const data = this.getCurrentFemData();
    return data ? data.femParameters.mechanicalForce : 0;
  }

  getPeakTime(): string {
    return this.femData.length > 0 ? this.femData[0].peakTime.toFixed(1) : '0.0';
  }

  getPeakMagnitude(): string {
    return this.femData.length > 0 ? this.femData[0].magnitude.toFixed(2) : '0.00';
  }

  // Control methods
  resetView() {
    this.camera.position.set(0, 8, 8);
    this.camera.lookAt(0, 0, 0);
    this.currentTime = 0;
    this.clearTrail();
  }

  toggleAnimation() {
    this.isAnimating = !this.isAnimating;
  }

  toggleTrail() {
    this.showTrail = !this.showTrail;
    if (!this.showTrail) {
      this.clearTrail();
    }
  }

  toggleStimuli() {
    this.showStimuli = !this.showStimuli;
    this.stimulusGroup.visible = this.showStimuli;
  }

  seekToTime(time: number) {
    this.currentTime = time;
    this.clearTrail();
    this.updateLarvalPosition();
  }

  updatePlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
  }

  private clearTrail() {
    while (this.trailGroup.children.length > 0) {
      this.trailGroup.remove(this.trailGroup.children[0]);
    }
  }
} 