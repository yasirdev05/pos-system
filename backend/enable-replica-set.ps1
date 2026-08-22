# enable-replica-set.ps1
# Run this ONCE as Administrator to enable MongoDB Replica Set
# This allows Prisma to perform write operations (create/update/delete)
# 
# HOW TO RUN:
#   1. Right-click this file
#   2. Select "Run with PowerShell as Administrator"
#   OR open PowerShell as Administrator and run:
#   Set-ExecutionPolicy Bypass -Scope Process; .\enable-replica-set.ps1

$ErrorActionPreference = "Stop"

$mongoVersion = "7.0"
$configPath = "C:\Program Files\MongoDB\Server\$mongoVersion\bin\mongod.cfg"

Write-Host "=== MongoDB Replica Set Setup ===" -ForegroundColor Cyan
Write-Host "Config file: $configPath" -ForegroundColor Gray

# Read config
$content = Get-Content $configPath -Raw

# Check if already enabled
if ($content -match "replSetName") {
  Write-Host "✅ Replica Set already configured!" -ForegroundColor Green
} else {
  # Add replica set config
  $content = $content -replace '#replication:', "replication:`r`n  replSetName: rs0"
  Set-Content -Path $configPath -Value $content
  Write-Host "✅ Replica Set configuration added" -ForegroundColor Green
}

# Restart MongoDB service
Write-Host "Restarting MongoDB service..." -ForegroundColor Yellow
Restart-Service -Name "MongoDB" -Force
Start-Sleep -Seconds 3

# Initialize replica set using mongo shell
$mongoExe = "C:\Program Files\MongoDB\Server\$mongoVersion\bin\mongod.exe"
$mongoshPath = "C:\Program Files\MongoDB\Server\$mongoVersion\bin\mongosh.exe"

if (Test-Path $mongoshPath) {
  Write-Host "Initializing replica set..." -ForegroundColor Yellow
  & $mongoshPath --quiet --eval "
    try {
      rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] });
      print('Replica set initiated!');
    } catch(e) {
      if (e.codeName === 'AlreadyInitialized') {
        print('Replica set already initialized.');
      } else {
        print('Error: ' + e.message);
      }
    }
  " 2>&1
} else {
  Write-Host "⚠ mongosh not found at $mongoshPath" -ForegroundColor Yellow
  Write-Host "  Please run this command manually in any MongoDB shell:" -ForegroundColor Yellow
  Write-Host '  rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })' -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "MongoDB is now running as a Replica Set (rs0)." -ForegroundColor Green
Write-Host "Update your .env to:" -ForegroundColor Yellow
Write-Host 'DATABASE_URL="mongodb://127.0.0.1:27017/pos_db?replicaSet=rs0&directConnection=true"' -ForegroundColor Cyan
Write-Host ""
Write-Host "Then restart the backend server: npm run dev" -ForegroundColor Yellow
Read-Host "Press Enter to close"
