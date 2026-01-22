# Настройка YOLO-World для Android с кастомным словарем

## Обзор

YOLO-World - это open-vocabulary модель детекции объектов, которая может работать с **кастомным словарем** из файла `vocab.txt` (251 объект).

**Преимущества:**
- ✅ Распознает все 251 объект из вашего словаря
- ✅ Экспорт в TFLite для Android
- ✅ Работает локально на устройстве
- ✅ Быстрая инференс (~100-300ms)

---

## Шаг 1: Установка зависимостей

```bash
pip install ultralytics torch torchvision
```

---

## Шаг 2: Подготовка словаря

У вас уже есть файл `vocab.txt` с 251 объектом. Формат:

```
banana
apple
orange
...
```

**Важно:** Каждый объект на новой строке, без пустых строк.

---

## Шаг 3: Загрузка и настройка модели YOLO-World

### Вариант A: Использование предобученной модели YOLO-World

```python
from ultralytics import YOLO

# ⚠️ ВАЖНО: Используйте worldv2, а не world!
model = YOLO("yolov8s-worldv2.pt")  # worldv2 поддерживает TFLite

# Загрузить ваш кастомный словарь
with open("vocab.txt", "r") as f:
    vocab = [line.strip() for line in f if line.strip()]

print(f"Loaded {len(vocab)} classes from vocab.txt")

# Установить кастомный словарь (встраивает в модель)
model.set_classes(vocab)

# Сохранить модель с запеченным словарем (опционально)
model.save("yolov8s-worldv2-custom.pt")

# Экспорт в TFLite (теперь работает!)
model.export(
    format="tflite",
    imgsz=640,
    int8=True,          # INT8 quantization для Android
    dynamic=False,
    nms=True,           # Включить NMS
)

# Результат: yolov8s-worldv2-custom.tflite
```

**После экспорта переименуйте файл:**
```bash
# Переименовать экспортированный файл в нужное имя
mv yolov8s-worldv2-custom.tflite yolov8s-worldv2_int8.tflite
```

---

## Шаг 4: Добавление модели в Android приложение

После экспорта модели в TFLite формат, вам нужно добавить её в Android приложение:

### 4.1. Размещение файла модели

1. **Поместите файл модели в папку assets:**
   ```
   assets/models/yolov8s-worldv2_int8.tflite
   ```

2. **Проверьте, что файл существует:**
   ```bash
   ls -lh assets/models/yolov8s-worldv2_int8.tflite
   ```

### 4.2. Копирование модели в Android assets (только для local build)

Для локальной сборки Android приложения, модель нужно скопировать в Android assets после `prebuild`:

**Вариант A: Автоматическое копирование (рекомендуется)**

Expo автоматически скопирует файлы из `assets/` в Android assets при выполнении `expo prebuild`. Убедитесь, что в `app.json` есть:

```json
{
  "expo": {
    "assetBundlePatterns": ["**/*"]
  }
}
```

**Вариант B: Ручное копирование (если автоматическое не работает)**

После выполнения `npx expo prebuild --platform android`:

**Windows (PowerShell):**
```powershell
# Создать папку models если её нет
New-Item -ItemType Directory -Force -Path android\app\src\main\assets\models

# Скопировать файл модели
Copy-Item assets\models\yolov8s-worldv2_int8.tflite android\app\src\main\assets\models\
```

**Linux/Mac:**
```bash
# Создать папку models если её нет
mkdir -p android/app/src/main/assets/models

# Скопировать файл модели
cp assets/models/yolov8s-worldv2_int8.tflite android/app/src/main/assets/models/
```

### 4.3. Пересборка приложения

⚠️ **ВАЖНО:** После добавления модели, обязательно пересоберите приложение:

```bash
# Для локальной сборки
npm run build:android:apk:debug
# или
npm run build:android:apk:release

# Для EAS Build (автоматически копирует assets)
npm run build:android
```

**Важно:** Простой перезапуск Metro bundler (reload) не достаточен - нужно полностью пересобрать APK!

---

## Шаг 5: Проверка работы

После сборки и установки приложения:

1. Откройте приложение
2. Перейдите в раздел Camera
3. Если модель загружена правильно, вы не увидите сообщение об ошибке
4. Если видите ошибку "AI model not found", проверьте:
   - Файл существует в `assets/models/yolov8s-worldv2_int8.tflite`
   - Приложение было пересобрано после добавления файла
   - Файл скопирован в `android/app/src/main/assets/models/` (для local build)

---

## Устранение проблем

### Ошибка: "AI model not found"

**Решение:**
1. Убедитесь, что файл находится в `assets/models/yolov8s-worldv2_int8.tflite`
2. Для локальной сборки: проверьте наличие файла в `android/app/src/main/assets/models/`
3. Пересоберите приложение (не просто перезапустите Metro)
4. Очистите кеш Metro: `npx expo start --clear`

### Ошибка: "TensorFlow Lite native module not available"

**Решение:**
- Это означает, что вы используете Expo Go. Local AI требует development или production build
- Выполните: `npm run build:android:local` или `npm run build:android:apk:debug`

### Модель слишком большая

Файл модели может быть большим (обычно 20-40 MB). Это нормально. Убедитесь, что:
- Файл не добавлен в `.gitignore` (если нужен в репозитории)
- Или файл игнорируется git, но пользователи должны скачать его отдельно