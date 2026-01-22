# Скрипт для копирования TFLite модели в Android assets
# Использование: .\scripts\copy-model-to-android.ps1

$ErrorActionPreference = "Stop"

$sourceFile = "assets\models\yolov8s-worldv2_int8.tflite"
$targetDir = "android\app\src\main\assets\models"
$targetFile = "$targetDir\yolov8s-worldv2_int8.tflite"

Write-Host "Copying TFLite model to Android assets..." -ForegroundColor Cyan

# Проверить, существует ли исходный файл
if (-not (Test-Path $sourceFile)) {
    Write-Host "ERROR: Model file not found: $sourceFile" -ForegroundColor Red
    Write-Host "Please make sure the model file is located in assets/models/" -ForegroundColor Yellow
    exit 1
}

# Проверить, существует ли android папка
if (-not (Test-Path "android")) {
    Write-Host "ERROR: android folder not found. Please run 'npx expo prebuild --platform android' first." -ForegroundColor Red
    exit 1
}

# Создать целевую директорию, если её нет
if (-not (Test-Path $targetDir)) {
    Write-Host "Creating directory: $targetDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

# Копировать файл
Write-Host "Copying $sourceFile to $targetFile..." -ForegroundColor Green
Copy-Item -Path $sourceFile -Destination $targetFile -Force

if (Test-Path $targetFile) {
    $fileSize = (Get-Item $targetFile).Length / 1MB
    Write-Host "SUCCESS: Model copied successfully!" -ForegroundColor Green
    Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Rebuild the app: npm run build:android:apk:debug" -ForegroundColor Yellow
    Write-Host "2. Or run: npm run build:android:local" -ForegroundColor Yellow
} else {
    Write-Host "ERROR: Failed to copy model file" -ForegroundColor Red
    exit 1
}
