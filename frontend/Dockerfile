FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (Vite is dev dependency)
RUN npm install && npm cache clean --force

# Copy the rest of the application
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
