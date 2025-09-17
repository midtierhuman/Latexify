from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import fitz  # PyMuPDF

app = FastAPI()
@app.get("/")
def root():
    return {"message": "FastAPI Resume Parser is running!"}
# Enable CORS for your Angular app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define ResumeData model
class Education(BaseModel):
    degree: str
    college: str
    duration: str
    cgpa: str

class Experience(BaseModel):
    title: str
    company: str
    duration: str
    details: List[str]

class Project(BaseModel):
    title: str
    description: List[str]

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


@app.post("/parse-resume", response_model=ResumeData)
async def parse_resume(file: UploadFile = File(...)):
    # Step 1: Extract text from PDF
    import re
    pdf_bytes = await file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()

    # Step 2: Parsing logic using regex and heuristics
    def extract_with_regex(pattern, text, default=""):
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else default

    # Name: Assume first non-empty line is the name
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = lines[0] if lines else ""

    # Phone
    phone = extract_with_regex(r"(\+?\d[\d\s\-]{8,}\d)", text)

    # Email
    email = extract_with_regex(r"([\w\.-]+@[\w\.-]+)", text)

    # LinkedIn
    linkedin = extract_with_regex(r"(linkedin\.com/in/[\w\d\-_/]+)", text)

    # GitHub
    github = extract_with_regex(r"(github\.com/[\w\d\-_/]+)", text)

    # Section splitting helpers
    def extract_section(section, text):
        pattern = rf"{section}[:\n\r]+([\s\S]+?)(?=\n[A-Z][A-Za-z ]{2,}:|\Z)"
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else ""

    # Education
    education_text = extract_section("Education", text)
    education_list = []
    if education_text:
        for edu_line in education_text.split("\n"):
            if edu_line.strip():
                # Try to extract degree, college, duration, cgpa
                degree = extract_with_regex(r"([A-Za-z .]+)", edu_line)
                college = extract_with_regex(r"at ([A-Za-z .]+)", edu_line)
                duration = extract_with_regex(r"(\d{4} ?- ?\d{4}|\d{4} ?- ?Present)", edu_line)
                cgpa = extract_with_regex(r"(\d+\.\d+|\d+/10)", edu_line)
                education_list.append(Education(
                    degree=degree or "",
                    college=college or "",
                    duration=duration or "",
                    cgpa=cgpa or ""
                ))

    # Experience
    experience_text = extract_section("Experience", text)
    experience_list = []
    if experience_text:
        for exp_block in re.split(r"\n(?=[A-Z][a-z]+ at )", experience_text):
            if exp_block.strip():
                title = extract_with_regex(r"([A-Za-z ]+) at", exp_block)
                company = extract_with_regex(r"at ([A-Za-z .&]+)", exp_block)
                duration = extract_with_regex(r"(\d{4} ?- ?\d{4}|\d{4} ?- ?Present)", exp_block)
                details = [line.strip() for line in exp_block.split("\n") if line.strip() and not line.startswith(title or "")]
                experience_list.append(Experience(
                    title=title or "",
                    company=company or "",
                    duration=duration or "",
                    details=details or []
                ))

    # Projects
    projects_text = extract_section("Projects", text)
    projects_list = []
    if projects_text:
        for proj_block in re.split(r"\n(?=[A-Z][a-zA-Z0-9 ]+:)", projects_text):
            if proj_block.strip():
                title = extract_with_regex(r"([A-Za-z0-9 .]+):", proj_block)
                description = [line.strip() for line in proj_block.split("\n") if line.strip() and not line.startswith(title or "")]
                projects_list.append(Project(
                    title=title or "",
                    description=description or []
                ))

    # Skills
    skills_text = extract_section("Skills", text)
    skills = [s.strip() for s in re.split(r",|\n", skills_text) if s.strip()] if skills_text else []

    # Certifications
    certs_text = extract_section("Certifications", text)
    certifications = [c.strip() for c in re.split(r",|\n", certs_text) if c.strip()] if certs_text else []

    resume_data = ResumeData(
        name=name,
        phone=phone,
        email=email,
        linkedin=linkedin,
        github=github,
        education=education_list or [],
        experience=experience_list or [],
        projects=projects_list or [],
        skills=skills or [],
        certifications=certifications or []
    )

    return resume_data
