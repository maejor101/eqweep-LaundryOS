# LaundryOS Unified Service - Force fresh build v4
FROM node:20-alpine AS base

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json bun.lockb ./
COPY laundry-api/package*.json ./laundry-api/
COPY laundry-api/prisma ./laundry-api/prisma

# Install dependencies
RUN npm ci --prefer-offline && npm cache clean --force

# Install backend dependencies and generate Prisma client
WORKDIR /app/laundry-api
RUN npm ci --prefer-offline && npm cache clean --force
RUN npx prisma generate

# Copy source code
WORKDIR /app
COPY . .

# Build frontend with verbose output
RUN echo "Building frontend..." && \
    npm run build && \
    echo "Frontend build completed!" && \
    ls -la /app/ && \
    echo "Contents of dist directory:" && \
    ls -la /app/dist/ && \
    echo "Testing for index.html..." && \
    test -f /app/dist/index.html && echo "✅ index.html found!" || echo "❌ index.html NOT found!"

# Build backend
WORKDIR /app/laundry-api
RUN npm run build

# Final working directory
WORKDIR /app

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "laundry-api/dist/server.js"]