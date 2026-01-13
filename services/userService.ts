import { apiCall, ApiResponse } from './api';
import { User, CURRENT_USER_ID } from '../data/mockData';
import { supabase, dbUserToUser, uploadAvatar, deleteAvatar, uriToBlob } from './supabase';

export interface UserStats {
  totalPoints: number;
  challengesCompleted: number;
  rank: number;
  totalUsers: number;
}

export const userService = {
  // Get all users (sorted by points for leaderboard)
  getLeaderboard: async (): Promise<ApiResponse<User[]>> => {
    return apiCall(async () => {
      // Get users with calculated points and challenges_completed from users_challenge
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url, created_at');

      if (usersError) throw usersError;
      if (!usersData) return [];

      // For each user, calculate points and challenges_completed from users_challenge
      const usersWithStats = await Promise.all(
        usersData.map(async (user) => {
          // Get completed challenges with their points
          const { data: userChallenges, error: ucError } = await supabase
            .from('users_challenge')
            .select('challenge_id, points')
            .eq('user_id', user.id);

          if (ucError) throw ucError;

          // Calculate total points and count
          const points = (userChallenges || []).reduce((sum, uc) => {
            return sum + (uc.points || 0);
          }, 0);
          const challengesCompleted = userChallenges?.length || 0;

          return {
            ...user,
            points,
            challenges_completed: challengesCompleted,
          };
        })
      );

      // Sort by points descending
      usersWithStats.sort((a, b) => b.points - a.points);

      return usersWithStats.map((user) => dbUserToUser(user as any));
    });
  },

  // Get user by ID
  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    return apiCall(async () => {
      // Get user basic info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, avatar_url, created_at')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // Get completed challenges with their points
      const { data: userChallenges, error: ucError } = await supabase
        .from('users_challenge')
        .select('challenge_id, points')
        .eq('user_id', userId);

      if (ucError) throw ucError;

      // Calculate total points and count
      const points = (userChallenges || []).reduce((sum, uc) => {
        return sum + (uc.points || 0);
      }, 0);
      const challengesCompleted = userChallenges?.length || 0;

      return dbUserToUser({
        ...userData,
        points,
        challenges_completed: challengesCompleted,
      } as any);
    });
  },

  // Get current logged-in user
  // Uses Supabase Auth to get the current user ID
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiCall(async () => {
      // First check if there's an active session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('User not authenticated');
      }

      // Get current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        throw new Error('User not authenticated');
      }

      const userId = authData.user.id;
      
      // Get user basic info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, avatar_url, created_at')
        .eq('id', userId)
        .single();

      if (userError) {
        // Check if error is PGRST116 (profile not found)
        if ((userError as any).code === 'PGRST116') {
          throw new Error('USER_PROFILE_NOT_FOUND');
        }
        throw userError;
      }
      if (!userData) throw new Error('USER_PROFILE_NOT_FOUND');

      // Get completed challenges with their points
      const { data: userChallenges, error: ucError } = await supabase
        .from('users_challenge')
        .select('challenge_id, points')
        .eq('user_id', userId);

      if (ucError) throw ucError;

      // Calculate total points and count
      const points = (userChallenges || []).reduce((sum, uc) => {
        return sum + (uc.points || 0);
      }, 0);
      const challengesCompleted = userChallenges?.length || 0;

      return dbUserToUser({
        ...userData,
        points,
        challenges_completed: challengesCompleted,
      } as any);
    });
  },

  // Get user statistics
  getUserStats: async (userId: string): Promise<ApiResponse<UserStats>> => {
    return apiCall(async () => {
      // Get user basic info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // Get completed challenges with their points
      const { data: userChallenges, error: ucError } = await supabase
        .from('users_challenge')
        .select('challenge_id, points')
        .eq('user_id', userId);

      if (ucError) throw ucError;

      // Calculate total points and count
      const totalPoints = (userChallenges || []).reduce((sum, uc) => {
        const challenge = uc.challenges as { points: number } | null;
        return sum + (challenge?.points || 0);
      }, 0);
      const challengesCompleted = userChallenges?.length || 0;

      // Get total users count
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get rank (users with more points)
      // We need to calculate points for all users to get rank
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id');

      if (allUsersError) throw allUsersError;

      // Calculate points for all users
      const usersWithPoints = await Promise.all(
        (allUsers || []).map(async (user) => {
          const { data: ucData } = await supabase
            .from('users_challenge')
            .select('challenge_id, points')
            .eq('user_id', user.id);

          const points = (ucData || []).reduce((sum, uc) => {
            return sum + (uc.points || 0);
          }, 0);

          return { id: user.id, points };
        })
      );

      // Count users with more points
      const rankCount = usersWithPoints.filter(u => u.points > totalPoints).length;

      return {
        totalPoints,
        challengesCompleted,
        rank: rankCount + 1,
        totalUsers: count || 0,
      };
    });
  },

  // Update user profile
  // Note: points and challengesCompleted are now calculated from users_challenge, so they cannot be updated here
  updateProfile: async (userId: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
    return apiCall(async () => {
      const updateData: any = {};
      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
      // Points and challenges_completed are now calculated from users_challenge, so ignore them

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('id, username, avatar_url, created_at')
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');
      
      // Get calculated points and challenges_completed
      const { data: userChallenges, error: ucError } = await supabase
        .from('users_challenge')
        .select('challenge_id, points')
        .eq('user_id', userId);

      if (ucError) throw ucError;

      const points = (userChallenges || []).reduce((sum, uc) => {
        return sum + (uc.points || 0);
      }, 0);
      const challengesCompleted = userChallenges?.length || 0;

      return dbUserToUser({
        ...data,
        points,
        challenges_completed: challengesCompleted,
      } as any);
    });
  },

  // Add points to user (deprecated - points are now calculated from users_challenge)
  // This function is kept for backward compatibility but doesn't update points/challenges_completed
  // Points and challenges_completed are now calculated dynamically from users_challenge table
  addPoints: async (userId: string, points: number): Promise<ApiResponse<User>> => {
    return apiCall(async () => {
      // Points are now calculated from users_challenge, so just return the current user
      // This function is called when a challenge is completed, but the actual points
      // are stored in the users_challenge table, not in the users table
      return this.getUser(userId);
    });
  },

  // Update avatar (upload new avatar image)
  updateAvatar: async (userId: string, avatarUri: string): Promise<ApiResponse<User>> => {
    return apiCall(async () => {
      // Upload avatar to storage
      const blob = await uriToBlob(avatarUri);
      const avatarUrl = await uploadAvatar(blob, userId);

      // Update user profile with new avatar URL
      const { data, error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId)
        .select('id, username, avatar_url, created_at')
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');
      
      // Get calculated points and challenges_completed
      const { data: userChallenges, error: ucError } = await supabase
        .from('users_challenge')
        .select('challenge_id, points')
        .eq('user_id', userId);

      if (ucError) throw ucError;

      const points = (userChallenges || []).reduce((sum, uc) => {
        return sum + (uc.points || 0);
      }, 0);
      const challengesCompleted = userChallenges?.length || 0;

      return dbUserToUser({
        ...data,
        points,
        challenges_completed: challengesCompleted,
      } as any);
    });
  },

  // Delete avatar (remove avatar image from storage and set avatar_url to null)
  removeAvatar: async (userId: string): Promise<ApiResponse<User>> => {
    return apiCall(async () => {
      // Get current user to find avatar URL
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // Delete avatar from storage
      if (userData.avatar_url) {
        await deleteAvatar(userId, userData.avatar_url);
      }

      // Update user profile to remove avatar URL
      const { data, error } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', userId)
        .select('id, username, avatar_url, created_at')
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');
      
      // Get calculated points and challenges_completed
      const { data: userChallenges, error: ucError } = await supabase
        .from('users_challenge')
        .select('challenge_id, points')
        .eq('user_id', userId);

      if (ucError) throw ucError;

      const points = (userChallenges || []).reduce((sum, uc) => {
        return sum + (uc.points || 0);
      }, 0);
      const challengesCompleted = userChallenges?.length || 0;

      return dbUserToUser({
        ...data,
        points,
        challenges_completed: challengesCompleted,
      } as any);
    });
  },
};

export default userService;
