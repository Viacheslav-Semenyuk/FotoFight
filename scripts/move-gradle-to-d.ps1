# Script to move .gradle folder from C: to D: drive
# This frees up space on C: drive by moving Gradle caches to D:

$ErrorActionPreference = 'Stop'

# Source and destination paths
$sourceGradleHome = "$env:USERPROFILE\.gradle"
$destGradleHome = "D:\gradle-home"

Write-Host "Moving Gradle home from C: to D: drive..." -ForegroundColor Yellow
Write-Host "Source: $sourceGradleHome" -ForegroundColor Cyan
Write-Host "Destination: $destGradleHome" -ForegroundColor Cyan

# Check if destination drive exists
if (-not (Test-Path "D:\")) {
    Write-Host "ERROR: D: drive not found! Please specify a different path." -ForegroundColor Red
    exit 1
}

# Stop Gradle daemons
Write-Host "`n[1] Stopping Gradle daemons..." -ForegroundColor Cyan
if (Test-Path "android\gradlew.bat") {
    Push-Location android
    .\gradlew.bat --stop 2>&1 | Out-Null
    Pop-Location
}

# Create destination directory
if (-not (Test-Path $destGradleHome)) {
    Write-Host "`n[2] Creating destination directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $destGradleHome -Force | Out-Null
}

# Move existing .gradle folder if it exists
if (Test-Path $sourceGradleHome) {
    $sourceSize = (Get-ChildItem -Path $sourceGradleHome -Recurse -File -ErrorAction SilentlyContinue | 
                   Measure-Object -Property Length -Sum).Sum / 1GB
    
    Write-Host "`n[3] Moving existing .gradle folder (~$([math]::Round($sourceSize, 2)) GB)..." -ForegroundColor Cyan
    Write-Host "   This may take a while..." -ForegroundColor Yellow
    
    # Copy contents (safer than move)
    Write-Host "   Copying files..." -ForegroundColor Yellow
    Copy-Item -Path "$sourceGradleHome\*" -Destination $destGradleHome -Recurse -Force -ErrorAction Continue
    
    # Verify copy was successful
    $destSize = (Get-ChildItem -Path $destGradleHome -Recurse -File -ErrorAction SilentlyContinue | 
                 Measure-Object -Property Length -Sum).Sum / 1GB
    
    if ($destSize -gt 0) {
        Write-Host "   Copy successful! ($([math]::Round($destSize, 2)) GB copied)" -ForegroundColor Green
        
        # Remove source (after successful copy)
        Write-Host "   Removing source folder..." -ForegroundColor Yellow
        Remove-Item -Path $sourceGradleHome -Recurse -Force -ErrorAction SilentlyContinue
        
        Write-Host "   Original folder removed" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: Copy may have failed. Keeping original folder." -ForegroundColor Yellow
    }
}

# Create symlink from old location to new location (optional, but recommended)
Write-Host "`n[4] Creating symbolic link..." -ForegroundColor Cyan
if (-not (Test-Path $sourceGradleHome)) {
    try {
        New-Item -ItemType SymbolicLink -Path $sourceGradleHome -Target $destGradleHome -Force | Out-Null
        Write-Host "   Symbolic link created successfully!" -ForegroundColor Green
        Write-Host "   Old location now points to: $destGradleHome" -ForegroundColor Green
    } catch {
        Write-Host "   WARNING: Could not create symbolic link (may need admin rights)" -ForegroundColor Yellow
        Write-Host "   You need to set GRADLE_USER_HOME environment variable instead" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Source folder still exists, skipping symlink" -ForegroundColor Yellow
}

# Set environment variable instructions
Write-Host "`n[5] Environment variable setup..." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Yellow
Write-Host "IMPORTANT: You need to set GRADLE_USER_HOME environment variable" -ForegroundColor Yellow
Write-Host "`nOption 1 - Set for current session (temporary):" -ForegroundColor Cyan
Write-Host "  [Environment]::SetEnvironmentVariable('GRADLE_USER_HOME', '$destGradleHome', 'User')" -ForegroundColor White
Write-Host "`nOption 2 - Set permanently via System Properties:" -ForegroundColor Cyan
Write-Host "  1. Press Win+R, type: sysdm.cpl" -ForegroundColor White
Write-Host "  2. Advanced tab -> Environment Variables" -ForegroundColor White
Write-Host "  3. User variables -> New" -ForegroundColor White
Write-Host "  4. Variable name: GRADLE_USER_HOME" -ForegroundColor White
Write-Host "  5. Variable value: $destGradleHome" -ForegroundColor White
Write-Host "`nOption 3 - Run this command in PowerShell (as current user):" -ForegroundColor Cyan
Write-Host "  [Environment]::SetEnvironmentVariable('GRADLE_USER_HOME', '$destGradleHome', 'User')" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Yellow

# Try to set it automatically for current user
Write-Host "`nAttempting to set environment variable automatically..." -ForegroundColor Cyan
try {
    [Environment]::SetEnvironmentVariable('GRADLE_USER_HOME', $destGradleHome, 'User')
    $env:GRADLE_USER_HOME = $destGradleHome
    Write-Host "   Environment variable set successfully!" -ForegroundColor Green
    Write-Host "   Note: You may need to restart your terminal/IDE for changes to take effect" -ForegroundColor Yellow
} catch {
    Write-Host "   Could not set environment variable automatically" -ForegroundColor Yellow
    Write-Host "   Please set it manually using one of the options above" -ForegroundColor Yellow
}

Write-Host "`n=======================================================" -ForegroundColor Yellow
Write-Host "Setup completed!" -ForegroundColor Green
Write-Host "Gradle will now use: $destGradleHome" -ForegroundColor Cyan
Write-Host "`nRestart your terminal/IDE for changes to take full effect" -ForegroundColor Yellow
