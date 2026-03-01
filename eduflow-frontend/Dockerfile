# 1. Use an official, lightweight Node.js image
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy the package files first (this helps Docker cache dependencies)
COPY package*.json ./

# 4. Install the Node modules
RUN npm install

# 5. Copy the rest of your Next.js frontend code
COPY . .

# 6. Make port 3000 available to the world
EXPOSE 3000

# 7. Run the Next.js application in development mode
CMD ["npm", "run", "dev"]