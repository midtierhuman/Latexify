import { Routes } from '@angular/router';
import { ResumeBuilder } from './features/resume-builder/resume-builder';
import { About } from './features/about/about';

export const routes: Routes = [
  { path: '', redirectTo: 'about', pathMatch: 'full' }, // Add this line
  { path: 'resume-builder', component: ResumeBuilder },
  { path: 'about', component: About },
  // You can add more routes here
];
