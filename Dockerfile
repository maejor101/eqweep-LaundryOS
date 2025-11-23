# COMPLETELY NEW BUILD - Railway cache workaround v5
FROM node:20-bullseye

WORKDIR /app

# Copy and install frontend dependencies
COPY package*.json bun.lockb ./
RUN npm install --no-cache

# Copy and install backend dependencies  
COPY laundry-api/package*.json ./laundry-api/
COPY laundry-api/prisma ./laundry-api/prisma
WORKDIR /app/laundry-api
RUN npm install --no-cache
RUN npx prisma generate

# Copy all source code
WORKDIR /app
COPY . .

# Build frontend with maximum verbosity
RUN echo "=== STARTING FRONTEND BUILD ===" && \
    npm run build && \
    echo "=== FRONTEND BUILD COMPLETE ===" && \
    echo "Listing app directory:" && \
    ls -la /app/ && \
    echo "Listing dist directory:" && \
    ls -la /app/dist/ && \
    echo "Checking for index.html:" && \
    if [ -f /app/dist/index.html ]; then echo "SUCCESS: index.html exists!"; else echo "FAIL: index.html missing!"; fi

# Build backend
WORKDIR /app/laundry-api  
RUN npm run build

# Set working directory for runtime
WORKDIR /app

# Environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "laundry-api/dist/server.js"]