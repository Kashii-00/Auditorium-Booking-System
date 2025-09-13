# Auditorium Booking System Server Startup
# PowerShell Script

# Set console properties
$Host.UI.RawUI.WindowTitle = "Auditorium Booking System Server"
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "Green"
Clear-Host

# Display header
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    AUDITORIUM BOOKING SYSTEM" -ForegroundColor Cyan
Write-Host "         Server Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Go to specific server directory
$ServerPath = "C:\nginx\auditorium\server"
Write-Host "Navigating to: $ServerPath" -ForegroundColor Yellow

# Check if directory exists
if (-not (Test-Path $ServerPath)) {
    Write-Host "ERROR: Server directory not found at $ServerPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location $ServerPath
Write-Host "✅ Server directory found" -ForegroundColor Green
Write-Host ""

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# Always build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
pnpm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if build was successful
if (-not (Test-Path "dist")) {
    Write-Host "❌ ERROR: Build failed - dist folder not created" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Project built successfully" -ForegroundColor Green
Write-Host ""

# Start the built server from dist folder
Write-Host "🚀 Server starting on http://localhost:5003" -ForegroundColor Green
Write-Host "📁 Running from: $ServerPath\dist" -ForegroundColor Cyan
Write-Host "🛑 Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run the server
pnpm start

# Pause at the end
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Server has stopped" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Read-Host "Press Enter to exit"
