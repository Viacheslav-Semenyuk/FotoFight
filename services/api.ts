// Base API configuration and utilities
// This simulates network delay for realistic testing

// Simulate network latency (300-800ms)
const MOCK_DELAY_MIN = 300;
const MOCK_DELAY_MAX = 800;

export const simulateNetworkDelay = async (): Promise<void> => {
  const delay = MOCK_DELAY_MIN + Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN);
  await new Promise(resolve => setTimeout(resolve, delay));
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// API error handler
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Wrap API calls with error handling
export const apiCall = async <T>(
  fn: () => Promise<T>
): Promise<ApiResponse<T>> => {
  try {
    await simulateNetworkDelay();
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: message };
  }
};

// Base API URL (for future real backend)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// API configuration
export const apiConfig = {
  baseUrl: API_BASE_URL,
  timeout: 10000,
  useMock: true, // Set to false when connecting to real backend
};
