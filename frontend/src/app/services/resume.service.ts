import { Injectable } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { ResumeData } from '../models/resume.model';

(pdfMake as any).vfs = pdfFonts.vfs;

/** Escape LaTeX special characters in user content */
function escapeLatex(s: string): string {
  if (!s) return '';
  return s
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[#$%&_{}]/g, (c) => '\\' + c)
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

const LATEX_PREAMBLE = `%-------------------------
% Resume in Latex - Latexify (Jake's FAANG-style template)
% Based on: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

%----------FONT OPTIONS----------
% sans-serif
% \\usepackage[sfdefault]{FiraSans}
% \\usepackage[sfdefault]{roboto}
% \\usepackage[sfdefault]{noto-sans}
% \\usepackage[default]{sourcesanspro}
% serif
% \\usepackage{CormorantGaramond}
% \\usepackage{charter}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]}

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
  \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
    \\textbf{#1} & #2 \\\\
    \\textit{\\small#3} & \\textit{\\small #4} \\\\
  \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeSubSubheading}[2]{
  \\item
  \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
    \\textit{\\small#1} & \\textit{\\small #2} \\\\
  \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
  \\item
  \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
    \\small#1 & #2 \\\\
  \\end{tabular*}\\vspace{-7pt}
}
\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}
\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}
`;

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  /** Generate and download PDF (pdfMake) */
  generateResume(data: ResumeData) {
    const docDefinition: any = {
      pageMargins: [50, 45, 50, 45],
      fonts: {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf',
        },
      },
      content: (() => {
        const content: any[] = [
          { text: data.name, style: 'nameHeader', alignment: 'center', margin: [0, 0, 0, 4] },
          {
            text: `${data.phone} | ${data.email} | ${data.linkedin} | ${data.github}`,
            style: 'contactInfo',
            alignment: 'center',
            margin: [0, 0, 0, 16],
          },
          { text: 'Education', style: 'sectionHeader' },
          this.createSectionLine(),
          ...this.formatEducation(data.education),
          { text: 'Experience', style: 'sectionHeader', margin: [0, 12, 0, 4] },
          this.createSectionLine(),
          ...this.formatExperience(data.experience),
          { text: 'Projects', style: 'sectionHeader', margin: [0, 12, 0, 4] },
          this.createSectionLine(),
          ...this.formatProjects(data.projects),
          { text: 'Technical Skills', style: 'sectionHeader', margin: [0, 12, 0, 4] },
          this.createSectionLine(),
          ...this.formatTechnicalSkillsForPdf(data),
        ];
        if ((data.certifications ?? []).length > 0) {
          content.push(
            { text: 'Certifications', style: 'sectionHeader', margin: [0, 12, 0, 4] },
            this.createSectionLine(),
            ...this.formatCertifications(data.certifications)
          );
        }
        return content;
      })(),

      styles: {
        nameHeader: {
          fontSize: 22,
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
        subRoleTitle: {
          fontSize: 9,
          italics: true,
          margin: [0, 0, 0, 1],
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
    return (education || [])
      .map((edu) => [
        {
          columns: [
            {
              text: edu.college,
              style: 'institutionHeader',
              width: '*',
            },
            {
              text: edu.location ?? '',
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

  private formatExperience(experience: ResumeData['experience']): any[] {
    const out: any[] = [];
    for (const exp of experience || []) {
      out.push(
        {
          columns: [
            { text: exp.title, style: 'jobTitle', width: '*' },
            { text: exp.duration, style: 'locationDate', width: 'auto' },
          ],
        },
        {
          text: [exp.company, exp.location].filter(Boolean).join(', '),
          style: 'companyInfo',
        }
      );
      out.push(...(exp.details || []).map((d: string) => ({ text: `– ${d}`, style: 'bulletPoint' })));
      for (const sub of exp.subRoles || []) {
        out.push(
          {
            columns: [
              { text: sub.title, style: 'subRoleTitle', width: '*' },
              { text: sub.duration, style: 'locationDate', width: 'auto' },
            ],
            margin: [0, 4, 0, 0],
          }
        );
        out.push(...(sub.details || []).map((d: string) => ({ text: `– ${d}`, style: 'bulletPoint', margin: [8, 0, 0, 0] })));
      }
    }
    return out;
  }

  private formatProjects(projects: any[]): any[] {
    return (projects || [])
      .map((project) => [
        {
          columns: [
            {
              text: [project.title, project.tech].filter(Boolean).join(' | '),
              style: 'jobTitle',
              width: '*',
            },
            {
              text: project.year ?? '',
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

  /** Jake-style: categories (Languages, Frameworks, etc.) or flat skills */
  private formatTechnicalSkillsForPdf(data: ResumeData): any[] {
    const cats = data.skillCategories?.filter((c) => c.category?.trim() && (c.items?.length ?? 0) > 0);
    if (cats?.length) {
      return cats.flatMap((c) => [
        { text: `${c.category}:`, style: 'skillCategory' as const },
        { text: (c.items || []).join(', '), style: 'skillList' as const },
      ]);
    }
    const flat = (data.skills || []).filter(Boolean);
    if (flat.length) {
      return [{ text: flat.join(', '), style: 'skillList' as const, margin: [0, 5, 0, 0] }];
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

  /** Generate full .tex source matching the Resume.tex template */
  generateLatex(data: ResumeData): string {
    const n = escapeLatex(data.name);
    const phone = escapeLatex(data.phone);
    const email = data.email || '';
    const linkedin = data.linkedin ? `https://${data.linkedin.replace(/^https?:\/\//, '')}` : '';
    const github = data.github ? `https://${data.github.replace(/^https?:\/\//, '')}` : '';

    let contactLine = phone;
    if (email) contactLine += ` $|$ \\href{mailto:${email}}{\\underline{${escapeLatex(email)}}}`;
    if (linkedin) contactLine += ` $|$ \\href{${escapeLatex(linkedin)}}{\\underline{${escapeLatex(data.linkedin!)}}}`;
    if (github) contactLine += ` $|$ \\href{${escapeLatex(github)}}{\\underline{${escapeLatex(data.github!)}}}`;

    const heading = `%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${n}} \\\\ \\vspace{1pt}
    \\small ${contactLine}
\\end{center}
`;

    let edu = `%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
`;
    for (const e of data.education || []) {
      const college = escapeLatex(e.college);
      const loc = escapeLatex((e as { location?: string }).location || '');
      const degree = escapeLatex(e.degree);
      const cgpa = e.cgpa ? `, CGPA: ${escapeLatex(e.cgpa)}` : '';
      const duration = escapeLatex(e.duration);
      edu += `    \\resumeSubheading\n      {${college}}{${loc}}\n      {${degree}${cgpa}}{${duration}}\n`;
    }
    edu += `  \\resumeSubHeadingListEnd
`;

    let exp = `%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
`;
    for (const x of data.experience || []) {
      const title = escapeLatex(x.title);
      const duration = escapeLatex(x.duration);
      const company = escapeLatex(x.company);
      const loc = escapeLatex(x.location || '');
      exp += `    \\resumeSubheading\n      {${title}}{${duration}}\n      {${company}}{${loc}}\n`;
      exp += `      \\resumeItemListStart\n`;
      for (const d of x.details || []) {
        exp += `        \\resumeItem{${escapeLatex(d)}}\n`;
      }
      exp += `      \\resumeItemListEnd\n`;
      for (const sub of x.subRoles || []) {
        exp += `    \\resumeSubSubheading\n      {${escapeLatex(sub.title)}}{${escapeLatex(sub.duration)}}\n`;
        exp += `      \\resumeItemListStart\n`;
        for (const d of sub.details || []) {
          exp += `        \\resumeItem{${escapeLatex(d)}}\n`;
        }
        exp += `      \\resumeItemListEnd\n`;
      }
      exp += `\n`;
    }
    exp += `  \\resumeSubHeadingListEnd
`;

    let proj = `%-----------PROJECTS-----------
\\section{Projects}
  \\resumeSubHeadingListStart
`;
    for (const p of data.projects || []) {
      const title = escapeLatex(p.title);
      const techVal = (p as { tech?: string }).tech ?? '';
      const yearVal = (p as { year?: string }).year ?? '';
      const tech = techVal ? ` $|$ \\emph{${escapeLatex(techVal)}}` : '';
      const year = escapeLatex(yearVal);
      proj += `    \\resumeProjectHeading\n      {\\textbf{${title}}${tech}}{${year}}\n`;
      proj += `      \\resumeItemListStart\n`;
      for (const desc of p.description || []) {
        proj += `        \\resumeItem{${escapeLatex(desc)}}\n`;
      }
      proj += `      \\resumeItemListEnd\n`;
    }
    proj += `  \\resumeSubHeadingListEnd
`;

    const cats = (data.skillCategories || []).filter((c) => c.category?.trim() && (c.items?.length ?? 0) > 0);
    let skillsBlock: string;
    if (cats.length) {
      const lines = cats
        .map((c) => `     \\textbf{${escapeLatex(c.category)}}{: ${(c.items || []).map((s) => escapeLatex(s)).join(', ')}}`)
        .join(' \\\\\n');
      skillsBlock = `%-----------PROGRAMMING SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
 ${lines}
    }}
 \\end{itemize}
`;
    } else {
      const skillsList = (data.skills || []).filter(Boolean).map((s) => escapeLatex(s)).join(', ');
      skillsBlock = `%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Skills}{: ${skillsList}}
    }}
 \\end{itemize}
`;
    }

    let certBlock = '';
    const certs = (data.certifications || []).filter(Boolean);
    if (certs.length) {
      certBlock = `%-----------CERTIFICATIONS-----------
\\section{Certifications}
 \\begin{itemize}[leftmargin=0.15in, label={}]
`;
      for (const c of certs) {
        const raw = typeof c === 'string' ? c : String(c);
        const idx = raw.indexOf(' -- ');
        const part1 = escapeLatex(idx >= 0 ? raw.slice(0, idx) : raw);
        const part2 = idx >= 0 ? escapeLatex(raw.slice(idx + 4)) : '';
        certBlock += `    \\small{\\item{\n     \\textbf{${part1}}${part2 ? ` -- ${part2}` : ''}\n    }}\n`;
      }
      certBlock += ` \\end{itemize}

`;
    }
    return LATEX_PREAMBLE + heading + edu + exp + proj + skillsBlock + certBlock + '\\end{document}\n';
  }

  /** Trigger download of resume as .tex file (same format as Resume.tex) */
  downloadLatex(data: ResumeData): void {
    const tex = this.generateLatex(data);
    const blob = new Blob([tex], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data.name || 'Resume').replace(/\s+/g, '_')}_Resume.tex`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
