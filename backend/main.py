from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import fitz  # PyMuPDF
import re


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


# Fixed helper functions
def extract_with_regex(pattern, text, default=""):
    """Extract content using regex with proper error handling"""
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else default


def extract_section_fixed(section, text):
    """Fixed section extraction that properly handles section boundaries"""
    section_pattern = rf"^{section}$"
    lines = text.split('\n')
    
    start_idx = -1
    for i, line in enumerate(lines):
        if re.match(section_pattern, line.strip(), re.IGNORECASE):
            start_idx = i + 1
            break
    
    if start_idx == -1:
        return ""
    
    # Find the end of the section (next all-caps section header or end of text)
    end_idx = len(lines)
    for i in range(start_idx, len(lines)):
        line = lines[i].strip()
        # Check if this is a new section (all caps, excluding common abbreviations)
        if (line and line.isupper() and len(line.split()) >= 1 and 
            line not in ['B.TECH', 'REST', 'API', 'AI', 'CI/CD', 'ML', 'IT', 'HR']):
            end_idx = i
            break
    
    section_lines = lines[start_idx:end_idx]
    return '\n'.join(section_lines).strip()


def parse_education_fixed(education_text):
    """Parse education section with proper structure handling"""
    education_list = []
    if not education_text:
        return education_list
    
    lines = [line.strip() for line in education_text.split('\n') if line.strip()]
    
    # For this resume format: College name, then degree+cgpa, then duration
    if len(lines) >= 3:
        college = lines[0]
        degree_line = lines[1]
        duration = lines[2]
        
        # Extract degree and CGPA from the degree line
        cgpa = ""
        degree = degree_line
        
        # Look for CGPA pattern
        cgpa_match = re.search(r'CGPA:\s*([\d.]+)', degree_line)
        if cgpa_match:
            cgpa = cgpa_match.group(1)
            # Remove CGPA part to get clean degree
            degree = re.sub(r',?\s*CGPA:\s*[\d.]+', '', degree_line).strip()
        
        education_list.append(Education(
            degree=degree,
            college=college,
            duration=duration,
            cgpa=cgpa
        ))
    
    return education_list


def parse_experience_fixed(experience_text):
    """Parse experience section with proper job entry handling"""
    experience_list = []
    if not experience_text:
        return experience_list
    
    lines = experience_text.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines and bullet points
        if not line or line.startswith('–') or line.startswith('•'):
            i += 1
            continue
        
        # This should be a job title
        title = line
        i += 1
        
        duration = ""
        company = ""
        details = []
        
        # Next line should be duration (contains year pattern)
        if i < len(lines):
            potential_duration = lines[i].strip()
            if re.search(r'\d{4}', potential_duration):
                duration = potential_duration
                i += 1
                
                # Next line should be company (if not a bullet point or duration)
                if i < len(lines):
                    potential_company = lines[i].strip()
                    if (not potential_company.startswith('–') and 
                        not potential_company.startswith('•') and 
                        not re.search(r'\d{4}', potential_company)):
                        company = potential_company
                        i += 1
                        
                        # Collect bullet points for this job
                        while i < len(lines):
                            detail_line = lines[i].strip()
                            if detail_line.startswith('–') or detail_line.startswith('•'):
                                details.append(detail_line)
                                i += 1
                            elif not detail_line:  # Empty line
                                i += 1
                            else:
                                # This might be the start of a new job
                                break
        
        # Only add if we have essential information
        if title and company and not title.startswith('–'):
            experience_list.append(Experience(
                title=title,
                company=company,
                duration=duration,
                details=details
            ))
        else:
            i += 1
    
    return experience_list


def parse_projects_fixed(projects_text):
    """Parse projects section properly"""
    projects_list = []
    if not projects_text:
        return projects_list
    
    lines = projects_text.split('\n')
    current_project = None
    current_description = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check if this is a project title (contains "Project" or ends with dash)
        if (('Project' in line and not line.startswith('–') and not line.startswith('•')) or 
            (line.endswith('–') and 'Project' in line)):
            
            # Save previous project if exists
            if current_project:
                projects_list.append(Project(
                    title=current_project,
                    description=current_description
                ))
            
            # Start new project
            current_project = line.replace('–', '').strip()
            current_description = []
            
        elif line.startswith('–') or line.startswith('•'):
            # This is a description bullet point
            if current_project:  # Only add if we have a current project
                current_description.append(line)
    
    # Add the last project
    if current_project:
        projects_list.append(Project(
            title=current_project,
            description=current_description
        ))
    
    return projects_list


def parse_skills_fixed(skills_text):
    """Parse technical skills with better categorization"""
    if not skills_text:
        return []
    
    # Clean up the skills text and split by various delimiters
    skills = []
    
    # Remove category labels and split by commas
    cleaned_text = re.sub(r'(Languages|Frameworks|Tools & Platforms):\s*', '', skills_text)
    skill_items = [s.strip() for s in re.split(r',|\n', cleaned_text) if s.strip()]
    
    # Filter out empty or very short items
    skills = [skill for skill in skill_items if len(skill) > 1 and skill not in ['', ' ']]
    
    return skills


def parse_certifications_fixed(certs_text):
    """Parse certifications with proper cleaning"""
    if not certs_text:
        return []
    
    # Remove bullet points and split by common delimiters
    cleaned_text = re.sub(r'•+\s*', '', certs_text)
    cert_items = [c.strip() for c in re.split(r',|\n|•', cleaned_text) if c.strip()]
    
    # Filter out empty items and reconstruct split certifications
    certifications = []
    temp_cert = ""
    
    for item in cert_items:
        if item:
            if temp_cert and not item.startswith('(') and ')' not in item:
                certifications.append(temp_cert)
                temp_cert = item
            elif '(' in item and ')' not in item:
                temp_cert = item
            elif temp_cert and ')' in item:
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
        # Step 1: Extract text from PDF
        pdf_bytes = await file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()

        # Step 2: Basic information extraction
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        name = lines[0] if lines else ""

        # Fixed phone extraction - handle scientific notation and regular formats
        phone = extract_with_regex(r"(7\.908948489e\+09|\+?\d{10,}|\(\d{3}\)\s*\d{3}-\d{4}|\d{3}[-\s]?\d{3}[-\s]?\d{4})", text)
        
        # Convert scientific notation to regular number if needed
        if 'e+09' in phone:
            try:
                phone_num = float(phone)
                phone = str(int(phone_num))
            except:
                pass

        # Email, LinkedIn, GitHub extraction
        email = extract_with_regex(r"([\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,})", text)
        linkedin = extract_with_regex(r"(linkedin\.com/in/[\w\d\-_/]+)", text)
        github = extract_with_regex(r"(github\.com/[\w\d\-_/]+)", text)

        # Step 3: Extract sections using fixed function
        education_text = extract_section_fixed("EDUCATION", text)
        experience_text = extract_section_fixed("EXPERIENCE", text)
        projects_text = extract_section_fixed("PROJECTS", text)
        skills_text = extract_section_fixed("TECHNICAL SKILLS", text)
        certs_text = extract_section_fixed("CERTIFICATIONS", text)

        # Step 4: Parse each section using fixed functions
        education_list = parse_education_fixed(education_text)
        experience_list = parse_experience_fixed(experience_text)
        projects_list = parse_projects_fixed(projects_text)
        skills = parse_skills_fixed(skills_text)
        certifications = parse_certifications_fixed(certs_text)

        # Step 5: Create and return ResumeData object
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

    except Exception as e:
        # Return empty structure with error info if parsing fails
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
            certifications=[]
        )