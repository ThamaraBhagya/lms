from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prisma import Prisma
from pydantic import BaseModel, Field
import httpx

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

class StudentInput(BaseModel):
    # Field(..., ge=MIN, le=MAX) ensures the value is Greater/Equal to MIN and Less/Equal to MAX
    age: int = Field(..., ge=15, le=100, description="Age must be a realistic human age")
    tuition_up_to_date: int = Field(..., ge=0, le=1, description="Must be exactly 0 or 1")
    scholarship: int = Field(..., ge=0, le=1, description="Must be exactly 0 or 1")
    grades_1st_sem: float = Field(..., ge=0.0, le=20.0, description="Portuguese grades are 0 to 20")
    admission_grade: float = Field(127.0, ge=0.0, le=200.0, description="Admission score 0 to 200")
    classes_passed: int = Field(6, ge=0, le=6, description="Cannot pass more than 6 classes")
    debtor: int = Field(0, ge=0, le=1, description="Must be exactly 0 or 1")

@app.post("/api/students")
async def create_student(student: StudentInput):
    new_student = await db.student.create(
        data={
            "age": student.age,
            "tuition_up_to_date": student.tuition_up_to_date,
            "scholarship": student.scholarship,
            "grades_1st_sem": student.grades_1st_sem,
            "admission_grade": student.admission_grade,
            "classes_passed": student.classes_passed,
            "debtor": student.debtor
        }
    )
    return {"message": "Student saved", "student": new_student}


@app.post("/api/students/{student_id}/analyze")
async def analyze_student(student_id: int):
    
    student = await db.student.find_unique(where={"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Package for ML Engine
    ml_payload = {
        "features": {
            "student_age": student.age,
            "tuition_status": student.tuition_up_to_date,
            "scholarship": student.scholarship,
            "grades_1st_sem": student.grades_1st_sem,
            
            # Add the new fields here so the AI receives them!
            "admission_grade": student.admission_grade,
            "classes_passed": student.classes_passed,
            "debtor": student.debtor
        }
    }

    # Send to ML Engine
    async with httpx.AsyncClient() as client:
        ml_response = await client.post(ML_SERVICE_URL, json=ml_payload)
        ml_response.raise_for_status()
        
        prediction_data = ml_response.json()
        pred = prediction_data["prediction"]
        conf = prediction_data["confidence_scores"][pred]

    # Save ML results back to DB
    updated_student = await db.student.update(
        where={"id": student_id},
        data={
            "ml_prediction": pred,
            "ml_confidence": conf
        }
    )

    return {"message": "Analysis complete", "data": updated_student}



@app.get("/api/students")
async def get_all_students():
   
    students = await db.student.find_many(order={"id": "desc"})
    return students