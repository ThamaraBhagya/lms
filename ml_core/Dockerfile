# 1. Use an official Python runtime as a parent image
FROM python:3.11-slim

# 2. Set the working directory in the container
WORKDIR /app

# 3. Copy the requirements file into the container
COPY requirements.txt .

# 4. Install the machine learning libraries
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the Python code AND your saved .pkl model files
COPY . .

# 6. Make port 8000 available to the world outside this container
EXPOSE 8000

# 7. Run the AI FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]