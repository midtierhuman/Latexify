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
