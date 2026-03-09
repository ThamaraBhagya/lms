import joblib
import pandas as pd

print("Loading the brain and the translator...")

rf_model = joblib.load('student_rf_model.pkl')
scaler = joblib.load('student_scaler.pkl')


print("Extracting a test student...")
df = pd.read_csv('dataset.csv')

dummy_student = df.drop('Target', axis=1).iloc[[0]] 


print("Translating the data...")
dummy_scaled = scaler.transform(dummy_student)


prediction = rf_model.predict(dummy_scaled)
probabilities = rf_model.predict_proba(dummy_scaled)[0] 

print("\n==================================")
print(f"🔮 AI PREDICTION: {prediction[0].upper()}")
print("==================================")


print("\nConfidence Scores (What the UI will show):")
for outcome, percentage in zip(rf_model.classes_, probabilities):
    print(f"- {outcome}: {round(percentage * 100, 1)}%")