import { Injectable } from '@angular/core';
import { ResumeData } from '../models/resume.model';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

@Injectable({
  providedIn: 'root',
})
export class ResumeParserService {
  async parseResumeFromFile(file: File): Promise<ResumeData> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const text = await this.extractTextFromPDF(arrayBuffer);
      return this.parseTextToResumeData(text);
    } catch (error) {
      console.error('Error parsing resume:', error);
      throw new Error('Failed to parse resume file');
    }
  }

  async parseResumeFromURL(url: string): Promise<ResumeData> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const text = await this.extractTextFromPDF(arrayBuffer);
      return this.parseTextToResumeData(text);
    } catch (error) {
      console.error('Error parsing resume from URL:', error);
      throw new Error('Failed to parse resume from URL');
    }
  }

  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private async extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  }

  private parseTextToResumeData(text: string): ResumeData {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return {
      name: this.extractName(lines),
      phone: this.extractPhone(text),
      email: this.extractEmail(text),
      linkedin: this.extractLinkedIn(text),
      github: this.extractGitHub(text),
      education: this.extractEducation(lines),
      experience: this.extractExperience(lines),
      projects: this.extractProjects(lines),
      skills: this.extractSkills(lines),
      certifications: this.extractCertifications(lines),
    };
  }

  private extractName(lines: string[]): string {
    // First non-empty line is typically the name
    return lines[0] || 'Unknown';
  }

  private extractPhone(text: string): string {
    const phoneRegex = /[\+]?[1-9]?[\-\.\s]?\(?[0-9]{3}\)?[\-\.\s]?[0-9]{3}[\-\.\s]?[0-9]{4,6}/g;
    const match = text.match(phoneRegex);
    return match ? match[0].trim() : '';
  }

  private extractEmail(text: string): string {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
  }

  private extractLinkedIn(text: string): string {
    const linkedinRegex =
      /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=)([a-zA-Z0-9\-]+)/g;
    const match = text.match(linkedinRegex);
    return match ? match[0] : '';
  }

  private extractGitHub(text: string): string {
    const githubRegex = /(?:github\.com\/)([a-zA-Z0-9\-]+)/g;
    const match = text.match(githubRegex);
    return match ? match[0] : '';
  }

  private extractEducation(lines: string[]): any[] {
    const educationSection = this.extractSection(lines, 'EDUCATION');
    const education: any[] = [];

    if (educationSection.length === 0) return education;

    let currentEducation: any = null;

    for (const line of educationSection) {
      // Check if line contains degree information
      if (
        line.includes('B.Tech') ||
        line.includes('M.Tech') ||
        line.includes('B.E.') ||
        line.includes('M.E.') ||
        line.includes('Bachelor') ||
        line.includes('Master') ||
        line.includes('Diploma') ||
        line.includes('Ph.D')
      ) {
        if (currentEducation) {
          education.push(currentEducation);
        }

        const cgpaMatch = line.match(/CGPA[:\s]+([0-9.]+)/i);
        const durationMatch = line.match(/(\w{3}\s+\d{4}[\s\-–]+\w{3}\s+\d{4})/);

        currentEducation = {
          degree: this.extractDegreeInfo(line),
          college: this.extractCollegeName(line),
          duration: durationMatch ? durationMatch[1] : '',
          cgpa: cgpaMatch ? cgpaMatch[1] : '',
          location: this.extractLocation(line),
        };
      } else if (currentEducation && this.isCollegeName(line)) {
        currentEducation.college = line;
      } else if (currentEducation && this.isLocation(line)) {
        currentEducation.location = line;
      }
    }

    if (currentEducation) {
      education.push(currentEducation);
    }

    return education;
  }

  private extractExperience(lines: string[]): any[] {
    const experienceSection = this.extractSection(lines, 'EXPERIENCE');
    const experience: any[] = [];

    if (experienceSection.length === 0) return experience;

    let currentExperience: any = null;

    for (const line of experienceSection) {
      const durationMatch = line.match(/(\w{3}\s+\d{4}[\s\-–]+(?:\w{3}\s+\d{4}|Present))/);

      if (durationMatch && this.isJobTitle(line)) {
        if (currentExperience) {
          experience.push(currentExperience);
        }

        currentExperience = {
          title: this.extractJobTitle(line),
          company: '',
          duration: durationMatch[1],
          details: [],
        };
      } else if (currentExperience && this.isCompanyName(line)) {
        currentExperience.company = line;
      } else if (
        currentExperience &&
        (line.startsWith('–') || line.startsWith('-') || line.startsWith('•'))
      ) {
        currentExperience.details.push(line.replace(/^[–\-•]\s*/, ''));
      }
    }

    if (currentExperience) {
      experience.push(currentExperience);
    }

    return experience;
  }

  private extractProjects(lines: string[]): any[] {
    const projectsSection = this.extractSection(lines, 'PROJECTS');
    const projects: any[] = [];

    if (projectsSection.length === 0) return projects;

    let currentProject: any = null;

    for (const line of projectsSection) {
      const yearMatch = line.match(/\b(20\d{2})\b/);

      if (yearMatch && !line.startsWith('–') && !line.startsWith('-') && !line.startsWith('•')) {
        if (currentProject) {
          projects.push(currentProject);
        }

        currentProject = {
          title: line.replace(/\b20\d{2}\b/, '').trim(),
          year: yearMatch[1],
          description: [],
        };
      } else if (
        currentProject &&
        (line.startsWith('–') || line.startsWith('-') || line.startsWith('•'))
      ) {
        currentProject.description.push(line.replace(/^[–\-•]\s*/, ''));
      }
    }

    if (currentProject) {
      projects.push(currentProject);
    }

    return projects;
  }

  private extractSkills(lines: string[]): any {
    const skillsSection = this.extractSection(lines, 'TECHNICAL SKILLS');

    if (skillsSection.length === 0) return {};

    const skills: any = {};

    for (const line of skillsSection) {
      if (line.includes(':')) {
        const [category, skillList] = line.split(':');
        skills[category.trim()] = skillList.trim();
      } else if (!line.includes(':') && skillsSection.length === 1) {
        // If it's a single line without categories
        return line.split(',').map((skill) => skill.trim());
      }
    }

    return Object.keys(skills).length > 0 ? skills : skillsSection;
  }

  private extractCertifications(lines: string[]): string[] {
    const certificationsSection = this.extractSection(lines, 'CERTIFICATIONS');

    return certificationsSection
      .filter((line) => line.startsWith('•') || line.trim().length > 0)
      .map((line) => line.replace(/^[•]\s*/, '').trim());
  }

  private extractSection(lines: string[], sectionName: string): string[] {
    const sectionIndex = lines.findIndex((line) =>
      line.toUpperCase().includes(sectionName.toUpperCase())
    );

    if (sectionIndex === -1) return [];

    const nextSectionIndex = lines.findIndex(
      (line, index) =>
        index > sectionIndex &&
        this.isSectionHeader(line) &&
        !line.toUpperCase().includes(sectionName.toUpperCase())
    );

    const endIndex = nextSectionIndex === -1 ? lines.length : nextSectionIndex;
    return lines.slice(sectionIndex + 1, endIndex);
  }

  private isSectionHeader(line: string): boolean {
    const headers = [
      'EDUCATION',
      'EXPERIENCE',
      'PROJECTS',
      'TECHNICAL SKILLS',
      'CERTIFICATIONS',
      'SKILLS',
    ];
    return headers.some((header) => line.toUpperCase().includes(header));
  }

  private isJobTitle(line: string): boolean {
    const jobTitles = [
      'engineer',
      'developer',
      'manager',
      'analyst',
      'consultant',
      'specialist',
      'lead',
      'senior',
      'junior',
      'intern',
    ];
    return jobTitles.some((title) => line.toLowerCase().includes(title));
  }

  private isCompanyName(line: string): boolean {
    const companyKeywords = [
      'technology',
      'solutions',
      'systems',
      'software',
      'limited',
      'ltd',
      'inc',
      'corp',
      'pvt',
      'private',
    ];
    return (
      companyKeywords.some((keyword) => line.toLowerCase().includes(keyword)) ||
      (line.length > 3 && line.length < 50 && !line.includes('–') && !line.includes('-'))
    );
  }

  private isCollegeName(line: string): boolean {
    const collegeKeywords = [
      'college',
      'university',
      'institute',
      'school',
      'academy',
      'technology',
    ];
    return collegeKeywords.some((keyword) => line.toLowerCase().includes(keyword));
  }

  private isLocation(line: string): boolean {
    // Simple location detection - could be enhanced
    return line.includes(',') && line.split(',').length <= 3 && line.length < 50;
  }

  private extractDegreeInfo(line: string): string {
    const degreeMatch = line.match(
      /(B\.Tech|M\.Tech|B\.E\.|M\.E\.|Bachelor|Master|Diploma|Ph\.D)[^,]*/i
    );
    return degreeMatch ? degreeMatch[0].trim() : line;
  }

  private extractCollegeName(line: string): string {
    // Remove degree info, CGPA, and duration to get college name
    return line
      .replace(/(B\.Tech|M\.Tech|B\.E\.|M\.E\.|Bachelor|Master|Diploma|Ph\.D)[^,]*/i, '')
      .replace(/CGPA[:\s]+[0-9.]+/i, '')
      .replace(/\w{3}\s+\d{4}[\s\-–]+\w{3}\s+\d{4}/g, '')
      .replace(/[,\-–]/g, '')
      .trim();
  }

  private extractJobTitle(line: string): string {
    // Remove duration from the line to get job title
    return line.replace(/\w{3}\s+\d{4}[\s\-–]+(?:\w{3}\s+\d{4}|Present)/g, '').trim();
  }

  private extractLocation(line: string): string {
    const locationMatch = line.match(/([A-Za-z\s]+,\s*[A-Za-z\s]+)$/);
    return locationMatch ? locationMatch[1].trim() : '';
  }

  // Utility method to validate parsed data
  validateResumeData(data: ResumeData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name === 'Unknown') {
      errors.push('Name could not be extracted');
    }

    if (!data.email) {
      errors.push('Email could not be extracted');
    }

    if (!data.phone) {
      errors.push('Phone number could not be extracted');
    }

    if (!data.education || data.education.length === 0) {
      errors.push('Education information could not be extracted');
    }

    if (!data.experience || data.experience.length === 0) {
      errors.push('Experience information could not be extracted');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
