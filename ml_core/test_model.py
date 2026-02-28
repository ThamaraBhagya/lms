import joblib
import pandas as pd

print("Loading the brain and the translator...")
# 1. Load the exported model and scaler
rf_model = joblib.load('student_rf_model.pkl')
scaler = joblib.load('student_scaler.pkl')

# 2. Grab a "dummy" student from the dataset
print("Extracting a test student...")
df = pd.read_csv('dataset.csv')
# .iloc[[0]] grabs the very first row. We drop 'Target' so the model doesn't see the answer!
dummy_student = df.drop('Target', axis=1).iloc[[0]] 

# 3. Translate (Scale) the data using the exact rules from training
print("Translating the data...")
dummy_scaled = scaler.transform(dummy_student)

# 4. Make the Prediction!
prediction = rf_model.predict(dummy_scaled)
probabilities = rf_model.predict_proba(dummy_scaled)[0] # Gets the percentages

print("\n==================================")
print(f"🔮 AI PREDICTION: {prediction[0].upper()}")
print("==================================")

# This part is crucial for your Next.js UI Dashboard!
print("\nConfidence Scores (What the UI will show):")
for outcome, percentage in zip(rf_model.classes_, probabilities):
    print(f"- {outcome}: {round(percentage * 100, 1)}%")