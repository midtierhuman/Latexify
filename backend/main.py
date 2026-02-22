from typing import List
import re

import fitz  # PyMuPDF
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI()


@app.get("/")
def root():
    return {"message": "FastAPI Resume Parser is running!"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Education(BaseModel):
    degree: str = ""
    college: str = ""
    location: str = ""
    duration: str = ""
    cgpa: str = ""


class Experience(BaseModel):
    title: str = ""
    company: str = ""
    location: str = ""
    duration: str = ""
    details: List[str] = []


class Project(BaseModel):
    title: str = ""
    description: List[str] = []
    year: str = ""
    tech: str = ""


class ResumeData(BaseModel):
    name: str
    phone: str
    email: str
    linkedin: str
    github: str
    education: List[Education]
    experience: List[Experience]
    projects: List[Project]
    skills: List[str]
    certifications: List[str]


BULLET_PREFIXES = ("- ", "•", "–", "* ", "â€¢", "â€“")
SECTION_NAMES = {"EDUCATION", "EXPERIENCE", "PROJECTS", "TECHNICAL SKILLS", "CERTIFICATIONS"}
SECTION_IGNORE_UPPER = {"B.TECH", "REST", "API", "AI", "CI/CD", "ML", "IT", "HR"}

PHONE_PATTERN = re.compile(
    r"(7\.908948489e\+09|\+?\d{10,}|\(\d{3}\)\s*\d{3}-\d{4}|\d{3}[-\s]?\d{3}[-\s]?\d{4})",
    re.IGNORECASE,
)
EMAIL_PATTERN = re.compile(r"([\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,})", re.IGNORECASE)
LINKEDIN_PATTERN = re.compile(r"(linkedin\.com/in/[\w\d\-_/]+)", re.IGNORECASE)
GITHUB_PATTERN = re.compile(r"(github\.com/[\w\d\-_/]+)", re.IGNORECASE)
CGPA_PATTERN = re.compile(r"CGPA:\s*([\d.]+)", re.IGNORECASE)
REMOVE_CGPA_PATTERN = re.compile(r",?\s*CGPA:\s*[\d.]+", re.IGNORECASE)
YEAR_PATTERN = re.compile(r"\d{4}")
SKILL_LABEL_PATTERN = re.compile(r"(Languages|Frameworks|Tools & Platforms):\s*", re.IGNORECASE)
CERT_BULLET_PATTERN = re.compile(r"[â€¢•]+\s*")


def normalize_line(line: str) -> str:
    return line.replace("â€¢", "•").replace("â€“", "–").strip()


def is_bullet_line(line: str) -> bool:
    return any(line.startswith(prefix) for prefix in BULLET_PREFIXES)


def extract_with_regex(pattern, text: str, default: str = "") -> str:
    regex = pattern if hasattr(pattern, "search") else re.compile(pattern, re.IGNORECASE)
    match = regex.search(text)
    return match.group(1).strip() if match else default


def split_sections(text: str):
    section_lines = {section: [] for section in SECTION_NAMES}
    current_section = None

    for raw in text.splitlines():
        line = normalize_line(raw)
        upper_line = line.upper()

        if upper_line in SECTION_NAMES:
            current_section = upper_line
            continue

        if current_section:
            if line and line.isupper() and upper_line not in SECTION_IGNORE_UPPER and upper_line not in SECTION_NAMES:
                current_section = None
                continue
            if line:
                section_lines[current_section].append(line)

    return {k: "\n".join(v).strip() for k, v in section_lines.items()}


def parse_education_fixed(education_text: str) -> List[Education]:
    education_list: List[Education] = []
    if not education_text:
        return education_list

    lines = [line.strip() for line in education_text.split("\n") if line.strip()]
    if len(lines) >= 3:
        college = lines[0]
        degree_line = lines[1]
        duration = lines[2]

        cgpa = ""
        degree = degree_line
        cgpa_match = CGPA_PATTERN.search(degree_line)
        if cgpa_match:
            cgpa = cgpa_match.group(1)
            degree = REMOVE_CGPA_PATTERN.sub("", degree_line).strip()

        education_list.append(
            Education(
                degree=degree,
                college=college,
                duration=duration,
                cgpa=cgpa,
            )
        )

    return education_list


def parse_experience_fixed(experience_text: str) -> List[Experience]:
    experience_list: List[Experience] = []
    if not experience_text:
        return experience_list

    lines = [normalize_line(line) for line in experience_text.split("\n")]
    i = 0

    while i < len(lines):
        line = lines[i].strip()
        if not line or is_bullet_line(line):
            i += 1
            continue

        title = line
        i += 1
        duration = ""
        company = ""
        details: List[str] = []

        if i < len(lines):
            potential_duration = lines[i].strip()
            if YEAR_PATTERN.search(potential_duration):
                duration = potential_duration
                i += 1

                if i < len(lines):
                    potential_company = lines[i].strip()
                    if not is_bullet_line(potential_company) and not YEAR_PATTERN.search(potential_company):
                        company = potential_company
                        i += 1

                        while i < len(lines):
                            detail_line = lines[i].strip()
                            if is_bullet_line(detail_line):
                                details.append(detail_line)
                                i += 1
                            elif not detail_line:
                                i += 1
                            else:
                                break

        if title and company and not is_bullet_line(title):
            experience_list.append(
                Experience(
                    title=title,
                    company=company,
                    duration=duration,
                    details=details,
                )
            )
        else:
            i += 1

    return experience_list


def parse_projects_fixed(projects_text: str) -> List[Project]:
    projects_list: List[Project] = []
    if not projects_text:
        return projects_list

    lines = [normalize_line(line) for line in projects_text.split("\n")]
    current_project = None
    current_description: List[str] = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if ("Project" in line and not is_bullet_line(line)) or (line.endswith("–") and "Project" in line):
            if current_project:
                projects_list.append(Project(title=current_project, description=current_description))
            current_project = line.replace("–", "").strip()
            current_description = []
        elif is_bullet_line(line):
            if current_project:
                current_description.append(line)

    if current_project:
        projects_list.append(Project(title=current_project, description=current_description))

    return projects_list


def parse_skills_fixed(skills_text: str) -> List[str]:
    if not skills_text:
        return []

    cleaned_text = SKILL_LABEL_PATTERN.sub("", skills_text)
    skill_items = [s.strip() for s in re.split(r",|\n", cleaned_text) if s.strip()]
    return [skill for skill in skill_items if len(skill) > 1]


def parse_certifications_fixed(certs_text: str) -> List[str]:
    if not certs_text:
        return []

    cleaned_text = CERT_BULLET_PATTERN.sub("", certs_text)
    cert_items = [c.strip() for c in re.split(r",|\n|•", cleaned_text) if c.strip()]

    certifications: List[str] = []
    temp_cert = ""

    for item in cert_items:
        if temp_cert and not item.startswith("(") and ")" not in item:
            certifications.append(temp_cert)
            temp_cert = item
        elif "(" in item and ")" not in item:
            temp_cert = item
        elif temp_cert and ")" in item:
            certifications.append(f"{temp_cert}, {item}")
            temp_cert = ""
        else:
            certifications.append(item)

    if temp_cert:
        certifications.append(temp_cert)

    return certifications


@app.post("/parse-resume", response_model=ResumeData)
async def parse_resume(file: UploadFile = File(...)):
    try:
        pdf_bytes = await file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            text = "\n".join(page.get_text("text") for page in doc)
        finally:
            doc.close()

        lines = [normalize_line(line) for line in text.splitlines() if line.strip()]
        name = lines[0] if lines else ""

        phone = extract_with_regex(PHONE_PATTERN, text)
        if "e+09" in phone:
            try:
                phone = str(int(float(phone)))
            except (TypeError, ValueError):
                pass

        email = extract_with_regex(EMAIL_PATTERN, text)
        linkedin = extract_with_regex(LINKEDIN_PATTERN, text)
        github = extract_with_regex(GITHUB_PATTERN, text)

        sections = split_sections(text)
        education_list = parse_education_fixed(sections["EDUCATION"])
        experience_list = parse_experience_fixed(sections["EXPERIENCE"])
        projects_list = parse_projects_fixed(sections["PROJECTS"])
        skills = parse_skills_fixed(sections["TECHNICAL SKILLS"])
        certifications = parse_certifications_fixed(sections["CERTIFICATIONS"])

        return ResumeData(
            name=name,
            phone=phone,
            email=email,
            linkedin=linkedin,
            github=github,
            education=education_list or [],
            experience=experience_list or [],
            projects=projects_list or [],
            skills=skills or [],
            certifications=certifications or [],
        )
    except Exception as e:
        return ResumeData(
            name=f"Error: {str(e)}",
            phone="",
            email="",
            linkedin="",
            github="",
            education=[],
            experience=[],
            projects=[],
            skills=[],
            certifications=[],
        )
