# Настройка Supabase Edge Function для проверки фото через Google Gemini

## Шаг 1: Получение API ключа Google Gemini

1. Перейдите на [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Войдите в свой Google аккаунт
3. Нажмите "Create API Key"
4. Скопируйте полученный API ключ (он будет выглядеть как `AIza...`)

## Шаг 2: Установка Supabase CLI (если еще не установлен)

```bash
npm install -g supabase
```

Или используйте другие методы установки из [официальной документации](https://supabase.com/docs/guides/cli).

## Шаг 3: Логин в Supabase CLI

```bash
supabase login
```

## Шаг 4: Связывание проекта с Supabase

```bash
supabase link --project-ref ваш-project-ref
```

Project ref можно найти в настройках проекта Supabase (Settings > General > Reference ID).

## Шаг 5: Установка секрета для Gemini API

```bash
supabase secrets set GEMINI_API_KEY=ваш-api-ключ-от-google
```

Замените `ваш-api-ключ-от-google` на ключ, полученный в шаге 1.

## Шаг 6: Деплой Edge Function

```bash
supabase functions deploy verify-photo
```

## Шаг 7: Проверка работы

После деплоя функция будет доступна по адресу:
```
https://ваш-project-ref.supabase.co/functions/v1/verify-photo
```

## Альтернативный способ: через Supabase Dashboard

1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в **Edge Functions**
3. Нажмите **Create a new function**
4. Назовите функцию `verify-photo`
5. Скопируйте код из `supabase/functions/verify-photo/index.ts`
6. Вставьте код в редактор
7. Сохраните функцию
8. Перейдите в **Settings > Edge Functions > Secrets**
9. Добавьте секрет:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: ваш API ключ от Google Gemini
10. Деплой функции

## Проверка работы

После настройки функция будет автоматически вызываться из `photoService.verifyPhotoWithAI()`.

## Лимиты бесплатного tier Google Gemini

- **60 запросов в минуту**
- **1500 запросов в день**
- Достаточно для тестирования и небольших проектов

## Отладка

Если функция не работает:

1. Проверьте логи в Supabase Dashboard: **Edge Functions > verify-photo > Logs**
2. Убедитесь, что секрет `GEMINI_API_KEY` установлен правильно
3. Проверьте, что API ключ Google Gemini активен

## Безопасность

⚠️ **Важно**: API ключ хранится только на сервере (в Supabase Secrets), никогда не попадает в клиентский код.
