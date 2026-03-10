import apiClient from './client';

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'trainer' | 'alumni' | 'recruiter';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: User;
  };
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export const authAPI = {
  signup: async (data: SignupData): Promise<SignupResponse> => {
    return apiClient.post('/auth/signup', data);
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    return apiClient.post('/auth/login', data);
  },

  verifyEmail: async (token: string): Promise<any> => {
    return apiClient.post('/auth/verify-email', { token });
  },

  getCurrentUser: async (): Promise<any> => {
    return apiClient.get('/users/me');
  },

  updateProfile: async (data: any): Promise<any> => {
    return apiClient.put('/users/profile', data);
  },
};
