from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib


app = FastAPI(title="Student Attrition ML API", description="Microservice for predicting student outcomes")


try:
    rf_model = joblib.load('student_rf_model.pkl')
    scaler = joblib.load('student_scaler.pkl')
except Exception as e:
    print(f"Error loading model files: {e}. Make sure the .pkl files are in the same folder!")


class StudentData(BaseModel):
    features: dict


@app.post("/predict")
def predict_student_status(data: StudentData):
    try:
        incoming_data = data.features
        expected_columns = scaler.feature_names_in_
        
        
        full_student_profile = {col: 0.0 for col in expected_columns}
        
        
        def safe_update(partial_name, value):
            for col in expected_columns:
                if partial_name.lower() in col.lower():
                    full_student_profile[col] = value

        
        safe_update("Previous qualification (grade)", 133.0)
        safe_update("1st sem (enrolled)", 6.0)
        safe_update("1st sem (evaluations)", 6.0)
        safe_update("2nd sem (enrolled)", 6.0)
        safe_update("2nd sem (evaluations)", 6.0)
        
        
        safe_update("Age at enrollment", incoming_data.get("student_age", 20))
        safe_update("Tuition fees up to date", incoming_data.get("tuition_status", 1))
        safe_update("Scholarship holder", incoming_data.get("scholarship", 0))
        
        grades = incoming_data.get("grades_1st_sem", 13.0)
        safe_update("1st sem (grade)", grades)
        safe_update("2nd sem (grade)", grades)

        
        safe_update("Admission grade", incoming_data.get("admission_grade", 127.0))
        safe_update("1st sem (approved)", incoming_data.get("classes_passed", 6))
        safe_update("2nd sem (approved)", incoming_data.get("classes_passed", 6))
        safe_update("Debtor", incoming_data.get("debtor", 0))
        
        
        df = pd.DataFrame([full_student_profile])
        
        
        scaled_features = scaler.transform(df)
        prediction = rf_model.predict(scaled_features)[0]
        probabilities = rf_model.predict_proba(scaled_features)[0]
        
        confidence_scores = {
            class_name: round(prob * 100, 1)
            for class_name, prob in zip(rf_model.classes_, probabilities)
        }
        
        return {
            "status": "success",
            "prediction": prediction,
            "confidence_scores": confidence_scores
        }
        
    except Exception as e:
        print(f"🚨 ML ENGINE CRASH REASON: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))