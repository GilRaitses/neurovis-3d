import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SlideViewerComponent } from './components/slide-viewer.component';
import { TrackIdManagerComponent } from './components/track-id-manager.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: SlideViewerComponent },
  { path: 'tracks', component: TrackIdManagerComponent },
  { path: '3d', component: TrackIdManagerComponent }, // 3D view in track manager
  { path: 'analytics', component: SlideViewerComponent },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    useHash: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { } 