import { Routes } from '@angular/router';
import { ResumeBuilder } from './features/resume-builder/resume-builder';

export const routes: Routes = [
  { path: '', redirectTo: 'resume-builder', pathMatch: 'full' }, // Add this line
  { path: 'resume-builder', component: ResumeBuilder },
  // You can add more routes here
];
