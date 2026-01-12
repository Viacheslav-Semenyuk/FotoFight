// Export all services
export { apiConfig, ApiResponse, PaginatedResponse, ApiError, apiCall, simulateNetworkDelay } from './api';
export { userService, UserStats } from './userService';
export { challengeService, ChallengeWithStatus } from './challengeService';
export { photoService, VerificationResult, SubmitPhotoRequest } from './photoService';

// Re-export types from mockData for convenience
export { User, Challenge, Photo, Post, CURRENT_USER_ID, CURRENT_USERNAME } from '../data/mockData';
