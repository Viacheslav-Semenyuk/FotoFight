// Export all services
export { apiConfig, ApiResponse, PaginatedResponse, ApiError, apiCall, simulateNetworkDelay } from './api';
export { userService, UserStats } from './userService';
export { challengeService, ChallengeWithStatus } from './challengeService';
export { photoService, VerificationResult, SubmitPhotoRequest } from './photoService';
export { authService, AuthResponse } from './authService';
export { verifyPhotoLocally, isLocalAIAvailable } from './localAIService';
export { preprocessImageForYOLO, imageUriToBase64, MODEL_INPUT_SIZE } from './imagePreprocessor';

// Supabase client and types
export { supabase, DbUser, DbChallenge, DbPhoto, DbUsersChallenge, User, Challenge, Photo, Post } from './supabase';
