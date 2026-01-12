import { apiCall, ApiResponse } from './api';
import { dataStore, User, CURRENT_USER_ID } from '../data/mockData';

export interface UserStats {
  totalPoints: number;
  challengesCompleted: number;
  rank: number;
  totalUsers: number;
}

export const userService = {
  // Get all users (sorted by points for leaderboard)
  getLeaderboard: async (): Promise<ApiResponse<User[]>> => {
    return apiCall(() => {
      const users = dataStore.getUsers();
      return Promise.resolve(users);
    });
  },

  // Get user by ID
  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    return apiCall(() => {
      const user = dataStore.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return Promise.resolve(user);
    });
  },

  // Get current logged-in user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiCall(() => {
      const user = dataStore.getCurrentUser();
      return Promise.resolve(user);
    });
  },

  // Get user statistics
  getUserStats: async (userId: string): Promise<ApiResponse<UserStats>> => {
    return apiCall(() => {
      const users = dataStore.getUsers();
      const user = dataStore.getUser(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const rank = users.findIndex(u => u.id === userId) + 1;
      
      return Promise.resolve({
        totalPoints: user.points,
        challengesCompleted: user.challengesCompleted,
        rank,
        totalUsers: users.length,
      });
    });
  },

  // Update user profile
  updateProfile: async (userId: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
    return apiCall(() => {
      const user = dataStore.updateUser(userId, updates);
      if (!user) {
        throw new Error('User not found');
      }
      return Promise.resolve(user);
    });
  },

  // Add points to user
  addPoints: async (userId: string, points: number): Promise<ApiResponse<User>> => {
    return apiCall(() => {
      const user = dataStore.addPointsToUser(userId, points);
      if (!user) {
        throw new Error('User not found');
      }
      return Promise.resolve(user);
    });
  },
};

export default userService;
