# 1. Use an official Python runtime
FROM python:3.11-slim

# 2. Set the working directory
WORKDIR /app

# 3. THE FIX: Install OpenSSL (required by Prisma), Node.js, and npm
RUN apt-get update && apt-get install -y openssl nodejs npm && rm -rf /var/lib/apt/lists/*

# 4. Copy the requirements file
COPY requirements.txt .

# 5. Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of the application code
COPY . .

# 7. THE NETWORK FIX: Increase npm timeout to prevent ECONNRESET, then generate Prisma Client
RUN npm config set fetch-retry-maxtimeout 600000 -g && \
    npm config set fetch-retries 5 -g && \
    prisma generate

# 8. Expose port 4000
EXPOSE 4000

# 9. Run the application (Push DB schema to Postgres first, then start FastAPI)
CMD sh -c "prisma db push && uvicorn main:app --host 0.0.0.0 --port 4000"