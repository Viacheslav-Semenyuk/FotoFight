import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { EncodingType } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Application types
export interface User {
  id: string;
  username: string;
  points: number;
  challengesCompleted: number;
  avatarUrl?: string;
}

export interface Challenge {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  completedBy: string[];
  detectable_object?: string | null;
}

export interface Photo {
  id: string;
  userId: string;
  username: string;
  uri: string;
  challengeId: string;
  challengeTitle: string;
  challengePoints: number;
  timestamp: number;
  aspectRatio: number;
  verified: boolean;
}

export interface Post {
  id: string;
  username: string;
  userId: string;
  avatarUrl?: string;
  challengeId: string;
  challengeDescription: string;
  challengePoints: number;
  photoUri: string;
  timestamp: number;
  aspectRatio: number;
}

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

/**
 * Get avatar file path from avatar URL
 * Extracts the path from a Supabase Storage public URL
 */
export function getAvatarPathFromUrl(url: string): string | null {
  try {
    // Extract path from URL like: https://xxx.supabase.co/storage/v1/object/public/photos/userId/avatar.jpg
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const publicIndex = pathParts.indexOf('public');
    if (publicIndex !== -1 && pathParts[publicIndex + 1]) {
      // Return path like: userId/avatar.jpg
      return pathParts.slice(publicIndex + 2).join('/');
    }
    return null;
  } catch {
    return null;
  }
}

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
  points: number;
  created_at: string;
  // Local AI field
  detectable_object?: string | null;
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
 * @param file - File, Blob, or ArrayBuffer to upload (ArrayBuffer required on Android)
 * @param userId - User ID
 * @param challengeId - Challenge ID
 * @returns Public URL of uploaded photo
 */
export async function uploadPhoto(
  file: Blob | File | ArrayBuffer,
  userId: string,
  challengeId: string
): Promise<string> {
  const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
  const fileName = `${userId}/${Date.now()}_${challengeId}.${fileExt}`;

  // Determine content type
  const contentType = file instanceof File ? file.type : 'image/jpeg';

  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: contentType,
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
 * Convert base64 or local URI to Blob or ArrayBuffer for upload
 * On Android, returns ArrayBuffer (required by Supabase Storage)
 * On other platforms, returns Blob
 */
export async function uriToBlob(uri: string): Promise<Blob | ArrayBuffer> {
  // On Android, Supabase Storage requires ArrayBuffer instead of Blob
  if (Platform.OS === 'android') {
    return uriToArrayBuffer(uri);
  }

  // For web and iOS, use Blob
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

  // For React Native local file URIs (file://) on iOS
  const response = await fetch(uri);
  return await response.blob();
}

/**
 * Upload avatar to Supabase Storage
 * @param file - File, Blob, or ArrayBuffer to upload (ArrayBuffer required on Android)
 * @param userId - User ID
 * @returns Public URL of uploaded avatar
 */
export async function uploadAvatar(
  file: Blob | File | ArrayBuffer,
  userId: string
): Promise<string> {
  const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
  const fileName = `${userId}/avatar.${fileExt}`;

  // Determine content type
  const contentType = file instanceof File ? file.type : 'image/jpeg';

  // Delete old avatar if exists
  try {
    const { data: listData } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .list(userId);
    
    if (listData) {
      const oldAvatars = listData.filter(f => f.name.startsWith('avatar.'));
      if (oldAvatars.length > 0) {
        const pathsToRemove = oldAvatars.map(f => `${userId}/${f.name}`);
        await supabase.storage
          .from(PHOTOS_BUCKET)
          .remove(pathsToRemove);
      }
    }
  } catch (error) {
    // Ignore errors when deleting old avatar
    console.warn('Could not delete old avatar:', error);
  }

  // Upload new avatar (use upsert to replace if exists)
  const { data, error } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: contentType,
    });

  if (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(PHOTOS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Delete avatar from Supabase Storage
 * @param userId - User ID
 * @param avatarUrl - Optional avatar URL to extract path from
 * @returns Success status
 */
export async function deleteAvatar(userId: string, avatarUrl?: string): Promise<void> {
  // Try to delete using the URL path first
  if (avatarUrl) {
    const path = getAvatarPathFromUrl(avatarUrl);
    if (path) {
      const { error } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .remove([path]);
      if (!error) return;
    }
  }

  // Fallback: list files and delete avatar files
  const { data: listData, error: listError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .list(userId);

  if (listError) {
    throw new Error(`Failed to list avatar files: ${listError.message}`);
  }

  if (listData) {
    const avatarFiles = listData
      .filter(f => f.name.startsWith('avatar.'))
      .map(f => `${userId}/${f.name}`);

    if (avatarFiles.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .remove(avatarFiles);

      if (deleteError) {
        throw new Error(`Failed to delete avatar: ${deleteError.message}`);
      }
    }
  }
}

/**
 * Convert URI to ArrayBuffer (for Android)
 */
async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  // If it's a base64 data URI
  if (uri.startsWith('data:')) {
    const base64Data = uri.split(',')[1];
    return decode(base64Data);
  }

  // For file:// URIs on Android, read file as base64 using expo-file-system
  // then convert to ArrayBuffer
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    return decode(base64);
  } catch (error) {
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
    points: dbChallenge.points,
    completed: false, // Will be set based on user context
    completedBy: [], // Will be fetched separately
    // Local AI field from database
    detectable_object: dbChallenge.detectable_object ?? null,
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

export function dbUsersChallengeToPost(dbPost: DbUsersChallenge, username: string, avatarUrl: string | undefined, challengeTitle: string, challengePoints: number): Post {
  return {
    id: dbPost.id,
    username,
    userId: dbPost.user_id,
    avatarUrl,
    challengeId: dbPost.challenge_id,
    challengeDescription: challengeTitle, // Using title as description
    challengePoints: dbPost.points,
    photoUri: dbPost.photo_uri,
    timestamp: new Date(dbPost.created_at).getTime(),
    aspectRatio: dbPost.aspect_ratio,
  };
}

// =============================================
// YOLO Vocabulary Functions
// =============================================

// Vocabulary is now loaded from code (localAIService.ts), not from database
// This function is kept for backward compatibility but vocabulary should be loaded from code
