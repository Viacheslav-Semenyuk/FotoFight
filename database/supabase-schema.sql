-- =============================================
-- FotoFight Database Schema for Supabase
-- Упрощенная схема: 3 таблицы
-- Run this in Supabase SQL Editor
-- =============================================
--
-- IMPORTANT: Before running this SQL, create Storage bucket:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: "photos"
-- 4. Public bucket: YES (to allow public access to photos)
-- 5. File size limit: 10MB (or as needed)
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp
-- =============================================

-- Удаляем старые таблицы (если они существуют)
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS users_challenge CASCADE;
DROP TABLE IF EXISTS challenge CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Удаляем старые views (если они существуют)
DROP VIEW IF EXISTS feed_posts CASCADE;
DROP VIEW IF EXISTS leaderboard CASCADE;

-- =============================================
-- 1. Таблица users (пользователи)
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. Таблица challenges (челленджи)
-- =============================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points >= 1 AND points <= 9),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. Таблица users_challenge (посты пользователей)
-- Содержит: user_id, challenge_id, photo_uri, points, created_at
-- =============================================
CREATE TABLE users_challenge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  photo_uri TEXT NOT NULL,
  points INTEGER NOT NULL,
  aspect_ratio REAL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Индексы для производительности
-- =============================================

-- Индекс для feed (сортировка по дате создания)
CREATE INDEX idx_users_challenge_created_at ON users_challenge(created_at DESC);

-- Индекс для profile (поиск постов пользователя)
CREATE INDEX idx_users_challenge_user_id ON users_challenge(user_id);

-- Индекс для leaderboard (поиск по challenge_id)
CREATE INDEX idx_users_challenge_challenge_id ON users_challenge(challenge_id);

-- Индекс для поиска по username
CREATE INDEX idx_users_username ON users(username);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_challenge ENABLE ROW LEVEL SECURITY;

-- Публичный доступ на чтение для всех таблиц
CREATE POLICY "Public read access users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Public read access users_challenge" ON users_challenge FOR SELECT USING (true);

-- Пользователи могут создавать свой профиль (id должен совпадать с auth.uid())
CREATE POLICY "Allow insert own profile" ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Пользователи могут обновлять свой профиль
CREATE POLICY "Allow update own profile" ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Пользователи могут удалять свой профиль
CREATE POLICY "Allow delete own profile" ON users FOR DELETE 
  USING (auth.uid() = id);

-- Пользователи могут создавать посты только для себя
CREATE POLICY "Allow insert own posts" ON users_challenge FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять свои посты
CREATE POLICY "Allow delete own posts" ON users_challenge FOR DELETE 
  USING (auth.uid() = user_id);

-- =============================================
-- Seed data: Challenges (челленджи)
-- =============================================
-- Seed данные для challenges находятся в отдельном файле: supabase-challenges-seed.sql
-- Запустите supabase-challenges-seed.sql ПОСЛЕ выполнения supabase-schema.sql

-- =============================================
-- View для feed (все посты, отсортированные по created_at)
-- =============================================

CREATE OR REPLACE VIEW feed_posts AS
SELECT 
  uc.id,
  uc.photo_uri,
  uc.created_at,
  uc.aspect_ratio,
  uc.points AS challenge_points,
  u.id AS user_id,
  u.username,
  u.avatar_url,
  c.id AS challenge_id,
  c.title AS challenge_title
FROM users_challenge uc
JOIN users u ON uc.user_id = u.id
JOIN challenges c ON uc.challenge_id = c.id
ORDER BY uc.created_at DESC;

-- =============================================
-- View для leaderboard (рейтинг по поинтам из users_challenge)
-- =============================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  u.id,
  u.username,
  u.avatar_url,
  COALESCE(SUM(uc.points), 0) AS total_points,
  COUNT(uc.id) AS challenges_completed,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(uc.points), 0) DESC) AS rank
FROM users u
LEFT JOIN users_challenge uc ON u.id = uc.user_id
GROUP BY u.id, u.username, u.avatar_url
ORDER BY total_points DESC;

-- =============================================
-- Готово!
-- =============================================
-- Теперь:
-- - Feed: SELECT * FROM feed_posts (или напрямую из users_challenge с JOIN)
-- - Leaderboard: SELECT * FROM leaderboard
-- - Profile: SELECT * FROM users_challenge WHERE user_id = ? ORDER BY created_at DESC
-- =============================================
