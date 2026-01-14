# Настройка Supabase для FotoFight

## Шаг 1: Создать Storage Bucket

1. Открой [Supabase Dashboard](https://supabase.com/dashboard/project/vfpufhvjieelesndblhj)
2. Перейди в **Storage** (слева в меню)
3. Нажми **"New bucket"**
4. Настройки:
   - **Name**: `photos`
   - **Public bucket**: ✅ **YES** (чтобы фото были доступны публично)
   - **File size limit**: 10MB (или по необходимости)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

## Шаг 2: Создать таблицы в базе данных

1. В Supabase Dashboard перейди в **SQL Editor**
2. Создай новый запрос
3. Скопируй и выполни содержимое файла `../database/supabase-schema.sql`
4. Нажми **Run**

Это создаст:
- ✅ Таблицы: `users`, `challenges`, `users_challenge` (упрощенная схема из 3 таблиц)
- ✅ Индексы для производительности
- ✅ Row Level Security (RLS) политики
- ✅ Views: `feed_posts`, `leaderboard`
- ✅ Seed данные: 24 челленджа

**Структура таблиц:**
- `users` - пользователи (id, username, avatar_url, created_at)
- `challenges` - челленджи (id, title, description, points, created_at)
- `users_challenge` - посты пользователей (id, user_id, challenge_id, photo_uri, points, aspect_ratio, created_at)

**Использование:**
- **Feed**: все посты из `users_challenge`, отсортированные по `created_at`
- **Leaderboard**: сумма поинтов из `users_challenge` для каждого пользователя
- **Profile**: посты из `users_challenge` для конкретного пользователя

## Шаг 3: Настроить Storage Policies

**ВАЖНО:** После создания bucket `photos`, нужно настроить политики доступа для Storage через UI Dashboard.

### Способ 1: Через Storage UI (Рекомендуется)

1. В Supabase Dashboard перейди в **Storage**
2. Нажми на bucket `photos`
3. Перейди на вкладку **Policies**
4. Нажми **"New Policy"** и создай следующие политики:

#### Policy 1: Allow authenticated uploads
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition** (USING expression - оставь пустым):
  - Пусто
- **Policy definition** (WITH CHECK expression):
```sql
bucket_id = 'photos' AND (storage.foldername(name))[1] = (auth.uid())::text
```

#### Policy 2: Allow public read
- **Policy name**: `Allow public read`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition** (USING expression):
```sql
bucket_id = 'photos'
```
- **Policy definition** (WITH CHECK expression - оставь пустым):
  - Пусто

#### Policy 3: Allow delete own photos
- **Policy name**: `Allow delete own photos`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition** (USING expression):
```sql
bucket_id = 'photos' AND (storage.foldername(name))[1] = (auth.uid())::text
```
- **Policy definition** (WITH CHECK expression - оставь пустым):
  - Пусто

### Способ 2: Через SQL Editor (требует прав суперпользователя)

Если у тебя есть права суперпользователя, можешь выполнить содержимое файла `../database/supabase-storage-policies.sql` в SQL Editor. Но обычно это не работает для обычных пользователей.

## Шаг 4: Проверка

После выполнения SQL, проверь:
- В **Table Editor** должны появиться 3 таблицы: `users`, `challenges`, `users_challenge`
- В **Storage** должен быть bucket `photos`
- В таблице `challenges` должно быть 24 записи
- В **Storage** → **Policies** для bucket `photos` должны быть настроены политики

## Готово! 🎉

Теперь приложение будет:
- ✅ Сохранять фото в Supabase Storage
- ✅ Хранить данные в Supabase Database
- ✅ Загружать ленту и рейтинг из Supabase

## Примечания

- Для работы с локальными файлами (file://) в React Native может понадобиться `expo-file-system`
- Текущая реализация работает с data URIs и http/https URLs
- Если возникнут проблемы с загрузкой, установи: `npx expo install expo-file-system`
