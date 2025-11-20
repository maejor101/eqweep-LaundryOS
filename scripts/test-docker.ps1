Write-Host "🔍 Checking Docker Environment..." -ForegroundColor Yellow
Write-Host ""

# Test if Docker Desktop is running
Write-Host "Testing Docker daemon..." -ForegroundColor Cyan
try {
    $dockerVersion = docker version --format "{{.Server.Version}}" 2>$null
    if ($dockerVersion) {
        Write-Host "✅ Docker is running (version: $dockerVersion)" -ForegroundColor Green
    } else {
        throw "Docker daemon not responding"
    }
} catch {
    Write-Host "❌ Docker is not running or not accessible!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure Docker Desktop is:" -ForegroundColor Yellow
    Write-Host "1. Installed on your system" -ForegroundColor White
    Write-Host "2. Started and running" -ForegroundColor White
    Write-Host "3. Not in Windows containers mode (use Linux containers)" -ForegroundColor White
    Write-Host ""
    Write-Host "To start Docker Desktop:" -ForegroundColor Yellow
    Write-Host "- Search for Docker Desktop in Start Menu" -ForegroundColor White
    Write-Host "- Wait for it to fully start (whale icon in system tray)" -ForegroundColor White
    Write-Host "- Then run this script again" -ForegroundColor White
    exit 1
}

# Test Docker Compose
Write-Host ""
Write-Host "Testing Docker Compose..." -ForegroundColor Cyan
try {
    $composeVersion = docker-compose version --short 2>$null
    if ($composeVersion) {
        Write-Host "✅ Docker Compose is available (version: $composeVersion)" -ForegroundColor Green
    } else {
        throw "Docker Compose not available"
    }
} catch {
    Write-Host "❌ Docker Compose is not available!" -ForegroundColor Red
    Write-Host "Docker Compose should be included with Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Test basic Docker functionality
Write-Host ""
Write-Host "Testing basic Docker functionality..." -ForegroundColor Cyan
try {
    docker run --rm hello-world | Out-Null
    Write-Host "✅ Docker is working correctly!" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker basic test failed!" -ForegroundColor Red
    Write-Host "Please check Docker Desktop settings" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 Docker environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Cyan
Write-Host "  npm run docker:dev  - Start development environment" -ForegroundColor White
Write-Host "  npm run docker:qa   - Start QA environment" -ForegroundColor White