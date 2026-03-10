import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Check if this is an authorization error (permission denied) vs authentication error (invalid token)
      const errorMessage = error.response?.data?.message || '';
      
      // Don't logout for authorization/permission errors
      const isPermissionError = errorMessage.toLowerCase().includes('not authorized') ||
                               errorMessage.toLowerCase().includes('permission') ||
                               errorMessage.toLowerCase().includes('forbidden');
      
      // Only logout for actual authentication errors
      const isAuthError = errorMessage.toLowerCase().includes('invalid') ||
                         errorMessage.toLowerCase().includes('expired') ||
                         errorMessage.toLowerCase().includes('token') ||
                         errorMessage.toLowerCase().includes('authentication failed');
      
      // If it's clearly a permission error, don't logout
      // If it's clearly an auth error, logout
      // If unclear, check if we have a token - if yes, don't logout (assume permission error)
      if (typeof window !== 'undefined') {
        const hasToken = localStorage.getItem('token');
        
        if (isAuthError || (!isPermissionError && !hasToken)) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
