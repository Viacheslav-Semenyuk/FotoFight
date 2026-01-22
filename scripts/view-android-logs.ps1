# PowerShell script to view Android app logs using adb logcat
# Usage: .\scripts\view-android-logs.ps1
#
# IMPORTANT: In React Native on Android, console.log does NOT appear in Metro console!
# All JavaScript logs (console.log, console.error, etc.) are sent to adb logcat with tag "ReactNativeJS"
# This script filters and displays all relevant logs for debugging

Write-Host "Starting Android logcat viewer for Foto Fight app..." -ForegroundColor Green
Write-Host "NOTE: JavaScript console.log() logs appear here, NOT in Metro console!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Package name for the app
$packageName = "com.fotofight.app"

# Check if adb is available
$adbCheck = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adbCheck) {
    Write-Host "ERROR: adb not found! Please install Android SDK Platform Tools." -ForegroundColor Red
    Write-Host "Download from: https://developer.android.com/studio/releases/platform-tools" -ForegroundColor Yellow
    exit 1
}

# Check if device is connected
$devices = adb devices 2>&1 | Select-String -Pattern "device$"
if (-not $devices) {
    Write-Host "WARNING: No Android device/emulator detected!" -ForegroundColor Yellow
    Write-Host "Make sure your device is connected via USB with USB debugging enabled, or an emulator is running." -ForegroundColor Yellow
    Write-Host ""
}

# Clear previous logs
Write-Host "Clearing previous logs..." -ForegroundColor Cyan
adb logcat -c

# Start logcat with filters for React Native and the app
# Filters:
# - ReactNativeJS:V - ALL React Native JavaScript logs (console.log, console.error, etc.) - VERBOSE level
# - AndroidRuntime:E - Android system errors only
# - ExpoModules:V - Expo module logs - VERBOSE level
# - *:S - Suppress all other logs
Write-Host "Starting logcat with filters..." -ForegroundColor Cyan
Write-Host "Filtering for:" -ForegroundColor Cyan
Write-Host "  - ReactNativeJS (JavaScript console.log/error/warn/info)" -ForegroundColor Cyan
Write-Host "  - AndroidRuntime (Android system errors)" -ForegroundColor Cyan
Write-Host "  - ExpoModules (Expo module logs)" -ForegroundColor Cyan
Write-Host ""

# Use logcat with time format and show all ReactNativeJS logs
# ReactNativeJS tag contains ALL JavaScript console output
adb logcat -v time ReactNativeJS:V AndroidRuntime:E ExpoModules:V *:S
