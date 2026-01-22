# Script to help fix NDK installation issues
# This script checks for NDK installations and helps identify which version to use

Write-Host "Checking Android NDK installations..." -ForegroundColor Cyan

$sdkPath = $env:ANDROID_HOME
if (-not $sdkPath) {
    $sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
}

$ndkPath = Join-Path $sdkPath "ndk"

if (-not (Test-Path $ndkPath)) {
    Write-Host "NDK directory not found at: $ndkPath" -ForegroundColor Red
    Write-Host "Please install NDK through Android Studio SDK Manager" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nFound NDK directory: $ndkPath" -ForegroundColor Green
Write-Host "`nChecking installed NDK versions..." -ForegroundColor Cyan

$ndkVersions = Get-ChildItem $ndkPath -Directory -ErrorAction SilentlyContinue | Where-Object { 
    $sourceProps = Join-Path $_.FullName "source.properties"
    Test-Path $sourceProps
}

if ($ndkVersions.Count -eq 0) {
    Write-Host "`nNo valid NDK installations found (missing source.properties files)" -ForegroundColor Red
    Write-Host "`nPlease reinstall NDK through Android Studio:" -ForegroundColor Yellow
    Write-Host "1. Open Android Studio" -ForegroundColor White
    Write-Host "2. Go to Tools -> SDK Manager" -ForegroundColor White
    Write-Host "3. Open SDK Tools tab" -ForegroundColor White
    Write-Host "4. Enable 'Show Package Details'" -ForegroundColor White
    Write-Host "5. Install 'NDK (Side by side)' version 26.1.10909125 or 25.1.8937393" -ForegroundColor White
    exit 1
}

Write-Host "`nValid NDK versions found:" -ForegroundColor Green
foreach ($version in $ndkVersions) {
    $sourceProps = Join-Path $version.FullName "source.properties"
    $content = Get-Content $sourceProps -ErrorAction SilentlyContinue
    $pkgRevision = ($content | Select-String "Pkg.Revision\s*=\s*(.+)").Matches.Groups[1].Value
    Write-Host "  - $($version.Name) (Revision: $pkgRevision)" -ForegroundColor White
}

Write-Host "`nTo use a specific NDK version, edit android/gradle.properties and set:" -ForegroundColor Cyan
Write-Host "android.ndkVersion=<version>" -ForegroundColor Yellow
Write-Host "`nExample: android.ndkVersion=25.1.8937393" -ForegroundColor Gray
