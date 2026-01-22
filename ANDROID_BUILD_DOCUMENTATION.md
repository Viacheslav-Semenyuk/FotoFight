# Документация: Локальная сборка Android APK Release

## Что реализовано в этом проекте

В проекте **Foto Fight** реализована полная настройка для локальной сборки Android APK с использованием следующих компонентов:

### Реализованные компоненты:

1. **Скрипт сборки APK** (`build:android:apk:release`)
   - Автоматическая генерация нативных Android файлов через Expo prebuild
   - Копирование TFLite модели (YOLOv8) в Android assets
   - Сборка release APK через Gradle

2. **Скрипт копирования ML модели** (`scripts/copy-model-to-android.ps1`)
   - Копирует модель `yolov8s-worldv2_int8.tflite` из `assets/models/` в `android/app/src/main/assets/models/`
   - Автоматически создает необходимые директории
   - Проверяет наличие файлов перед копированием

3. **Оптимизация Gradle кэша** (`scripts/move-gradle-to-d.ps1`)
   - Перемещает Gradle кэш с диска C: на диск D: (`D:\gradle-home`)
   - Создает символическую ссылку для обратной совместимости
   - Настраивает переменную окружения `GRADLE_USER_HOME`

4. **Конфигурация Android SDK на диске D:**
   - Android SDK расположен по пути: `D:\program\android\sdk`
   - Настроено в `android/local.properties`

5. **Gradle конфигурация:**
   - Оптимизированные настройки памяти (4GB для JVM)
   - Параллельная сборка и кэширование
   - Поддержка всех архитектур (armeabi-v7a, arm64-v8a, x86, x86_64)
   - Hermes JS engine включен

6. **Дополнительные скрипты:**
   - `build:android:apk:debug` - сборка debug APK
   - `clean:gradle` - очистка Gradle кэша
   - `clean:gradle:cache` - очистка кэша через PowerShell
   - `clean:all` - полная очистка проекта

### Структура проекта:

```
FotoFight/
├── android/                          # Нативные Android файлы (генерируются через prebuild)
│   ├── app/
│   │   ├── build.gradle             # Конфигурация приложения
│   │   └── src/main/assets/models/  # ML модели (копируются скриптом)
│   ├── build.gradle                 # Корневая конфигурация Gradle
│   ├── gradle.properties            # Свойства Gradle
│   └── local.properties             # Локальные пути (SDK на D:)
├── assets/
│   └── models/
│       └── yolov8s-worldv2_int8.tflite  # Исходная ML модель
├── scripts/
│   ├── copy-model-to-android.ps1    # Скрипт копирования модели
│   ├── move-gradle-to-d.ps1         # Скрипт оптимизации Gradle
│   └── clean-gradle-cache.ps1      # Скрипт очистки кэша
└── package.json                     # NPM скрипты
```

## Описание команды

Команда `build:android:apk:release` выполняет локальную сборку release APK для Android без использования EAS Build.

```bash
npm run build:android:apk:release
```

### Что делает команда:

1. **`npx expo prebuild --platform android`** - генерирует нативные Android файлы из конфигурации Expo
2. **`npm run copy-model`** - копирует TFLite модель в Android assets (опционально, если используется ML)
3. **`cd android && gradlew.bat assembleRelease && cd ..`** - собирает release APK через Gradle

## Требования

### Системные требования:
- **Node.js** версии 18 или выше
- **npm** или **yarn**
- **Java Development Kit (JDK)** версии 17 или выше
- **Android Studio** с установленными:
  - Android SDK (API 34)
  - Android Build Tools 34.0.0
  - Android NDK (версия 25.1.8937393 или выше)
  - Gradle (устанавливается автоматически через wrapper)

### Переменные окружения:

**Обязательные:**
- `ANDROID_HOME` или `ANDROID_SDK_ROOT` - путь к Android SDK
  - В этом проекте: `D:\program\android\sdk`
- `JAVA_HOME` - путь к JDK (версия 17 или выше)

**Опциональные (для оптимизации):**
- `GRADLE_USER_HOME` - путь к Gradle кэшу (для экономии места на диске C:)
  - В этом проекте: `D:\gradle-home`
  - Настраивается автоматически скриптом `scripts/move-gradle-to-d.ps1`

**Настройка переменных окружения в Windows:**

1. **Через PowerShell (для текущего пользователя):**
```powershell
[Environment]::SetEnvironmentVariable('ANDROID_HOME', 'D:\program\android\sdk', 'User')
[Environment]::SetEnvironmentVariable('GRADLE_USER_HOME', 'D:\gradle-home', 'User')
```

2. **Через системные настройки:**
   - Нажмите `Win + R`, введите `sysdm.cpl`
   - Вкладка "Дополнительно" → "Переменные среды"
   - Добавьте переменные в раздел "Переменные пользователя"

3. **Проверка переменных:**
```powershell
echo $env:ANDROID_HOME
echo $env:GRADLE_USER_HOME
```

## Конфигурация проекта

### 1. package.json

Добавьте следующие скрипты в секцию `scripts`:

```json
{
  "scripts": {
    "copy-model": "powershell -ExecutionPolicy Bypass -File scripts/copy-model-to-android.ps1",
    "build:android:apk:release": "npx expo prebuild --platform android && npm run copy-model && cd android && gradlew.bat assembleRelease && cd .."
  }
}
```

**Примечание:** 
- Для Linux/Mac замените `gradlew.bat` на `./gradlew`
- Скрипт `copy-model` опционален, если вы не используете ML модели

### 2. app.json / app.config.js

Убедитесь, что в конфигурации Expo указаны правильные настройки для Android:

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.yourapp",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 24,
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "gradleProperties": {
              "android.useAndroidX": "true",
              "android.enableJetifier": "true",
              "org.gradle.daemon": "true",
              "org.gradle.parallel": "true",
              "org.gradle.caching": "true"
            }
          }
        }
      ]
    ]
  }
}
```

### 3. android/local.properties

Создайте файл `android/local.properties` (не добавляется в git) с путем к Android SDK:

```properties
## This file is automatically generated by Android Studio.
# Do not modify this file -- YOUR CHANGES WILL BE ERASED!
#
# Location of the SDK. This is only used by Gradle.
sdk.dir=D\:\\program\\android\\sdk
```

**Важно:**
- В этом проекте SDK находится на диске D: (`D:\program\android\sdk`)
- Если ваш SDK в другом месте, укажите правильный путь
- Обратные слеши в пути должны быть экранированы (`\\`)
- Этот файл автоматически генерируется Android Studio, но можно создать вручную

### 4. android/gradle.properties

Создайте или обновите файл `android/gradle.properties` со следующими настройками:

```properties
# JVM аргументы для Gradle daemon
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -XX:+UseParallelGC

# Параллельная сборка
org.gradle.parallel=true

# Кэширование сборок
org.gradle.caching=true

# Инкрементальная компиляция Kotlin
kotlin.incremental=true

# AndroidX
android.useAndroidX=true
android.enableJetifier=true

# Архитектуры для сборки
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64

# Hermes JS engine
hermesEnabled=true

# Версии SDK
android.minSdkVersion=24
android.compileSdkVersion=34
android.targetSdkVersion=34

# NDK версия
android.ndkVersion=25.1.8937393
```

### 5. android/build.gradle

Убедитесь, что в корневом `android/build.gradle` указаны правильные версии:

```gradle
buildscript {
    ext {
        buildToolsVersion = '34.0.0'
        minSdkVersion = 24
        compileSdkVersion = 34
        targetSdkVersion = 34
        kotlinVersion = '1.9.23'
        ndkVersion = "25.1.8937393"
    }
    dependencies {
        classpath('com.android.tools.build:gradle:8.3.0')
        classpath('com.facebook.react:react-native-gradle-plugin')
        classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
    }
}
```

### 6. android/app/build.gradle

Проверьте настройки в `android/app/build.gradle`:

```gradle
android {
    namespace 'com.yourcompany.yourapp'
    defaultConfig {
        applicationId 'com.yourcompany.yourapp'
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"
    }
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            // Для production используйте свой keystore
            // storeFile file('release.keystore')
            // storePassword System.getenv("KEYSTORE_PASSWORD")
            // keyAlias System.getenv("KEY_ALIAS")
            // keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.debug // Замените на release для production
            shrinkResources false
            minifyEnabled false
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

**Важно:** Для production сборок создайте release keystore и настройте `signingConfigs.release`.

### 7. Скрипт копирования модели (опционально)

Если вы используете ML модели (например, TFLite), создайте скрипт `scripts/copy-model-to-android.ps1`:

```powershell
$ErrorActionPreference = "Stop"

$sourceFile = "assets\models\your-model.tflite"
$targetDir = "android\app\src\main\assets\models"
$targetFile = "$targetDir\your-model.tflite"

Write-Host "Copying TFLite model to Android assets..." -ForegroundColor Cyan

if (-not (Test-Path $sourceFile)) {
    Write-Host "ERROR: Model file not found: $sourceFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "android")) {
    Write-Host "ERROR: android folder not found. Please run 'npx expo prebuild --platform android' first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

Copy-Item -Path $sourceFile -Destination $targetFile -Force

if (Test-Path $targetFile) {
    Write-Host "SUCCESS: Model copied successfully!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to copy model file" -ForegroundColor Red
    exit 1
}
```

Для Linux/Mac создайте аналогичный bash скрипт `scripts/copy-model-to-android.sh`.

## Использование

### Первая сборка:

1. Установите зависимости:
```bash
npm install
```

2. Выполните prebuild (если папка `android` еще не создана):
```bash
npx expo prebuild --platform android
```

3. Запустите сборку:
```bash
npm run build:android:apk:release
```

### Последующие сборки:

Просто запустите команду:
```bash
npm run build:android:apk:release
```

### Результат сборки:

APK файл будет находиться в:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Настройка для production

Для production сборок необходимо:

1. **Создать release keystore:**
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
```

2. **Обновить android/app/build.gradle:**
```gradle
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS")
        keyPassword System.getenv("KEY_PASSWORD")
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        shrinkResources true
        minifyEnabled true
    }
}
```

3. **Установить переменные окружения:**
```bash
export KEYSTORE_PASSWORD="your-password"
export KEY_ALIAS="release-key"
export KEY_PASSWORD="your-password"
```

## Решение проблем

### Ошибка: "android folder not found"
- Выполните `npx expo prebuild --platform android` перед сборкой

### Ошибка: "Gradle build failed"
- Проверьте, что установлены все необходимые компоненты Android SDK
- Убедитесь, что `ANDROID_HOME` настроен правильно (в этом проекте: `D:\program\android\sdk`)
- Проверьте файл `android/local.properties` - должен содержать: `sdk.dir=D\:\\program\\android\\sdk`
- Попробуйте очистить кэш: `cd android && gradlew.bat clean && cd ..`
- Если проблемы с местом на диске C:, запустите `scripts/move-gradle-to-d.ps1` для перемещения Gradle кэша на диск D:

### Ошибка: "NDK version not found"
- Установите NDK через Android Studio SDK Manager
- Обновите `android.ndkVersion` в `gradle.properties`

### Ошибка: "Model file not found"
- Если не используете ML модели, удалите `npm run copy-model` из команды сборки
- Или создайте необходимые файлы моделей в `assets/models/`

## Дополнительные команды

### Очистка:
```bash
# Очистка Gradle кэша
cd android && gradlew.bat clean && cd ..

# Полная очистка
npm run clean:all
```

### Debug сборка:
```bash
npm run build:android:apk:debug
```

### Пересборка с очисткой:
```bash
npx expo prebuild --platform android --clean
npm run build:android:apk:release
```

## Примечания

- Команда использует `gradlew.bat` для Windows. Для Linux/Mac используйте `./gradlew`
- Release сборка по умолчанию использует debug keystore (для тестирования)
- Для публикации в Google Play необходимо использовать production keystore
- Размер APK может быть большим из-за включения всех архитектур (armeabi-v7a, arm64-v8a, x86, x86_64)
- Для уменьшения размера можно ограничить архитектуры в `gradle.properties`

## Оптимизация для диска D:

В этом проекте используется диск D: для экономии места на системном диске C::

1. **Android SDK:** `D:\program\android\sdk`
   - Настраивается в `android/local.properties`
   - Убедитесь, что Android Studio установлен с SDK на диск D:

2. **Gradle кэш:** `D:\gradle-home`
   - Настраивается через скрипт `scripts/move-gradle-to-d.ps1`
   - Скрипт автоматически перемещает `.gradle` из `%USERPROFILE%` на диск D:
   - Создает символическую ссылку для обратной совместимости
   - Устанавливает переменную окружения `GRADLE_USER_HOME`

**Запуск оптимизации Gradle:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/move-gradle-to-d.ps1
```

После выполнения скрипта перезапустите терминал/IDE для применения изменений.
