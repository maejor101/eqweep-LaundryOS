# 🐳 LaundryOS Docker Setup - Quick Start Guide

## ⚠️ IMPORTANT: Docker Desktop Required

Before running any Docker commands, you MUST have Docker Desktop installed and running.

### Step 1: Install Docker Desktop (if not already installed)
1. Download from: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop for Windows
3. Restart your computer after installation

### Step 2: Start Docker Desktop
1. Search for "Docker Desktop" in Start Menu
2. Click to start Docker Desktop
3. **Wait for the whale icon to appear in system tray**
4. **Wait for "Docker Desktop is running" message**
5. Make sure it's using **Linux containers** (not Windows containers)

### Step 3: Verify Docker is Working
Open PowerShell and run:
```powershell
# Test Docker
docker --version
docker ps

# Should show version info and empty container list
```

### Step 4: Start LaundryOS Environments

Once Docker is running, you can use these commands:

#### Quick Setup (Recommended)
```powershell
# Navigate to project directory
cd "c:\Users\vusum\Downloads\flow-build-smart-main\flow-build-smart-main"

# Run the setup script
.\scripts\setup.ps1
```

#### Manual Commands

**Development Environment** (Port 8080):
```powershell
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Access at: http://localhost:8080
# Backend API: http://localhost:3001/api/health
# Database: localhost:5433
```

**QA Environment** (Port 8081):
```powershell
# Start QA environment (runs in background)
docker-compose -f docker-compose.qa.yml up --build -d

# Access at: http://localhost:8081
# Backend API: http://localhost:3002/api/health
# Database: localhost:5434
```

**Stop All Environments:**
```powershell
# Stop all containers
.\scripts\stop-all.ps1

# OR manually:
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.qa.yml down
```

## 🔧 Environment Details

| Environment | Frontend | Backend | Database | Purpose |
|-------------|----------|---------|----------|---------|
| **DEV**     | :8080    | :3001   | :5433    | Development with hot reload |
| **QA**      | :8081    | :3002   | :5434    | Testing production builds |

## 📁 What We Created

Your project now includes:

### Docker Configuration:
- `docker-compose.dev.yml` - Development environment
- `docker-compose.qa.yml` - QA environment  
- `Dockerfile.frontend` - React app containerization
- `laundry-api/Dockerfile` - Backend API containerization
- `nginx.conf` - Web server configuration

### Environment Files:
- `.env.dev` - Development environment variables
- `.env.qa` - QA environment variables
- `laundry-api/.env.dev` - Backend dev config
- `laundry-api/.env.qa` - Backend QA config

### Management Scripts:
- `scripts/setup.ps1` - Interactive setup wizard
- `scripts/start-dev.ps1` - Start development environment
- `scripts/start-qa.ps1` - Start QA environment
- `scripts/stop-all.ps1` - Stop all environments
- `scripts/test-docker.ps1` - Test Docker setup
- `scripts/reset-dev-db.ps1` - Reset development database
- `scripts/reset-qa-db.ps1` - Reset QA database

## 🚨 Troubleshooting

### "Docker not found" or "pipe" errors:
1. Ensure Docker Desktop is installed
2. Start Docker Desktop and wait for it to fully load
3. Check system tray for Docker whale icon
4. Run `docker --version` to verify

### Port conflicts:
- DEV uses ports: 8080, 3001, 5433
- QA uses ports: 8081, 3002, 5434
- Stop other services using these ports

### Database connection issues:
```powershell
# Reset everything
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.qa.yml down -v

# Start fresh
docker-compose -f docker-compose.dev.yml up --build
```

## 🎯 Next Steps

1. **Start Docker Desktop** (most important!)
2. Run `.\scripts\setup.ps1` for guided setup
3. Choose Development environment to start coding
4. Use QA environment for testing
5. Both environments have separate databases

## 📞 Need Help?

If you encounter issues:
1. Ensure Docker Desktop is running (check system tray)
2. Run `.\scripts\test-docker.ps1` to diagnose problems
3. Check Docker Desktop settings (ensure Linux containers mode)
4. Restart Docker Desktop if needed

Happy coding! 🚀