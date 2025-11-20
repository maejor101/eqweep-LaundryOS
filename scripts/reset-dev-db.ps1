Write-Host "🔄 Resetting Development Database..." -ForegroundColor Yellow
Write-Host ""

# Check if containers are running
$containers = docker-compose -f docker-compose.dev.yml ps -q
if (-not $containers) {
    Write-Host "❌ Development environment is not running. Start it first with:" -ForegroundColor Red
    Write-Host "   .\scripts\start-dev.ps1" -ForegroundColor Gray
    exit 1
}

Write-Host "🗄️ Resetting database schema..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml exec backend-dev npx prisma migrate reset --force

Write-Host "🌱 Running database seed..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml exec backend-dev npm run db:seed

Write-Host ""
Write-Host "✅ Development database reset complete!" -ForegroundColor Green
Write-Host "🔗 Access at: http://localhost:8080" -ForegroundColor Cyan