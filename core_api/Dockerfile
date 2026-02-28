# 1. Use an official Python runtime as a parent image
FROM python:3.11-slim

# 2. Set the working directory in the container
WORKDIR /app

# 3. Copy the requirements file into the container
COPY requirements.txt .

# 4. Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of the application code
COPY . .

# 6. Generate the Prisma Client
RUN prisma generate

# 7. Make port 4000 available to the world outside this container
EXPOSE 4000

# 8. Run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4000"]