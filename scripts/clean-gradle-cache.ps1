# Aggressive cleanup of Gradle caches and temporary files
# Frees up to 5+ GB of disk space
# Use before Android debug build if running out of space

$ErrorActionPreference = 'SilentlyContinue'
$totalFreed = 0

function Get-DirectorySize {
    param([string]$Path)
    if (Test-Path $Path) {
        return (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | 
                Measure-Object -Property Length -Sum).Sum / 1GB
    }
    return 0
}

function Remove-DirectoryWithSize {
    param([string]$Path, [string]$Description)
    if (Test-Path $Path) {
        $sizeBefore = Get-DirectorySize $Path
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $Path
        $script:totalFreed += $sizeBefore
        if ($sizeBefore -gt 0) {
            Write-Host "   OK $Description : {0:N2} GB" -f $sizeBefore -ForegroundColor Green
        }
    }
}

Write-Host "AGGRESSIVE CLEANUP of caches to free disk space..." -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Yellow

# 1. Stop all processes
Write-Host "`n[1] Stopping processes..." -ForegroundColor Cyan
if (Test-Path "android\gradlew.bat") {
    Push-Location android
    .\gradlew.bat --stop 2>&1 | Out-Null
    Pop-Location
}
Get-Process | Where-Object {$_.ProcessName -like "*java*" -or $_.ProcessName -like "*gradle*"} | 
    Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Clean ALL Gradle caches (including ~5 GB folder!)
Write-Host "`n[2] Cleaning ALL Gradle caches..." -ForegroundColor Cyan
# Check for custom Gradle home location (D: drive or other custom path)
$gradleHome = if ($env:GRADLE_USER_HOME) { 
    $env:GRADLE_USER_HOME 
} else { 
    "$env:USERPROFILE\.gradle" 
}
Write-Host "   Gradle home: $gradleHome" -ForegroundColor Gray
if (Test-Path $gradleHome) {
    Write-Host "   Cleaning all Gradle cache versions..." -ForegroundColor Yellow
    
    # Clean transforms in ALL versions (heaviest files)
    Get-ChildItem -Path "$gradleHome\caches" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $versionDir = $_.FullName
        Remove-DirectoryWithSize "$versionDir\transforms-*" "Gradle transforms"
        Remove-DirectoryWithSize "$versionDir\transforms" "Gradle transforms (old)"
        Remove-DirectoryWithSize "$versionDir\fileHashes" "Gradle file hashes"
        Remove-DirectoryWithSize "$versionDir\jars-*" "Gradle jars cache"
        Remove-DirectoryWithSize "$versionDir\modules-*" "Gradle modules cache"
    }
    
    # Daemon logs and data
    Remove-DirectoryWithSize "$gradleHome\daemon" "Gradle daemon data"
    
    # Wrapper distributions (old Gradle versions)
    Write-Host "   Cleaning Gradle wrapper distributions..." -ForegroundColor Yellow
    Remove-DirectoryWithSize "$gradleHome\wrapper\dists" "Gradle wrapper dists"
}

# 3. Project build folders
Write-Host "`n[3] Removing project build folders..." -ForegroundColor Cyan
Remove-DirectoryWithSize "android\build" "Android build root"
Remove-DirectoryWithSize "android\app\build" "Android app build"
Remove-DirectoryWithSize "android\.cxx" "Android C++ build"
Remove-DirectoryWithSize "android\.gradle" "Project Gradle cache"

# 4. Old APK files
Write-Host "`n[4] Removing old APK files..." -ForegroundColor Cyan
Get-ChildItem -Path "android\app\build\outputs" -Recurse -Filter "*.apk" -ErrorAction SilentlyContinue | ForEach-Object {
    $size = $_.Length / 1GB
    Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
    $script:totalFreed += $size
    if ($size -gt 0) {
        Write-Host "   OK APK removed: {0:N2} GB - $($_.Name)" -f $size -ForegroundColor Green
    }
}

# 5. Expo caches
Write-Host "`n[5] Cleaning Expo caches..." -ForegroundColor Cyan
Remove-DirectoryWithSize ".expo" "Expo cache"
Remove-DirectoryWithSize ".expo-shared" "Expo shared"
Remove-DirectoryWithSize "node_modules\.cache" "Node modules cache"

# 6. Metro bundler caches
Write-Host "`n[6] Cleaning Metro bundler caches..." -ForegroundColor Cyan
$metroPatterns = @("$env:TEMP\metro-*", "$env:TEMP\haste-map-*", "$env:LOCALAPPDATA\Temp\metro-*")
foreach ($pattern in $metroPatterns) {
    Get-ChildItem -Path $pattern -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $size = Get-DirectorySize $_.FullName
        Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        $script:totalFreed += $size
        if ($size -gt 0) {
            Write-Host "   OK Metro cache: {0:N2} GB" -f $size -ForegroundColor Green
        }
    }
}

# 7. npm/yarn caches
Write-Host "`n[7] Cleaning npm caches..." -ForegroundColor Cyan
$npmCachePaths = @(
    "$env:APPDATA\npm-cache",
    "$env:LOCALAPPDATA\npm-cache"
)

foreach ($path in $npmCachePaths) {
    Remove-DirectoryWithSize $path "npm cache"
}

# Global npm cache
$globalNpmCache = npm config get cache 2>$null | Out-String | ForEach-Object { $_.Trim() }
if ($globalNpmCache -and (Test-Path $globalNpmCache)) {
    # Clean only contents, not the folder itself
    Get-ChildItem -Path $globalNpmCache -Recurse -ErrorAction SilentlyContinue | 
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

# 8. Development temporary files
Write-Host "`n[8] Cleaning temporary files..." -ForegroundColor Cyan
Get-ChildItem -Path "." -Recurse -Include "*.log", "*.tmp", "*.temp", ".DS_Store" -ErrorAction SilentlyContinue | 
    Remove-Item -Force -ErrorAction SilentlyContinue

# Babel cache
Remove-DirectoryWithSize "$env:TEMP\.babel-cache" "Babel cache"

# Summary
Write-Host "`n=======================================================" -ForegroundColor Yellow
Write-Host "CLEANUP COMPLETED!" -ForegroundColor Green
Write-Host "Freed approximately: {0:N2} GB" -f $totalFreed -ForegroundColor Cyan
Write-Host "`nFirst build after cleanup will be slower" -ForegroundColor Yellow
Write-Host "(Gradle will re-download required dependencies)" -ForegroundColor Yellow
