import { apiCall, ApiResponse, simulateNetworkDelay } from './api';
import { Photo, Post } from '../data/mockData';
import { supabase, uploadPhoto, uriToBlob, dbUsersChallengeToPhoto, dbUsersChallengeToPost } from './supabase';
import { userService } from './userService';
import { challengeService } from './challengeService';

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
        .select('*, users!inner(username, avatar_url), challenges!inner(title, description, points)')
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
        p.challenges.description,
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

  // Verify photo with AI (mock)
  verifyPhotoWithAI: async (photoUri: string, challengeTitle: string): Promise<ApiResponse<VerificationResult>> => {
    // Simulate longer delay for AI processing
    await simulateNetworkDelay();
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // 90% success rate for demo
    const isValid = Math.random() > 0.1;
    
    return {
      success: true,
      data: {
        success: isValid,
        message: isValid 
          ? `Photo verified! It matches the challenge "${challengeTitle}"`
          : `Photo doesn't seem to match the challenge. Please try again.`,
        verified: isValid,
      },
    };
  },

  // Submit a photo for a challenge
  submitPhoto: async (request: SubmitPhotoRequest): Promise<ApiResponse<Photo>> => {
    return apiCall(async () => {
      // Get current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        throw new Error('User not authenticated');
      }

      const userId = authData.user.id;

      // Get username from user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      const username = userData?.username || 'Unknown';

      // 1. Upload photo to Supabase Storage
      let photoUrl: string;
      try {
        const blob = await uriToBlob(request.photoUri);
        photoUrl = await uploadPhoto(blob, userId, request.challengeId);
      } catch (error) {
        throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 2. Get challenge points from database
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('points')
        .eq('id', request.challengeId)
        .single();

      if (challengeError) throw challengeError;
      const challengePoints = challengeData?.points || request.challengePoints;

      // 3. Insert post into users_challenge table (this creates the post and completes the challenge)
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

      if (postError) throw postError;
      if (!postData) throw new Error('Failed to create post record');

      // 4. Return the photo
      const photo = dbUsersChallengeToPhoto(postData, username, request.challengeTitle, challengePoints);
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
