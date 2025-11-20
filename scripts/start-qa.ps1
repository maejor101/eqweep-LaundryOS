Write-Host "🧪 Starting LaundryOS QA Environment..." -ForegroundColor Yellow
Write-Host ""

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Building and starting QA containers..." -ForegroundColor Yellow
Write-Host ""

# Start QA environment in detached mode
docker-compose -f docker-compose.qa.yml up --build -d

Write-Host ""
Write-Host "✅ QA environment started!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:8081" -ForegroundColor Cyan
Write-Host "🔌 Backend: http://localhost:3002/api/health" -ForegroundColor Cyan
Write-Host "🗄️ Database: localhost:5434" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔍 Check container status with: docker ps" -ForegroundColor Yellow
Write-Host "📋 View logs with: docker-compose -f docker-compose.qa.yml logs -f" -ForegroundColor Yellow
Write-Host "🛑 Stop with: docker-compose -f docker-compose.qa.yml down" -ForegroundColor Yellow