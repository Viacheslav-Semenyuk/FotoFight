import { apiCall, ApiResponse } from './api';
import { dataStore, Challenge, CURRENT_USER_ID } from '../data/mockData';

export interface ChallengeWithStatus extends Challenge {
  isCompletedByCurrentUser: boolean;
  completedCount: number;
}

export const challengeService = {
  // Get all challenges
  getAllChallenges: async (): Promise<ApiResponse<Challenge[]>> => {
    return apiCall(() => {
      const challenges = dataStore.getChallenges();
      return Promise.resolve(challenges);
    });
  },

  // Get all challenges with completion status for current user
  getChallengesWithStatus: async (): Promise<ApiResponse<ChallengeWithStatus[]>> => {
    return apiCall(() => {
      const challenges = dataStore.getChallenges();
      const enriched = challenges.map(c => ({
        ...c,
        isCompletedByCurrentUser: c.completedBy?.includes(CURRENT_USER_ID) || c.completed,
        completedCount: c.completedBy?.length || 0,
      }));
      return Promise.resolve(enriched);
    });
  },

  // Get challenge by ID
  getChallenge: async (challengeId: string): Promise<ApiResponse<Challenge>> => {
    return apiCall(() => {
      const challenge = dataStore.getChallenge(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }
      return Promise.resolve(challenge);
    });
  },

  // Get uncompleted challenges for current user
  getUncompletedChallenges: async (): Promise<ApiResponse<Challenge[]>> => {
    return apiCall(() => {
      const { uncompleted } = dataStore.getUserChallenges(CURRENT_USER_ID);
      return Promise.resolve(uncompleted);
    });
  },

  // Get completed challenges for current user
  getCompletedChallenges: async (): Promise<ApiResponse<Challenge[]>> => {
    return apiCall(() => {
      const { completed } = dataStore.getUserChallenges(CURRENT_USER_ID);
      return Promise.resolve(completed);
    });
  },

  // Get user's challenges (both completed and uncompleted)
  getUserChallenges: async (userId: string): Promise<ApiResponse<{ completed: Challenge[]; uncompleted: Challenge[] }>> => {
    return apiCall(() => {
      const result = dataStore.getUserChallenges(userId);
      return Promise.resolve(result);
    });
  },

  // Complete a challenge
  completeChallenge: async (challengeId: string, userId: string = CURRENT_USER_ID): Promise<ApiResponse<Challenge>> => {
    return apiCall(() => {
      const challenge = dataStore.completeChallenge(challengeId, userId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }
      return Promise.resolve(challenge);
    });
  },
};

export default challengeService;
