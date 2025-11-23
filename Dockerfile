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

# Build frontend and verify it was created
RUN npm run build && \
    ls -la /app/dist && \
    echo "Frontend build completed, files:" && \
    find /app/dist -type f | head -10

# Build backend and generate Prisma client
WORKDIR /app/laundry-api
RUN npx prisma generate
RUN npm run build

# Verify both builds exist
RUN echo "=== Build Verification ===" && \
    echo "Frontend files in /app/dist:" && \
    ls -la /app/dist/ && \
    echo "Backend files in /app/laundry-api/dist:" && \
    ls -la /app/laundry-api/dist/ && \
    echo "Frontend index.html check:" && \
    test -f /app/dist/index.html && echo "✅ index.html exists" || echo "❌ index.html missing"

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set proper permissions AFTER builds are complete
RUN chown -R nextjs:nodejs /app && \
    chmod -R 755 /app/dist

USER nextjs

# Expose port
EXPOSE 3000

# Start the unified server
WORKDIR /app/laundry-api
CMD ["node", "dist/server.js"]