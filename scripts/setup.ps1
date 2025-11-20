Write-Host "🚀 LaundryOS Docker Setup" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

Write-Host "This will set up LaundryOS with Docker in two environments:" -ForegroundColor White
Write-Host "📦 DEV Environment  - Port 8080 (Development)" -ForegroundColor Cyan
Write-Host "📦 QA Environment   - Port 8081 (Testing)" -ForegroundColor Yellow
Write-Host ""

# Step 1: Test Docker
Write-Host "Step 1: Testing Docker..." -ForegroundColor Yellow
Write-Host ""
PowerShell -File ".\scripts\test-docker.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Docker setup failed. Please fix Docker issues first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Choose environment to start:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Development Environment (Port 8080)" -ForegroundColor Cyan
Write-Host "2. QA Environment (Port 8081)" -ForegroundColor Yellow  
Write-Host "3. Both Environments" -ForegroundColor Green
Write-Host "4. Just show me the commands" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Starting Development Environment..." -ForegroundColor Cyan
        PowerShell -File ".\scripts\start-dev.ps1"
    }
    "2" {
        Write-Host ""
        Write-Host "🧪 Starting QA Environment..." -ForegroundColor Yellow
        PowerShell -File ".\scripts\start-qa.ps1"
    }
    "3" {
        Write-Host ""
        Write-Host "🚀 Starting Development Environment..." -ForegroundColor Cyan
        Start-Process PowerShell -ArgumentList "-File `"$(Get-Location)\scripts\start-dev.ps1`""
        Start-Sleep 5
        Write-Host "🧪 Starting QA Environment..." -ForegroundColor Yellow
        PowerShell -File ".\scripts\start-qa.ps1"
    }
    "4" {
        Write-Host ""
        Write-Host "Available commands:" -ForegroundColor Green
        Write-Host ""
        Write-Host "Development:" -ForegroundColor Cyan
        Write-Host "  .\scripts\start-dev.ps1       - Start dev environment" -ForegroundColor White
        Write-Host "  .\scripts\reset-dev-db.ps1    - Reset dev database" -ForegroundColor White
        Write-Host ""
        Write-Host "QA:" -ForegroundColor Yellow
        Write-Host "  .\scripts\start-qa.ps1        - Start QA environment" -ForegroundColor White
        Write-Host "  .\scripts\reset-qa-db.ps1     - Reset QA database" -ForegroundColor White
        Write-Host ""
        Write-Host "Management:" -ForegroundColor Gray
        Write-Host "  .\scripts\stop-all.ps1        - Stop all environments" -ForegroundColor White
        Write-Host "  .\scripts\test-docker.ps1     - Test Docker setup" -ForegroundColor White
        Write-Host ""
        Write-Host "Direct Docker Compose:" -ForegroundColor Magenta
        Write-Host "  docker-compose -f docker-compose.dev.yml up --build" -ForegroundColor White
        Write-Host "  docker-compose -f docker-compose.qa.yml up --build -d" -ForegroundColor White
    }
    default {
        Write-Host ""
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}