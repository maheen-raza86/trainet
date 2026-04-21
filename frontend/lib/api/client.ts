import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token + offline pre-flight check
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // ── Offline pre-flight: reject immediately instead of waiting for timeout ──
      // This prevents the 10-second timeout AND stops any stale-token 401s
      // from being misinterpreted as auth failures while the user is offline.
      if (!navigator.onLine) {
        console.warn('[apiClient] Request blocked — device is offline:', config.url);
        return Promise.reject(
          Object.assign(new Error('You are offline. Please reconnect to continue.'), {
            isOfflineError: true,
          })
        );
      }

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
    // ── Offline pre-flight errors (thrown by request interceptor) ─────────────
    // These are not network errors from the server — they were rejected before
    // the request was even sent. Never treat them as auth failures.
    if (error.isOfflineError) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const baseURL = error.config?.baseURL || '';
    const fullUrl = baseURL + requestUrl;

    // ── No response at all = network error / offline ──────────────────────────
    // IMPORTANT: Do NOT clear auth state or redirect on network errors.
    // The user may simply be offline — their session is still valid.
    if (!error.response) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const msg = isOffline
        ? 'You are offline. Please check your internet connection.'
        : 'Cannot connect to server. Please ensure the backend is running.';
      console.warn(`[apiClient] Network error (offline=${isOffline}) — ${fullUrl}:`, error.message);
      return Promise.reject(new Error(msg));
    }

    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';

    // Log for debugging
    console.error(`[apiClient] ${error.config?.method?.toUpperCase()} ${fullUrl} → ${status}:`, errorMessage);

    // ── 401 Unauthorized ──────────────────────────────────────────────────────
    if (status === 401) {
      // Never auto-redirect on the login endpoint itself — would cause a loop.
      const isLoginRequest = requestUrl.includes('/auth/login');
      if (isLoginRequest) {
        return Promise.reject(new Error(errorMessage));
      }

      // Never redirect if the device is currently offline.
      // The 401 may be a stale cached response or a false positive.
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('[apiClient] 401 received while offline — preserving session, not redirecting');
        return Promise.reject(new Error('You are offline. Please reconnect to continue.'));
      }

      // Only clear session and redirect for genuine JWT/auth failures from the
      // authMiddleware. These are the exact strings the backend sends.
      // Do NOT match on "token" alone — that would catch domain errors like
      // "Invalid or expired QR token" which are NOT auth failures.
      const isGenuineAuthFailure =
        errorMessage === 'Invalid or expired token' ||          // authMiddleware exact string
        errorMessage === 'Token expired' ||                     // errorMiddleware exact string
        errorMessage.toLowerCase() === 'authentication failed' ||
        errorMessage.toLowerCase() === 'no token provided. authorization header must be: bearer <token>' ||
        errorMessage.toLowerCase() === 'token is missing' ||
        errorMessage.toLowerCase().includes('jwt expired') ||
        errorMessage.toLowerCase().includes('jwt malformed');

      if (isGenuineAuthFailure && typeof window !== 'undefined') {
        console.warn('[apiClient] Genuine auth failure — clearing session and redirecting to login. Message:', errorMessage);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      // For all other 401s (permission denied, role mismatch, etc.) just surface the error
      return Promise.reject(new Error(errorMessage));
    }

    // ── 429 Rate limit ────────────────────────────────────────────────────────
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
