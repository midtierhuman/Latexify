import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'about', pathMatch: 'full' }, // Add this line
  {
    path: 'resume-builder',
    loadComponent: () =>
      import('./features/resume-builder/resume-builder').then((m) => m.ResumeBuilder),
  },
  { path: 'about', loadComponent: () => import('./features/about/about').then((m) => m.About) },
  {
    path: 'upload-resume',
    loadComponent: () =>
      import('./features/upload-resume/upload-resume').then((m) => m.UploadResume),
  },
  // You can add more routes here
];
