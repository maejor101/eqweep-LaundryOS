Write-Host "🔄 Resetting QA Database..." -ForegroundColor Yellow
Write-Host ""

# Check if containers are running
$containers = docker-compose -f docker-compose.qa.yml ps -q
if (-not $containers) {
    Write-Host "❌ QA environment is not running. Start it first with:" -ForegroundColor Red
    Write-Host "   .\scripts\start-qa.ps1" -ForegroundColor Gray
    exit 1
}

Write-Host "🗄️ Resetting database schema..." -ForegroundColor Yellow
docker-compose -f docker-compose.qa.yml exec backend-qa npx prisma migrate reset --force

Write-Host "🌱 Running database seed..." -ForegroundColor Yellow
docker-compose -f docker-compose.qa.yml exec backend-qa npm run db:seed

Write-Host ""
Write-Host "✅ QA database reset complete!" -ForegroundColor Green
Write-Host "🔗 Access at: http://localhost:8081" -ForegroundColor Cyan