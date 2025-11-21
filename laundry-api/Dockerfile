FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache git openssl

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files first (better layer caching)
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/

# Install dependencies with cache mount (Railway-compatible format)
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm ci --prefer-offline && \
    npm cache clean --force

# Generate Prisma client (before copying source code)
RUN npx prisma generate

# Copy source code (separate layer)
COPY . .

# Build TypeScript
RUN npm run build && \
    rm -rf src tsconfig.json

# Set proper permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3001

# Use node directly for better performance
CMD ["node", "dist/server.js"]