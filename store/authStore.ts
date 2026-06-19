import { create } from 'zustand';
import * as SecureStore from '@/utils/storage';
import axios from 'axios';
import { BASE_URL } from '@/config/api';

// Set global client type header for all requests
axios.defaults.headers.common['x-client-type'] = 'mobile';

interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Actions
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Helper to update axios headers globally
const updateAxiosHeader = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Set up interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Remove the stale Authorization header to force axios to use the new global default
            delete originalRequest.headers['Authorization'];
            originalRequest._retry = true;
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await SecureStore.getItemAsync('userRefreshToken');
        if (!storedRefreshToken) throw new Error('No refresh token');

        const refreshInstance = axios.create();
        const { data } = await refreshInstance.post(`${BASE_URL}/auth/refresh-token`, 
          { refreshToken: storedRefreshToken, tokenType: 'customer' },
          { headers: { 'x-client-type': 'mobile' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = data.data;
        
        // Await the full update including SecureStore
        await useAuthStore.getState().setTokens(accessToken, newRefreshToken);
        
        processQueue(null);
        
        delete originalRequest.headers['Authorization'];
        return axios(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError);
        
        if (refreshError.response && refreshError.response.status >= 400 && refreshError.response.status < 500) {
          await useAuthStore.getState().logout();
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setTokens: async (accessToken, refreshToken) => {
    // 1. Update state and axios synchronously to prevent race conditions for new requests
    updateAxiosHeader(accessToken);
    set({ token: accessToken, refreshToken, isAuthenticated: true });

    // 2. Persist to SecureStore in background (or await if you want to be 100% sure)
    await Promise.all([
      SecureStore.setItemAsync('userToken', accessToken),
      SecureStore.setItemAsync('userRefreshToken', refreshToken)
    ]);
  },

  setUser: (user) => {
    if (user) {
      SecureStore.setItemAsync('userProfile', JSON.stringify(user)).catch(() => {});
    } else {
      SecureStore.deleteItemAsync('userProfile').catch(() => {});
    }
    set({ user });
  },

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const refreshToken = await SecureStore.getItemAsync('userRefreshToken');
      const storedUser = await SecureStore.getItemAsync('userProfile');
      
      let parsedUser = null;
      if (storedUser) {
        try {
          parsedUser = JSON.parse(storedUser);
        } catch (e) {}
      }

      if (token && refreshToken) {
        updateAxiosHeader(token);
        set({ 
          token, 
          refreshToken, 
          user: parsedUser, 
          isAuthenticated: true, 
          isInitialized: true 
        });
        
        // Fetch profile in background to avoid blocking the UI
        get().refreshProfile().catch(() => {});
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ isInitialized: true });
    }
  },

  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('userRefreshToken');
      if (refreshToken) {
        // Silently attempt to revoke on backend
        axios.post(`${BASE_URL}/auth/logout`, { refreshToken }, { headers: { 'x-client-type': 'mobile' } }).catch(() => {});
      }
    } catch (e) {}

    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userRefreshToken');
    await SecureStore.deleteItemAsync('userProfile');
    updateAxiosHeader(null);
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const { data } = await axios.get(`${BASE_URL}/users/me`);
      if (data && data.data) {
        set({ user: data.data, isAuthenticated: true });
        await SecureStore.setItemAsync('userProfile', JSON.stringify(data.data));
      }
    } catch (error: any) {
      // Interceptor will handle 401s
      console.error('Profile fetch failed:', error.message);
    }
  },
}));
