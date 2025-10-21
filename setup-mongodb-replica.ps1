# MongoDB Replica Set Setup Script for Windows
# Run this script as Administrator

Write-Host "MongoDB Replica Set Setup" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Find MongoDB config file
$mongodConfigPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg"

if (-not (Test-Path $mongodConfigPath)) {
    Write-Host "MongoDB config file not found at: $mongodConfigPath" -ForegroundColor Red
    Write-Host "Please update the path in this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found MongoDB config at: $mongodConfigPath" -ForegroundColor Cyan

# Backup original config
$backupPath = "$mongodConfigPath.backup"
if (-not (Test-Path $backupPath)) {
    Copy-Item $mongodConfigPath $backupPath
    Write-Host "Created backup at: $backupPath" -ForegroundColor Cyan
}

# Read config
$config = Get-Content $mongodConfigPath

# Check if replication is already configured
if ($config -match "replSetName") {
    Write-Host "Replication already configured!" -ForegroundColor Yellow
} else {
    # Add replication config
    Write-Host "Adding replication configuration..." -ForegroundColor Cyan
    Add-Content $mongodConfigPath "`nreplication:`n  replSetName: `"rs0`""
}

# Restart MongoDB service
Write-Host "Restarting MongoDB service..." -ForegroundColor Cyan
try {
    Restart-Service MongoDB -ErrorAction Stop
    Start-Sleep -Seconds 3
    Write-Host "MongoDB service restarted successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to restart MongoDB service: $_" -ForegroundColor Red
    exit 1
}

# Initialize replica set
Write-Host "Initializing replica set..." -ForegroundColor Cyan
$initScript = "rs.initiate()"
$result = mongosh --eval $initScript 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Replica set initialized successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Create a .env file in your backend folder with:" -ForegroundColor White
    Write-Host '   DATABASE_URL="mongodb://localhost:27017/hotel_management?replicaSet=rs0"' -ForegroundColor Cyan
    Write-Host "2. Run: npx prisma generate" -ForegroundColor White
    Write-Host "3. Run: npx prisma db push" -ForegroundColor White
    Write-Host "4. Test your API again!" -ForegroundColor White
} else {
    Write-Host "Note: If replica set was already initialized, that's fine!" -ForegroundColor Yellow
    Write-Host "Proceed with creating your .env file." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green

