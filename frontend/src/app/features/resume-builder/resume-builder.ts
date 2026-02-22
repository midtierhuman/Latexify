import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResumeService } from '../../services/resume.service';
import {
  ResumeData,
  ExperienceEntry,
  ExperienceSubRole,
  SkillCategory,
} from '../../models/resume.model';
import { CommonModule, isPlatformBrowser } from '@angular/common';

const DEFAULT_SKILL_CATEGORIES = [
  'Languages',
  'Frameworks',
  'Developer Tools',
  'Libraries',
];

@Component({
  selector: 'app-resume-builder',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './resume-builder.html',
  styleUrl: './resume-builder.scss',
  standalone: true,
})
export class ResumeBuilder {
  resumeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private resumeService: ResumeService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.resumeForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      linkedin: [''],
      github: [''],
      education: this.fb.array([]),
      experience: this.fb.array([]),
      projects: this.fb.array([]),
      skillCategories: this.fb.array([]),
      certifications: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    const data =
      isPlatformBrowser(this.platformId) && history?.state?.data
        ? (history.state.data as ResumeData)
        : undefined;

    if (data) {
      this.loadFromData(data);
    } else {
      this.addEducation();
      this.addExperience();
      this.addExperienceDetail(0);
      this.addProject();
      this.addProjectDetail(0);
      this.seedDefaultSkillCategories();
      this.addCertification();
    }
  }

  private loadFromData(data: ResumeData): void {
    this.resumeForm.patchValue({
      name: data.name ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      linkedin: data.linkedin ?? '',
      github: data.github ?? '',
    });

    this.education.clear();
    (data.education ?? []).forEach((e) => {
      this.education.push(
        this.fb.group({
          degree: [e?.degree ?? ''],
          college: [e?.college ?? ''],
          location: [e?.location ?? ''],
          duration: [e?.duration ?? ''],
          cgpa: [e?.cgpa ?? ''],
        })
      );
    });
    if (this.education.length === 0) this.addEducation();

    this.experience.clear();
    (data.experience ?? []).forEach((exp) => {
      const details = this.fb.array([]);
      (exp?.details ?? []).forEach((d) => details.push(this.fb.control(d ?? '')));
      if (details.length === 0) details.push(this.fb.control(''));

      const subRolesRaw = exp?.subRoles ?? (exp as { sub_roles?: ExperienceSubRole[] }).sub_roles ?? [];
      const subRoles = this.fb.array<FormGroup>([]);
      subRolesRaw.forEach((sub) => {
        const subDetails = this.fb.array([]);
        (sub?.details ?? []).forEach((d) => subDetails.push(this.fb.control(d ?? '')));
        if (subDetails.length === 0) subDetails.push(this.fb.control(''));
        subRoles.push(
          this.fb.group({
            title: [sub?.title ?? ''],
            duration: [sub?.duration ?? ''],
            details: subDetails,
          })
        );
      });

      this.experience.push(
        this.fb.group({
          title: [exp?.title ?? ''],
          company: [exp?.company ?? ''],
          location: [exp?.location ?? ''],
          duration: [exp?.duration ?? ''],
          details,
          subRoles,
        })
      );
    });
    if (this.experience.length === 0) {
      this.addExperience();
      this.addExperienceDetail(0);
    }

    this.projects.clear();
    (data.projects ?? []).forEach((p) => {
      const description = this.fb.array([]);
      (p?.description ?? []).forEach((d) => description.push(this.fb.control(d ?? '')));
      if (description.length === 0) description.push(this.fb.control(''));
      this.projects.push(
        this.fb.group({
          title: [p?.title ?? ''],
          year: [p?.year ?? ''],
          tech: [p?.tech ?? ''],
          description,
        })
      );
    });
    if (this.projects.length === 0) {
      this.addProject();
      this.addProjectDetail(0);
    }

    this.skillCategories.clear();
    const catsRaw = data.skillCategories ?? (data as { skill_categories?: SkillCategory[] }).skill_categories ?? [];
    const merged = this.mergeSkillCategoriesByName(
      catsRaw.length > 0
        ? catsRaw.map((c: SkillCategory) => ({ category: c.category ?? '', items: c.items ?? [] }))
        : [{ category: 'Skills', items: (data.skills ?? []).map((s) => String(s ?? '').trim()).filter(Boolean) }]
    );
    merged.forEach(({ category, items: itemList }) => {
      const items = this.fb.array([]);
      (itemList.length ? itemList : ['']).forEach((s) => items.push(this.fb.control(s)));
      this.skillCategories.push(this.fb.group({ category: [category], items }));
    });
    if (this.skillCategories.length === 0) {
      this.seedDefaultSkillCategories();
    }

    this.certifications.clear();
    (data.certifications ?? []).forEach((c) =>
      this.certifications.push(this.fb.control(typeof c === 'string' ? c : String(c ?? '')))
    );
    if (this.certifications.length === 0) this.addCertification();
  }

  /** Merge categories with the same name (case-insensitive trim). Same name cannot exist twice. */
  private mergeSkillCategoriesByName(
    categories: { category: string; items: string[] }[]
  ): { category: string; items: string[] }[] {
    const byName = new Map<string, string[]>();
    for (const { category, items } of categories) {
      const name = category.trim() || 'Skills';
      const existing = byName.get(name) ?? [];
      const added = (items ?? []).map((s) => String(s).trim()).filter(Boolean);
      byName.set(name, [...existing, ...added]);
    }
    return Array.from(byName.entries()).map(([category, items]) => ({
      category,
      items: items.length ? items : [],
    }));
  }

  /** Call after loading or when we need to ensure no duplicate category names in the form. */
  private mergeDuplicateSkillCategoriesInForm(): void {
    const groups = this.skillCategories.controls as FormGroup[];
    const byName = new Map<string, string[]>();
    for (const g of groups) {
      const name = (g.get('category')?.value ?? '').trim() || 'Skills';
      const itemsArray = g.get('items') as FormArray;
      const items = (itemsArray?.value ?? []).map((s: string) => String(s).trim()).filter(Boolean);
      const existing = byName.get(name) ?? [];
      byName.set(name, [...existing, ...items]);
    }
    this.skillCategories.clear();
    byName.forEach((items, category) => {
      const arr = this.fb.array([]);
      (items.length ? items : ['']).forEach((s) => arr.push(this.fb.control(s)));
      this.skillCategories.push(this.fb.group({ category: [category], items: arr }));
    });
  }

  private seedDefaultSkillCategories(): void {
    DEFAULT_SKILL_CATEGORIES.forEach((cat) => {
      this.skillCategories.push(
        this.fb.group({
          category: [cat],
          items: this.fb.array([this.fb.control('')]),
        })
      );
    });
  }

  get education(): FormArray {
    return this.resumeForm.get('education') as FormArray;
  }
  get experience(): FormArray {
    return this.resumeForm.get('experience') as FormArray;
  }
  get projects(): FormArray {
    return this.resumeForm.get('projects') as FormArray;
  }
  get skillCategories(): FormArray {
    return this.resumeForm.get('skillCategories') as FormArray;
  }
  get certifications(): FormArray {
    return this.resumeForm.get('certifications') as FormArray;
  }

  getExperienceDetails(expIndex: number): FormArray {
    return this.experience.at(expIndex).get('details') as FormArray;
  }

  getExperienceSubRoles(expIndex: number): FormArray {
    return this.experience.at(expIndex).get('subRoles') as FormArray;
  }

  getSubRoleDetails(expIndex: number, subIndex: number): FormArray {
    return this.getExperienceSubRoles(expIndex).at(subIndex).get('details') as FormArray;
  }

  getProjectDescriptions(projIndex: number): FormArray {
    return this.projects.at(projIndex).get('description') as FormArray;
  }

  getSkillCategoryItems(catIndex: number): FormArray {
    return this.skillCategories.at(catIndex).get('items') as FormArray;
  }

  addEducation(): void {
    this.education.push(
      this.fb.group({
        degree: [''],
        college: [''],
        location: [''],
        duration: [''],
        cgpa: [''],
      })
    );
  }

  addExperience(): void {
    this.experience.push(
      this.fb.group({
        title: [''],
        company: [''],
        location: [''],
        duration: [''],
        details: this.fb.array([this.fb.control('')]),
        subRoles: this.fb.array([]),
      })
    );
  }

  addExperienceDetail(expIndex: number): void {
    this.getExperienceDetails(expIndex).push(this.fb.control(''));
  }

  addExperienceSubRole(expIndex: number): void {
    const subRoles = this.getExperienceSubRoles(expIndex);
    subRoles.push(
      this.fb.group({
        title: [''],
        duration: [''],
        details: this.fb.array([this.fb.control('')]),
      })
    );
  }

  addSubRoleDetail(expIndex: number, subIndex: number): void {
    this.getSubRoleDetails(expIndex, subIndex).push(this.fb.control(''));
  }

  addProject(): void {
    this.projects.push(
      this.fb.group({
        title: [''],
        year: [''],
        tech: [''],
        description: this.fb.array([this.fb.control('')]),
      })
    );
  }

  addProjectDetail(projIndex: number): void {
    this.getProjectDescriptions(projIndex).push(this.fb.control(''));
  }

  addSkillCategory(): void {
    this.skillCategories.push(
      this.fb.group({
        category: [''],
        items: this.fb.array([this.fb.control('')]),
      })
    );
  }

  addSkillCategoryItem(catIndex: number): void {
    this.getSkillCategoryItems(catIndex).push(this.fb.control(''));
  }

  addCertification(): void {
    this.certifications.push(this.fb.control(''));
  }

  removeEducation(index: number): void {
    this.education.removeAt(index);
  }

  removeExperience(index: number): void {
    this.experience.removeAt(index);
  }

  removeExperienceDetail(expIndex: number, detailIndex: number): void {
    this.getExperienceDetails(expIndex).removeAt(detailIndex);
  }

  removeExperienceSubRole(expIndex: number, subIndex: number): void {
    this.getExperienceSubRoles(expIndex).removeAt(subIndex);
  }

  removeSubRoleDetail(expIndex: number, subIndex: number, detailIndex: number): void {
    this.getSubRoleDetails(expIndex, subIndex).removeAt(detailIndex);
  }

  removeProject(index: number): void {
    this.projects.removeAt(index);
  }

  removeProjectDetail(projIndex: number, descIndex: number): void {
    this.getProjectDescriptions(projIndex).removeAt(descIndex);
  }

  removeSkillCategory(index: number): void {
    this.skillCategories.removeAt(index);
  }

  /** Merge duplicate category names when user edits a category name (e.g. renames to existing). */
  onSkillCategoryNameBlur(): void {
    this.mergeDuplicateSkillCategoriesInForm();
  }

  removeSkillCategoryItem(catIndex: number, itemIndex: number): void {
    this.getSkillCategoryItems(catIndex).removeAt(itemIndex);
  }

  removeCertification(index: number): void {
    this.certifications.removeAt(index);
  }

  /** Build ResumeData from form (Jake-style: experience with subRoles, skillCategories) */
  private formValueToResumeData(): ResumeData {
    const v = this.resumeForm.value;
    const experience: ExperienceEntry[] = (v.experience || []).map((exp: any) => {
      const subRoles: ExperienceSubRole[] = (exp.subRoles || []).map((sub: any) => ({
        title: sub.title ?? '',
        duration: sub.duration ?? '',
        details: (sub.details || []).filter(Boolean),
      }));
      return {
        title: exp.title ?? '',
        company: exp.company ?? '',
        location: exp.location ?? '',
        duration: exp.duration ?? '',
        details: (exp.details || []).filter(Boolean),
        subRoles: subRoles.filter((s) => s.title || s.duration || s.details.length),
      };
    });
    const rawCats = (v.skillCategories || []).map((c: any) => ({
      category: (c?.category ?? '').trim() || 'Skills',
      items: (c.items || []).map((s: string) => String(s).trim()).filter(Boolean),
    }));
    const mergedCats = this.mergeSkillCategoriesByName(rawCats);
    const skillCategories: SkillCategory[] = mergedCats.filter((c) => c.items.length > 0);

    return {
      name: v.name ?? '',
      phone: v.phone ?? '',
      email: v.email ?? '',
      linkedin: v.linkedin ?? '',
      github: v.github ?? '',
      education: v.education ?? [],
      experience,
      projects: v.projects ?? [],
      skills: [],
      skillCategories: skillCategories.length ? skillCategories : undefined,
      certifications: (v.certifications || []).filter(Boolean),
    };
  }

  downloadResume(): void {
    if (this.resumeForm.invalid) {
      this.resumeForm.markAllAsTouched();
      return;
    }
    this.resumeService.generateResume(this.formValueToResumeData());
  }

  downloadLatex(): void {
    if (this.resumeForm.invalid) {
      this.resumeForm.markAllAsTouched();
      return;
    }
    this.resumeService.downloadLatex(this.formValueToResumeData());
  }
}
