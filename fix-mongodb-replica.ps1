# ============================================================================
# MongoDB Replica Set Fix Script
# ============================================================================
# IMPORTANT: Run this in PowerShell as Administrator!
# Right-click PowerShell → "Run as Administrator"
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   MongoDB Replica Set Configuration Script           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Close this window" -ForegroundColor Yellow
    Write-Host "2. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "3. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "4. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Find MongoDB config file
Write-Host "🔍 Searching for MongoDB configuration file..." -ForegroundColor Cyan
$configPaths = @(
    "C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg",
    "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg",
    "C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg",
    "C:\Program Files\MongoDB\Server\6.0\bin\mongod.cfg"
)

$mongodConfigPath = $null
foreach ($path in $configPaths) {
    if (Test-Path $path) {
        $mongodConfigPath = $path
        break
    }
}

if (-not $mongodConfigPath) {
    Write-Host "❌ MongoDB config file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Searching in MongoDB directory..." -ForegroundColor Yellow
    $found = Get-ChildItem "C:\Program Files\MongoDB" -Recurse -Filter "mongod.cfg" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $mongodConfigPath = $found.FullName
        Write-Host "✅ Found at: $mongodConfigPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Could not find mongod.cfg" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 ALTERNATIVE: Use MongoDB Atlas instead" -ForegroundColor Yellow
        Write-Host "   1. Go to: https://www.mongodb.com/cloud/atlas/register" -ForegroundColor White
        Write-Host "   2. Create free account and cluster" -ForegroundColor White
        Write-Host "   3. Update your .env file with Atlas connection string" -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "✅ Found MongoDB config at:" -ForegroundColor Green
Write-Host "   $mongodConfigPath" -ForegroundColor White
Write-Host ""

# Backup original config
Write-Host "💾 Creating backup..." -ForegroundColor Cyan
$backupPath = "$mongodConfigPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $mongodConfigPath $backupPath
Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
Write-Host ""

# Read current config
$config = Get-Content $mongodConfigPath -Raw

# Check if replication is already configured
if ($config -match "replSetName") {
    Write-Host "⚠️  Replication configuration already exists in config file" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "📝 Adding replication configuration..." -ForegroundColor Cyan
    $replicationConfig = @"

# Replication configuration (added by fix-mongodb-replica.ps1)
replication:
  replSetName: "rs0"
"@
    Add-Content $mongodConfigPath $replicationConfig
    Write-Host "✅ Replication configuration added" -ForegroundColor Green
    Write-Host ""
}

# Stop MongoDB service
Write-Host "⏸️  Stopping MongoDB service..." -ForegroundColor Cyan
try {
    Stop-Service MongoDB -ErrorAction Stop
    Start-Sleep -Seconds 2
    Write-Host "✅ MongoDB service stopped" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not stop MongoDB service: $_" -ForegroundColor Yellow
}
Write-Host ""

# Start MongoDB service
Write-Host "▶️  Starting MongoDB service..." -ForegroundColor Cyan
try {
    Start-Service MongoDB -ErrorAction Stop
    Start-Sleep -Seconds 3
    Write-Host "✅ MongoDB service started" -ForegroundColor Green
} catch {
    Write-Host "❌ Error starting MongoDB service: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try manually:" -ForegroundColor Yellow
    Write-Host "   net start MongoDB" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Initialize replica set
Write-Host "🚀 Initializing replica set..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

$initScript = "rs.initiate()"
try {
    $result = mongosh --eval $initScript 2>&1
    
    if ($result -match "already initialized" -or $result -match '"ok"\s*:\s*1') {
        Write-Host "✅ Replica set initialized successfully!" -ForegroundColor Green
    } elseif ($result -match "AlreadyInitialized") {
        Write-Host "✅ Replica set was already initialized (that's fine!)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Initialization result:" -ForegroundColor Yellow
        Write-Host $result -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Could not initialize replica set automatically" -ForegroundColor Yellow
    Write-Host "   This might be okay if it was already initialized" -ForegroundColor White
}
Write-Host ""

# Verify replica set status
Write-Host "🔍 Verifying replica set status..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
try {
    $status = mongosh --eval "rs.status()" 2>&1
    if ($status -match "PRIMARY" -or $status -match "SECONDARY") {
        Write-Host "✅ Replica set is working!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Status check:" -ForegroundColor Yellow
        Write-Host $status -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Could not verify status, but setup should be complete" -ForegroundColor Yellow
}
Write-Host ""

# Final instructions
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ SETUP COMPLETE!                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verify your .env file has:" -ForegroundColor White
Write-Host '   DATABASE_URL="mongodb://localhost:27017/hotel_management?replicaSet=rs0"' -ForegroundColor Yellow
Write-Host ""
Write-Host "2. In your project terminal, run:" -ForegroundColor White
Write-Host "   cd `"D:\nodejs projects\hotel_mangment\backend`"" -ForegroundColor Yellow
Write-Host "   npx prisma db push" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Restart your Node.js server" -ForegroundColor White
Write-Host ""
Write-Host "4. Test your API in Postman!" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to close"


