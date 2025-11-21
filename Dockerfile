FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json bun.lockb ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install serve for serving static files
RUN npm install -g serve

# Expose port 3000 (Railway will map to $PORT)
EXPOSE 3000

# Start command with fallback port
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]