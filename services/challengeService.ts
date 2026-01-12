import { apiCall, ApiResponse } from './api';
import { Challenge } from '../data/mockData';
import { supabase, dbChallengeToChallenge } from './supabase';

export interface ChallengeWithStatus extends Challenge {
  isCompletedByCurrentUser: boolean;
  completedCount: number;
}

export const challengeService = {
  // Get all challenges
  getAllChallenges: async (): Promise<ApiResponse<Challenge[]>> => {
    return apiCall(async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('points', { ascending: true });

      if (error) throw error;
      return (data || []).map(dbChallengeToChallenge);
    });
  },

  // Get all challenges with completion status for current user (public, but shows completion only if authenticated)
  getChallengesWithStatus: async (): Promise<ApiResponse<ChallengeWithStatus[]>> => {
    return apiCall(async () => {
      // Get all challenges (public)
      const { data: challenges, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .order('points', { ascending: true });

      if (challengesError) throw challengesError;

      // Try to get current authenticated user (optional)
      let completedChallengeIds = new Set<string>();
      const { data: authData } = await supabase.auth.getUser();
      
      if (authData?.user) {
        const userId = authData.user.id;
        
        // Get completed challenges for current user
        const { data: completedData } = await supabase
          .from('users_challenge')
          .select('challenge_id')
          .eq('user_id', userId);

        if (completedData) {
          completedChallengeIds = new Set(
            completedData.map((uc: any) => uc.challenge_id)
          );
        }
      }

      // Get completion counts for each challenge
      const { data: countsData, error: countsError } = await supabase
        .from('users_challenge')
        .select('challenge_id');

      if (countsError) throw countsError;

      const completionCounts = new Map<string, number>();
      (countsData || []).forEach((uc: any) => {
        const count = completionCounts.get(uc.challenge_id) || 0;
        completionCounts.set(uc.challenge_id, count + 1);
      });

      return (challenges || []).map((c) => ({
        ...dbChallengeToChallenge(c),
        isCompletedByCurrentUser: completedChallengeIds.has(c.id),
        completedCount: completionCounts.get(c.id) || 0,
      }));
    });
  },

  // Get challenge by ID
  getChallenge: async (challengeId: string): Promise<ApiResponse<Challenge>> => {
    return apiCall(async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Challenge not found');
      return dbChallengeToChallenge(data);
    });
  },

  // Get uncompleted challenges for current user
  getUncompletedChallenges: async (): Promise<ApiResponse<Challenge[]>> => {
    return apiCall(async () => {
      // Get current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        throw new Error('User not authenticated');
      }

      const userId = authData.user.id;

      // Get all challenges
      const { data: allChallenges, error: allError } = await supabase
        .from('challenges')
        .select('*')
        .order('points', { ascending: true });

      if (allError) throw allError;

      // Get completed challenge IDs
      const { data: completedData } = await supabase
        .from('users_challenge')
        .select('challenge_id')
        .eq('user_id', userId);

      const completedIds = new Set(
        (completedData || []).map((uc: any) => uc.challenge_id)
      );

      // Filter out completed challenges
      const uncompleted = (allChallenges || [])
        .filter((c) => !completedIds.has(c.id))
        .map(dbChallengeToChallenge);

      return uncompleted;
    });
  },

  // Get completed challenges for current user
  getCompletedChallenges: async (): Promise<ApiResponse<Challenge[]>> => {
    return apiCall(async () => {
      // Get current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        throw new Error('User not authenticated');
      }

      const userId = authData.user.id;

      // Get completed challenge IDs
      const { data: completedData, error: completedError } = await supabase
        .from('users_challenge')
        .select('challenge_id')
        .eq('user_id', userId);

      if (completedError) throw completedError;

      const completedIds = (completedData || []).map((uc: any) => uc.challenge_id);

      if (completedIds.length === 0) {
        return [];
      }

      // Get challenges
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .in('id', completedIds)
        .order('points', { ascending: true });

      if (error) throw error;
      return (data || []).map(dbChallengeToChallenge);
    });
  },

  // Get user's challenges (both completed and uncompleted)
  getUserChallenges: async (userId: string): Promise<ApiResponse<{ completed: Challenge[]; uncompleted: Challenge[] }>> => {
    return apiCall(async () => {
      // Get all challenges
      const { data: allChallenges, error: allError } = await supabase
        .from('challenges')
        .select('*')
        .order('points', { ascending: true });

      if (allError) throw allError;

      // Get completed challenge IDs
      const { data: completedData, error: completedError } = await supabase
        .from('users_challenge')
        .select('challenge_id')
        .eq('user_id', userId);

      if (completedError) throw completedError;

      const completedIds = new Set(
        (completedData || []).map((uc: any) => uc.challenge_id)
      );

      const completed: Challenge[] = [];
      const uncompleted: Challenge[] = [];

      (allChallenges || []).forEach((c) => {
        const challenge = dbChallengeToChallenge(c);
        if (completedIds.has(c.id)) {
          completed.push(challenge);
        } else {
          uncompleted.push(challenge);
        }
      });

      return { completed, uncompleted };
    });
  },

  // Complete a challenge
  // Note: This function is kept for backward compatibility
  // The actual challenge completion happens when a photo is submitted in photoService.submitPhoto
  completeChallenge: async (challengeId: string, userId: string): Promise<ApiResponse<Challenge>> => {
    return apiCall(async () => {
      // Get the challenge
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Challenge not found');
      return dbChallengeToChallenge(data);
    });
  },
};

export default challengeService;
