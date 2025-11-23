FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json bun.lockb ./
COPY laundry-api/package*.json ./laundry-api/
COPY laundry-api/prisma ./laundry-api/prisma

# Install all dependencies
RUN npm install

# Install backend dependencies
WORKDIR /app/laundry-api
RUN npm install
RUN npx prisma generate

# Go back to root and copy all source code
WORKDIR /app
COPY . .

# Build frontend first and verify
RUN npm run build && \
    echo "=== Frontend Build Complete ===" && \
    ls -la /app/dist/ && \
    test -f /app/dist/index.html && echo "✅ Frontend index.html created successfully"

# Build backend
WORKDIR /app/laundry-api
RUN npm run build && \
    echo "=== Backend Build Complete ===" && \
    ls -la /app/laundry-api/dist/

# Go back to app root and set up for serving
WORKDIR /app

# Expose port
EXPOSE 3000

# Set NODE_ENV for production
ENV NODE_ENV=production

# Start the unified server
CMD ["node", "laundry-api/dist/server.js"]