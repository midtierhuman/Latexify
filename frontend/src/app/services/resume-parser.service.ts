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

  // Simulate an API call to parse a resume from a URL
  async parseResumeFromURL(url: string): Promise<ResumeData> {
    // Replace this with your actual API call
    return this.dummyResumeData();
  }

  // Simulate an API call to parse manual text input
  async parseFromManualInput(resumeText: string): Promise<ResumeData> {
    // Replace this with your actual API call
    return this.dummyResumeData();
  }

  // Dummy data for demonstration
  private dummyResumeData(): ResumeData {
    return {
      name: 'John Doe',
      phone: '+1 234-567-8901',
      email: 'john.doe@email.com',
      linkedin: 'linkedin.com/in/johndoe',
      github: 'github.com/johndoe',
      education: [
        {
          degree: 'B.Tech Computer Science',
          college: 'ABC University',
          duration: 'Aug 2016 – May 2020',
          cgpa: '8.5',
        },
      ],
      experience: [
        {
          title: 'Software Engineer',
          company: 'Tech Solutions Ltd',
          duration: 'Jun 2020 – Present',
          details: ['Developed web applications', 'Led a team of 5 engineers'],
        },
      ],
      projects: [
        {
          title: 'Resume Parser',
          description: ['Built a resume parsing tool using Angular and Python'],
        },
      ],
      skills: ['Angular', 'TypeScript', 'Python', 'Django'],
      certifications: ['AWS Certified Developer'],
    };
  }
}
