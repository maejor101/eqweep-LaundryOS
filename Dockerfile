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

# Expose port for Railway
EXPOSE 3000

# Start command - serve the built app on Railway's PORT
CMD ["sh", "-c", "serve -s dist -p ${PORT:-3000} -C"]