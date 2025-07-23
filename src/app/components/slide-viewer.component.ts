import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-slide-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatSelectModule,
    FormsModule
  ],
  template: `
    <div class="slide-viewer">
      <!-- Slide Display -->
      <div class="slide-container">
        <img 
          [src]="getCurrentSlideUrl()" 
          [alt]="getCurrentSlideTitle()"
          class="slide-image"
          (load)="onSlideLoad()"
          (error)="onSlideError()">
        
        <div class="slide-overlay" *ngIf="isLoading">
          <div class="loading-spinner"></div>
        </div>
      </div>

      <!-- Controls -->
      <div class="controls-panel">
        <div class="playback-controls">
          <button mat-fab color="primary" (click)="togglePlayback()" class="play-button">
            <mat-icon>{{isPlaying ? 'pause' : 'play_arrow'}}</mat-icon>
          </button>
          
          <button mat-icon-button (click)="previousSlide()">
            <mat-icon>skip_previous</mat-icon>
          </button>
          
          <button mat-icon-button (click)="nextSlide()">
            <mat-icon>skip_next</mat-icon>
          </button>
        </div>

        <div class="slide-info">
          <span class="slide-counter">{{currentSlideIndex + 1}} / {{slides.length}}</span>
          <span class="slide-title">{{getCurrentSlideTitle()}}</span>
        </div>

        <div class="advanced-controls">
          <mat-slider min="0" [max]="slides.length - 1" step="1" class="slide-slider">
            <input matSliderThumb [(value)]="currentSlideIndex" (input)="onSlideChange()">
          </mat-slider>
          
          <div class="speed-control">
            <label>Speed:</label>
            <mat-select [(value)]="playbackSpeed" (selectionChange)="updateSpeed()">
              <mat-option value="3000">Slow (3s)</mat-option>
              <mat-option value="2000">Normal (2s)</mat-option>
              <mat-option value="1000">Fast (1s)</mat-option>
              <mat-option value="500">Very Fast (0.5s)</mat-option>
            </mat-select>
          </div>

          <div class="category-filter">
            <label>Category:</label>
            <mat-select [(value)]="selectedCategory" (selectionChange)="filterSlides()">
              <mat-option value="all">All Slides</mat-option>
              <mat-option value="figures">Paper Figures</mat-option>
              <mat-option value="tracks">Individual Tracks</mat-option>
              <mat-option value="experiments">Experiments</mat-option>
            </mat-select>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .slide-viewer {
      width: 100%;
      max-width: 100%;
      background: #000;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .slide-container {
      position: relative;
      width: 100%;
      height: 60vh;
      background: #111;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .slide-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    }

    .slide-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid #4ecdc4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .controls-panel {
      background: rgba(0, 0, 0, 0.9);
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .playback-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin-bottom: 20px;
    }

    .play-button {
      background: linear-gradient(45deg, #4ecdc4, #45b7d1) !important;
      color: white !important;
    }

    .slide-info {
      text-align: center;
      margin-bottom: 20px;
      color: #fff;
    }

    .slide-counter {
      font-size: 18px;
      font-weight: bold;
      color: #4ecdc4;
      margin-right: 15px;
    }

    .slide-title {
      font-size: 16px;
      opacity: 0.9;
    }

    .advanced-controls {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .slide-slider {
      flex: 1;
      min-width: 200px;
      --mdc-slider-active-track-color: #4ecdc4;
      --mdc-slider-inactive-track-color: rgba(255, 255, 255, 0.3);
      --mdc-slider-handle-color: #4ecdc4;
    }

    .speed-control, .category-filter {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fff;
    }

    .speed-control label, .category-filter label {
      font-size: 14px;
      color: #4ecdc4;
    }

    .speed-control mat-select, .category-filter mat-select {
      min-width: 120px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .slide-container {
        height: 50vh;
      }
      
      .advanced-controls {
        flex-direction: column;
        gap: 15px;
      }
      
      .slide-slider {
        min-width: 100%;
      }
    }
  `]
})
export class SlideViewerComponent implements OnInit, OnDestroy {
  slides: {filename: string, title: string, category: string}[] = [];
  filteredSlides: {filename: string, title: string, category: string}[] = [];
  currentSlideIndex = 0;
  isPlaying = false;
  playbackSpeed = 2000;
  selectedCategory = 'all';
  isLoading = false;
  private playbackInterval: any;

  ngOnInit() {
    this.initializeSlides();
    this.filterSlides();
  }

  ngOnDestroy() {
    this.stopPlayback();
  }

  initializeSlides() {
    // Paper figures
    const paperFigures = [
      'Figure1_Population_Overview.png',
      'Figure2_Temporal_Analysis.png', 
      'Figure3_Envelope_Modeling.png',
      'Figure4_Behavioral_Modes.png',
      'Figure5_Validation_Analysis.png',
      'Figure6_Comparative_Analysis.png',
      'SuppFig1_Individual_Trajectories.png',
      'SuppFig2_Statistical_Analysis.png'
    ].map(filename => ({
      filename,
      title: this.formatTitle(filename),
      category: 'figures'
    }));

    // Experiment composites
    const experiments = [
      'aggregate_composite.png',
      'experiment_1_composite.png',
      'experiment_2_composite.png'
    ].map(filename => ({
      filename,
      title: this.formatTitle(filename),
      category: 'experiments'
    }));

    // Individual tracks (first 10 for demo)
    const tracks = Array.from({length: 10}, (_, i) => ({
      filename: `track_${i + 1}_composite.png`,
      title: `Track ${i + 1} Analysis`,
      category: 'tracks'
    }));

    this.slides = [...paperFigures, ...experiments, ...tracks];
  }

  formatTitle(filename: string): string {
    return filename
      .replace('.png', '')
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  filterSlides() {
    if (this.selectedCategory === 'all') {
      this.filteredSlides = this.slides;
    } else {
      this.filteredSlides = this.slides.filter(slide => slide.category === this.selectedCategory);
    }
    
    // Reset to first slide of filtered set
    this.currentSlideIndex = 0;
  }

  getCurrentSlideUrl(): string {
    if (!this.filteredSlides.length) return '';
    return `assets/slides/${this.filteredSlides[this.currentSlideIndex].filename}`;
  }

  getCurrentSlideTitle(): string {
    if (!this.filteredSlides.length) return '';
    return this.filteredSlides[this.currentSlideIndex].title;
  }

  togglePlayback() {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  startPlayback() {
    this.isPlaying = true;
    this.playbackInterval = setInterval(() => {
      this.nextSlide();
    }, this.playbackSpeed);
  }

  stopPlayback() {
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  nextSlide() {
    if (this.currentSlideIndex < this.filteredSlides.length - 1) {
      this.currentSlideIndex++;
    } else {
      this.currentSlideIndex = 0; // Loop back to start
    }
  }

  previousSlide() {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    } else {
      this.currentSlideIndex = this.filteredSlides.length - 1; // Loop to end
    }
  }

  onSlideChange() {
    // Triggered by slider
    this.currentSlideIndex = Math.max(0, Math.min(this.currentSlideIndex, this.filteredSlides.length - 1));
  }

  updateSpeed() {
    if (this.isPlaying) {
      this.stopPlayback();
      this.startPlayback();
    }
  }

  onSlideLoad() {
    this.isLoading = false;
  }

  onSlideError() {
    this.isLoading = false;
    console.error('Failed to load slide:', this.getCurrentSlideUrl());
  }
} 