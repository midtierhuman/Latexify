/** Sub-role at same company (Jake-style stacked positions) */
export interface ExperienceSubRole {
  title: string;
  duration: string;
  details: string[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  location?: string;
  duration: string;
  details: string[];
  /** Multiple positions at same company (FAANG-style) */
  subRoles?: ExperienceSubRole[];
}

/** Jake-style skill category (e.g. Languages, Frameworks, Developer Tools) */
export interface SkillCategory {
  category: string;
  items: string[];
}

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
  experience: ExperienceEntry[];
  projects: {
    title: string;
    description: string[];
    year?: string;
    tech?: string;
  }[];
  /** Flat list (legacy/parser); used when skillCategories is empty */
  skills: string[];
  /** Jake-style: Languages, Frameworks, Developer Tools, Libraries */
  skillCategories?: SkillCategory[];
  certifications: string[];
}
