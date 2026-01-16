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

### Вариант B: Fine-tuning модели (опционально, для лучшей точности)

```python
from ultralytics import YOLO

# Загрузить модель
model = YOLO("yolov8s-world.pt")

# Загрузить словарь
with open("vocab.txt", "r") as f:
    vocab = [line.strip() for line in f if line.strip()]

model.set_classes(vocab)

# Fine-tune на вашем датасете (если есть)
# model.train(data="path/to/dataset.yaml", epochs=50, imgsz=640)
```

---

## Шаг 4: Экспорт в TFLite для Android

### Вариант A: Экспорт с INT8 Quantization (рекомендуется для мобильных)

```python
from ultralytics import YOLO

# Загрузить модель с кастомным словарем
model = YOLO("yolov8s-world-custom.pt")

# Экспорт в TFLite с INT8 quantization
# Это уменьшит размер модели и ускорит инференс
model.export(
    format="tflite",
    imgsz=640,          # Размер входного изображения
    int8=True,          # INT8 quantization для мобильных
    dynamic=False,      # Фиксированный размер входа (быстрее)
)
```

**Результат:** `yolov8s-world-custom.tflite` (~10-20 MB в зависимости от размера модели)

### Вариант B: Экспорт через ONNX (если нужен больший контроль)

```python
from ultralytics import YOLO

model = YOLO("yolov8s-world-custom.pt")

# 1. Экспорт в ONNX
model.export(
    format="onnx",
    imgsz=640,
    simplify=True,
    without_bbox_decoder=True,  # Отключить bbox decoder для TFLite
)

# 2. Конвертация ONNX → TFLite (требует onnx-tf или tensorflow)
# Используйте TensorFlow Lite Converter
```

---

## Шаг 5: Интеграция в Android проект

### 5.1. Переместить модель в проект

```bash
# Скопировать модель в assets/models/
cp yolov8s-world-custom.tflite assets/models/yolo-world.tflite
```

### 5.2. Обновить код для загрузки YOLO-World модели

```typescript
// services/localAIService.ts

// Вместо yolo.tflite загружаем yolo-world.tflite
const modelPath = require('../../assets/models/yolo-world.tflite');
const model = await TFLite.loadTensorflowModel(modelPath);
```

### 5.3. Обновить постобработку выхода

YOLO-World возвращает похожий формат, но может быть немного другой:
- Выход: `[1, num_detections, 85]` где 85 = 4 (bbox) + 1 (confidence) + 80 (class scores) ИЛИ
- `[1, num_detections, 4 + len(vocab)]` для кастомного словаря (4 bbox + confidence для каждого класса)

Нужно будет адаптировать `postprocessOutput()` под ваш формат.

---

## Шаг 6: Обновить БД (не нужно маппинг!)

**Преимущество YOLO-World:**
- ❌ НЕ нужен `coco_classes` маппинг!
- ✅ Модель распознает все 251 объект напрямую
- ✅ Можно использовать `detectable_object` напрямую из БД

**Пример:**
```sql
-- Вместо coco_classes маппинга
UPDATE challenges SET
  detectable_object = 'kettle',
  coco_classes = NULL,  -- Не нужен!
  local_ai_supported = true
WHERE title LIKE '%kettle%';
```

---

## Сравнение размеров моделей

| Модель | Размер (FP32) | Размер (INT8) | Скорость | Точность |
|--------|--------------|---------------|----------|----------|
| YOLO-World-S | ~22 MB | ~10 MB | Очень быстро | Хорошая |
| YOLO-World-M | ~50 MB | ~25 MB | Быстро | Лучше |
| YOLO-World-L | ~90 MB | ~45 MB | Средне | Отлично |
| YOLO-World-X | ~170 MB | ~85 MB | Медленно | Лучшая |

**Рекомендация:** YOLO-World-S (nano) или YOLO-World-M для Android.

---

## Производительность

**На Android (среднее устройство):**
- YOLO-World-S (INT8): ~100-200ms на изображение 640x640
- YOLO-World-M (INT8): ~200-400ms на изображение 640x640

**Сравнение с текущим YOLOv8n (COCO):**
- Текущий: 80 классов COCO
- YOLO-World: 251 ваш класс напрямую
- Скорость: Примерно такая же или немного медленнее (~20-30%)

---

## Ограничения

1. **Словарь запекается в модель:**
   - После reparameterization и quantization словарь фиксирован
   - Чтобы добавить новый объект, нужно переэкспортировать модель

2. **Размер словаря влияет на размер модели:**
   - Больше классов = больше выходной размер
   - 251 класс это приемлемо для YOLO-World

3. **Точность может варьироваться:**
   - Некоторые объекты могут быть менее точными чем в COCO
   - Рекомендуется fine-tuning на вашем датасете

---

## Альтернативный подход: Использование через API (если нужна гибкость)

Если нужно менять словарь динамически, можно использовать YOLO-World через API (Roboflow):

```typescript
// Использование через Supabase Edge Function
// supabase/functions/verify-photo/index-yoloworld.ts
// Уже реализовано в вашем проекте!
```

**Плюсы API:**
- ✅ Можно менять словарь динамически
- ✅ Не нужно переэкспортировать модель
- ✅ Всегда последняя версия модели

**Минусы:**
- ❌ Требует интернет
- ❌ Задержка сети (~500-1000ms)
- ❌ Зависит от сервиса

---

## Рекомендация

**Для вашего случая (251 объект из vocab.txt):**

✅ **Используйте YOLO-World-S или YOLO-World-M с репараметризацией:**
1. Запекайте все 251 объект в модель
2. Экспортируйте в TFLite (INT8)
3. Используйте локально на Android
4. Уберите `coco_classes` маппинг из БД

**Размер модели будет:**
- YOLO-World-S: ~10-12 MB (INT8)
- YOLO-World-M: ~25-30 MB (INT8)

**Это приемлемо для Android приложения!**

---

## Следующие шаги

1. Экспортировать YOLO-World с вашим vocab.txt
2. Заменить `yolo.tflite` на `yolo-world.tflite` в проекте
3. Обновить `postprocessOutput()` под формат YOLO-World
4. Убрать `coco_classes` маппинг из БД (больше не нужен!)
5. Тестировать на реальных устройствах

Нужна помощь с экспортом модели или интеграцией в код?
