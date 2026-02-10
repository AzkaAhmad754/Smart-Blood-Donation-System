# BloodConnect Setup Script
# Run this after installing PostgreSQL from https://www.postgresql.org/download/windows/

param(
    [string]$PgPassword = "password",
    [string]$PgUser = "postgres",
    [string]$PgPort = "5432"
)

Write-Host "=== BloodConnect Setup ===" -ForegroundColor Cyan

# Find psql
$pgPaths = @(
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin"
)

$psqlPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path "$path\psql.exe") {
        $psqlPath = "$path\psql.exe"
        Write-Host "Found psql at: $psqlPath" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "ERROR: psql not found. Please install PostgreSQL from:" -ForegroundColor Red
    Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing, run this script again." -ForegroundColor Yellow
    exit 1
}

# Set env for psql
$env:PGPASSWORD = $PgPassword

# Create database
Write-Host "`nCreating database 'bloodconnect'..." -ForegroundColor Cyan
& $psqlPath -U $PgUser -p $PgPort -c "CREATE DATABASE bloodconnect;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Database may already exist, continuing..." -ForegroundColor Yellow
}

# Run schema
Write-Host "Running schema..." -ForegroundColor Cyan
& $psqlPath -U $PgUser -p $PgPort -d bloodconnect -f "dbschema.sql"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Schema applied successfully!" -ForegroundColor Green
} else {
    Write-Host "Schema error — check output above" -ForegroundColor Red
}

# Update .env
Write-Host "`nUpdating server/.env..." -ForegroundColor Cyan
$envContent = @"
PORT=5000
DATABASE_URL=postgresql://${PgUser}:${PgPassword}@localhost:${PgPort}/bloodconnect
REDIS_URL=redis://localhost:6379
JWT_SECRET=bloodconnect_super_secret_jwt_key_2024
CLIENT_URL=http://localhost:3000
NODE_ENV=development
"@
Set-Content -Path "server\.env" -Value $envContent
Write-Host "server/.env updated!" -ForegroundColor Green

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start Redis (see README for options)"
Write-Host "  2. cd server && npm run dev"
Write-Host "  3. cd client && npm start"
Write-Host ""
Write-Host "App will be at: http://localhost:3000" -ForegroundColor Green
