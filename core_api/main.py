from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from fastapi.middleware.cors import CORSMiddleware
from prisma import Prisma
from pydantic import BaseModel, Field
import httpx
import uuid

import jwt
from datetime import datetime, timedelta

app = FastAPI(title="EduFlow Core API")
db = Prisma()

ML_SERVICE_URL = "http://127.0.0.1:8000/predict"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()
# ==========================================
# SECURITY SETUP
# ==========================================
import bcrypt
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "eduflow-super-secret-key-change-this" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # Tokens last for 1 week

def verify_password(plain_password, hashed_password):
    # bcrypt requires bytes, so we encode the strings first
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password):
    # Generate a secure salt and hash the password
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode('utf-8') # Convert back to string for the database

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
# Tells FastAPI where clients can go to get a token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # 1. Open the "Digital ID Card"
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
    
    # 2. Check if the user still exists in the database
    user = await db.user.find_unique(where={"id": user_id})
    if user is None:
        raise credentials_exception
        
    return user # The bouncer lets them in!

# ==========================================
# AUTH MODELS
# ==========================================
class RegisterInput(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    role: str = "STUDENT" # Or LECTURER, ADMIN

class LoginInput(BaseModel):
    email: str
    password: str

# ==========================================
# AUTH ENDPOINTS
# ==========================================
@app.post("/api/auth/register")
async def register(user: RegisterInput):
    # 1. Check if the email is already taken
    existing_user = await db.user.find_unique(where={"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash the password (NEVER save plain text!)
    hashed_password = get_password_hash(user.password)

    # 3. Save the new user to the database
    new_user = await db.user.create(
        data={
            "email": user.email,
            "passwordHash": hashed_password,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "role": user.role
        }
    )
    return {"message": "User created successfully", "user_id": new_user.id}

@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # 1. Find the user by email (OAuth2 forms always map the input to a field called 'username')
    user = await db.user.find_unique(where={"email": form_data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 2. Verify the password matches the hash
    if not verify_password(form_data.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 3. Generate the "Digital ID Card" (JWT)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role}
    )

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "role": user.role
        }
    }

# ==========================================
# COURSE MODELS
# ==========================================
class CourseInput(BaseModel):
    courseCode: str
    title: str
    description: str | None = None

# ==========================================
# COURSE ENDPOINTS
# ==========================================
@app.post("/api/courses")
async def create_course(course: CourseInput, current_user = Depends(get_current_user)):
    # 1. Security Check: Only Lecturers or Admins can create courses!
    if current_user.role not in ["LECTURER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only faculty can create courses")

    # 2. Check if course code already exists
    existing_course = await db.course.find_unique(where={"courseCode": course.courseCode})
    if existing_course:
        raise HTTPException(status_code=400, detail="Course code already exists")

    # 3. Create the course and link it to the Lecturer
    new_course = await db.course.create(
        data={
            "courseCode": course.courseCode,
            "title": course.title,
            "description": course.description,
            "lecturerId": current_user.id
        }
    )
    return {"message": "Course created successfully", "course": new_course}

@app.get("/api/courses")
async def get_courses(current_user = Depends(get_current_user)):
    # Everyone can view courses, and we include the lecturer's details
    courses = await db.course.find_many(
        include={
            "lecturer": True,
            "enrollments": True # We will use this later to count enrolled students!
        },
        order={"courseCode": "asc"} # Sort them alphabetically
    )
    return courses

# ==========================================
# ENROLLMENT ENDPOINT
# ==========================================
@app.post("/api/courses/{course_id}/enroll")
async def enroll_in_course(course_id: str, current_user = Depends(get_current_user)):
    # 1. Verify the course actually exists
    course = await db.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 2. Prevent duplicate enrollments (a student can't join the same class twice)
    existing_enrollment = await db.enrollment.find_unique(
        where={
            "studentId_courseId": {
                "studentId": current_user.id,
                "courseId": course_id
            }
        }
    )
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="You are already enrolled in this course")

    # 3. Create the official link in the database
    new_enrollment = await db.enrollment.create(
        data={
            "studentId": current_user.id,
            "courseId": course_id
        }
    )
    
    return {"message": "Successfully enrolled!", "enrollment_id": new_enrollment.id}

# 1. Updated to match the camelCase names in your new Prisma schema
class StudentInput(BaseModel):
    ageAtEnrollment: int = Field(..., ge=15, le=100, description="Age must be a realistic human age")
    tuitionUpToDate: int = Field(..., ge=0, le=1, description="Must be exactly 0 or 1")
    scholarship: int = Field(..., ge=0, le=1, description="Must be exactly 0 or 1")
    grades1stSem: float = Field(..., ge=0.0, le=20.0, description="Portuguese grades are 0 to 20")
    admissionGrade: float = Field(127.0, ge=0.0, le=200.0, description="Admission score 0 to 200")
    classesPassed: int = Field(6, ge=0, le=6, description="Cannot pass more than 6 classes")
    debtor: int = Field(0, ge=0, le=1, description="Must be exactly 0 or 1")


@app.post("/api/students")
async def create_student(student: StudentInput, current_user = Depends(get_current_user)):
    # Step A: Create a simulated User record
    dummy_email = f"sim_{uuid.uuid4()}@eduflow.local"
    new_user = await db.user.create(
        data={
            "email": dummy_email,
            "passwordHash": "simulated_hash",
            "firstName": "Simulated",
            "lastName": "Student",
            "role": "STUDENT"
        }
    )

    # Step B: Attach the ML Input data to their Profile
    new_profile = await db.studentprofile.create(
        data={
            "userId": new_user.id,
            "ageAtEnrollment": student.ageAtEnrollment,
            "tuitionUpToDate": student.tuitionUpToDate,
            "scholarship": student.scholarship,
            "grades1stSem": student.grades1stSem,
            "admissionGrade": student.admissionGrade,
            "classesPassed": student.classesPassed,
            "debtor": student.debtor
        }
    )
    
    # We return the User ID so the frontend can immediately trigger the /analyze endpoint
    return {"message": "Student profile saved", "student_id": new_user.id}


# Notice: student_id is now a string (UUID), not an int!
@app.post("/api/students/{student_id}/analyze")
async def analyze_student(student_id: str, current_user = Depends(get_current_user)):
    
    # Fetch the user AND their attached profile data
    user = await db.user.find_unique(
        where={"id": student_id},
        include={"profile": True}
    )
    
    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Package for ML Engine (Keeping your exact payload structure)
    ml_payload = {
        "features": {
            "student_age": user.profile.ageAtEnrollment,
            "tuition_status": user.profile.tuitionUpToDate,
            "scholarship": user.profile.scholarship,
            "grades_1st_sem": user.profile.grades1stSem,
            "admission_grade": user.profile.admissionGrade,
            "classes_passed": user.profile.classesPassed,
            "debtor": user.profile.debtor
        }
    }

    # Send to ML Engine
    async with httpx.AsyncClient() as client:
        ml_response = await client.post(ML_SERVICE_URL, json=ml_payload)
        ml_response.raise_for_status()
        
        prediction_data = ml_response.json()
        pred = prediction_data["prediction"]
        conf = prediction_data["confidence_scores"][pred]

    # Step C: Save ML results to the new AIPrediction table instead of overwriting a single column
    new_prediction = await db.aiprediction.create(
        data={
            "studentId": student_id,
            "prediction": pred,
            "confidence": conf
        }
    )

    return {"message": "Analysis complete", "data": new_prediction}


@app.get("/api/students")
async def get_all_students(current_user = Depends(get_current_user)):
    users = await db.user.find_many(
        where={"role": "STUDENT"},
        include={
            "profile": True,
            "aiPredictions": True  # Fetch them all to bypass the Prisma Python nested sorting bug
        },
        order={"createdAt": "desc"}  # <-- Must be exactly 'order' at the top level in Python!
    )
    return users