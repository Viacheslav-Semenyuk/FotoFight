#!/bin/bash
# Скрипт для копирования TFLite модели в Android assets
# Использование: ./scripts/copy-model-to-android.sh

set -e

SOURCE_FILE="assets/models/yolov8s-worldv2_int8.tflite"
TARGET_DIR="android/app/src/main/assets/models"
TARGET_FILE="$TARGET_DIR/yolov8s-worldv2_int8.tflite"

echo "Copying TFLite model to Android assets..."

# Проверить, существует ли исходный файл
if [ ! -f "$SOURCE_FILE" ]; then
    echo "ERROR: Model file not found: $SOURCE_FILE"
    echo "Please make sure the model file is located in assets/models/"
    exit 1
fi

# Проверить, существует ли android папка
if [ ! -d "android" ]; then
    echo "ERROR: android folder not found. Please run 'npx expo prebuild --platform android' first."
    exit 1
fi

# Создать целевую директорию, если её нет
if [ ! -d "$TARGET_DIR" ]; then
    echo "Creating directory: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
fi

# Копировать файл
echo "Copying $SOURCE_FILE to $TARGET_FILE..."
cp "$SOURCE_FILE" "$TARGET_FILE"

if [ -f "$TARGET_FILE" ]; then
    FILE_SIZE=$(du -h "$TARGET_FILE" | cut -f1)
    echo "SUCCESS: Model copied successfully!"
    echo "File size: $FILE_SIZE"
    echo ""
    echo "Next steps:"
    echo "1. Rebuild the app: npm run build:android:apk:debug"
    echo "2. Or run: npm run build:android:local"
else
    echo "ERROR: Failed to copy model file"
    exit 1
fi
