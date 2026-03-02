from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from fastapi.middleware.cors import CORSMiddleware
from prisma import Prisma
from pydantic import BaseModel, Field
import httpx
import uuid
import bcrypt
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
SECRET_KEY = "eduflow-super-secret-key-change-this" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # Tokens last for 1 week

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
    
    user = await db.user.find_unique(where={"id": user_id})
    if user is None:
        raise credentials_exception
        
    return user

# ==========================================
# AUTH MODELS & ENDPOINTS
# ==========================================
class RegisterInput(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    role: str = "STUDENT"

class LoginInput(BaseModel):
    email: str
    password: str

@app.post("/api/auth/register")
async def register(user: RegisterInput):
    existing_user = await db.user.find_unique(where={"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)

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
    user = await db.user.find_unique(where={"email": form_data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(form_data.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

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
# ADMIN: LECTURER FETCH ENDPOINT
# ==========================================
@app.get("/api/users/lecturers")
async def get_lecturers(current_user = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only Admins can view the lecturer roster.")
    
    lecturers = await db.user.find_many(where={"role": "LECTURER"})
    return [{"id": l.id, "firstName": l.firstName, "lastName": l.lastName} for l in lecturers]

# ==========================================
# COURSE MODELS & ENDPOINTS
# ==========================================
class CourseInput(BaseModel):
    courseCode: str
    title: str
    description: str | None = None
    lecturerId: str 

@app.post("/api/courses")
async def create_course(course: CourseInput, current_user = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only Administrators can create courses.")

    existing_course = await db.course.find_unique(where={"courseCode": course.courseCode})
    if existing_course:
        raise HTTPException(status_code=400, detail="Course code already exists")

    lecturer = await db.user.find_unique(where={"id": course.lecturerId})
    if not lecturer or lecturer.role != "LECTURER":
        raise HTTPException(status_code=400, detail="Invalid Lecturer assigned.")

    new_course = await db.course.create(
        data={
            "courseCode": course.courseCode,
            "title": course.title,
            "description": course.description,
            "lecturerId": course.lecturerId 
        }
    )
    return {"message": "Course created successfully", "course": new_course}

@app.get("/api/courses")
async def get_courses(current_user = Depends(get_current_user)):
    courses = await db.course.find_many(
        include={
            "lecturer": True,
            "enrollments": True,
            "assignments": {
                "include": {
                    "submissions": True 
                }
            }
        },
        order={"courseCode": "asc"}
    )
    return courses

# ==========================================
# ENROLLMENT ENDPOINT
# ==========================================
@app.post("/api/courses/{course_id}/enroll")
async def enroll_in_course(course_id: str, current_user = Depends(get_current_user)):
    course = await db.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

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

    new_enrollment = await db.enrollment.create(
        data={
            "studentId": current_user.id,
            "courseId": course_id
        }
    )
    return {"message": "Successfully enrolled!", "enrollment_id": new_enrollment.id}

# ==========================================
# STUDENT ONBOARDING MODELS & ENDPOINTS
# ==========================================
class ProfileOnboardInput(BaseModel):
    ageAtEnrollment: int = Field(..., ge=15, le=100)
    tuitionUpToDate: int = Field(..., ge=0, le=1)
    scholarship: int = Field(..., ge=0, le=1)
    admissionGrade: float = Field(..., ge=0.0, le=200.0)
    debtor: int = Field(..., ge=0, le=1)

@app.post("/api/profile/onboard")
async def onboard_profile(profile_data: ProfileOnboardInput, current_user = Depends(get_current_user)):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can onboard.")
    
    existing = await db.studentprofile.find_unique(where={"userId": current_user.id})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists.")

    new_profile = await db.studentprofile.create(
        data={
            "userId": current_user.id,
            "ageAtEnrollment": profile_data.ageAtEnrollment,
            "tuitionUpToDate": profile_data.tuitionUpToDate,
            "scholarship": profile_data.scholarship,
            "admissionGrade": profile_data.admissionGrade,
            "classesPassed": 0,  
            "grades1stSem": 0.0, 
            "debtor": profile_data.debtor
        }
    )
    return {"message": "Onboarding complete!", "profile": new_profile}

@app.get("/api/profile/me")
async def get_my_profile(current_user = Depends(get_current_user)):
    profile = await db.studentprofile.find_unique(where={"userId": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

class ProfileUpdateInput(BaseModel):
    ageAtEnrollment: int = Field(..., ge=15, le=100)
    tuitionUpToDate: int = Field(..., ge=0, le=1)
    scholarship: int = Field(..., ge=0, le=1)
    debtor: int = Field(..., ge=0, le=1)

@app.put("/api/profile/me")
async def update_my_profile(profile_data: ProfileUpdateInput, current_user = Depends(get_current_user)):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can update their profile.")

    profile = await db.studentprofile.find_unique(where={"userId": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    updated_profile = await db.studentprofile.update(
        where={"userId": current_user.id},
        data={
            "ageAtEnrollment": profile_data.ageAtEnrollment,
            "tuitionUpToDate": profile_data.tuitionUpToDate,
            "scholarship": profile_data.scholarship,
            "debtor": profile_data.debtor
        }
    )

    ml_payload = {
        "features": {
            "student_age": updated_profile.ageAtEnrollment,
            "tuition_status": updated_profile.tuitionUpToDate,
            "scholarship": updated_profile.scholarship,
            "grades_1st_sem": updated_profile.grades1stSem,
            "admission_grade": updated_profile.admissionGrade,
            "classes_passed": updated_profile.classesPassed,
            "debtor": updated_profile.debtor
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            ml_response = await client.post(ML_SERVICE_URL, json=ml_payload)
            ml_response.raise_for_status()

            prediction_data = ml_response.json()
            pred = prediction_data["prediction"]
            conf = prediction_data["confidence_scores"][pred]

        await db.aiprediction.create(
            data={"studentId": current_user.id, "prediction": pred, "confidence": conf}
        )
        return {"message": "Profile updated and AI Prediction recalculated!", "prediction": pred}

    except Exception as e:
        print(f"ML Engine Error: {e}")
        return {"message": "Profile updated, but ML Engine is offline."}

# ==========================================
# STUDENT SIMULATOR ANALYTICS ENDPOINTS
# ==========================================
class StudentInput(BaseModel):
    ageAtEnrollment: int = Field(..., ge=15, le=100)
    tuitionUpToDate: int = Field(..., ge=0, le=1)
    scholarship: int = Field(..., ge=0, le=1)
    grades1stSem: float = Field(..., ge=0.0, le=20.0)
    admissionGrade: float = Field(127.0, ge=0.0, le=200.0)
    classesPassed: int = Field(6, ge=0, le=6)
    debtor: int = Field(0, ge=0, le=1)

@app.post("/api/students")
async def create_student(student: StudentInput, current_user = Depends(get_current_user)):
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
    return {"message": "Student profile saved", "student_id": new_user.id}

@app.post("/api/students/{student_id}/analyze")
async def analyze_student(student_id: str, current_user = Depends(get_current_user)):
    user = await db.user.find_unique(
        where={"id": student_id},
        include={"profile": True}
    )
    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

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

    async with httpx.AsyncClient() as client:
        ml_response = await client.post(ML_SERVICE_URL, json=ml_payload)
        ml_response.raise_for_status()
        
        prediction_data = ml_response.json()
        pred = prediction_data["prediction"]
        conf = prediction_data["confidence_scores"][pred]

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
            "aiPredictions": {
                "orderBy": {
                    "predictedAt": "desc" 
                }
            } 
        },
        order={"createdAt": "desc"} 
    )
    return users

# ==========================================
# ASSIGNMENT & SUBMISSION MODELS
# ==========================================
class AssignmentInput(BaseModel):
    title: str
    description: str
    dueDate: datetime  
    maxScore: float = 20.0  

class SubmissionInput(BaseModel):
    contentUrl: str

class GradeSubmissionInput(BaseModel):
    score: float = Field(..., ge=0.0, le=20.0)

# ==========================================
# ASSIGNMENT & SUBMISSION ENDPOINTS
# ==========================================
@app.post("/api/courses/{course_id}/assignments")
async def create_assignment(course_id: str, assignment: AssignmentInput, current_user = Depends(get_current_user)):
    if current_user.role not in ["LECTURER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized.")

    course = await db.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role == "LECTURER" and course.lecturerId != current_user.id:
        raise HTTPException(status_code=403, detail="You can only create assignments for your own courses.")

    new_assignment = await db.assignment.create(
        data={
            "title": assignment.title,
            "description": assignment.description,
            "dueDate": assignment.dueDate,
            "maxScore": assignment.maxScore,
            "courseId": course_id
        }
    )
    return {"message": "Assignment created!", "assignment": new_assignment}

@app.post("/api/assignments/{assignment_id}/submit")
async def submit_assignment(assignment_id: str, submission: SubmissionInput, current_user = Depends(get_current_user)):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can submit assignments.")

    assignment = await db.assignment.find_unique(where={"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    existing_sub = await db.submission.find_unique(
        where={
            "studentId_assignmentId": {
                "studentId": current_user.id,
                "assignmentId": assignment_id
            }
        }
    )

    if existing_sub:
        updated_sub = await db.submission.update(
            where={"id": existing_sub.id},
            data={"contentUrl": submission.contentUrl, "submittedAt": datetime.utcnow()}
        )
        return {"message": "Submission updated!", "submission": updated_sub}
    else:
        new_sub = await db.submission.create(
            data={
                "studentId": current_user.id,
                "assignmentId": assignment_id,
                "contentUrl": submission.contentUrl
            }
        )
        return {"message": "Assignment submitted successfully!", "submission": new_sub}

# --- THE CORRECTED GRADING ENGINE ---
@app.post("/api/submissions/{submission_id}/grade")
async def grade_submission(submission_id: str, grade_data: GradeSubmissionInput, current_user = Depends(get_current_user)):
    if current_user.role not in ["LECTURER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized to grade.")

    submission = await db.submission.find_unique(
        where={"id": submission_id},
        include={"assignment": {"include": {"course": True}}}
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if current_user.role == "LECTURER" and submission.assignment.course.lecturerId != current_user.id:
        raise HTTPException(status_code=403, detail="You can only grade submissions for your own courses.")

    student_id = submission.studentId

    # 1. Save the new grade for this specific assignment
    await db.submission.update(
        where={"id": submission_id},
        data={"score": grade_data.score}
    )

    profile = await db.studentprofile.find_unique(where={"userId": student_id})
    if not profile:
        raise HTTPException(status_code=400, detail="Student has no profile. Cannot process AI prediction.")

    # 2. Fetch ALL of the student's submissions across the entire database to calculate their true Average Grade
    all_student_submissions = await db.submission.find_many(
        where={"studentId": student_id}
    )
    
    # Filter out ungraded submissions
    graded_subs = [s for s in all_student_submissions if s.score is not None]

    if graded_subs:
        # Calculate the true average grade
        total_score = sum(s.score for s in graded_subs)
        average_grade = round(total_score / len(graded_subs), 2)

        # Accurately count how many distinct assignments they passed (scored >= 10.0)
        classes_passed = sum(1 for s in graded_subs if s.score >= 10.0)
        classes_passed = min(classes_passed, 6) # Cap it at 6 to match the ML constraint limit
    else:
        average_grade = profile.grades1stSem
        classes_passed = profile.classesPassed

    # 3. Update their Profile with the mathematically correct aggregates
    profile = await db.studentprofile.update(
        where={"userId": student_id},
        data={
            "grades1stSem": average_grade,
            "classesPassed": classes_passed
        }
    )

    # 4. Trigger the AI Engine with the updated average!
    ml_payload = {
        "features": {
            "student_age": profile.ageAtEnrollment,
            "tuition_status": profile.tuitionUpToDate,
            "scholarship": profile.scholarship,
            "grades_1st_sem": profile.grades1stSem,
            "admission_grade": profile.admissionGrade,
            "classes_passed": profile.classesPassed,
            "debtor": profile.debtor
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            ml_response = await client.post(ML_SERVICE_URL, json=ml_payload)
            ml_response.raise_for_status()
            
            prediction_data = ml_response.json()
            pred = prediction_data["prediction"]
            conf = prediction_data["confidence_scores"][pred]

        await db.aiprediction.create(
            data={"studentId": student_id, "prediction": pred, "confidence": conf}
        )
        return {"message": "Submission graded and AI updated with average!", "score": grade_data.score, "prediction": pred}

    except Exception as e:
        print(f"ML Engine Error: {e}")
        return {"message": "Grade saved, but ML Engine is offline.", "score": grade_data.score}