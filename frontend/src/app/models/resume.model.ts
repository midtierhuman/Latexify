export interface ResumeData {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  education: { degree: string; college: string; duration: string; cgpa: string }[];
  experience: { title: string; company: string; duration: string; details: string[] }[];
  projects: { title: string; description: string[] }[];
  skills: string[];
  certifications: string[];
}
