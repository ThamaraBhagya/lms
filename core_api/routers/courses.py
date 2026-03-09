from fastapi import APIRouter, HTTPException, Depends
from database import db
from schemas import CourseInput
from security import get_current_user

router = APIRouter(prefix="/api/courses", tags=["Courses"])

@router.post("/")
async def create_course(course: CourseInput, current_user = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only Administrators can create courses.")

    existing = await db.course.find_unique(where={"courseCode": course.courseCode})
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")

    lecturer = await db.user.find_unique(where={"id": course.lecturerId})
    if not lecturer or lecturer.role != "LECTURER":
        raise HTTPException(status_code=400, detail="Invalid Lecturer assigned.")

    new_course = await db.course.create(
        data={"courseCode": course.courseCode, "title": course.title, "description": course.description, "lecturerId": course.lecturerId}
    )
    return {"message": "Course created successfully", "course": new_course}

@router.get("/")
async def get_courses(current_user = Depends(get_current_user)):
    return await db.course.find_many(
        include={
            "lecturer": True,
            "enrollments": {"include": {"student": True}},
            "assignments": {"include": {"submissions": True}}
        },
        order={"courseCode": "asc"}
    )

@router.post("/{course_id}/enroll")
async def enroll_in_course(course_id: str, current_user = Depends(get_current_user)):
    course = await db.course.find_unique(where={"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = await db.enrollment.find_unique(where={"studentId_courseId": {"studentId": current_user.id, "courseId": course_id}})
    if existing:
        raise HTTPException(status_code=400, detail="You are already enrolled in this course")

    new_enrollment = await db.enrollment.create(data={"studentId": current_user.id, "courseId": course_id})
    return {"message": "Successfully enrolled!", "enrollment_id": new_enrollment.id}