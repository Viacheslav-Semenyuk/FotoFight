# Путь выполнения: верификация фотографии

Документация описывает полный путь выполнения после отправки фотографии с заданием.

## Обзор

После нажатия кнопки "Submit" фотография проходит следующие этапы:
1. **Верификация AI** - локальная проверка на Android устройстве
2. **Загрузка в Storage** - сохранение фото в Supabase Storage
3. **Создание поста** - запись в базу данных
4. **Отображение результата** - показ успеха и редирект

---

## 1. Начало: отправка фотографии

**Файл:** `app/(tabs)/camera.tsx`  
**Функция:** `handleSubmit()`

### Шаги:

1. Проверка наличия фото и выбранного челленджа
2. Показ уведомления: `"Verifying photo with AI..."`
3. Вызов `photoService.verifyPhotoWithAI()` с параметрами:
   - `photoUri` - URI фотографии
   - `challengeTitle` - название челленджа
   - `challengeData` - данные из БД:
     - `detectable_object` - объект для поиска (например, "kettle")

```typescript
const verifyResult = await photoService.verifyPhotoWithAI(
  capturedPhoto, 
  selectedChallenge.title,
  {
    detectable_object: selectedChallenge.detectable_object ?? null,
  }
);
```

---

## 2. Проверка платформы

**Файл:** `services/photoService.ts`  
**Функция:** `verifyPhotoWithAI()`

### Шаги:

1. Проверка доступности локальной AI через `isLocalAIAvailable()`
   - Возвращает `true` только для Android
2. Если не Android → возвращает ошибку
3. Вызывает `verifyPhotoLocally()` из `localAIService.ts`

```typescript
if (!isLocalAIAvailable()) {
  throw new Error('Local AI verification is only available on Android.');
}
const localResult = await verifyPhotoLocally(photoUri, challengeTitle, challengeData);
```

---

## 3. Локальная AI верификация

**Файл:** `services/localAIService.ts`  
**Функция:** `verifyPhotoLocally()`

Это основной этап, где происходит распознавание объектов на устройстве.

### 3.1. Инициализация

1. Проверка платформы (должен быть Android)
2. Динамический импорт библиотеки `react-native-fast-tflite`
3. Попытка загрузки модели из bundle

```typescript
const TFLite = require('react-native-fast-tflite');
const modelPath = require('../../assets/models/yolo.tflite');
```

### 3.2. Загрузка модели TFLite

1. Загрузка YOLO-Worldv2 модели через `TFLite.loadTensorflowModel(modelPath)`
2. Модель должна быть в `assets/models/yolov8s-worldv2_int8.tflite`
3. Fallback на `assets/models/yolo.tflite` для обратной совместимости
4. Модель встроена в bundle приложения при сборке

```typescript
const model = await TFLite.loadTensorflowModel(modelPath);
```

**Модель:** YOLOv8s-Worldv2 - распознает 251 класс из кастомного словаря (vocabulary)

### 3.3. Определение объекта для поиска

**Приоритет:**
1. `challengeData.detectable_object` из БД (если есть)
2. `extractObjectFromChallenge(title)` - извлечение из названия (fallback)

**YOLO-Worldv2 использует прямое сопоставление:**
- Объект из `detectable_object` сопоставляется напрямую с классами из кастомного словаря (251 класс)
- Не требуется маппинг через COCO классы

```typescript
if (challengeData?.detectable_object) {
  objectToDetect = challengeData.detectable_object.toLowerCase().trim();
} else {
  objectToDetect = extractObjectFromChallenge(challengeTitle);
}
```

**Пример:**
- Challenge: `"Snap a kettle"`
- `detectable_object`: `"kettle"`
- Модель напрямую ищет "kettle" в своем словаре из 251 класса

### 3.4. Предобработка изображения

**Функция:** `preprocessImage(photoUri)`

1. Изменение размера до **640x640 пикселей** (размер входа модели)
2. Конвертация в формат для модели

```typescript
const manipulatedImage = await ImageManipulator.manipulateAsync(
  uri,
  [{ resize: { width: 640, height: 640 } }],
  { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
);
```

**Формат тензора:** `Float32Array[1, 640, 640, 3]`
- `1` - batch size
- `640x640` - размер изображения
- `3` - RGB каналы
- Значения нормализованы от 0 до 1

**Реализация:**
- Изображение конвертируется в base64
- Base64 декодируется в `Uint8Array`
- JPEG декодируется через `jpeg-js` в RGB пиксели
- RGB значения нормализуются (деление на 255) и конвертируются в `Float32Array`
- Тензор формируется в формате `[height, width, channels]` для каждого пикселя

### 3.5. Инференс модели (YOLO)

**Выполнение модели:**

```typescript
const output = await model.run([inputTensor]);
```

**Вход модели:**
- Tensor: `[1, 640, 640, 3]` - нормализованное изображение

**Выход модели (YOLO-Worldv2):**
- Tensor: `[1, 8400, 255]`
  - `8400` - количество anchor boxes (предсказаний)
  - `255` = `4` (координаты bbox) + `251` (scores для каждого класса из кастомного словаря)

**Формат одного detection:**
```
[x, y, w, h, score_class_0, score_class_1, ..., score_class_250]
```
- `x, y` - центр bbox (нормализовано 0-1)
- `w, h` - ширина и высота bbox (нормализовано 0-1)
- `score_class_0` до `score_class_250` - уверенность для каждого из 251 класса кастомного словаря

### 3.6. Постобработка выхода модели

**Функция:** `postprocessOutput(output, confidenceThreshold=0.25)`

**Процесс:**

1. **Парсинг тензора:**
   - Извлечение bbox координат (x, y, w, h)
   - Поиск максимального class score из 80 классов
   - Определение класса объекта с максимальной уверенностью

2. **Фильтрация по confidence:**
   - Применяется порог `confidenceThreshold = 0.25`
   - Оставляются только детекции с уверенностью ≥ 25%

3. **Конвертация координат:**
   - Преобразование нормализованных координат в пиксели (0-640)
   - Конвертация из центральных координат в top-left corner

4. **Создание массива детекций:**
```typescript
DetectionResult[] {
  classIndex: number,        // Индекс класса (0-250)
  className: string,         // Название класса из словаря ("kettle", "banana", etc.)
  confidence: number,        // Уверенность (0-1)
  boundingBox: {
    x: number,               // Top-left X
    y: number,               // Top-left Y
    width: number,           // Ширина bbox
    height: number,          // Высота bbox
  }
}
```

**Пример результата:**
```typescript
[
  { className: "kettle", confidence: 0.87, boundingBox: {...} },
  { className: "cup", confidence: 0.45, boundingBox: {...} },
  { className: "pot", confidence: 0.32, boundingBox: {...} },
]
```

### 3.7. Фильтрация релевантных детекций

**Прямое сопоставление с `detectable_object`:**

```typescript
const relevantDetections = detections.filter(det => {
  // YOLO-Worldv2: Прямое сопоставление с detectable_object
  const detected = det.className.toLowerCase().trim();
  const target = objectToDetect.toLowerCase().trim();
  
  // Exact match
  if (detected === target) return true;
  
  // Partial match (e.g., "wall clock" matches "clock")
  if (detected.includes(target) || target.includes(detected)) return true;
  
  // Word matching (for compound names)
  const detectedWords = detected.split(/\s+/);
  const targetWords = target.split(/\s+/);
  
  for (const word of targetWords) {
    if (word.length > 3 && detectedWords.includes(word)) {
      return true;
    }
  }
  
  return false;
});
```

**Пример:**
- Challenge: "kettle" с `detectable_object: "kettle"`
- Детекции: `["kettle", "cup", "pot"]`
- Результат: только `"kettle"` проходит фильтр (точное совпадение)

### 3.8. Проверка верификации

**Логика проверки:**

```typescript
const minConfidence = 0.25;
const verified = relevantDetections.length > 0 && 
                 relevantDetections.some(det => det.confidence >= minConfidence);
```

**Условия успеха:**
1. Найдены релевантные детекции (есть совпадения с `detectable_object`)
2. Хотя бы одна детекция имеет confidence ≥ 0.25

**Возвращаемый результат:**

```typescript
{
  success: true,              // Всегда true для local-only режима
  verified: boolean,          // true если объект найден
  message: string,            // Текстовое сообщение результата
  detections: DetectionResult[], // Массив найденных объектов
  matchedClass?: string,      // Класс, который совпал
  maxConfidence?: number,     // Максимальная уверенность
}
```

**Примеры сообщений:**
- Успех: `"Object 'kettle' detected with confidence 0.87"`
- Неудача: `"Object 'kettle' not found in the image. Please try again with a clearer photo."`

---

## 4. Возврат результата в UI

**Файл:** `services/photoService.ts`  
**Функция:** `verifyPhotoWithAI()`

1. Оборачивает результат в `ApiResponse`
2. Возвращает в `camera.tsx`

```typescript
return {
  success: localResult.success && localResult.verified,
  message: localResult.message,
  verified: localResult.verified,
};
```

---

## 5. Обработка результата в UI

**Файл:** `app/(tabs)/camera.tsx`  
**Функция:** `handleSubmit()`

### 5.1. Если верификация успешна (`verified === true`)

#### Шаг 1: Вызов submitPhoto()

```typescript
if (verifyResult.success && verifyResult.data?.verified === true) {
  const submitResult = await photoService.submitPhoto({
    photoUri: capturedPhoto,
    challengeId: selectedChallenge.id,
    challengeTitle: selectedChallenge.title,
    challengePoints: selectedChallenge.points,
    aspectRatio: photoAspectRatio,
  });
}
```

#### Шаг 2: Загрузка фото в Supabase Storage

**Файл:** `services/photoService.ts`  
**Функция:** `submitPhoto()`

1. **Конвертация URI в Blob:**
```typescript
const blob = await uriToBlob(request.photoUri);
```

2. **Загрузка в Storage:**
```typescript
const photoUrl = await uploadPhoto(blob, userId, challengeId);
```

**Структура в Storage:**
```
photos/
  {userId}/
    {challengeId}/
      {timestamp}.jpg
```

**Результат:** Публичный URL фото (например: `https://{project}.supabase.co/storage/v1/object/public/photos/...`)

#### Шаг 3: Создание записи в БД

**Таблица:** `users_challenge`

**Запрос:**
```sql
INSERT INTO users_challenge (
  user_id,
  challenge_id,
  photo_uri,
  points,
  aspect_ratio,
  created_at
) VALUES (...)
```

**Что происходит:**
- Создается запись о завершении челленджа
- Автоматически создается пост в feed
- Пользователю начисляются очки

#### Шаг 4: Успешный результат

1. Показ уведомления: `"Photo verified! You earned {points} points!"`
2. Очистка состояния:
   - `selectedChallenge = null`
   - `capturedPhoto = null`
3. Редирект на Feed через 2 секунды:
```typescript
setTimeout(() => {
  router.push('/(tabs)/feed');
}, 2000);
```

### 5.2. Если верификация не прошла (`verified === false`)

1. Показ ошибки с сообщением из AI
2. Пользователь может попробовать снова (retake)

**Сообщение ошибки:**
```typescript
const errorMessage = verifyResult.data?.message || 
                     verifyResult.error || 
                     'Photo verification failed.';
setNotification({ type: 'error', message: errorMessage });
```

---

## Схема потока данных

```
┌─────────────────────────────────────────────────────────────┐
│                    Camera.tsx                               │
│                  handleSubmit()                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Проверка наличия фото и челленджа                │   │
│  │ 2. Показ: "Verifying photo with AI..."              │   │
│  │ 3. Вызов photoService.verifyPhotoWithAI()           │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  photoService.ts                            │
│              verifyPhotoWithAI()                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Проверка платформы (Android)                     │   │
│  │ 2. Вызов verifyPhotoLocally()                       │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                localAIService.ts                            │
│            verifyPhotoLocally()                             │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │ 3.1. Инициализация                               │     │
│  │     - Проверка платформы                         │     │
│  │     - Импорт react-native-fast-tflite            │     │
│  └──────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────┐     │
│  │ 3.2. Загрузка модели                             │     │
│  │     - require('../../assets/models/yolov8s-worldv2_int8.tflite') │     │
│  │     - Fallback: yolo.tflite (legacy)             │     │
│  │     - TFLite.loadTensorflowModel()               │     │
│  └──────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────┐     │
│  │ 3.3. Определение объекта                         │     │
│  │     - detectable_object из БД                    │     │
│  │     - Прямое сопоставление с словарем            │     │
│  └──────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────┐     │
│  │ 3.4. Предобработка изображения                   │     │
│  │     - Resize до 640x640                          │     │
│  │     - Создание тензора [1,640,640,3]             │     │
│  └──────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────┐     │
│  │ 3.5. Инференс модели                             │     │
│  │     - model.run([inputTensor])                   │     │
│  │     - Выход: [1, 8400, 255] (YOLO-Worldv2)       │     │
│  └──────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────┐     │
│  │ 3.6. Постобработка                               │     │
│  │     - Парсинг тензора                            │     │
│  │     - Фильтрация по confidence (≥0.25)           │     │
│  │     - Создание DetectionResult[]                 │     │
│  └──────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────┐     │
│  │ 3.7. Фильтрация релевантных                      │     │
│  │     - Прямое сопоставление с detectable_object   │     │
│  │     - relevantDetections[]                       │     │
│  └──────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  ┌──────────────────────────────────────────────────┐     │
│  │ 3.8. Проверка верификации                       │     │
│  │     - verified = true/false                      │     │
│  │     - Возврат результата                         │     │
│  └──────────────────────────────────────────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Возврат результата                             │
│         { verified: true/false, message: "..." }            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │ verified === true│
              └────────┬─────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│  submitPhoto()   │        │  Показ ошибки    │
│                  │        │  Retake доступен │
│ 1. Загрузка      │        └──────────────────┘
│    в Storage     │
│                  │
│ 2. INSERT в БД   │
│    users_challenge│
│                  │
│ 3. Успех +       │
│    редирект      │
└──────────────────┘
```

---

## Важные детали

### Данные из базы данных

Все объекты для распознавания хранятся в таблице `challenges`:

```sql
SELECT 
  title,                    -- "Snap a kettle"
  detectable_object         -- "kettle"
FROM challenges;
```

**Преимущества:**
- ✅ Single Source of Truth - один источник данных
- ✅ Легко обновлять - меняете только БД
- ✅ Нет дублирования кода
- ✅ Прямое сопоставление с кастомным словарем (251 класс)

### Локальная обработка

**Полностью на устройстве:**
- ✅ Модель встроена в приложение
- ✅ Инференс выполняется локально
- ✅ Нет запросов к серверу для верификации
- ✅ Быстрая работа (1-3 секунды)
- ✅ Работает оффлайн (после первой загрузки модели)

### Кастомный словарь (Vocabulary)

Модель YOLO-Worldv2 распознает **251 класс** из кастомного словаря:

**Категории:**
- Фрукты и овощи (banana, apple, orange, lemon, pear, peach, tomato, cucumber, carrot, etc.)
- Еда (bread, bagel, sandwich, burger, pizza, donut, cake, cookie, etc.)
- Кухонная утварь (cup, mug, glass, bowl, plate, fork, knife, spoon, kettle, pan, pot, etc.)
- Бытовая техника (microwave, oven, toaster, blender, refrigerator, dishwasher, etc.)
- Мебель (chair, sofa, bed, table, desk, wardrobe, etc.)
- Электроника (television, laptop, tablet, keyboard, mouse, smartphone, etc.)
- Одежда и личные вещи (jacket, shoes, backpack, wallet, keys, etc.)
- И многое другое (251 класс)

**Словарь хранится в коде (`localAIService.ts`) и соответствует словарю, использованному при обучении модели.**

**Все челленджи в БД настроены с `detectable_object` для прямого сопоставления с классами словаря.**

---

## Пример полного выполнения

### Входные данные:
- **Challenge:** "Snap a kettle"
- **detectable_object:** "kettle"
- **Фото:** содержит чайник

### Выполнение:

1. ✅ Фото отправлено
2. ✅ Модель YOLO-Worldv2 загружена
3. ✅ Изображение предобработано (640x640)
4. ✅ Инференс выполнен
5. ✅ Найдены детекции: `["kettle" (0.87), "cup" (0.32), "pot" (0.15)]`
6. ✅ Фильтрация по `detectable_object`: оставлен только `"kettle"` (точное совпадение)
7. ✅ Confidence 0.87 ≥ 0.25 → **verified = true**
8. ✅ Фото загружено в Storage
9. ✅ Запись создана в `users_challenge`
10. ✅ Показан успех: "Photo verified! You earned 1 points!"
11. ✅ Редирект на Feed

---

## Обработка ошибок

### Возможные ошибки:

1. **Модель не найдена:**
   - Сообщение: "AI model not found. Please add yolov8s-worldv2_int8.tflite to assets/models/ and rebuild the app. See docs/YOLO_WORLD_ANDROID_SETUP.md for instructions."

2. **Не Android платформа:**
   - Сообщение: "Local AI verification is only available on Android"

3. **Объект не найден:**
   - Сообщение: "Object 'kettle' not found in the image. Please try again with a clearer photo."

4. **Ошибка загрузки модели:**
   - Сообщение: "Failed to load AI model: ..."

5. **Ошибка загрузки в Storage:**
   - Сообщение: "Failed to upload photo: ..."

Все ошибки логируются в консоль для отладки.

---

## Производительность

**Типичное время выполнения:**
- Предобработка: ~100-200ms
- Инференс модели: ~500-1000ms
- Постобработка: ~50-100ms
- Загрузка в Storage: ~500-1500ms
- **Общее время: 1-3 секунды**

**Оптимизации:**
- Модель YOLOv8s-Worldv2 (int8 quantization) - оптимизированная версия
- GPU acceleration включен в `app.json`
- Локальная обработка - нет сетевых задержек

---

## Заключение

Весь процесс верификации происходит локально на Android устройстве:
1. Модель YOLO-Worldv2 встроена в приложение
2. Все объекты для распознавания в БД (`detectable_object`)
3. Кастомный словарь (251 класс) хранится в коде
4. Прямое сопоставление без маппинга через COCO классы
5. Быстрая обработка без серверных запросов
6. Работает оффлайн

Это обеспечивает приватность пользователей и быструю работу приложения.
