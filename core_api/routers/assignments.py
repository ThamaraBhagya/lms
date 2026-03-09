from fastapi import APIRouter, HTTPException, Depends
import httpx
from database import db
from config import ML_SERVICE_URL
from schemas import AssignmentInput, SubmissionInput, GradeSubmissionInput
from security import get_current_user

router = APIRouter(prefix="/api", tags=["Assignments"])

@router.post("/courses/{course_id}/assignments")
async def create_assignment(course_id: str, assignment: AssignmentInput, current_user = Depends(get_current_user)):
    if current_user.role not in ["LECTURER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized.")

    course = await db.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if current_user.role == "LECTURER" and course.lecturerId != current_user.id:
        raise HTTPException(status_code=403, detail="You can only create assignments for your own courses.")

    new_assignment = await db.assignment.create(
        data={"title": assignment.title, "description": assignment.description, "dueDate": assignment.dueDate, "maxScore": assignment.maxScore, "courseId": course_id}
    )
    return {"message": "Assignment created!", "assignment": new_assignment}

@router.post("/assignments/{assignment_id}/submit")
async def submit_assignment(assignment_id: str, submission: SubmissionInput, current_user = Depends(get_current_user)):
    if current_user.role != "STUDENT":
        raise HTTPException(status_code=403, detail="Only students can submit assignments.")

    existing_sub = await db.submission.find_unique(where={"studentId_assignmentId": {"studentId": current_user.id, "assignmentId": assignment_id}})
    if existing_sub:
        from datetime import datetime
        updated = await db.submission.update(where={"id": existing_sub.id}, data={"contentUrl": submission.contentUrl, "submittedAt": datetime.utcnow()})
        return {"message": "Submission updated!", "submission": updated}
    else:
        new_sub = await db.submission.create(data={"studentId": current_user.id, "assignmentId": assignment_id, "contentUrl": submission.contentUrl})
        return {"message": "Assignment submitted successfully!", "submission": new_sub}

@router.post("/submissions/{submission_id}/grade")
async def grade_submission(submission_id: str, grade_data: GradeSubmissionInput, current_user = Depends(get_current_user)):
    if current_user.role not in ["LECTURER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized to grade.")

    submission = await db.submission.find_unique(where={"id": submission_id}, include={"assignment": {"include": {"course": True}}})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if current_user.role == "LECTURER" and submission.assignment.course.lecturerId != current_user.id:
        raise HTTPException(status_code=403, detail="You can only grade submissions for your own courses.")

    student_id = submission.studentId
    await db.submission.update(where={"id": submission_id}, data={"score": grade_data.score})

    profile = await db.studentprofile.find_unique(where={"userId": student_id})
    enrollments = await db.enrollment.find_many(where={"studentId": student_id}, include={"course": {"include": {"assignments": True}}})
    total_published_assignments = sum(len(e.course.assignments) for e in enrollments)

    all_student_submissions = await db.submission.find_many(where={"studentId": student_id})
    graded_subs = [s for s in all_student_submissions if s.score is not None]

    if graded_subs:
        average_grade = round(sum(s.score for s in graded_subs) / len(graded_subs), 2)
        actual_passed_count = sum(1 for s in graded_subs if s.score >= 10.0)
    else:
        average_grade = profile.grades1stSem
        actual_passed_count = profile.classesPassed

    profile = await db.studentprofile.update(where={"userId": student_id}, data={"grades1stSem": average_grade, "classesPassed": actual_passed_count})

    if total_published_assignments < 3:
        return {"message": "Grade saved! AI prediction paused until 3 assignments are published.", "score": grade_data.score, "prediction": "PENDING_DATA"}

    ml_scaled_passed = round((actual_passed_count / total_published_assignments) * 6) 
    ml_payload = {"features": {"student_age": profile.ageAtEnrollment, "tuition_status": profile.tuitionUpToDate, "scholarship": profile.scholarship, "grades_1st_sem": profile.grades1stSem, "admission_grade": profile.admissionGrade, "classes_passed": ml_scaled_passed, "debtor": profile.debtor}}

    try:
        async with httpx.AsyncClient() as client:
            ml_response = await client.post(ML_SERVICE_URL, json=ml_payload)
            data = ml_response.json()
            pred, conf = data["prediction"], data["confidence_scores"][data["prediction"]]
        await db.aiprediction.create(data={"studentId": student_id, "prediction": pred, "confidence": conf})
        return {"message": "Submission graded and AI updated securely!", "score": grade_data.score, "prediction": pred}
    except Exception:
        return {"message": "Grade saved, but ML Engine is offline.", "score": grade_data.score}