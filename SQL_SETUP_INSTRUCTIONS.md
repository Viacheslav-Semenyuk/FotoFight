# Инструкция по созданию таблиц в Supabase

## Шаги для выполнения:

1. Открой [Supabase Dashboard](https://supabase.com/dashboard/project/vfpufhvjieelesndblhj)
2. Перейди в **SQL Editor** (слева в меню)
3. Нажми **"New query"**
4. Скопируй **весь** содержимое файла `supabase-schema.sql`
5. Вставь в редактор SQL
6. Нажми **"Run"** (или F5)

## Что будет создано:

### Таблицы:
1. **`users`** - пользователи
   - `id` (UUID, PRIMARY KEY)
   - `username` (TEXT, UNIQUE)
   - `avatar_url` (TEXT, опционально)
   - `created_at` (TIMESTAMP)

2. **`challenges`** - челленджи
   - `id` (UUID, PRIMARY KEY)
   - `title` (TEXT)
   - `description` (TEXT)
   - `points` (INTEGER, 1-9)
   - `created_at` (TIMESTAMP)

3. **`users_challenge`** - посты пользователей (связь user + challenge + фото)
   - `id` (UUID, PRIMARY KEY)
   - `user_id` (UUID, FK → users)
   - `challenge_id` (UUID, FK → challenge)
   - `photo_uri` (TEXT) - URL фото
   - `points` (INTEGER) - поинты за этот челлендж
   - `aspect_ratio` (REAL) - соотношение сторон фото
   - `created_at` (TIMESTAMP) - дата создания поста

### Views (представления):
- **`feed_posts`** - все посты с информацией о пользователе и челлендже, отсортированные по дате
- **`leaderboard`** - рейтинг пользователей по сумме поинтов из `users_challenge`

### Политики безопасности (RLS):
- Публичное чтение всех таблиц
- Пользователи могут создавать/обновлять только свой профиль
- Пользователи могут создавать/удалять только свои посты

## Примеры SQL запросов:

### Feed (лента постов):
```sql
SELECT * FROM feed_posts;
-- или напрямую:
SELECT 
  uc.*,
  u.username,
  u.avatar_url,
  c.title AS challenge_title,
  c.description AS challenge_description
FROM users_challenge uc
JOIN users u ON uc.user_id = u.id
JOIN challenges c ON uc.challenge_id = c.id
ORDER BY uc.created_at DESC;
```

### Leaderboard (рейтинг):
```sql
SELECT * FROM leaderboard;
-- или напрямую:
SELECT 
  u.id,
  u.username,
  u.avatar_url,
  COALESCE(SUM(uc.points), 0) AS total_points,
  COUNT(uc.id) AS challenges_completed
FROM users u
LEFT JOIN users_challenge uc ON u.id = uc.user_id
GROUP BY u.id, u.username, u.avatar_url
ORDER BY total_points DESC;
```

### Profile (профиль пользователя):
```sql
-- Заменить 'USER_ID' на реальный ID пользователя
SELECT 
  uc.*,
  c.title AS challenge_title,
  c.description AS challenge_description
FROM users_challenge uc
JOIN challenges c ON uc.challenge_id = c.id
WHERE uc.user_id = 'USER_ID'
ORDER BY uc.created_at DESC;
```

## После выполнения:

✅ Проверь в **Table Editor**, что созданы 3 таблицы  
✅ Проверь, что в таблице `challenges` есть 24 записи (seed данные)  
✅ Проверь, что views `feed_posts` и `leaderboard` созданы

## Важно:

- Скрипт автоматически удалит старые таблицы (если они есть)
- Все данные в старых таблицах будут потеряны!
- Если нужно сохранить данные, сделай бэкап перед выполнением
