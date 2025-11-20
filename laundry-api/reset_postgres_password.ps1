# PostgreSQL Password Reset Script for LaundryOS
# Run this script as Administrator

Write-Host "===============================================" -ForegroundColor Green
Write-Host "PostgreSQL Password Reset for LaundryOS" -ForegroundColor Green  
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Add PostgreSQL to PATH
$env:PATH += ";C:\Program Files\PostgreSQL\18\bin"

Write-Host "Step 1: Stopping PostgreSQL service..." -ForegroundColor Yellow
try {
    Stop-Service postgresql-x64-18 -Force
    Write-Host "✓ PostgreSQL service stopped" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to stop service. Make sure you're running as Administrator." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Backing up configuration..." -ForegroundColor Yellow
$configPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$backupPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf.backup"

try {
    Copy-Item $configPath $backupPath
    Write-Host "✓ Configuration backed up" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to backup configuration" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 3: Modifying authentication settings..." -ForegroundColor Yellow
try {
    # Read the config file
    $config = Get-Content $configPath
    
    # Replace md5 authentication with trust for localhost
    $newConfig = $config -replace "host\s+all\s+all\s+127\.0\.0\.1/32\s+md5", "host    all             all             127.0.0.1/32            trust"
    $newConfig = $newConfig -replace "host\s+all\s+all\s+::1/128\s+md5", "host    all             all             ::1/128                 trust"
    
    # Write the modified config
    $newConfig | Set-Content $configPath
    Write-Host "✓ Configuration modified for password reset" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to modify configuration" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Starting PostgreSQL service..." -ForegroundColor Yellow
try {
    Start-Service postgresql-x64-18
    Start-Sleep -Seconds 3
    Write-Host "✓ PostgreSQL service started" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to start service" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 5: Resetting password..." -ForegroundColor Yellow
try {
    # Reset the postgres user password
    $sqlCommand = "ALTER USER postgres PASSWORD 'laundryos123';"
    echo $sqlCommand | psql -U postgres -h localhost -d postgres
    Write-Host "✓ Password reset to 'laundryos123'" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to reset password" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 6: Restoring security settings..." -ForegroundColor Yellow
try {
    Stop-Service postgresql-x64-18 -Force
    Copy-Item $backupPath $configPath -Force
    Start-Service postgresql-x64-18
    Start-Sleep -Seconds 3
    Write-Host "✓ Security settings restored" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to restore security settings" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 7: Testing connection..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD="laundryos123"
    $result = psql -U postgres -h localhost -d postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connection successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host "SUCCESS! Your PostgreSQL password is now: laundryos123" -ForegroundColor Green
        Write-Host "===============================================" -ForegroundColor Green
    } else {
        Write-Host "✗ Connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Connection test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Return to your development terminal" -ForegroundColor White
Write-Host "2. I'll update the .env file with the new password" -ForegroundColor White
Write-Host "3. We'll create the database and run migrations" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
Read-Host