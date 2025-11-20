Write-Host "🛑 Stopping all LaundryOS environments..." -ForegroundColor Red
Write-Host ""

Write-Host "📦 Stopping Development environment..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

Write-Host "📦 Stopping QA environment..." -ForegroundColor Yellow  
docker-compose -f docker-compose.qa.yml down

Write-Host ""
Write-Host "✅ All environments stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To remove volumes and start fresh:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.dev.yml down -v" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.qa.yml down -v" -ForegroundColor Gray