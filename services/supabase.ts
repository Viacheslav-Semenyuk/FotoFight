import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { User, Challenge, Photo, Post } from '../data/mockData';

const supabaseUrl = 'https://vfpufhvjieelesndblhj.supabase.co';
const supabaseAnonKey = 'sb_publishable_3yY7RmHWXiBrFz6e2tEUuA_NoPZwokH';

// Custom storage adapter that works on both web and native
const createStorageAdapter = () => {
  // For web, use localStorage
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string): Promise<string | null> => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: async (key: string, value: string): Promise<void> => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      },
    };
  }

  // For native platforms, use SecureStore
  // Dynamic import to avoid issues on web
  let SecureStore: any;
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    // Fallback if SecureStore is not available
    return {
      getItem: async (): Promise<string | null> => null,
      setItem: async (): Promise<void> => {},
      removeItem: async (): Promise<void> => {},
    };
  }

  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error('Error getting item from SecureStore:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('Error setting item in SecureStore:', error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('Error removing item from SecureStore:', error);
      }
    },
  };
};

const storageAdapter = createStorageAdapter();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Storage bucket name
export const PHOTOS_BUCKET = 'photos';

// Database types based on our schema
export interface DbUser {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  // Note: points and challenges_completed are now calculated from users_challenge table
  points?: number; // Optional, calculated dynamically
  challenges_completed?: number; // Optional, calculated dynamically
}

export interface DbChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  created_at: string;
}

export interface DbPhoto {
  id: string;
  user_id: string;
  uri: string;
  challenge_id: string;
  timestamp: string;
  aspect_ratio: number;
  verified: boolean;
  created_at: string;
}

// New schema: users_challenge table (posts)
export interface DbUsersChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  photo_uri: string;
  points: number;
  aspect_ratio: number;
  created_at: string;
}

// =============================================
// Storage Functions
// =============================================

/**
 * Upload photo to Supabase Storage
 * @param file - File or Blob to upload
 * @param userId - User ID
 * @param challengeId - Challenge ID
 * @returns Public URL of uploaded photo
 */
export async function uploadPhoto(
  file: Blob | File,
  userId: string,
  challengeId: string
): Promise<string> {
  const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
  const fileName = `${userId}/${Date.now()}_${challengeId}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(PHOTOS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Convert base64 or local URI to Blob for upload
 */
export async function uriToBlob(uri: string): Promise<Blob> {
  // If it's already a URL (http/https), fetch it
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const response = await fetch(uri);
    return await response.blob();
  }

  // If it's a base64 data URI
  if (uri.startsWith('data:')) {
    const response = await fetch(uri);
    return await response.blob();
  }

  // For React Native local file URIs (file://)
  // In React Native, we need to use a different approach
  // For now, we'll assume it's a base64 or needs to be converted
  // In production, you might need react-native-fs or similar
  const response = await fetch(uri);
  return await response.blob();
}

// =============================================
// Type Converters (DB -> App)
// =============================================

export function dbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    points: dbUser.points || 0, // Default to 0 if not calculated
    challengesCompleted: dbUser.challenges_completed || 0, // Default to 0 if not calculated
    avatarUrl: dbUser.avatar_url || undefined,
  };
}

export function dbChallengeToChallenge(dbChallenge: DbChallenge): Challenge {
  return {
    id: dbChallenge.id,
    title: dbChallenge.title,
    description: dbChallenge.description,
    points: dbChallenge.points,
    completed: false, // Will be set based on user context
    completedBy: [], // Will be fetched separately
  };
}

export function dbPhotoToPhoto(dbPhoto: DbPhoto, username: string, challengeTitle: string, challengePoints: number = 0): Photo {
  return {
    id: dbPhoto.id,
    userId: dbPhoto.user_id,
    username,
    uri: dbPhoto.uri,
    challengeId: dbPhoto.challenge_id,
    challengeTitle,
    challengePoints,
    timestamp: new Date(dbPhoto.timestamp).getTime(),
    aspectRatio: dbPhoto.aspect_ratio,
    verified: dbPhoto.verified,
  };
}

export function dbPhotoToPost(dbPhoto: DbPhoto, username: string, challengeDescription: string, challengePoints: number): Post {
  return {
    id: dbPhoto.id,
    username,
    userId: dbPhoto.user_id,
    challengeId: dbPhoto.challenge_id,
    challengeDescription,
    challengePoints,
    photoUri: dbPhoto.uri,
    timestamp: new Date(dbPhoto.timestamp).getTime(),
    aspectRatio: dbPhoto.aspect_ratio,
  };
}

// Converters for new schema (users_challenge)
export function dbUsersChallengeToPhoto(dbPost: DbUsersChallenge, username: string, challengeTitle: string, challengePoints: number = 0): Photo {
  return {
    id: dbPost.id,
    userId: dbPost.user_id,
    username,
    uri: dbPost.photo_uri,
    challengeId: dbPost.challenge_id,
    challengeTitle,
    challengePoints: dbPost.points,
    timestamp: new Date(dbPost.created_at).getTime(),
    aspectRatio: dbPost.aspect_ratio,
    verified: true, // All posts in users_challenge are verified
  };
}

export function dbUsersChallengeToPost(dbPost: DbUsersChallenge, username: string, avatarUrl: string | undefined, challengeDescription: string, challengePoints: number): Post {
  return {
    id: dbPost.id,
    username,
    userId: dbPost.user_id,
    avatarUrl,
    challengeId: dbPost.challenge_id,
    challengeDescription,
    challengePoints: dbPost.points,
    photoUri: dbPost.photo_uri,
    timestamp: new Date(dbPost.created_at).getTime(),
    aspectRatio: dbPost.aspect_ratio,
  };
}
