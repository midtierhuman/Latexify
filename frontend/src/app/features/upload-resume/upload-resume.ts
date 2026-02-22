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
    this.fileUploaded.set(false);
    try {
      const data = await this.resumeParserService.parseResumeFromFile(file);
      if (data.name.startsWith('Error:')) {
        alert('The PDF could not be parsed. Try a different file or add your details manually in the builder.');
        return;
      }
      this.resumeData.set(data);
      this.fileUploaded.set(true);
    } catch (error: unknown) {
      const err = error as { error?: { detail?: string }; status?: number };
      const detail = err?.error?.detail;
      const message =
        typeof detail === 'string'
          ? detail
          : err?.status === 0
            ? 'Cannot reach the backend. Start it with: uvicorn main:app --port 8001'
            : 'Failed to parse resume. Try a different PDF or add details manually in the builder.';
      alert(message);
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
