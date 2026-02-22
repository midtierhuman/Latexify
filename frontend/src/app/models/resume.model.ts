export interface ResumeData {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  education: {
    degree: string;
    college: string;
    location?: string;
    duration: string;
    cgpa: string;
  }[];
  experience: {
    title: string;
    company: string;
    location?: string;
    duration: string;
    details: string[];
  }[];
  projects: {
    title: string;
    description: string[];
    year?: string;
    tech?: string;
  }[];
  skills: string[];
  certifications: string[];
}
