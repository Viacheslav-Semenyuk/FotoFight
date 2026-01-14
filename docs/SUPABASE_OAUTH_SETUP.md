# Настройка OAuth для Foto Fight

## Ошибка redirect_uri_mismatch

Эта ошибка возникает, когда redirect URL в коде не совпадает с настройками в OAuth провайдере.

## Настройка в Supabase Dashboard

1. Перейдите в [Supabase Dashboard](https://supabase.com/dashboard/project/vfpufhvjieelesndblhj)
2. Откройте **Authentication** → **URL Configuration**
3. Настройте следующие URL:

### Site URL
- Для разработки: `http://localhost:8081` или `http://localhost:19006`
- Для production: ваш production URL

### Redirect URLs
Добавьте следующие URL (каждый на новой строке):

**Для веб-разработки:**
```
http://localhost:8081/auth/callback
http://localhost:19006/auth/callback
```

**Для production (замените на ваш домен):**
```
https://yourdomain.com/auth/callback
```

**Для нативных приложений:**
```
foto-fight://auth/callback
exp://localhost:8081/--/auth/callback
```

## Настройка Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект или выберите существующий
3. Включите **Google+ API**
4. Перейдите в **Credentials** → **Create Credentials** → **OAuth client ID**
5. Выберите тип приложения:
   - **Web application** для веб
   - **iOS** для iOS
   - **Android** для Android
6. Добавьте **Authorized redirect URIs**:

**Для веб:**
```
https://vfpufhvjieelesndblhj.supabase.co/auth/v1/callback
```

**Для нативных приложений:**
```
foto-fight://auth/callback
```

7. Скопируйте **Client ID** и **Client Secret**
8. В Supabase Dashboard:
   - Перейдите в **Authentication** → **Providers**
   - Включите **Google**
   - Вставьте **Client ID** и **Client Secret**
   - Сохраните

## Настройка Apple OAuth (только для iOS)

1. Перейдите в [Apple Developer Portal](https://developer.apple.com/)
2. Создайте **Services ID** для Sign in with Apple
3. Настройте **Redirect URLs**:
   ```
   https://vfpufhvjieelesndblhj.supabase.co/auth/v1/callback
   ```
4. В Supabase Dashboard:
   - Перейдите в **Authentication** → **Providers**
   - Включите **Apple**
   - Вставьте **Services ID**, **Team ID**, **Key ID** и **Private Key**
   - Сохраните

## Проверка текущего redirect URL

В коде используется:
- **Веб**: `${window.location.origin}/auth/callback`
- **Нативные**: `foto-fight://auth/callback`

Убедитесь, что эти URL точно совпадают с настройками в:
1. Supabase Dashboard (Redirect URLs)
2. Google OAuth Console (Authorized redirect URIs)
3. Apple Developer Portal (для Apple)

## Важно

- URL должны совпадать **точно**, включая протокол (http/https), домен и путь
- Не используйте trailing slash в конце URL
- Для локальной разработки используйте `http://localhost:8081` (или порт, который использует Expo)
- После изменения настроек может потребоваться несколько минут для применения изменений
