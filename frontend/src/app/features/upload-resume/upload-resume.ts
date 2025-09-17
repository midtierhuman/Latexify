import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-upload-resume',
  imports: [MatIconModule, CommonModule],
  templateUrl: './upload-resume.html',
  styleUrl: './upload-resume.scss',
})
export class UploadResume {
  uploading = false;
  fileUploaded = false;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    this.uploading = true;
    // Simulate upload
    setTimeout(() => {
      this.uploading = false;
      this.fileUploaded = true;
    }, 1200);
  }

  onStart() {
    // Implement your start logic here
    alert('Starting process!');
  }
}
