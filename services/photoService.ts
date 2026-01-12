import { apiCall, ApiResponse, simulateNetworkDelay } from './api';
import { dataStore, Photo, Post, CURRENT_USER_ID, CURRENT_USERNAME } from '../data/mockData';

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
  // Get all feed posts (verified photos from all users)
  getFeed: async (): Promise<ApiResponse<Post[]>> => {
    return apiCall(() => {
      const posts = dataStore.getFeedPosts();
      return Promise.resolve(posts);
    });
  },

  // Get photos by user
  getUserPhotos: async (userId: string): Promise<ApiResponse<Photo[]>> => {
    return apiCall(() => {
      const photos = dataStore.getPhotosByUser(userId);
      return Promise.resolve(photos);
    });
  },

  // Get current user's photos
  getMyPhotos: async (): Promise<ApiResponse<Photo[]>> => {
    return apiCall(() => {
      const photos = dataStore.getPhotosByUser(CURRENT_USER_ID);
      return Promise.resolve(photos);
    });
  },

  // Get photos for a specific challenge
  getChallengePhotos: async (challengeId: string): Promise<ApiResponse<Photo[]>> => {
    return apiCall(() => {
      const photos = dataStore.getPhotosByChallenge(challengeId);
      return Promise.resolve(photos);
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
    return apiCall(() => {
      const photo = dataStore.addPhoto({
        userId: CURRENT_USER_ID,
        username: CURRENT_USERNAME,
        uri: request.photoUri,
        challengeId: request.challengeId,
        challengeTitle: request.challengeTitle,
        challengePoints: request.challengePoints,
        timestamp: Date.now(),
        aspectRatio: request.aspectRatio || 1,
        verified: true,
      });
      
      // Complete the challenge for the user
      dataStore.completeChallenge(request.challengeId, CURRENT_USER_ID);
      
      // Add points to user
      dataStore.addPointsToUser(CURRENT_USER_ID, request.challengePoints);
      
      return Promise.resolve(photo);
    });
  },

  // Get all photos (admin/debug)
  getAllPhotos: async (): Promise<ApiResponse<Photo[]>> => {
    return apiCall(() => {
      const photos = dataStore.getPhotos();
      return Promise.resolve(photos);
    });
  },
};

export default photoService;
