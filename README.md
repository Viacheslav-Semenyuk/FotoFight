# Foto Fight

A photo challenge game built with Expo (React Native). Users compete by taking photos based on daily challenges, share them in the feed, and compete on the leaderboard.

## Features

- 📸 **Photo Challenges** - Complete daily challenges by taking photos
- 🏆 **Leaderboard** - Compete with other users and track your ranking
- 📱 **Feed** - Browse and discover photos from the community
- 👤 **User Profiles** - View your own and other users' profiles
- 🔐 **Authentication** - OAuth authentication via Google and Apple (Supabase Auth)
- 📊 **Points System** - Earn points by completing challenges
- 🎨 **Responsive Design** - Works on iOS, Android, and Web

## Tech Stack

- **Framework**: Expo ~51.0
- **Language**: TypeScript
- **UI**: React Native
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase
  - Authentication (OAuth)
  - Database (PostgreSQL)
  - Storage (photo storage)
  - Edge Functions (AI photo verification)
- **Camera**: Expo Camera & Expo Image Picker
- **State Management**: React Context (AuthContext)

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (optional, for local development)
- Supabase account
- (For mobile) Expo Go app on your device

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Follow the setup guide in [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md)
3. Configure OAuth providers: [`docs/OAUTH_SETUP.md`](./docs/OAUTH_SETUP.md)
4. (Optional) Set up Edge Function for AI photo verification: [`docs/SUPABASE_EDGE_FUNCTION_SETUP.md`](./docs/SUPABASE_EDGE_FUNCTION_SETUP.md)

### 3. Environment Variables

Create a `.env.local` file (not committed to git) with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start Development Server

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `w` to open in web browser
- Press `a` to open in Android emulator
- Press `i` to open in iOS simulator
- Scan QR code with Expo Go app on your device

## Running

- **Web**: `npm run web`
- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Tunnel** (for testing on physical devices): `npm run start:tunnel`

## Project Structure

```
app/
  (tabs)/              # Tab navigation screens
    feed.tsx           # Main feed with all photos
    camera.tsx         # Camera screen for taking photos
    challenges.tsx     # List of available challenges
    leaderboard.tsx    # User rankings
    profile.tsx        # User profile
    settings.tsx       # App settings
    # ... other screens
  auth/
    callback.tsx       # OAuth callback handler
  login.tsx            # Login screen
  index.tsx            # Entry point (redirects to feed)
  _layout.tsx          # Root layout with navigation

components/            # Reusable React components
contexts/              # React Context providers
services/              # API and service layer
  supabase.ts         # Supabase client
  authService.ts      # Authentication service
  photoService.ts     # Photo upload/management
  challengeService.ts # Challenge data
  userService.ts      # User data

database/              # SQL scripts
  supabase-schema.sql              # Database schema
  supabase-challenges-seed.sql     # Seed data for challenges
  supabase-storage-policies.sql    # Storage policies reference

docs/                  # Documentation
  SUPABASE_SETUP.md               # Supabase setup guide
  OAUTH_SETUP.md                  # OAuth configuration
  SUPABASE_EDGE_FUNCTION_SETUP.md # Edge Function setup

supabase/
  functions/           # Supabase Edge Functions
    verify-photo/      # AI photo verification function
```

## Database Schema

The application uses a simple 3-table schema:

- `users` - User profiles
- `challenges` - Available challenges
- `users_challenge` - User submissions (photos)

See [`database/supabase-schema.sql`](./database/supabase-schema.sql) for the complete schema.

## Documentation

- [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md) - Complete Supabase setup guide
- [`docs/OAUTH_SETUP.md`](./docs/OAUTH_SETUP.md) - OAuth provider configuration
- [`docs/SUPABASE_EDGE_FUNCTION_SETUP.md`](./docs/SUPABASE_EDGE_FUNCTION_SETUP.md) - Edge Function setup for AI verification

## Building for Production

The project is configured with EAS Build. See `eas.json` for build configuration.

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure your project
eas build:configure

# Build for production
eas build --platform ios
eas build --platform android
```

## License

Private project - All rights reserved
