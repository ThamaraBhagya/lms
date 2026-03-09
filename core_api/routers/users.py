from fastapi import APIRouter, HTTPException, Depends
import httpx
import uuid
from database import db
from config import ML_SERVICE_URL
from schemas import ProfileOnboardInput, ProfileUpdateInput, StudentInput
from security import get_current_user

router = APIRouter(tags=["Users & Profiles"])

@router.get("/api/users/lecturers")
async def get_lecturers(current_user = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only Admins can view the lecturer roster.")
    lecturers = await db.user.find_many(where={"role": "LECTURER"})
    return [{"id": l.id, "firstName": l.firstName, "lastName": l.lastName} for l in lecturers]

@router.post("/api/profile/onboard")
async def onboard_profile(profile_data: ProfileOnboardInput, current_user = Depends(get_current_user)):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can onboard.")
    
    existing = await db.studentprofile.find_unique(where={"userId": current_user.id})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists.")

    new_profile = await db.studentprofile.create(
        data={
            "userId": current_user.id, "ageAtEnrollment": profile_data.ageAtEnrollment,
            "tuitionUpToDate": profile_data.tuitionUpToDate, "scholarship": profile_data.scholarship,
            "admissionGrade": profile_data.admissionGrade, "classesPassed": 0, "grades1stSem": 0.0, "debtor": profile_data.debtor
        }
    )
    return {"message": "Onboarding complete!", "profile": new_profile}

@router.get("/api/profile/me")
async def get_my_profile(current_user = Depends(get_current_user)):
    profile = await db.studentprofile.find_unique(where={"userId": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/api/profile/me")
async def update_my_profile(profile_data: ProfileUpdateInput, current_user = Depends(get_current_user)):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can update their profile.")

    updated_profile = await db.studentprofile.update(
        where={"userId": current_user.id},
        data={"ageAtEnrollment": profile_data.ageAtEnrollment, "tuitionUpToDate": profile_data.tuitionUpToDate, "scholarship": profile_data.scholarship, "debtor": profile_data.debtor}
    )
    ml_payload = {"features": {"student_age": updated_profile.ageAtEnrollment, "tuition_status": updated_profile.tuitionUpToDate, "scholarship": updated_profile.scholarship, "grades_1st_sem": updated_profile.grades1stSem, "admission_grade": updated_profile.admissionGrade, "classes_passed": updated_profile.classesPassed, "debtor": updated_profile.debtor}}
    try:
        async with httpx.AsyncClient() as client:
            ml_response = await client.post(ML_SERVICE_URL, json=ml_payload)
            ml_response.raise_for_status()
            data = ml_response.json()
            pred, conf = data["prediction"], data["confidence_scores"][data["prediction"]]
        await db.aiprediction.create(data={"studentId": current_user.id, "prediction": pred, "confidence": conf})
        return {"message": "Profile updated and AI Prediction recalculated!", "prediction": pred}
    except Exception:
        return {"message": "Profile updated, but ML Engine is offline."}

@router.post("/api/students")
async def create_student(student: StudentInput, current_user = Depends(get_current_user)):
    dummy_email = f"sim_{uuid.uuid4()}@eduflow.local"
    new_user = await db.user.create(data={"email": dummy_email, "passwordHash": "simulated_hash", "firstName": "Simulated", "lastName": "Student", "role": "STUDENT"})
    await db.studentprofile.create(data={"userId": new_user.id, "ageAtEnrollment": student.ageAtEnrollment, "tuitionUpToDate": student.tuitionUpToDate, "scholarship": student.scholarship, "grades1stSem": student.grades1stSem, "admissionGrade": student.admissionGrade, "classesPassed": student.classesPassed, "debtor": student.debtor})
    return {"message": "Student profile saved", "student_id": new_user.id}

@router.get("/api/students")
async def get_all_students(current_user = Depends(get_current_user)):
    users = await db.user.find_many(where={"role": "STUDENT"}, include={"profile": True, "aiPredictions": {"orderBy": {"predictedAt": "desc"}}}, order={"createdAt": "desc"})
    return users

@router.post("/api/students/{student_id}/analyze")
async def analyze_student(student_id: str, current_user = Depends(get_current_user)):
    user = await db.user.find_unique(where={"id": student_id}, include={"profile": True})
    if not user or not user.profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    ml_payload = {"features": {"student_age": user.profile.ageAtEnrollment, "tuition_status": user.profile.tuitionUpToDate, "scholarship": user.profile.scholarship, "grades_1st_sem": user.profile.grades1stSem, "admission_grade": user.profile.admissionGrade, "classes_passed": user.profile.classesPassed, "debtor": user.profile.debtor}}
    async with httpx.AsyncClient() as client:
        ml_response = await client.post(ML_SERVICE_URL, json=ml_payload)
        data = ml_response.json()
        pred, conf = data["prediction"], data["confidence_scores"][data["prediction"]]
    new_prediction = await db.aiprediction.create(data={"studentId": student_id, "prediction": pred, "confidence": conf})
    return {"message": "Analysis complete", "data": new_prediction}