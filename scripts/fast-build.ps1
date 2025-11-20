# Quick Build Script for Optimized Performance
# This script builds with caching enabled for maximum speed

Write-Host "🚀 Starting optimized Docker build..." -ForegroundColor Green
Write-Host ""

# Clean up any stopped containers first
Write-Host "🧹 Cleaning up stopped containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

Write-Host ""
Write-Host "📦 Building with cache (optimized for speed)..." -ForegroundColor Cyan
$buildStart = Get-Date

# Build with cache enabled (remove --no-cache for speed)
docker-compose -f docker-compose.dev.yml build

$buildEnd = Get-Date
$buildTime = ($buildEnd - $buildStart).TotalSeconds

Write-Host ""
Write-Host "⏱️  Build completed in $([math]::Round($buildTime, 1)) seconds" -ForegroundColor Green

if ($buildTime -gt 60) {
    Write-Host "⚠️  Build took longer than expected. Check DOCKER-PERFORMANCE.md for optimization tips." -ForegroundColor Yellow
} else {
    Write-Host "✅ Build time is optimal!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚢 Starting services..." -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml up -d

Write-Host ""
Write-Host "🎯 Services should be available at:" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   Database: localhost:5433" -ForegroundColor White

Write-Host ""
Write-Host "📊 To check status: docker-compose -f docker-compose.dev.yml ps" -ForegroundColor Cyan