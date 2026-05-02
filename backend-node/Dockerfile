FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for development)
RUN npm install && npm cache clean --force

# Copy the rest of the application
COPY . .

EXPOSE 3001
CMD ["npm", "run", "dev"]
