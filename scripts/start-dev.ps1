Write-Host "🚀 Starting LaundryOS Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Building and starting development containers..." -ForegroundColor Yellow
Write-Host ""

# Start development environment
docker-compose -f docker-compose.dev.yml up --build

Write-Host ""
Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🔌 Backend: http://localhost:3001/api/health" -ForegroundColor Cyan
Write-Host "🗄️ Database: localhost:5433" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow