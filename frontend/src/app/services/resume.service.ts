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
      content: [
        { text: data.name, style: 'header' },
        {
          text: `${data.phone} | ${data.email} | ${data.linkedin} | ${data.github}`,
          style: 'subheader',
        },
        { text: 'Education', style: 'sectionHeader' },
        ...data.education.map((e) => ({
          text: `${e.degree}, ${e.college} (${e.duration}) – CGPA: ${e.cgpa}`,
          margin: [0, 2, 0, 2],
        })),
        { text: 'Experience', style: 'sectionHeader' },
        ...data.experience.map((exp) => [
          { text: `${exp.title}, ${exp.company} (${exp.duration})`, bold: true },
          ...exp.details.map((d) => ({ ul: [d] })),
        ]),
        { text: 'Projects', style: 'sectionHeader' },
        ...data.projects.map((p) => [
          { text: p.title, bold: true },
          ...p.description.map((d) => ({ ul: [d] })),
        ]),
        { text: 'Technical Skills', style: 'sectionHeader' },
        { ul: data.skills },
        { text: 'Certifications', style: 'sectionHeader' },
        { ul: data.certifications },
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] },
        subheader: { fontSize: 10, margin: [0, 0, 0, 10] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      },
    };

    pdfMake.createPdf(docDefinition).download(`${data.name}_Resume.pdf`);
  }
}
