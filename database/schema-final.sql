-- =============================================
-- FotoFight Database Schema - Final Version
-- Creates all tables and inserts 251 challenges from vocabulary
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

-- Удаляем все старые таблицы (если они существуют)
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS users_challenge CASCADE;
DROP TABLE IF EXISTS challenge CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS yolo_vocabulary CASCADE;

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
-- Каждый challenge = одно слово из vocabulary с префиксом "Snap a/an"
-- =============================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- "Snap a banana", "Snap an apple", etc.
  points INTEGER NOT NULL CHECK (points >= 1 AND points <= 9),
  category TEXT,
  -- Поля для поддержки Local AI
  detectable_object TEXT, -- Ключевое слово объекта (например: "banana", "apple")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_challenges_detectable_object ON challenges(detectable_object);
CREATE INDEX IF NOT EXISTS idx_challenges_title ON challenges(title);

-- Комментарии
COMMENT ON COLUMN challenges.title IS 'Название челленджа: "Snap a/an [word]" где [word] из vocabulary';
COMMENT ON COLUMN challenges.detectable_object IS 'Ключевое слово объекта для распознавания (из vocabulary)';

-- =============================================
-- 3. Таблица users_challenge (посты пользователей)
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

-- Индексы для производительности
CREATE INDEX idx_users_challenge_created_at ON users_challenge(created_at DESC);
CREATE INDEX idx_users_challenge_user_id ON users_challenge(user_id);
CREATE INDEX idx_users_challenge_challenge_id ON users_challenge(challenge_id);
CREATE INDEX idx_users_username ON users(username);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_challenge ENABLE ROW LEVEL SECURITY;

-- Публичный доступ на чтение
CREATE POLICY "Public read access users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Public read access users_challenge" ON users_challenge FOR SELECT USING (true);

-- Пользователи могут создавать свой профиль
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
-- 4. Вставка challenges из vocabulary (251 класс)
-- =============================================
DO $$
DECLARE
  vocab_array TEXT[] := ARRAY[
    'banana', 'apple', 'orange', 'lemon', 'pear', 'peach', 'plum', 'avocado', 'kiwi',
    'mango', 'melon', 'grapes', 'cherry', 'tomato', 'cucumber', 'carrot', 'potato', 'onion',
    'garlic', 'pepper', 'broccoli', 'cabbage', 'lettuce', 'spinach', 'zucchini', 'mushroom',
    'corn', 'beans', 'peas', 'radish', 'beetroot',
    'bread', 'bagel', 'bun', 'sandwich', 'burger', 'pizza', 'donut', 'cake', 'cookie',
    'biscuit', 'chocolate', 'candy', 'yogurt', 'cheese', 'butter', 'honey', 'jam',
    'ketchup', 'mustard', 'mayonnaise',
    'cup', 'mug', 'glass', 'bowl', 'plate', 'fork', 'knife', 'spoon', 'spatula', 'whisk',
    'pan', 'pot', 'kettle', 'ladle', 'colander', 'grater',
    'microwave', 'oven', 'toaster', 'blender', 'mixer', 'refrigerator', 'freezer',
    'dishwasher', 'sink', 'faucet', 'coffeemaker', 'juicer', 'grinder', 'scale',
    'sponge', 'broom', 'mop', 'bucket', 'vacuum', 'detergent', 'spray', 'brush', 'dustpan',
    'hanger', 'wardrobe', 'drawer', 'shelf', 'cabinet', 'desk', 'table', 'bed', 'pillow',
    'blanket', 'mattress', 'sofa', 'armchair', 'chair', 'stool', 'bench', 'lamp', 'bulb', 'fan',
    'switch', 'outlet', 'charger', 'cable', 'battery', 'remote', 'television', 'monitor',
    'computer', 'laptop', 'tablet', 'keyboard', 'mouse', 'printer', 'router', 'speaker',
    'headphones', 'earbuds', 'microphone', 'tripod', 'controller', 'console', 'smartphone',
    'watch', 'clock', 'camera',
    'book', 'notebook', 'pen', 'pencil', 'marker', 'scissors', 'stapler', 'glue', 'folder',
    'envelope', 'calculator', 'calendar',
    'backpack', 'handbag', 'wallet', 'keys', 'umbrella', 'sunglasses', 'hat', 'scarf',
    'gloves', 'belt', 'jacket', 'coat', 'hoodie', 'sweater', 'shirt', 'pants', 'jeans',
    'shorts', 'dress', 'skirt', 'socks', 'shoes', 'sneakers', 'boots', 'slippers', 'towel',
    'toothbrush', 'toothpaste', 'soap', 'shampoo', 'conditioner', 'razor', 'mirror', 'toilet',
    'bathtub', 'shower', 'curtain', 'sinkbasin',
    'heater', 'radiator', 'humidifier', 'window', 'door', 'lock', 'rug', 'carpet',
    'plant', 'vase', 'wateringcan',
    'tree', 'bush', 'grass', 'flower', 'mailbox', 'doorbell', 'detector', 'extinguisher',
    'ladder', 'toolbox',
    'hammer', 'screwdriver', 'wrench', 'pliers', 'drill', 'saw', 'flashlight', 'candle',
    'lighter', 'helmet',
    'car', 'sedan', 'hatchback', 'suv', 'truck', 'van', 'bus', 'motorcycle', 'scooter',
    'bicycle', 'skateboard', 'rollerblade',
    'hydrant', 'cone', 'barrier', 'cart', 'bin', 'container'
  ];
  word TEXT;
  article TEXT;
  challenge_title TEXT;
  category TEXT;
BEGIN
  -- Создаем challenge для каждого слова из vocabulary
  FOREACH word IN ARRAY vocab_array
  LOOP
    -- Определяем артикль: "an" для слов, начинающихся с гласной, иначе "a"
    IF word ~ '^[aeiouAEIOU]' THEN
      article := 'an';
    ELSE
      article := 'a';
    END IF;
    
    challenge_title := 'Snap ' || article || ' ' || word;
    
    -- Определяем категорию на основе слова
    category := CASE
      WHEN word IN ('banana', 'apple', 'orange', 'lemon', 'pear', 'peach', 'plum', 'avocado', 'kiwi', 'mango', 'melon', 'grapes', 'cherry', 'tomato', 'cucumber', 'carrot', 'potato', 'onion', 'garlic', 'pepper', 'broccoli', 'cabbage', 'lettuce', 'spinach', 'zucchini', 'mushroom', 'corn', 'beans', 'peas', 'radish', 'beetroot') THEN 'food'
      WHEN word IN ('bread', 'bagel', 'bun', 'sandwich', 'burger', 'pizza', 'donut', 'cake', 'cookie', 'biscuit', 'chocolate', 'candy', 'yogurt', 'cheese', 'butter', 'honey', 'jam', 'ketchup', 'mustard', 'mayonnaise') THEN 'food'
      WHEN word IN ('cup', 'mug', 'glass', 'bowl', 'plate', 'fork', 'knife', 'spoon', 'spatula', 'whisk', 'pan', 'pot', 'kettle', 'ladle', 'colander', 'grater', 'microwave', 'oven', 'toaster', 'blender', 'mixer', 'refrigerator', 'freezer', 'dishwasher', 'sink', 'faucet', 'coffeemaker', 'juicer', 'grinder', 'scale') THEN 'kitchen'
      WHEN word IN ('sponge', 'broom', 'mop', 'bucket', 'vacuum', 'detergent', 'spray', 'brush', 'dustpan') THEN 'cleaning'
      WHEN word IN ('hanger', 'wardrobe', 'drawer', 'shelf', 'cabinet', 'desk', 'table', 'bed', 'pillow', 'blanket', 'mattress', 'sofa', 'armchair', 'chair', 'stool', 'bench', 'lamp', 'bulb', 'fan', 'switch', 'outlet', 'charger', 'cable', 'battery', 'remote', 'television', 'monitor', 'computer', 'laptop', 'tablet', 'keyboard', 'mouse', 'printer', 'router', 'speaker', 'headphones', 'earbuds', 'microphone', 'tripod', 'controller', 'console', 'smartphone', 'watch', 'clock', 'camera', 'book', 'notebook', 'pen', 'pencil', 'marker', 'scissors', 'stapler', 'glue', 'folder', 'envelope', 'calculator', 'calendar', 'window', 'door', 'lock', 'rug', 'carpet', 'plant', 'vase', 'wateringcan', 'heater', 'radiator', 'humidifier') THEN 'home'
      WHEN word IN ('backpack', 'handbag', 'wallet', 'keys', 'umbrella', 'sunglasses', 'hat', 'scarf', 'gloves', 'belt', 'jacket', 'coat', 'hoodie', 'sweater', 'shirt', 'pants', 'jeans', 'shorts', 'dress', 'skirt', 'socks', 'shoes', 'sneakers', 'boots', 'slippers', 'towel', 'toothbrush', 'toothpaste', 'soap', 'shampoo', 'conditioner', 'razor', 'mirror', 'toilet', 'bathtub', 'shower', 'curtain', 'sinkbasin') THEN 'personal'
      WHEN word IN ('tree', 'bush', 'grass', 'flower', 'mailbox', 'doorbell', 'detector', 'extinguisher', 'ladder', 'toolbox', 'hammer', 'screwdriver', 'wrench', 'pliers', 'drill', 'saw', 'flashlight', 'candle', 'lighter', 'helmet', 'car', 'sedan', 'hatchback', 'suv', 'truck', 'van', 'bus', 'motorcycle', 'scooter', 'bicycle', 'skateboard', 'rollerblade', 'hydrant', 'cone', 'barrier', 'cart', 'bin', 'container') THEN 'outdoor'
      ELSE 'general'
    END;
    
    -- Вставляем challenge
    INSERT INTO challenges (title, points, category, detectable_object)
    VALUES (
      challenge_title,
      1, -- По умолчанию 1 балл
      category,
      word -- detectable_object = само слово
    );
  END LOOP;
END $$;

-- =============================================
-- 5. View для feed (все посты, отсортированные по created_at)
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
-- 6. View для leaderboard (рейтинг по поинтам)
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
-- Проверка данных
-- =============================================
-- Проверяем количество challenges (должно быть 251)
SELECT COUNT(*) as total_challenges FROM challenges;

-- Проверяем примеры challenges
SELECT title, detectable_object, category, points 
FROM challenges 
ORDER BY title
LIMIT 10;

-- =============================================
-- Готово!
-- =============================================
-- Теперь:
-- - Feed: SELECT * FROM feed_posts
-- - Leaderboard: SELECT * FROM leaderboard
-- - Profile: SELECT * FROM users_challenge WHERE user_id = ? ORDER BY created_at DESC
-- - Challenges: SELECT * FROM challenges (251 challenge)
-- - Vocabulary: Загружается из кода (localAIService.ts), не из БД
-- =============================================
