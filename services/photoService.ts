import { apiCall, ApiResponse, simulateNetworkDelay } from './api';
import { Photo, Post } from './supabase';
import { supabase, uploadPhoto, uriToBlob, dbUsersChallengeToPhoto, dbUsersChallengeToPost } from './supabase';
import { userService } from './userService';
import { challengeService } from './challengeService';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { EncodingType } from 'expo-file-system';
import { verifyPhotoLocally, isLocalAIAvailable } from './localAIService';

export interface VerificationResult {
  success: boolean;
  message: string;
  verified: boolean;
}

export interface SubmitPhotoRequest {
  photoUri: string;
  challengeId: string;
  challengeTitle: string;
  challengePoints: number;
  aspectRatio?: number;
}

export const photoService = {
  // Get all feed posts (all posts from users_challenge)
  getFeed: async (): Promise<ApiResponse<Post[]>> => {
    return apiCall(async () => {
      // Join with users and challenges tables
      const { data, error } = await supabase
        .from('users_challenge')
        .select('*, users!inner(username, avatar_url), challenges!inner(title, points)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((p: any) => dbUsersChallengeToPost(
        {
          id: p.id,
          user_id: p.user_id,
          challenge_id: p.challenge_id,
          photo_uri: p.photo_uri,
          points: p.points,
          aspect_ratio: p.aspect_ratio,
          created_at: p.created_at,
        },
        p.users.username,
        p.users.avatar_url || undefined,
        p.challenges.title,
        p.challenges.points
      ));
    });
  },

  // Get photos by user
  getUserPhotos: async (userId: string): Promise<ApiResponse<Photo[]>> => {
    return apiCall(async () => {
      const { data: posts, error: postsError } = await supabase
        .from('users_challenge')
        .select('*, challenges!inner(title, points)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get user info
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      const username = userData?.username || 'Unknown';

      return (posts || []).map((p: any) => dbUsersChallengeToPhoto(
        {
          id: p.id,
          user_id: p.user_id,
          challenge_id: p.challenge_id,
          photo_uri: p.photo_uri,
          points: p.points,
          aspect_ratio: p.aspect_ratio,
          created_at: p.created_at,
        },
        username,
        p.challenges.title,
        p.challenges.points
      ));
    });
  },

  // Get current user's photos
  getMyPhotos: async (): Promise<ApiResponse<Photo[]>> => {
    return apiCall(async () => {
      // Get current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        throw new Error('User not authenticated');
      }

      // Call getUserPhotos and extract the data
      const response = await photoService.getUserPhotos(authData.user.id);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get photos');
      }
      return response.data;
    });
  },

  // Get photos for a specific challenge
  getChallengePhotos: async (challengeId: string): Promise<ApiResponse<Photo[]>> => {
    return apiCall(async () => {
      const { data: posts, error: postsError } = await supabase
        .from('users_challenge')
        .select('*, users!inner(username), challenges!inner(title, points)')
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      return (posts || []).map((p: any) => dbUsersChallengeToPhoto(
        {
          id: p.id,
          user_id: p.user_id,
          challenge_id: p.challenge_id,
          photo_uri: p.photo_uri,
          points: p.points,
          aspect_ratio: p.aspect_ratio,
          created_at: p.created_at,
        },
        p.users.username,
        p.challenges.title,
        p.challenges.points
      ));
    });
  },

  // Convert photo URI to base64
  uriToBase64: async (uri: string): Promise<string> => {
    // If it's already a base64 data URI, return it
    if (uri.startsWith('data:')) {
      return uri;
    }

    // If it's a web URL (http/https), fetch and convert
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // For local file URIs (file://), read as base64
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });
      // Determine MIME type from file extension or default to jpeg
      const mimeType = uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      throw new Error(`Failed to convert photo to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Verify photo with AI - uses ONLY local AI (no server fallback)
  // challengeData should contain detectable_object from database
  verifyPhotoWithAI: async (
    photoUri: string, 
    challengeTitle: string,
    challengeData?: { detectable_object?: string | null }
  ): Promise<ApiResponse<VerificationResult>> => {
    return apiCall(async () => {
      // Use local AI verification (Android only)
      if (!isLocalAIAvailable()) {
        throw new Error('Local AI verification is only available on Android. Please use an Android device.');
      }

      try {
        console.log('Using local AI verification (no server fallback)...');
        const localResult = await verifyPhotoLocally(photoUri, challengeTitle, challengeData);
        
        // Return the result (even if verification failed, we don't fall back to server)
        console.log('Local AI verification result:', localResult);
        return {
          success: localResult.success && localResult.verified,
          message: localResult.message,
          verified: localResult.verified,
        };
      } catch (error) {
        console.error('Local AI verification error:', error);
        throw new Error(`Local AI verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  },

  // Submit a photo for a challenge
  submitPhoto: async (request: SubmitPhotoRequest): Promise<ApiResponse<Photo>> => {
    return apiCall(async () => {
      console.log('[PhotoService] submitPhoto called with:', {
        photoUri: request.photoUri,
        challengeId: request.challengeId,
        challengeTitle: request.challengeTitle,
        challengePoints: request.challengePoints,
        aspectRatio: request.aspectRatio,
      });

      // Get current authenticated user
      console.log('[PhotoService] Getting authenticated user...');
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        console.error('[PhotoService] Authentication error:', authError);
        throw new Error('User not authenticated');
      }

      const userId = authData.user.id;
      console.log('[PhotoService] User authenticated:', userId);

      // Get username from user profile
      console.log('[PhotoService] Getting username from profile...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('[PhotoService] Error getting user data:', userError);
        throw userError;
      }
      const username = userData?.username || 'Unknown';
      console.log('[PhotoService] Username:', username);

      // 1. Upload photo to Supabase Storage
      let photoUrl: string;
      try {
        console.log('[PhotoService] Converting photo URI to blob/arraybuffer...');
        const blob = await uriToBlob(request.photoUri);
        console.log('[PhotoService] Photo converted, type:', blob instanceof ArrayBuffer ? 'ArrayBuffer' : 'Blob', 'size:', blob instanceof ArrayBuffer ? blob.byteLength : (blob as Blob).size);
        
        console.log('[PhotoService] Uploading photo to Supabase Storage...');
        photoUrl = await uploadPhoto(blob, userId, request.challengeId);
        console.log('[PhotoService] Photo uploaded successfully, URL:', photoUrl);
      } catch (error) {
        console.error('[PhotoService] Error uploading photo:', error);
        console.error('[PhotoService] Upload error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 2. Get challenge points from database
      console.log('[PhotoService] Getting challenge points from database...');
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('points')
        .eq('id', request.challengeId)
        .single();

      if (challengeError) {
        console.error('[PhotoService] Error getting challenge data:', challengeError);
        throw challengeError;
      }
      const challengePoints = challengeData?.points || request.challengePoints;
      console.log('[PhotoService] Challenge points:', challengePoints);

      // 3. Insert post into users_challenge table (this creates the post and completes the challenge)
      console.log('[PhotoService] Inserting post into users_challenge table...');
      const { data: postData, error: postError } = await supabase
        .from('users_challenge')
        .insert({
          user_id: userId,
          challenge_id: request.challengeId,
          photo_uri: photoUrl,
          points: challengePoints,
          aspect_ratio: request.aspectRatio || 1,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (postError) {
        console.error('[PhotoService] Error inserting post:', postError);
        throw postError;
      }
      if (!postData) {
        console.error('[PhotoService] Post data is null after insert');
        throw new Error('Failed to create post record');
      }
      console.log('[PhotoService] Post created successfully:', postData.id);

      // 4. Return the photo
      const photo = dbUsersChallengeToPhoto(postData, username, request.challengeTitle, challengePoints);
      console.log('[PhotoService] Photo submission completed successfully');
      return photo;
    });
  },

  // Get all photos (admin/debug)
  getAllPhotos: async (): Promise<ApiResponse<Photo[]>> => {
    return apiCall(async () => {
      const { data: posts, error: postsError } = await supabase
        .from('users_challenge')
        .select('*, users!inner(username), challenges!inner(title, points)')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      return (posts || []).map((p: any) => dbUsersChallengeToPhoto(
        {
          id: p.id,
          user_id: p.user_id,
          challenge_id: p.challenge_id,
          photo_uri: p.photo_uri,
          points: p.points,
          aspect_ratio: p.aspect_ratio,
          created_at: p.created_at,
        },
        p.users.username,
        p.challenges.title,
        p.challenges.points
      ));
    });
  },
};

export default photoService;
