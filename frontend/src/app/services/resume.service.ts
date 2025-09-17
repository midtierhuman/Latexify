import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ResumeData } from '../models/resume.model';

(pdfMake as any).vfs = pdfFonts.vfs;

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  generateResume(data: ResumeData) {
    const docDefinition: any = {
      pageMargins: [40, 40, 40, 40],
      fonts: {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf',
        },
      },
      content: [
        // Header with name centered
        {
          text: data.name,
          style: 'nameHeader',
          alignment: 'center',
          margin: [0, 0, 0, 8],
        },

        // Contact info centered
        {
          text: `${data.phone} | ${data.email} | ${data.linkedin} | ${data.github}`,
          style: 'contactInfo',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },

        // Education Section
        {
          text: 'EDUCATION',
          style: 'sectionHeader',
        },
        this.createSectionLine(),
        ...this.formatEducation(data.education),

        // Experience Section
        {
          text: 'EXPERIENCE',
          style: 'sectionHeader',
          margin: [0, 15, 0, 5],
        },
        this.createSectionLine(),
        ...this.formatExperience(data.experience),

        // Projects Section
        {
          text: 'PROJECTS',
          style: 'sectionHeader',
          margin: [0, 15, 0, 5],
        },
        this.createSectionLine(),
        ...this.formatProjects(data.projects),

        // Technical Skills Section
        {
          text: 'TECHNICAL SKILLS',
          style: 'sectionHeader',
          margin: [0, 15, 0, 5],
        },
        this.createSectionLine(),
        ...this.formatTechnicalSkills(data.skills),

        // Certifications Section
        {
          text: 'CERTIFICATIONS',
          style: 'sectionHeader',
          margin: [0, 15, 0, 5],
        },
        this.createSectionLine(),
        ...this.formatCertifications(data.certifications),
      ],

      styles: {
        nameHeader: {
          fontSize: 20,
          bold: true,
        },
        contactInfo: {
          fontSize: 9,
          color: '#333333',
        },
        sectionHeader: {
          fontSize: 11,
          bold: true,
          color: '#000000',
        },
        institutionHeader: {
          fontSize: 10,
          bold: true,
          margin: [0, 8, 0, 2],
        },
        degreeInfo: {
          fontSize: 9,
          italics: true,
          margin: [0, 0, 0, 2],
        },
        locationDate: {
          fontSize: 9,
          alignment: 'right',
          margin: [0, 0, 0, 2],
        },
        jobTitle: {
          fontSize: 10,
          bold: true,
          margin: [0, 8, 0, 1],
        },
        companyInfo: {
          fontSize: 9,
          italics: true,
          margin: [0, 0, 0, 3],
        },
        bulletPoint: {
          fontSize: 9,
          margin: [10, 1, 0, 1],
        },
        skillCategory: {
          fontSize: 9,
          bold: true,
          margin: [0, 5, 0, 2],
        },
        skillList: {
          fontSize: 9,
          margin: [0, 0, 0, 2],
        },
      },

      defaultStyle: {
        fontSize: 9,
        lineHeight: 1.2,
      },
    };

    pdfMake.createPdf(docDefinition).download(`${data.name}_Resume.pdf`);
  }

  private createSectionLine(): any {
    return {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 0.5,
          lineColor: '#000000',
        },
      ],
      margin: [0, 2, 0, 8],
    };
  }

  private formatEducation(education: any[]): any[] {
    return education
      .map((edu) => [
        {
          columns: [
            {
              text: edu.college,
              style: 'institutionHeader',
              width: '*',
            },
            {
              text: edu.location || '',
              style: 'locationDate',
              width: 'auto',
            },
          ],
        },
        {
          columns: [
            {
              text: `${edu.degree}${edu.cgpa ? `, CGPA: ${edu.cgpa}` : ''}`,
              style: 'degreeInfo',
              width: '*',
            },
            {
              text: edu.duration,
              style: 'locationDate',
              width: 'auto',
            },
          ],
          margin: [0, 0, 0, 5],
        },
      ])
      .flat();
  }

  private formatExperience(experience: any[]): any[] {
    return experience
      .map((exp) => [
        {
          columns: [
            {
              text: exp.title,
              style: 'jobTitle',
              width: '*',
            },
            {
              text: exp.duration,
              style: 'locationDate',
              width: 'auto',
            },
          ],
        },
        {
          text: exp.company,
          style: 'companyInfo',
        },
        ...exp.details.map((detail: string) => ({
          text: `– ${detail}`,
          style: 'bulletPoint',
        })),
      ])
      .flat();
  }

  private formatProjects(projects: any[]): any[] {
    return projects
      .map((project) => [
        {
          columns: [
            {
              text: project.title,
              style: 'jobTitle',
              width: '*',
            },
            {
              text: project.year || '',
              style: 'locationDate',
              width: 'auto',
            },
          ],
        },
        ...project.description.map((desc: string) => ({
          text: `– ${desc}`,
          style: 'bulletPoint',
        })),
      ])
      .flat();
  }

  private formatTechnicalSkills(skills: any): any[] {
    if (typeof skills === 'object' && !Array.isArray(skills)) {
      // If skills is an object with categories
      return Object.entries(skills)
        .map(([category, skillList]) => [
          {
            text: `${category}:`,
            style: 'skillCategory',
          },
          {
            text: Array.isArray(skillList) ? skillList.join(', ') : skillList,
            style: 'skillList',
          },
        ])
        .flat();
    } else if (Array.isArray(skills)) {
      // If skills is a simple array
      return [
        {
          text: skills.join(', '),
          style: 'skillList',
          margin: [0, 5, 0, 0],
        },
      ];
    }
    return [];
  }

  private formatCertifications(certifications: any[]): any[] {
    return certifications.map((cert) => {
      if (typeof cert === 'object') {
        return {
          text: `• ${cert.name}${cert.issuer ? ` (${cert.issuer}` : ''}${
            cert.date ? `, ${cert.date}` : ''
          }${cert.credential ? `) ${cert.credential}` : cert.issuer ? ')' : ''}`,
          style: 'bulletPoint',
          margin: [0, 2, 0, 2],
        };
      } else {
        return {
          text: `• ${cert}`,
          style: 'bulletPoint',
          margin: [0, 2, 0, 2],
        };
      }
    });
  }
}
