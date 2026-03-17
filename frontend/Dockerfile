FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./

RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
