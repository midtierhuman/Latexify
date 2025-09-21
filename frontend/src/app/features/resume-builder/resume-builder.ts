import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResumeService } from '../../services/resume.service';
import { ResumeData } from '../../models/resume.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resume-builder',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './resume-builder.html',
  styleUrl: './resume-builder.scss',
  standalone: true,
})
export class ResumeBuilder {
  resumeForm: FormGroup;

  constructor(private fb: FormBuilder, private resumeService: ResumeService) {
    this.resumeForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      linkedin: [''],
      github: [''],
      education: this.fb.array([]),
      experience: this.fb.array([]),
      projects: this.fb.array([]),
      skills: this.fb.array([]),
      certifications: this.fb.array([]),
    });
  }
  ngOnInit() {
    const data = history.state?.data as ResumeData | undefined;

    if (data) {
      this.loadFromData(data);
    } else {
      // Seed one empty row for each section so UI isn't blank
      this.addEducation();
      this.addExperience();
      this.addExperienceDetail(0);
      this.addProject();
      this.addProjectDetail(0);
      this.addSkill();
      this.addCertification();
    }
  }

  private loadFromData(data: ResumeData) {
    // Top-level fields
    this.resumeForm.patchValue({
      name: data.name ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      linkedin: data.linkedin ?? '',
      github: data.github ?? '',
    });

    // Education
    this.education.clear();
    (data.education ?? []).forEach((e) => {
      this.education.push(
        this.fb.group({
          degree: [e?.degree ?? ''],
          college: [e?.college ?? ''],
          duration: [e?.duration ?? ''],
          cgpa: [e?.cgpa ?? ''],
        })
      );
    });
    if (this.education.length === 0) this.addEducation();

    // Experience (with nested details)
    this.experience.clear();
    (data.experience ?? []).forEach((exp) => {
      const details = this.fb.array([]);
      (exp?.details ?? []).forEach((d) => details.push(this.fb.control(d ?? '')));
      if (details.length === 0) details.push(this.fb.control(''));

      this.experience.push(
        this.fb.group({
          title: [exp?.title ?? ''],
          company: [exp?.company ?? ''],
          duration: [exp?.duration ?? ''],
          details,
        })
      );
    });
    if (this.experience.length === 0) {
      this.addExperience();
      this.addExperienceDetail(0);
    }

    // Projects (with nested description)
    this.projects.clear();
    (data.projects ?? []).forEach((p) => {
      const description = this.fb.array([]);
      (p?.description ?? []).forEach((d) => description.push(this.fb.control(d ?? '')));
      if (description.length === 0) description.push(this.fb.control(''));

      this.projects.push(
        this.fb.group({
          title: [p?.title ?? ''],
          description,
        })
      );
    });
    if (this.projects.length === 0) {
      this.addProject();
      this.addProjectDetail(0);
    }

    // Skills
    this.skills.clear();
    (data.skills ?? []).forEach((s) => this.skills.push(this.fb.control(s ?? '')));
    if (this.skills.length === 0) this.addSkill();

    // Certifications
    this.certifications.clear();
    (data.certifications ?? []).forEach((c) => this.certifications.push(this.fb.control(c ?? '')));
    if (this.certifications.length === 0) this.addCertification();

    console.log('Form loaded from route data:', this.resumeForm.value);
  }
  // Getters for form arrays
  get education() {
    return this.resumeForm.get('education') as FormArray;
  }
  get experience() {
    return this.resumeForm.get('experience') as FormArray;
  }
  get projects() {
    return this.resumeForm.get('projects') as FormArray;
  }
  get skills() {
    return this.resumeForm.get('skills') as FormArray;
  }
  get certifications() {
    return this.resumeForm.get('certifications') as FormArray;
  }
  // Add these helper methods inside your component
  getExperienceDetails(expIndex: number): FormArray {
    return this.experience.at(expIndex).get('details') as FormArray;
  }

  getProjectDescriptions(projIndex: number): FormArray {
    return this.projects.at(projIndex).get('description') as FormArray;
  }

  // Add methods
  addEducation() {
    this.education.push(
      this.fb.group({
        degree: [''],
        college: [''],
        duration: [''],
        cgpa: [''],
      })
    );
  }

  addExperience() {
    this.experience.push(
      this.fb.group({
        title: [''],
        company: [''],
        duration: [''],
        details: this.fb.array([]),
      })
    );
  }

  addExperienceDetail(expIndex: number) {
    (this.experience.at(expIndex).get('details') as FormArray).push(this.fb.control(''));
  }

  addProject() {
    this.projects.push(
      this.fb.group({
        title: [''],
        description: this.fb.array([]),
      })
    );
  }

  addProjectDetail(projIndex: number) {
    (this.projects.at(projIndex).get('description') as FormArray).push(this.fb.control(''));
  }

  addSkill() {
    this.skills.push(this.fb.control(''));
  }
  addCertification() {
    this.certifications.push(this.fb.control(''));
  }

  // Remove methods for dynamic fields
  removeEducation(index: number) {
    this.education.removeAt(index);
  }

  removeExperience(index: number) {
    this.experience.removeAt(index);
  }

  removeExperienceDetail(expIndex: number, detailIndex: number) {
    this.getExperienceDetails(expIndex).removeAt(detailIndex);
  }

  removeProject(index: number) {
    this.projects.removeAt(index);
  }

  removeProjectDetail(projIndex: number, descIndex: number) {
    this.getProjectDescriptions(projIndex).removeAt(descIndex);
  }

  removeSkill(index: number) {
    this.skills.removeAt(index);
  }

  removeCertification(index: number) {
    this.certifications.removeAt(index);
  }

  downloadResume() {
    const data: ResumeData = this.resumeForm.value;
    this.resumeService.generateResume(data);
  }
}
