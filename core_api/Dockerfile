# 1. Use an official Python runtime
FROM python:3.11-slim

# 2. Set the working directory
WORKDIR /app

# 3. THE FIX: Install Node.js and npm so Prisma can download its engine
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# 4. Copy the requirements file
COPY requirements.txt .

# 5. Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of the application code
COPY . .

# 7. Generate the Prisma Client (This will work now!)
RUN prisma generate

# 8. Expose port 4000
EXPOSE 4000

# 9. Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4000"]