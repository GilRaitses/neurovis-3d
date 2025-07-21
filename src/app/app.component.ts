import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'nv3d-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>NeuroVis3D</h1>
        <p>Neural Circuit Visualization Platform</p>
      </header>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .app-header {
      text-align: center;
      padding: 2rem;
      background: rgba(0,0,0,0.2);
    }
    .app-header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 300;
    }
    .app-header p {
      margin: 0.5rem 0 0 0;
      opacity: 0.8;
    }
    .app-main {
      padding: 2rem;
    }
  `]
})
export class AppComponent {
  title = 'neurovis3d';
} 