import os


SECRET_KEY = os.getenv("SECRET_KEY", "fallback-local-secret-key-only") 

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 
ML_SERVICE_URL = "http://ml-engine:8000/predict"