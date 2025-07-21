import { Routes } from '@angular/router';
import { HealthComponent } from './components/health.component';

export const routes: Routes = [
  { path: '', redirectTo: '/health', pathMatch: 'full' },
  { path: 'health', component: HealthComponent },
  { path: '**', redirectTo: '/health' }
]; 