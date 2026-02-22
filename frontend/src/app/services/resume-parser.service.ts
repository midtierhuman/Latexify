import { Injectable } from '@angular/core';
import { ResumeData } from '../models/resume.model';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ResumeParserService {
  constructor(private http: HttpClient) {}

  async parseResumeFromFile(file: File): Promise<ResumeData> {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${environment.apiUrl}/parse-resume`;
    return await firstValueFrom(this.http.post<ResumeData>(url, formData));
  }
}
