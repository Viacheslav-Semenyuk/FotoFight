# Отладка Release APK

## Проблема
После submit фотографии в release сборке Android приложение крашится, и логи не видны в обычном режиме.

## Решение

### 1. Просмотр логов через logcat

Для просмотра логов release сборки используйте Android logcat:

#### Windows (PowerShell):
```bash
npm run logs:android
```

Или напрямую:
```powershell
.\scripts\view-android-logs.ps1
```

#### Linux/Mac:
```bash
./scripts/view-android-logs.sh
```

#### Ручной запуск logcat:
```bash
# Очистить предыдущие логи
adb logcat -c

# Просмотр логов с фильтрами
adb logcat -v time ReactNativeJS:V AndroidRuntime:E ExpoModules:V *:S
```

### 2. Логирование в коде

Все критические операции теперь логируются с префиксами:

- `[Camera]` - логи из camera.tsx (handleSubmit)
- `[PhotoService]` - логи из photoService.ts (submitPhoto)
- `[Supabase]` - логи из supabase.ts (uploadPhoto, uriToArrayBuffer)
- `[GlobalErrorHandler]` - необработанные ошибки

### 3. Где искать ошибки

При краше ищите в логах:

1. **React Native ошибки**: `ReactNativeJS`
2. **Android Runtime ошибки**: `AndroidRuntime`
3. **Expo ошибки**: `ExpoModules`
4. **FATAL/ERROR/Exception**: любые критические ошибки

### 4. Типичные места крашей

1. **Загрузка фотографии** (`uploadPhoto`):
   - Проверьте логи `[Supabase] uploadPhoto`
   - Ошибки конвертации файла в `uriToArrayBuffer`

2. **Верификация AI** (`verifyPhotoWithAI`):
   - Проверьте логи из `localAIService.ts`
   - Ошибки загрузки модели TensorFlow Lite

3. **Вставка в базу данных** (`submitPhoto`):
   - Проверьте логи `[PhotoService] submitPhoto`
   - Ошибки вставки в таблицу `users_challenge`

### 5. Пример использования

1. Подключите Android устройство через USB
2. Убедитесь что USB debugging включен
3. Установите release APK на устройство
4. Запустите `npm run logs:android` в отдельном терминале
5. Воспроизведите краш (submit фотографии)
6. Изучите логи в терминале

### 6. Сохранение логов в файл

Для сохранения логов в файл:

```bash
adb logcat -v time ReactNativeJS:V AndroidRuntime:E ExpoModules:V *:S > logs.txt
```

Затем остановите запись (Ctrl+C) и откройте `logs.txt` для анализа.

### 7. Фильтрация по пакету приложения

Для просмотра только логов вашего приложения:

```bash
adb logcat | grep "com.fotofight.app"
```

### 8. Просмотр только ошибок

Для просмотра только ошибок и критических сообщений:

```bash
adb logcat *:E AndroidRuntime:E ReactNativeJS:E
```

## 9. Системные логи

Хотя обычно это не необходимо, если вы хотите видеть логи всего, что происходит на вашем устройстве, например, даже логи из других приложений и ОС, вы можете использовать следующие команды:

> **Важно:** Эти команды предназначены для **просмотра логов во время выполнения приложения**, они **НЕ используются при сборке (build)**. Используйте их для отладки уже собранного и запущенного приложения.

**Для Android устройства (через adb logcat):**
```bash
npx react-native log-android
```

**Для iOS устройства:**
```bash
npx react-native log-ios
```

> **Примечание:** Эти команды предназначены для bare React Native проектов. Для Expo проектов используйте `adb logcat` для Android или стандартные инструменты iOS для системных логов.

## 10. Сохранение логов на устройстве

Логи можно сохранить прямо на телефоне для последующего анализа:

### Через приложение:
1. Откройте экран логов в приложении (если доступен)
2. Нажмите кнопку "Сохранить" (иконка загрузки)
3. Логи будут сохранены в файл на устройстве
4. Путь к файлу будет показан в уведомлении

### Расположение файлов:

**Android:**
- Файлы сохраняются в директории документов приложения
- Путь: `/data/user/0/com.fotofight.app/files/`
- Имя файла: `fotofight-logs-YYYY-MM-DDTHH-MM-SS.txt`

**iOS:**
- Файлы сохраняются в Documents директории приложения
- Доступны через iTunes File Sharing (если включено)

### Доступ к файлам на Android:

1. **Через ADB:**
   ```bash
   # Просмотр файлов
   adb shell ls -la /data/user/0/com.fotofight.app/files/
   
   # Копирование файла на компьютер
   adb pull /data/user/0/com.fotofight.app/files/fotofight-logs-*.txt ./
   ```

2. **Через файловый менеджер на устройстве:**
   - Некоторые файловые менеджеры могут получить доступ к директории приложения
   - Или используйте приложения типа "Files" от Google

3. **Через приложение:**
   - Путь к файлу копируется в буфер обмена при сохранении
   - Можно скопировать и использовать для поиска файла

### Автоматическое сохранение при ошибках:

Можно включить автоматическое сохранение логов при возникновении ошибок:

```typescript
import { loggerService } from './services/loggerService';

// Включить автосохранение
loggerService.setAutoSaveOnError(true);
```

## Нативное логирование для Android

Для гарантированного вывода логов в logcat на Android (включая release сборки) используется нативный модуль `NativeLogger`. 

### Как это работает:

1. **Нативный модуль** (`NativeLoggerModule.kt`) использует Android `Log` API, который гарантированно пишет в logcat даже в release сборках
2. **TypeScript обертка** (`nativeLogger.ts`) предоставляет удобный интерфейс для использования
3. **LoggerService** автоматически использует нативное логирование на Android

### Просмотр логов:

Логи из нативного модуля всегда доступны через `adb logcat`:

```bash
# Просмотр всех логов приложения (включая нативные)
adb logcat | grep -E "(ReactNativeJS|EarlyLogger|LoggerService|NativeLogger)"

# Только нативные логи (высокий приоритет)
adb logcat NativeLogger:V *:S
```

### Теги логов:

Нативный модуль использует следующие теги для фильтрации:
- `EarlyLogger` - ранняя инициализация
- `LoggerService` - основной сервис логирования
- `ReactNativeJS` - общие React Native логи

## Важные заметки

- В release сборке `console.log` не удаляются благодаря настройкам в `babel.config.js`
- **Нативное логирование на Android гарантирует вывод в logcat даже в release сборках**
- Все логи перехватываются `loggerService` и доступны в приложении на экране `/logs`
- Глобальный обработчик ошибок перехватывает необработанные ошибки и promise rejections
- Все ошибки логируются с полным stack trace
- Логи можно сохранить на устройстве для последующего анализа без подключения к компьютеру
