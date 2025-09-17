import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ResumeParserService } from '../../services/resume-parser.service';
import { ResumeData } from '../../models/resume.model';

@Component({
  selector: 'app-upload-resume',
  imports: [MatIconModule, CommonModule],
  templateUrl: './upload-resume.html',
  styleUrl: './upload-resume.scss',
})
export class UploadResume {
  uploading = false;
  fileUploaded = false;

  constructor(private resumeParserService: ResumeParserService, private cdr: ChangeDetectorRef) {}

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }
    try {
      // this.uploading = true;
      // this.cdr.detectChanges(); // <-- Trigger change detection after state change

      let resumeData = await this.resumeParserService.parseResumeFromFile(file);

      this.fileUploaded = true;
      // this.uploading = false;
      this.cdr.detectChanges(); // <-- Trigger change detection after state change
    } catch (error) {
      // this.uploading = false;
      this.cdr.detectChanges(); // <-- Trigger change detection after state change
      console.error('Error parsing resume:', error);
      alert('Failed to parse resume. Please try again later.');
      return;
    }
  }

  onStart() {
    // Implement your start logic here
    alert('Starting process!');
  }
}
