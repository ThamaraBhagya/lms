from pydantic import BaseModel, Field
from datetime import datetime

class RegisterInput(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    role: str = "STUDENT"

class LoginInput(BaseModel):
    email: str
    password: str

class CourseInput(BaseModel):
    courseCode: str
    title: str
    description: str | None = None
    lecturerId: str 

class ProfileOnboardInput(BaseModel):
    ageAtEnrollment: int = Field(..., ge=15, le=100)
    tuitionUpToDate: int = Field(..., ge=0, le=1)
    scholarship: int = Field(..., ge=0, le=1)
    admissionGrade: float = Field(..., ge=0.0, le=200.0)
    debtor: int = Field(..., ge=0, le=1)

class ProfileUpdateInput(BaseModel):
    ageAtEnrollment: int = Field(..., ge=15, le=100)
    tuitionUpToDate: int = Field(..., ge=0, le=1)
    scholarship: int = Field(..., ge=0, le=1)
    debtor: int = Field(..., ge=0, le=1)

class StudentInput(BaseModel):
    ageAtEnrollment: int = Field(..., ge=15, le=100)
    tuitionUpToDate: int = Field(..., ge=0, le=1)
    scholarship: int = Field(..., ge=0, le=1)
    grades1stSem: float = Field(..., ge=0.0, le=20.0)
    admissionGrade: float = Field(127.0, ge=0.0, le=200.0)
    classesPassed: int = Field(6, ge=0, le=6)
    debtor: int = Field(0, ge=0, le=1)

class AssignmentInput(BaseModel):
    title: str
    description: str
    dueDate: datetime  
    maxScore: float = 20.0  

class SubmissionInput(BaseModel):
    contentUrl: str

class GradeSubmissionInput(BaseModel):
    score: float = Field(..., ge=0.0, le=20.0)