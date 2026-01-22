# Как собрать APK файл

Есть несколько способов собрать APK файл для вашего приложения:

## Способ 1: Локальная сборка через Gradle (Рекомендуется)

### Требования
- Настроенный Android SDK (см. [ANDROID_SDK_SETUP.md](./ANDROID_SDK_SETUP.md))
- **JDK 17 или выше** (не JRE!) - см. раздел Troubleshooting ниже
- Выполненный `expo prebuild` (создает папку `android`)

### Debug APK (для тестирования)

```powershell
npm run build:android:apk:debug
```

APK файл будет создан в:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (для распространения)

```powershell
npm run build:android:apk:release
```

APK файл будет создан в:
```
android/app/build/outputs/apk/release/app-release.apk
```

**Важно:** Release APK подписан debug-ключом. Для production нужно настроить собственный keystore.

## Способ 2: Ручная сборка через Gradle

Если вы уже выполнили `expo prebuild`:

```powershell
cd android
./gradlew assembleDebug    # для debug APK
./gradlew assembleRelease  # для release APK
cd ..
```

Или на Windows:
```powershell
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat assembleRelease
cd ..
```

## Способ 3: Через EAS Build (Облачная сборка)

### Preview APK
```powershell
npm run build:android:preview
```

### Production APK
```powershell
npm run build:android
```

После завершения сборки EAS предоставит ссылку для скачивания APK.

## Способ 4: Локальная сборка через EAS

Если у вас установлен EAS CLI локально:

```powershell
npx eas build --platform android --profile preview --local
```

## Настройка Release Keystore (для Production)

Для production сборки нужно создать собственный keystore:

1. **Создайте keystore:**
```powershell
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **Создайте файл `android/keystore.properties`:**
```properties
storePassword=ваш-пароль
keyPassword=ваш-пароль
keyAlias=my-key-alias
storeFile=my-release-key.keystore
```

3. **Обновите `android/app/build.gradle`:**
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            // ... остальные настройки
        }
    }
}
```

## Где найти собранный APK

После сборки APK файлы находятся в:

- **Debug:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release:** `android/app/build/outputs/apk/release/app-release.apk`

## Установка APK на устройство

### Через ADB
```powershell
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Через файловый менеджер
1. Скопируйте APK файл на Android устройство
2. Откройте файл на устройстве
3. Разрешите установку из неизвестных источников (если требуется)
4. Установите приложение

## Размер APK

После первой сборки проверьте размер APK. Если он слишком большой, можно:
- Включить ProGuard для минификации
- Использовать App Bundle (AAB) вместо APK
- Оптимизировать ресурсы

## Troubleshooting

### Ошибка: "SDK location not found"
Эта ошибка означает, что Gradle не может найти Android SDK.

**Решение:**

1. **Создайте файл `android/local.properties`** (самый простой способ):
   ```properties
   sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
   ```
   Замените `YourUsername` на ваше имя пользователя Windows. Если SDK установлен в другом месте, укажите правильный путь.

2. **Или установите переменную окружения `ANDROID_HOME`**:
   - Убедитесь, что `ANDROID_HOME` настроен правильно (см. [ANDROID_SDK_SETUP.md](./ANDROID_SDK_SETUP.md))
   - Перезапустите терминал после установки переменной

**Примечание:** Файл `local.properties` автоматически создается при использовании Android Studio, но его нужно создать вручную при сборке через командную строку.

### Ошибка: "No Java compiler found, please ensure you are running Gradle with a JDK"
Эта ошибка означает, что у вас установлен только JRE (Java Runtime Environment), а Gradle требует JDK (Java Development Kit).

**Решение:**

1. **Установите JDK 17 или 21** (рекомендуется для Android разработки):
   - Скачайте с [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) или
   - Используйте [OpenJDK](https://adoptium.net/) (рекомендуется)
   - Или установите через [Chocolatey](https://chocolatey.org/): `choco install openjdk17`

2. **Установите переменную окружения `JAVA_HOME`**:
   
   **В PowerShell (временно для текущей сессии):**
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"  # замените на ваш путь к JDK
   ```
   
   **Постоянно (через системные настройки):**
   - Откройте "Параметры системы" → "Дополнительные параметры системы"
   - Нажмите "Переменные среды"
   - Создайте новую переменную `JAVA_HOME` со значением пути к JDK (например: `C:\Program Files\Java\jdk-17`)
   - Добавьте `%JAVA_HOME%\bin` в переменную `Path`

3. **Проверьте установку:**
   ```powershell
   java -version    # должна быть версия 17 или выше
   javac -version   # должна работать (это команда из JDK)
   echo $env:JAVA_HOME  # должен показать путь к JDK
   ```

4. **Перезапустите терминал** после установки переменных окружения

### Ошибка: "NDK did not have a source.properties file"
Эта ошибка означает, что установка NDK повреждена или неполная.

**Решение:**

1. **Переустановите NDK через Android Studio:**
   - Откройте Android Studio → **Tools** → **SDK Manager**
   - Перейдите на вкладку **SDK Tools**
   - Включите **"Show Package Details"**
   - Найдите **"NDK (Side by side)"** и установите версию **26.1.10909125** (или другую стабильную версию)
   - Убедитесь, что установка завершена полностью

2. **Или используйте другую версию NDK:**
   - Если версия 26.1.10909125 повреждена, установите другую версию (например, **25.1.8937393**)
   - Откройте `android/gradle.properties` и раскомментируйте строку:
     ```properties
     android.ndkVersion=25.1.8937393
     ```
   - Замените версию на ту, которую вы установили

3. **Проверьте установку NDK:**
   - Убедитесь, что файл `source.properties` существует в папке NDK:
     ```
     C:\Users\YourUsername\AppData\Local\Android\Sdk\ndk\26.1.10909125\source.properties
     ```
   - Если файл отсутствует, удалите папку NDK и переустановите через SDK Manager

### Ошибка: "Could not get unknown property 'release' for SoftwareComponent container"
Эта ошибка связана с несовместимостью версий Gradle/AGP и Expo модулей.

**Решение:**

1. **Обновите зависимости Expo:**
   ```powershell
   npx expo install --fix
   ```

2. **Очистите кэш и переустановите зависимости:**
   ```powershell
   cd android
   .\gradlew.bat clean
   cd ..
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```

3. **Проверьте версию Android Gradle Plugin:**
   - В `android/build.gradle` должна быть указана версия AGP (например, `8.3.1`)
   - Если версия не указана, добавьте её явно

4. **Если ошибка сохраняется:**
   - Попробуйте обновить Expo SDK до последней версии
   - Или используйте EAS Build вместо локальной сборки

### Ошибка: "Gradle build failed"
- Проверьте, что все зависимости установлены
- Попробуйте: `cd android && ./gradlew clean && cd ..`
- Убедитесь, что у вас установлены правильные версии Android SDK
- Убедитесь, что `JAVA_HOME` указывает на JDK, а не JRE

### APK не устанавливается
- Проверьте, что на устройстве разрешена установка из неизвестных источников
- Убедитесь, что версия Android на устройстве соответствует `minSdkVersion` в `app.json`
