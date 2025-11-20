# 🐳 LaundryOS Docker Environment Guide

## Overview

LaundryOS supports two isolated Docker environments:
- **Development (DEV)**: For development and testing
- **Quality Assurance (QA)**: For pre-production testing

Each environment has its own database, backend, and frontend containers running on different ports.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (to clone the repository)

### Development Environment
```powershell
# Option 1: PowerShell script (recommended for Windows)
.\scripts\start-dev.ps1

# Option 2: npm script
npm run docker:dev

# Option 3: Direct docker-compose
docker-compose -f docker-compose.dev.yml up --build
```

**Access URLs:**
- 📱 Frontend: http://localhost:8080
- 🔌 Backend: http://localhost:3001/api/health
- 🗄️ Database: localhost:5433

### QA Environment
```powershell
# Option 1: PowerShell script (recommended for Windows)
.\scripts\start-qa.ps1

# Option 2: npm script
npm run docker:qa

# Option 3: Direct docker-compose
docker-compose -f docker-compose.qa.yml up --build -d
```

**Access URLs:**
- 📱 Frontend: http://localhost:8081
- 🔌 Backend: http://localhost:3002/api/health
- 🗄️ Database: localhost:5434

## 🔧 Environment Details

| Component | DEV Port | QA Port | Container Name | Purpose |
|-----------|----------|---------|----------------|---------|
| Frontend  | 8080     | 8081    | laundryos-frontend-{env} | React + Nginx |
| Backend   | 3001     | 3002    | laundryos-backend-{env} | Node.js + Express |
| Database  | 5433     | 5434    | laundryos-postgres-{env} | PostgreSQL |

## 🗄️ Database Management

### Quick Database Operations
```powershell
# Reset Development Database
.\scripts\reset-dev-db.ps1
# OR
npm run docker:reset-dev

# Reset QA Database  
.\scripts\reset-qa-db.ps1
# OR
npm run docker:reset-qa

# Connect to databases
# Development
psql -h localhost -p 5433 -U postgres -d laundry_os_dev

# QA
psql -h localhost -p 5434 -U postgres -d laundry_os_qa
```

### Advanced Database Operations
```powershell
# Run migrations manually
docker-compose -f docker-compose.dev.yml exec backend-dev npx prisma migrate deploy
docker-compose -f docker-compose.qa.yml exec backend-qa npx prisma migrate deploy

# Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec backend-dev npx prisma studio
# Access at: http://localhost:5555

# View database schema
docker-compose -f docker-compose.dev.yml exec backend-dev npx prisma db pull
```

## 🛠️ Daily Development Workflow

### 1. Start Development Environment
```powershell
# Start all dev services
.\scripts\start-dev.ps1

# Development automatically includes:
# ✅ Hot reload for frontend changes
# ✅ Nodemon for backend changes  
# ✅ Volume mounting for live updates
```

### 2. Make Code Changes
- Frontend changes auto-reload at http://localhost:8080
- Backend changes restart automatically via nodemon
- Database schema changes require migration

### 3. Test Your Changes
```powershell
# View logs in real-time
npm run docker:logs:dev

# Test API endpoints
curl http://localhost:3001/api/health

# Access database directly
psql -h localhost -p 5433 -U postgres -d laundry_os_dev
```

### 4. Deploy to QA for Testing
```powershell
# Start QA environment
.\scripts\start-qa.ps1

# QA environment runs production builds
# Test at http://localhost:8081
```

### 5. Stop Services When Done
```powershell
# Stop all environments
.\scripts\stop-all.ps1

# Or stop specific environment
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.qa.yml down
```

## 🔍 Troubleshooting

### Port Conflicts
If ports are already in use, you can change them in the docker-compose files:

```yaml
# In docker-compose.dev.yml or docker-compose.qa.yml
ports:
  - "8082:80"  # Change 8080 to 8082 for frontend
  - "3003:3001"  # Change 3001 to 3003 for backend
  - "5435:5432"  # Change 5433 to 5435 for database
```

### Container Issues
```powershell
# Check running containers
docker ps

# View container logs
docker logs laundryos-backend-dev
docker logs laundryos-frontend-dev
docker logs laundryos-postgres-dev

# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend-dev

# Rebuild containers from scratch
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

### Database Connection Problems
```powershell
# Check if database is ready
docker-compose -f docker-compose.dev.yml exec postgres-dev psql -U postgres -c "SELECT 1"

# Reset database completely
docker-compose -f docker-compose.dev.yml down -v  # Removes volumes
docker-compose -f docker-compose.dev.yml up --build

# Check database logs
docker-compose -f docker-compose.dev.yml logs postgres-dev
```

### Frontend Build Issues
```powershell
# Clear npm cache and rebuild
docker-compose -f docker-compose.dev.yml down
docker system prune -f
docker-compose -f docker-compose.dev.yml up --build

# Check frontend logs
docker-compose -f docker-compose.dev.yml logs frontend-dev
```

### Complete Reset (Nuclear Option)
```powershell
# Stop everything and remove all data
.\scripts\stop-all.ps1
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.qa.yml down -v
docker system prune -f

# Start fresh
.\scripts\start-dev.ps1
```

## 📦 Container Architecture

### Frontend Container (Nginx + React)
- **Development**: Hot reload with Vite dev server
- **QA**: Production build served by Nginx
- **Features**: React Router support, API proxying to backend

### Backend Container (Node.js + Express)
- **Base**: Node.js 18 Alpine Linux
- **Development**: Nodemon for auto-restart on changes
- **QA**: Production mode with compiled TypeScript
- **Features**: Prisma ORM, JWT authentication, PostgreSQL connection

### Database Container (PostgreSQL)
- **Base**: PostgreSQL 15 Alpine Linux  
- **Features**: Persistent data volumes, automatic initialization
- **Development**: Port 5433, database `laundry_os_dev`
- **QA**: Port 5434, database `laundry_os_qa`

## 🔐 Environment Variables

### Development (.env.dev)
```bash
NODE_ENV=development
VITE_API_URL=http://localhost:3001/api
DATABASE_URL=postgresql://postgres:DevPassword123@localhost:5433/laundry_os_dev
JWT_SECRET=dev-jwt-secret-key-2024
```

### QA (.env.qa)
```bash
NODE_ENV=qa
VITE_API_URL=http://localhost:3002/api
DATABASE_URL=postgresql://postgres:QaPassword456@localhost:5434/laundry_os_qa
JWT_SECRET=qa-jwt-secret-key-2024
```

## 🚀 Advanced Commands

### Performance Monitoring
```powershell
# Monitor resource usage
docker stats

# Check container health
docker inspect laundryos-backend-dev | grep Health -A 10
```

### Backup & Restore
```powershell
# Backup development database
docker-compose -f docker-compose.dev.yml exec postgres-dev pg_dump -U postgres laundry_os_dev > backup_dev.sql

# Restore to QA database
docker-compose -f docker-compose.qa.yml exec -T postgres-qa psql -U postgres laundry_os_qa < backup_dev.sql
```

### Network Debugging
```powershell
# Test container connectivity
docker-compose -f docker-compose.dev.yml exec backend-dev ping postgres-dev
docker-compose -f docker-compose.dev.yml exec frontend-dev wget -qO- http://backend-dev:3001/api/health
```

This Docker setup provides:
✅ **Isolated environments** for dev and QA
✅ **Consistent development experience** across different machines  
✅ **Easy database management** with separate instances
✅ **Hot reload** for rapid development
✅ **Production-like QA environment** for testing
✅ **Simple deployment** with single commands
✅ **Cross-platform compatibility** (Windows, Mac, Linux)