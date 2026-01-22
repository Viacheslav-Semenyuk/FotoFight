# Android SDK Setup Script for Windows
# This script helps configure ANDROID_HOME and PATH for Android development

Write-Host "Android SDK Setup Script" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check common Android SDK locations
$possiblePaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:ProgramFiles\Android\Android Studio\sdk",
    "${env:ProgramFiles(x86)}\Android\android-sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk"
)

$sdkPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $sdkPath = $path
        Write-Host "[OK] Found Android SDK at: $sdkPath" -ForegroundColor Green
        break
    }
}

if (-not $sdkPath) {
    Write-Host "[ERROR] Android SDK not found in common locations" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Android Studio from: https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host "After installation, the SDK will typically be at: $env:LOCALAPPDATA\Android\Sdk" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or if you have Android Studio installed, please provide the SDK path:" -ForegroundColor Yellow
    $sdkPath = Read-Host "Enter Android SDK path"
    
    if (-not (Test-Path $sdkPath)) {
        Write-Host "[ERROR] Invalid path provided. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Verify SDK structure
$platformTools = Join-Path $sdkPath "platform-tools"
$tools = Join-Path $sdkPath "tools"

if (-not (Test-Path $platformTools)) {
    Write-Host "[ERROR] platform-tools directory not found. SDK may be incomplete." -ForegroundColor Red
    Write-Host "  Please install Android SDK Platform-Tools via Android Studio SDK Manager" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] SDK structure verified" -ForegroundColor Green
Write-Host ""

# Check current environment variables
$currentAndroidHome = [Environment]::GetEnvironmentVariable("ANDROID_HOME", "User")
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")

Write-Host "Current Configuration:" -ForegroundColor Cyan
Write-Host "  ANDROID_HOME: $currentAndroidHome"
Write-Host ""

# Set ANDROID_HOME
if ($currentAndroidHome -ne $sdkPath) {
    Write-Host "Setting ANDROID_HOME to: $sdkPath" -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "User")
    $env:ANDROID_HOME = $sdkPath
    Write-Host "[OK] ANDROID_HOME set" -ForegroundColor Green
} else {
    Write-Host "[OK] ANDROID_HOME already set correctly" -ForegroundColor Green
}

# Add to PATH if not already there
$platformToolsPath = Join-Path $sdkPath "platform-tools"
$toolsPath = Join-Path $sdkPath "tools"
$toolsBinPath = Join-Path $sdkPath "tools\bin"

$pathsToAdd = @($platformToolsPath, $toolsPath, $toolsBinPath)
$pathsAdded = @()

foreach ($pathToAdd in $pathsToAdd) {
    if (Test-Path $pathToAdd) {
        if ($currentPath -notlike "*$pathToAdd*") {
            $newPath = "$currentPath;$pathToAdd"
            [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
            $env:PATH = "$env:PATH;$pathToAdd"
            $pathsAdded += $pathToAdd
            Write-Host "[OK] Added to PATH: $pathToAdd" -ForegroundColor Green
        } else {
            Write-Host "[OK] Already in PATH: $pathToAdd" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Please restart your terminal/PowerShell for changes to take effect." -ForegroundColor Yellow
Write-Host ""
Write-Host "After restarting, verify with:" -ForegroundColor Cyan
Write-Host "  echo `$env:ANDROID_HOME" -ForegroundColor White
Write-Host "  adb version" -ForegroundColor White
Write-Host ""
