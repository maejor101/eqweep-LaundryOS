FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json bun.lockb ./
COPY laundry-api/package*.json ./laundry-api/
COPY laundry-api/prisma ./laundry-api/prisma

# Install frontend dependencies
RUN npm install

# Install backend dependencies
WORKDIR /app/laundry-api
RUN npm install

# Go back to root
WORKDIR /app

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Build backend and generate Prisma client
WORKDIR /app/laundry-api
RUN npx prisma generate
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set proper permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Start the unified server
WORKDIR /app/laundry-api
CMD ["node", "dist/server.js"]