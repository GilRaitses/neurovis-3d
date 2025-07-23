import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-toolbar color="primary" class="main-toolbar">
      <span class="toolbar-title">
        <mat-icon>science</mat-icon>
        NeuroVis 3D - Mechanosensation Analysis
      </span>
      
      <span class="toolbar-spacer"></span>
      
      <nav class="main-navigation">
        <a mat-button routerLink="/dashboard" routerLinkActive="active-route">
          <mat-icon>dashboard</mat-icon>
          Analytics Dashboard
        </a>
        <a mat-button routerLink="/tracks" routerLinkActive="active-route">
          <mat-icon>timeline</mat-icon>
          Track Manager
        </a>
        <a mat-button routerLink="/3d" routerLinkActive="active-route">
          <mat-icon>3d_rotation</mat-icon>
          3D Visualization
        </a>
      </nav>
    </mat-toolbar>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .main-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .toolbar-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .main-navigation {
      display: flex;
      gap: 8px;
    }

    .main-navigation a {
      display: flex;
      align-items: center;
      gap: 4px;
      color: white;
      text-decoration: none;
    }

    .active-route {
      background-color: rgba(255, 255, 255, 0.2) !important;
    }

    .main-content {
      min-height: calc(100vh - 64px);
      background-color: #f5f5f5;
    }

    @media (max-width: 768px) {
      .toolbar-title span {
        display: none;
      }
      
      .main-navigation a span {
        display: none;
      }
    }
  `]
})
export class AppComponent {
  title = 'NeuroVis 3D';
} 