import { Injectable } from '@angular/core';
import { ResumeData } from '../models/resume.model';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ResumeParserService {
  constructor(private http: HttpClient) {}

  // Simulate an API call to parse a resume file
  async parseResumeFromFile(file: File): Promise<ResumeData> {
    const formData = new FormData();
    formData.append('file', file);

    // Adjust the URL if your backend runs on a different port or host
    const url = 'http://127.0.0.1:8000/parse-resume';

    return await firstValueFrom(this.http.post<ResumeData>(url, formData));
  }
}
