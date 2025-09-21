import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ResumeParserService } from '../../services/resume-parser.service';
import { Router } from '@angular/router';
import { ResumeData } from '../../models/resume.model';

@Component({
  selector: 'app-upload-resume',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  templateUrl: './upload-resume.html',
  styleUrl: './upload-resume.scss',
})
export class UploadResume {
  // Use signals
  uploading = signal(false);
  fileUploaded = signal(false);
  resumeData = signal<ResumeData | null>(null);

  constructor(private resumeParserService: ResumeParserService, private router: Router) {}

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    this.uploading.set(true);
    try {
      this.resumeData.set(await this.resumeParserService.parseResumeFromFile(file));
      console.log('Parsed resume data:', this.resumeData());
      this.fileUploaded.set(true);
    } catch (error) {
      console.error('Error parsing resume:', error);
      alert('Failed to parse resume. Please try again later.');
    } finally {
      this.uploading.set(false);
    }
  }

  onStart() {
    const data = this.resumeData();
    if (!data) {
      console.warn('No resume data; navigation skipped.');
      return;
    }
    this.routeTo('/resume-builder', data);
  }

  routeTo<T>(url: string, data?: T) {
    if (data == null) {
      this.router.navigate([url]);
      return;
    }
    this.router.navigate([url], { state: { data } });
  }
}
