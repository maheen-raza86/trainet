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
    
    // If the data is FormData, remove the Content-Type header to let the browser set it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const baseURL = error.config?.baseURL || '';
    const fullUrl = baseURL + requestUrl;

    // No response at all = backend is unreachable
    if (!error.response) {
      console.error(`[apiClient] Network error — no response from ${fullUrl}`, error.message);
      return Promise.reject(
        new Error('Cannot connect to server. Please ensure the backend is running on port 5000.')
      );
    }

    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';

    // Log for debugging
    console.error(`[apiClient] ${error.config?.method?.toUpperCase()} ${fullUrl} → ${status}:`, errorMessage);

    if (status === 401) {
      // NEVER auto-redirect when the failing request IS the login endpoint itself.
      // That would cause a redirect loop and swallow the real error message.
      const isLoginRequest = requestUrl.includes('/auth/login');
      if (isLoginRequest) {
        return Promise.reject(new Error(errorMessage));
      }

      const isPermissionError = errorMessage.toLowerCase().includes('not authorized') ||
                               errorMessage.toLowerCase().includes('permission') ||
                               errorMessage.toLowerCase().includes('forbidden');

      const isAuthError = errorMessage.toLowerCase().includes('invalid') ||
                         errorMessage.toLowerCase().includes('expired') ||
                         errorMessage.toLowerCase().includes('token') ||
                         errorMessage.toLowerCase().includes('authentication failed');

      if (typeof window !== 'undefined') {
        const hasToken = localStorage.getItem('token');
        if (isAuthError || (!isPermissionError && !hasToken)) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    // Surface rate-limit errors clearly
    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      const msg = retryAfter
        ? `Too many attempts. Please wait ${retryAfter} seconds.`
        : errorMessage;
      return Promise.reject(new Error(msg));
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
