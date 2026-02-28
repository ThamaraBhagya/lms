import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib


print("Loading dataset...")
df = pd.read_csv('dataset.csv')


X = df.drop('Target', axis=1) # 'Target' contains Dropout, Enrolled, Graduate
y = df['Target']

#data split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)


print("Scaling features...")

scaler = StandardScaler()


X_train_scaled = scaler.fit_transform(X_train)


X_test_scaled = scaler.transform(X_test)


print("Applying SMOTE to balance classes...")
smote = SMOTE(random_state=42)

X_train_balanced, y_train_balanced = smote.fit_resample(X_train_scaled, y_train)


print("Training the Random Forest model...")
# Random Forest is excellent here because it handles complex, non-linear relationships well
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train_balanced, y_train_balanced)


print("\n--- Model Evaluation ---")
y_pred = rf_model.predict(X_test_scaled)

print(classification_report(y_test, y_pred))


print("\nExporting model and scaler for the API...")

joblib.dump(rf_model, 'student_rf_model.pkl')
joblib.dump(scaler, 'student_scaler.pkl')

print("Phase 1 Complete! Artifacts saved.")